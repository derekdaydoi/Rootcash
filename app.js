(() => {
  'use strict';
  const D = window.Domain;
  const KEY = 'rootcash:v2';
  const OLD_KEY = 'rootcash'; // earlier data, read once; removed only by "Xoá toàn bộ dữ liệu"
  const $app = document.querySelector('#app');
  const $sheet = document.querySelector('#sheet');
  const $toast = document.querySelector('#toast');

  // ---------- formatting ----------
  const now = new Date();
  const todayIso = D.isoOf(now);
  const curKey = D.monthOf(todayIso);
  const group = n => String(Math.round(Math.abs(Number(n) || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const vnd = n => `${Math.round(n) < 0 ? '−' : ''}${group(n)}đ`;
  const signed = n => Math.round(n) === 0 ? '0đ' : `${n < 0 ? '−' : '+'}${group(n)}đ`;
  const tr = n => Math.abs(n) < 1e5
    ? vnd(n)
    : `${n < 0 ? '−' : ''}${String(Math.round(Math.abs(n) / 1e5) / 10).replace('.', ',')}tr`;
  const digits = v => String(v ?? '').replace(/[^0-9]/g, '');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const monthNum = key => Number(key.slice(5));
  const monthLabel = key => `Tháng ${monthNum(key)}, ${key.slice(0, 4)}`;
  const mmyy = key => `${key.slice(5)}/${key.slice(2, 4)}`;
  const dm = iso => `${Number(iso.slice(8))}/${Number(iso.slice(5, 7))}`;
  const WD_FULL = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const KIND_NAME = { in: 'Khoản thu', debt: 'Lịch trả nợ', fixed: 'Chi cố định', once: 'Khoản một lần' };
  const isIncome = i => i.kind === 'in' || (i.kind === 'once' && i.sign === 1);

  const ICONS = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    month: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    bars: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    save: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 13v7h14v-7"/>',
    load: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 13v7h14v-7"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
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
  if (!S.active) S.active = curKey;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast('Không lưu được dữ liệu'); } };
  save();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  // The one month being managed. Everything on screen is about it.
  const A = () => S.active;
  const ui = { tab: 'month', seg: 'fixed', sel: 1 };
  const resetSel = () => { ui.sel = A() === curKey ? now.getDate() : 1; };
  resetSel();

  // ---------- shared bits ----------
  const footer = '<p class="copy">© derekdaydoi</p>';
  const monthHead = () => `<header class="mhead">
      <button class="mpick" data-act="pick-month" aria-label="Đổi tháng đang quản lý">
        <small>Đang quản lý</small><span>${monthLabel(A())}${icon('down')}</span></button></header>`;
  const sumRow = (label, note, value, cls = '') =>
    `<div class="srow"><span>${label}${note ? ` <em>· ${note}</em>` : ''}</span><b class="${cls}">${value}</b></div>`;

  // ---------- tab: month ----------
  const heroHtml = m => `<small>Free float cuối tháng ${monthNum(m.key)}</small>
    <strong class="${m.float < 0 ? 'neg' : ''}">${vnd(m.float)}</strong>`;
  const sumHtml = m => [
    sumRow('Số dư đầu tháng', '', vnd(m.opening)),
    sumRow('+ Thu', m.counts.in ? `${m.counts.in} khoản` : '', signed(m.inflow), m.inflow ? 'pos' : ''),
    sumRow('− Trả nợ', m.counts.debt ? `${m.counts.debt} khoản` : '', signed(-m.debt), m.debt ? 'neg' : ''),
    sumRow('− Cố định', m.counts.fixed ? `${m.counts.fixed} mục` : '', signed(-m.fixed), m.fixed ? 'neg' : ''),
    m.counts.once ? sumRow('± Một lần', `${m.counts.once} khoản`, signed(m.once), m.once >= 0 ? 'pos' : 'neg') : '',
    sumRow('− Sinh hoạt', '', signed(-m.living), m.living ? 'neg' : ''),
  ].join('');
  const perDay = m => `≈ ${group(Math.round(m.living / D.daysIn(m.key) / 1000) * 1000)}đ/ngày`;

  function monthView() {
    const m = D.month(S, A());
    return `${monthHead()}
      <section class="hero" data-live="hero">${heroHtml(m)}</section>
      <section class="card inputs">
        <div class="irow ${m.openingTyped ? '' : 'ask'}"><label for="opening">Số dư đầu tháng<small>${m.openingTyped ? 'Bạn nhập' : 'Chưa nhập'}</small></label>
          <input id="opening" class="num" data-opening inputmode="numeric" autocomplete="off" enterkeyhint="done"
            value="${m.openingTyped ? group(m.opening) : ''}" placeholder="0"></div>
        <div class="irow"><label for="living">Sinh hoạt<small data-live="perday">${perDay(m)}</small></label>
          <input id="living" class="num" data-living inputmode="numeric" autocomplete="off" enterkeyhint="done" value="${group(m.living)}"></div>
      </section>
      <section class="card sum" data-live="sum">${sumHtml(m)}</section>
      ${S.items.length ? '' : `<button class="card hint-card" data-act="tab" data-v="frame">Chưa có khung. Vào tab <b>Khung</b> để thêm lương, lịch trả nợ và chi cố định.</button>`}
      ${footer}`;
  }
  function liveUpdate() {
    const m = D.month(S, A());
    const set = (name, html) => { const el = $app.querySelector(`[data-live="${name}"]`); if (el) el.innerHTML = html; };
    set('hero', heroHtml(m)); set('sum', sumHtml(m)); set('perday', perDay(m));
  }

  // ---------- tab: cash flow ----------
  function flowView() {
    const { month: m, days, spread } = D.days(S, A());
    const sel = Math.min(Math.max(ui.sel, 1), days.length);
    const low = D.lowest(days);
    const maxBal = Math.max(1, ...days.map(d => Math.abs(d.end)), Math.abs(m.opening));
    const outOf = d => d.rows.filter(r => r.value < 0);
    const maxOut = Math.max(1, ...days.map(d => outOf(d).reduce((t, r) => t - r.value, 0)));

    const cols = days.map(d => {
      const h = Math.max(2, Math.round(Math.abs(d.end) / maxBal * 136));
      const cls = d.end < 0 ? 'neg' : d.day === sel ? 'sel' : d.day === low.day ? 'low' : '';
      return `<button class="col ${cls} ${d.day === sel ? 'on' : ''}" data-act="sel" data-v="${d.day}" aria-label="Ngày ${d.day}, cuối ngày ${tr(d.end)}">
        <span class="bar" style="height:${h}px"></span></button>`;
    }).join('');
    const segs = days.map(d => `<div>${outOf(d).map(r =>
      `<span style="height:${Math.max(3, Math.round(-r.value / maxOut * 36))}px"></span>`).join('')}</div>`).join('');
    const ticks = days.map(d => `<span>${d.day === 1 || d.day % 5 === 0 ? d.day : ''}</span>`).join('');

    const sd = days[sel - 1];
    const outs = outOf(sd);
    const outTotal = outs.reduce((t, r) => t + r.value, 0) - spread;
    const detail = sd.rows.map(r => `<div class="drow"><span>${esc(r.label || KIND_NAME[r.kind])}</span><b class="${r.value > 0 ? 'pos' : 'neg'}">${signed(r.value)}</b></div>`).join('')
      + (spread > 0 ? `<div class="drow"><span class="m">Sinh hoạt + chi trải đều</span><b class="neg">${signed(-spread)}</b></div>` : '');

    return `${monthHead()}
      <section class="card chart">
        <div class="legend"><span><i class="lg-bal"></i>Số dư cuối ngày</span><span><i class="lg-low"></i>Thấp nhất</span><span><i class="lg-out"></i>Khoản chi</span></div>
        <div class="cols">${cols}</div>
        <div class="axis"></div>
        <div class="segs">${segs}</div>
        <div class="ticks">${ticks}</div>
      </section>
      <section class="card daycard">
        <h3>${WD_FULL[sd.weekday]}, ${sel}/${monthNum(A())}</h3>
        ${detail || '<div class="drow"><span class="m">Không có khoản nào</span></div>'}
        <div class="drow total"><span>Tổng chi · ${outs.length + (spread > 0 ? 1 : 0)} khoản</span><b class="${outTotal ? 'neg' : ''}">${signed(outTotal)}</b></div>
        <div class="drow"><span class="m">Đầu ngày</span><b>${vnd(sd.start)}</b></div>
        <div class="drow"><span class="m">Cuối ngày</span><b class="${sd.end < 0 ? 'neg' : ''}">${vnd(sd.end)}</b></div>
      </section>
      <section class="card trio">
        <div><span>Đầu tháng</span><b>${tr(m.opening)}</b></div>
        <div><span>Thấp nhất ${low.day}/${monthNum(A())}</span><b class="${low.end < 0 ? 'neg' : 'low'}">${tr(low.end)}</b></div>
        <div><span>Cuối tháng</span><b class="${days[days.length - 1].end < 0 ? 'neg' : ''}">${tr(days[days.length - 1].end)}</b></div>
      </section>
      ${footer}`;
  }

  // ---------- tab: frame ----------
  // Notes are read against the month being managed; anything not due in it is dimmed.
  function itemNote(i) {
    const a = A();
    if (i.kind === 'once') {
      const k = D.monthOf(i.date);
      return `${k < a ? 'Đã qua · ' : k > a ? 'Tháng sau · ' : ''}${dm(i.date)}/${i.date.slice(2, 4)}`;
    }
    if (i.until && i.until < a) return `Đã kết thúc ${mmyy(i.until)}`;
    const when = i.day ? `Ngày ${i.day}` : 'Trải đều';
    if (i.from && i.from > a) return `Từ ${mmyy(i.from)} · ${when.toLowerCase()}`;
    if (i.until) return i.kind === 'debt'
      ? `${when} · còn ${D.monthsBetween(a, i.until) + 1} kỳ`
      : `${when} · đến ${mmyy(i.until)}`;
    return i.day ? `${when} hàng tháng` : 'Trải đều theo ngày';
  }
  const itemRow = i => `<div class="frow ${D.activeIn(i, A()) ? '' : 'off'}">
      <button class="fmain" data-act="edit" data-id="${esc(i.id)}"><b>${esc(i.label || KIND_NAME[i.kind])}</b><span>${itemNote(i)}</span></button>
      <input class="num sm ${isIncome(i) ? 'pos' : 'neg'}" data-amount data-id="${esc(i.id)}"
        inputmode="numeric" autocomplete="off" enterkeyhint="done" value="${group(i.amount)}" aria-label="Số tiền ${esc(i.label)}"></div>`;
  const listOf = kind => {
    const a = A();
    const order = kind === 'once' ? (x, y) => x.date.localeCompare(y.date) : (x, y) => (x.day || 99) - (y.day || 99);
    const list = S.items.filter(i => i.kind === kind).sort(order);
    return list.filter(i => D.activeIn(i, a)).concat(list.filter(i => !D.activeIn(i, a)));
  };
  const block = (kind, title, addLabel) => {
    const list = listOf(kind);
    const total = list.filter(i => D.activeIn(i, A())).reduce((t, i) => t + i.amount * (isIncome(i) ? 1 : -1), 0);
    return `<div class="sec"><h2>${title}</h2><b class="${total > 0 ? 'pos' : total < 0 ? 'neg' : ''}">${signed(total)}</b></div>
      <section class="card list">${list.map(itemRow).join('')}
        <button class="add" data-act="add" data-v="${kind}">${icon('plus')}${addLabel}</button></section>`;
  };

  function frameView() {
    const m = D.month(S, A());
    const backup = S.backupAt ? `Gần nhất ${dm(String(S.backupAt))}` : 'Chưa sao lưu';
    const body = ui.seg === 'fixed'
      ? `${block('fixed', 'Chi cố định', 'Thêm mục cố định')}
        <div class="sec"><h2>Sinh hoạt</h2><span>trải đều theo ngày</span></div>
        <section class="card inputs"><div class="irow"><label for="flive">Tháng ${monthNum(A())}<small>${perDay(m)}</small></label>
          <input id="flive" class="num neg" data-living inputmode="numeric" autocomplete="off" enterkeyhint="done" value="${group(m.living)}"></div></section>`
      : `${block('in', 'Thu', 'Thêm khoản thu')}
        ${block('debt', 'Lịch trả nợ', 'Thêm lịch trả nợ')}
        ${block('once', 'Khoản một lần', 'Thêm khoản một lần')}`;
    return `${monthHead()}
      <div class="seg">
        <button class="${ui.seg === 'fixed' ? 'on' : ''}" data-act="seg" data-v="fixed">Cố định + sinh hoạt</button>
        <button class="${ui.seg === 'income' ? 'on' : ''}" data-act="seg" data-v="income">Thu + lịch nợ</button></div>
      ${body}
      <p class="hint">Khoản mờ là khoản không rơi vào tháng ${monthNum(A())}: chưa tới hạn, đã kết thúc hoặc thuộc tháng khác.</p>
      <div class="sec"><h2>Sao lưu</h2><span>${backup}</span></div>
      <section class="card backup">
        <p>Dữ liệu chỉ nằm trên máy này. Thỉnh thoảng lưu một bản ra Tệp / iCloud.</p>
        <div class="actions"><button class="btn primary" data-act="export">${icon('save')}Sao lưu</button>
          <label class="btn">${icon('load')}Khôi phục<input type="file" accept="application/json,.json" data-import hidden></label></div>
      </section>
      <div class="sec"><h2>Làm lại từ đầu</h2></div>
      <section class="card backup">
        <p>Xoá hết khung, số dư và sinh hoạt để nhập lại. Nên sao lưu trước.</p>
        <button class="btn danger wide" data-act="clear">${icon('trash')}Xoá toàn bộ dữ liệu</button>
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
  const sheetHead = title => `<div class="sheet-head"><h2>${title}</h2><button class="x" data-act="close" aria-label="Đóng">${icon('x')}</button></div>`;

  // month picker: last month through four months ahead
  function openMonths() {
    const keys = [];
    for (let i = -1; i <= 4; i++) keys.push(D.shiftMonth(curKey, i));
    if (!keys.includes(A())) keys.push(A());
    keys.sort();
    openSheet(`${sheetHead('Quản lý tháng nào?')}
      <div class="months">${keys.map(k => `<button class="${k === A() ? 'on' : ''} ${k === curKey ? 'now' : ''}" data-act="set-month" data-v="${k}">
        Tháng ${monthNum(k)}<small>${k === curKey ? 'tháng này' : k.slice(0, 4)}</small></button>`).join('')}</div>
      <p class="hint">Mỗi tháng tính độc lập: số dư đầu tháng do bạn nhập, khung thu/chi dùng chung.</p>`);
  }

  let draft = null;
  function openItem(id, kind) {
    const found = id && S.items.find(i => i.id === id);
    draft = found ? { ...found } : {
      kind, label: '', amount: 0, day: kind === 'fixed' ? 1 : 5, from: A(), until: null,
      date: A() === curKey ? todayIso : `${A()}-01`, sign: -1,
    };
    paintItem();
  }
  function paintItem() {
    const d = draft, once = d.kind === 'once';
    const dayOpts = (d.kind === 'fixed' ? [[0, 'Trải đều theo ngày']] : [])
      .concat(Array.from({ length: 31 }, (_, i) => [i + 1, `Ngày ${i + 1}`]))
      .map(([v, l]) => `<option value="${v}" ${Number(d.day) === v ? 'selected' : ''}>${l}</option>`).join('');
    openSheet(`${sheetHead(`${d.id ? 'Sửa' : 'Thêm'} ${KIND_NAME[d.kind].toLowerCase()}`)}
      <form data-form="item" novalidate>
        ${once ? `<div class="seg"><button type="button" class="${d.sign === -1 ? 'on' : ''}" data-act="sign" data-v="-1">Chi</button>
          <button type="button" class="${d.sign === 1 ? 'on' : ''}" data-act="sign" data-v="1">Thu</button></div>` : ''}
        <div class="field"><label for="f-label">Tên</label><input id="f-label" class="input" name="label" value="${esc(d.label)}" autocomplete="off" placeholder="${KIND_NAME[d.kind]}"></div>
        <div class="field"><label for="f-amount">Số tiền${once ? '' : ' mỗi tháng'}</label>
          <input id="f-amount" class="input big ${isIncome(d) ? 'pos' : 'neg'}" name="amount" data-money inputmode="numeric" autocomplete="off" placeholder="0" value="${d.amount ? group(d.amount) : ''}"></div>
        ${once
          ? `<div class="field"><label for="f-date">Ngày</label><input id="f-date" class="input" type="date" name="date" value="${d.date || todayIso}"></div>`
          : `<div class="field"><label for="f-day">Ngày trong tháng</label><select id="f-day" class="input" name="day">${dayOpts}</select></div>
             <div class="two">
               <div class="field"><label for="f-from">Từ tháng</label><input id="f-from" class="input" type="month" name="from" value="${d.from || ''}"></div>
               <div class="field"><label for="f-until">Đến tháng</label><input id="f-until" class="input" type="month" name="until" value="${d.until || ''}"></div>
             </div>
             <p class="hint">Để trống "Đến tháng" nếu không có hạn.</p>`}
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
      S = next; if (!S.active) S.active = curKey;
      save(); resetSel(); render(false); toast('Đã khôi phục');
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
      case 'pick-month': openMonths(); break;
      case 'set-month': S.active = v; save(); resetSel(); closeSheet(); render(false); break;
      case 'sel': ui.sel = Number(v); render(); break;
      case 'seg': ui.seg = v; render(false); break;
      case 'add': openItem(null, v); break;
      case 'edit': openItem(el.dataset.id); break;
      case 'sign': {
        draft = { ...readItem($sheet.querySelector('form')), sign: Number(v) };
        paintItem(); break;
      }
      case 'del-item':
        if (confirm(`Xoá "${draft.label || KIND_NAME[draft.kind]}"?`)) {
          S.items = S.items.filter(i => i.id !== draft.id);
          save(); closeSheet(); render(); toast('Đã xoá');
        }
        break;
      case 'export': exportBackup(); break;
      case 'clear':
        if (confirm('Xoá toàn bộ dữ liệu trên máy này?') && confirm('Xác nhận lần cuối: không thể khôi phục nếu chưa có bản sao lưu.')) {
          S = D.migrate(null); S.active = curKey;
          // drop the earlier data too, so it is not converted back in on the next launch
          [OLD_KEY, 'rootcash:v1'].forEach(k => { try { localStorage.removeItem(k); } catch { /* ignore */ } });
          save(); resetSel(); ui.seg = 'fixed'; render(false); toast('Đã xoá toàn bộ dữ liệu');
        }
        break;
      case 'close': closeSheet(); break;
    }
  });

  document.addEventListener('input', e => {
    const t = e.target;
    const has = digits(t.value) !== '';
    const n = Number(digits(t.value)) || 0;
    if (t.matches('[data-money], [data-amount]')) t.value = has ? group(n) : '';
    else if (t.matches('[data-opening]')) {
      if (has) S.openings[A()] = n; else delete S.openings[A()];
      t.value = has ? group(n) : '';
      save(); liveUpdate();
    } else if (t.matches('[data-living]')) {
      S.living[A()] = n; t.value = has ? group(n) : '';
      save(); liveUpdate();
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
    if (t.matches('[data-opening], [data-living]')) render();
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
