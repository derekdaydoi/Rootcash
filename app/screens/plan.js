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

  const metric=(kind,label,value)=>`<div class="metric metric-${kind}"><span class="metric__ico">${C.icon({income:'income',expense:'expense',buffer:'shield',living:'wallet'}[kind])}</span><div class="metric__body"><span class="metric__label">${label}</span><strong>${C.fmtMoney(value)}</strong></div></div>`;
  const livingCategories=()=>C.categories.filter(c=>c.name!=='Chi phí vay');

  RC.screens.plan=()=>{
    const p=S.planning(),st=S.state;
    return `${header('Kế hoạch tháng sau',`<button class="icon-btn" data-nav="home" aria-label="Quay lại">${C.icon('back')}</button>`,`<button class="icon-btn" data-settings aria-label="Cài đặt">${C.icon('gear')}</button>`)}
      <div class="metrics">${metric('income','Thu nhập dự kiến',p.totalIncome)}${metric('expense','Chi phí phải trả',p.totalExpense)}${metric('living','Sinh hoạt đã set',p.livingBudget)}${metric('buffer','Buffer cần giữ',p.recommended)}</div>
      <button class="living-budget-link" data-nav="allocation">
        <span class="living-budget-link__icon">${C.icon('wallet')}</span>
        <span class="living-budget-link__copy"><small>Ngân sách sinh hoạt</small><b>${p.livingBudget?C.fmtMoney(p.livingBudget):'Chưa đặt'}</b></span>
        <span class="living-budget-link__action">${p.livingBudget?'Phân bổ':'Đặt ngân sách'} ›</span>
      </button>
      <div class="card section plan-section plan-section-income">
        <div class="section-title"><div><h2>Thu nhập dự kiến</h2><span class="plan-section-sub">Lương · Business · Thu nhập khác</span></div><button class="add-link" data-add="plan-income">＋ Thêm</button></div>
        <div class="plan-list">${st.plan.incomes.length?st.plan.incomes.map(i=>planItem(i,'income')).join(''):'<div class="empty-note">Chưa có khoản thu dự kiến</div>'}</div>
      </div>
      <div class="card section plan-section plan-section-expense">
        <div class="section-title"><div><h2>Chi phí phải trả</h2><span class="plan-section-sub">Khoản chắc chắn phải thanh toán</span></div><button class="add-link" data-add="plan-expense">＋ Thêm</button></div>
        <div class="plan-list">${st.plan.expenses.length?st.plan.expenses.map(i=>planItem(i,'expense')).join(''):'<div class="empty-note">Chưa có khoản chi dự kiến</div>'}</div>
      </div>`;
  };

  RC.screens.allocation=()=>{
    const p=S.planning(),budget=Number(S.state.plan.livingBudget||0),categories=livingCategories();
    const total=categories.reduce((sum,c)=>sum+Number(S.state.plan.allocations[c.name]||0),0),remaining=budget-total;
    return `${header('Chi phí sinh hoạt',`<button class="icon-btn" data-nav="plan" aria-label="Quay lại">${C.icon('back')}</button>`)}
      <div class="card living-budget-editor">
        <div class="living-budget-editor__head"><span class="living-budget-editor__ico">${C.icon('wallet')}</span><div><span>Ngân sách tháng</span><strong data-living-budget-display>${C.fmtMoney(budget)}</strong></div></div>
        <form class="living-budget-form" data-living-budget-form>
          <label for="living-budget-input">Tự đặt số tiền</label>
          <div class="living-budget-form__row"><input id="living-budget-input" name="livingBudget" type="text" inputmode="numeric" autocomplete="off" value="${budget||''}" placeholder="VD: 8000000"><button type="submit">Lưu</button></div>
        </form>
      </div>
      <div class="card section living-allocation-card">
        <div class="section-title"><div><h2>Phân bổ sinh hoạt</h2><span class="plan-section-sub">Không gồm chi phí vay</span></div></div>
        <div class="allocation-list">${categories.map(c=>{const amount=Number(S.state.plan.allocations[c.name]||0),pct=budget?Math.round(amount/budget*100):0,max=Math.max(100000,budget,amount);return `<div class="allocation-row" data-allocation-row="${C.escapeHtml(c.name)}">${C.categoryIcon(c)}<div class="allocation-row__main"><div class="allocation-row__head"><b>${c.name}</b><span data-pct>${pct}%</span></div><input class="range" style="--range-color:${c.color}" type="range" min="0" max="${max}" step="100000" value="${amount}" data-living-alloc="${C.escapeHtml(c.name)}" ${budget<=0?'disabled':''}></div><div class="amount-chip" data-amount>${C.fmtMoney(amount)}</div></div>`;}).join('')}</div>
        <div class="alloc-summary ${total>budget?'over':''}" data-living-summary><span>${remaining>=0?'Còn chưa phân bổ':'Vượt ngân sách'}</span><strong>${remaining<0?'-':''}${C.fmtMoney(Math.abs(remaining))}</strong></div>
      </div>
      <button class="cta" data-save-living>Hoàn tất</button>`;
  };
})();
