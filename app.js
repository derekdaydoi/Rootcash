(() => {
  'use strict';
  const D = window.Domain;
  const KEY = 'rootcash:v2';
  const OLD_KEY = 'rootcash'; // earlier data, read once and never deleted
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
  const signed = n => `${n < 0 ? '−' : '+'}${group(n)}đ`;
  const tr = n => Math.abs(n) < 1e5
    ? vnd(n)
    : `${n < 0 ? '−' : ''}${String(Math.round(Math.abs(n) / 1e5) / 10).replace('.', ',')}tr`;
  const digits = v => String(v ?? '').replace(/[^0-9]/g, '');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const monthNum = key => Number(key.slice(5));
  const monthLabel = key => `Tháng ${monthNum(key)}, ${key.slice(0, 4)}`;
  const mmyyyy = key => `${key.slice(5)}/${key.slice(0, 4)}`;
  const dmy = iso => `${iso.slice(8)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
  const WD_FULL = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const KIND_NAME = { in: 'Khoản thu', debt: 'Lịch trả nợ', fixed: 'Chi cố định', once: 'Khoản một lần' };

  const ICONS = {
    left: '<path d="m15 5-7 7 7 7"/>',
    right: '<path d="m9 5 7 7-7 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    month: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    bars: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    save: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 13v7h14v-7"/>',
    load: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 13v7h14v-7"/>',
  };
  const icon = (name, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  // ---------- state ----------
  const load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return D.migrate(JSON.parse(raw), todayIso);
      const old = localStorage.getItem(OLD_KEY);
      if (old) return D.migrate(JSON.parse(old), todayIso);
    } catch { /* fall through */ }
    return D.migrate(null);
  };
  let S = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast('Không lưu được dữ liệu'); } };
  save();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  const ui = { tab: 'month', month: curKey, seg: 'fixed', sel: now.getDate() };
  const setMonth = key => { ui.month = key; ui.sel = key === curKey ? now.getDate() : 1; };

  // ---------- shared bits ----------
  const footer = '<p class="copy">© derekdaydoi</p>';
  const monthNav = () => `<header class="mnav">
      <button class="icon-btn" data-act="shift" data-v="-1" aria-label="Tháng trước">${icon('left')}</button>
      <button class="mtitle" data-act="this-month">${monthLabel(ui.month)}${ui.month === curKey ? '' : '<small>Về tháng này</small>'}</button>
      <button class="icon-btn" data-act="shift" data-v="1" aria-label="Tháng sau">${icon('right')}</button></header>`;
  const sumRow = (label, note, value, cls = '') =>
    `<div class="srow"><span>${label}${note ? ` <em>· ${note}</em>` : ''}</span><b class="${cls}">${value}</b></div>`;

  // ---------- tab: month ----------
  const heroHtml = m => `<small>Free float cuối tháng ${monthNum(m.key)}</small>
    <strong class="${m.float < 0 ? 'neg' : ''}">${vnd(m.float)}</strong>
    <span>= số dư đầu tháng ${monthNum(D.shiftMonth(m.key, 1))} nếu tiêu đúng khung</span>`;
  const sumHtml = m => [
    sumRow('Số dư đầu tháng', '', vnd(m.opening)),
    sumRow('+ Thu', m.counts.in ? `${m.counts.in} khoản` : '', m.inflow ? `+${group(m.inflow)}đ` : '0đ', 'pos'),
    sumRow('− Lịch trả nợ', m.counts.debt ? `${m.counts.debt} khoản` : '', m.debt ? `−${group(m.debt)}đ` : '0đ', 'neg'),
    sumRow('− Cố định', m.counts.fixed ? `${m.counts.fixed} mục` : '', m.fixed ? `−${group(m.fixed)}đ` : '0đ', 'neg'),
    m.counts.once ? sumRow(m.once >= 0 ? '+ Một lần' : '− Một lần', `${m.counts.once} khoản`, signed(m.once), m.once >= 0 ? 'pos' : 'neg') : '',
    sumRow('− Sinh hoạt', '', m.living ? `−${group(m.living)}đ` : '0đ', 'neg'),
  ].join('');
  const perDay = m => `≈ ${group(Math.round(m.living / D.daysIn(m.key) / 1000) * 1000)}đ/ngày · từ tháng này`;

  function monthView() {
    const m = D.month(S, ui.month);
    const openNote = m.openingTyped
      ? `Bạn nhập${D.openingFor({ ...S, openings: Object.fromEntries(Object.entries(S.openings).filter(([k]) => k !== ui.month)) }, ui.month).none ? '' : ' · <button class="link" data-act="auto-opening">dùng số tự tính</button>'}`
      : m.openingNone ? 'Nhập số dư thật của bạn' : 'Tự lấy từ free float tháng trước';
    return `${monthNav()}
      <section class="hero" data-live="hero">${heroHtml(m)}</section>
      <section class="card inputs">
        <div class="irow"><label for="opening">Số dư đầu tháng<small>${openNote}</small></label>
          <input id="opening" class="num" data-opening inputmode="numeric" autocomplete="off" enterkeyhint="done"
            value="${m.openingTyped ? group(m.opening) : ''}" placeholder="${group(m.opening)}"></div>
        <div class="irow"><label for="living">Sinh hoạt<small data-live="perday">${perDay(m)}</small></label>
          <input id="living" class="num" data-living inputmode="numeric" autocomplete="off" enterkeyhint="done" value="${group(m.living)}"></div>
      </section>
      <section class="card sum" data-live="sum">${sumHtml(m)}</section>
      ${S.items.length ? '' : `<button class="card hint-card" data-act="tab" data-v="frame">Chưa có khung. Vào tab <b>Khung</b> để thêm lương, lịch trả nợ và chi cố định.</button>`}
      ${footer}`;
  }
  function liveUpdate() {
    const m = D.month(S, ui.month);
    const set = (name, html) => { const el = $app.querySelector(`[data-live="${name}"]`); if (el) el.innerHTML = html; };
    set('hero', heroHtml(m)); set('sum', sumHtml(m)); set('perday', perDay(m));
  }

  // ---------- tab: cash flow ----------
  function flowView() {
    const { month: m, days, spread } = D.days(S, ui.month);
    const sel = Math.min(Math.max(ui.sel, 1), days.length);
    const low = D.lowest(days);
    const maxBal = Math.max(1, ...days.map(d => Math.abs(d.end)), Math.abs(m.opening));
    const outOf = d => d.rows.filter(r => r.value < 0);
    const maxOut = Math.max(1, ...days.map(d => outOf(d).reduce((t, r) => t - r.value, 0)));
    const H = 128;

    const cols = days.map(d => {
      const h = Math.max(2, Math.round(Math.abs(d.end) / maxBal * H));
      const inflow = d.rows.filter(r => r.value > 0).reduce((t, r) => t + r.value, 0);
      const cls = d.end < 0 ? 'neg' : d.day === sel ? 'sel' : d.day === low.day ? 'low' : '';
      return `<button class="col ${cls} ${d.day === sel ? 'on' : ''}" data-act="sel" data-v="${d.day}" aria-label="Ngày ${d.day}, cuối ngày ${tr(d.end)}">
        ${inflow ? `<span class="inlab" style="bottom:${h + 3}px">+${tr(inflow)}</span>` : ''}
        <span class="bar" style="height:${h}px"></span></button>`;
    }).join('');
    const segs = days.map(d => `<div>${outOf(d).map(r =>
      `<span style="height:${Math.max(3, Math.round(-r.value / maxOut * 36))}px"></span>`).join('')}</div>`).join('');
    const ticks = days.map(d => `<span>${d.day === 1 || d.day % 5 === 0 ? d.day : ''}</span>`).join('');

    const sd = days[sel - 1];
    const outs = outOf(sd);
    const outTotal = outs.reduce((t, r) => t + r.value, 0) - spread;
    const detail = sd.rows.map(r => `<div class="drow"><span>${esc(r.label || KIND_NAME[r.kind])}</span><b class="${r.value > 0 ? 'pos' : 'neg'}">${signed(r.value)}</b></div>`).join('')
      + (spread > 0 ? `<div class="drow mute"><span>Sinh hoạt + chi trải đều</span><b>${signed(-spread)}</b></div>` : '');

    return `${monthNav()}
      <section class="card chart">
        <div class="legend"><span><i class="lg-bal"></i>Số dư cuối ngày</span><span><i class="lg-low"></i>Thấp nhất</span><span><i class="lg-out"></i>Mỗi khoản chi</span></div>
        <div class="cols">${cols}</div>
        <div class="axis"></div>
        <div class="segs">${segs}</div>
        <div class="ticks">${ticks}</div>
        <p class="hint">Chạm vào một cột để xem ngày đó.</p>
      </section>
      <section class="card daycard">
        <h3>${WD_FULL[sd.weekday]}, ${sel}/${monthNum(ui.month)}</h3>
        ${detail || '<div class="drow mute"><span>Không có khoản nào</span></div>'}
        <div class="drow total"><span>Tổng chi · ${outs.length + (spread > 0 ? 1 : 0)} khoản</span><b class="neg">${vnd(outTotal)}</b></div>
        <div class="drow"><span class="m">Đầu ngày ${vnd(sd.start)} → cuối ngày</span><b class="${sd.end < 0 ? 'neg' : ''}">${vnd(sd.end)}</b></div>
      </section>
      <section class="card trio">
        <div>Đầu tháng<b>${tr(m.opening)}</b></div>
        <div>Thấp nhất ${low.day}/${monthNum(ui.month)}<b class="low">${tr(low.end)}</b></div>
        <div>Cuối tháng<b>${tr(days[days.length - 1].end)}</b></div>
      </section>
      ${footer}`;
  }

  // ---------- tab: frame ----------
  function itemNote(i) {
    if (i.kind === 'once') return `${dmy(i.date)} · ${i.sign === 1 ? 'Thu' : 'Chi'}`;
    const parts = [i.day ? `Ngày ${i.day} hàng tháng` : 'Trải đều theo ngày'];
    if (i.from && i.from > curKey) parts.push(`từ ${mmyyyy(i.from)}`);
    if (i.until) {
      if (i.until < curKey) return `Đã kết thúc ${mmyyyy(i.until)}`;
      parts.push(`đến ${mmyyyy(i.until)}`);
      if (i.kind === 'debt') parts.push(`còn ${D.monthsBetween(curKey, i.until) + 1} kỳ`);
    }
    return parts.join(' · ');
  }
  const itemRow = i => `<div class="frow ${D.activeIn(i, curKey) || i.kind === 'once' ? '' : 'ended'}">
      <button class="fmain" data-act="edit" data-id="${esc(i.id)}"><b>${esc(i.label || KIND_NAME[i.kind])}</b><span>${itemNote(i)}</span></button>
      <input class="num sm ${i.kind === 'in' || (i.kind === 'once' && i.sign === 1) ? 'pos' : ''}" data-amount data-id="${esc(i.id)}"
        inputmode="numeric" autocomplete="off" enterkeyhint="done" value="${group(i.amount)}" aria-label="Số tiền ${esc(i.label)}"></div>`;
  const listOf = kind => {
    const list = S.items.filter(i => i.kind === kind);
    return kind === 'once' ? list.sort((a, b) => a.date.localeCompare(b.date)) : list.sort((a, b) => (a.day || 99) - (b.day || 99));
  };
  const group3 = (kind, title, addLabel, totalCls) => {
    const list = listOf(kind);
    const total = list.filter(i => D.activeIn(i, curKey)).reduce((t, i) => t + i.amount * (kind === 'in' ? 1 : -1), 0);
    return `<div class="sec"><h2>${title}</h2>${kind === 'once' ? '<span>chỉ rơi vào 1 ngày</span>' : `<b class="${totalCls}">${signed(total)}</b>`}</div>
      <section class="card list">${list.map(itemRow).join('')}
        <button class="add" data-act="add" data-v="${kind}">${icon('plus')}${addLabel}</button></section>`;
  };

  function frameView() {
    const living = D.carried(S.living, curKey);
    const backup = S.backupAt ? `Lần gần nhất ${dmy(String(S.backupAt).slice(0, 10))}` : 'Chưa sao lưu lần nào';
    const body = ui.seg === 'fixed'
      ? `${group3('fixed', 'Chi cố định', 'Thêm mục cố định', 'neg')}
        <div class="sec"><h2>Sinh hoạt</h2><span>trải đều theo ngày</span></div>
        <section class="card inputs"><div class="irow"><label for="flive">Mỗi tháng<small>≈ ${group(Math.round(living / D.daysIn(curKey) / 1000) * 1000)}đ/ngày · từ tháng ${monthNum(curKey)}</small></label>
          <input id="flive" class="num" data-frame-living inputmode="numeric" autocomplete="off" enterkeyhint="done" value="${group(living)}"></div></section>`
      : `${group3('in', 'Thu', 'Thêm khoản thu', 'pos')}
        ${group3('debt', 'Lịch trả nợ', 'Thêm lịch trả nợ', 'neg')}
        ${group3('once', 'Khoản một lần', 'Thêm khoản một lần', '')}`;
    return `<header class="phead"><h1>Khung</h1><span>áp dụng mọi tháng</span></header>
      <div class="seg">
        <button class="${ui.seg === 'fixed' ? 'on' : ''}" data-act="seg" data-v="fixed">Cố định + sinh hoạt</button>
        <button class="${ui.seg === 'income' ? 'on' : ''}" data-act="seg" data-v="income">Thu + lịch nợ</button></div>
      ${body}
      <div class="sec"><h2>Sao lưu</h2><span>${backup}</span></div>
      <section class="card backup">
        <p>Dữ liệu chỉ nằm trên máy này. Xoá icon khỏi màn hình chính là mất, nên lưu một bản ra Tệp / iCloud thỉnh thoảng.</p>
        <div class="actions"><button class="btn primary" data-act="export">${icon('save')}Lưu bản sao lưu</button>
          <label class="btn">${icon('load')}Khôi phục<input type="file" accept="application/json,.json" data-import hidden></label></div>
      </section>
      ${footer}`;
  }

  // ---------- render ----------
  const VIEWS = { month: monthView, flow: flowView, frame: frameView };
  const NAV = [['month', 'Tháng', 'month'], ['flow', 'Dòng tiền', 'bars'], ['frame', 'Khung', 'grid']];
  function render(keepScroll = true) {
    const prev = $app.querySelector('.scroll');
    const top = keepScroll && prev && prev.dataset.tab === ui.tab ? prev.scrollTop : 0;
    $app.innerHTML = `<div class="scroll" data-tab="${ui.tab}">${VIEWS[ui.tab]()}</div>
      <nav class="nav"><div class="nav-in">${NAV.map(([id, label, ic]) =>
        `<button class="${ui.tab === id ? 'on' : ''}" data-act="tab" data-v="${id}">${icon(ic)}<span>${label}</span></button>`).join('')}</div></nav>`;
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

  let draft = null;
  function openItem(id, kind) {
    const found = id && S.items.find(i => i.id === id);
    draft = found ? { ...found } : {
      kind, label: '', amount: 0, day: kind === 'fixed' ? 1 : 5, from: curKey, until: null,
      date: todayIso, sign: -1,
    };
    paintItem();
  }
  function paintItem() {
    const d = draft, once = d.kind === 'once';
    const dayOpts = (d.kind === 'fixed' ? [[0, 'Trải đều theo ngày']] : [])
      .concat(Array.from({ length: 31 }, (_, i) => [i + 1, `Ngày ${i + 1}`]))
      .map(([v, l]) => `<option value="${v}" ${Number(d.day) === v ? 'selected' : ''}>${l}</option>`).join('');
    openSheet(`<div class="sheet-head"><h2>${d.id ? 'Sửa' : 'Thêm'} ${KIND_NAME[d.kind].toLowerCase()}</h2>
        <button class="x" data-act="close" aria-label="Đóng">${icon('x')}</button></div>
      <form data-form="item" novalidate>
        ${once ? `<div class="seg"><button type="button" class="${d.sign === -1 ? 'on' : ''}" data-act="sign" data-v="-1">Chi</button>
          <button type="button" class="${d.sign === 1 ? 'on' : ''}" data-act="sign" data-v="1">Thu</button></div>` : ''}
        <div class="field"><label for="f-label">Tên</label><input id="f-label" class="input" name="label" value="${esc(d.label)}" autocomplete="off" placeholder="${KIND_NAME[d.kind]}"></div>
        <div class="field"><label for="f-amount">Số tiền ${d.kind === 'in' ? 'mỗi tháng' : once ? '' : 'mỗi tháng'}</label>
          <input id="f-amount" class="input big" name="amount" data-money inputmode="numeric" autocomplete="off" placeholder="0" value="${d.amount ? group(d.amount) : ''}"></div>
        ${once
          ? `<div class="field"><label for="f-date">Ngày</label><input id="f-date" class="input" type="date" name="date" value="${d.date || todayIso}"></div>`
          : `<div class="field"><label for="f-day">Ngày trong tháng</label><select id="f-day" class="input" name="day">${dayOpts}</select></div>
             <div class="two">
               <div class="field"><label for="f-from">Từ tháng</label><input id="f-from" class="input" type="month" name="from" value="${d.from || ''}"></div>
               <div class="field"><label for="f-until">Đến tháng</label><input id="f-until" class="input" type="month" name="until" value="${d.until || ''}"></div>
             </div>
             <p class="hint">Để trống "Đến tháng" nếu không có hạn.${d.kind === 'debt' ? ' Khoản nợ tự dừng sau tháng cuối.' : ''}</p>`}
        <div class="actions">${d.id ? '<button type="button" class="btn danger fit" data-act="del-item">Xoá</button>' : ''}
          <button type="submit" class="btn primary">Lưu</button></div>
      </form>`);
  }
  function readItem(form) {
    const f = new FormData(form);
    const next = { ...draft, label: String(f.get('label') || '').trim(), amount: Number(digits(f.get('amount'))) || 0 };
    if (draft.kind === 'once') next.date = String(f.get('date') || '');
    else {
      next.day = Number(f.get('day')) || 0;
      next.from = String(f.get('from') || '') || null;
      next.until = String(f.get('until') || '') || null;
    }
    return next;
  }
  function saveItem(form) {
    const next = readItem(form);
    if (!next.amount) { toast('Nhập số tiền'); return; }
    if (next.kind === 'once' && !next.date) { toast('Chọn ngày'); return; }
    if (next.from && next.until && next.until < next.from) { toast('"Đến tháng" phải sau "Từ tháng"'); return; }
    const item = D.cleanItem(next);
    if (!item) { toast('Thông tin chưa hợp lệ'); return; }
    const at = S.items.findIndex(i => i.id === item.id);
    if (at >= 0) S.items[at] = item; else S.items.push(item);
    save(); closeSheet(); render(); toast('Đã lưu');
  }

  // ---------- backup ----------
  async function exportBackup() {
    S.backupAt = todayIso; save();
    const text = JSON.stringify({ format: 'rootcash-backup', version: 2, exportedAt: new Date().toISOString(), data: S }, null, 2);
    const name = `rootcash-${todayIso}.json`;
    try {
      const file = new File([text], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
        render(); return;
      }
    } catch (err) { if (err && err.name === 'AbortError') return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    render();
  }
  async function importBackup(file) {
    try {
      const json = JSON.parse(await file.text());
      const next = D.migrate(json && json.format === 'rootcash-backup' ? json.data : json, todayIso);
      if (!confirm('Thay toàn bộ dữ liệu hiện tại bằng bản sao lưu này?')) return;
      S = next; save(); render(false); toast('Đã khôi phục');
    } catch { toast('Tệp sao lưu không hợp lệ'); }
  }

  // ---------- events ----------
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act, v = el.dataset.v;
    if (act === 'backdrop') { if (e.target === el) closeSheet(); return; }
    switch (act) {
      case 'tab': ui.tab = v; render(false); break;
      case 'shift': setMonth(D.shiftMonth(ui.month, Number(v))); render(false); break;
      case 'this-month': setMonth(curKey); render(false); break;
      case 'sel': ui.sel = Number(v); render(); break;
      case 'seg': ui.seg = v; render(false); break;
      case 'auto-opening': delete S.openings[ui.month]; save(); render(); break;
      case 'add': openItem(null, v); break;
      case 'edit': openItem(el.dataset.id); break;
      case 'sign': draft = { ...readItem($sheet.querySelector('form')), sign: Number(v) }; paintItem(); break;
      case 'del-item':
        if (confirm(`Xoá "${draft.label || KIND_NAME[draft.kind]}"?`)) {
          S.items = S.items.filter(i => i.id !== draft.id);
          save(); closeSheet(); render(); toast('Đã xoá');
        }
        break;
      case 'export': exportBackup(); break;
      case 'close': closeSheet(); break;
    }
  });

  document.addEventListener('input', e => {
    const t = e.target;
    const n = Number(digits(t.value)) || 0;
    if (t.matches('[data-money], [data-amount]')) t.value = digits(t.value) ? group(n) : '';
    else if (t.matches('[data-opening]')) {
      if (digits(t.value)) S.openings[ui.month] = n; else delete S.openings[ui.month];
      t.value = digits(t.value) ? group(n) : '';
      save(); liveUpdate();
    } else if (t.matches('[data-living]')) {
      S.living[ui.month] = n; t.value = n ? group(n) : '';
      save(); liveUpdate();
    } else if (t.matches('[data-frame-living]')) {
      S.living[curKey] = n; t.value = n ? group(n) : '';
      save();
    }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('[data-import]') && t.files[0]) { importBackup(t.files[0]); t.value = ''; return; }
    if (t.matches('[data-amount]')) {
      const item = S.items.find(i => i.id === t.dataset.id);
      if (item) { item.amount = Number(digits(t.value)) || 0; save(); render(); }
      return;
    }
    if (t.matches('[data-opening], [data-living], [data-frame-living]')) render();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches('input.num')) e.target.blur();
  });

  document.addEventListener('submit', e => {
    const form = e.target.closest('[data-form="item"]');
    if (!form) return;
    e.preventDefault();
    saveItem(form);
  });

  ['gesturestart', 'gesturechange', 'gestureend'].forEach(n => document.addEventListener(n, e => e.preventDefault()));

  render(false);
})();
