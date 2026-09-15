(() => {
  'use strict';
  const RC=window.RootcashApp, C=RC.config, S=RC.store, D=window.RootcashDomain, header=RC.screens.header;

  const planItem=(item,kind)=>{
    const isIncome=kind==='income';
    const confirmLabel=isIncome?'Xác nhận đã nhận':'Xác nhận đã chi';
    const meta=isIncome?C.escapeHtml(item.category||'Thu nhập khác'):C.escapeHtml(item.category||'Dịch vụ nhà');
    return `<div class="plan-entry">
      <button class="plan-item plan-entry__edit" data-edit-plan="${item.id}" data-kind="${kind}">
        <span class="plan-item__ico ${kind}">${C.icon(isIncome?'income-flow':'expense-flow')}</span>
        <span class="plan-item__main">
          <span class="plan-item__label">${C.escapeHtml(item.label)}</span>
          <span class="plan-item__amount">${C.fmtMoney(item.amount)}</span>
        </span>
        <span class="date-pill">${isIncome?'nhận ':''}${C.shortDate(item.date)}</span>
      </button>
      <div class="plan-entry__foot">
        <span class="plan-entry__meta">${meta}</span>
        <button class="plan-confirm ${kind}" type="button" data-confirm-plan="${item.id}" data-kind="${kind}">${confirmLabel}</button>
      </div>
    </div>`;
  };

  const metric=(kind,label,value)=>`<div class="metric metric-${kind}"><span class="metric__ico">${C.icon({income:'income',expense:'expense',buffer:'shield',flexible:'flexible'}[kind])}</span><div class="metric__body"><span class="metric__label">${label}</span><strong>${C.fmtMoney(value)}</strong></div></div>`;

  RC.screens.plan=()=>{
    const p=S.planning(),st=S.state;
    return `${header('Kế hoạch tháng sau',`<button class="icon-btn" data-nav="home" aria-label="Quay lại">${C.icon('back')}</button>`,`<button class="icon-btn" data-settings aria-label="Cài đặt">${C.icon('gear')}</button>`)}
      <div class="metrics">${metric('income','Thu nhập dự kiến',p.totalIncome)}${metric('expense','Chi phí dự kiến',p.totalExpense)}${metric('buffer','Buffer cần giữ',p.recommended)}${metric('flexible','Có thể chi linh hoạt',p.flexible)}</div>
      <div class="card section plan-section plan-section-income">
        <div class="section-title"><div><h2>Thu nhập dự kiến</h2><span class="plan-section-sub">Lương · Business · Thu nhập khác</span></div><button class="add-link" data-add="plan-income">＋ Thêm</button></div>
        <div class="plan-list">${st.plan.incomes.length?st.plan.incomes.map(i=>planItem(i,'income')).join(''):'<div class="empty-note">Chưa có khoản thu dự kiến</div>'}</div>
      </div>
      <div class="card section plan-section plan-section-expense">
        <div class="section-title"><div><h2>Chi phí phải trả</h2><span class="plan-section-sub">Theo danh mục chi tiêu</span></div><button class="add-link" data-add="plan-expense">＋ Thêm</button></div>
        <div class="plan-list">${st.plan.expenses.length?st.plan.expenses.map(i=>planItem(i,'expense')).join(''):'<div class="empty-note">Chưa có khoản chi dự kiến</div>'}</div>
      </div>
      <button class="insight" data-nav="allocation"><span class="insight__icon">${C.icon('wallet')}</span><b>Phân bổ ${C.fmtMoney(p.flexible)}</b><span>›</span></button>`;
  };

  RC.screens.allocation=()=>{const p=S.planning(),total=D.allocationTotal(S.state.plan.allocations),max=Math.max(1000000,p.flexible);return `${header('Phân bổ kế hoạch',`<button class="icon-btn" data-nav="plan" aria-label="Quay lại">${C.icon('back')}</button>`)}<div class="flex-budget"><span class="flex-budget__ico">${C.icon('wallet')}</span><div><span>Ngân sách linh hoạt</span><strong>${C.fmtMoney(p.flexible)}</strong></div></div><div class="card section"><div class="allocation-list">${C.categories.map(c=>{const amount=Number(S.state.plan.allocations[c.name]||0),pct=p.flexible?Math.round(amount/p.flexible*100):0;return `<div class="allocation-row" data-allocation-row="${C.escapeHtml(c.name)}">${C.categoryIcon(c)}<div class="allocation-row__main"><div class="allocation-row__head"><b>${c.name}</b><span data-pct>${pct}%</span></div><input class="range" style="--range-color:${c.color}" type="range" min="0" max="${max}" step="100000" value="${amount}" data-alloc="${C.escapeHtml(c.name)}"></div><div class="amount-chip" data-amount>${C.fmtMoney(amount)}</div></div>`;}).join('')}</div><div class="alloc-summary ${total>p.flexible?'over':''}" data-alloc-summary><span>Đã phân bổ</span><strong>${C.fmtMoney(total)} / ${C.fmtMoney(p.flexible)}</strong></div></div><button class="cta" data-save-plan>Lưu kế hoạch</button>`;};
})();
