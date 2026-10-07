(() => {
  'use strict';
  const D = window.Domain;
  const KEY = 'rootcash';
  const LEGACY_KEY = 'rootcash:v1';
  const $app = document.querySelector('#app');
  const $sheet = document.querySelector('#sheet');
  const $toast = document.querySelector('#toast');

  // ---------- helpers ----------
  const pad = n => String(n).padStart(2, '0');
  const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  const isoOf = d => `${keyOf(d)}-${pad(d.getDate())}`;
  const now = new Date();
  const curKey = keyOf(now);
  const group = n => String(Math.round(Math.abs(Number(n) || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const vnd = n => `${n < 0 ? '-' : ''}${group(n)}đ`;
  const short = v => v === 0 ? '0' : `${(+(v / 1e6).toFixed(1)).toString().replace('.', ',')}m`;
  const digits = v => String(v ?? '').replace(/[^0-9]/g, '');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const monthLabel = key => { const [y, m] = key.split('-'); return `Tháng ${Number(m)}, ${y}`; };
  const dateLabel = iso => { if (!iso) return 'Chọn ngày'; const [y, m, d] = iso.split('-'); return `ngày ${Number(d)} thg ${Number(m)}, ${y}`; };
  const weekday = iso => ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'][new Date(`${iso}T00:00:00`).getDay()];
  const pct = (a, b) => b > 0 ? clamp(Math.round(a / b * 100), 0, 100) : 0;

  const ICONS = {
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    flow: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
    stack: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    left: '<path d="m15 6-6 6 6 6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    pencil: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    up: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
    dn: '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
    in: '<path d="M17 7 7 17"/><path d="M17 17H7V7"/>',
    out: '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
    card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M8 7h7"/>',
    loan: '<path d="M5 19 19 5"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
    wallet: '<path d="M4 7a3 3 0 0 1 3-3h11v16H7a3 3 0 0 1-3-3V7Z"/><path d="M4 8h14"/><path d="M14 12h7v5h-7a2.5 2.5 0 0 1 0-5Z"/>',
    bank: '<path d="M3 10 12 4l9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
    invest: '<path d="M4 17 9 12l3 3 8-9"/><path d="M15 6h5v5"/>',
    case: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/>',
  };
  const icon = name => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  const guessIcon = (label, type) => {
    const t = String(label).toLowerCase();
    if (/nhà|thuê|điện|nước|wifi|internet/.test(t)) return 'home';
    if (/thẻ|card|visa/.test(t)) return 'card';
    if (/học|khóa|khoá|sách/.test(t)) return 'book';
    if (/góp|vay|nợ|lãi/.test(t)) return 'loan';
    if (/lương|thưởng/.test(t)) return 'wallet';
    return type === 'in' ? 'in' : 'out';
  };
  const ACCOUNT_TYPES = {
    cash: { name: 'Tiền mặt', icon: 'wallet' },
    bank: { name: 'Ngân hàng', icon: 'bank' },
    invest: { name: 'Đầu tư', icon: 'invest' },
    other: { name: 'Tài sản khác', icon: 'case' },
    debt: { name: 'Nợ', icon: 'card' },
  };

  // ---------- state ----------
  const empty = () => ({ entries: [], living: {}, accounts: [], history: {} });
  const normalize = raw => {
    const s = { ...empty(), ...(raw && typeof raw === 'object' ? raw : {}) };
    s.entries = Array.isArray(s.entries) ? s.entries : [];
    s.accounts = Array.isArray(s.accounts) ? s.accounts : [];
    s.living = s.living && typeof s.living === 'object' ? s.living : {};
    s.history = s.history && typeof s.history === 'object' ? s.history : {};
    return s;
  };
  const load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return normalize(JSON.parse(raw));
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) return normalize(D.migrateV1(JSON.parse(legacy)));
    } catch { /* fall through to empty */ }
    return empty();
  };
  let S = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast('Không lưu được dữ liệu'); } };
  const recordNetWorth = () => { if (S.accounts.length) S.history[curKey] = D.netWorth(S.accounts).net; };
  recordNetWorth();
  save();

  const ui = { tab: 'overview', month: curKey, filter: 'all' };
  const plan = () => D.monthPlan(S.entries, S.living, ui.month);

  // ---------- views ----------
  const head = (title, right, sub = '', logo = '') => `<header class="page-head"><div><div class="brand">${logo}<h1>${title}</h1></div>${sub}</div>${right}</header>`;
  const monthBtn = () => `<button class="month-btn" data-act="months">${monthLabel(ui.month)}${icon('down')}</button>`;
  const gearBtn = `<button class="icon-btn" data-act="settings" aria-label="Cài đặt">${icon('gear')}</button>`;
  const copyright = '<p class="copy">© Copyright from Derekdaydoi</p>';

  function barRow(label, value, percent, { neg = false, cls = '', text } = {}) {
    return `<div class="bar-row"><span>${label}</span><div><b class="${neg ? 'neg' : ''}">${text ?? vnd(value)}</b><div class="bar"><i class="${cls}" style="width:${percent}%"></i></div></div><em>${percent}%</em></div>`;
  }

  function chart(P) {
    const vals = P.points.map(p => p.balance).concat(0, P.low.balance);
    const verts = P.points.flatMap(p => p.trough === p.balance ? [[p.day, p.balance]] : [[p.day, p.trough], [p.day, p.balance]]);
    let mn = Math.min(...vals), mx = Math.max(...vals);
    if (mx - mn < 1e6) mx = mn + 1e6;
    const raw = (mx - mn) / 3, mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 5, 10].map(f => f * mag).find(s => s >= raw);
    const lo = Math.floor(mn / step) * step, hi = Math.ceil(mx / step) * step;
    const W = 300, H = 150;
    const X = d => (d - 1) / (P.days - 1) * W;
    const Y = v => (hi - v) / (hi - lo) * H;
    const pts = verts.map(([d, v]) => [X(d), Y(v)]);
    let line = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2;
      line += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
    }
    const ticks = [];
    for (let v = lo; v <= hi + 1; v += step) ticks.push(v);
    const grid = ticks.map(v => `<line x1="0" x2="${W}" y1="${Y(v)}" y2="${Y(v)}" stroke="#EEE9DF" stroke-width="1" vector-effect="non-scaling-stroke" ${v === 0 ? 'stroke-dasharray="4 4" stroke="#CFC9BB"' : ''}/>`).join('');
    const days = [1, 5, 10, 15, 20, 25, P.days];
    const lowX = X(P.low.day) / W * 100, lowY = Y(P.low.balance) / H * 100;
    const below = Y(P.low.balance) < 64;
    const lowDate = `${pad(P.low.day)}/${ui.month.slice(5)}`;
    return `<div class="chart">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E7D5B" stop-opacity=".22"/><stop offset="1" stop-color="#2E7D5B" stop-opacity="0"/></linearGradient></defs>
        ${grid}
        <path d="${line} L${W},${H} L0,${H} Z" fill="url(#fill)"/>
        <path d="${line}" fill="none" stroke="#0F3D2E" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      </svg>
      ${ticks.map(v => `<span class="y-lab" style="top:${Y(v) / H * 100}%">${short(v)}</span>`).join('')}
      ${days.map(d => `<span class="x-lab" style="left:${X(d) / W * 100}%">${d}</span>`).join('')}
      <i class="dot" style="left:${lowX}%;top:${lowY}%"></i>
      <div class="tip" style="left:${clamp(lowX, 24, 76)}%;top:${lowY}%;${below ? 'transform:translate(-50%,0);margin-top:12px' : ''}"><span>Thấp nhất</span><b class="${P.low.balance < 0 ? 'neg' : ''}">${vnd(P.low.balance)}</b><span>${lowDate}</span></div>
    </div><div class="chart-pad"></div>`;
  }

  function overview() {
    const P = plan();
    const W = D.netWorth(S.accounts);
    const deficit = P.net < 0;
    const hasData = P.rows.length > 0;
    const restNeg = P.rest < 0;
    const liquidOk = W.liquid >= P.buffer;
    return `${head('Rootcash', gearBtn, monthBtn(), '<img src="icons/logo.svg" alt="">')}
      <section class="hero ${deficit ? 'deficit' : ''}">
        <small>${deficit ? 'Thâm hụt dự kiến' : 'Thặng dư dự kiến'}</small>
        <div class="hero-row"><strong>${deficit ? '- ' : '+ '}${vnd(Math.abs(P.net))}</strong><span class="badge">${icon(deficit ? 'dn' : 'up')}</span></div>
        <div class="sub"><span>Thu ${vnd(P.inflow)}</span><span>Chi ${vnd(P.outflow)}</span></div>
      </section>
      <section class="card" data-act="living" role="button" tabindex="0">
        <div class="card-head"><h3>Sinh hoạt tháng ${Number(ui.month.slice(5))}</h3>${icon('pencil')}</div>
        ${barRow('Sinh hoạt', P.living, pct(P.living, P.net))}
        ${barRow(restNeg ? 'Thiếu hụt' : 'Chưa phân bổ', P.rest, restNeg ? 100 : pct(P.rest, P.net), { neg: restNeg, cls: restNeg ? 'warn' : 'dim' })}
        ${barRow('Đã xác nhận', 0, pct(P.done, P.rows.length), { cls: 'dim', text: `${P.done}/${P.rows.length} khoản` })}
      </section>
      <section class="card">
        <div class="card-head"><h3>Dòng tiền trong tháng</h3></div>
        ${hasData || P.living ? chart(P) : '<div class="empty">Chưa có khoản thu chi nào trong tháng này.<br>Thêm ở tab Dòng tiền để thấy biểu đồ.</div>'}
        <div class="duo">
          <div><span>Buffer cần giữ</span><b>${vnd(P.buffer)}</b></div>
          <div><span>Thanh khoản hiện có</span><b class="${W.liquid && P.buffer ? (liquidOk ? 'ok' : 'neg') : ''}">${vnd(W.liquid)}</b></div>
        </div>
      </section>
      ${copyright}`;
  }

  function flow() {
    const all = D.occurrences(S.entries, ui.month);
    const rows = all.filter(r => ui.filter === 'all' || r.type === ui.filter);
    const days = new Map();
    rows.forEach(r => { if (!days.has(r.date)) days.set(r.date, []); days.get(r.date).push(r); });
    const todayIso = isoOf(now);
    const isNow = ui.month === curKey;
    const dates = [...days.keys()];
    if (isNow && !days.has(todayIso)) { dates.push(todayIso); days.set(todayIso, []); dates.sort(); }
    const rowHtml = r => `<button class="row ${r.done ? '' : 'planned'}" data-act="edit" data-id="${esc(r.id)}">
      <span class="tile ${r.type}">${icon(guessIcon(r.label, r.type))}</span>
      <span class="main"><b>${esc(r.label)}</b><span>${r.type === 'in' ? 'Thu nhập' : (r.repeat ? 'Cố định' : 'Phát sinh')} · ${r.done ? (r.type === 'in' ? 'đã nhận' : 'đã chi') : 'dự kiến'}</span></span>
      <span class="amt ${r.type}">${r.type === 'in' ? '+' : '-'}${vnd(r.amount)}</span></button>`;
    const dayHtml = date => {
      const items = days.get(date), isToday = isNow && date === todayIso;
      return `<div class="tl-day ${isToday ? 'today' : ''} ${items.length ? '' : 'marker'}">
        <div class="tl-date"><b>${date.slice(8)}</b><small>${weekday(date)}</small></div>
        <div class="tl-rows">${items.length ? items.map(rowHtml).join('') : 'Hôm nay'}</div></div>`;
    };
    const seg = ['all', 'in', 'out'].map(f => `<button class="${ui.filter === f ? 'on' : ''}" data-act="filter" data-v="${f}">${{ all: 'Tất cả', in: 'Thu', out: 'Chi' }[f]}</button>`).join('');
    const body = rows.length
      ? `<div class="tl">${dates.map(dayHtml).join('')}</div>`
      : `<div class="empty">${all.length ? 'Không có khoản nào trong bộ lọc này.' : 'Chưa có khoản thu chi nào trong tháng này.'}${all.length ? '' : '<button class="btn primary fit" data-act="add">Thêm khoản đầu tiên</button>'}</div>`;
    return `${head('Dòng tiền', `<button class="icon-btn" data-act="today" aria-label="Về tháng này">${icon('calendar')}</button>`, monthBtn())}
      <div class="seg">${seg}</div>${body}`;
  }

  function sparkline(values) {
    if (values.length < 2) return '';
    const mn = Math.min(...values), mx = Math.max(...values), span = mx - mn || 1;
    const pts = values.map((v, i) => [i / (values.length - 1) * 130, 50 - (v - mn) / span * 42]);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    return `<svg class="spark" viewBox="0 0 130 56" preserveAspectRatio="none"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9BE3B8" stop-opacity=".35"/><stop offset="1" stop-color="#9BE3B8" stop-opacity="0"/></linearGradient></defs><path d="${line} L130,56 L0,56 Z" fill="url(#sg)"/><path d="${line}" fill="none" stroke="#9BE3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
  }

  function assets() {
    const W = D.netWorth(S.accounts);
    const keys = Object.keys(S.history).sort();
    const prev = keys.filter(k => k < curKey).pop();
    const delta = prev !== undefined ? W.net - S.history[prev] : null;
    const row = a => `<button class="row" data-act="acc" data-id="${esc(a.id)}">
      <span class="tile ${a.kind === 'debt' ? '' : 'neutral'}">${icon(ACCOUNT_TYPES[a.kind === 'debt' ? 'debt' : a.type]?.icon || 'case')}</span>
      <span class="main"><b>${esc(a.name)}</b></span>
      <span class="amt" style="${a.kind === 'debt' ? '' : 'color:var(--ink)'}">${vnd(a.balance)}</span>${icon('right').replace('class="i"', 'class="i chev"')}</button>`;
    const list = kind => S.accounts.filter(a => a.kind === kind);
    const block = (title, items) => items.length ? `<div class="sec"><h3>${title}</h3></div><div class="list">${items.map(row).join('')}</div>` : '';
    return `${head('Tài sản', gearBtn)}
      <section class="hero rel">
        <small>Tài sản ròng</small>
        <strong>${vnd(W.net)}</strong>
        ${delta === null ? '' : `<span class="delta ${delta < 0 ? 'down' : ''}">${delta < 0 ? '↓' : '↑'} ${vnd(Math.abs(delta))} so với tháng trước</span>`}
        ${sparkline(keys.slice(-6).map(k => S.history[k]))}
      </section>
      <div class="pair"><div class="card"><span>Tài sản</span><b>${vnd(W.assets)}</b></div><div class="card debt"><span>Nợ</span><b>${vnd(W.debts)}</b></div></div>
      <div class="sec"><h3>Tài khoản</h3><button class="link" data-act="acc">+ Thêm</button></div>
      ${S.accounts.length ? '' : '<div class="card empty">Thêm tiền mặt, ngân hàng, đầu tư hoặc khoản nợ để thấy tài sản ròng và thanh khoản.</div>'}
      ${list('asset').length ? `<div class="list">${list('asset').map(row).join('')}</div>` : ''}
      ${block('Nợ', list('debt'))}
      ${copyright}`;
  }

  const VIEWS = { overview, flow, assets };
  const NAV = [['overview', 'Tổng quan', 'home'], ['flow', 'Dòng tiền', 'flow'], ['assets', 'Tài sản', 'stack']];

  function render() {
    const prev = $app.querySelector('.scroll');
    const top = prev && prev.dataset.tab === ui.tab ? prev.scrollTop : 0;
    $app.innerHTML = `<div class="scroll" data-tab="${ui.tab}">${VIEWS[ui.tab]()}</div>
      ${ui.tab === 'flow' ? `<button class="fab" data-act="add" aria-label="Thêm khoản">${icon('plus')}</button>` : ''}
      <nav class="nav"><div class="nav-in">${NAV.map(([id, label, ic]) => `<button class="${ui.tab === id ? 'on' : ''}" data-act="tab" data-v="${id}">${icon(ic)}<span>${label}</span></button>`).join('')}</div></nav>`;
    $app.querySelector('.scroll').scrollTop = top;
  }

  // ---------- sheets ----------
  const toast = msg => {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg; $toast.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  };
  const openSheet = html => {
    $sheet.innerHTML = `<div class="backdrop" data-act="backdrop"><section class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</section></div>`;
    document.body.classList.add('locked');
  };
  const closeSheet = () => { $sheet.innerHTML = ''; document.body.classList.remove('locked'); };
  const sheetHead = title => `<div class="sheet-head"><h2>${title}</h2><button class="x" data-act="close" aria-label="Đóng">${icon('x')}</button></div>`;
  const moneyField = (name, value) => `<input class="input" name="${name}" inputmode="numeric" autocomplete="off" enterkeyhint="done" placeholder="0" value="${value ? group(value) : ''}" data-money>`;
  const dateField = (name, value) => `<div class="datebox"><span data-date-text>${dateLabel(value)}</span><input type="date" name="${name}" value="${value}" required></div>`;

  // entry (thu / chi)
  let entryDraft = null;
  function openEntry(id) {
    const occ = id ? D.occurrences(S.entries, ui.month).find(r => r.id === id) : null;
    entryDraft = occ
      ? { id, type: occ.type, label: occ.label, amount: occ.amount, date: occ.date, repeat: !!occ.repeat, done: occ.done, account: occ.account || '' }
      : { id: null, type: ui.filter === 'in' ? 'in' : 'out', label: '', amount: '', date: ui.month === curKey ? isoOf(now) : D.dateIn(ui.month, 1), repeat: false, done: false, account: (S.accounts.find(a => a.kind === 'asset' && (a.type === 'cash' || a.type === 'bank')) || {}).id || '' };
    paintEntry();
  }
  function paintEntry() {
    const d = entryDraft, isIn = d.type === 'in';
    openSheet(`${sheetHead(d.id ? 'Chỉnh sửa' : 'Thêm khoản')}
      <div class="seg"><button type="button" class="${isIn ? 'on' : ''}" data-act="etype" data-v="in">Thu</button><button type="button" class="${isIn ? '' : 'on'}" data-act="etype" data-v="out">Chi</button></div>
      <form data-form="entry" novalidate>
        <div class="field"><label>Tên khoản</label><input class="input" name="label" required autocomplete="off" placeholder="${isIn ? 'VD: Lương, lãi business' : 'VD: Tiền nhà, trả góp'}" value="${esc(d.label)}"></div>
        <div class="field"><label>Số tiền</label>${moneyField('amount', d.amount)}</div>
        <div class="field"><label>${isIn ? 'Ngày nhận' : 'Ngày chi'}</label>${dateField('date', d.date)}</div>
        ${S.accounts.some(a => a.kind === 'asset') ? `<div class="field"><label>Tài khoản</label><select class="input" name="account"><option value="">Không liên kết</option>${S.accounts.filter(a => a.kind === 'asset').map(a => `<option value="${esc(a.id)}" ${d.account === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div>` : ''}
        <label class="switch"><div>Lặp lại hàng tháng<small>Tự xuất hiện ở các tháng sau</small></div><input type="checkbox" name="repeat" ${d.repeat ? 'checked' : ''}></label>
        <label class="switch"><div>${isIn ? 'Đã nhận' : 'Đã chi'}<small>Tự cập nhật số dư tài khoản đã chọn</small></div><input type="checkbox" name="done" ${d.done ? 'checked' : ''}></label>
        <div class="actions">${d.id ? '<button type="button" class="btn danger fit" data-act="del-entry">Xóa</button>' : ''}<button type="button" class="btn" data-act="close">Huỷ</button><button class="btn primary" type="submit">Lưu</button></div>
      </form>`);
  }
  const readEntry = form => {
    const f = new FormData(form);
    return { ...entryDraft, label: String(f.get('label') || '').trim(), amount: digits(f.get('amount')), date: String(f.get('date') || ''), repeat: form.elements.repeat.checked, done: form.elements.done.checked, account: form.elements.account ? form.elements.account.value : '' };
  };
  function saveEntry(form) {
    const d = readEntry(form), amount = Number(d.amount);
    if (!d.label) { form.elements.label.focus(); return; }
    if (!Number.isSafeInteger(amount) || amount <= 0) { form.elements.amount.setCustomValidity('Số tiền phải lớn hơn 0'); form.elements.amount.reportValidity(); form.elements.amount.setCustomValidity(''); return; }
    if (!d.date) { form.elements.date.focus(); return; }
    const existing = S.entries.find(e => e.id === d.id);
    const doneKey = d.repeat ? ui.month : D.monthOf(d.date);
    const doneIn = new Set(existing && existing.repeat && d.repeat ? existing.doneIn : []);
    d.done ? doneIn.add(doneKey) : doneIn.delete(doneKey);
    // a recurring entry keeps its start month; only the day of month changes
    const date = existing && existing.repeat && d.repeat ? `${D.monthOf(existing.date)}-${d.date.slice(8, 10)}` : d.date;
    // Done entries move the linked account balance: undo the old effect, apply the new one.
    const shift = (acc, type, value, sign) => { const a = S.accounts.find(x => x.id === acc); if (a) a.balance += sign * (type === 'in' ? value : -value); };
    if (existing && (existing.doneIn || []).includes(existing.repeat ? ui.month : D.monthOf(existing.date))) shift(existing.account, existing.type, existing.amount, -1);
    if (d.done) shift(d.account, d.type, amount, 1);
    const entry = { id: d.id || uid(), type: d.type, label: d.label, amount, date, repeat: d.repeat, doneIn: [...doneIn], account: d.account };
    existing ? Object.assign(existing, entry) : S.entries.push(entry);
    recordNetWorth(); save(); closeSheet(); render(); toast('Đã lưu');
  }
  function deleteEntry() {
    const e = S.entries.find(x => x.id === entryDraft.id);
    if (!e) return;
    if (!confirm(e.repeat ? 'Xóa khoản lặp này khỏi tất cả các tháng?' : 'Xóa khoản này?')) return;
    S.entries = S.entries.filter(x => x.id !== e.id);
    save(); closeSheet(); render(); toast('Đã xóa');
  }

  // living block
  let livingCap = 1e7;
  function openLiving() {
    const P = plan();
    livingCap = Math.max(1e7, Math.ceil(Math.max(P.net, P.living) / 1e6) * 1e6);
    openSheet(`${sheetHead(`Sinh hoạt tháng ${Number(ui.month.slice(5))}`)}
      <form data-form="living">
        <div class="amount-box"><span>Ngân sách sinh hoạt</span>
          <div class="big"><input name="amount" inputmode="numeric" autocomplete="off" value="${group(P.living)}" data-living-input aria-label="Số tiền sinh hoạt">${icon('pencil')}</div>
          <input class="range" type="range" min="0" max="${livingCap}" step="100000" value="${Math.min(P.living, livingCap)}" data-living-range style="--p:${Math.min(P.living, livingCap) / livingCap * 100}%">
          <div class="range-lab"><span>0</span><span>${short(livingCap)}</span></div>
        </div>
        <div class="sumrows" data-net="${P.net}">
          <div><span>Khả dụng</span><b class="${P.net < 0 ? 'neg' : ''}">${vnd(P.net)}</b></div>
          <div><span>Sinh hoạt</span><b data-sum-living>${vnd(P.living)}</b></div>
          <div><span data-sum-label>${P.rest < 0 ? 'Thiếu hụt' : 'Chưa phân bổ'}</span><b data-sum-rest class="${P.rest < 0 ? 'neg' : 'ok'}">${vnd(P.rest)}</b></div>
        </div>
        <p class="hint">Khả dụng = tổng thu − tổng chi của tháng. Tháng chưa đặt sẽ dùng mức gần nhất.</p>
        <div class="actions"><button class="btn primary" type="submit">Lưu</button></div>
      </form>`);
  }
  function syncLiving(value, from) {
    const net = Number($sheet.querySelector('[data-net]').dataset.net), rest = net - value;
    const range = $sheet.querySelector('[data-living-range]'), input = $sheet.querySelector('[data-living-input]');
    if (from !== 'range') range.value = Math.min(value, livingCap);
    if (from !== 'input') input.value = group(value);
    range.style.setProperty('--p', `${Math.min(value, livingCap) / livingCap * 100}%`);
    $sheet.querySelector('[data-sum-living]').textContent = vnd(value);
    const r = $sheet.querySelector('[data-sum-rest]');
    r.textContent = vnd(rest); r.className = rest < 0 ? 'neg' : 'ok';
    $sheet.querySelector('[data-sum-label]').textContent = rest < 0 ? 'Thiếu hụt' : 'Chưa phân bổ';
  }

  // accounts (tài sản / nợ)
  let accDraft = null;
  function openAccount(id) {
    const a = S.accounts.find(x => x.id === id);
    accDraft = a ? { ...a } : { id: null, kind: 'asset', type: 'cash', name: '', balance: '' };
    paintAccount();
  }
  function paintAccount() {
    const d = accDraft, debt = d.kind === 'debt';
    openSheet(`${sheetHead(d.id ? 'Chỉnh sửa' : 'Thêm tài khoản')}
      <div class="seg"><button type="button" class="${debt ? '' : 'on'}" data-act="akind" data-v="asset">Tài sản</button><button type="button" class="${debt ? 'on' : ''}" data-act="akind" data-v="debt">Nợ</button></div>
      <form data-form="account" novalidate>
        <div class="field"><label>Tên</label><input class="input" name="name" required autocomplete="off" placeholder="${debt ? 'VD: Vay mua xe' : 'VD: Techcombank'}" value="${esc(d.name)}"></div>
        <div class="field"><label>${debt ? 'Số tiền nợ' : 'Số dư'}</label>${moneyField('balance', d.balance)}</div>
        ${debt ? '' : `<div class="field"><label>Loại</label><select class="input" name="type">${['cash', 'bank', 'invest', 'other'].map(t => `<option value="${t}" ${d.type === t ? 'selected' : ''}>${ACCOUNT_TYPES[t].name}</option>`).join('')}</select></div><p class="hint">Tiền mặt và Ngân hàng được tính là thanh khoản.</p>`}
        <div class="actions">${d.id ? '<button type="button" class="btn danger fit" data-act="del-acc">Xóa</button>' : ''}<button type="button" class="btn" data-act="close">Huỷ</button><button class="btn primary" type="submit">Lưu</button></div>
      </form>`);
  }
  function saveAccount(form) {
    const name = form.elements.name.value.trim(), balance = Number(digits(form.elements.balance.value));
    if (!name) { form.elements.name.focus(); return; }
    if (!Number.isSafeInteger(balance)) return;
    const debt = accDraft.kind === 'debt';
    const acc = { id: accDraft.id || uid(), kind: accDraft.kind, type: debt ? 'debt' : form.elements.type.value, name, balance };
    const i = S.accounts.findIndex(a => a.id === acc.id);
    i >= 0 ? S.accounts[i] = acc : S.accounts.push(acc);
    recordNetWorth(); save(); closeSheet(); render(); toast('Đã lưu');
  }

  // month picker
  let pickYear = 0;
  function openMonths() {
    pickYear = Number(ui.month.slice(0, 4));
    paintMonths();
  }
  function paintMonths() {
    openSheet(`${sheetHead('Chọn tháng')}
      <div class="year"><button class="icon-btn" data-act="year" data-v="-1" aria-label="Năm trước">${icon('left')}</button><span>${pickYear}</span><button class="icon-btn" data-act="year" data-v="1" aria-label="Năm sau">${icon('right')}</button></div>
      <div class="months">${Array.from({ length: 12 }, (_, i) => { const k = `${pickYear}-${pad(i + 1)}`; return `<button class="${k === ui.month ? 'on' : ''} ${k === curKey ? 'now' : ''}" data-act="month" data-v="${k}">Tháng ${i + 1}</button>`; }).join('')}</div>`);
  }

  // settings
  function openSettings() {
    openSheet(`${sheetHead('Cài đặt')}
      <div class="set-list">
        <button class="btn" data-act="export">Xuất backup JSON</button>
        <label class="btn"><input type="file" accept="application/json" data-import hidden>Nhập backup JSON</label>
        <button class="btn danger" data-act="clear">Xóa toàn bộ dữ liệu</button>
      </div>
      <p class="about">Rootcash · Personal Treasury<br>Kiểm soát dòng tiền. Tự do trong phần còn lại.<br>Dữ liệu chỉ lưu trên thiết bị này.<br>© Copyright from Derekdaydoi</p>`);
  }
  function exportBackup() {
    const blob = new Blob([JSON.stringify({ format: 'rootcash-backup', exportedAt: new Date().toISOString(), data: S }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `rootcash-${isoOf(now)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function importBackup(file) {
    try {
      const json = JSON.parse(await file.text());
      const data = json?.format === 'rootcash-backup' ? json.data : json;
      S = normalize(Array.isArray(data?.entries) ? data : D.migrateV1(data));
      recordNetWorth(); save(); closeSheet(); render(); toast('Đã nhập backup');
    } catch { toast('Backup không hợp lệ'); }
  }

  // ---------- events ----------
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act, v = el.dataset.v, id = el.dataset.id;
    if (act === 'backdrop') { if (e.target === el) closeSheet(); return; }
    const form = el.closest('form');
    switch (act) {
      case 'tab': ui.tab = v; render(); break;
      case 'filter': ui.filter = v; render(); break;
      case 'today': ui.month = curKey; render(); document.querySelector('.tl-day.today')?.scrollIntoView({ block: 'center' }); break;
      case 'months': openMonths(); break;
      case 'year': pickYear += Number(v); paintMonths(); break;
      case 'month': ui.month = v; closeSheet(); render(); break;
      case 'settings': openSettings(); break;
      case 'living': openLiving(); break;
      case 'add': openEntry(null); break;
      case 'edit': openEntry(id); break;
      case 'etype': entryDraft = { ...readEntry($sheet.querySelector('form')), type: v }; paintEntry(); break;
      case 'del-entry': deleteEntry(); break;
      case 'acc': openAccount(id || null); break;
      case 'akind': accDraft = { ...accDraft, name: $sheet.querySelector('[name="name"]').value, balance: digits($sheet.querySelector('[name="balance"]').value), kind: v, type: v === 'debt' ? 'debt' : (accDraft.type === 'debt' ? 'cash' : accDraft.type) }; paintAccount(); break;
      case 'del-acc':
        if (confirm('Xóa tài khoản này?')) { S.accounts = S.accounts.filter(a => a.id !== accDraft.id); recordNetWorth(); save(); closeSheet(); render(); toast('Đã xóa'); }
        break;
      case 'export': exportBackup(); break;
      case 'clear':
        if (confirm('Xóa toàn bộ dữ liệu trên thiết bị này?') && confirm('Xác nhận lần cuối: không thể khôi phục.')) { S = empty(); save(); closeSheet(); ui.tab = 'overview'; render(); toast('Đã xóa toàn bộ dữ liệu'); }
        break;
      case 'close': closeSheet(); break;
    }
    if (form && act === 'close') closeSheet();
  });

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.matches('[data-money]')) t.value = digits(t.value) ? group(digits(t.value)) : '';
    else if (t.matches('[data-living-input]')) { const n = Number(digits(t.value)) || 0; t.value = n ? group(n) : ''; syncLiving(n, 'input'); }
    else if (t.matches('[data-living-range]')) syncLiving(Number(t.value), 'range');
    else if (t.matches('input[type="date"]')) t.closest('.datebox').querySelector('[data-date-text]').textContent = dateLabel(t.value);
  });

  document.addEventListener('change', e => {
    if (e.target.matches('[data-import]') && e.target.files[0]) importBackup(e.target.files[0]);
    if (e.target.matches('input[type="date"]')) e.target.closest('.datebox').querySelector('[data-date-text]').textContent = dateLabel(e.target.value);
  });

  document.addEventListener('submit', e => {
    const form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    const kind = form.dataset.form;
    if (kind === 'entry') saveEntry(form);
    else if (kind === 'account') saveAccount(form);
    else if (kind === 'living') {
      S.living[ui.month] = Number(digits(form.elements.amount.value)) || 0;
      save(); closeSheet(); render(); toast('Đã lưu sinh hoạt');
    }
  });

  // keep the app shell from zooming / rubber-banding on iOS
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(n => document.addEventListener(n, e => e.preventDefault()));

  render();
})();
