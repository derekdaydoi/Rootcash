(() => {
  'use strict';

  const D = window.RootcashDomain;
  const STORAGE_KEY = 'rootcash:v1';
  const CATEGORIES = [
    { name: 'Ăn uống', icon: '🍴', color: '#67c96d', tint: '#ecffe7' },
    { name: 'Mua sắm', icon: '🛍️', color: '#f17787', tint: '#fff0f2' },
    { name: 'Thể thao', icon: '🏋️', color: '#5caee8', tint: '#ebf6ff' },
    { name: 'Yêu đương', icon: '♡', color: '#f49a6f', tint: '#fff0e9' },
    { name: 'Giải trí', icon: '🎮', color: '#a88de5', tint: '#f2efff' },
    { name: 'Khác', icon: '•••', color: '#aaa9a5', tint: '#f1f1ee' },
  ];

  const $app = document.querySelector('#app');
  const $sheetRoot = document.querySelector('#sheet-root');
  const $toastRoot = document.querySelector('#toast-root');

  const now = new Date();
  const currentMonthKey = monthKey(now);
  const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthKey = monthKey(nextDate);

  let state = loadState();
  let view = 'home';
  let sheetContext = { mode: 'actual', editId: null };

  function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  function dateInMonth(key, day) { return `${key}-${String(day).padStart(2, '0')}`; }
  function uid(prefix='id') { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`; }
  function fmtMoney(value) { return `${Math.round(Number(value || 0)).toLocaleString('vi-VN')}đ`; }
  function shortDate(iso) {
    if (!iso) return '--/--';
    const [,m,d] = iso.split('-');
    return `${d}/${m}`;
  }
  function monthLabel(key) {
    const [y,m] = key.split('-').map(Number);
    return `Tháng ${m}, ${y}`;
  }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function blankAllocations() {
    return Object.fromEntries(CATEGORIES.map(category => [category.name, 0]));
  }

  function emptyState() {
    return {
      schemaVersion: 1,
      transactions: [],
      plan: {
        month: nextMonthKey,
        incomes: [],
        expenses: [],
        allocations: blankAllocations(),
      },
      settings: { safetyRate: 10 },
    };
  }

  function defaultState() {
    const tx = [
      { id: uid('tx'), type:'income', label:'Lương & thu nhập', amount:27500000, date:dateInMonth(currentMonthKey, 9), category:'Thu nhập' },
      { id: uid('tx'), type:'expense', label:'Ăn uống', amount:4200000, date:dateInMonth(currentMonthKey, 7), category:'Ăn uống' },
      { id: uid('tx'), type:'expense', label:'Mua sắm', amount:3100000, date:dateInMonth(currentMonthKey, 10), category:'Mua sắm' },
      { id: uid('tx'), type:'expense', label:'Thể thao', amount:1200000, date:dateInMonth(currentMonthKey, 12), category:'Thể thao' },
      { id: uid('tx'), type:'expense', label:'Yêu đương', amount:2500000, date:dateInMonth(currentMonthKey, 14), category:'Yêu đương' },
      { id: uid('tx'), type:'expense', label:'Khác', amount:5800000, date:dateInMonth(currentMonthKey, 18), category:'Khác' },
    ];
    const incomes = [
      { id:uid('pin'), label:'Lương chính', amount:20000000, date:dateInMonth(nextMonthKey,9) },
      { id:uid('pin'), label:'Thưởng/ngoài', amount:4000000, date:dateInMonth(nextMonthKey,15) },
      { id:uid('pin'), label:'Thu khác', amount:5000000, date:dateInMonth(nextMonthKey,24) },
    ];
    const expenses = [
      { id:uid('pout'), label:'Tiền nhà', amount:5500000, date:dateInMonth(nextMonthKey,3), category:'Khác' },
      { id:uid('pout'), label:'Thẻ tín dụng', amount:4800000, date:dateInMonth(nextMonthKey,8), category:'Mua sắm' },
      { id:uid('pout'), label:'Sinh hoạt cố định', amount:6300000, date:dateInMonth(nextMonthKey,10), category:'Ăn uống' },
      { id:uid('pout'), label:'Dự phòng cá nhân', amount:2000000, date:dateInMonth(nextMonthKey,12), category:'Khác' },
    ];
    return {
      schemaVersion: 1,
      transactions: tx,
      plan: {
        month: nextMonthKey,
        incomes,
        expenses,
        allocations: {
          'Ăn uống': 3000000,
          'Mua sắm': 2500000,
          'Thể thao': 1200000,
          'Yêu đương': 2000000,
          'Giải trí': 1000000,
          'Khác': 700000,
        }
      },
      settings: { safetyRate: 10 },
    };
  }

  function migrate(raw) {
    if (!raw || typeof raw !== 'object') return defaultState();
    if (!raw.schemaVersion) raw.schemaVersion = 1;
    raw.transactions = Array.isArray(raw.transactions) ? raw.transactions : [];
    raw.plan = raw.plan || { month: nextMonthKey, incomes:[], expenses:[], allocations:{} };
    raw.plan.month = raw.plan.month || nextMonthKey;
    raw.plan.incomes = Array.isArray(raw.plan.incomes) ? raw.plan.incomes : [];
    raw.plan.expenses = Array.isArray(raw.plan.expenses) ? raw.plan.expenses : [];
    raw.plan.allocations = { ...blankAllocations(), ...(raw.plan.allocations || {}) };
    raw.settings = { safetyRate: 10, ...(raw.settings || {}) };
    return raw;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? migrate(JSON.parse(raw)) : defaultState();
    } catch { return defaultState(); }
  }
  function saveState(message) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (message) toast(message);
  }

  function toast(message) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    $toastRoot.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }

  function icon(name) {
    const common = `fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"`;
    const paths = {
      home:`<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>`,
      chart:`<path d="M5 20V10"/><path d="M12 20V4"/><path d="M19 20v-7"/>`,
      wallet:`<path d="M4 7a3 3 0 0 1 3-3h11v16H7a3 3 0 0 1-3-3V7Z"/><path d="M4 8h14"/><path d="M14 12h7v5h-7a2.5 2.5 0 0 1 0-5Z"/>`,
      calendar:`<path d="M5 4v3M19 4v3M4 9h16"/><rect x="4" y="5" width="16" height="15" rx="2"/>`,
      plus:`<path d="M12 5v14M5 12h14"/>`,
      gear:`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.05.05-2.83 2.83-.05-.05A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.05.05-2.83-2.83.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.05-.05 2.83-2.83.05.05A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.05-.05 2.83 2.83-.05.05A1.7 1.7 0 0 0 19.4 9c.4.27.76.63 1 1 .25.35.4.77.4 1.2v1.6c0 .43-.15.85-.4 1.2-.24.37-.6.73-1 1Z"/>`,
      back:`<path d="m15 18-6-6 6-6"/>`,
      bell:`<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>`,
      info:`<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>`,
    };
    return `<svg ${common}>${paths[name] || ''}</svg>`;
  }

  function planning() { return D.calculateBuffer(state.plan.incomes, state.plan.expenses, state.settings.safetyRate); }
  function summary() { return D.monthSummary(state.transactions, currentMonthKey); }

  function nav(active) {
    return `<nav class="nav" aria-label="Điều hướng chính">
      <button class="nav-item ${active==='home'?'active':''}" data-nav="home">${icon('home')}<span>Hôm nay</span></button>
      <button class="nav-item ${active==='cashflow'?'active':''}" data-nav="cashflow">${icon('chart')}<span>Dòng tiền</span></button>
      <button class="nav-plus" data-add="actual" aria-label="Thêm">${icon('plus')}</button>
      <button class="nav-item ${active==='capital'?'active':''}" data-nav="capital">${icon('wallet')}<span>Vốn</span></button>
      <button class="nav-item ${active==='plan'?'active':''}" data-nav="plan">${icon('calendar')}<span>Kế hoạch</span></button>
    </nav>`;
  }

  function homeScreen() {
    const s = summary();
    const expenseTotal = Math.max(1, s.expense);
    const rows = CATEGORIES.filter(c => c.name !== 'Giải trí' || s.byCategory[c.name]).map(c => {
      const amount = s.byCategory[c.name] || 0;
      if (!amount && !['Ăn uống','Mua sắm','Thể thao','Yêu đương','Khác'].includes(c.name)) return '';
      const pct = Math.round(amount / expenseTotal * 100);
      return `<div class="category-row">
        <div class="category-icon" style="background:${c.tint}">${c.icon}</div>
        <div class="category-main"><div class="category-line"><b>${c.name}</b><span>${fmtMoney(amount)}</span></div><div class="bar"><i style="--w:${pct}%;--c:${c.color}"></i></div></div>
        <div class="percent">${pct}%</div>
      </div>`;
    }).join('');
    return `<section class="screen">
      <header class="topbar">
        <div class="brand-lockup"><img class="brand-mark" src="assets/logo-mark.svg?v=2" alt=""><div class="brand-copy"><h1>Rootcash</h1><p>Chủ động tiền bạc, vững vàng tháng sau</p></div></div>
        <button class="icon-btn" data-settings aria-label="Cài đặt">${icon('gear')}</button>
      </header>
      <div class="card hero">
        <div class="hero-title"><h2>Tổng kết tháng này</h2><span>${monthLabel(currentMonthKey)}</span></div>
        <div class="stats-grid"><div class="stat"><span>Thu nhập thực tế</span><strong>${fmtMoney(s.income)}</strong></div><div class="stat"><span>Chi phí thực tế</span><strong>${fmtMoney(s.expense)}</strong></div></div>
        <div class="remaining"><span>Còn lại</span><strong>${fmtMoney(s.remaining)}</strong><small>${s.remaining >= 0 ? 'Bạn đang chủ động được dòng tiền.' : 'Chi phí đang vượt thu nhập tháng này.'}</small></div>
      </div>
      <div class="card section"><div class="section-title"><h2>Danh mục chi tiêu</h2><span class="meta">Tổng: ${fmtMoney(s.expense)}</span></div><div class="category-list">${rows}</div></div>
      <button class="reminder" data-nav="plan"><span class="reminder__icon">▣</span><span class="reminder__copy"><b>Ngày 20: Lập kế hoạch tháng sau</b><span>Nhập thu, chi và để Rootcash tính buffer cho bạn.</span></span><span>›</span></button>
      ${nav('home')}
    </section>`;
  }

  function cashflowScreen() {
    const rows = [...summary().rows].sort((a,b)=>b.date.localeCompare(a.date));
    return `<section class="screen">
      <div class="page-head"><span></span><div class="page-head__center"><h1>Dòng tiền</h1><p>Thực tế trong ${monthLabel(currentMonthKey).toLowerCase()}</p></div><button class="icon-btn" data-settings>${icon('gear')}</button></div>
      <div class="card section"><div class="section-title"><h2>Giao dịch tháng này</h2><span class="meta">${rows.length} mục</span></div>
      <div class="simple-list">${rows.map(tx=>`<button class="tx-row" data-edit-actual="${tx.id}" style="border:0;background:transparent;width:100%;text-align:left"><span class="tx-ico">${tx.type==='income'?'↗':'↘'}</span><span class="tx-copy"><b>${escapeHtml(tx.label)}</b><span>${shortDate(tx.date)} · ${escapeHtml(tx.category || '')}</span></span><span class="tx-amt ${tx.type==='expense'?'expense':''}">${tx.type==='expense'?'-':'+'}${fmtMoney(tx.amount)}</span></button>`).join('')}</div></div>
      ${nav('cashflow')}
    </section>`;
  }

  function capitalScreen() {
    const s = summary();
    const p = planning();
    const headroom = s.remaining - p.recommended;
    return `<section class="screen">
      <div class="page-head"><span></span><div class="page-head__center"><h1>Vốn</h1><p>Nhìn nhanh khả năng thanh khoản</p></div><button class="icon-btn" data-settings>${icon('gear')}</button></div>
      <div class="card capital-hero"><small>Tiền còn lại thực tế tháng này</small><strong>${fmtMoney(s.remaining)}</strong><span style="font-size:12px;color:${headroom>=0?'#287c3b':'#c04b4b'}">${headroom>=0?'Đủ buffer cho tháng sau':'Chưa đủ buffer khuyến nghị'}</span></div>
      <div class="capital-grid"><div class="capital-cell"><span>Buffer cần giữ</span><b>${fmtMoney(p.recommended)}</b></div><div class="capital-cell"><span>Headroom sau buffer</span><b>${fmtMoney(headroom)}</b></div><div class="capital-cell"><span>Khoảng hụt theo ngày</span><b>${fmtMoney(p.timingGap)}</b></div><div class="capital-cell"><span>Biên an toàn ${state.settings.safetyRate}%</span><b>${fmtMoney(p.safetyMargin)}</b></div></div>
      <div class="info-box">${icon('info')}<div>Rootcash tính buffer theo thứ tự ngày: nghĩa vụ được trừ trước, thu nhập nhận sau. Buffer = khoảng hụt lớn nhất + biên an toàn và được làm tròn lên 500.000đ.</div></div>
      ${nav('capital')}
    </section>`;
  }

  function planItem(item, kind) {
    return `<button class="plan-item" data-edit-plan="${item.id}" data-kind="${kind}"><span class="plan-item__ico">${kind==='income'?'↗':'↘'}</span><span class="plan-item__main"><span class="plan-item__label">${escapeHtml(item.label)}</span><span class="plan-item__amount">${fmtMoney(item.amount)}</span></span><span class="date-pill">${kind==='income'?'nhận ':''}${shortDate(item.date)}</span></button>`;
  }

  function planScreen() {
    const p = planning();
    return `<section class="screen">
      <div class="page-head"><button class="icon-btn" data-nav="home">${icon('back')}</button><div class="page-head__center"><h1>Kế hoạch tháng sau</h1><p>Lập kế hoạch hôm nay, an tâm ngày mai</p></div><button class="icon-btn" data-settings>${icon('gear')}</button></div>
      <div class="metrics">
        <div class="metric"><span class="metric__ico">↗</span><div><span>Thu nhập dự kiến</span><strong>${fmtMoney(p.totalIncome)}</strong></div></div>
        <div class="metric danger"><span class="metric__ico">↘</span><div><span>Chi phí dự kiến</span><strong>${fmtMoney(p.totalExpense)}</strong></div></div>
        <div class="metric"><span class="metric__ico">◇</span><div><span>Buffer cần giữ</span><strong>${fmtMoney(p.recommended)}</strong></div></div>
        <div class="metric"><span class="metric__ico">▣</span><div><span>Có thể chi linh hoạt</span><strong>${fmtMoney(p.flexible)}</strong></div></div>
      </div>
      <div class="card section"><div class="section-title"><h2>Thu nhập dự kiến</h2><button class="add-link" data-add="plan-income">＋ Thêm</button></div><div class="plan-list">${state.plan.incomes.map(i=>planItem(i,'income')).join('')}</div></div>
      <div class="card section"><div class="section-title"><h2>Chi phí phải trả</h2><button class="add-link" data-add="plan-expense">＋ Thêm</button></div><div class="plan-list">${state.plan.expenses.map(i=>planItem(i,'expense')).join('')}</div></div>
      <button class="insight" data-nav="allocation" style="width:100%;text-align:left"><span class="insight__icon">◉</span><span><b>Gợi ý: giữ ít nhất ${fmtMoney(p.recommended)}</b><span>để an toàn cho tháng sau.</span></span><span>›</span></button>
      ${nav('plan')}
    </section>`;
  }

  function allocationScreen() {
    const p = planning();
    const total = D.allocationTotal(state.plan.allocations);
    const max = Math.max(1000000, p.flexible);
    return `<section class="screen">
      <div class="page-head"><button class="icon-btn" data-nav="plan">${icon('back')}</button><div class="page-head__center"><h1>Phân bổ kế hoạch</h1><p>Chi tiêu có kế hoạch, cuộc sống nhẹ nhàng hơn</p></div><span></span></div>
      <div class="flex-budget"><span class="flex-budget__ico">▣</span><div><span>Ngân sách linh hoạt</span><strong>${fmtMoney(p.flexible)}</strong><small>Phân bổ cho các khoản chi tiêu trong tháng sau</small></div></div>
      <div class="card section"><div class="allocation-list">${CATEGORIES.map(c=>{
        const amount = Number(state.plan.allocations[c.name]||0); const pct = p.flexible ? Math.round(amount/p.flexible*100) : 0;
        return `<div class="allocation-row"><div class="category-icon" style="background:${c.tint}">${c.icon}</div><div class="allocation-row__main"><div class="allocation-row__head"><b>${c.name}</b><span>${pct}%</span></div><input class="range" style="--range-color:${c.color}" type="range" min="0" max="${max}" step="100000" value="${amount}" data-alloc="${c.name}"></div><div class="amount-chip">${fmtMoney(amount)}</div></div>`;
      }).join('')}</div><div class="alloc-summary ${total>p.flexible?'over':''}"><span>Đã phân bổ</span><strong>${fmtMoney(total)} / ${fmtMoney(p.flexible)}</strong></div></div>
      <div class="info-box">${icon('info')}<div>Rootcash chỉ giúp bạn lập kế hoạch, phân bổ và tính buffer. Mọi số liệu đều do bạn chủ động nhập và quyết định.</div></div>
      <button class="cta" data-save-plan>Lưu kế hoạch tháng sau</button>
      ${nav('plan')}
    </section>`;
  }

  function render() {
    const screens = { home:homeScreen, cashflow:cashflowScreen, capital:capitalScreen, plan:planScreen, allocation:allocationScreen };
    $app.innerHTML = (screens[view] || homeScreen)();
    bindUi();
    guardScrollEdges($app.querySelector('.screen'));
  }

  function bindUi() {
    $app.querySelectorAll('[data-nav]').forEach(btn=>btn.addEventListener('click',()=>{ view=btn.dataset.nav; render(); }));
    $app.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>openEditor(btn.dataset.add)));
    $app.querySelectorAll('[data-settings]').forEach(btn=>btn.addEventListener('click',openSettings));
    $app.querySelectorAll('[data-edit-actual]').forEach(btn=>btn.addEventListener('click',()=>openEditor('actual', btn.dataset.editActual)));
    $app.querySelectorAll('[data-edit-plan]').forEach(btn=>btn.addEventListener('click',()=>openEditor(btn.dataset.kind==='income'?'plan-income':'plan-expense', btn.dataset.editPlan)));
    $app.querySelectorAll('[data-alloc]').forEach(input=>input.addEventListener('input',()=>{
      state.plan.allocations[input.dataset.alloc] = Number(input.value);
      saveState();
      render();
    }));
    $app.querySelectorAll('[data-save-plan]').forEach(btn=>btn.addEventListener('click',()=>{ saveState('Đã lưu kế hoạch tháng sau'); view='plan'; render(); }));
  }

  function guardScrollEdges(scroller) {
    if (!scroller) return;
    let startY = 0;
    scroller.addEventListener('touchstart', event => {
      if (event.touches.length !== 1) return;
      startY = event.touches[0].clientY;
    }, { passive: true });
    scroller.addEventListener('touchmove', event => {
      if (event.touches.length !== 1) return;
      if (event.target.closest('input[type="range"]')) return;
      const currentY = event.touches[0].clientY;
      const delta = currentY - startY;
      const atTop = scroller.scrollTop <= 0;
      const atBottom = Math.ceil(scroller.scrollTop + scroller.clientHeight) >= scroller.scrollHeight;
      if ((atTop && delta > 0) || (atBottom && delta < 0)) event.preventDefault();
      startY = currentY;
    }, { passive: false });
  }

  function installViewportGuards() {
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(name => {
      document.addEventListener(name, event => event.preventDefault(), { passive: false });
    });
    document.addEventListener('touchmove', event => {
      if (event.touches && event.touches.length > 1) event.preventDefault();
    }, { passive: false });
    document.addEventListener('dblclick', event => event.preventDefault(), { passive: false });
  }

  function openEditor(mode='actual', editId=null) {
    sheetContext = { mode, editId };
    const isPlanIncome = mode==='plan-income';
    const isPlanExpense = mode==='plan-expense';
    let item = null;
    if (editId) {
      item = mode==='actual' ? state.transactions.find(x=>x.id===editId) : (isPlanIncome?state.plan.incomes:state.plan.expenses).find(x=>x.id===editId);
    }
    const defaultType = item?.type || 'expense';
    const defaultDate = item?.date || (mode==='actual' ? dateInMonth(currentMonthKey, Math.min(now.getDate(),28)) : dateInMonth(state.plan.month, 10));
    const defaultCategory = item?.category || 'Khác';
    $sheetRoot.innerHTML = `<div class="sheet-backdrop" data-close-backdrop><section class="sheet" role="dialog" aria-modal="true"><div class="sheet__grab"></div><div class="sheet__head"><h2>${editId?'Chỉnh sửa':'Thêm mục'}</h2><button class="sheet__close" data-close-sheet>×</button></div>
      ${mode==='actual'?`<div class="segment"><button data-seg="income" class="${defaultType==='income'?'active':''}">Thu thực tế</button><button data-seg="expense" class="${defaultType==='expense'?'active':''}">Chi thực tế</button><button data-seg="plan" class="">Kế hoạch</button></div>`:''}
      <form id="editor-form"><input type="hidden" name="type" value="${mode==='actual'?defaultType:(isPlanIncome?'income':'expense')}">
        <div class="form-grid"><div class="field full"><label>Tên khoản</label><input name="label" required value="${escapeHtml(item?.label||'')}" placeholder="VD: Lương chính, tiền nhà"></div>
        <div class="field"><label>Số tiền</label><input name="amount" type="number" min="0" step="1000" inputmode="numeric" required value="${item?.amount||''}" placeholder="0"></div>
        <div class="field"><label>${isPlanIncome?'Ngày nhận':'Ngày'}</label><input name="date" type="date" required value="${defaultDate}"></div>
        ${(!isPlanIncome)?`<div class="field full"><label>Danh mục</label><select name="category">${CATEGORIES.map(c=>`<option ${defaultCategory===c.name?'selected':''}>${c.name}</option>`).join('')}</select></div>`:''}</div>
        <div class="sheet-actions">${editId?'<button type="button" class="btn danger" data-delete>Xóa mục này</button>':'<button type="button" class="btn" data-close-sheet>Huỷ</button>'}<button class="btn primary" type="submit">${editId?'Lưu thay đổi':'Thêm'}</button></div>
      </form></section></div>`;
    bindSheet();
  }

  function bindSheet() {
    const backdrop = $sheetRoot.querySelector('.sheet-backdrop');
    backdrop?.addEventListener('click', e => { if (e.target===backdrop) closeSheet(); });
    $sheetRoot.querySelectorAll('[data-close-sheet]').forEach(b=>b.addEventListener('click', closeSheet));
    $sheetRoot.querySelectorAll('[data-seg]').forEach(b=>b.addEventListener('click',()=>{
      if (b.dataset.seg==='plan') { closeSheet(); openEditor('plan-expense'); return; }
      $sheetRoot.querySelectorAll('[data-seg]').forEach(x=>x.classList.toggle('active',x===b));
      $sheetRoot.querySelector('[name="type"]').value=b.dataset.seg;
    }));
    $sheetRoot.querySelector('#editor-form')?.addEventListener('submit', submitEditor);
    $sheetRoot.querySelector('[data-delete]')?.addEventListener('click', deleteCurrent);
  }

  function submitEditor(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const item = {
      id: sheetContext.editId || uid(sheetContext.mode==='actual'?'tx':'plan'),
      label: String(fd.get('label')||'').trim(),
      amount: Number(fd.get('amount')||0),
      date: String(fd.get('date')||''),
      category: String(fd.get('category')||'Khác'),
      type: String(fd.get('type')||'expense'),
    };
    if (!item.label || !item.amount || !item.date) return;
    if (sheetContext.mode==='actual') upsert(state.transactions,item);
    else if (sheetContext.mode==='plan-income') upsert(state.plan.incomes,{id:item.id,label:item.label,amount:item.amount,date:item.date});
    else upsert(state.plan.expenses,{id:item.id,label:item.label,amount:item.amount,date:item.date,category:item.category});
    saveState('Đã lưu'); closeSheet(); render();
  }

  function upsert(list,item) {
    const idx=list.findIndex(x=>x.id===item.id); if(idx>=0) list[idx]=item; else list.push(item);
  }

  function deleteCurrent() {
    const {mode,editId}=sheetContext;
    if(!editId) return;
    if (!confirm('Xóa mục này? Hành động này không thể hoàn tác.')) return;
    if(mode==='actual') state.transactions=state.transactions.filter(x=>x.id!==editId);
    else if(mode==='plan-income') state.plan.incomes=state.plan.incomes.filter(x=>x.id!==editId);
    else state.plan.expenses=state.plan.expenses.filter(x=>x.id!==editId);
    saveState('Đã xóa mục'); closeSheet(); render();
  }
  function closeSheet(){ $sheetRoot.innerHTML=''; }

  function openSettings() {
    $sheetRoot.innerHTML = `<div class="sheet-backdrop"><section class="sheet" role="dialog" aria-modal="true"><div class="sheet__grab"></div><div class="sheet__head"><h2>Cài đặt</h2><button class="sheet__close" data-close-sheet>×</button></div>
      <div class="settings-group"><div class="settings-line"><label><span>Biên an toàn buffer</span><output id="safety-output">${state.settings.safetyRate}%</output></label><input id="safety-range" type="range" min="0" max="30" step="1" value="${state.settings.safetyRate}"></div>
      <button class="btn" id="export-btn">Xuất backup JSON</button><label class="btn" style="display:grid;place-items:center"><input id="import-input" type="file" accept="application/json" hidden>Nhập backup JSON</label>
      <button class="btn" id="reset-btn">Khôi phục dữ liệu mẫu</button>
      <div class="settings-danger"><p>Xóa toàn bộ giao dịch, kế hoạch và phân bổ đang lưu trên thiết bị này.</p><button class="btn danger-strong" id="clear-btn">Xóa toàn bộ dữ liệu</button></div></div>
      <div class="about">Rootcash · local-first<br>© 2026 Rootcash</div></section></div>`;
    const sheet=$sheetRoot.querySelector('.sheet-backdrop'); sheet.addEventListener('click',e=>{if(e.target===sheet)closeSheet();});
    $sheetRoot.querySelector('[data-close-sheet]').addEventListener('click',closeSheet);
    const range=$sheetRoot.querySelector('#safety-range'); range.addEventListener('input',()=>{state.settings.safetyRate=Number(range.value); $sheetRoot.querySelector('#safety-output').textContent=`${range.value}%`; saveState();});
    $sheetRoot.querySelector('#export-btn').addEventListener('click',exportBackup);
    $sheetRoot.querySelector('#import-input').addEventListener('change',importBackup);
    $sheetRoot.querySelector('#reset-btn').addEventListener('click',()=>{if(confirm('Khôi phục dữ liệu mẫu? Dữ liệu hiện tại sẽ bị thay thế.')){state=defaultState();saveState('Đã khôi phục dữ liệu mẫu');closeSheet();render();}});
    $sheetRoot.querySelector('#clear-btn').addEventListener('click',clearAllData);
  }

  function clearAllData() {
    const first = confirm('Xóa toàn bộ dữ liệu Rootcash trên thiết bị này?');
    if (!first) return;
    const second = confirm('Xác nhận lần cuối: toàn bộ giao dịch, kế hoạch và phân bổ sẽ bị xóa và không thể hoàn tác.');
    if (!second) return;
    state = emptyState();
    saveState('Đã xóa toàn bộ dữ liệu');
    closeSheet();
    view = 'home';
    render();
  }

  function exportBackup(){
    const payload={format:'rootcash-backup',schemaVersion:1,exportedAt:new Date().toISOString(),data:state};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download=`rootcash-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
  }
  async function importBackup(e){
    const file=e.target.files?.[0]; if(!file)return; try{const json=JSON.parse(await file.text()); const data=json?.format==='rootcash-backup'?json.data:json; state=migrate(data);saveState('Đã nhập backup');closeSheet();render();}catch{toast('Backup không hợp lệ');}
  }

  function startSplash(){
    const splash=document.querySelector('#splash');
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const delay=reduced?80:950;
    setTimeout(()=>splash.classList.add('hidden'),delay);
  }

  installViewportGuards();
  if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  render(); startSplash();
})();
