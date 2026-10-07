const assert = require('assert');
const D = require('../domain.js');

const entries = [
  { id: '1', type: 'in', label: 'Lương', amount: 30000000, date: '2026-10-01', repeat: false, doneIn: [] },
  { id: '2', type: 'out', label: 'Tiền nhà', amount: 6000000, date: '2026-10-01', repeat: true, doneIn: [] },
  { id: '3', type: 'out', label: 'Trả góp', amount: 20000000, date: '2026-10-12', repeat: false, doneIn: ['2026-10'] },
];

// recurring entries: start month onward, clamped to month length, never before start
assert.strictEqual(D.occurrences(entries, '2026-09').length, 0);
assert.strictEqual(D.occurrences(entries, '2026-11').length, 1);
const clamp = D.occurrences([{ id: 'x', type: 'out', amount: 1, date: '2026-01-31', repeat: true }], '2026-02');
assert.strictEqual(clamp[0].date, '2026-02-28');

// same day: outflow sorts before inflow
assert.deepStrictEqual(D.occurrences(entries, '2026-10').slice(0, 2).map(r => r.id), ['2', '1']);

// surplus, rest after the living block, buffer from the deepest dip
const p = D.monthPlan(entries, { '2026-10': 3100000 }, '2026-10');
assert.strictEqual(p.inflow, 30000000);
assert.strictEqual(p.outflow, 26000000);
assert.strictEqual(p.net, 4000000);
assert.strictEqual(p.rest, 900000);
assert.strictEqual(p.done, 1);
assert.strictEqual(p.low.day, 1, 'day 1 outflow is applied before the salary');
assert.strictEqual(p.buffer, 6500000);
assert.strictEqual(D.roundUp(1), 500000);
assert.strictEqual(D.roundUp(0), 0);

// deficit month
const deficit = D.monthPlan([{ id: 'd', type: 'out', amount: 5000000, date: '2026-10-05', repeat: false }], {}, '2026-10');
assert.strictEqual(deficit.net, -5000000);
assert.strictEqual(deficit.buffer, 5000000);

// living inherits from the latest earlier month
assert.strictEqual(D.livingFor({ '2026-08': 7, '2026-10': 9 }, '2026-09'), 7);
assert.strictEqual(D.livingFor({ '2026-08': 7, '2026-10': 9 }, '2026-12'), 9);
assert.strictEqual(D.livingFor({}, '2026-12'), 0);
assert.strictEqual(D.shiftMonth('2026-12', 1), '2027-01');
assert.strictEqual(D.shiftMonth('2026-01', -1), '2025-12');

// net worth + liquidity
const w = D.netWorth([
  { kind: 'asset', type: 'cash', balance: 10 }, { kind: 'asset', type: 'invest', balance: 50 }, { kind: 'debt', type: 'debt', balance: 20 },
]);
assert.deepStrictEqual(w, { assets: 60, debts: 20, net: 40, liquid: 10 });

// migration from the first release
const m = D.migrateV1({
  transactions: [{ id: 't', type: 'income', label: 'Lương', amount: 5, date: '2026-10-01' }],
  plan: { month: '2026-11', incomes: [], expenses: [{ id: 'p', label: 'Nhà', amount: 3, date: '2026-11-03' }], livingBudget: 8 },
});
assert.strictEqual(m.entries.length, 2);
assert.deepStrictEqual(m.entries[0].doneIn, ['2026-10']);
assert.deepStrictEqual(m.entries[1].doneIn, []);
assert.strictEqual(m.living['2026-11'], 8);

// plan = money set aside: not an expense until done, stays in the reserved fund
const withPlan = [
  { id: 'i', type: 'in', amount: 15000000, date: '2026-10-01', repeat: false, doneIn: [] },
  { id: 'p', type: 'plan', label: 'Đi chơi', amount: 6000000, date: '2026-10-07', repeat: false, doneIn: [] },
];
const pl = D.monthPlan(withPlan, { '2026-10': 5000000 }, '2026-10');
assert.strictEqual(pl.outflow, 0);
assert.strictEqual(pl.net, 15000000);
assert.strictEqual(pl.reserve, 6000000);
assert.strictEqual(pl.rest, 4000000);
assert.strictEqual(pl.buffer, 500000, 'only living drip dips below zero on day 1');
assert.strictEqual(D.reservedFund(withPlan, '2026-10').total, 6000000);
withPlan[1].doneIn = ['2026-10'];
const spent = D.monthPlan(withPlan, { '2026-10': 5000000 }, '2026-10');
assert.strictEqual(spent.outflow, 6000000);
assert.strictEqual(spent.reserve, 0);
assert.strictEqual(spent.rest, 4000000);
assert.strictEqual(D.reservedFund(withPlan, '2026-10').total, 0);
const monthly = D.reservedFund([{ id: 'm', type: 'plan', label: 'Tích', amount: 2000000, date: '2026-08-05', repeat: true, doneIn: ['2026-09'] }], '2026-10');
assert.strictEqual(monthly.total, 4000000);
assert.strictEqual(D.reservedFund([{ id: 'f', type: 'plan', amount: 1, date: '2026-12-01', repeat: false, doneIn: [] }], '2026-10').total, 0);

console.log('Rootcash domain tests: PASS');
