/* Cirrus Linux — desktop shell: panel, start menu, desktop icons, quick settings, lock screen, boot */
(function () {
  'use strict';
  const $ = OS.$, esc = OS.esc, gl = OS.glyph;
  const desk = (OS.desktop = {});

  function buildScreen() {
    document.body.insertAdjacentHTML('beforeend', `
    <div id="screen">
      <div id="wallpaper"></div>
      <div id="workspace"><div id="desk-icons"></div></div>
      <div id="panel">
        <button class="pbtn" id="start-btn" title="Applications (Alt+Space)">${OS.logo(30)}</button>
        <button class="pbtn hide-m" id="ov-btn" title="Overview">${gl('overview')}</button>
        <div class="tsep hide-m"></div>
        <div id="tasks"></div>
        <div id="tray">
          <button class="pbtn" id="tray-btn" title="Quick settings"><span id="tray-net"></span><span id="tray-vol"></span><span id="tray-bat"></span></button>
          <button class="pbtn" id="clock-btn"><span id="clock-t"></span><small id="clock-d"></small></button>
          <button class="pbtn" id="ov-btn-m" title="Windows" style="display:none">${gl('overview')}</button>
        </div>
      </div>
      <div id="startmenu" class="menu-surface" hidden></div>
      <div id="quick" class="menu-surface" hidden></div>
      <div id="calpop" class="menu-surface" hidden></div>
      <div id="toasts"></div>
    </div>
    <div class="ov" id="ov-bright"></div><div class="ov" id="ov-night"></div>`);
  }

  /* ================= panel ================= */
  function renderTasks() {
    const host = $('#tasks'); if (!host) return;
    const s = OS.settings; const shown = [];
    s.pinned.forEach((id) => { if (OS.apps[id] && OS.pkg.appAvailable(id)) shown.push(id); });
    OS.wm.wins.forEach((w) => { if (!shown.includes(w.app)) shown.push(w.app); });
    host.innerHTML = '';
    shown.forEach((id) => {
      const app = OS.apps[id], wins = OS.wm.byApp(id);
      const active = OS.wm.active && OS.wm.active.app === id;
      const label = s.showLabels && wins.length ? `<span class="lbl">${esc(wins[wins.length - 1].title)}</span>` : '';
      const b = OS.el(`<button class="pbtn task ${wins.length ? 'running' : ''} ${active ? 'active' : ''}" title="${esc(app.name)}">${OS.appIcon(app)}${label}</button>`);
      b.onclick = () => {
        if (!wins.length) return OS.wm.open(id);
        if (wins.length === 1) { const w = wins[0]; if (OS.wm.active === w && !w.min) OS.wm.minimize(w); else OS.wm.focus(w); return; }
        const r = b.getBoundingClientRect();
        OS.menu(r.left, s.panelPos === 'top' ? r.bottom + 6 : r.top - 10 - wins.length * 38 - 50, [...wins.map((w) => ({ label: w.title, icon: app.icon, action: () => OS.wm.focus(w) })), '-', { label: 'New window', icon: 'plus', action: () => OS.wm.open(id) }]);
      };
      OS.onContext(b, (e, x, y) => {
        const pinned = s.pinned.includes(id);
        OS.menu(x, y - 140, [
          { label: 'New window', icon: 'plus', action: () => OS.wm.open(id), disabled: app.single && wins.length },
          { label: pinned ? 'Unpin from panel' : 'Pin to panel', icon: 'star', action: () => OS.set('pinned', pinned ? s.pinned.filter((x) => x !== id) : [...s.pinned, id]) },
          wins.length && '-', wins.length && { label: wins.length > 1 ? `Close ${wins.length} windows` : 'Close window', icon: 'x', danger: true, action: () => wins.forEach((w) => OS.wm.close(w)) },
        ]);
      });
      host.appendChild(b);
    });
  }

  function updateTray() {
    const on = navigator.onLine;
    $('#tray-net').innerHTML = gl(on ? 'wifi' : 'wifioff');
    $('#tray-vol').innerHTML = gl(OS.settings.volume === 0 ? 'mute' : 'volume');
    const d = new Date();
    $('#clock-t').textContent = OS.fmtTime(d, OS.settings.showSeconds);
    $('#clock-d').textContent = d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + (OS.isMobile() ? '' : ', ' + d.toLocaleDateString([], { weekday: 'short' }));
    const badge = $('#tray-btn .badge');
    if (desk.unread && !badge) $('#tray-btn').insertAdjacentHTML('beforeend', '<i class="badge"></i>'); else if (!desk.unread && badge) badge.remove();
    $('#ov-btn-m').style.display = OS.isMobile() ? '' : 'none';
  }
  let battery = null;
  function updateBattery() {
    const el = $('#tray-bat'); if (!el) return;
    if (!battery) { el.innerHTML = ''; return; }
    const lvl = Math.round(battery.level * 100);
    el.innerHTML = `<svg class="g" viewBox="0 0 24 24"><rect x="2" y="7" width="17" height="10" rx="2.5"/><path d="M22 11v2"/><rect x="4.5" y="9.5" width="${Math.max(1, 12 * battery.level)}" height="5" rx="1" fill="currentColor" stroke="none"/></svg><span class="hide-m" style="font-size:12px">${lvl}%</span>`;
  }

  /* ================= start menu ================= */
  const CATS = ['All', 'Accessories', 'Internet', 'Office', 'Graphics', 'Multimedia', 'Games', 'System'];
  let smCat = 'All', smSel = 0;
  function openStart() {
    const sm = $('#startmenu');
    if (!sm.hidden) return closeStart();
    closePops(); sm.hidden = false; sm.classList.remove('pop-anim'); void sm.offsetWidth; sm.classList.add('pop-anim');
    $('#start-btn').classList.add('on');
    const s = OS.settings;
    sm.innerHTML = `
      <div class="sm-search">${gl('search')}<input placeholder="Search apps, files, or type a command…" spellcheck="false" autocomplete="off"></div>
      <div class="chips">${CATS.map((c) => `<button class="chip ${c === smCat ? 'on' : ''}" data-c="${c}">${c}</button>`).join('')}</div>
      <div class="sm-body"></div>
      <div class="sm-foot">
        <button class="user"><span class="avatar" style="width:36px;height:36px;background:${s.avatar}">${esc((s.fullname || s.username)[0].toUpperCase())}</span><div style="min-width:0"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.fullname)}</b><small class="muted">${esc(s.username)}@${esc(s.hostname)}</small></div></button>
        <button class="ibtn" data-p="settings" title="Settings">${gl('gear')}</button>
        <button class="ibtn" data-p="lock" title="Lock">${gl('lock')}</button>
        <button class="ibtn" data-p="power" title="Power">${gl('power')}</button>
      </div>`;
    const inp = sm.querySelector('input');
    sm.querySelectorAll('.chip').forEach((c) => (c.onclick = () => { smCat = c.dataset.c; sm.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === c)); renderStartBody(''); inp.value = ''; }));
    inp.oninput = () => { smSel = 0; renderStartBody(inp.value.trim()); };
    inp.onkeydown = (e) => {
      const items = sm.querySelectorAll('.sm-body [data-run]');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); smSel = OS.clamp(smSel + (e.key === 'ArrowDown' ? 1 : -1), 0, items.length - 1); items.forEach((x, i) => x.classList.toggle('kb', i === smSel)); items[smSel]?.scrollIntoView({ block: 'nearest' }); }
      if (e.key === 'Enter') { items[smSel]?.click(); }
      if (e.key === 'Escape') closeStart();
    };
    sm.querySelector('.user').onclick = () => { closeStart(); OS.wm.open('settings', { page: 'users' }); };
    sm.querySelector('[data-p=settings]').onclick = () => { closeStart(); OS.wm.open('settings'); };
    sm.querySelector('[data-p=lock]').onclick = () => { closeStart(); desk.lock(); };
    sm.querySelector('[data-p=power]').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); powerMenu(r.left - 150, r.top - 150); };
    renderStartBody('');
    if (!OS.isTouch()) setTimeout(() => inp.focus(), 50);
  }
  function powerMenu(x, y) {
    OS.menu(x, y, [
      { label: 'Lock', icon: 'lock', action: () => { closeStart(); desk.lock(); } },
      { label: 'Log out', icon: 'user', action: () => { closeStart(); OS.wm.closeAll(); desk.lock(); } },
      { label: 'Restart', icon: 'restart', action: () => { closeStart(); desk.restart(); } },
      { label: 'Shut down', icon: 'power', danger: true, action: () => { closeStart(); desk.shutdown(); } },
    ]);
  }
  function appList() { return Object.values(OS.apps).filter((a) => !a.hidden && OS.pkg.appAvailable(a.id)).sort((a, b) => a.name.localeCompare(b.name)); }
  function renderStartBody(q) {
    const body = $('#startmenu .sm-body'); if (!body) return;
    const run = (fn) => () => { closeStart(); fn(); };
    if (!q) {
      const apps = appList().filter((a) => smCat === 'All' || a.cat === smCat);
      const pinned = OS.settings.pinned.filter((id) => OS.apps[id] && OS.pkg.appAvailable(id));
      body.innerHTML = (smCat === 'All' && pinned.length ? `<div class="sm-title">Pinned</div><div class="app-grid pin"></div>` : '') + `<div class="sm-title">${smCat === 'All' ? 'All apps' : smCat}</div><div class="app-grid all"></div>`;
      const tile = (a) => { const b = OS.el(`<button class="app-tile" data-run>${OS.appIcon(a)}<span>${esc(a.name)}</span></button>`); b.onclick = run(() => OS.wm.open(a.id)); OS.onContext(b, (e, x, y) => appCtx(a, x, y)); return b; };
      if (body.querySelector('.pin')) pinned.forEach((id) => body.querySelector('.pin').appendChild(tile(OS.apps[id])));
      apps.forEach((a) => body.querySelector('.all').appendChild(tile(a)));
      if (!apps.length) body.querySelector('.all').innerHTML = '<div class="muted pad">No apps in this category. Get more in Software.</div>';
      return;
    }
    const ql = q.toLowerCase();
    const apps = appList().filter((a) => a.name.toLowerCase().includes(ql) || a.id.includes(ql) || (a.keywords || '').includes(ql) || a.cat.toLowerCase().includes(ql));
    const files = OS.fs.find(OS.home(), (n) => n.toLowerCase().includes(ql) && !n.startsWith('.'), 8).filter((p) => p !== OS.home());
    const notInst = Object.keys(OS.pkg.repo).filter((n) => OS.pkg.repo[n].type === 'app' && !OS.pkg.isInstalled(n) && OS.apps[n] && OS.apps[n].name.toLowerCase().includes(ql));
    let h = '';
    if (apps.length) h += `<div class="sm-title">Apps</div><div class="r-apps"></div>`;
    if (notInst.length) h += `<div class="sm-title">Available to install</div><div class="r-inst"></div>`;
    if (files.length) h += `<div class="sm-title">Files</div><div class="r-files"></div>`;
    h += `<div class="sm-title">Actions</div><div class="r-act"></div>`;
    body.innerHTML = h;
    const row = (icon, title, sub, fn) => { const b = OS.el(`<button class="sm-row" data-run>${icon}<div><b>${esc(title)}</b><small>${esc(sub)}</small></div></button>`); b.onclick = run(fn); return b; };
    apps.forEach((a) => body.querySelector('.r-apps').appendChild(row(OS.appIcon(a), a.name, a.desc || a.cat, () => OS.wm.open(a.id))));
    notInst.forEach((n) => body.querySelector('.r-inst').appendChild(row(OS.appIcon(n), OS.apps[n].name, 'Open in Software to install', () => OS.wm.open('software', { q: n }))));
    files.forEach((p) => body.querySelector('.r-files').appendChild(row(`<span class="ico">${OS.fileIcon(OS.fs.basename(p), OS.fs.isDir(p))}</span>`, OS.fs.basename(p), OS.fs.pretty(p), () => desk.openPath(p))));
    const act = body.querySelector('.r-act');
    act.appendChild(row(OS.appIcon('terminal'), `Run "${q}"`, 'Execute in a new terminal', () => OS.wm.open('terminal', { cmd: q })));
    if (OS.apps.assistant && OS.pkg.appAvailable('assistant')) act.appendChild(row(OS.appIcon('assistant'), `Ask Cumulo: "${q}"`, 'The all-knowing assistant', () => OS.wm.open('assistant', { q })));
    act.appendChild(row(OS.appIcon('browser'), `Search the web for "${q}"`, 'Opens the Browser', () => OS.wm.open('browser', { url: q })));
    let calcV = null; try { calcV = OS.calc(q); } catch (e) {}
    if (calcV != null && isFinite(calcV) && /[\d)]/.test(q) && /[-+*/^%()a-z]/i.test(q)) act.prepend(row(OS.appIcon('calculator'), `= ${+calcV.toPrecision(12)}`, q, () => OS.wm.open('calculator', { expr: q })));
    body.querySelectorAll('[data-run]').forEach((x, i) => x.classList.toggle('kb', i === smSel));
  }
  function appCtx(a, x, y) {
    const pinned = OS.settings.pinned.includes(a.id);
    OS.menu(x, y, [
      { label: 'Open', icon: 'external', action: () => { closeStart(); OS.wm.open(a.id); } },
      { label: pinned ? 'Unpin' : 'Pin to panel', icon: 'star', action: () => { OS.set('pinned', pinned ? OS.settings.pinned.filter((z) => z !== a.id) : [...OS.settings.pinned, a.id]); renderStartBody(''); } },
      { label: 'Add to desktop', icon: 'monitor', action: () => { OS.fs.write(OS.fs.uniqueName(OS.home() + '/Desktop', a.name + '.desktop'), `[Desktop Entry]\nType=Application\nName=${a.name}\nExec=${a.id}\n`); } },
      OS.pkg.repo[a.id] && !OS.pkg.repo[a.id].core && '-',
      OS.pkg.repo[a.id] && !OS.pkg.repo[a.id].core && { label: 'Uninstall', icon: 'trash', danger: true, action: async () => { if (await OS.confirm(`Uninstall ${a.name}?`, 'You can reinstall it later from Software.', 'Uninstall', true)) { await OS.pkg.remove(a.id); OS.notify(`${a.name} removed`, '', { icon: 'package' }); renderStartBody(''); } } },
    ]);
  }
  function closeStart() { const sm = $('#startmenu'); if (sm) sm.hidden = true; $('#start-btn')?.classList.remove('on'); }
  desk.toggleStart = openStart;

  /* ================= quick settings ================= */
  function openQuick() {
    const q = $('#quick'); if (!q.hidden) return closePops();
    closePops(); q.hidden = false; q.classList.remove('pop-anim'); void q.offsetWidth; q.classList.add('pop-anim');
    desk.unread = 0; updateTray(); renderQuick();
  }
  function renderQuick() {
    const q = $('#quick'), s = OS.settings; if (q.hidden) return;
    const net = navigator.connection; const on = navigator.onLine;
    const tile = (k, icon, title, sub, onState) => `<button class="qs-tile ${onState ? 'on' : ''}" data-k="${k}"><span class="gi">${gl(icon)}</span><div style="min-width:0"><b>${title}</b><small>${sub}</small></div></button>`;
    q.innerHTML = `
      <div class="qs-grid">
        ${tile('net', on ? 'wifi' : 'wifioff', 'Network', on ? (net && net.effectiveType ? 'Connected · ' + net.effectiveType.toUpperCase() : 'Connected') : 'Offline', on)}
        ${tile('dark', 'moon', 'Dark Style', s.theme === 'dark' ? 'On' : s.theme === 'auto' ? 'Auto' : 'Off', s.theme === 'dark')}
        ${tile('night', 'sun', 'Night Light', s.nightLight ? 'On' : 'Off', s.nightLight)}
        ${tile('dnd', s.dnd ? 'belloff' : 'bell', 'Do Not Disturb', s.dnd ? 'On' : 'Off', s.dnd)}
        ${tile('full', 'monitor', 'Fullscreen', document.fullscreenElement ? 'On' : 'Off', !!document.fullscreenElement)}
        ${tile('shot', 'camera', 'Screenshot', 'Save to Pictures', false)}
      </div>
      <div class="qs-slider">${gl(s.volume ? 'volume' : 'mute')}<input type="range" min="0" max="100" value="${s.volume}" data-r="volume"></div>
      <div class="qs-slider">${gl('sun')}<input type="range" min="20" max="100" value="${s.brightness}" data-r="brightness"></div>
      ${battery ? `<div class="row small muted" style="margin:0 4px 6px">${gl('battery')} Battery ${Math.round(battery.level * 100)}% ${battery.charging ? '· charging' : ''}</div>` : ''}
      <div class="row" style="gap:6px;margin-top:8px"><button class="btn sm" data-a="settings">${gl('gear')}Settings</button><span class="spacer"></span><button class="ibtn" data-a="lock" title="Lock">${gl('lock')}</button><button class="ibtn" data-a="power" title="Power">${gl('power')}</button></div>
      <div class="qs-head"><span>Notifications</span>${OS.notifications.length ? '<button class="btn sm" data-a="clear">Clear all</button>' : ''}</div>
      <div class="qs-notifs">${OS.notifications.length ? OS.notifications.slice(0, 20).map((n) => `<div class="notif">${n.app && OS.apps[n.app] ? OS.appIcon(n.app) : `<span class="app-ico" style="background:linear-gradient(140deg,var(--accent),#8b5cff)">${gl(n.icon, '')}</span>`}<div style="min-width:0;flex:1"><b>${esc(n.title)}</b><small>${esc(n.body)}</small><small>${OS.fmtTime(new Date(n.time))}</small></div></div>`).join('') : '<div class="muted small" style="text-align:center;padding:16px">No notifications</div>'}</div>`;
    q.querySelectorAll('.qs-tile').forEach((t) => (t.onclick = () => {
      const k = t.dataset.k;
      if (k === 'dark') OS.set('theme', s.theme === 'dark' ? 'light' : 'dark');
      if (k === 'night') OS.set('nightLight', !s.nightLight);
      if (k === 'dnd') OS.set('dnd', !s.dnd);
      if (k === 'net') { closePops(); OS.wm.open('settings', { page: 'network' }); return; }
      if (k === 'full') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {}); setTimeout(renderQuick, 300); return; }
      if (k === 'shot') { closePops(); setTimeout(desk.screenshot, 300); return; }
      renderQuick();
    }));
    q.querySelectorAll('[data-r]').forEach((r) => (r.oninput = () => { OS.settings[r.dataset.r] = +r.value; OS.saveSettings(); OS.applySettings(); updateTray(); OS.emit('settings', r.dataset.r, +r.value); }));
    q.querySelector('[data-r=volume]').onchange = () => OS.sound('click');
    q.querySelector('[data-a=settings]').onclick = () => { closePops(); OS.wm.open('settings'); };
    q.querySelector('[data-a=lock]').onclick = () => { closePops(); desk.lock(); };
    q.querySelector('[data-a=power]').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); powerMenu(r.left - 160, r.top - 160); };
    const c = q.querySelector('[data-a=clear]'); if (c) c.onclick = () => { OS.notifications.length = 0; renderQuick(); };
  }

  /* ================= calendar popup ================= */
  let calMonth = null;
  function openCal() {
    const c = $('#calpop'); if (!c.hidden) return closePops();
    closePops(); c.hidden = false; c.classList.remove('pop-anim'); void c.offsetWidth; c.classList.add('pop-anim');
    calMonth = new Date(); calMonth.setDate(1); renderCal();
  }
  function renderCal() {
    const c = $('#calpop'), d = new Date(), y = calMonth.getFullYear(), m = calMonth.getMonth();
    const first = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    let cells = ''; for (let i = 0; i < first; i++) cells += '<span></span>';
    for (let i = 1; i <= days; i++) cells += `<button class="${i === d.getDate() && m === d.getMonth() && y === d.getFullYear() ? 'today' : ''}">${i}</button>`;
    c.innerHTML = `<div style="font-size:13px" class="muted">${d.toLocaleDateString([], { weekday: 'long' })}</div><div style="font-size:22px;font-weight:600;margin-bottom:12px">${d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <div class="row" style="margin-bottom:8px"><b style="flex:1">${calMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}</b><button class="ibtn" data-m="-1">${gl('left')}</button><button class="ibtn" data-m="1">${gl('right')}</button></div>
      <div class="cal-grid">${['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((x) => `<span class="dn">${x}</span>`).join('')}${cells}</div>
      <button class="btn sm" style="width:100%;margin-top:10px" data-open>Open Calendar</button>`;
    c.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { calMonth.setMonth(calMonth.getMonth() + +b.dataset.m); renderCal(); }));
    c.querySelector('[data-open]').onclick = () => { closePops(); OS.wm.open('calendar'); };
  }
  function closePops() { ['#quick', '#calpop'].forEach((s) => { const e = $(s); if (e) e.hidden = true; }); closeStart(); closeOverview(); }
  desk.closePops = closePops;

  /* ================= overview ================= */
  function openOverview() {
    if ($('#overview')) return closeOverview();
    closePops();
    const ov = OS.el(`<div id="overview"><h2>${OS.wm.wins.length ? 'Open windows' : 'No open windows'}</h2><div class="ov-grid"></div><div class="row" style="justify-content:center;gap:8px;margin-top:auto"><button class="btn" data-a="desk">${gl('monitor')}Show desktop</button>${OS.wm.wins.length ? `<button class="btn danger" data-a="closeall">${gl('x')}Close all</button>` : ''}</div></div>`);
    OS.wm.wins.forEach((w) => {
      const app = OS.apps[w.app];
      const c = OS.el(`<div class="ov-card"><div class="oh">${OS.appIcon(app)}<span class="t">${esc(w.title)}</span><button class="ibtn" title="Close">${gl('x')}</button></div><div class="ob">${OS.appIcon(app)}</div></div>`);
      c.onclick = () => { closeOverview(); OS.wm.focus(w); };
      c.querySelector('.ibtn').onclick = (e) => { e.stopPropagation(); OS.wm.close(w); c.remove(); };
      ov.querySelector('.ov-grid').appendChild(c);
    });
    ov.onclick = (e) => { if (e.target === ov) closeOverview(); };
    ov.querySelector('[data-a=desk]').onclick = () => { closeOverview(); OS.wm.wins.forEach((w) => OS.wm.minimize(w)); };
    const ca = ov.querySelector('[data-a=closeall]'); if (ca) ca.onclick = () => { closeOverview(); OS.wm.closeAll(); };
    $('#workspace').appendChild(ov);
  }
  function closeOverview() { $('#overview')?.remove(); }
  desk.overview = openOverview;

  /* ================= desktop icons ================= */
  const sysIcons = () => [
    { name: 'Home', icon: `<span class="ico">${OS.fileIcon('Home', true)}</span>`, open: () => OS.wm.open('files', { path: OS.home() }) },
    { name: OS.fs.trashCount() ? 'Trash (full)' : 'Trash', icon: OS.appIcon('trash'), open: () => OS.wm.open('trash') },
  ];
  function renderDesktop() {
    const host = $('#desk-icons'); if (!host) return;
    host.innerHTML = '';
    if (!OS.settings.desktopIcons) return;
    const dir = OS.home() + '/Desktop';
    const items = [...sysIcons(), ...(OS.fs.isDir(dir) ? OS.fs.ls(dir) : []).filter((f) => !f.name.startsWith('.')).map((f) => {
      const desktopApp = f.name.endsWith('.desktop') ? (/Exec=(\S+)/.exec(OS.fs.read(f.path)) || [])[1] : null;
      return { name: desktopApp && OS.apps[desktopApp] ? OS.apps[desktopApp].name : f.name, path: f.path, f, icon: desktopApp && OS.apps[desktopApp] ? OS.appIcon(desktopApp) : `<span class="ico">${thumb(f)}</span>`, open: () => (desktopApp && OS.apps[desktopApp] ? OS.wm.open(desktopApp) : desk.openPath(f.path)) };
    })];
    items.forEach((it) => {
      const el = OS.el(`<div class="dicon" tabindex="0"><div class="ico">${it.icon}</div><span>${esc(it.name)}</span></div>`);
      el.onclick = (e) => { host.querySelectorAll('.sel').forEach((x) => x.classList.remove('sel')); el.classList.add('sel'); if (OS.isTouch() && e.pointerType !== 'mouse') it.open(); };
      el.ondblclick = () => it.open();
      el.onkeydown = (e) => { if (e.key === 'Enter') it.open(); if (e.key === 'Delete' && it.path) OS.fs.trash(it.path); };
      OS.onContext(el, (e, x, y) => {
        host.querySelectorAll('.sel').forEach((z) => z.classList.remove('sel')); el.classList.add('sel');
        if (!it.path) return OS.menu(x, y, [{ label: 'Open', icon: 'external', action: it.open }, it.name.startsWith('Trash') && { label: 'Empty Trash', icon: 'trash', danger: true, action: () => OS.fs.emptyTrash() }]);
        OS.menu(x, y, [
          { label: 'Open', icon: 'external', action: it.open },
          { label: 'Open with Text Editor', icon: 'edit', action: () => OS.wm.open('editor', { path: it.path }), disabled: it.f.type === 'dir' },
          '-', { label: 'Rename…', icon: 'edit', key: 'F2', action: async () => { const n = await OS.prompt('Rename', '', it.f.name); if (n && n !== it.f.name) try { OS.fs.mv(it.path, OS.fs.join(dir, n)); } catch (er) { OS.alert('Error', er.message); } } },
          { label: 'Copy', icon: 'copy', action: () => (OS.clipboard = { mode: 'copy', paths: [it.path] }) },
          { label: 'Download to device', icon: 'download', disabled: it.f.type === 'dir', action: () => OS.downloadReal(it.f.name, OS.fs.read(it.path)) },
          '-', { label: 'Move to Trash', icon: 'trash', danger: true, key: 'Del', action: () => OS.fs.trash(it.path) },
        ]);
      });
      host.appendChild(el);
    });
  }
  function thumb(f) {
    if (f.type === 'file' && OS.ftype(f.name) === 'image') { try { return `<img src="${esc(OS.toDataUrl(OS.fs.read(f.path), f.name))}" alt="" loading="lazy">`; } catch (e) {} }
    return OS.fileIcon(f.name, f.type === 'dir');
  }
  desk.thumb = thumb;

  function deskContext(x, y) {
    const dir = OS.home() + '/Desktop';
    OS.menu(x, y, [
      { label: 'New Folder', icon: 'folder', action: async () => { const n = await OS.prompt('New Folder', '', 'New Folder'); if (n) try { OS.fs.mkdir(OS.fs.join(dir, n)); } catch (e) { OS.alert('Error', e.message); } } },
      { label: 'New Text File', icon: 'filetext', action: async () => { const n = await OS.prompt('New File', '', 'Untitled.txt'); if (n) try { OS.fs.write(OS.fs.uniqueName(dir, n), ''); } catch (e) { OS.alert('Error', e.message); } } },
      { label: 'Paste', icon: 'clipboard', disabled: !OS.clipboard, action: () => desk.paste(dir) },
      { label: 'Import files from device…', icon: 'upload', action: () => OS.uploadPicker(dir) },
      '-',
      { label: 'Open Terminal Here', icon: 'terminal', action: () => OS.wm.open('terminal', { cwd: dir }) },
      { label: 'Open in Files', icon: 'folder', action: () => OS.wm.open('files', { path: dir }) },
      '-',
      { label: 'Change Wallpaper…', icon: 'image', action: () => OS.wm.open('settings', { page: 'appearance' }) },
      { label: 'Display Settings', icon: 'monitor', action: () => OS.wm.open('settings', { page: 'display' }) },
      { label: 'Refresh', icon: 'refresh', action: renderDesktop },
    ]);
  }
  desk.paste = (dir) => {
    const c = OS.clipboard; if (!c) return;
    c.paths.forEach((p) => {
      try {
        if (!OS.fs.exists(p)) return;
        let dst = OS.fs.join(dir, OS.fs.basename(p));
        if (OS.fs.exists(dst) && (c.mode === 'copy' || OS.fs.dirname(p) !== dir)) dst = OS.fs.uniqueName(dir, OS.fs.basename(p));
        if (c.mode === 'cut') OS.fs.mv(p, dst); else OS.fs.cp(p, dst, { r: true });
      } catch (e) { OS.alert('Paste failed', e.message); }
    });
    if (c.mode === 'cut') OS.clipboard = null;
  };

  /* open a file with the right app */
  desk.openPath = (p, how) => {
    if (!OS.fs.exists(p)) return OS.alert('Not found', p + ' does not exist.');
    if (OS.fs.isDir(p)) return OS.wm.open('files', { path: p });
    const name = OS.fs.basename(p), t = OS.ftype(name);
    if (how) return OS.wm.open(how, { path: p });
    if (name.endsWith('.desktop')) { const m = /Exec=(\S+)/.exec(OS.fs.read(p)); if (m && OS.apps[m[1]]) return OS.wm.open(m[1]); }
    const ex = OS.ext(name);
    if (ex === 'md' && OS.fs.dirname(p) === OS.home() + '/Documents/Help' && OS.apps.help) return OS.wm.open('help', { doc: name });
    if (['cdoc', 'doc'].includes(ex)) return OS.wm.open('writer', { path: p });
    if (['csht', 'csv', 'tsv'].includes(ex)) return OS.wm.open('sheets', { path: p });
    if (ex === 'cslide') return OS.wm.open('slides', { path: p });
    if (ex === 'beat' && OS.pkg.appAvailable('beatforge')) return OS.wm.open('beatforge', { path: p });
    if (ex === 'sprout' && OS.pkg.appAvailable('sprout')) return OS.wm.open('sprout', { path: p });
    if (t === 'code' && OS.pkg.appAvailable('code')) return OS.wm.open('code', { path: p });
    if (['docx', 'odt', 'xlsx', 'ods', 'pptx', 'odp'].includes(ex)) return OS.alert('Binary office file', `Cumulus Office can't read .${ex} files. Export them as .doc/HTML, .csv or plain text first.`);
    if (t === 'image' || t === 'video') return OS.wm.open('viewer', { path: p });
    if (t === 'audio') return OS.wm.open('music', { path: p });
    if (t === 'html') return OS.wm.open('browser', { url: 'file://' + p });
    if (t === 'archive' || t === 'pdf') { const c = OS.fs.read(p); if (OS.isDataUrl(c) && t === 'pdf') return OS.wm.open('browser', { url: 'file://' + p }); return OS.alert('Cannot open file', `There is no app installed for “.${OS.ext(name)}” files.`); }
    return OS.wm.open('editor', { path: p });
  };

  /* screenshot (vector re-render isn't possible in-browser; save an SVG snapshot of window layout) */
  desk.screenshot = () => {
    const W = innerWidth, H = innerHeight;
    const flash = OS.el('<div style="position:fixed;inset:0;background:#fff;z-index:999999;opacity:.8;transition:opacity .4s;pointer-events:none"></div>');
    document.body.appendChild(flash); setTimeout(() => (flash.style.opacity = 0), 30); setTimeout(() => flash.remove(), 450);
    const bg = getComputedStyle($('#wallpaper')).backgroundImage;
    const wins = OS.wm.wins.filter((w) => !w.min).sort((a, b) => a.el.style.zIndex - b.el.style.zIndex).map((w) => { const r = w.el.getBoundingClientRect(); const a = OS.apps[w.app]; return `<g><rect x="${r.left}" y="${r.top}" width="${r.width}" height="${r.height}" rx="12" fill="${getComputedStyle(w.el).backgroundColor}" stroke="#0003"/><rect x="${r.left}" y="${r.top}" width="${r.width}" height="44" rx="12" fill="${a.color[0]}"/><text x="${r.left + r.width / 2}" y="${r.top + 27}" fill="#fff" font-family="sans-serif" font-size="14" text-anchor="middle">${esc(w.title)}</text></g>`; }).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${W}px;height:${H}px;background:${esc(OS.wallpaperCss(OS.settings.wallpaper)).replace(/&quot;/g, "'")};background-size:cover"></div></foreignObject>${wins}<rect y="${H - 54}" width="${W}" height="54" fill="#0008"/></svg>`;
    void bg;
    OS.fs.mkdir(OS.home() + '/Pictures', { p: true });
    const p = OS.fs.uniqueName(OS.home() + '/Pictures', `Screenshot ${new Date().toISOString().slice(0, 19).replace('T', ' ').replace(/:/g, '-')}.svg`);
    OS.fs.write(p, svg);
    OS.notify('Screenshot taken', 'Saved to ' + OS.fs.pretty(p), { icon: 'camera', onclick: () => OS.wm.open('viewer', { path: p }) });
  };

  /* ================= lock / boot / power ================= */
  desk.lock = (fromBoot) => {
    closePops();
    let lk = $('#lock'); if (lk) lk.remove();
    const s = OS.settings;
    lk = OS.el(`<div id="lock"><div class="lbg"></div><div class="lcontent">
      <div class="ltime"></div><div class="ldate"></div>
      <div class="avatar" style="background:${s.avatar}">${esc((s.fullname || s.username)[0].toUpperCase())}</div>
      <div class="lname">${esc(s.fullname)}</div><div class="luser">${esc(s.username)}@${esc(s.hostname)}</div>
      <div class="lform">${s.password ? `<input type="password" placeholder="Password" autocomplete="current-password">` : ''}<button class="lbtn" title="Unlock">${gl('right')}</button></div>
      <div class="lerr"></div>
      ${s.password ? '' : '<div class="lhint">Press Enter or tap to unlock</div>'}
    </div><div class="lpower"><button class="lbtn" data-a="restart" title="Restart">${gl('restart')}</button><button class="lbtn" data-a="off" title="Shut down">${gl('power')}</button></div></div>`);
    lk.querySelector('.lbg').style.background = OS.wallpaperCss(s.wallpaper);
    document.body.appendChild(lk);
    const tick = () => { const d = new Date(); lk.querySelector('.ltime').textContent = OS.fmtTime(d); lk.querySelector('.ldate').textContent = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }); };
    tick(); const t = setInterval(tick, 1000);
    const inp = lk.querySelector('input'); let fails = 0;
    const unlock = () => {
      if (s.password && inp.value !== s.password) { fails++; lk.querySelector('.lerr').textContent = 'Incorrect password, try again' + (s.passwordHint && fails >= 2 ? ` · Hint: ${s.passwordHint}` : ''); lk.querySelector('.lform').classList.remove('shake'); void lk.offsetWidth; lk.querySelector('.lform').classList.add('shake'); OS.sound('error'); inp.value = ''; return; }
      clearInterval(t); document.removeEventListener('keydown', key, true);
      if (OS.settings.fullscreenOnLogin) OS.enterFullscreen();
      lk.classList.add('gone'); setTimeout(() => lk.remove(), 500);
      OS.sound(fromBoot ? 'startup' : 'unlock');
      if (fromBoot) setTimeout(firstRun, 700);
    };
    const key = (e) => { if (!document.body.contains(lk)) return document.removeEventListener('keydown', key, true); if (e.key === 'Enter') { e.preventDefault(); unlock(); } };
    document.addEventListener('keydown', key, true);
    lk.querySelector('.lform .lbtn').onclick = unlock;
    if (!s.password) lk.querySelector('.lcontent').addEventListener('click', (e) => { if (!e.target.closest('.lpower')) unlock(); });
    lk.querySelector('[data-a=restart]').onclick = (e) => { e.stopPropagation(); clearInterval(t); desk.restart(); };
    lk.querySelector('[data-a=off]').onclick = (e) => { e.stopPropagation(); clearInterval(t); desk.shutdown(); };
    if (inp) setTimeout(() => inp.focus(), 300);
  };
  function firstRun() {
    if (!OS.store.get('welcomed')) {
      OS.store.set('welcomed', 1);
      OS.notify('Welcome to Cirrus Linux', 'Tap the logo to open the app menu. Open Welcome.txt on the desktop for tips.', { icon: 'smile', timeout: 8000, onclick: () => desk.openPath(OS.home() + '/Desktop/Welcome.txt') });
    }
  }

  const KLOG = ['Linux version 6.8.0-cirrus (buildd@cirrus) (gcc (Cirrus 13.2.0) 13.2.0, GNU ld 2.42) #1 SMP PREEMPT_DYNAMIC', 'Command line: BOOT_IMAGE=/boot/vmlinuz-6.8.0-cirrus root=cirrusfs:/ ro quiet splash vt.handoff=7', 'KERNEL supported cpus:', '  Intel GenuineIntel', '  AMD AuthenticAMD', 'x86/fpu: Supporting XSAVE feature 0x001: \'x87 floating point registers\'', 'x86/fpu: Supporting XSAVE feature 0x002: \'SSE registers\'', 'x86/fpu: Enabled xstate features 0x7, context size is 832 bytes', 'BIOS-provided physical RAM map:', 'BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable', 'NX (Execute Disable) protection: active', 'efi: EFI v2.7 by Cirrus UEFI', 'SMBIOS 3.3.0 present.', 'DMI: Cirrus Cloud Machine/Nimbus, BIOS 2.4.1 11/2026', 'tsc: Detected 3200.000 MHz processor', 'Memory: %MEM%K/%MEM%K available (18432K kernel code, 4096K rwdata)', 'SLUB: HWalign=64, Order=0-3, MinObjects=0, CPUs=%CPU%, Nodes=1', 'rcu: Preemptible hierarchical RCU implementation.', 'NR_IRQS: 524544, nr_irqs: 1096, preallocated irqs: 16', 'Console: colour dummy device 80x25', 'printk: console [tty0] enabled', 'ACPI: Core revision 20230628', 'APIC: Switch to symmetric I/O mode setup', 'Calibrating delay loop (skipped), value calculated using timer frequency.. 6400.00 BogoMIPS', 'pid_max: default: 32768 minimum: 301', 'LSM: initializing lsm=lockdown,capability,landlock,yama,apparmor', 'Mount-cache hash table entries: 32768 (order: 6, 262144 bytes, linear)', 'smpboot: CPU0: Cirrus vCPU @ 3.20GHz (family: 0x6, model: 0x9a, stepping: 0x3)', 'smp: Bringing up secondary CPUs ...', 'smp: Brought up 1 node, %CPU% CPUs', 'devtmpfs: initialized', 'NET: Registered PF_NETLINK/PF_ROUTE protocol family', 'ACPI: Interpreter enabled', 'ACPI: PM: (supports S0 S3 S4 S5)', 'PCI: Using host bridge windows from ACPI; if necessary, use "pci=nocrs"', 'pci 0000:00:02.0: vgaarb: setting as boot VGA device', 'SCSI subsystem initialized', 'usbcore: registered new interface driver usbfs', 'clocksource: Switched to clocksource tsc', 'NET: Registered PF_INET protocol family', 'Trying to unpack rootfs image as initramfs...', 'Freeing initrd memory: 61440K', 'Initialise system trusted keyrings', 'zswap: loaded using pool lzo/zbud', 'Key type asymmetric registered', 'Serial: 8250/16550 driver, 32 ports, IRQ sharing enabled', 'nvme nvme0: pci function 0000:01:00.0', 'nvme nvme0: 8/0/0 default/read/poll queues', ' nvme0n1: p1 p2 p3', 'usb 1-1: new high-speed USB device number 2 using xhci_hcd', 'input: Cirrus Touch Keyboard as /devices/virtual/input/input3', 'i915 0000:00:02.0: [drm] Initialized i915 1.6.0 for 0000:00:02.0 on minor 0', 'fbcon: i915drmfb (fb0) is primary device', 'EXT4-fs (nvme0n1p2): mounted filesystem cirrusfs ro with ordered data mode. Quota mode: none.', 'Run /init as init process'];
  const UNITS = [['Journal Service'], ['Load Kernel Modules'], ['Remount Root and Kernel File Systems'], ['Create Static Device Nodes in /dev', 'Creating'], ['Rule-based Manager for Device Events and Files'], ['Coldplug All udev Devices'], ['File System Check on /dev/disk/by-uuid/cirrus-home', 'Checking'], ['/home', 'Mounting', 'Mounted'], ['/boot/efi', 'Mounting', 'Mounted'], ['Load/Save Random Seed'], ['Create Volatile Files and Directories'], ['Network Time Synchronization'], ['Local File Systems', '', 'Reached target'], ['Set console font and keymap'], ['Bluetooth service'], ['D-Bus System Message Bus'], ['Network Manager'], ['Network Manager Wait Online'], ['Network is Online', '', 'Reached target'], ['WPA supplicant'], ['Avahi mDNS/DNS-SD Stack'], ['Cirrus Package Manager (apt) daemon'], ['Snap-free Software Store backend'], ['CUPS Scheduler'], ['Power Profiles daemon'], ['Accounts Service'], ['User Login Management'], ['PipeWire Multimedia Service'], ['WirePlumber Session Manager'], ['UPower battery monitor'], ['Thermal Daemon Service'], ['Cumulo Assistant Service'], ['Cirrus Display Manager'], ['Graphical Interface', '', 'Reached target']];
  const sleepS = (ms, skip) => (skip() ? Promise.resolve() : OS.sleep(ms));
  desk.boot = async () => {
    let b = $('#boot'); if (!b) { b = OS.el('<div id="boot"></div>'); document.body.appendChild(b); }
    b.innerHTML = ''; b.hidden = false; b.style.opacity = 1;
    const bs = OS.settings.bootStyle || 'verbose';
    let skip = bs === 'quick'; const isSkip = () => skip; const sk = (e) => { if (e.type === 'keydown' && !['Escape', ' ', 'Enter'].includes(e.key) && !e.key.startsWith('F')) return; skip = true; }; b.addEventListener('pointerdown', sk); document.addEventListener('keydown', sk);
    const mem = (navigator.deviceMemory || 8) * 1024 * 1024, cpu = navigator.hardwareConcurrency || 4;
    if (bs === 'verbose') {
      // 1. firmware POST
      b.innerHTML = `<div class="post"><div class="post-top"><div class="post-logo">${OS.logo(56)}<div><b>Cirrus UEFI Firmware</b><small>Version 2.4.1 · Copyright (C) 2026 Cirrus Systems</small></div></div><div class="post-lines"></div></div><div class="post-foot"><span><b>F2</b> Setup</span><span><b>F12</b> Boot Menu</span><span><b>Esc</b> / tap to skip</span></div></div>`;
      const pl = b.querySelector('.post-lines'); const line = (t) => pl.insertAdjacentHTML('beforeend', `<div>${t}</div>`);
      line(`CPU: Cirrus vCPU @ 3.20GHz × ${cpu}`); await sleepS(300, isSkip);
      line('Memory Test: <span class="mt">0</span>K'); const mt = pl.querySelector('.mt');
      for (let i = 1; i <= 24 && !skip; i++) { mt.textContent = Math.round((mem * i) / 24); await OS.sleep(40); } mt.textContent = mem + ' OK';
      for (const t of ['USB Device(s): 1 Keyboard, 1 Mouse, 1 Touchscreen', 'Detected NVMe SSD: CIRRUS-CLOUD-SSD 512GB', 'Detected ATAPI CD-ROM: none', 'Secure Boot: Enabled', 'Network: Cirrus Virtual Ethernet (PXE disabled)', 'Display: Cirrus Graphics Adapter, 2560×1600']) { if (skip) break; line(t); await OS.sleep(170); }
      await sleepS(600, isSkip);
      // 2. boot menu with countdown
      if (!skip) {
        const opts = ['Cirrus Linux', 'Advanced options for Cirrus Linux', 'Memory test (memtest86+)', 'UEFI Firmware Settings'];
        b.innerHTML = `<div class="grub"><div class="grub-title">GNU GRUB  version 2.12</div><div class="grub-box">${opts.map((o, i) => `<div class="${i === 0 ? 'sel' : ''}">${i === 0 ? '*' : ' '}${o}</div>`).join('')}</div><div class="grub-help">Use the ↑ and ↓ keys to select which entry is highlighted.<br>Press enter to boot the selected OS, \`e' to edit the commands<br>before booting or \`c' for a command-line.<br><span class="grub-t">The highlighted entry will be executed automatically in 5s.</span></div></div>`;
        for (let t = 5; t > 0 && !skip; t--) { b.querySelector('.grub-t').textContent = `The highlighted entry will be executed automatically in ${t}s.`; await OS.sleep(700); }
        skip = false;
        b.innerHTML = '<div class="log"></div>'; const lg = b.querySelector('.log');
        for (const t of ['Booting `Cirrus Linux\'', '', 'Loading Linux 6.8.0-cirrus ...', 'Loading initial ramdisk ...']) { lg.insertAdjacentHTML('beforeend', `<div>${esc(t)}</div>`); await sleepS(350, isSkip); }
        await sleepS(400, isSkip);
      }
      // 3. kernel + systemd log
      b.innerHTML = '<div class="log"></div>'; const log = b.querySelector('.log');
      let ts = 0; const add = (h) => { log.insertAdjacentHTML('beforeend', `<div>${h}</div>`); if (log.children.length > 80) log.firstChild.remove(); };
      for (const line of KLOG) {
        if (skip) break;
        ts += 0.004 + Math.random() * (ts > 0.5 ? 0.09 : 0.02);
        add(`[${ts.toFixed(6).padStart(12)}] ${esc(line.replace(/%MEM%/g, String(mem * 1000 / 1024 | 0)).replace(/%CPU%/g, cpu))}`);
        await OS.sleep(28 + Math.random() * 55);
      }
      if (!skip) { add(''); add(`Welcome to <b style="color:#7aa2ff">Cirrus Linux 24.11 (Nimbus)</b>!`); add(''); await OS.sleep(300); }
      for (const [name, verb = 'Starting', done = 'Started'] of UNITS) {
        if (skip) break;
        if (done === 'Reached target') add(`[<span class="ok">  OK  </span>] Reached target <b>${esc(name)}</b>.`);
        else { add(`         ${verb} ${esc(name)}...`); await OS.sleep(40 + Math.random() * 120); add(`[<span class="ok">  OK  </span>] ${done === 'Mounted' ? 'Mounted' : done} <b>${esc(name)}</b>.`); }
        await OS.sleep(35 + Math.random() * 80);
      }
    }
    // 4. splash with progress
    b.innerHTML = `<div class="splash"><div>${OS.logo(84)}<div style="font-size:22px;font-weight:600;color:#fff;letter-spacing:.02em">Cirrus Linux</div><div class="bprog"><i></i></div><div class="bmsg">Starting…</div></div></div>`;
    const bar = b.querySelector('.bprog i'), msg = b.querySelector('.bmsg');
    const steps = ['Loading desktop environment', 'Restoring your files', 'Starting system services', 'Loading apps', 'Preparing the login screen'];
    const per = bs === 'quick' ? 30 : bs === 'splash' ? 600 : skip ? 120 : 420;
    for (let i = 0; i < steps.length; i++) { msg.textContent = steps[i] + '…'; bar.style.width = ((i + 1) / steps.length) * 100 + '%'; await OS.sleep(per); }
    b.removeEventListener('pointerdown', sk); document.removeEventListener('keydown', sk);
    b.style.transition = 'opacity .5s'; b.style.opacity = 0;
    setTimeout(() => { b.remove(); }, 500);
    if (OS.setup && OS.setup.needed()) { await OS.setup.run(); OS.sound('startup'); setTimeout(firstRun, 600); if (OS.settings.fullscreenOnLogin) document.addEventListener('pointerdown', OS.enterFullscreen, { once: true, capture: true }); return; }
    if (OS.settings.lockOnBoot || OS.settings.password) desk.lock(true); else { OS.sound('startup'); setTimeout(firstRun, 600); if (OS.settings.fullscreenOnLogin) document.addEventListener('pointerdown', OS.enterFullscreen, { once: true, capture: true }); }
  };
  desk.restart = () => {
    OS.fs.saveNow(); OS.wm.closeAll();
    const b = OS.el('<div id="boot" style="display:grid;place-items:center"><div class="spinner"></div></div>'); document.body.appendChild(b);
    $('#lock')?.remove();
    setTimeout(() => { b.remove(); desk.boot(); }, 1200);
  };
  desk.shutdown = () => {
    OS.fs.saveNow(); OS.wm.closeAll(); $('#lock')?.remove();
    const off = OS.el(`<div id="off"><div style="text-align:center;color:#666"><div class="spinner" style="margin:0 auto 14px"></div>Shutting down…</div></div>`);
    document.body.appendChild(off);
    setTimeout(() => { off.innerHTML = `<button title="Power on">${gl('power')}</button>`; off.querySelector('button').onclick = () => { off.remove(); desk.boot(); }; }, 1500);
  };

  /* ================= init ================= */
  desk.init = () => {
    buildScreen();
    OS.applySettings();
    $('#start-btn').onclick = (e) => { e.stopPropagation(); openStart(); };
    $('#tray-btn').onclick = (e) => { e.stopPropagation(); openQuick(); };
    $('#clock-btn').onclick = (e) => { e.stopPropagation(); openCal(); };
    $('#ov-btn').onclick = (e) => { e.stopPropagation(); openOverview(); };
    $('#ov-btn-m').onclick = (e) => { e.stopPropagation(); openOverview(); };
    document.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('#startmenu,#start-btn,#quick,#tray-btn,#calpop,#clock-btn,.ctx,.dlg-back')) { closeStart(); $('#quick').hidden = true; $('#calpop').hidden = true; }
    });
    const ws = $('#workspace');
    OS.onContext(ws, (e, x, y) => { if (e.target === ws || e.target.id === 'desk-icons') deskContext(x, y); });
    ws.addEventListener('click', (e) => { if (e.target === ws || e.target.id === 'desk-icons') ws.querySelectorAll('.dicon.sel').forEach((x) => x.classList.remove('sel')); });
    // drag & drop real files onto the desktop
    ws.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); } });
    ws.addEventListener('drop', (e) => { if (e.target.closest('.win')) return; if (e.dataTransfer.files.length) { e.preventDefault(); OS.importFiles([...e.dataTransfer.files], OS.home() + '/Desktop'); } });

    OS.on('wm', renderTasks);
    OS.on('settings', (k) => { renderTasks(); updateTray(); if (['desktopIcons', 'username'].includes(k)) renderDesktop(); renderQuick(); });
    OS.on('pkg', () => { renderTasks(); });
    OS.on('fs', (dir) => { if (dir.startsWith(OS.home() + '/Desktop') || dir === OS.home() + '/Desktop') renderDesktop(); });
    OS.on('trash', renderDesktop);
    OS.on('notify', () => { if ($('#quick').hidden) { desk.unread = (desk.unread || 0) + 1; updateTray(); } else renderQuick(); });
    OS.on('resize', () => { updateTray(); });
    window.addEventListener('online', () => { updateTray(); OS.notify('Connected', 'You are back online.', { icon: 'wifi' }); });
    window.addEventListener('offline', () => { updateTray(); OS.notify('Disconnected', 'Network connection lost.', { icon: 'wifioff' }); });
    if (navigator.getBattery) navigator.getBattery().then((bt) => { battery = bt; updateBattery(); ['levelchange', 'chargingchange'].forEach((ev) => bt.addEventListener(ev, updateBattery)); }).catch(() => {});

    // global shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.altKey && (e.key === 't' || e.key === 'T')) { e.preventDefault(); OS.wm.open('terminal'); }
      else if (e.altKey && e.code === 'Space') { e.preventDefault(); openStart(); }
      else if (e.altKey && e.key === 'F4') { e.preventDefault(); OS.wm.active && OS.wm.close(OS.wm.active); }
      else if (e.key === 'Escape') { closePops(); OS.closeMenu(); }
      else if (e.key === 'Meta' || e.key === 'OS') desk._meta = true;
      else desk._meta = false;
    });
    document.addEventListener('keyup', (e) => { if ((e.key === 'Meta' || e.key === 'OS') && desk._meta) { desk._meta = false; openStart(); } });

    renderTasks(); renderDesktop(); updateTray(); updateBattery();
    setInterval(updateTray, 1000);
  };
})();
