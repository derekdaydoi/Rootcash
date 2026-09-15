(() => {
  'use strict';
  const RC=window.RootcashApp;
  if(!RC?.store||!RC?.config||!window.RootcashDomain)return;
  const S=RC.store,C=RC.config,D=window.RootcashDomain;
  const app=document.querySelector('#app');
  const toastRoot=document.querySelector('#toast-root');
  const money=value=>String(value??'').replace(/[^0-9]/g,'');
  const toast=msg=>{if(!toastRoot)return;const el=document.createElement('div');el.className='toast';el.textContent=msg;toastRoot.appendChild(el);setTimeout(()=>el.remove(),2200);};
  const budget=()=>Math.max(0,Number(S.state.plan.livingBudget||0));
  const livingNames=()=>new Set(C.categories.filter(c=>c.name!=='Chi phí vay').map(c=>c.name));

  function refreshSummary(){
    const limit=budget();
    const total=D.allocationTotal(S.state.plan.allocations);
    const remaining=limit-total;
    const summary=app?.querySelector('[data-living-summary]');
    if(summary){
      summary.classList.toggle('over',remaining<0);
      const label=summary.querySelector('span'),value=summary.querySelector('strong');
      if(label)label.textContent=remaining>=0?'Còn chưa phân bổ':'Vượt ngân sách';
      if(value)value.textContent=`${remaining<0?'-':''}${C.fmtMoney(Math.abs(remaining))}`;
    }
    app?.querySelectorAll('[data-living-alloc]').forEach(input=>{
      const amount=Number(input.value||0);
      const row=input.closest('[data-allocation-row]');
      row?.querySelector('[data-pct]')?.replaceChildren(document.createTextNode(`${limit?Math.round(amount/limit*100):0}%`));
      input.disabled=limit<=0;
      input.max=String(Math.max(100000,limit,amount));
    });
  }

  document.addEventListener('input',e=>{
    const input=e.target.closest?.('[data-living-alloc]');
    if(!input)return;
    const name=input.dataset.livingAlloc;
    if(!livingNames().has(name))return;
    const amount=Math.max(0,Number(input.value||0));
    S.state.plan.allocations[name]=amount;
    S.save();
    input.closest('[data-allocation-row]')?.querySelector('[data-amount]')?.replaceChildren(document.createTextNode(C.fmtMoney(amount)));
    refreshSummary();
  },true);

  document.addEventListener('submit',e=>{
    const form=e.target.closest?.('[data-living-budget-form]');
    if(!form)return;
    e.preventDefault();
    const input=form.elements.livingBudget;
    const amount=Number(money(input?.value));
    if(!Number.isSafeInteger(amount)||amount<0){
      input?.setCustomValidity('Ngân sách phải là số nguyên từ 0 trở lên');
      input?.reportValidity();
      return;
    }
    input?.setCustomValidity('');
    S.state.plan.livingBudget=amount;
    S.save();
    const display=app?.querySelector('[data-living-budget-display]');
    if(display)display.textContent=C.fmtMoney(amount);
    refreshSummary();
    toast('Đã lưu ngân sách sinh hoạt');
  },true);

  document.addEventListener('click',e=>{
    const done=e.target.closest?.('[data-save-living]');
    if(!done)return;
    e.preventDefault();
    S.save();
    const back=app?.querySelector('[data-nav="plan"]');
    if(back)back.click();
  },true);
})();
