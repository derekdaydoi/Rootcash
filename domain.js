(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Domain = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const pad = n => String(n).padStart(2, '0');
  const monthOf = iso => String(iso).slice(0, 7);
  const dayOf = iso => Number(String(iso).slice(8, 10));
  const daysIn = key => { const [y, m] = key.split('-').map(Number); return new Date(y, m, 0).getDate(); };
  const dateIn = (key, day) => `${key}-${pad(Math.min(Math.max(day, 1), daysIn(key)))}`;
  const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dateOf = iso => new Date(`${iso}T00:00:00`);
  const shiftMonth = (key, delta) => {
    const [y, m] = key.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  };
  const monthsBetween = (a, b) => {
    const [ya, ma] = a.split('-').map(Number), [yb, mb] = b.split('-').map(Number);
    return (yb - ya) * 12 + (mb - ma);
  };
  const roundUp = (value, step = 500000) => value <= 0 ? 0 : Math.ceil(value / step) * step;

  // An entry is 'in', 'out', or 'plan'. Plan money is set aside: it stays an asset
  // and is not an expense until that month is marked done.
  const kindOf = row => row.type === 'plan' ? (row.done ? 'out' : 'plan') : row.type;
  const sum = (rows, kind) => rows.filter(r => kindOf(r) === kind).reduce((t, r) => t + Number(r.amount || 0), 0);

  // Principal still owed on a loan-backed entry at the start of a month.
  function principalAt(entry, key) {
    if (!entry.loan) return 0;
    const k = Math.max(0, monthsBetween(monthOf(entry.date), key));
    return Math.max(0, Number(entry.loan.principal || 0) - k * Number(entry.loan.amortize || 0));
  }

  // What a repeating entry costs in a given month:
  //   an override wins, then a loan schedule (declining balance), then the flat amount.
  function amountFor(entry, key) {
    const over = entry.override && entry.override[key];
    if (over != null && over !== '') return Math.round(Number(over)) || 0;
    if (entry.loan) {
      const left = principalAt(entry, key);
      const interest = left * Number(entry.loan.rate || 0) / 1200;
      const due = entry.loan.withPrincipal ? Math.min(Number(entry.loan.amortize || 0), left) : 0;
      return Math.round(interest + due);
    }
    return Math.round(Number(entry.amount || 0)) || 0;
  }


  // Every entry that lands in a month, with amount and done flag resolved.
  function occurrences(entries, key) {
    const rows = [];
    (entries || []).forEach(e => {
      const start = monthOf(e.date);
      if (e.repeat ? start > key : start !== key) return;
      if (e.repeat && e.until && key > e.until) return; // last instalment has passed
      if ((e.skip || []).includes(key)) return;
      const amount = amountFor(e, key);
      if (e.repeat && e.loan && Number(e.loan.amortize) > 0 && principalAt(e, key) <= 0) return; // fully repaid
      rows.push({
        id: e.id, type: e.type, label: e.label, repeat: !!e.repeat, loan: e.loan || null, until: e.until || null,
        amount, month: key,
        date: e.repeat ? dateIn(key, dayOf(e.date)) : e.date,
        done: (e.doneIn || []).includes(key),
      });
    });
    return rows.sort((a, b) =>
      a.date.localeCompare(b.date) ||
      (kindOf(a) === kindOf(b) ? 0 : kindOf(a) === 'out' ? -1 : 1) ||
      String(a.label).localeCompare(String(b.label), 'vi'));
  }

  const dayRows = (entries, iso) => occurrences(entries, monthOf(iso)).filter(r => r.date === iso);

  // Unset months inherit the most recent earlier value.
  function carried(map, key) {
    if (map && key in map) return map[key];
    const earlier = Object.keys(map || {}).filter(k => k < key).sort();
    return earlier.length ? map[earlier[earlier.length - 1]] : undefined;
  }
  const livingFor = (living, key) => Number(carried(living, key)) || 0;
  const allocationsFor = (allocations, key) => ({ ...(carried(allocations, key) || {}) });

  // Daily running balance from a real opening balance. Within a day, outflows are
  // applied before inflows, so the low point stays conservative.
  function series(entries, startIso, days, opening, living) {
    const out = [];
    const cache = {};
    let bal = Number(opening) || 0;
    const start = dateOf(startIso);
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      const iso = isoOf(d), key = monthOf(iso);
      if (!cache[key]) cache[key] = occurrences(entries, key);
      const rows = cache[key].filter(r => r.date === iso);
      const inflow = sum(rows, 'in');
      const outflow = sum(rows, 'out') + (living ? livingFor(living, key) / daysIn(key) : 0);
      bal -= outflow;
      const trough = bal;
      bal += inflow;
      out.push({ iso, date: d, day: d.getDate(), month: key, bal, trough, in: inflow, out: outflow, rows });
    }
    return out;
  }

  const lowestOf = points => points.reduce((a, p) => p.trough < a.trough ? p : a, points[0]);

  // Lowest balance of each calendar month in a series, worst first.
  function riskDays(points, limit = 3) {
    const groups = {};
    points.forEach(p => { (groups[p.month] = groups[p.month] || []).push(p); });
    return Object.values(groups).map(lowestOf).sort((a, b) => a.trough - b.trough).slice(0, limit);
  }

  function monthSummary(entries, living, key) {
    const rows = occurrences(entries, key);
    const inflow = sum(rows, 'in'), outflow = sum(rows, 'out'), reserve = sum(rows, 'plan');
    const amount = livingFor(living, key);
    return {
      key, rows, inflow, outflow, reserve,
      net: inflow - outflow,
      living: amount,
      rest: inflow - outflow - reserve - amount,
      done: rows.filter(r => r.done).length,
    };
  }

  // Plan money set aside up to and including a month, not yet spent.
  function reservedFund(entries, key) {
    const items = [];
    (entries || []).filter(e => e.type === 'plan').forEach(e => {
      const start = monthOf(e.date);
      if (start > key) return;
      const months = [];
      for (let m = start; m <= key && months.length < 600; m = shiftMonth(m, 1)) {
        if (e.until && m > e.until) break;
        if (!(e.skip || []).includes(m)) months.push(m);
        if (!e.repeat) break;
      }
      const pending = months.filter(m => !(e.doneIn || []).includes(m));
      if (!pending.length) return;
      const amount = pending.reduce((t, m) => t + amountFor(e, m), 0);
      items.push({ id: e.id, label: e.label, month: pending[pending.length - 1], count: pending.length, amount });
    });
    return { items, total: items.reduce((t, i) => t + i.amount, 0) };
  }

  const LIQUID = ['cash', 'bank'];
  function netWorth(accounts) {
    const total = test => (accounts || []).filter(test).reduce((t, a) => t + Number(a.balance || 0), 0);
    const assets = total(a => a.kind === 'asset');
    const debts = total(a => a.kind === 'debt');
    return { assets, debts, net: assets - debts, liquid: total(a => a.kind === 'asset' && LIQUID.includes(a.type)) };
  }

  // Accepts the first release (rootcash:v1) and every later shape of this one.
  function migrate(raw) {
    const state = { entries: [], living: {}, buckets: [], allocations: {}, accounts: [], history: {} };
    if (!raw || typeof raw !== 'object') return state;
    const valid = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ''));

    if (Array.isArray(raw.entries)) {
      state.entries = raw.entries.filter(e => e && valid(e.date)).map(e => ({
        id: e.id || `e_${Math.random().toString(36).slice(2, 9)}`,
        type: ['in', 'out', 'plan'].includes(e.type) ? e.type : 'out',
        label: String(e.label || ''),
        amount: Math.round(Number(e.amount)) || 0,
        date: e.date,
        repeat: !!e.repeat,
        until: /^\d{4}-\d{2}$/.test(String(e.until || '')) ? e.until : null,
        doneIn: Array.isArray(e.doneIn) ? e.doneIn.slice() : [],
        skip: Array.isArray(e.skip) ? e.skip.slice() : [],
        override: e.override && typeof e.override === 'object' ? { ...e.override } : {},
        loan: e.loan && typeof e.loan === 'object' ? {
          principal: Number(e.loan.principal) || 0,
          rate: Number(e.loan.rate) || 0,
          amortize: Number(e.loan.amortize) || 0,
          withPrincipal: !!e.loan.withPrincipal,
        } : null,
      }));
      state.living = raw.living && typeof raw.living === 'object' ? { ...raw.living } : {};
      state.buckets = Array.isArray(raw.buckets) ? raw.buckets.slice() : [];
      state.allocations = raw.allocations && typeof raw.allocations === 'object' ? { ...raw.allocations } : {};
      state.accounts = Array.isArray(raw.accounts) ? raw.accounts.slice() : [];
      state.history = raw.history && typeof raw.history === 'object' ? { ...raw.history } : {};
      return state;
    }

    // first release: transactions plus a single next-month plan
    const add = (item, type, done) => {
      if (!item || !valid(item.date)) return;
      state.entries.push({
        id: item.id || `m_${state.entries.length}`,
        type, label: String(item.label || ''), amount: Math.round(Number(item.amount)) || 0,
        date: item.date, repeat: false, until: null, doneIn: done ? [monthOf(item.date)] : [],
        skip: [], override: {}, loan: null,
      });
    };
    (raw.transactions || []).forEach(t => add(t, t && t.type === 'income' ? 'in' : 'out', true));
    ((raw.plan && raw.plan.incomes) || []).forEach(t => add(t, 'in', false));
    ((raw.plan && raw.plan.expenses) || []).forEach(t => add(t, 'out', false));
    const living = Number(raw.plan && raw.plan.livingBudget);
    if (raw.plan && raw.plan.month && living > 0) state.living[raw.plan.month] = living;
    return state;
  }

  return {
    pad, monthOf, dayOf, daysIn, dateIn, isoOf, dateOf, shiftMonth, monthsBetween, roundUp,
    kindOf, sum, amountFor, principalAt, occurrences, dayRows,
    livingFor, allocationsFor, series, lowestOf, riskDays,
    monthSummary, reservedFund, netWorth, migrate,
  };
});
