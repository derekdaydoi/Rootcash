(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Domain = api;
})(typeof self !== 'undefined' ? self : this, function () {
  // ---------- dates ----------
  const pad = n => String(n).padStart(2, '0');
  const monthOf = iso => String(iso).slice(0, 7);
  const dayOf = iso => Number(String(iso).slice(8, 10));
  const daysIn = key => { const [y, m] = key.split('-').map(Number); return new Date(y, m, 0).getDate(); };
  const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const shiftMonth = (key, delta) => {
    const [y, m] = key.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  };
  const monthsBetween = (a, b) => {
    const [ya, ma] = a.split('-').map(Number), [yb, mb] = b.split('-').map(Number);
    return (yb - ya) * 12 + (mb - ma);
  };
  const weekday = (key, day) => { const [y, m] = key.split('-').map(Number); return new Date(y, m - 1, day).getDay(); };

  // ---------- the frame ----------
  // Items are the fixed skeleton of every month. Everything counts as spent:
  //   in    — income, a day each month
  //   debt  — a repayment schedule, a day each month
  //   fixed — a fixed cost, a day each month or spread evenly (day 0)
  //   once  — one date, money in (sign 1) or out (sign -1)
  const KINDS = ['in', 'debt', 'fixed', 'once'];

  const activeIn = (item, key) => {
    if (item.kind === 'once') return monthOf(item.date) === key;
    if (item.from && key < item.from) return false;
    if (item.until && key > item.until) return false;
    return true;
  };

  // Signed money of every item landing in a month: + comes in, − goes out.
  function rowsFor(items, key) {
    const last = daysIn(key);
    return (items || []).filter(i => activeIn(i, key)).map(i => {
      const amount = Math.round(Number(i.amount) || 0);
      const sign = i.kind === 'in' ? 1 : i.kind === 'once' ? (i.sign === 1 ? 1 : -1) : -1;
      const day = i.kind === 'once' ? dayOf(i.date) : Number(i.day) || 0;
      return { id: i.id, kind: i.kind, label: i.label, value: sign * amount, day: day ? Math.min(day, last) : 0 };
    });
  }

  // Unset months inherit the most recent earlier value.
  function carried(map, key) {
    if (map && key in map) return Number(map[key]) || 0;
    const earlier = Object.keys(map || {}).filter(k => k < key).sort();
    return earlier.length ? Number(map[earlier[earlier.length - 1]]) || 0 : 0;
  }

  // Free float of a month from a given opening balance.
  function summarize(state, key, opening) {
    const rows = rowsFor(state.items, key);
    const total = kind => rows.filter(r => r.kind === kind).reduce((t, r) => t + r.value, 0);
    const count = kind => rows.filter(r => r.kind === kind).length;
    const living = carried(state.living, key);
    const once = total('once');
    const s = {
      key, rows, opening, living,
      inflow: total('in'), debt: -total('debt'), fixed: -total('fixed'), once,
      counts: { in: count('in'), debt: count('debt'), fixed: count('fixed'), once: count('once') },
    };
    s.float = opening + s.inflow - s.debt - s.fixed + once - living;
    return s;
  }

  // Each month stands alone: its opening is only what you typed for it.
  function month(state, key) {
    const openings = state.openings || {};
    const typed = key in openings;
    return { ...summarize(state, key, typed ? Number(openings[key]) || 0 : 0), openingTyped: typed };
  }

  // End-of-day balance for every day of a month. Living and spread fixed costs
  // leave a little every day; dated items move money on their day.
  function days(state, key) {
    const m = month(state, key);
    const n = daysIn(key);
    const spreadTotal = m.living + m.rows.filter(r => r.day === 0).reduce((t, r) => t - r.value, 0);
    const spread = spreadTotal / n;
    const out = [];
    let bal = m.opening;
    for (let d = 1; d <= n; d++) {
      const rows = m.rows.filter(r => r.day === d);
      const start = bal;
      bal = bal + rows.reduce((t, r) => t + r.value, 0) - spread;
      out.push({ day: d, start, end: bal, rows, spread, weekday: weekday(key, d) });
    }
    return { month: m, days: out, spread };
  }

  const lowest = list => list.reduce((a, p) => p.end < a.end ? p : a, list[0]);

  // ---------- storage shape ----------
  const validMonth = v => /^\d{4}-\d{2}$/.test(String(v || ''));
  const validDate = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));
  const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const numMap = map => {
    const out = {};
    Object.keys(map || {}).forEach(k => { if (validMonth(k)) out[k] = Math.round(Number(map[k]) || 0); });
    return out;
  };

  function cleanItem(i) {
    if (!i || !KINDS.includes(i.kind)) return null;
    const item = { id: i.id || uid(), kind: i.kind, label: String(i.label || ''), amount: Math.max(0, Math.round(Number(i.amount) || 0)) };
    if (i.kind === 'once') {
      if (!validDate(i.date)) return null;
      item.date = i.date;
      item.sign = i.sign === 1 ? 1 : -1;
    } else {
      item.day = Math.max(0, Math.min(31, Math.round(Number(i.day) || 0)));
      if (i.kind !== 'fixed' && !item.day) item.day = 1;
      item.from = validMonth(i.from) ? i.from : null;
      item.until = validMonth(i.until) ? i.until : null;
    }
    return item;
  }

  // Reads this shape, or converts the earlier Rootcash data (entries + accounts).
  // `today` is an ISO date, used only to place a converted opening balance.
  function migrate(raw, today) {
    const state = { version: 2, active: null, openings: {}, living: {}, items: [], backupAt: null };
    if (!raw || typeof raw !== 'object') return state;

    if (raw.version === 2) {
      state.openings = numMap(raw.openings);
      state.living = numMap(raw.living);
      state.items = (Array.isArray(raw.items) ? raw.items : []).map(cleanItem).filter(Boolean);
      state.backupAt = validDate(String(raw.backupAt || '').slice(0, 10)) ? raw.backupAt : null;
      state.active = validMonth(raw.active) ? raw.active : null;
      return state;
    }

    const key = monthOf(today || isoOf(new Date()));
    if (Array.isArray(raw.entries)) {
      raw.entries.forEach(e => {
        if (!e || !validDate(e.date)) return;
        const label = String(e.label || '');
        if (!e.repeat) {
          state.items.push(cleanItem({ kind: 'once', label, amount: e.amount, date: e.date, sign: e.type === 'in' ? 1 : -1 }));
          return;
        }
        let amount = Number(e.amount) || 0;
        if (e.loan) {
          const left = Math.max(0, Number(e.loan.principal || 0) - Math.max(0, monthsBetween(monthOf(e.date), key)) * Number(e.loan.amortize || 0));
          amount = left * Number(e.loan.rate || 0) / 1200 + (e.loan.withPrincipal ? Math.min(Number(e.loan.amortize || 0), left) : 0);
        }
        const kind = e.type === 'in' ? 'in'
          : (e.loan || /góp|vay|nợ|thẻ|lãi/i.test(label)) ? 'debt' : 'fixed';
        state.items.push(cleanItem({
          kind, label, amount, day: dayOf(e.date), from: monthOf(e.date),
          until: validMonth(e.until) ? e.until : null,
        }));
      });
      state.items = state.items.filter(Boolean);
    }
    if (raw.living && typeof raw.living === 'object') state.living = numMap(raw.living);
    if (Array.isArray(raw.accounts)) {
      const liquid = raw.accounts
        .filter(a => a && a.kind === 'asset' && ['cash', 'bank'].includes(a.type))
        .reduce((t, a) => t + (Number(a.balance) || 0), 0);
      if (liquid) state.openings[key] = Math.round(liquid);
    }
    return state;
  }

  return {
    pad, monthOf, dayOf, daysIn, isoOf, shiftMonth, monthsBetween, weekday,
    KINDS, activeIn, rowsFor, carried, summarize, month, days, lowest,
    cleanItem, migrate, uid,
  };
});
