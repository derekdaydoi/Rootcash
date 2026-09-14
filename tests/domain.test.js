const assert = require('assert');
const D = require('../domain.js');

const incomes = [
  { amount: 20000000, date: '2026-10-09' },
  { amount: 4000000, date: '2026-10-15' },
  { amount: 5000000, date: '2026-10-24' },
];
const expenses = [
  { amount: 5500000, date: '2026-10-03' },
  { amount: 4800000, date: '2026-10-08' },
  { amount: 6300000, date: '2026-10-10' },
  { amount: 2000000, date: '2026-10-12' },
];

const p = D.calculateBuffer(incomes, expenses, 10);
assert.strictEqual(p.totalIncome, 29000000);
assert.strictEqual(p.totalExpense, 18600000);
assert.strictEqual(p.flexible, 10400000);
assert.strictEqual(p.timingGap, 10300000);
assert.strictEqual(p.safetyMargin, 1860000);
assert.strictEqual(p.recommended, 12500000);

const sameDay = D.calculateBuffer([{amount:1000000,date:'2026-10-03'}],[{amount:1000000,date:'2026-10-03'}],0);
assert.strictEqual(sameDay.timingGap, 1000000, 'same-day expense should be considered before income');

const summary = D.monthSummary([
  { type:'income', amount:100, date:'2026-09-01' },
  { type:'expense', amount:40, date:'2026-09-02', category:'Ăn uống' },
  { type:'expense', amount:10, date:'2026-08-30', category:'Khác' },
], '2026-09');
assert.deepStrictEqual({income:summary.income,expense:summary.expense,remaining:summary.remaining}, {income:100,expense:40,remaining:60});
assert.strictEqual(summary.byCategory['Ăn uống'],40);

assert.strictEqual(D.allocationTotal({'A':100,'B':200}),300);
console.log('Rootcash domain tests: PASS');
