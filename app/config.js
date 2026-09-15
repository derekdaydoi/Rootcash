(() => {
  'use strict';
  const RC = window.RootcashApp = window.RootcashApp || {};
  const now = new Date();
  const monthKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthKey = monthKey(now);
  const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthKey = monthKey(nextDate);

  const categories = [
    { name: 'Yêu đương', icon: 'heart', color: '#F08B73', tint: '#FFF0EB' },
    { name: 'Ăn uống', icon: 'food', color: '#69C96A', tint: '#EDFFE7' },
    { name: 'Thể thao', icon: 'sport', color: '#5AADE6', tint: '#EAF6FF' },
    { name: 'Xăng xe', icon: 'fuel', color: '#E8A75E', tint: '#FFF5E8' },
    { name: 'Dịch vụ nhà', icon: 'home-service', color: '#5FAE9C', tint: '#ECFAF6' },
    { name: 'Mua sắm', icon: 'shopping', color: '#EF7B8B', tint: '#FFF0F3' },
    { name: 'AI và học tập', icon: 'learning', color: '#8F82D9', tint: '#F2F0FF' },
    { name: 'Trading', icon: 'trading', color: '#DD8B53', tint: '#FFF1E7' },
    { name: 'Invest', icon: 'invest', color: '#4C9B61', tint: '#EAF8EE' },
  ];

  const incomeCategories = [
    { name: 'Lương', icon: 'salary' },
    { name: 'Business', icon: 'business' },
    { name: 'Thu nhập khác', icon: 'income-other' },
  ];

  const paths = {
    home:`<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>`,
    chart:`<path d="M5 20V10"/><path d="M12 20V4"/><path d="M19 20v-7"/>`,
    wallet:`<path d="M4 7a3 3 0 0 1 3-3h11v16H7a3 3 0 0 1-3-3V7Z"/><path d="M4 8h14"/><path d="M14 12h7v5h-7a2.5 2.5 0 0 1 0-5Z"/>`,
    calendar:`<path d="M5 4v3M19 4v3M4 9h16"/><rect x="4" y="5" width="16" height="15" rx="2"/>`,
    plus:`<path d="M12 5v14M5 12h14"/>`,
    gear:`<circle cx="12" cy="12" r="3"/><path d="M19.2 14.8a1.7 1.7 0 0 0 .3 1.8l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1.1 1.5v.2h-4v-.2a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1L4 16.7l.1-.1a1.7 1.7 0 0 0 .3-1.8A1.7 1.7 0 0 0 3 13.7h-.2v-4H3a1.7 1.7 0 0 0 1.4-1.1 1.7 1.7 0 0 0-.3-1.8L4 6.7l2.8-2.8.1.1a1.7 1.7 0 0 0 1.8.3A1.7 1.7 0 0 0 9.8 3v-.2h4V3a1.7 1.7 0 0 0 1.1 1.4 1.7 1.7 0 0 0 1.8-.3l.1-.1 2.8 2.8-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.4 1.1h.2v4h-.2a1.7 1.7 0 0 0-1.4 1Z"/>`,
    back:`<path d="m15 18-6-6 6-6"/>`,
    income:`<path d="M7 17h10"/><path d="M12 4v10"/><path d="m8 10 4 4 4-4"/>`,
    expense:`<path d="M7 7h10"/><path d="M12 20V10"/><path d="m8 14 4-4 4 4"/>`,
    shield:`<path d="M12 3 5 6v5c0 4.6 2.7 8.1 7 10 4.3-1.9 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>`,
    flexible:`<path d="M4 7a3 3 0 0 1 3-3h10v16H7a3 3 0 0 1-3-3Z"/><path d="M4 8h13"/><path d="M14 11h7v6h-7a3 3 0 0 1 0-6Z"/><path d="M17.5 14h.01"/>`,
    'income-flow':`<path d="m7 13 5-5 5 5"/><path d="M12 8v9"/>`,
    'expense-flow':`<path d="m7 11 5 5 5-5"/><path d="M12 16V7"/>`,
    salary:`<path d="M4 7h16v11H4z"/><path d="M7 7V5h10v2M8 12h8M8 15h5"/>`,
    business:`<path d="M4 8h16v11H4z"/><path d="M9 8V5h6v3M4 12h16M10 12v2h4v-2"/>`,
    'income-other':`<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9 10h5a2 2 0 0 1 0 4H9"/>`,
    heart:`<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>`,
    food:`<path d="M7 3v7M4 3v4a3 3 0 0 0 6 0V3M7 10v11"/><path d="M16 3v18M16 3c3 2 4 5 4 8h-4"/>`,
    sport:`<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>`,
    fuel:`<path d="M6 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16"/><path d="M6 10h11M9 6h5"/><path d="M17 8h2l2 2v7a2 2 0 0 1-4 0"/>`,
    'home-service':`<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/><path d="M17 5h3v4"/>`,
    shopping:`<path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>`,
    learning:`<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22V5.5Z"/><path d="m18.5 3 .5-1 .5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5Z"/>`,
    trading:`<path d="M6 4v16M18 4v16M12 4v16"/><rect x="4.5" y="7" width="3" height="5" rx="1"/><rect x="10.5" y="11" width="3" height="6" rx="1"/><rect x="16.5" y="6" width="3" height="8" rx="1"/>`,
    invest:`<path d="M4 18 9 13l3 3 8-9"/><path d="M15 7h5v5"/><path d="M4 21h16"/>`,
  };
  const icon = name => `<svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ''}</svg>`;
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  RC.config = {
    now, currentMonthKey, nextMonthKey, categories, incomeCategories,
    categoryNames: new Set(categories.map(c => c.name)),
    incomeCategoryNames: new Set(incomeCategories.map(c => c.name)),
    monthKey, dateInMonth:(key,day)=>`${key}-${String(day).padStart(2,'0')}`, uid:(p='id')=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`,
    fmtMoney:value=>`${Math.round(Number(value || 0)).toLocaleString('vi-VN')}đ`, shortDate:iso=>iso ? `${iso.split('-')[2]}/${iso.split('-')[1]}` : '--/--',
    monthLabel:key=>{const [y,m]=key.split('-').map(Number); return `Tháng ${m}, ${y}`;}, escapeHtml, icon,
    categoryIcon:c=>`<span class="category-icon" style="--cat-tint:${c.tint};--cat-color:${c.color}">${icon(c.icon)}</span>`
  };
})();
