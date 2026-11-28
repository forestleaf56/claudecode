/* Cirrus Linux — window manager */
(function () {
  'use strict';
  const wm = (OS.wm = { wins: [], z: 100, active: null });
  let cascade = 0;
  const ws = () => OS.$('#workspace');

  wm.open = (appId, args = {}) => {
    const app = OS.apps[appId];
    if (!app) { OS.notify('Application not found', appId, { icon: 'info' }); return null; }
    if (OS.pkg && !OS.pkg.appAvailable(appId)) {
      OS.notify(`${app.name} is not installed`, 'Install it from the Software app or with apt.', { icon: 'package', onclick: () => wm.open('software', { q: appId }) });
      return null;
    }
    if (app.single) { const ex = wm.wins.find((w) => w.app === appId); if (ex) { wm.focus(ex); ex.onArgs && ex.onArgs(args); return ex; } }
    OS.closeMenu(); OS.emit('launch', appId);
    const W = ws().clientWidth, H = ws().clientHeight;
    const w = Math.min(args.w || app.w, W - 20), h = Math.min(args.h || app.h, H - 20);
    const off = (cascade++ % 8) * 28;
    const x = Math.max(4, Math.round((W - w) / 2 - 100 + off + Math.random() * 30)), y = Math.max(4, Math.round((H - h) / 2 - 60 + off));
    const id = 'w' + OS.uid();
    const el = OS.el(`<div class="win opening" data-id="${id}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
      <div class="win-tb">${OS.appIcon(app)}<div class="win-title">${OS.esc(app.name)}</div>
        <div class="win-ctrls"><button class="wc" data-a="min" title="Minimize">${OS.glyph('minus')}</button><button class="wc" data-a="max" title="Maximize">${OS.glyph('square')}</button><button class="wc x" data-a="close" title="Close">${OS.glyph('x')}</button></div></div>
      <div class="win-body"></div><div class="win-shield"></div>
      ${['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map((d) => `<div class="rs rs-${d}" data-d="${d}"></div>`).join('')}</div>`);
    const win = {
      id, app: appId, el, body: el.querySelector('.win-body'), title: app.name, max: false, min: false, _close: [], pid: 1000 + Math.floor(Math.random() * 30000), started: Date.now(),
      setTitle(t) { this.title = t; el.querySelector('.win-title').textContent = t; OS.emit('wm'); },
      onClose(f) { this._close.push(f); }, close() { wm.close(win); }, focus() { wm.focus(win); },
      isActive() { return wm.active === win && !win.min; },
    };
    el.addEventListener('animationend', () => el.classList.remove('opening'), { once: true });
    ws().appendChild(el); wm.wins.push(win);
    if (OS.isMobile() || args.max || app.max) setMax(win, true, false);
    el.addEventListener('pointerdown', () => wm.focus(win), true);
    el.querySelector('.win-ctrls').addEventListener('click', (e) => {
      const b = e.target.closest('.wc'); if (!b) return; e.stopPropagation();
      if (b.dataset.a === 'close') wm.close(win); else if (b.dataset.a === 'min') wm.minimize(win); else wm.toggleMax(win);
    });
    const tb = el.querySelector('.win-tb');
    tb.addEventListener('dblclick', (e) => { if (!e.target.closest('.wc')) wm.toggleMax(win); });
    OS.onContext(tb, (e, cx, cy) => OS.menu(cx, cy, [
      { label: win.max ? 'Restore' : 'Maximize', icon: 'square', action: () => wm.toggleMax(win) },
      { label: 'Minimize', icon: 'minus', action: () => wm.minimize(win) },
      !OS.isMobile() && { label: 'Snap left', icon: 'sidebar', action: () => snap(win, 'left') },
      !OS.isMobile() && { label: 'Snap right', icon: 'sidebar', action: () => snap(win, 'right') },
      '-', { label: 'Close', icon: 'x', danger: true, key: 'Alt+F4', action: () => wm.close(win) },
    ]));
    drag(win, tb); resize(win);
    wm.focus(win);
    try { app.launch(win, args); } catch (e) { console.error(e); win.body.innerHTML = `<div class="empty">${OS.glyph('info')}<div>${OS.esc(app.name)} crashed:<br><code>${OS.esc(e.message)}</code></div></div>`; }
    OS.emit('wm');
    return win;
  };

  wm.focus = (win) => {
    if (!win) return;
    if (win.min) { win.min = false; win.el.classList.remove('minimized'); }
    if (wm.active !== win) {
      win.el.style.zIndex = ++wm.z;
      wm.wins.forEach((w) => w.el.classList.toggle('focused', w === win));
      wm.active = win; OS.emit('wm'); win.onFocus && win.onFocus();
    }
  };
  wm.close = async (win) => {
    if (!win || win._closing) return;
    if (win.beforeClose) { const ok = await win.beforeClose(); if (!ok) return; }
    win._closing = true;
    win._close.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
    win.el.classList.add('closing');
    setTimeout(() => win.el.remove(), 180);
    wm.wins = wm.wins.filter((w) => w !== win);
    if (wm.active === win) { wm.active = null; const top = topWin(); if (top) wm.focus(top); }
    OS.emit('wm');
  };
  wm.minimize = (win) => {
    win.min = true; win.el.classList.add('minimized');
    if (wm.active === win) { wm.active = null; wm.wins.forEach((w) => w.el.classList.remove('focused')); const top = topWin(); if (top) wm.focus(top); }
    OS.emit('wm');
  };
  const topWin = () => wm.wins.filter((w) => !w.min).sort((a, b) => +b.el.style.zIndex - +a.el.style.zIndex)[0];
  function setMax(win, on, anim = true) {
    if (on && !win.max) win.prev = { l: win.el.style.left, t: win.el.style.top, w: win.el.style.width, h: win.el.style.height };
    if (anim) { win.el.classList.add('anim-geo'); setTimeout(() => win.el.classList.remove('anim-geo'), 260); }
    win.max = on; win.el.classList.toggle('max', on);
    if (!on && win.prev) Object.assign(win.el.style, { left: win.prev.l, top: win.prev.t, width: win.prev.w, height: win.prev.h });
    win.el.querySelector('[data-a=max]').innerHTML = OS.glyph(on ? 'squares' : 'square');
    setTimeout(() => win.onResize && win.onResize(), 270);
  }
  wm.toggleMax = (win) => { if (OS.isMobile()) return setMax(win, true); setMax(win, !win.max); };
  wm.closeAll = () => wm.wins.slice().forEach((w) => wm.close(w));
  wm.byApp = (id) => wm.wins.filter((w) => w.app === id);
  wm.showDesktop = () => { const all = wm.wins.every((w) => w.min); wm.wins.forEach((w) => (all ? wm.focus(w) : wm.minimize(w))); };

  function snap(win, side) {
    const W = ws().clientWidth, H = ws().clientHeight;
    if (!win.max) win.prev = { l: win.el.style.left, t: win.el.style.top, w: win.el.style.width, h: win.el.style.height };
    win.el.classList.add('anim-geo'); setTimeout(() => win.el.classList.remove('anim-geo'), 260);
    win.max = false; win.el.classList.remove('max');
    Object.assign(win.el.style, { left: (side === 'left' ? 0 : W / 2) + 'px', top: '0px', width: W / 2 + 'px', height: H + 'px' });
    setTimeout(() => win.onResize && win.onResize(), 270);
  }

  function drag(win, handle) {
    let sx, sy, ox, oy, moving = false, snapTo = null, prevEl = null;
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('.wc') || OS.isMobile()) return;
      sx = e.clientX; sy = e.clientY; ox = win.el.offsetLeft; oy = win.el.offsetTop; moving = false;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if (sx == null || !handle.hasPointerCapture(e.pointerId)) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moving && Math.hypot(dx, dy) < 4) return;
      if (!moving) {
        moving = true; document.body.classList.add('dragging');
        if (win.max) { const pw = parseFloat(win.prev?.w) || 600; setMax(win, false, false); ox = e.clientX - pw / 2; oy = 0; sx = e.clientX; sy = e.clientY; }
      }
      const r = ws().getBoundingClientRect();
      let nx = ox + (e.clientX - sx), ny = Math.max(0, oy + (e.clientY - sy));
      ny = Math.min(ny, r.height - 40);
      win.el.style.left = nx + 'px'; win.el.style.top = ny + 'px';
      if (document.body.classList.contains('wobbly')) { const vx = e.clientX - (win._lx ?? e.clientX), vy = e.clientY - (win._ly ?? e.clientY); win._lx = e.clientX; win._ly = e.clientY; win.el.style.transform = `skew(${OS.clamp(-vx * 0.7, -14, 14)}deg, ${OS.clamp(-vy * 0.35, -7, 7)}deg)`; }
      const px = e.clientX - r.left, py = e.clientY - r.top;
      snapTo = py < 6 ? 'max' : px < 6 ? 'left' : px > r.width - 6 ? 'right' : null;
      if (snapTo && !prevEl) { prevEl = OS.el('<div id="snap-preview"></div>'); ws().appendChild(prevEl); }
      if (prevEl) {
        if (!snapTo) { prevEl.remove(); prevEl = null; }
        else Object.assign(prevEl.style, snapTo === 'max' ? { left: '8px', top: '8px', width: r.width - 16 + 'px', height: r.height - 16 + 'px' } : { left: (snapTo === 'left' ? 8 : r.width / 2 + 4) + 'px', top: '8px', width: r.width / 2 - 12 + 'px', height: r.height - 16 + 'px' });
      }
    });
    const end = () => {
      if (sx == null) return; sx = null; document.body.classList.remove('dragging'); win.el.style.transform = ''; win._lx = win._ly = null;
      if (prevEl) { prevEl.remove(); prevEl = null; }
      if (moving && snapTo) { if (snapTo === 'max') setMax(win, true); else snap(win, snapTo); }
      snapTo = null; if (moving) win.onResize && win.onResize(); moving = false;
    };
    handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
  }

  function resize(win) {
    win.el.querySelectorAll('.rs').forEach((h) => {
      let st = null;
      h.addEventListener('pointerdown', (e) => {
        e.stopPropagation(); h.setPointerCapture(e.pointerId); document.body.classList.add('dragging');
        st = { x: e.clientX, y: e.clientY, l: win.el.offsetLeft, t: win.el.offsetTop, w: win.el.offsetWidth, h: win.el.offsetHeight, d: h.dataset.d };
      });
      h.addEventListener('pointermove', (e) => {
        if (!st) return; const dx = e.clientX - st.x, dy = e.clientY - st.y, s = win.el.style, minW = 260, minH = 160;
        if (st.d.includes('e')) s.width = Math.max(minW, st.w + dx) + 'px';
        if (st.d.includes('s')) s.height = Math.max(minH, st.h + dy) + 'px';
        if (st.d.includes('w')) { const nw = Math.max(minW, st.w - dx); s.width = nw + 'px'; s.left = st.l + st.w - nw + 'px'; }
        if (st.d.includes('n')) { const nh = Math.max(minH, st.h - dy); s.height = nh + 'px'; s.top = Math.max(0, st.t + st.h - nh) + 'px'; }
        win.onResize && win.onResize();
      });
      const end = () => { st = null; document.body.classList.remove('dragging'); };
      h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
    });
  }

  /* keyboard routing helper: handler only fires while win is focused */
  wm.keys = (win, fn) => {
    const h = (e) => { if (wm.active === win && !win.min && !document.querySelector('.dlg-back')) fn(e); };
    document.addEventListener('keydown', h); win.onClose(() => document.removeEventListener('keydown', h));
  };
  /* interval/raf helpers auto-cleaned on close */
  wm.interval = (win, fn, ms) => { const t = setInterval(fn, ms); win.onClose(() => clearInterval(t)); return t; };

  window.addEventListener('resize', () => {
    const mob = OS.isMobile(); const was = document.body.classList.contains('mobile');
    document.body.classList.toggle('mobile', mob);
    if (mob && !was) wm.wins.forEach((w) => setMax(w, true, false));
    const W = ws()?.clientWidth || innerWidth, H = ws()?.clientHeight || innerHeight;
    wm.wins.forEach((w) => {
      if (!w.max) { if (w.el.offsetLeft > W - 60) w.el.style.left = Math.max(0, W - w.el.offsetWidth) + 'px'; if (w.el.offsetTop > H - 40) w.el.style.top = Math.max(0, H - w.el.offsetHeight) + 'px'; }
      w.onResize && w.onResize();
    });
    OS.emit('resize');
  });
})();
