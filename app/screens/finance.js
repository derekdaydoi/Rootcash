(() => {
  'use strict';
  const RC=window.RootcashApp, C=RC.config, S=RC.store, header=RC.screens.header;

  const monthKeyOf=date=>String(date||'').slice(0,7);
  const validTx=tx=>tx && (tx.type==='income'||tx.type==='expense') && /^\d{4}-\d{2}-\d{2}$/.test(String(tx.date||''));
  const sum=(rows,type)=>rows.filter(tx=>tx.type===type).reduce((total,tx)=>total+Number(tx.amount||0),0);
  const statusFor=key=>key===C.currentMonthKey?'Tháng này':key>C.currentMonthKey?'Sắp tới':'Đã qua';

  const txRow=tx=>`<button class="tx-row" data-edit-actual="${tx.id}">
    <span class="tx-ico ${tx.type==='expense'?'expense':''}">${C.icon(tx.type==='income'?'income-flow':'expense-flow')}</span>
    <span class="tx-copy"><b>${C.escapeHtml(tx.label)}</b><span>${C.shortDate(tx.date)}${tx.category?` · ${C.escapeHtml(tx.category)}`:''}</span></span>
    <span class="tx-amt ${tx.type==='expense'?'expense':''}">${tx.type==='expense'?'-':'+'}${C.fmtMoney(tx.amount)}</span>
  </button>`;

  const monthCard=(key,rows,index)=>{
    const income=sum(rows,'income'),expense=sum(rows,'expense'),net=income-expense;
    const sorted=[...rows].sort((a,b)=>String(a.date).localeCompare(String(b.date)) || String(a.label||'').localeCompare(String(b.label||''),'vi'));
    return `<div class="card section cash-month ${index===0?'section-first':''}">
      <div class="cash-month-head">
        <div class="cash-month-heading"><h2>${C.monthLabel(key)}</h2><span>${rows.length} giao dịch</span></div>
        <span class="cash-month-status ${key>C.currentMonthKey?'future':key<C.currentMonthKey?'past':'current'}">${statusFor(key)}</span>
      </div>
      <div class="cash-month-totals">
        <div><span>Thu</span><b>${C.fmtMoney(income)}</b></div>
        <div><span>Chi</span><b>${C.fmtMoney(expense)}</b></div>
        <div class="${net<0?'negative':'positive'}"><span>Ròng</span><b>${net<0?'-':''}${C.fmtMoney(Math.abs(net))}</b></div>
      </div>
      <div class="simple-list">${sorted.map(txRow).join('')}</div>
    </div>`;
  };

  RC.screens.cashflow=()=>{
    const all=(S.state.transactions||[]).filter(validTx);
    const grouped=new Map();
    all.forEach(tx=>{const key=monthKeyOf(tx.date);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(tx);});
    const keys=[...grouped.keys()];
    const future=keys.filter(k=>k>C.currentMonthKey).sort();
    const past=keys.filter(k=>k<C.currentMonthKey).sort().reverse();
    const ordered=grouped.has(C.currentMonthKey)?[C.currentMonthKey,...future,...past]:[...future,...past];
    const totalIncome=sum(all,'income'),totalExpense=sum(all,'expense'),totalNet=totalIncome-totalExpense;

    return `${header('Dòng tiền','',`<button class="icon-btn" data-settings aria-label="Cài đặt">${C.icon('gear')}</button>`)}
      <div class="card cashflow-overview">
        <div class="cashflow-overview__head"><div><span>Dòng tiền thực tế đã ghi nhận</span><b>${all.length} giao dịch</b></div><strong class="${totalNet<0?'negative':''}">${totalNet<0?'-':''}${C.fmtMoney(Math.abs(totalNet))}</strong></div>
        <div class="cashflow-overview__grid"><div><span>Tổng thu</span><b>${C.fmtMoney(totalIncome)}</b></div><div><span>Tổng chi</span><b>${C.fmtMoney(totalExpense)}</b></div></div>
      </div>
      ${ordered.length?ordered.map((key,index)=>monthCard(key,grouped.get(key),index)).join(''):'<div class="card section section-first"><div class="empty-note">Chưa có dòng tiền thực tế nào</div></div>'}`;
  };

  RC.screens.capital=()=>{const s=S.summary(),p=S.planning(),headroom=s.remaining-p.recommended;return `${header('Vốn','',`<button class="icon-btn" data-settings aria-label="Cài đặt">${C.icon('gear')}</button>`)}<div class="card capital-hero"><span>Tiền còn lại thực tế</span><strong>${C.fmtMoney(s.remaining)}</strong><b class="capital-status ${headroom<0?'negative':''}">${headroom>=0?'Đủ buffer tháng sau':'Thiếu buffer tháng sau'}</b></div><div class="capital-grid"><div class="capital-cell"><span>Buffer cần giữ</span><b>${C.fmtMoney(p.recommended)}</b></div><div class="capital-cell"><span>Headroom</span><b>${C.fmtMoney(headroom)}</b></div><div class="capital-cell"><span>Khoảng hụt theo ngày</span><b>${C.fmtMoney(p.timingGap)}</b></div><div class="capital-cell"><span>Biên an toàn</span><b>${C.fmtMoney(p.safetyMargin)}</b></div></div>`;};
})();
