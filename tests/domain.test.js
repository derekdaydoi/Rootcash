const assert = require('assert');
const D = require('../domain.js');

const entry = (o) => ({ repeat: false, doneIn: [], skip: [], override: {}, loan: null, ...o });

// ---- dates ----
assert.strictEqual(D.dateIn('2026-02', 31), '2026-02-28', 'day is clamped to the month length');
assert.strictEqual(D.shiftMonth('2026-12', 1), '2027-01');
assert.strictEqual(D.shiftMonth('2026-01', -1), '2025-12');
assert.strictEqual(D.monthsBetween('2026-10', '2027-01'), 3);
assert.strictEqual(D.monthsBetween('2026-10', '2026-10'), 0);
assert.strictEqual(D.roundUp(1), 500000);
assert.strictEqual(D.roundUp(0), 0);

// ---- recurring entries ----
const base = [
  entry({ id: 'i', type: 'in', label: 'Lương', amount: 17948375, date: '2026-10-09', repeat: true }),
  entry({ id: 'o', type: 'out', label: 'Nhà', amount: 1200000, date: '2026-10-01', repeat: true }),
  entry({ id: 'x', type: 'out', label: 'Một lần', amount: 500000, date: '2026-10-20' }),
];
assert.strictEqual(D.occurrences(base, '2026-09').length, 0, 'nothing before the start month');
assert.strictEqual(D.occurrences(base, '2026-10').length, 3);
assert.strictEqual(D.occurrences(base, '2026-11').length, 2, 'only repeating entries carry forward');
assert.deepStrictEqual(D.occurrences(base, '2026-10').map(r => r.id), ['o', 'i', 'x'], 'same day: outflow first');

// skip a single month
const skipped = [entry({ id: 's', type: 'out', amount: 100, date: '2026-10-01', repeat: true, skip: ['2026-11'] })];
assert.strictEqual(D.occurrences(skipped, '2026-11').length, 0);
assert.strictEqual(D.occurrences(skipped, '2026-12').length, 1);

// override one month only
const over = [entry({ id: 'v', type: 'out', amount: 100, date: '2026-10-01', repeat: true, override: { '2026-11': 250 } })];
assert.strictEqual(D.occurrences(over, '2026-10')[0].amount, 100);
assert.strictEqual(D.occurrences(over, '2026-11')[0].amount, 250);
assert.strictEqual(D.occurrences(over, '2026-12')[0].amount, 100, 'an override does not leak into later months');

// ---- loan with a declining balance ----
const loan = entry({ id: 'l', type: 'out', label: 'Lãi Tech', amount: 0, date: '2026-11-08', repeat: true,
  loan: { principal: 107000000, rate: 20, amortize: 5000000 } });
assert.strictEqual(D.amountFor(loan, '2026-11'), 1783333);
assert.strictEqual(D.amountFor(loan, '2026-12'), 1700000);
assert.strictEqual(D.amountFor(loan, '2027-01'), 1616667);
assert.strictEqual(D.principalAt(loan, '2027-01'), 97000000);
assert.strictEqual(D.occurrences([loan], '2050-01').length, 0, 'a repaid loan stops appearing');
const loanOver = { ...loan, override: { '2026-12': 9000000 } };
assert.strictEqual(D.amountFor(loanOver, '2026-12'), 9000000, 'an override beats the loan schedule');

// ---- plan money stays an asset until it is spent ----
const plan = [
  entry({ id: 'p', type: 'plan', label: 'Quỹ đi chơi', amount: 6000000, date: '2026-10-07' }),
  entry({ id: 'i2', type: 'in', amount: 15000000, date: '2026-10-01' }),
];
let s = D.monthSummary(plan, { '2026-10': 5000000 }, '2026-10');
assert.strictEqual(s.outflow, 0, 'an unspent plan is not an expense');
assert.strictEqual(s.net, 15000000);
assert.strictEqual(s.reserve, 6000000);
assert.strictEqual(s.rest, 4000000, 'net - reserve - living');
assert.strictEqual(D.reservedFund(plan, '2026-10').total, 6000000);
assert.strictEqual(D.reservedFund(plan, '2026-09').total, 0, 'not counted before its month');
plan[0].doneIn = ['2026-10'];
s = D.monthSummary(plan, { '2026-10': 5000000 }, '2026-10');
assert.strictEqual(s.outflow, 6000000, 'once spent it becomes an expense');
assert.strictEqual(s.reserve, 0);
assert.strictEqual(s.rest, 4000000, 'rest is unchanged: it only moved between buckets');
assert.strictEqual(D.reservedFund(plan, '2026-10').total, 0);
const saving = [entry({ id: 'm', type: 'plan', amount: 2000000, date: '2026-08-05', repeat: true, doneIn: ['2026-09'] })];
assert.strictEqual(D.reservedFund(saving, '2026-10').total, 4000000, 'two unspent months of a monthly fund');

