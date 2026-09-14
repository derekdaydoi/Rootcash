(() => {
  'use strict';
  const RC=window.RootcashApp, C=RC.config;
  RC.screens = RC.screens || {};
  RC.screens.nav=active=>`<nav class="nav" aria-label="Điều hướng chính"><button class="nav-item ${active==='home'?'active':''}" data-nav="home">${C.icon('home')}<span>Hôm nay</span></button><button class="nav-item ${active==='cashflow'?'active':''}" data-nav="cashflow">${C.icon('chart')}<span>Dòng tiền</span></button><button class="nav-plus" data-add="actual" aria-label="Thêm giao dịch">${C.icon('plus')}</button><button class="nav-item ${active==='capital'?'active':''}" data-nav="capital">${C.icon('wallet')}<span>Vốn</span></button><button class="nav-item ${active==='plan'?'active':''}" data-nav="plan">${C.icon('calendar')}<span>Kế hoạch</span></button></nav>`;
  RC.screens.header=(title,left='',right='')=>`<div class="page-head">${left||'<span></span>'}<h1>${title}</h1>${right||'<span></span>'}</div>`;
})();
