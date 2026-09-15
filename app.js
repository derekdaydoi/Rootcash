(() => {
  'use strict';
  const RC=window.RootcashApp,C=RC.config,S=RC.store,UI=RC.screens,D=window.RootcashDomain;
  const $app=document.querySelector('#app'),$sheet=document.querySelector('#sheet-root'),$toast=document.querySelector('#toast-root');
  let view='home',ctx={mode:'actual',editId:null};
  const toast=msg=>{const el=document.createElement('div');el.className='toast';el.textContent=msg;$toast.appendChild(el);setTimeout(()=>el.remove(),2200);};
  function render(){const screen=UI[view]||UI.home,active=view==='allocation'?'plan':view;$app.innerHTML=`<section class="screen-shell"><div class="screen-scroll">${screen()}</div>${UI.nav(active)}</section>`;bind();guard($app.querySelector('.screen-scroll'));}
  function bind(){
    $app.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.nav;render();}));
    $app.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>openEditor(b.dataset.add)));
    $app.querySelectorAll('[data-settings]').forEach(b=>b.addEventListener('click',openSettings));
    $app.querySelectorAll('[data-edit-actual]').forEach(b=>b.addEventListener('click',()=>openEditor('actual',b.dataset.editActual)));
    $app.querySelectorAll('[data-edit-plan]').forEach(b=>b.addEventListener('click',()=>openEditor(b.dataset.kind==='income'?'plan-income':'plan-expense',b.dataset.editPlan)));
    $app.querySelectorAll('[data-alloc]').forEach(i=>i.addEventListener('input',()=>updateAllocation(i)));
    $app.querySelectorAll('[data-save-plan]').forEach(b=>b.addEventListener('click',()=>{S.save();toast('Đã lưu kế hoạch tháng sau');view='plan';render();}));
  }
  function updateAllocation(input){S.state.plan.allocations[input.dataset.alloc]=Number(input.value);S.save();const p=S.planning(),row=input.closest('[data-allocation-row]'),amount=Number(input.value||0);row?.querySelector('[data-pct]')?.replaceChildren(document.createTextNode(`${p.flexible?Math.round(amount/p.flexible*100):0}%`));row?.querySelector('[data-amount]')?.replaceChildren(document.createTextNode(C.fmtMoney(amount)));const total=D.allocationTotal(S.state.plan.allocations),sum=$app.querySelector('[data-alloc-summary]');if(sum){sum.classList.toggle('over',total>p.flexible);sum.querySelector('strong').textContent=`${C.fmtMoney(total)} / ${C.fmtMoney(p.flexible)}`;}}
  function guard(scroller){if(!scroller)return;let y=0;scroller.addEventListener('touchstart',e=>{if(e.touches.length===1)y=e.touches[0].clientY;},{passive:true});scroller.addEventListener('touchmove',e=>{if(e.touches.length!==1||e.target.closest('input[type="range"]'))return;const n=e.touches[0].clientY,d=n-y,top=scroller.scrollTop<=0,bottom=Math.ceil(scroller.scrollTop+scroller.clientHeight)>=scroller.scrollHeight;if((top&&d>0)||(bottom&&d<0))e.preventDefault();y=n;},{passive:false});}
  function installGuards(){['gesturestart','gesturechange','gestureend'].forEach(n=>document.addEventListener(n,e=>e.preventDefault(),{passive:false}));document.addEventListener('touchmove',e=>{if(e.touches?.length>1)e.preventDefault();},{passive:false});let last=0;document.addEventListener('touchend',e=>{const t=Date.now();if(t-last<=300)e.preventDefault();last=t;},{passive:false});}

  const categoryList=type=>type==='income'?C.incomeCategories:C.categories;
  const validCategory=(type,value)=>type==='income'?C.incomeCategoryNames.has(value):C.categoryNames.has(value);
  const defaultCategory=type=>type==='income'?'Lương':'Dịch vụ nhà';
  const categoryOptions=(type,selected)=>categoryList(type).map(c=>`<option value="${C.escapeHtml(c.name)}" ${c.name===selected?'selected':''}>${C.escapeHtml(c.name)}</option>`).join('');
  const formatDateLabel=iso=>{if(!iso)return 'Chọn ngày';const [y,m,d]=String(iso).split('-');return `ngày ${Number(d)} thg ${Number(m)}, ${y}`;};
  const defaultDateFor=(mode,type)=>mode==='actual'?C.dateInMonth(C.currentMonthKey,Math.min(C.now.getDate(),28)):C.dateInMonth(S.state.plan.month,10);
  const parseMoney=value=>{
    const digits=String(value??'').replace(/[^0-9]/g,'');
    if(!digits)return 0;
    const amount=Number(digits);
    return Number.isSafeInteger(amount)?amount:NaN;
  };

  function syncCategoryField(type){
    const wrap=$sheet.querySelector('[data-category-wrap]'),select=wrap?.querySelector('select'),label=wrap?.querySelector('label');
    if(!wrap||!select||!label)return;
    const current=select.value,selected=validCategory(type,current)?current:defaultCategory(type);
    label.textContent=type==='income'?'Nguồn thu':'Danh mục';
    select.innerHTML=categoryOptions(type,selected);
  }
  function syncDateDisplay(){
    const input=$sheet.querySelector('input[name="date"]'),value=$sheet.querySelector('[data-date-value]');
    if(!input||!value)return;
    const paint=()=>{value.textContent=formatDateLabel(input.value);};
    paint();
    input.addEventListener('input',paint);
    input.addEventListener('change',paint);
  }
  function syncAmountInput(){
    const input=$sheet.querySelector('input[name="amount"]');
    if(!input)return;
    const clean=()=>{
      const digits=String(input.value||'').replace(/[^0-9]/g,'');
      if(input.value!==digits)input.value=digits;
      input.setCustomValidity('');
    };
    input.addEventListener('input',clean);
    input.addEventListener('paste',()=>setTimeout(clean,0));
  }
  function syncEditorFields(type,{resetDate=false}={}){
    syncCategoryField(type);
    const dateLabel=$sheet.querySelector('[name="date"]')?.closest('.field')?.querySelector('label');
    if(dateLabel)dateLabel.textContent=type==='income'?'Ngày nhận':'Ngày';
    const name=$sheet.querySelector('[name="label"]');
    if(name)name.placeholder=type==='income'?'VD: Lương tháng 10, lãi business':'VD: Tiền nhà, ăn uống';
    if(resetDate){
      const dateInput=$sheet.querySelector('[name="date"]');
      if(dateInput){dateInput.value=defaultDateFor(ctx.mode,type);dateInput.dispatchEvent(new Event('input',{bubbles:true}));}
    }
  }

  function openEditor(mode='actual',editId=null,typeHint=null){
    ctx={mode,editId};
    const isPlanIncome=mode==='plan-income',isActual=mode==='actual',list=isPlanIncome?S.state.plan.incomes:S.state.plan.expenses;
    const item=editId?(isActual?S.state.transactions.find(x=>x.id===editId):list.find(x=>x.id===editId)):null;
    const type=isActual?(item?.type||typeHint||'expense'):(isPlanIncome?'income':'expense');
    const date=item?.date||defaultDateFor(mode,type);
    const category=validCategory(type,item?.category)?item.category:defaultCategory(type);
    const showSegment=!editId;
    const planMode=mode==='plan-income'||mode==='plan-expense';
    document.body.classList.add('modal-open');
    $sheet.innerHTML=`<div class="sheet-backdrop"><section class="sheet" role="dialog" aria-modal="true"><div class="sheet__grab"></div><div class="sheet__head"><h2>${editId?'Chỉnh sửa':'Thêm mục'}</h2><button class="sheet__close" data-close aria-label="Đóng">×</button></div>${showSegment?`<div class="segment" aria-label="Loại mục"><button type="button" data-seg="income" class="${!planMode&&type==='income'?'active':''}">Thu thực tế</button><button type="button" data-seg="expense" class="${!planMode&&type==='expense'?'active':''}">Chi thực tế</button><button type="button" data-seg="plan" class="${planMode?'active':''}">Kế hoạch</button></div>`:''}<form id="editor"><input type="hidden" name="type" value="${type}"><div class="form-grid"><div class="field full"><label>Tên khoản</label><input name="label" required value="${C.escapeHtml(item?.label||'')}" placeholder="${type==='income'?'VD: Lương tháng 10, lãi business':'VD: Tiền nhà, ăn uống'}"></div><div class="field full"><label>Số tiền</label><input name="amount" type="text" inputmode="numeric" enterkeyhint="done" autocomplete="off" required value="${item?.amount||''}" placeholder="0" aria-label="Số tiền"></div><div class="field full"><label>${type==='income'?'Ngày nhận':'Ngày'}</label><div class="date-control"><input class="date-native" name="date" type="date" required value="${date}" aria-label="${type==='income'?'Ngày nhận':'Ngày'}"><span class="date-value" data-date-value>${formatDateLabel(date)}</span></div></div><div class="field full" data-category-wrap><label>${type==='income'?'Nguồn thu':'Danh mục'}</label><select name="category">${categoryOptions(type,category)}</select></div></div><div class="sheet-actions">${editId?'<button type="button" class="btn danger" data-delete>Xóa</button>':'<button type="button" class="btn" data-close>Huỷ</button>'}<button class="btn primary" type="submit">${editId?'Lưu':'Thêm'}</button></div></form></section></div>`;
    bindSheet();syncDateDisplay();syncAmountInput();
  }
  function bindSheet(){
    const bg=$sheet.querySelector('.sheet-backdrop');
    bg?.addEventListener('click',e=>{if(e.target===bg)close();});
    $sheet.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close));
    $sheet.querySelectorAll('[data-seg]').forEach(b=>b.addEventListener('click',()=>{
      const seg=b.dataset.seg;
      $sheet.querySelectorAll('[data-seg]').forEach(x=>x.classList.toggle('active',x===b));
      if(seg==='plan'){
        if(ctx.mode!=='plan-income'&&ctx.mode!=='plan-expense')ctx.mode='plan-expense';
        const type=ctx.mode==='plan-income'?'income':'expense';
        $sheet.querySelector('[name="type"]').value=type;
        syncEditorFields(type,{resetDate:true});
        return;
      }
      ctx.mode='actual';
      $sheet.querySelector('[name="type"]').value=seg;
      syncEditorFields(seg,{resetDate:true});
    }));
    $sheet.querySelector('#editor')?.addEventListener('submit',submit);
    $sheet.querySelector('[data-delete]')?.addEventListener('click',del);
    guard($sheet.querySelector('.sheet'));
  }
  function submit(e){
    e.preventDefault();
    const f=new FormData(e.currentTarget),type=String(f.get('type')||'expense'),categoryRaw=String(f.get('category')||''),category=validCategory(type,categoryRaw)?categoryRaw:defaultCategory(type);
    const amountInput=e.currentTarget.elements.amount,amount=parseMoney(f.get('amount'));
    if(!Number.isSafeInteger(amount)||amount<=0){
      amountInput?.setCustomValidity('Số tiền phải là số nguyên lớn hơn 0');
      amountInput?.reportValidity();
      return;
    }
    const item={id:ctx.editId||C.uid(ctx.mode==='actual'?'tx':'plan'),label:String(f.get('label')||'').trim(),amount,date:String(f.get('date')||''),category,type};
    if(!item.label||!item.date)return;
    const up=(list,obj)=>{const i=list.findIndex(x=>x.id===obj.id);i>=0?list[i]=obj:list.push(obj);};
    if(ctx.mode==='actual')up(S.state.transactions,item);
    else if(ctx.mode==='plan-income')up(S.state.plan.incomes,{id:item.id,label:item.label,amount:item.amount,date:item.date,category:item.category});
    else up(S.state.plan.expenses,{id:item.id,label:item.label,amount:item.amount,date:item.date,category:item.category});
    S.save();toast('Đã lưu');close();render();
  }
  function del(){if(!ctx.editId||!confirm('Xóa mục này? Hành động này không thể hoàn tác.'))return;if(ctx.mode==='actual')S.state.transactions=S.state.transactions.filter(x=>x.id!==ctx.editId);else if(ctx.mode==='plan-income')S.state.plan.incomes=S.state.plan.incomes.filter(x=>x.id!==ctx.editId);else S.state.plan.expenses=S.state.plan.expenses.filter(x=>x.id!==ctx.editId);S.save();toast('Đã xóa mục');close();render();}
  const close=()=>{$sheet.innerHTML='';document.body.classList.remove('modal-open');};
  function openSettings(){
    document.body.classList.add('modal-open');
    $sheet.innerHTML=`<div class="sheet-backdrop"><section class="sheet" role="dialog" aria-modal="true"><div class="sheet__grab"></div><div class="sheet__head"><h2>Cài đặt</h2><button class="sheet__close" data-close aria-label="Đóng">×</button></div><div class="settings-group"><div class="settings-line"><label><span>Biên an toàn buffer</span><output id="safe-out">${S.state.settings.safetyRate}%</output></label><input id="safe" type="range" min="0" max="30" step="1" value="${S.state.settings.safetyRate}"></div><button class="btn" id="export">Xuất backup JSON</button><label class="btn file-btn"><input id="import" type="file" accept="application/json" hidden>Nhập backup JSON</label><button class="btn" id="reset">Khôi phục dữ liệu mẫu</button><div class="settings-danger"><button class="btn danger-strong" id="clear">Xóa toàn bộ dữ liệu</button></div></div><div class="about">© 2026 Rootcash</div></section></div>`;const bg=$sheet.querySelector('.sheet-backdrop');bg.addEventListener('click',e=>{if(e.target===bg)close();});$sheet.querySelector('[data-close]').addEventListener('click',close);const range=$sheet.querySelector('#safe');range.addEventListener('input',()=>{S.state.settings.safetyRate=Number(range.value);$sheet.querySelector('#safe-out').textContent=`${range.value}%`;S.save();});$sheet.querySelector('#export').addEventListener('click',exportBackup);$sheet.querySelector('#import').addEventListener('change',importBackup);$sheet.querySelector('#reset').addEventListener('click',()=>{if(confirm('Khôi phục dữ liệu mẫu? Dữ liệu hiện tại sẽ bị thay thế.')){S.replace(S.defaultState());toast('Đã khôi phục dữ liệu mẫu');close();render();}});$sheet.querySelector('#clear').addEventListener('click',clearAll);guard($sheet.querySelector('.sheet'));
  }
  function clearAll(){if(!confirm('Xóa toàn bộ dữ liệu Rootcash trên thiết bị này?')||!confirm('Xác nhận lần cuối: dữ liệu đã xóa không thể khôi phục.'))return;S.replace(S.emptyState());toast('Đã xóa toàn bộ dữ liệu');close();view='home';render();}
  function exportBackup(){const payload={format:'rootcash-backup',schemaVersion:1,exportedAt:new Date().toISOString(),data:S.state},blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`rootcash-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);}
  async function importBackup(e){const file=e.target.files?.[0];if(!file)return;try{const json=JSON.parse(await file.text()),data=json?.format==='rootcash-backup'?json.data:json;S.replace(S.migrate(data));toast('Đã nhập backup');close();render();}catch{toast('Backup không hợp lệ');}}
  function splash(){const el=document.querySelector('#splash'),reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;setTimeout(()=>el.classList.add('hidden'),reduced?80:900);}
  installGuards();render();splash();
})();
