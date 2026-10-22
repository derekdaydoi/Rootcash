(() => {
  'use strict';
  const D = window.Domain;
  const KEY = 'rootcash';
  const LEGACY = 'rootcash:v1';
  const $app = document.querySelector('#app');
  const $sheet = document.querySelector('#sheet');
  const $toast = document.querySelector('#toast');

  // ---------- formatting ----------
  const pad = D.pad;
  const now = new Date();
  const todayIso = D.isoOf(now);
  const curKey = D.monthOf(todayIso);
  const group = n => String(Math.round(Math.abs(Number(n) || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const vnd = n => `${n < 0 ? '−' : ''}${group(n)}đ`;
  // Millions for anything sizeable, exact dong for small change.
  const tr = n => Math.abs(n) < 1e5
    ? `${n < 0 ? '−' : ''}${group(n)}đ`
    : `${n < 0 ? '−' : ''}${String(Math.round(Math.abs(n) / 1e5) / 10).replace('.', ',')}tr`;
  const short = v => v === 0 ? '0' : `${Math.round(v / 1e6)}m`;
  const digits = v => String(v ?? '').replace(/[^0-9]/g, '');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const monthLabel = key => `Tháng ${Number(key.slice(5))}, ${key.slice(0, 4)}`;
  const monthShort = key => `Th ${Number(key.slice(5))}`;
  const dayMonth = iso => `${iso.slice(8)}/${iso.slice(5, 7)}`;
  const dateLabel = iso => iso ? `ngày ${Number(iso.slice(8))} thg ${Number(iso.slice(5, 7))}, ${iso.slice(0, 4)}` : 'Chọn ngày';
  const WD = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
  const WD_FULL = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const weekday = iso => WD[D.dateOf(iso).getDay()];
  const pct = (a, b) => b > 0 ? clamp(Math.round(a / b * 100), 0, 100) : 0;

  const ICONS = {
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    flow: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
    stack: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8 2 2 0 1 1-2.7 2.7 1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5 2 2 0 1 1-4 0 1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3 2 2 0 1 1-2.7-2.7 1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1 2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8 2 2 0 1 1 2.7-2.7 1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5 2 2 0 1 1 4 0 1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3 2 2 0 1 1 2.7 2.7 1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1 2 2 0 1 1 0 4 1.7 1.7 0 0 0-1.4 1Z"/>',
    list: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    left: '<path d="m15 6-6 6 6 6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    pencil: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    up: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
    dn: '<path d="M12 5v14"/><path d="m5 12 7 7 7-7"/>',
    warn: '<path d="M12 9v4M12 17h.01M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
    in: '<path d="M17 7 7 17"/><path d="M17 17H7V7"/>',
    out: '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M8 7h7"/>',
    loan: '<path d="M5 19 19 5"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
    wallet: '<path d="M4 7a3 3 0 0 1 3-3h11v16H7a3 3 0 0 1-3-3V7Z"/><path d="M4 8h14"/><path d="M14 12h7v5h-7a2.5 2.5 0 0 1 0-5Z"/>',
    bank: '<path d="M3 10 12 4l9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
    invest: '<path d="M4 17 9 12l3 3 8-9"/><path d="M15 6h5v5"/>',
    case: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  };
  const icon = (name, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  const rowIcon = r => {
    if (r.type === 'plan') return 'target';
    if (r.loan) return 'loan';
    const t = String(r.label).toLowerCase();
    if (/nhà|thuê|điện|nước|wifi|internet|dịch vụ/.test(t)) return 'home';
    if (/thẻ|visa|card|đáo/.test(t)) return 'card';
    if (/học|khóa|khoá|sách/.test(t)) return 'book';
    if (/góp|vay|nợ|lãi/.test(t)) return 'loan';
    if (/iphone|điện thoại/.test(t)) return 'phone';
    if (/lương|thưởng/.test(t)) return 'wallet';
    return r.type === 'in' ? 'in' : 'out';
  };
  const ACCOUNT_TYPES = {
    cash: { name: 'Tiền mặt', icon: 'wallet' },
    bank: { name: 'Ngân hàng', icon: 'bank' },
    invest: { name: 'Đầu tư', icon: 'invest' },
    other: { name: 'Tài sản khác', icon: 'case' },
    debt: { name: 'Nợ', icon: 'card' },
  };
  const DEFAULT_BUCKETS = ['Ăn uống', 'Mua sắm cá nhân', 'Dự phòng'];

  // ---------- state ----------
  const load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return D.migrate(JSON.parse(raw));
      const legacy = localStorage.getItem(LEGACY);
      if (legacy) return D.migrate(JSON.parse(legacy));
    } catch { /* fall through */ }
    return D.migrate(null);
  };
  let S = load();
  if (!S.buckets.length) S.buckets = DEFAULT_BUCKETS.slice();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast('Không lưu được dữ liệu'); } };
  const recordNetWorth = () => { if (S.accounts.length) S.history[curKey] = D.netWorth(S.accounts).net; };
  recordNetWorth(); save();

  const ui = { tab: 'overview', view: 'list', month: curKey, filter: 'all', range: 3, withLiving: false };
  const liquid = () => D.netWorth(S.accounts).liquid;
  const projection = () => D.series(S.entries, todayIso, ui.range * 31, liquid(), ui.withLiving ? S.living : null);

  // ---------- shared bits ----------
  const head = (title, right = '', sub = '', brand = false) => `<header class="page-head"><div>${
    brand ? `<div class="brand"><img src="icons/logo.svg" alt="">${`<h1>${title}</h1>`}</div>` : `<h1>${title}</h1>`
  }${sub}</div>${right}</header>`;
  const gearBtn = `<button class="icon-btn" data-act="settings" aria-label="Cài đặt">${icon('gear')}</button>`;
  const monthBtn = () => `<button class="month-btn" data-act="months">${monthLabel(ui.month)}${icon('down')}</button>`;
  const copyright = '<p class="copy">© Copyright from Derekdaydoi</p>';

  const entryRow = (r, { showDate = false } = {}) => {
    const kind = D.kindOf(r);
    const note = r.type === 'plan'
      ? `Kế hoạch · ${r.done ? 'đã chi' : 'đang tích'}`
      : `${r.type === 'in' ? 'Thu nhập' : r.loan ? `Tự tính · gốc ${tr(D.principalAt(r, r.month))}` : r.repeat ? 'Cố định' : 'Phát sinh'} · ${r.done ? (r.type === 'in' ? 'đã nhận' : 'đã chi') : 'dự kiến'}`;
    return `<button class="row ${r.done || kind === 'plan' ? '' : 'planned'}" data-act="edit" data-id="${esc(r.id)}" data-month="${r.month}">
      <span class="tile ${kind}">${icon(rowIcon(r))}</span>
      <span class="main"><b>${esc(r.label || '(không tên)')}</b><span>${showDate ? `${dayMonth(r.date)} · ` : ''}${note}</span></span>
      <span class="amt ${kind}">${kind === 'in' ? '+' : kind === 'out' ? '−' : ''}${group(r.amount)}đ</span></button>`;
  };

  // ---------- chart ----------
  // One continuous balance line: flat between transactions, a jump on the day
  // money moves. Only the dip and the final balance carry a number.
  function chart(points) {
    const W = 300, H = 180, PT = 14;
    const n = points.length;
    const vals = points.map(p => p.bal).concat(points.map(p => p.trough), 0);
    const span = Math.max(...vals) - Math.min(...vals);
    const magnitude = 10 ** Math.floor(Math.log10(Math.max(span / 4, 1)));
    const step = [1, 2, 2.5, 5, 10].map(f => f * magnitude).find(s => s >= span / 4) || magnitude;
    const ylo = Math.floor(Math.min(...vals) / step) * step;
    const yhi = Math.ceil(Math.max(...vals) / step) * step || step;
    const X = i => n < 2 ? W / 2 : i / (n - 1) * W;
    const Y = v => PT + (yhi - v) / (yhi - ylo || 1) * (H - PT);
    const low = D.lowestOf(points);
    const lowI = points.indexOf(low);
    const last = points[n - 1];

    let path = '';
    points.forEach((p, i) => { path += `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.bal).toFixed(1)} `; });

    let grid = '', labs = '';
    for (let v = ylo; v <= yhi + 1; v += step) {
      grid += `<line x1="0" x2="${W}" y1="${Y(v)}" y2="${Y(v)}" stroke="${v === 0 ? '#C9BFAE' : '#EFEADF'}" ${v === 0 ? 'stroke-dasharray="3 3"' : ''} vector-effect="non-scaling-stroke"/>`;
      labs += `<span class="y-lab" style="top:${Y(v) / H * 100}%">${v === 0 ? '0' : short(v)}</span>`;
    }
    [...new Set(points.map(p => p.month))].forEach(key => {
      const first = points.findIndex(p => p.month === key);
      const lastI = n - 1 - [...points].reverse().findIndex(p => p.month === key);
      labs += `<span class="x-lab" style="left:${(X(first) + X(lastI)) / 2 / W * 100}%;top:${H + 8}px">${monthShort(key)}</span>`;
    });

    const lowColor = low.trough < 0 ? '#C4473C' : '#0F3D2E';
    return `<div class="chartbox">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs><linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E7D5B" stop-opacity=".18"/><stop offset="1" stop-color="#2E7D5B" stop-opacity="0"/></linearGradient></defs>
        ${grid}
        ${ylo < 0 ? `<rect x="0" y="${Y(0)}" width="${W}" height="${H - Y(0)}" fill="#EFB3AB" opacity=".28"/>` : ''}
        <path d="${path}L${W},${Y(ylo)} L0,${Y(ylo)} Z" fill="url(#gf)"/>
        <path d="${path}" fill="none" stroke="#0F3D2E" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
        <circle cx="${X(lowI).toFixed(1)}" cy="${Y(low.trough).toFixed(1)}" r="4" fill="${lowColor}" stroke="#FBF8F2" stroke-width="2" vector-effect="non-scaling-stroke"/>
      </svg>
      ${labs}
      <span class="pt-lab pill" style="left:${clamp(X(lowI) / W * 100, 16, 84)}%;top:${Y(low.trough) / H * 100}%;transform:translate(-50%,0);margin-top:8px;color:${lowColor}">${tr(low.trough)} · ${dayMonth(low.iso)}</span>
      <span class="pt-lab pill" style="left:100%;top:${Y(last.bal) / H * 100}%;transform:translate(-100%,-100%);margin-top:-7px;color:#0F3D2E">${tr(last.bal)}</span>
    </div>`;
  }

  // ---------- screens ----------
  function overview() {
    const W = D.netWorth(S.accounts);
    const sum = D.monthSummary(S.entries, S.living, curKey);
    const hasFlow = S.entries.length > 0;
    if (!hasFlow && !S.accounts.length) {
      return `${head('Rootcash', gearBtn, '<span class="month-btn">Personal Treasury</span>', true)}
        <div class="card empty">Chưa có dữ liệu.<br>Thêm vài khoản thu chi để Rootcash dựng dòng tiền và buffer cho bạn.
          <button class="btn primary" data-act="add">Thêm khoản đầu tiên</button></div>${copyright}`;
    }
    const points = projection();
    const low = D.lowestOf(points);
    const risks = D.riskDays(points, 3);
    const restNeg = sum.rest < 0;
    return `${head('Rootcash', gearBtn, `<span class="month-btn">Dự phóng đến ${dayMonth(points[points.length - 1].iso)}</span>`, true)}
      <section class="hero ${low.trough < 0 ? 'down' : ''}">
        <small>Số dư hôm nay · Tiền mặt + Ngân hàng</small>
        <div class="hero-row"><strong>${vnd(W.liquid)}</strong><span class="badge">${icon(low.trough < 0 ? 'dn' : 'up')}</span></div>
        <div class="sub"><span>Thấp nhất <b>${dayMonth(low.iso)}</b> · <b>${tr(low.trough)}</b></span></div>
      </section>
      <section class="card" style="padding:14px 15px 12px">
        <div class="card-head"><h3>Dòng tiền liên tháng</h3>
          <div class="seg2">${[3, 6].map(r => `<button class="${ui.range === r ? 'on' : ''}" data-act="range" data-v="${r}">${r}T</button>`).join('')}</div>
        </div>
        <div class="lg"><span><i></i>Số dư cuối ngày</span>${low.trough < 0 ? '<span><i class="r"></i>Dưới 0</span>' : ''}</div>
        ${chart(points)}
        <div class="scrub">
          <div><span>Ngày thấp nhất</span><b>${dayMonth(low.iso)}</b></div>
          <div><span>Thu · Chi</span><b>+${tr(low.in)} · ${tr(-low.out)}</b></div>
          <div><span>Đáy trong ngày</span><b style="color:${low.trough < 0 ? 'var(--red)' : 'var(--ink)'}">${tr(low.trough)}</b></div>
        </div>
        <label class="switch" style="margin:11px 0 0"><div>Gồm sinh hoạt<small>Trừ đều ngân sách sinh hoạt theo ngày</small></div><input type="checkbox" data-act="with-living" ${ui.withLiving ? 'checked' : ''}></label>
      </section>
      ${risks.length ? `<section class="card" style="padding:4px 15px 8px"><div class="card-head" style="margin-top:10px"><h3>Ngày cần chuẩn bị tiền</h3></div>
        ${risks.map(p => `<button class="risk" data-act="day" data-v="${p.iso}">
          <span class="tile ${p.trough < 0 ? '' : 'neutral'}">${icon('warn')}</span>
          <div>${dayMonth(p.iso)}<small>Chi ${tr(p.out)} · Thu ${p.in ? tr(p.in) : '0'}</small></div>
          <em style="color:${p.trough < 0 ? 'var(--red)' : 'var(--ink)'}">${tr(p.trough)}</em></button>`).join('')}</section>` : ''}
      <button class="card" style="display:block;width:100%;text-align:left" data-act="living-screen">
        <div class="card-head"><h3>Sinh hoạt tháng ${Number(curKey.slice(5))}</h3>${icon('pencil')}</div>
        ${barRow('Sinh hoạt', sum.living, pct(sum.living, sum.net))}
        ${sum.reserve ? barRow('Kế hoạch', sum.reserve, pct(sum.reserve, sum.net), { cls: 'plan' }) : ''}
        ${barRow(restNeg ? 'Thiếu hụt' : 'Chưa phân bổ', sum.rest, restNeg ? 100 : pct(sum.rest, sum.net), { neg: restNeg, cls: restNeg ? 'warn' : 'dim' })}
      </button>
      ${copyright}`;
  }
  const barRow = (label, value, percent, { neg = false, cls = '', text } = {}) =>
    `<div class="bar-row"><span>${label}</span><div><b class="${neg ? 'neg' : ''}">${text ?? vnd(value)}</b><div class="bar"><i class="${cls}" style="width:${percent}%"></i></div></div><em>${percent}%</em></div>`;

  // months shown on the continuous timeline
  function timelineMonths() {
    const keys = new Set();
    for (let i = 0; i < 6; i++) keys.add(D.shiftMonth(curKey, i));
    const past = [...new Set(S.entries.map(e => D.monthOf(e.date)))].filter(k => k < curKey).sort().slice(-3);
    past.forEach(k => keys.add(k));
    return [...keys].sort();
  }

  function flow() {
    const open = liquid();
    const months = timelineMonths();
    const balances = {};
    projection().forEach(p => { balances[p.iso] = p; });

    const body = ui.view === 'cal' ? calendarView() : listView(months, balances);
    const points = projection();
    const low = D.lowestOf(points);
    const warn = low.trough < 0
      ? `<button class="warn" data-act="day" data-v="${low.iso}">${icon('warn')}<span><b>${dayMonth(low.iso)}</b> số dư xuống <b>${tr(low.trough)}</b> — cần chuẩn bị trước</span></button>`
      : '';
    const toggle = `<div class="tg">
      <button class="${ui.view === 'list' ? 'on' : ''}" data-act="view" data-v="list" aria-label="Danh sách">${icon('list')}</button>
      <button class="${ui.view === 'cal' ? 'on' : ''}" data-act="view" data-v="cal" aria-label="Lịch">${icon('calendar')}</button></div>`;
    const sub = ui.view === 'cal' ? monthBtn() : `<button class="month-btn" data-act="today">Hôm nay · ${dayMonth(todayIso)}</button>`;
    return `${head('Dòng tiền', toggle, sub)}
      ${ui.view === 'list' ? `<div class="seg">${['all', 'in', 'out', 'plan'].map(f =>
        `<button class="${ui.filter === f ? 'on' : ''}" data-act="filter" data-v="${f}">${({ all: 'Tất cả', in: 'Thu', out: 'Chi', plan: 'Kế hoạch' })[f]}</button>`).join('')}</div>` : ''}
      ${open === 0 && !S.accounts.length ? '' : warn}
      ${body}`;
  }

  function listView(months, balances) {
    let html = '';
    let any = false;
    months.forEach(key => {
      const rows = D.occurrences(S.entries, key)
        .filter(r => ui.filter === 'all' || (ui.filter === 'plan' ? r.type === 'plan' : D.kindOf(r) === ui.filter));
      const sum = D.monthSummary(S.entries, S.living, key);
      const days = new Map();
      rows.forEach(r => { if (!days.has(r.date)) days.set(r.date, []); days.get(r.date).push(r); });
      if (key === curKey && !days.has(todayIso)) days.set(todayIso, []);
      const dates = [...days.keys()].sort();
      if (!dates.length) return;
      any = true;
      const endIso = D.dateIn(key, D.daysIn(key));
      const endBal = balances[endIso];
      html += `<div class="mh">${monthLabel(key)}${endBal ? `<span>cuối tháng <b>${tr(endBal.bal)}</b></span>` : `<span>ròng ${tr(sum.net)}</span>`}</div><div class="tl">`;
      dates.forEach(date => {
        const items = days.get(date);
        const p = balances[date];
        const isToday = date === todayIso;
        html += `<div class="tl-day ${isToday ? 'today' : ''}">
          <div class="tl-date"><b>${date.slice(8)}</b><small>${weekday(date)}</small></div>
          <div class="tl-rows">`;
        if (!items.length) {
          html += `<div class="tl-now">Hôm nay · số dư ${p ? tr(p.bal) : vnd(liquid())}</div>`;
        } else {
          html += `<button class="dayline" data-act="day" data-v="${date}">
            <span><b class="p">Thu ${items.filter(r => D.kindOf(r) === 'in').length ? `+${tr(D.sum(items, 'in'))}` : '0'}</b> · <b class="n">Chi ${items.filter(r => D.kindOf(r) === 'out').length ? `−${tr(D.sum(items, 'out'))}` : '0'}</b></span>
            ${p ? `<b style="color:${p.bal < 0 ? 'var(--red)' : 'var(--ink)'}">Dư ${tr(p.bal)}</b>` : ''}</button>`;
          html += items.map(r => entryRow(r)).join('');
        }
        html += '</div></div>';
      });
      html += '</div>';
    });
    if (!any) {
      return `<div class="card empty">${S.entries.length ? 'Không có khoản nào trong bộ lọc này.' : 'Chưa có khoản thu chi nào.<br><button class="btn primary" data-act="add">Thêm khoản đầu tiên</button>'}</div>`;
    }
    return html;
  }

  function calendarView() {
    const key = ui.month;
    const n = D.daysIn(key);
    const offset = (D.dateOf(D.dateIn(key, 1)).getDay() + 6) % 7;
    const balances = {};
    projection().forEach(p => { balances[p.iso] = p; });
    const rows = D.occurrences(S.entries, key);
    const byDate = {};
    rows.forEach(r => { (byDate[r.date] = byDate[r.date] || []).push(r); });

    let cells = '';
    for (let i = 0; i < offset; i++) cells += '<div class="d mute"></div>';
    for (let day = 1; day <= n; day++) {
      const iso = D.dateIn(key, day);
      const items = byDate[iso] || [];
      const net = D.sum(items, 'in') - D.sum(items, 'out');
      const p = balances[iso];
      const neg = p && p.trough < 0;
      cells += `<button class="d ${neg ? 'neg' : ''} ${iso === todayIso ? 'today' : ''}" data-act="day" data-v="${iso}">
        <b>${pad(day)}</b>
        ${items.length ? `<s class="${net >= 0 ? 'p' : 'n'}">${net >= 0 ? '+' : '−'}${tr(net).replace('−', '')}</s>` : ''}
        ${p ? `<em>${tr(p.bal)}</em>` : ''}</button>`;
    }
    const rest = (offset + n) % 7;
    if (rest) for (let i = rest; i < 7; i++) cells += '<div class="d mute"></div>';

    const sum = D.monthSummary(S.entries, S.living, key);
    const monthPoints = Object.values(balances).filter(p => p.month === key);
    const low = monthPoints.length ? D.lowestOf(monthPoints) : null;
    return `<div class="calhead">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => `<span>${d}</span>`).join('')}</div>
      <div class="cal">${cells}</div>
      <p class="calnote">Dòng giữa: ròng trong ngày${monthPoints.length ? ' · dòng mờ dưới cùng: số dư cuối ngày' : ''}</p>
      <div class="calsum">
        <div><span>Thu</span><b style="color:var(--green)">${tr(sum.inflow)}</b></div>
        <div><span>Chi</span><b style="color:var(--red)">${tr(sum.outflow)}</b></div>
        <div><span>Ròng</span><b>${sum.net >= 0 ? '+' : ''}${tr(sum.net)}</b></div>
      </div>
      ${low ? `<section class="card" style="margin-top:11px;padding:13px 15px"><div class="card-head" style="min-height:0;margin-bottom:5px"><h3>Số dư thấp nhất tháng</h3><b style="color:${low.trough < 0 ? 'var(--red)' : 'var(--ink)'}">${tr(low.trough)}</b></div>
        <span class="hint" style="margin:0">Ngày ${dayMonth(low.iso)}${low.rows.length ? `, sau khi ${low.rows.filter(r => D.kindOf(r) === 'out').map(r => esc(r.label)).join(', ') || 'các khoản chi'}` : ''}.</span></section>` : ''}`;
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
    const fund = D.reservedFund(S.entries, curKey);
    const keys = Object.keys(S.history).sort();
    const prev = keys.filter(k => k < curKey).pop();
    const delta = prev !== undefined ? W.net - S.history[prev] : null;
    const row = a => `<button class="row" data-act="acc" data-id="${esc(a.id)}">
      <span class="tile ${a.kind === 'debt' ? '' : 'neutral'}">${icon((ACCOUNT_TYPES[a.kind === 'debt' ? 'debt' : a.type] || ACCOUNT_TYPES.other).icon)}</span>
      <span class="main"><b>${esc(a.name)}</b><span>${(ACCOUNT_TYPES[a.kind === 'debt' ? 'debt' : a.type] || ACCOUNT_TYPES.other).name}</span></span>
      <span class="amt" ${a.kind === 'debt' ? '' : 'style="color:var(--ink)"'}>${group(a.balance)}đ</span>${icon('right', 'i chev')}</button>`;
    const list = kind => S.accounts.filter(a => a.kind === kind);
    return `${head('Tài sản', gearBtn)}
      <section class="hero rel">
        <small>Tài sản ròng</small>
        <strong>${vnd(W.net)}</strong>
        ${delta === null ? '' : `<span class="delta ${delta < 0 ? 'down' : ''}">${delta < 0 ? '↓' : '↑'} ${tr(Math.abs(delta))} so với tháng trước</span>`}
        ${sparkline(keys.slice(-6).map(k => S.history[k]))}
      </section>
      <div class="pair"><div class="card"><span>Tài sản</span><b>${vnd(W.assets)}</b></div><div class="card debt"><span>Nợ</span><b>${vnd(W.debts)}</b></div></div>
      <div class="sec"><h3>Tài khoản</h3><button class="link" data-act="acc">+ Thêm</button></div>
      ${S.accounts.length ? '' : '<div class="card empty">Thêm tiền mặt, ngân hàng, đầu tư hoặc khoản nợ. Số dư ở đây do bạn tự nhập và là điểm xuất phát cho biểu đồ dòng tiền.</div>'}
      ${list('asset').length ? `<div class="list">${list('asset').map(row).join('')}</div>` : ''}
      ${list('debt').length ? `<div class="sec"><h3>Nợ</h3></div><div class="list">${list('debt').map(row).join('')}</div>` : ''}
      ${fund.total ? `<div class="sec"><h3>Quỹ kế hoạch</h3><span>${vnd(fund.total)}</span></div>
        <div class="list">${fund.items.map(i => `<button class="row" data-act="edit" data-id="${esc(i.id)}" data-month="${i.month}">
          <span class="tile plan">${icon('target')}</span>
          <span class="main"><b>${esc(i.label)}${i.count > 1 ? ` ×${i.count}` : ''}</b><span>Chưa chi · nằm trong tài sản</span></span>
          <span class="amt" style="color:var(--ink)">${group(i.amount)}đ</span>${icon('right', 'i chev')}</button>`).join('')}</div>
        <p class="hint">Quỹ này đã nằm trong số dư tài khoản của bạn. Thanh khoản tự do: ${vnd(W.liquid - fund.total)}.</p>` : ''}
      ${copyright}`;
  }

  function livingScreen() {
    const key = ui.month;
    const amount = D.livingFor(S.living, key);
    const alloc = D.allocationsFor(S.allocations, key);
    const used = S.buckets.reduce((t, b) => t + (Number(alloc[b]) || 0), 0);
    const left = amount - used;
    const cap = Math.max(15e6, Math.ceil(amount / 1e6) * 1e6);
    const fixed = D.occurrences(S.entries, key).filter(r => r.repeat && D.kindOf(r) === 'out');
    const fixedTotal = fixed.reduce((t, r) => t + r.amount, 0);
    const sum = D.monthSummary(S.entries, S.living, key);
    const neg = sum.rest < 0;
    return `${head('Sinh hoạt', `<button class="icon-btn" data-act="tab" data-v="overview" aria-label="Quay lại">${icon('left')}</button>`, monthBtn())}
      <section class="card" style="padding:14px 15px">
        <span style="font-size:12.5px;color:var(--muted)">Sinh hoạt ước tính ${monthLabel(key).toLowerCase()}</span>
        <div class="big"><input data-living-input inputmode="numeric" autocomplete="off" value="${group(amount)}" aria-label="Sinh hoạt ước tính">${icon('pencil')}</div>
        <input class="range" type="range" min="0" max="${cap}" step="100000" value="${Math.min(amount, cap)}" data-living-range style="--p:${cap ? Math.min(amount, cap) / cap * 100 : 0}%">
        <div class="range-lab"><span>0</span><b data-per-day>≈ ${group(Math.round(amount / D.daysIn(key)))}đ / ngày</b><span>${short(cap)}</span></div>
      </section>
      <section class="sumrows">
        <div><span>Tổng thu</span><b class="ok">+${group(sum.inflow)}đ</b></div>
        <div><span>Tổng chi</span><b class="neg">−${group(sum.outflow)}đ</b></div>
        ${sum.reserve ? `<div><span>Kế hoạch để dành</span><b class="neg">−${group(sum.reserve)}đ</b></div>` : ''}
        <div><span>Sinh hoạt ước tính</span><b class="neg">−${group(amount)}đ</b></div>
        <div class="total"><span>${neg ? 'Thiếu hụt' : 'Còn lại'}</span><b class="${neg ? 'neg' : 'ok'}">${sum.rest >= 0 ? '+' : '−'}${group(sum.rest)}đ</b></div>
      </section>
      <p class="hint">Sinh hoạt ước tính là mức bạn tự đặt, không phải khoản chi trong dòng tiền. Tháng chưa đặt sẽ dùng mức gần nhất.</p>
      <div class="sec"><h3>Chia nhỏ (tuỳ chọn)</h3><button class="link" data-act="add-bucket">+ Thêm mục</button></div>
      <section class="card" style="padding:3px 15px">
        ${S.buckets.map(b => {
          const v = Number(alloc[b]) || 0;
          return `<div class="alloc"><button data-act="rename" data-v="${esc(b)}"><b>${esc(b)}</b></button><button data-act="set-alloc" data-v="${esc(b)}"><b>${vnd(v)}</b></button><div class="bar"><i style="width:${pct(v, amount)}%"></i></div></div>`;
        }).join('')}
        <div class="alloc"><b style="color:${left < 0 ? 'var(--red)' : 'var(--green)'}">${left < 0 ? 'Vượt mức' : 'Chưa chia'}</b><b style="color:${left < 0 ? 'var(--red)' : 'var(--green)'}">${vnd(left)}</b></div>
      </section>
      <p class="hint">Chia nhỏ chỉ để bạn hình dung, không ảnh hưởng phép tính ở trên. Đổi mức sinh hoạt thì các mục về 0.</p>
      ${fixed.length ? `<section class="card" style="margin-top:12px;padding:12px 15px">
        <div class="card-head" style="min-height:0;margin-bottom:3px"><h3>Cố định (lặp hàng tháng)</h3><b>${vnd(fixedTotal)}</b></div>
        ${fixed.map(r => `<div class="fixed"><span>${esc(r.label)}</span><span>${group(r.amount)}đ</span></div>`).join('')}
        <p class="hint" style="margin-bottom:0">Các khoản này đã nằm trong Tổng chi, không cộng thêm vào sinh hoạt.</p>
      </section>` : ''}`;
  }

  const VIEWS = { overview, flow, assets, living: livingScreen };
  const NAV = [['overview', 'Tổng quan', 'home'], ['flow', 'Dòng tiền', 'flow'], ['assets', 'Tài sản', 'stack']];

  function render(keepScroll = true) {
    const prev = $app.querySelector('.scroll');
    const top = keepScroll && prev && prev.dataset.tab === ui.tab ? prev.scrollTop : 0;
    const active = ui.tab === 'living' ? 'overview' : ui.tab;
    $app.innerHTML = `<div class="scroll" data-tab="${ui.tab}">${VIEWS[ui.tab]()}</div>
      ${ui.tab === 'flow' ? `<button class="fab" data-act="add" aria-label="Thêm khoản">${icon('plus')}</button>` : ''}
      <nav class="nav"><div class="nav-in">${NAV.map(([id, label, ic]) =>
        `<button class="${active === id ? 'on' : ''}" data-act="tab" data-v="${id}">${icon(ic)}<span>${label}</span></button>`).join('')}</div></nav>`;
    const scroll = $app.querySelector('.scroll');
    scroll.scrollTop = top;
    if (!top && ui.tab === 'flow' && ui.view === 'list') {
      const today = scroll.querySelector('.tl-day.today');
      if (today) scroll.scrollTop = Math.max(0, today.offsetTop - 120);
    }
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

  // entry editor
  let draft = null;
  function openEntry(id, month) {
    const key = month || ui.month;
    const e = S.entries.find(x => x.id === id);
    if (e) {
      const row = D.occurrences([e], key)[0];
      draft = {
        id, type: e.type, label: e.label, amount: row ? row.amount : e.amount,
        date: row ? row.date : e.date, repeat: !!e.repeat, done: row ? row.done : false,
        month: key, loan: e.loan ? { ...e.loan } : null, useLoan: !!e.loan,
        skip: (e.skip || []).includes(key), until: e.until || '',
      };
    } else {
      const start = ui.tab === 'flow' && ui.view === 'cal' ? ui.month : curKey;
      draft = {
        id: null, type: ui.filter === 'in' || ui.filter === 'plan' ? ui.filter : 'out',
        label: '', amount: '', date: start === curKey ? todayIso : D.dateIn(start, 1),
        repeat: false, done: false, month: start, loan: null, useLoan: false, skip: false, until: '',
      };
    }
    paintEntry();
  }
  function paintEntry() {
    const d = draft;
    const T = {
      in: { place: 'VD: Lương, lãi business', date: 'Ngày nhận', repeat: 'Tự xuất hiện ở các tháng sau', done: 'Đã nhận', sub: 'Xác nhận khoản này đã thực hiện' },
      out: { place: 'VD: Tiền nhà, trả góp', date: 'Ngày chi', repeat: 'Tự xuất hiện ở các tháng sau', done: 'Đã chi', sub: 'Xác nhận khoản này đã thực hiện' },
      plan: { place: 'VD: Quỹ đi chơi', date: 'Ngày dự kiến', repeat: 'Tích đều mỗi tháng', done: 'Đã chi', sub: 'Chỉ bật khi đã thực sự chi' },
    }[d.type];
    const loanable = d.repeat && d.type === 'out';
    let preview = '';
    if (loanable && d.useLoan && d.loan) {
      const probe = { date: `${D.monthOf(d.date)}-01`, loan: d.loan, override: {} };
      const head = d.loan.withPrincipal ? 'gốc + lãi' : 'lãi';
      preview = '<table class="mini">' + [0, 1, 2, 3, 4].map(k => {
        const m = D.shiftMonth(d.month, k);
        const left = D.principalAt(probe, m);
        if (left <= 0) return '';
        return `<tr class="${k ? '' : 'hl'}"><td>Tháng ${Number(m.slice(5))} · dư nợ ${tr(left)}</td><td>${group(D.amountFor(probe, m))}đ</td></tr>`;
      }).join('') + '</table>' + `<p class="hint">Bảng trên là ${head} mỗi tháng. ${
        Number(d.loan.amortize) > 0 ? 'Hết gốc thì khoản này tự biến mất.' : 'Lãi phẳng vì không trả gốc, nên cần đặt kỳ cuối.'}</p>`;
    }
    openSheet(`${sheetHead(d.id ? 'Chỉnh sửa' : 'Thêm khoản')}
      <div class="seg">${[['in', 'Thu'], ['out', 'Chi'], ['plan', 'Kế hoạch']].map(([v, l]) =>
        `<button type="button" class="${d.type === v ? 'on' : ''}" data-act="etype" data-v="${v}">${l}</button>`).join('')}</div>
      <form data-form="entry" novalidate>
        <div class="field"><label>Tên khoản</label><input class="input" name="label" required autocomplete="off" placeholder="${T.place}" value="${esc(d.label)}"></div>
        ${loanable && d.useLoan ? '' : `<div class="field"><label>Số tiền</label>${moneyField('amount', d.amount)}</div>`}
        <div class="field"><label>${T.date}</label>${dateField('date', d.date)}</div>
        <label class="switch"><div>Lặp lại hàng tháng<small>${T.repeat}</small></div><input type="checkbox" name="repeat" data-act="erepeat" ${d.repeat ? 'checked' : ''}></label>
        ${d.repeat ? `<div class="field"><label>Kỳ cuối (để trống nếu không có hạn)</label><input class="input" name="until" type="month" value="${esc(d.until)}" placeholder="2028-02"></div>` : ''}
        ${loanable ? `<label class="switch"><div>Tự tính theo dư nợ<small>Lãi giảm dần theo gốc còn lại</small></div><input type="checkbox" name="useLoan" data-act="eloan" ${d.useLoan ? 'checked' : ''}></label>` : ''}
        ${loanable && d.useLoan ? `<div class="two">
            <div class="field"><label>Dư nợ gốc</label>${moneyField('principal', d.loan.principal)}</div>
            <div class="field"><label>Lãi suất / năm (%)</label><input class="input" name="rate" inputmode="decimal" autocomplete="off" value="${d.loan.rate || ''}" placeholder="20"></div>
          </div>
          <div class="field"><label>Trả gốc mỗi tháng</label>${moneyField('amortize', d.loan.amortize)}</div>
          <label class="switch"><div>Gồm cả gốc<small>Số tiền ra khỏi tài khoản là gốc + lãi</small></div><input type="checkbox" name="withPrincipal" data-act="ewp" ${d.loan.withPrincipal ? 'checked' : ''}></label>
          ${preview}` : ''}
        <label class="switch" style="margin-top:9px"><div>${T.done}<small>${T.sub}</small></div><input type="checkbox" name="done" ${d.done ? 'checked' : ''}></label>
        ${d.id && d.repeat ? `<label class="switch"><div>Bỏ qua tháng ${Number(d.month.slice(5))}<small>Khoản này không xuất hiện trong tháng ${Number(d.month.slice(5))}</small></div><input type="checkbox" name="skip" ${d.skip ? 'checked' : ''}></label>` : ''}
        ${d.type === 'plan' ? '<p class="hint">Kế hoạch là tiền để dành: chưa tính là chi và vẫn nằm trong tài sản cho tới khi bạn bật Đã chi.</p>' : ''}
        ${d.id && d.repeat
          ? `<div class="actions"><button type="button" class="btn" data-act="save-month">Chỉ tháng này</button><button class="btn primary" type="submit">Từ tháng này trở đi</button></div>
             <div class="actions center"><button type="button" class="btn ghost" data-act="del-entry">Xóa khoản</button></div>`
          : `<div class="actions">${d.id ? '<button type="button" class="btn danger fit" data-act="del-entry">Xóa</button>' : '<button type="button" class="btn" data-act="close">Huỷ</button>'}<button class="btn primary" type="submit">Lưu</button></div>`}
      </form>`);
  }
  function readEntry(form) {
    const f = new FormData(form);
    const d = { ...draft };
    d.label = String(f.get('label') || '').trim();
    d.date = String(f.get('date') || '');
    d.repeat = form.elements.repeat.checked;
    d.until = form.elements.until ? form.elements.until.value.slice(0, 7) : '';
    d.done = form.elements.done.checked;
    d.skip = form.elements.skip ? form.elements.skip.checked : false;
    d.useLoan = form.elements.useLoan ? form.elements.useLoan.checked : false;
    if (d.useLoan) {
      d.loan = {
        principal: Number(digits(f.get('principal'))) || 0,
        rate: Number(String(f.get('rate') || '').replace(',', '.')) || 0,
        amortize: Number(digits(f.get('amortize'))) || 0,
        withPrincipal: form.elements.withPrincipal ? form.elements.withPrincipal.checked : false,
      };
      d.amount = 0;
    } else {
      d.loan = null;
      d.amount = digits(f.get('amount'));
    }
    return d;
  }
  function saveEntry(form, onlyThisMonth) {
    const d = readEntry(form);
    if (!d.label) { form.elements.label.focus(); return; }
    if (!d.date) { form.elements.date.focus(); return; }
    const amount = Number(d.amount);
    if (!d.useLoan && (!Number.isSafeInteger(amount) || amount <= 0)) {
      const el = form.elements.amount;
      el.setCustomValidity('Số tiền phải lớn hơn 0'); el.reportValidity(); el.setCustomValidity('');
      return;
    }
    if (d.useLoan && !(d.loan.principal > 0 && d.loan.rate > 0)) {
      toast('Cần dư nợ gốc và lãi suất'); return;
    }

    const existing = S.entries.find(x => x.id === d.id);
    const month = d.repeat ? d.month : D.monthOf(d.date);
    if (!existing) {
      S.entries.push({
        id: uid(), type: d.type, label: d.label, amount, date: d.date, repeat: d.repeat,
        doneIn: d.done ? [month] : [], skip: [], override: {}, loan: d.useLoan ? d.loan : null,
        until: d.repeat && /^\d{4}-\d{2}$/.test(d.until) ? d.until : null,
      });
    } else {
      // "Chỉ tháng này" writes an override; the base entry keeps its own amount.
      // "Từ tháng này trở đi" freezes earlier months first, then moves the base.
      const startMonth = D.monthOf(existing.date);
      if (existing.repeat && d.repeat && !d.useLoan) {
        if (onlyThisMonth) {
          existing.override = { ...existing.override, [month]: amount };
        } else {
          const frozen = { ...existing.override };
          for (let m = startMonth; m < month; m = D.shiftMonth(m, 1)) {
            if (!(m in frozen)) frozen[m] = D.amountFor(existing, m);
          }
          existing.override = frozen;
          delete existing.override[month];
          existing.amount = amount;
        }
      } else {
        existing.amount = amount;
        if (!d.repeat) existing.override = {};
      }
      existing.type = d.type;
      existing.label = d.label;
      existing.repeat = d.repeat;
      existing.until = d.repeat && /^\d{4}-\d{2}$/.test(d.until) ? d.until : null;
      existing.loan = d.useLoan ? d.loan : null;
      if (d.useLoan) existing.amount = 0;
      // the date's day-of-month moves; a repeating entry keeps its start month
      existing.date = existing.repeat ? `${startMonth}-${d.date.slice(8, 10)}` : d.date;
      const done = new Set(existing.doneIn || []);
      d.done ? done.add(month) : done.delete(month);
      existing.doneIn = [...done];
      const skip = new Set(existing.skip || []);
      d.skip ? skip.add(month) : skip.delete(month);
      existing.skip = [...skip];
    }
    save(); closeSheet(); render(); toast('Đã lưu');
  }
  function deleteEntry() {
    const e = S.entries.find(x => x.id === draft.id);
    if (!e) return;
    if (!confirm(e.repeat ? 'Xóa khoản lặp này khỏi tất cả các tháng?' : 'Xóa khoản này?')) return;
    S.entries = S.entries.filter(x => x.id !== e.id);
    save(); closeSheet(); render(); toast('Đã xóa');
  }

  // day detail
  function openDay(iso) {
    const rows = D.dayRows(S.entries, iso);
    const point = projection().find(p => p.iso === iso);
    const inflow = D.sum(rows, 'in'), outflow = D.sum(rows, 'out');
    const short = iso < todayIso ? null : point;
    openSheet(`${sheetHead(`${WD_FULL[D.dateOf(iso).getDay()]}, ${dayMonth(iso)}`)}
      ${short && short.trough < 0 ? `<div class="warn">${icon('warn')}<span>Trong ngày tụt xuống <b>${tr(short.trough)}</b> trước khi tiền về</span></div>` : ''}
      <div class="daycards">
        <div><span>Tổng thu</span><b style="color:var(--green)">${inflow ? `+${group(inflow)}đ` : '0đ'}</b></div>
        <div><span>Tổng chi</span><b style="color:var(--red)">${outflow ? `${group(outflow)}đ` : '0đ'}</b></div>
        <div><span>Dư cuối ngày</span><b ${short && short.bal < 0 ? 'style="color:var(--red)"' : ''}>${short ? tr(short.bal) : '—'}</b></div>
      </div>
      ${rows.length ? `<div class="list">${rows.map(r => entryRow(r)).join('')}</div>` : '<div class="card empty" style="margin:0">Không có khoản nào trong ngày này.</div>'}
      <div class="actions"><button class="btn primary" data-act="add-day" data-v="${iso}">+ Thêm khoản vào ngày ${dayMonth(iso)}</button></div>`);
  }

  // accounts
  let accDraft = null;
  function openAccount(id) {
    const a = S.accounts.find(x => x.id === id);
    accDraft = a ? { ...a } : { id: null, kind: 'asset', type: 'cash', name: '', balance: '' };
    paintAccount();
  }
  function paintAccount() {
    const d = accDraft, debt = d.kind === 'debt';
    openSheet(`${sheetHead(d.id ? 'Chỉnh sửa' : 'Thêm tài khoản')}
      <div class="seg">${[['asset', 'Tài sản'], ['debt', 'Nợ']].map(([v, l]) =>
        `<button type="button" class="${(v === 'debt') === debt ? 'on' : ''}" data-act="akind" data-v="${v}">${l}</button>`).join('')}</div>
      <form data-form="account" novalidate>
        <div class="field"><label>Tên</label><input class="input" name="name" required autocomplete="off" placeholder="${debt ? 'VD: Vay mua xe' : 'VD: Techcombank'}" value="${esc(d.name)}"></div>
        <div class="field"><label>${debt ? 'Số tiền nợ' : 'Số dư'}</label>${moneyField('balance', d.balance)}</div>
        ${debt ? '' : `<div class="field"><label>Loại</label><select class="input" name="type">${['cash', 'bank', 'invest', 'other'].map(t =>
          `<option value="${t}" ${d.type === t ? 'selected' : ''}>${ACCOUNT_TYPES[t].name}</option>`).join('')}</select></div>
          <p class="hint">Tiền mặt và Ngân hàng là thanh khoản, và là điểm xuất phát của biểu đồ dòng tiền.</p>`}
        <div class="actions">${d.id ? '<button type="button" class="btn danger fit" data-act="del-acc">Xóa</button>' : '<button type="button" class="btn" data-act="close">Huỷ</button>'}<button class="btn primary" type="submit">Lưu</button></div>
      </form>`);
  }
  function saveAccount(form) {
    const name = form.elements.name.value.trim();
    const balance = Number(digits(form.elements.balance.value));
    if (!name) { form.elements.name.focus(); return; }
    const debt = accDraft.kind === 'debt';
    const acc = { id: accDraft.id || uid(), kind: accDraft.kind, type: debt ? 'debt' : form.elements.type.value, name, balance };
    const i = S.accounts.findIndex(a => a.id === acc.id);
    i >= 0 ? S.accounts[i] = acc : S.accounts.push(acc);
    recordNetWorth(); save(); closeSheet(); render(); toast('Đã lưu');
  }

  // month picker
  let pickYear = 0;
  const openMonths = () => { pickYear = Number(ui.month.slice(0, 4)); paintMonths(); };
  const paintMonths = () => openSheet(`${sheetHead('Chọn tháng')}
    <div class="year"><button class="icon-btn" data-act="year" data-v="-1" aria-label="Năm trước">${icon('left')}</button><span>${pickYear}</span><button class="icon-btn" data-act="year" data-v="1" aria-label="Năm sau">${icon('right')}</button></div>
    <div class="months">${Array.from({ length: 12 }, (_, i) => {
      const k = `${pickYear}-${pad(i + 1)}`;
      return `<button class="${k === ui.month ? 'on' : ''} ${k === curKey ? 'now' : ''}" data-act="month" data-v="${k}">Tháng ${i + 1}</button>`;
    }).join('')}</div>`);

  // settings
  const openSettings = () => openSheet(`${sheetHead('Cài đặt')}
    <div class="set-list">
      <button class="btn" data-act="export">Xuất backup JSON</button>
      <label class="btn"><input type="file" accept="application/json" data-import hidden>Nhập backup JSON</label>
      <button class="btn danger" data-act="clear">Xóa toàn bộ dữ liệu</button>
    </div>
    <p class="about">Rootcash · Personal Treasury<br>Kiểm soát dòng tiền. Tự do trong phần còn lại.<br>Dữ liệu chỉ lưu trên thiết bị này.<br>© Copyright from Derekdaydoi</p>`);

  function exportBackup() {
    const blob = new Blob([JSON.stringify({ format: 'rootcash-backup', exportedAt: new Date().toISOString(), data: S }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `rootcash-${todayIso}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function importBackup(file) {
    try {
      const json = JSON.parse(await file.text());
      S = D.migrate(json && json.format === 'rootcash-backup' ? json.data : json);
      if (!S.buckets.length) S.buckets = DEFAULT_BUCKETS.slice();
      recordNetWorth(); save(); closeSheet(); render(false); toast('Đã nhập backup');
    } catch { toast('Backup không hợp lệ'); }
  }

  // living helpers
  function setLiving(value) {
    const next = Math.max(0, Math.round(value) || 0);
    // a new estimate starts unsplit, so an old split never shows as a shortfall
    if (D.livingFor(S.living, ui.month) !== next) S.allocations[ui.month] = {};
    S.living[ui.month] = next;
    save();
  }
  function syncLiving(value, from) {
    const scroll = $app.querySelector('.scroll');
    const input = scroll.querySelector('[data-living-input]');
    const range = scroll.querySelector('[data-living-range]');
    if (!input || !range) return;
    const cap = Number(range.max) || 1;
    if (from !== 'input') input.value = group(value);
    if (from !== 'range') range.value = Math.min(value, cap);
    range.style.setProperty('--p', `${Math.min(value, cap) / cap * 100}%`);
    const per = scroll.querySelector('[data-per-day]');
    if (per) per.textContent = `≈ ${group(Math.round(value / D.daysIn(ui.month)))}đ / ngày`;
  }

  // ---------- events ----------
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act, v = el.dataset.v, id = el.dataset.id;
    if (act === 'backdrop') { if (e.target === el) closeSheet(); return; }
    const form = el.closest('form');
    switch (act) {
      case 'tab': ui.tab = v; render(false); break;
      case 'view': ui.view = v; render(false); break;
      case 'filter': ui.filter = v; render(false); break;
      case 'range': ui.range = Number(v); render(); break;
      case 'today': ui.month = curKey; render(false); break;
      case 'months': openMonths(); break;
      case 'year': pickYear += Number(v); paintMonths(); break;
      case 'month': ui.month = v; closeSheet(); render(false); break;
      case 'settings': openSettings(); break;
      case 'living-screen': ui.tab = 'living'; ui.month = curKey; render(false); break;
      case 'add': openEntry(null); break;
      case 'add-day': draft = null; openEntry(null); draft.date = v; draft.month = D.monthOf(v); paintEntry(); break;
      case 'edit': openEntry(id, el.dataset.month); break;
      case 'day': openDay(v); break;
      case 'etype': draft = { ...readEntry($sheet.querySelector('form')), type: v }; paintEntry(); break;
      case 'erepeat': draft = { ...readEntry($sheet.querySelector('form')), repeat: el.checked }; paintEntry(); break;
      case 'eloan': {
        const next = { ...readEntry($sheet.querySelector('form')), useLoan: el.checked };
        if (el.checked && !next.loan) next.loan = { principal: 0, rate: 0, amortize: 0 };
        draft = next; paintEntry(); break;
      }
      case 'ewp': {
        const next = readEntry($sheet.querySelector('form'));
        next.loan = { ...(next.loan || { principal: 0, rate: 0, amortize: 0 }), withPrincipal: el.checked };
        draft = next; paintEntry(); break;
      }
      case 'save-month': saveEntry($sheet.querySelector('form'), true); break;
      case 'del-entry': deleteEntry(); break;
      case 'acc': openAccount(id || null); break;
      case 'akind': {
        const nameEl = $sheet.querySelector('[name="name"]'), balEl = $sheet.querySelector('[name="balance"]');
        accDraft = { ...accDraft, name: nameEl ? nameEl.value : '', balance: balEl ? digits(balEl.value) : '',
          kind: v, type: v === 'debt' ? 'debt' : (accDraft.type === 'debt' ? 'cash' : accDraft.type) };
        paintAccount(); break;
      }
      case 'del-acc':
        if (confirm('Xóa tài khoản này?')) {
          S.accounts = S.accounts.filter(a => a.id !== accDraft.id);
          recordNetWorth(); save(); closeSheet(); render(); toast('Đã xóa');
        }
        break;
      case 'with-living': ui.withLiving = el.checked; render(); break;
      case 'add-bucket': {
        const name = (prompt('Tên mục mới') || '').trim();
        if (name && !S.buckets.includes(name)) { S.buckets.push(name); save(); render(); }
        break;
      }
      case 'rename': {
        const name = (prompt('Đổi tên mục (để trống để xóa)', v) || '').trim();
        if (name === v) break;
        const alloc = D.allocationsFor(S.allocations, ui.month);
        if (!name) {
          if (!confirm(`Xóa mục "${v}"?`)) break;
          S.buckets = S.buckets.filter(b => b !== v);
          delete alloc[v];
        } else if (!S.buckets.includes(name)) {
          S.buckets = S.buckets.map(b => b === v ? name : b);
          alloc[name] = alloc[v] || 0;
          delete alloc[v];
        }
        S.allocations[ui.month] = alloc;
        save(); render(); break;
      }
      case 'set-alloc': {
        const alloc = D.allocationsFor(S.allocations, ui.month);
        const raw = prompt(`Số tiền cho "${v}"`, group(alloc[v] || 0));
        if (raw === null) break;
        alloc[v] = Number(digits(raw)) || 0;
        S.allocations[ui.month] = alloc;
        save(); render(); break;
      }
      case 'export': exportBackup(); break;
      case 'clear':
        if (confirm('Xóa toàn bộ dữ liệu trên thiết bị này?') && confirm('Xác nhận lần cuối: không thể khôi phục.')) {
          S = D.migrate(null); S.buckets = DEFAULT_BUCKETS.slice();
          save(); closeSheet(); ui.tab = 'overview'; render(false); toast('Đã xóa toàn bộ dữ liệu');
        }
        break;
      case 'close': closeSheet(); break;
    }
    if (form && act === 'close') closeSheet();
  });

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.matches('[data-money]')) t.value = digits(t.value) ? group(digits(t.value)) : '';
    else if (t.matches('[data-living-input]')) {
      const n = Number(digits(t.value)) || 0;
      t.value = n ? group(n) : '';
      setLiving(n); syncLiving(n, 'input');
    } else if (t.matches('[data-living-range]')) { setLiving(Number(t.value)); syncLiving(Number(t.value), 'range'); }
    else if (t.matches('input[type="date"]')) {
      const label = t.closest('.datebox').querySelector('[data-date-text]');
      if (label) label.textContent = dateLabel(t.value);
    }
  });

  document.addEventListener('change', e => {
    if (e.target.matches('[data-import]') && e.target.files[0]) importBackup(e.target.files[0]);
    if (e.target.matches('[data-living-range]') || e.target.matches('[data-living-input]')) render();
    if (e.target.matches('input[type="date"]')) {
      const label = e.target.closest('.datebox').querySelector('[data-date-text]');
      if (label) label.textContent = dateLabel(e.target.value);
    }
  });

  document.addEventListener('submit', e => {
    const form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    if (form.dataset.form === 'entry') saveEntry(form, false);
    else if (form.dataset.form === 'account') saveAccount(form);
  });

  ['gesturestart', 'gesturechange', 'gestureend'].forEach(n => document.addEventListener(n, e => e.preventDefault()));

  render(false);
})();
