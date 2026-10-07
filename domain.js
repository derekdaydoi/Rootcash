(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Domain = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const pad = n => String(n).padStart(2, '0');
  const monthOf = iso => String(iso).slice(0, 7);
  const daysIn = key => { const [y, m] = key.split('-').map(Number); return new Date(y, m, 0).getDate(); };
  const dateIn = (key, day) => `${key}-${pad(Math.min(Math.max(day, 1), daysIn(key)))}`;
  const shiftMonth = (key, delta) => {
    const [y, m] = key.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  };
  const sum = (rows, type) => rows.filter(r => r.type === type).reduce((t, r) => t + Number(r.amount || 0), 0);
  const roundUp = (value, step = 500000) => value <= 0 ? 0 : Math.ceil(value / step) * step;

  // Entry: { id, type: 'in'|'out', label, amount, date, repeat, doneIn: ['YYYY-MM'] }
  // A repeating entry occurs every month from its start month, on the same day.
  function occurrences(entries, key) {
    const rows = [];
    (entries || []).forEach(e => {
      const start = monthOf(e.date);
      if (e.repeat ? start > key : start !== key) return;
      rows.push({
        ...e,
        date: e.repeat ? dateIn(key, Number(String(e.date).slice(8, 10))) : e.date,
        done: (e.doneIn || []).includes(key),
      });
    });
    return rows.sort((a, b) =>
      a.date.localeCompare(b.date) ||
      (a.type === b.type ? 0 : a.type === 'out' ? -1 : 1) ||
      String(a.label).localeCompare(String(b.label), 'vi'));
  }

  // Unset months inherit the most recent earlier living amount.
  function livingFor(living, key) {
    if (living && key in living) return Number(living[key]) || 0;
    const earlier = Object.keys(living || {}).filter(k => k < key).sort();
    return earlier.length ? Number(living[earlier[earlier.length - 1]]) || 0 : 0;
  }

  // Month cashflow. Living spend is spread evenly per day. Within a day, outflows
  // are applied before inflows, so the low point is the conservative one.
  function monthPlan(entries, living, key) {
    const rows = occurrences(entries, key);
    const n = daysIn(key);
    const inflow = sum(rows, 'in');
    const outflow = sum(rows, 'out');
    const net = inflow - outflow;
    const livingAmount = livingFor(living, key);
    const drip = livingAmount / n;
    let balance = 0;
    let low = { day: 1, balance: Infinity };
    const points = [];
    for (let day = 1; day <= n; day++) {
      const date = dateIn(key, day);
      const todays = rows.filter(r => r.date === date);
      balance -= sum(todays, 'out') + drip;
      const trough = balance;
      if (trough < low.balance) low = { day, balance: trough };
      balance += sum(todays, 'in');
      points.push({ day, balance, trough });
    }
    return {
      key, rows, days: n, points, low,
      inflow, outflow, net,
      living: livingAmount,
      rest: net - livingAmount,
      buffer: roundUp(-low.balance),
      done: rows.filter(r => r.done).length,
    };
  }

  function netWorth(accounts) {
    const total = kind => (accounts || []).filter(a => a.kind === kind).reduce((t, a) => t + Number(a.balance || 0), 0);
    const assets = total('asset');
    const debts = total('debt');
    const liquid = (accounts || []).filter(a => a.kind === 'asset' && (a.type === 'cash' || a.type === 'bank'))
      .reduce((t, a) => t + Number(a.balance || 0), 0);
    return { assets, debts, net: assets - debts, liquid };
  }

  // Converts data saved by the first Rootcash release (key "rootcash:v1").
  function migrateV1(raw) {
    const state = { entries: [], living: {}, accounts: [], history: {} };
    if (!raw || typeof raw !== 'object') return state;
    const valid = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ''));
    const add = (item, type, done) => {
      if (!item || !valid(item.date)) return;
      state.entries.push({
        id: item.id || `m_${state.entries.length}`,
        type, label: String(item.label || ''), amount: Number(item.amount) || 0,
        date: item.date, repeat: false, doneIn: done ? [monthOf(item.date)] : [],
      });
    };
    (raw.transactions || []).forEach(t => add(t, t?.type === 'income' ? 'in' : 'out', true));
    (raw.plan?.incomes || []).forEach(t => add(t, 'in', false));
    (raw.plan?.expenses || []).forEach(t => add(t, 'out', false));
    const living = Number(raw.plan?.livingBudget);
    if (raw.plan?.month && living > 0) state.living[raw.plan.month] = living;
    return state;
  }

  return { monthOf, daysIn, dateIn, shiftMonth, roundUp, occurrences, livingFor, monthPlan, netWorth, migrateV1 };
});
