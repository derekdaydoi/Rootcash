const assert = require('assert');
const D = require('../domain.js');

// ---- dates ----
assert.strictEqual(D.shiftMonth('2026-12', 1), '2027-01');
assert.strictEqual(D.monthsBetween('2026-10', '2027-01'), 3);
assert.strictEqual(D.daysIn('2026-02'), 28);
assert.strictEqual(D.weekday('2026-11', 1), 0, '1/11/2026 is a Sunday');

// ---- the example frame from the mockup ----
const state = D.migrate({
  version: 2,
  openings: { '2026-11': 5000000 },
  living: { '2026-11': 8000000 },
  items: [
    { id: 'luong', kind: 'in', label: 'Lương', amount: 32000000, day: 5 },
    { id: 'nha', kind: 'debt', label: 'Trả góp nhà', amount: 8200000, day: 5 },
    { id: 'the', kind: 'debt', label: 'Thẻ tín dụng', amount: 2300000, day: 20, until: '2027-06' },
    { id: 'cua', kind: 'fixed', label: 'Nhà cửa', amount: 1200000, day: 1 },
    { id: 'hoc', kind: 'fixed', label: 'Học phí', amount: 3500000, day: 5 },
    { id: 'dien', kind: 'fixed', label: 'Điện, nước', amount: 1500000, day: 12 },
    { id: 'xang', kind: 'fixed', label: 'Xăng xe', amount: 1000000, day: 0 },
    { id: 'bh', kind: 'once', label: 'Bảo hiểm xe', amount: 2000000, date: '2027-01-15', sign: -1 },
  ],
});

const nov = D.month(state, '2026-11');
assert.strictEqual(nov.opening, 5000000);
assert.ok(nov.openingTyped);
assert.strictEqual(nov.inflow, 32000000);
assert.strictEqual(nov.debt, 10500000);
assert.strictEqual(nov.fixed, 7200000);
assert.strictEqual(nov.living, 8000000);
assert.strictEqual(nov.float, 11300000, 'free float = opening + in − debt − fixed − living');

// next month opens with this month's free float, living carries forward
const dec = D.month(state, '2026-12');
assert.strictEqual(dec.opening, 11300000);
assert.ok(!dec.openingTyped);
assert.strictEqual(dec.living, 8000000);
assert.strictEqual(dec.float, 17600000);

// a typed opening overrides the rolled one
const typed = { ...state, openings: { ...state.openings, '2026-12': 9000000 } };
assert.strictEqual(D.month(typed, '2026-12').float, 15300000);

// one-off items land only in their month
assert.strictEqual(D.month(state, '2027-01').once, -2000000);
assert.strictEqual(D.month(state, '2027-02').once, 0);

// a debt ends after its last month
assert.strictEqual(D.month(state, '2027-06').counts.debt, 2);
assert.strictEqual(D.month(state, '2027-07').counts.debt, 1);

// no opening typed yet: starts from zero
assert.strictEqual(D.month(state, '2026-10').opening, 0);
assert.ok(D.month(state, '2026-10').openingNone);

// ---- daily series ----
const s = D.days(state, '2026-11');
assert.strictEqual(s.days.length, 30);
assert.strictEqual(Math.round(s.spread), 300000, 'living + spread fixed costs per day');
assert.strictEqual(Math.round(s.days[29].end), 11300000, 'last day ends at the free float');
assert.strictEqual(s.days[4].rows.length, 3, 'three items on the 5th');
assert.strictEqual(Math.round(s.days[3].end), 2600000);
assert.strictEqual(Math.round(s.days[4].end), 22600000);
assert.strictEqual(D.lowest(s.days).day, 4);

// day 31 lands on the last day of a short month
const late = D.migrate({ version: 2, items: [{ kind: 'fixed', label: 'x', amount: 1, day: 31 }] });
assert.strictEqual(D.rowsFor(late.items, '2026-02')[0].day, 28);

// ---- converting the earlier Rootcash data ----
const old = D.migrate({
  entries: [
    { id: 'a', type: 'in', label: 'Lương', amount: 20000000, date: '2026-10-09', repeat: true },
    { id: 'b', type: 'out', label: 'Trả góp xe', amount: 3000000, date: '2026-10-15', repeat: true, until: '2027-03' },
    { id: 'c', type: 'out', label: 'Internet', amount: 300000, date: '2026-10-02', repeat: true },
    { id: 'd', type: 'out', label: 'Sửa xe', amount: 800000, date: '2026-11-20' },
    { id: 'e', type: 'out', label: 'Vay', amount: 0, date: '2026-01-05', repeat: true,
      loan: { principal: 12000000, rate: 12, amortize: 1000000, withPrincipal: true } },
  ],
  living: { '2026-10': 7000000 },
  accounts: [
    { kind: 'asset', type: 'bank', balance: 4000000 },
    { kind: 'asset', type: 'cash', balance: 500000 },
    { kind: 'asset', type: 'invest', balance: 99000000 },
    { kind: 'debt', type: 'debt', balance: 1000000 },
  ],
}, '2026-11-02');
assert.deepStrictEqual(old.items.map(i => i.kind), ['in', 'debt', 'fixed', 'once', 'debt']);
assert.strictEqual(old.items[0].day, 9);
assert.strictEqual(old.items[1].until, '2027-03');
assert.strictEqual(old.items[3].sign, -1);
assert.strictEqual(old.items[4].amount, 1020000, 'loan billed at this month: 2tr left × 1% + 1tr principal');
assert.strictEqual(old.openings['2026-11'], 4500000, 'cash + bank becomes this month opening');
assert.strictEqual(old.living['2026-10'], 7000000);

// junk is dropped
assert.strictEqual(D.migrate({ version: 2, items: [{ kind: 'nope' }, { kind: 'once', date: 'x' }] }).items.length, 0);
assert.deepStrictEqual(D.migrate(null).items, []);

console.log('domain tests passed');
