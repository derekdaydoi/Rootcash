(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.RootcashDomain = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  function sum(items, key = 'amount') { return (items || []).reduce((total, item) => total + Number(item?.[key] || 0), 0); }
  function roundUp(value, step = 500000) { if (value <= 0) return 0; return Math.ceil(value / step) * step; }
  function monthSummary(transactions, monthKey) {
    const rows = (transactions || []).filter((tx) => String(tx.date || '').slice(0, 7) === monthKey);
    const income = rows.filter((tx) => tx.type === 'income');
    const expenses = rows.filter((tx) => tx.type === 'expense');
    const byCategory = {};
    expenses.forEach((tx) => { const category = tx.category || 'Dịch vụ nhà'; byCategory[category] = (byCategory[category] || 0) + Number(tx.amount || 0); });
    const totalIncome = sum(income); const totalExpense = sum(expenses);
    return { income: totalIncome, expense: totalExpense, remaining: totalIncome - totalExpense, byCategory, rows };
  }
  function calculateBuffer(incomes, expenses, safetyRate = 10, livingBudget = 0) {
    const events = [];
    (incomes || []).forEach((item) => events.push({ date: item.date, amount: Number(item.amount || 0), kind: 'income' }));
    (expenses || []).forEach((item) => events.push({ date: item.date, amount: -Number(item.amount || 0), kind: 'expense' }));
    events.sort((a, b) => { const byDate = String(a.date || '').localeCompare(String(b.date || '')); if (byDate !== 0) return byDate; if (a.kind === b.kind) return 0; return a.kind === 'expense' ? -1 : 1; });
    let running = 0; let minimum = 0;
    events.forEach((event) => { running += event.amount; minimum = Math.min(minimum, running); });
    const totalIncome = sum(incomes);
    const totalExpense = sum(expenses);
    const living = Math.max(0, Number(livingBudget || 0));
    const timingGap = Math.max(0, -minimum);
    const safetyBase = totalExpense + living;
    const safetyMargin = safetyBase * clamp(Number(safetyRate || 0), 0, 100) / 100;
    const recommended = roundUp(timingGap + living + safetyMargin, 500000);
    const forecastNet = totalIncome - totalExpense - living;
    return {
      timingGap,
      safetyMargin,
      recommended,
      totalIncome,
      totalExpense,
      livingBudget: living,
      flexible: Math.max(0, forecastNet),
      headroom: forecastNet,
      endingNet: running,
      events
    };
  }
  function allocationTotal(allocations) { return Object.values(allocations || {}).reduce((total, value) => total + Number(value || 0), 0); }
  return { sum, roundUp, monthSummary, calculateBuffer, allocationTotal };
});
