(() => {
  'use strict';
  const RC=window.RootcashApp, C=RC.config, S=RC.store;
  RC.screens.home=()=>{
    const s=S.summary(), total=Math.max(1,s.expense);
    const rows=C.categories.map(c=>{const amount=s.byCategory[c.name]||0;if(!amount)return '';const pct=Math.round(amount/total*100);return `<div class="category-row">${C.categoryIcon(c)}<div class="category-main"><div class="category-line"><b>${c.name}</b><span>${C.fmtMoney(amount)}</span></div><div class="bar"><i style="--w:${pct}%;--c:${c.color}"></i></div></div><div class="percent">${pct}%</div></div>`;}).filter(Boolean).join('');
    return `<header class="topbar"><div class="brand-lockup"><div class="brand-copy"><h1>Rootcash</h1><p class="brand-sub">Copyright from Derekdaydoi</p></div></div><button class="icon-btn" data-settings aria-label="Cài đặt">${C.icon('gear')}</button></header><div class="card hero"><div class="hero-title"><h2>Tổng kết tháng này</h2><span>${C.monthLabel(C.currentMonthKey)}</span></div><div class="stats-grid"><div class="stat"><span>Thu nhập thực tế</span><strong>${C.fmtMoney(s.income)}</strong></div><div class="stat"><span>Chi phí thực tế</span><strong>${C.fmtMoney(s.expense)}</strong></div></div><div class="remaining"><span>Còn lại</span><strong>${C.fmtMoney(s.remaining)}</strong></div></div><div class="card section"><div class="section-title"><h2>Danh mục chi tiêu</h2><span class="meta">${C.fmtMoney(s.expense)}</span></div><div class="category-list">${rows||'<div class="empty-note">Chưa có chi tiêu tháng này</div>'}</div></div><button class="reminder" data-nav="plan"><span class="reminder__icon">${C.icon('calendar')}</span><b>Ngày 20 · Lập kế hoạch tháng sau</b><span class="chevron">›</span></button>`;
  };
})();