// ---- carried-forward settings ----
assert.strictEqual(D.livingFor({ '2026-08': 7, '2026-10': 9 }, '2026-09'), 7);
assert.strictEqual(D.livingFor({ '2026-08': 7, '2026-10': 9 }, '2026-12'), 9);
assert.strictEqual(D.livingFor({}, '2026-12'), 0);
assert.deepStrictEqual(D.allocationsFor({ '2026-08': { a: 1 } }, '2026-10'), { a: 1 });

// ---- daily series from a real opening balance ----
const flow = [
  entry({ id: 'a', type: 'out', label: 'Nhà', amount: 1200000, date: '2026-11-01', repeat: true }),
  entry({ id: 'b', type: 'out', label: 'Lãi', amount: 5197260, date: '2026-11-08', repeat: true }),
  entry({ id: 'c', type: 'in', label: 'Lương', amount: 17948375, date: '2026-11-09', repeat: true }),
];
const pts = D.series(flow, '2026-10-22', 31, 3512377);
assert.strictEqual(pts.length, 31);
assert.strictEqual(pts[0].iso, '2026-10-22');
assert.strictEqual(pts[0].bal, 3512377, 'day one starts at the opening balance');
const low = D.lowestOf(pts);
assert.strictEqual(low.iso, '2026-11-08');
assert.strictEqual(low.trough, 3512377 - 1200000 - 5197260);
assert.strictEqual(low.trough < 0, true);
const after = pts.find(p => p.iso === '2026-11-09');
assert.strictEqual(after.bal, low.trough + 17948375, 'the salary lands the next day');
const risks = D.riskDays(pts, 3);
assert.strictEqual(risks.length, 2, 'the series spans two calendar months');
assert.strictEqual(risks[0].iso, '2026-11-08', 'the worst month comes first');

// same day: the outflow is applied before the inflow
const sameDay = D.series(
  [entry({ id: 'd1', type: 'out', amount: 1000, date: '2026-10-22' }), entry({ id: 'd2', type: 'in', amount: 1000, date: '2026-10-22' })],
  '2026-10-22', 1, 0);
assert.strictEqual(sameDay[0].trough, -1000);
assert.strictEqual(sameDay[0].bal, 0);

// living spreads evenly across the month when asked for
const withLiving = D.series([], '2026-11-01', 30, 3000000, { '2026-11': 3000000 });
assert.strictEqual(Math.round(withLiving[29].bal), 0, 'a full month of living drains the opening balance');
assert.strictEqual(D.series([], '2026-11-01', 30, 3000000)[29].bal, 3000000, 'living is opt-in');

// a day with nothing still reports no rows
assert.deepStrictEqual(D.dayRows(flow, '2026-11-03'), []);
assert.strictEqual(D.dayRows(flow, '2026-11-08').length, 1);

// ---- net worth ----
assert.deepStrictEqual(D.netWorth([
  { kind: 'asset', type: 'cash', balance: 20416226 },
  { kind: 'asset', type: 'bank', balance: 58200000 },
  { kind: 'asset', type: 'invest', balance: 300000000 },
  { kind: 'debt', type: 'debt', balance: 408300000 },
]), { assets: 378616226, debts: 408300000, net: -29683774, liquid: 78616226 });

// ---- migration ----
const v1 = D.migrate({
  transactions: [{ id: 't', type: 'income', label: 'Lương', amount: 5, date: '2026-10-01' }],
  plan: { month: '2026-11', incomes: [], expenses: [{ id: 'p', label: 'Nhà', amount: 3, date: '2026-11-03' }], livingBudget: 8 },
});
assert.strictEqual(v1.entries.length, 2);
assert.deepStrictEqual(v1.entries[0].doneIn, ['2026-10'], 'past transactions arrive already done');
assert.deepStrictEqual(v1.entries[1].doneIn, []);
assert.strictEqual(v1.living['2026-11'], 8);

const v2 = D.migrate({ entries: [{ id: 'k', type: 'plan', label: 'Quỹ', amount: 100, date: '2026-10-01' }], living: { '2026-10': 5 } });
assert.strictEqual(v2.entries[0].type, 'plan');
assert.deepStrictEqual(v2.entries[0].skip, []);
assert.deepStrictEqual(v2.entries[0].override, {});
assert.strictEqual(v2.entries[0].loan, null);
assert.strictEqual(v2.living['2026-10'], 5);
assert.deepStrictEqual(D.migrate(null).entries, []);
assert.strictEqual(D.migrate({ entries: [{ id: 'bad', date: 'nope' }] }).entries.length, 0, 'invalid dates are dropped');

console.log('Rootcash domain tests: PASS');
