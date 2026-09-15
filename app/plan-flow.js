(() => {
  'use strict';
  const RC=window.RootcashApp;
  if(!RC?.store||!RC?.config) return;
  const S=RC.store,C=RC.config;
  const sheetRoot=document.querySelector('#sheet-root');
  const toastRoot=document.querySelector('#toast-root');

  const escapeHtml=C.escapeHtml;
  const money=value=>String(value??'').replace(/[^0-9]/g,'');
  const todayIso=()=>{
    const d=new Date();
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };
  const formatDateLabel=iso=>{if(!iso)return 'Chọn ngày';const [y,m,d]=String(iso).split('-');return `ngày ${Number(d)} thg ${Number(m)}, ${y}`;};
  const toast=msg=>{if(!toastRoot)return;const el=document.createElement('div');el.className='toast';el.textContent=msg;toastRoot.appendChild(el);setTimeout(()=>el.remove(),2200);};

  function optionsFor(kind,selected){
    const list=kind==='income'?C.incomeCategories:C.categories;
    return list.map(c=>`<option value="${escapeHtml(c.name)}" ${c.name===selected?'selected':''}>${escapeHtml(c.name)}</option>`).join('');
  }

  function close(){
    sheetRoot.innerHTML='';
    document.body.classList.remove('modal-open');
  }

  function rerenderPlan(){
    const planNav=document.querySelector('[data-nav="plan"]');
    if(planNav) planNav.click();
    else location.reload();
  }

  function bindDate(){
    const input=sheetRoot.querySelector('[data-confirm-date]');
    const value=sheetRoot.querySelector('[data-confirm-date-value]');
    if(!input||!value)return;
    const paint=()=>value.textContent=formatDateLabel(input.value);
    paint();
    input.addEventListener('input',paint);
    input.addEventListener('change',paint);
  }

  function bindAmount(){
    const input=sheetRoot.querySelector('[name="confirmAmount"]');
    if(!input)return;
    const clean=()=>{input.value=money(input.value);input.setCustomValidity('');};
    input.addEventListener('input',clean);
    input.addEventListener('paste',()=>setTimeout(clean,0));
  }

  function openConfirm(id,kind){
    const list=kind==='income'?S.state.plan.incomes:S.state.plan.expenses;
    const item=list.find(x=>x.id===id);
    if(!item)return;
    const isIncome=kind==='income';
    const category=item.category||(isIncome?'Thu nhập khác':'Dịch vụ nhà');
    const title=isIncome?'Xác nhận thu thực tế':'Xác nhận chi thực tế';
    const categoryLabel=isIncome?'Nguồn thu':'Danh mục';
    document.body.classList.add('modal-open');
    sheetRoot.innerHTML=`<div class="sheet-backdrop"><section class="sheet confirm-sheet" role="dialog" aria-modal="true">
      <div class="sheet__grab"></div>
      <div class="sheet__head"><div><h2>${title}</h2><p class="confirm-sub">Chuyển khoản dự kiến thành dòng tiền thực tế</p></div><button class="sheet__close" type="button" data-confirm-close aria-label="Đóng">×</button></div>
      <form id="confirm-plan-form" data-plan-id="${escapeHtml(id)}" data-kind="${kind}">
        <div class="form-grid">
          <div class="field full"><label>Tên khoản</label><input name="confirmLabel" required value="${escapeHtml(item.label)}"></div>
          <div class="field full"><label>Số tiền thực tế</label><input name="confirmAmount" type="text" inputmode="numeric" enterkeyhint="done" autocomplete="off" required value="${money(item.amount)}"></div>
          <div class="field full"><label>${isIncome?'Ngày nhận thực tế':'Ngày chi thực tế'}</label><div class="date-control"><input class="date-native" data-confirm-date name="confirmDate" type="date" required value="${todayIso()}"><span class="date-value" data-confirm-date-value>${formatDateLabel(todayIso())}</span></div></div>
          <div class="field full"><label>${categoryLabel}</label><select name="confirmCategory">${optionsFor(kind,category)}</select></div>
        </div>
        <div class="confirm-note">Sau khi xác nhận, khoản này sẽ rời khỏi Kế hoạch và xuất hiện trong Dòng tiền.</div>
        <div class="sheet-actions"><button class="btn" type="button" data-confirm-close>Huỷ</button><button class="btn primary" type="submit">Xác nhận</button></div>
      </form>
    </section></div>`;

    const bg=sheetRoot.querySelector('.sheet-backdrop');
    bg?.addEventListener('click',e=>{if(e.target===bg)close();});
    sheetRoot.querySelectorAll('[data-confirm-close]').forEach(b=>b.addEventListener('click',close));
    bindDate();bindAmount();

    sheetRoot.querySelector('#confirm-plan-form')?.addEventListener('submit',e=>{
      e.preventDefault();
      const form=e.currentTarget;
      const f=new FormData(form);
      const amount=Number(money(f.get('confirmAmount')));
      const amountInput=form.elements.confirmAmount;
      if(!Number.isSafeInteger(amount)||amount<=0){
        amountInput?.setCustomValidity('Số tiền phải là số nguyên lớn hơn 0');
        amountInput?.reportValidity();
        return;
      }
      const label=String(f.get('confirmLabel')||'').trim();
      const date=String(f.get('confirmDate')||'');
      const confirmedCategory=String(f.get('confirmCategory')||category);
      if(!label||!date)return;

      S.state.transactions.push({
        id:C.uid('tx'),
        type:kind,
        label,
        amount,
        date,
        category:confirmedCategory,
        sourcePlanId:id,
        confirmedAt:new Date().toISOString()
      });
      if(kind==='income') S.state.plan.incomes=S.state.plan.incomes.filter(x=>x.id!==id);
      else S.state.plan.expenses=S.state.plan.expenses.filter(x=>x.id!==id);
      S.save();
      close();
      toast(isIncome?'Đã xác nhận thu thực tế':'Đã xác nhận chi thực tế');
      rerenderPlan();
    });
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-confirm-plan]');
    if(!btn)return;
    e.preventDefault();
    e.stopPropagation();
    openConfirm(btn.dataset.confirmPlan,btn.dataset.kind);
  },true);
})();
