/* Cirrus Linux — personalization: theme presets, fonts, live wallpapers, screensaver, widgets, fun effects */
(function () {
  'use strict';
  const esc = OS.esc, gl = OS.glyph;

  /* ======================= theme presets ======================= */
  const P = (mode, accent, wallpaper, vars, extra = {}) => Object.assign({ mode, accent, wallpaper, vars }, extra);
  const PRESETS = {
    '': { name: 'Cirrus (default)', mode: null },
    polar: P('dark', '#88c0d0', 'ocean', { bg: '#242933', surface: '#2e3440', surface2: '#3b4252', surface3: '#434c5e', input: '#2a303b', fg: '#eceff4', fg2: '#a9b3c4' }, { name: 'Polar Night' }),
    vampire: P('dark', '#bd93f9', 'aurora', { bg: '#1e1f29', surface: '#282a36', surface2: '#303241', surface3: '#3c3f52', input: '#21222c', fg: '#f8f8f2', fg2: '#a6accd' }, { name: 'Vampire' }),
    mocha: P('dark', '#f5c2e7', 'candy', { bg: '#181825', surface: '#1e1e2e', surface2: '#26263a', surface3: '#313244', input: '#181825', fg: '#cdd6f4', fg2: '#a6adc8' }, { name: 'Mocha', radius: 18 }),
    neon: P('dark', '#00f5d4', 'waves', { bg: '#0b0221', surface: '#120634', surface2: '#1b0b4a', surface3: '#271263', input: '#0d0328', fg: '#f3e8ff', fg2: '#c3a6ff' }, { name: 'Neon City', font: 'mono', liveWp: 'matrix' }),
    retrowood: P('dark', '#fabd2f', 'dunes', { bg: '#1d2021', surface: '#282828', surface2: '#32302f', surface3: '#3c3836', input: '#1d2021', fg: '#ebdbb2', fg2: '#bdae93' }, { name: 'Retro Wood', radius: 8 }),
    solar: P('light', '#268bd2', 'dunes', { bg: '#eee8d5', surface: '#fdf6e3', surface2: '#f5efdc', surface3: '#e9e2cc', input: '#fdf6e3', fg: '#073642', fg2: '#586e75' }, { name: 'Solar Light' }),
    sepia: P('light', '#a0522d', 'dunes', { bg: '#efe6d8', surface: '#faf4ea', surface2: '#f2e9db', surface3: '#e6dccb', input: '#fffaf2', fg: '#3b2f25', fg2: '#7a6a58' }, { name: 'Sepia Paper', font: 'serif' }),
    forest: P('dark', '#7ee787', 'forest', { bg: '#0f1a14', surface: '#15241b', surface2: '#1b2e22', surface3: '#24392c', input: '#101c15', fg: '#e3f5e8', fg2: '#9cc5a8' }, { name: 'Deep Forest', liveWp: 'fireflies' }),
    ocean: P('dark', '#2bb3ff', 'ocean', { bg: '#071a2b', surface: '#0c2338', surface2: '#112d47', surface3: '#173a5a', input: '#08192a', fg: '#e3f2fd', fg2: '#90b8d8' }, { name: 'Deep Ocean', liveWp: 'bubbles' }),
    sakura: P('light', '#ff5ca8', 'candy', { bg: '#fdeef4', surface: '#fff7fa', surface2: '#fdeef4', surface3: '#f8dde8', input: '#ffffff', fg: '#4a2b3a', fg2: '#93677c' }, { name: 'Sakura', radius: 20, font: 'rounded' }),
    classic95: P('light', '#000080', 'graphite', { bg: '#c0c0c0', surface: '#d4d0c8', surface2: '#c8c4bc', surface3: '#b8b4ac', input: '#ffffff', fg: '#000000', fg2: '#333333' }, { name: 'Classic 95', radius: 0, font: 'system', transparency: false }),
    glass: P('dark', '#9ad0ff', 'aurora', { bg: 'rgba(16,20,32,.5)', surface: 'rgba(28,32,46,.72)', surface2: 'rgba(40,46,64,.6)', surface3: 'rgba(60,68,92,.55)', input: 'rgba(18,22,34,.6)', fg: '#f2f6ff', fg2: '#b8c4dc' }, { name: 'Frosted Glass', radius: 18, glass: true }),
    contrast: P('dark', '#ffff00', 'graphite', { bg: '#000000', surface: '#000000', surface2: '#0a0a0a', surface3: '#1a1a1a', input: '#000000', fg: '#ffffff', fg2: '#ffffff', border: 'rgba(255,255,255,.6)', border2: 'rgba(255,255,255,.85)' }, { name: 'High Contrast', radius: 6 }),
  };
  OS.presets = PRESETS;
  const FONTS = { inter: "'Inter',system-ui,sans-serif", system: "system-ui,-apple-system,'Segoe UI',Roboto,Ubuntu,sans-serif", rounded: "'Nunito','Varela Round',system-ui,sans-serif", serif: "'Lora',Georgia,serif", mono: "'JetBrains Mono',ui-monospace,monospace", pixel: "'VT323','JetBrains Mono',monospace", hand: "'Patrick Hand','Comic Sans MS',cursive" };
  const FONT_URLS = { rounded: 'Nunito:wght@400;600;700;800', serif: 'Lora:wght@400;600;700', pixel: 'VT323', hand: 'Patrick+Hand' };
  const loadedFonts = {};
  const styleEl = document.createElement('style'); styleEl.id = 'persona-style'; document.head.appendChild(styleEl);

  OS.applyPreset = (id) => {
    const p = PRESETS[id]; if (!p) return; const s = OS.settings;
    s.preset = id;
    if (p.mode) s.theme = p.mode;
    if (p.accent) s.accent = p.accent;
    if (p.wallpaper) s.wallpaper = p.wallpaper;
    s.radius = p.radius ?? 14; s.font = p.font || 'inter'; s.transparency = p.transparency ?? true;
    if (p.liveWp !== undefined) s.liveWp = p.liveWp; else if (id) s.liveWp = s.liveWp;
    OS.saveSettings(); OS.applySettings(); OS.emit('settings', 'preset', id);
  };

  OS.on('apply', (s) => {
    const root = document.documentElement, b = document.body;
    // preset colors
    const p = PRESETS[s.preset];
    let css = '';
    if (p && p.vars && root.dataset.theme === p.mode) { css += `html[data-theme]{${Object.entries(p.vars).map(([k, v]) => `--${k}:${v}`).join(';')};--glass:${p.vars.surface};--glass-strong:${p.vars.surface}}`; if (p.glass) css += 'html[data-theme] .win,html[data-theme] .win-body{backdrop-filter:blur(22px) saturate(1.5);-webkit-backdrop-filter:blur(22px) saturate(1.5)}'; }
    if (s.preset === 'classic95') css += '.win{box-shadow:inset -1px -1px #404040,inset 1px 1px #fff,4px 4px 0 rgba(0,0,0,.35)!important;border:1px solid #000!important}.win-tb{background:linear-gradient(90deg,#000080,#1084d0)!important;color:#fff;height:30px}.wc{border-radius:0!important;width:22px;height:20px;background:#d4d0c8!important;color:#000!important;box-shadow:inset -1px -1px #404040,inset 1px 1px #fff}.btn{border-radius:0!important;box-shadow:inset -1px -1px #404040,inset 1px 1px #fff}#panel{border-top:2px solid #fff!important;background:#c0c0c0!important}.menu-surface{border-radius:0!important}';
    if (s.preset === 'contrast') css += '*:focus-visible{outline:3px solid #ff0!important}.btn,.ibtn,.side-item{border:1px solid #fff}';
    // font
    const f = s.font || 'inter';
    if (FONT_URLS[f] && !loadedFonts[f]) { loadedFonts[f] = 1; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = `https://fonts.googleapis.com/css2?family=${FONT_URLS[f]}&display=swap`; document.head.appendChild(l); }
    root.style.setProperty('--font', FONTS[f] || FONTS.inter);
    if (f === 'pixel') css += 'body{font-size:118%}';
    // radius / blur
    root.style.setProperty('--radius', (s.radius ?? 14) + 'px');
    css += `.btn,.inp{border-radius:${Math.min(12, s.radius ?? 14)}px}.menu-surface{border-radius:${Math.max(0, (s.radius ?? 14) + 4)}px}`;
    css += `#panel{backdrop-filter:blur(${s.panelBlur}px) saturate(1.6);-webkit-backdrop-filter:blur(${s.panelBlur}px) saturate(1.6)}`;
    styleEl.textContent = css;
    // classes
    ['zoom', 'slide', 'fade', 'genie', 'none'].forEach((a) => b.classList.toggle('wa-' + a, (s.winAnim || 'zoom') === a));
    b.classList.toggle('dock-float', s.dockStyle === 'float');
    b.classList.toggle('dock-magnify', !!s.magnify);
    b.classList.toggle('wobbly', !!s.wobbly);
    b.classList.toggle('big-cursor', !!s.bigCursor);
    // accessibility filter
    const F = { none: '', grayscale: 'grayscale(1)', sepia: 'sepia(.85)', invert: 'invert(1) hue-rotate(180deg)', contrast: 'contrast(1.45) saturate(1.2)', deuteranopia: 'url(#cb-deut)', protanopia: 'url(#cb-prot)', tritanopia: 'url(#cb-trit)', warm: 'sepia(.25) saturate(1.2)', dim: 'brightness(.8)' };
    root.style.filter = F[s.filter] || '';
    // effects
    setLive(s.liveWp);
    setParty(!!s.party); setTrail(!!s.trail); setPet(!!s.pet);
    renderWidgets();
  });
  // color-blindness simulation filters
  document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute"><filter id="cb-deut"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0"/></filter><filter id="cb-prot"><feColorMatrix type="matrix" values="0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0"/></filter><filter id="cb-trit"><feColorMatrix type="matrix" values="0.95 0.05 0 0 0 0 0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0"/></filter></svg>`);

  /* ======================= animations (live wallpapers & screensavers) ======================= */
  const R = Math.random;
  const ANIMS = {
    starfield: { name: 'Starfield', init(w, h) { return { st: Array.from({ length: 420 }, () => ({ x: (R() - 0.5) * w * 2, y: (R() - 0.5) * h * 2, z: R() * w })) }; }, draw(g, s, w, h, dt) { g.fillStyle = '#02030a'; g.fillRect(0, 0, w, h); s.st.forEach((p) => { p.z -= dt * 0.25 * w / 1000 * 2; if (p.z < 1) { p.x = (R() - 0.5) * w * 2; p.y = (R() - 0.5) * h * 2; p.z = w; } const k = 128 / p.z, x = p.x * k + w / 2, y = p.y * k + h / 2; const r = Math.max(0.3, (1 - p.z / w) * 2.6); g.fillStyle = `rgba(255,255,255,${1 - p.z / w})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }); } },
    aurora: { name: 'Aurora', init() { return { t: 0 }; }, draw(g, s, w, h, dt) { s.t += dt / 1000; const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#020816'); gr.addColorStop(1, '#0b1f3a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { g.beginPath(); for (let x = 0; x <= w; x += 12) { const y = h * (0.35 + k * 0.06) + Math.sin(x / 180 + s.t * (0.4 + k * 0.15) + k) * 40 + Math.sin(x / 70 + s.t * 0.9) * 12; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.lineTo(w, h); g.lineTo(0, h); g.closePath(); const c = g.createLinearGradient(0, h * 0.2, 0, h * 0.8); const hue = [150, 170, 280, 200][k]; c.addColorStop(0, `hsla(${hue},90%,60%,0)`); c.addColorStop(0.3, `hsla(${hue},90%,60%,.22)`); c.addColorStop(1, `hsla(${hue},90%,40%,0)`); g.fillStyle = c; g.fill(); } g.globalCompositeOperation = 'source-over'; } },
    bubbles: { name: 'Bubbles', init(w, h) { return { b: Array.from({ length: 40 }, () => ({ x: R() * w, y: R() * h, r: 6 + R() * 34, v: 0.2 + R() * 0.6, p: R() * 6 })) }; }, draw(g, s, w, h, dt) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b3d5c'); gr.addColorStop(1, '#021624'); g.fillStyle = gr; g.fillRect(0, 0, w, h); s.b.forEach((b) => { b.y -= b.v * dt / 16; b.p += dt / 900; if (b.y < -b.r) { b.y = h + b.r; b.x = R() * w; } const x = b.x + Math.sin(b.p) * 12; g.strokeStyle = 'rgba(180,230,255,.55)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, b.y, b.r, 0, 7); g.stroke(); g.fillStyle = 'rgba(180,230,255,.08)'; g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.18, 0, 7); g.fill(); }); } },
    matrix: { name: 'Digital Rain', init(w) { return { d: Array.from({ length: Math.ceil(w / 16) }, () => R() * -60), acc: 0 }; }, draw(g, s, w, h, dt) { s.acc += dt; if (s.acc < 50) return; s.acc = 0; g.fillStyle = 'rgba(0,0,0,.09)'; g.fillRect(0, 0, w, h); g.font = '15px monospace'; const ch = 'アイウエオカキクケコサシスセソ0123456789ABCDEF'; s.d.forEach((y, i) => { g.fillStyle = R() < 0.05 ? '#cfffdc' : '#22e36b'; g.fillText(ch[R() * ch.length | 0], i * 16, y * 16); s.d[i] = y * 16 > h && R() > 0.975 ? 0 : y + 1; }); }, keepTrail: true },
    snow: { name: 'Snowfall', init(w, h) { return { f: Array.from({ length: 220 }, () => ({ x: R() * w, y: R() * h, r: 0.8 + R() * 2.8, v: 0.3 + R() * 1, p: R() * 6 })) }; }, draw(g, s, w, h, dt) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1c2a4a'); gr.addColorStop(1, '#5a6f98'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; s.f.forEach((f) => { f.y += f.v * dt / 16; f.p += dt / 1200; if (f.y > h + 4) { f.y = -4; f.x = R() * w; } g.globalAlpha = 0.5 + f.r / 6; g.beginPath(); g.arc(f.x + Math.sin(f.p) * 20, f.y, f.r, 0, 7); g.fill(); }); g.globalAlpha = 1; } },
    fireflies: { name: 'Fireflies', init(w, h) { return { f: Array.from({ length: 60 }, () => ({ x: R() * w, y: R() * h, vx: R() - 0.5, vy: R() - 0.5, p: R() * 6 })) }; }, draw(g, s, w, h, dt) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#04110b'); gr.addColorStop(1, '#0f2e1d'); g.fillStyle = gr; g.fillRect(0, 0, w, h); s.f.forEach((f) => { f.vx += (R() - 0.5) * 0.05; f.vy += (R() - 0.5) * 0.05; f.vx *= 0.99; f.vy *= 0.99; f.x = (f.x + f.vx * dt / 16 + w) % w; f.y = (f.y + f.vy * dt / 16 + h) % h; f.p += dt / 700; const a = (Math.sin(f.p) + 1) / 2; const rg = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, 14); rg.addColorStop(0, `rgba(220,255,120,${a})`); rg.addColorStop(1, 'rgba(220,255,120,0)'); g.fillStyle = rg; g.fillRect(f.x - 14, f.y - 14, 28, 28); }); } },
    waves: { name: 'Neon Waves', init() { return { t: 0 }; }, draw(g, s, w, h, dt) { s.t += dt / 1000; g.fillStyle = '#0b0221'; g.fillRect(0, 0, w, h); for (let k = 0; k < 7; k++) { g.beginPath(); for (let x = 0; x <= w; x += 8) { const y = h / 2 + Math.sin(x / (120 + k * 20) + s.t * (0.6 + k * 0.1) + k) * (40 + k * 18); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.strokeStyle = `hsla(${280 + k * 15},90%,${55 + k * 3}%,.7)`; g.lineWidth = 2; g.shadowBlur = 12; g.shadowColor = g.strokeStyle; g.stroke(); } g.shadowBlur = 0; } },
    lava: { name: 'Lava Lamp', init(w, h) { return { b: Array.from({ length: 9 }, () => ({ x: R() * w, y: R() * h, r: 60 + R() * 90, vx: (R() - 0.5) * 0.4, vy: (R() - 0.5) * 0.4, hue: R() * 60 + 300 })) }; }, draw(g, s, w, h, dt) { g.fillStyle = '#1a0710'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'lighter'; s.b.forEach((b) => { b.x += b.vx * dt / 16; b.y += b.vy * dt / 16; if (b.x < 0 || b.x > w) b.vx *= -1; if (b.y < 0 || b.y > h) b.vy *= -1; const rg = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r); rg.addColorStop(0, `hsla(${b.hue % 360},90%,60%,.8)`); rg.addColorStop(1, `hsla(${b.hue % 360},90%,50%,0)`); g.fillStyle = rg; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fill(); }); g.globalCompositeOperation = 'source-over'; } },
    confetti: { name: 'Confetti', init(w, h) { return { c: Array.from({ length: 160 }, () => ({ x: R() * w, y: R() * h, v: 1 + R() * 2, r: R() * 6, s: 4 + R() * 6, hue: R() * 360 })) }; }, draw(g, s, w, h, dt) { g.fillStyle = '#14161b'; g.fillRect(0, 0, w, h); s.c.forEach((c) => { c.y += c.v * dt / 16; c.r += dt / 300; if (c.y > h) { c.y = -10; c.x = R() * w; } g.save(); g.translate(c.x, c.y); g.rotate(c.r); g.fillStyle = `hsl(${c.hue},85%,60%)`; g.fillRect(-c.s / 2, -c.s / 4, c.s, c.s / 2); g.restore(); }); } },
    clock: { name: 'Floating Clock', saverOnly: true, init(w, h) { return { x: w / 3, y: h / 3, vx: 0.08, vy: 0.06 }; }, draw(g, s, w, h, dt) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); const t = OS.fmtTime(new Date(), true); g.font = '200 72px Inter, system-ui'; const tw = g.measureText(t).width; s.x += s.vx * dt; s.y += s.vy * dt; if (s.x < 0 || s.x + tw > w) s.vx *= -1; if (s.y < 80 || s.y > h - 30) s.vy *= -1; g.fillStyle = OS.settings.accent; g.fillText(t, s.x, s.y); g.font = '18px Inter, system-ui'; g.fillStyle = '#888'; g.fillText(new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }), s.x, s.y + 34); } },
  };
  OS.anims = ANIMS;
  function runAnim(canvas, id, opts = {}) {
    const A = ANIMS[id]; if (!A) return () => {};
    const g = canvas.getContext('2d'); let W = 0, H = 0, st = null, raf = 0, last = performance.now(), stopped = false;
    const size = () => { const dpr = Math.min(devicePixelRatio || 1, opts.lowres ? 1 : 1.5); W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); st = A.init(W, H); if (A.keepTrail) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); } };
    size(); const ro = new ResizeObserver(size); ro.observe(canvas);
    const loop = (t) => { if (stopped) return; raf = requestAnimationFrame(loop); const dt = Math.min(100, t - last); if (opts.fps && dt < 1000 / opts.fps) return; last = t; if (opts.paused && opts.paused()) return; if (!W || !H) { if (canvas.clientWidth) size(); return; } A.draw(g, st, W, H, dt); };
    raf = requestAnimationFrame(loop);
    return () => { stopped = true; cancelAnimationFrame(raf); ro.disconnect(); };
  }
  OS.runAnim = runAnim;

  /* live wallpaper */
  let liveStop = null, liveId = 'none';
  function setLive(id) {
    if (id === liveId) return; liveId = id; if (liveStop) { liveStop(); liveStop = null; }
    let cv = document.getElementById('livewp'); if (cv) cv.remove();
    if (!id || id === 'none' || !ANIMS[id]) return;
    const wp = document.getElementById('wallpaper'); if (!wp) return;
    cv = document.createElement('canvas'); cv.id = 'livewp'; wp.after(cv);
    liveStop = runAnim(cv, id, { fps: 30, paused: () => document.hidden || (OS.wm && OS.wm.wins.some((w) => w.max && !w.min)) || !!document.getElementById('lock') });
  }

  /* ======================= screensaver ======================= */
  let lastInput = Date.now(), saverEl = null;
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((e) => document.addEventListener(e, () => { lastInput = Date.now(); if (saverEl && e !== 'pointermove') endSaver(); }, { capture: true, passive: true }));
  let moved = 0; document.addEventListener('pointermove', () => { if (saverEl && ++moved > 6) endSaver(); }, true);
  function startSaver(style) {
    if (saverEl) return; moved = 0;
    saverEl = OS.el('<div class="saver"><canvas></canvas><div class="saver-hint">Move the mouse or tap to wake</div></div>'); document.body.appendChild(saverEl);
    saverEl._stop = runAnim(saverEl.querySelector('canvas'), style || OS.settings.saverStyle || 'starfield');
  }
  function endSaver() { if (!saverEl) return; saverEl._stop(); saverEl.remove(); saverEl = null; lastInput = Date.now(); if (OS.settings.saverLock && OS.desktop && !document.getElementById('lock')) OS.desktop.lock(); }
  OS.screensaver = { start: startSaver, stop: endSaver };
  setInterval(() => { const m = +OS.settings.saver || 0; if (!m || saverEl || document.getElementById('lock') || document.getElementById('boot') || document.querySelector('.sl-present')) return; if (Date.now() - lastInput > m * 60000) startSaver(); }, 5000);

  /* ======================= party mode / cursor trail / pet ======================= */
  let partyT = null;
  function setParty(on) { if (on && !partyT) { let h = 0; partyT = setInterval(() => { h = (h + 3) % 360; document.documentElement.style.setProperty('--accent', `hsl(${h},85%,62%)`); }, 60); } else if (!on && partyT) { clearInterval(partyT); partyT = null; document.documentElement.style.setProperty('--accent', OS.settings.accent); } }
  let trailOn = false, lastSpark = 0;
  const onTrail = (e) => { if (!trailOn || e.pointerType !== 'mouse' || Date.now() - lastSpark < 25) return; lastSpark = Date.now(); const s = document.createElement('i'); s.className = 'spark'; s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px'; s.style.background = `hsl(${Math.random() * 360},90%,65%)`; document.body.appendChild(s); setTimeout(() => s.remove(), 700); };
  document.addEventListener('pointermove', onTrail, { passive: true });
  function setTrail(on) { trailOn = on; }
  // desktop pet
  let pet = null;
  function setPet(on) {
    if (on && !pet) {
      const el = OS.el(`<div class="pet" title="Hi! I'm Sprig."><svg viewBox="0 0 64 64"><path d="M32 10c-3 6-2 10 0 12 2-2 9-5 12-12-6-1-10 0-12 0z" fill="#3fdc77"/><path d="M32 22c0-5-6-9-12-8 1 6 6 9 12 8z" fill="#2bb35a"/><ellipse cx="32" cy="42" rx="20" ry="17" fill="#8ee0a0"/><ellipse cx="32" cy="46" rx="13" ry="9" fill="#c8f5d2"/><g class="pet-eyes"><circle cx="25" cy="38" r="3" fill="#233"/><circle cx="39" cy="38" r="3" fill="#233"/></g><path class="pet-mouth" d="M28 46q4 4 8 0" stroke="#233" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="20" cy="45" rx="3" ry="2" fill="#ff9fb8" opacity=".7"/><ellipse cx="44" cy="45" rx="3" ry="2" fill="#ff9fb8" opacity=".7"/></svg><b class="pet-z">z</b></div>`);
      document.getElementById('screen')?.appendChild(el);
      pet = { el, x: innerWidth / 2, y: innerHeight - 140, tx: null, ty: null, idle: 0, flip: false };
      let mx = null, my = null; const mm = (e) => { if (e.pointerType === 'mouse') { mx = e.clientX; my = e.clientY; pet.idle = 0; } }; document.addEventListener('pointermove', mm, { passive: true });
      el.onclick = () => { el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop'); const h = document.createElement('i'); h.className = 'pet-heart'; h.textContent = '♥'; h.style.left = pet.x + 'px'; h.style.top = pet.y - 30 + 'px'; document.body.appendChild(h); setTimeout(() => h.remove(), 1000); OS.sound('click'); };
      pet.t = setInterval(() => {
        const b = document.getElementById('panel')?.getBoundingClientRect(); const floor = OS.settings.panelPos === 'top' ? innerHeight - 60 : (b ? b.top - 54 : innerHeight - 110);
        let tx = mx != null ? mx : pet.tx, ty = mx != null ? Math.min(my, floor) : pet.ty;
        if (tx == null || (mx == null && Math.random() < 0.01)) { pet.tx = 40 + Math.random() * (innerWidth - 120); pet.ty = floor - Math.random() * 60; tx = pet.tx; ty = pet.ty; }
        const dx = tx - pet.x - 24, dy = ty - pet.y - 24, d = Math.hypot(dx, dy);
        pet.idle++;
        if (d > 40) { const sp = Math.min(6, d / 12); pet.x += dx / d * sp; pet.y += dy / d * sp; pet.flip = dx < 0; el.classList.add('walk'); el.classList.remove('sleep'); }
        else { el.classList.remove('walk'); if (pet.idle > 160) el.classList.add('sleep'); }
        el.style.transform = `translate(${pet.x}px,${pet.y}px) scaleX(${pet.flip ? -1 : 1})`;
      }, 40);
      pet.off = () => document.removeEventListener('pointermove', mm);
    } else if (!on && pet) { clearInterval(pet.t); pet.off(); pet.el.remove(); pet = null; }
  }
  OS.setPet = (on) => OS.set('pet', on);

  /* ======================= desktop widgets ======================= */
  const QUOTES = ['Stay curious.', 'Small steps every day.', 'Make it simple, but significant.', 'Done is better than perfect.', 'Be kind to your future self.', 'Create more than you consume.', 'The best time to start is now.', 'Every expert was once a beginner.', 'Breathe. You are doing fine.', 'Think in possibilities.'];
  const WIDGETS = {
    clock: { name: 'Clock', icon: 'clock', render: () => `<div class="wg-time">${OS.fmtTime(new Date())}</div><div class="wg-sub">${new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>`, every: 1000 },
    calendar: { name: 'Calendar', icon: 'calendar', render: () => { const d = new Date(), y = d.getFullYear(), m = d.getMonth(); const first = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate(); let c = ''; for (let i = 0; i < first; i++) c += '<span></span>'; for (let i = 1; i <= n; i++) c += `<span class="${i === d.getDate() ? 'td' : ''}">${i}</span>`; return `<div class="wg-title">${d.toLocaleDateString([], { month: 'long', year: 'numeric' })}</div><div class="wg-cal">${'MTWTFSS'.split('').map((x) => `<b>${x}</b>`).join('')}${c}</div>`; }, every: 60000 },
    system: { name: 'System', icon: 'activity', render: () => { const ps = OS.shell ? OS.shell.procs() : []; const cpu = Math.min(100, ps.reduce((a, p) => a + (p.cpu || 0), 0) / (navigator.hardwareConcurrency || 4) * 3 + 4); const mem = performance.memory ? performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100 + 18 : 24 + OS.wm.wins.length * 2; const st = OS.store.size() / (10 * 1048576) * 100; const bar = (l, v) => `<div class="wg-bar"><span>${l}</span><div class="meter"><i style="width:${Math.min(100, v).toFixed(0)}%"></i></div><small>${v.toFixed(0)}%</small></div>`; return `<div class="wg-title">System</div>${bar('CPU', cpu)}${bar('RAM', mem)}${bar('Disk', st)}<div class="wg-sub">${OS.wm.wins.length} windows · up ${OS.fmtDur((Date.now() - OS.bootTime) / 1000)}</div>`; }, every: 2000 },
    note: { name: 'Sticky note', icon: 'filetext', render: () => `<textarea class="wg-note" placeholder="Write a note…" spellcheck="false">${esc(OS.store.get('wg-note', 'Remember to drink water 💧'))}</textarea>`, bind: (el) => { const t = el.querySelector('textarea'); t.oninput = () => OS.store.set('wg-note', t.value); t.addEventListener('pointerdown', (e) => e.stopPropagation()); } },
    quote: { name: 'Quote of the day', icon: 'star', render: () => { const d = Math.floor(Date.now() / 864e5); return `<div class="wg-title">Quote of the day</div><div class="wg-quote">“${QUOTES[d % QUOTES.length]}”</div>`; }, every: 3600000 },
    weather: { name: 'Weather', icon: 'cloud', render: () => { const w = OS.store.get('wg-wx'); return w ? `<div class="wg-title">${esc(w.name)}</div><div class="wg-time">${Math.round(w.t)}°</div><div class="wg-sub">${esc(w.d)}</div>` : '<div class="wg-title">Weather</div><div class="wg-sub">Loading…</div>'; }, every: 600000, refresh: async () => { const loc = OS.store.get('wx-loc', { name: 'Stockholm', lat: 59.33, lon: 18.07 }); try { const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code`); const j = await r.json(); const codes = { 0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 61: 'Rain', 63: 'Rain', 71: 'Snow', 80: 'Showers', 95: 'Storm' }; OS.store.set('wg-wx', { name: loc.name, t: j.current.temperature_2m, d: codes[j.current.weather_code] || 'Weather' }); } catch (e) { OS.store.set('wg-wx', { name: loc.name, t: NaN, d: 'Offline' }); } } },
    photo: { name: 'Photo frame', icon: 'image', render: () => { const pics = OS.fs.isDir(OS.home() + '/Pictures') ? OS.fs.ls(OS.home() + '/Pictures').filter((f) => f.type === 'file' && OS.ftype(f.name) === 'image') : []; if (!pics.length) return '<div class="wg-sub">No pictures yet</div>'; const p = pics[Math.floor(Date.now() / 30000) % pics.length]; return `<img class="wg-photo" src="${esc(OS.toDataUrl(OS.fs.read(p.path), p.name))}" alt="">`; }, every: 30000 },
  };
  OS.widgetTypes = WIDGETS;
  const wTimers = [];
  function renderWidgets() {
    const host = document.getElementById('workspace'); if (!host) return;
    wTimers.splice(0).forEach(clearInterval);
    host.querySelectorAll('.widget').forEach((w) => w.remove());
    const list = (OS.settings.widgets || []).filter((w) => WIDGETS[w]);
    const pos = OS.settings.widgetPos || {};
    list.forEach((id, i) => {
      const W = WIDGETS[id]; const el = OS.el(`<div class="widget wg-${id}" data-w="${id}"></div>`);
      const p = pos[id] || { r: 16, t: 16 + i * 170 }; if (p.l != null) el.style.left = p.l + 'px'; else el.style.right = (p.r ?? 16) + 'px'; el.style.top = Math.min(p.t, innerHeight - 200) + 'px';
      const upd = () => { el.innerHTML = W.render(); W.bind && W.bind(el); };
      upd(); if (W.refresh) W.refresh().then(upd); if (W.every) wTimers.push(setInterval(() => { if (W.refresh && W.every >= 600000) W.refresh().then(upd); else if (!el.contains(document.activeElement)) upd(); }, W.every));
      // drag
      let sx, sy, ox, oy, drag = false;
      el.addEventListener('pointerdown', (e) => { if (e.target.closest('textarea')) return; sx = e.clientX; sy = e.clientY; ox = el.offsetLeft; oy = el.offsetTop; drag = true; el.setPointerCapture(e.pointerId); });
      el.addEventListener('pointermove', (e) => { if (!drag) return; el.style.right = 'auto'; el.style.left = Math.max(0, ox + e.clientX - sx) + 'px'; el.style.top = Math.max(0, oy + e.clientY - sy) + 'px'; });
      el.addEventListener('pointerup', () => { if (!drag) return; drag = false; OS.settings.widgetPos = Object.assign({}, OS.settings.widgetPos, { [id]: { l: el.offsetLeft, t: el.offsetTop } }); OS.saveSettings(); });
      OS.onContext(el, (e, x, y) => OS.menu(x, y, [{ label: 'Remove widget', icon: 'x', action: () => OS.set('widgets', OS.settings.widgets.filter((w) => w !== id)) }, { label: 'Widget settings…', icon: 'gear', action: () => OS.wm.open('settings', { page: 'personalize' }) }]));
      host.insertBefore(el, host.querySelector('.win'));
    });
  }
  OS.on('fs', (d) => { if ((OS.settings.widgets || []).includes('photo') && d.startsWith(OS.home() + '/Pictures')) renderWidgets(); });

  /* ======================= celebrations ======================= */
  OS.confetti = (n = 120) => {
    if (!OS.settings.animations) return;
    const cv = document.createElement('canvas'); cv.className = 'confetti'; document.body.appendChild(cv); const g = cv.getContext('2d'); cv.width = innerWidth; cv.height = innerHeight;
    const P2 = Array.from({ length: n }, () => ({ x: innerWidth / 2, y: innerHeight / 2, vx: (Math.random() - 0.5) * 18, vy: -Math.random() * 18 - 4, r: Math.random() * 6, s: 5 + Math.random() * 6, h: Math.random() * 360 }));
    let t0 = performance.now(); const f = (t) => { const k = (t - t0) / 1000; g.clearRect(0, 0, cv.width, cv.height); P2.forEach((p) => { p.vy += 0.5; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += 0.2; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = `hsl(${p.h},85%,60%)`; g.globalAlpha = Math.max(0, 1 - k / 2.4); g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); }); if (k < 2.4) requestAnimationFrame(f); else cv.remove(); }; requestAnimationFrame(f);
  };
  OS.on('pkg', (n, inst) => { if (inst && OS.settings.celebrate && OS.apps[n]) OS.confetti(80); });

  /* ======================= settings pages ======================= */
  const card = (id, p) => { const v = p.vars || {}; const bg = v.surface || (document.documentElement.dataset.theme === 'dark' ? '#1c1f26' : '#fff'); return `<div class="theme-card ${OS.settings.preset === id ? 'on' : ''}" data-preset="${id}"><div class="tp" style="background:${p.wallpaper ? esc(OS.wallpapers[p.wallpaper]) : 'var(--surface2)'};background-size:cover"><i style="background:${p.accent || 'var(--accent)'};opacity:1"></i><b style="background:${bg};opacity:.92;border-radius:${Math.min(8, p.radius ?? 6)}px"></b></div>${esc(p.name)}</div>`; };
  OS.settingsExtra = OS.settingsExtra || [];
  OS.settingsExtra.push({
    id: 'personalize', label: 'Personalize', icon: 'palette', after: 'appearance',
    html: ({ row, sw, seg, S }) => `
      <div class="set-gtitle">Theme presets</div><div class="set-group"><div class="theme-cards">${Object.entries(PRESETS).map(([id, p]) => card(id, p)).join('')}</div></div>
      <div class="set-gtitle">Style</div><div class="set-group">
        ${row('Font', '', `<select class="inp" data-select="font">${[['inter', 'Inter'], ['system', 'System UI'], ['rounded', 'Rounded'], ['serif', 'Serif'], ['mono', 'Monospace'], ['pixel', 'Pixel retro'], ['hand', 'Handwritten']].map(([v, l]) => `<option value="${v}" ${S.font === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}
        ${row('Corner roundness', S.radius + 'px', `<input type="range" min="0" max="26" value="${S.radius}" data-range="radius" style="width:180px">`)}
        ${row('Window animation', '', seg('winAnim', [['zoom', 'Zoom'], ['slide', 'Slide'], ['fade', 'Fade'], ['genie', 'Genie'], ['none', 'None']]))}
        ${row('Panel style', 'Floating dock or full-width bar', seg('dockStyle', [['bar', 'Bar'], ['float', 'Floating dock']]))}
        ${row('Magnify icons on hover', 'Panel icons grow when you point at them', sw('magnify'))}
        ${row('Panel blur', S.panelBlur + 'px', `<input type="range" min="0" max="60" value="${S.panelBlur}" data-range="panelBlur" style="width:180px">`)}
      </div>
      <div class="set-gtitle">Live wallpaper</div><div class="set-group"><div class="wp-grid">${[['none', 'Off'], ...Object.entries(ANIMS).filter(([, a]) => !a.saverOnly).map(([k, a]) => [k, a.name])].map(([k, n]) => `<div class="wp live ${S.liveWp === k ? 'on' : ''}" data-live="${k}">${k === 'none' ? gl('x') : `<canvas></canvas>`}<span>${n}</span></div>`).join('')}</div></div>
      <div class="set-gtitle">Screensaver</div><div class="set-group">
        ${row('Start after', '', `<select class="inp" data-select="saver">${[[0, 'Never'], [1, '1 minute'], [2, '2 minutes'], [5, '5 minutes'], [10, '10 minutes'], [30, '30 minutes']].map(([v, l]) => `<option value="${v}" ${+S.saver === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}
        ${row('Style', '', `<select class="inp" data-select="saverStyle">${Object.entries(ANIMS).map(([k, a]) => `<option value="${k}" ${S.saverStyle === k ? 'selected' : ''}>${a.name}</option>`).join('')}</select> <button class="btn sm" data-a="saverPreview">Preview</button>`)}
        ${row('Lock screen when screensaver ends', '', sw('saverLock'))}
      </div>
      <div class="set-gtitle">Desktop widgets</div><div class="set-group">${Object.entries(WIDGETS).map(([k, w]) => row(`<span class="row">${gl(w.icon)} ${w.name}</span>`, '', `<label class="switch"><input type="checkbox" data-widget="${k}" ${(S.widgets || []).includes(k) ? 'checked' : ''}><i></i></label>`)).join('')}${row('Reset widget positions', '', '<button class="btn sm" data-a="wgReset">Reset</button>')}</div>
      <div class="set-gtitle">Sounds</div><div class="set-group">
        ${row('Sound theme', '', `<select class="inp" data-select="soundTheme">${[['classic', 'Classic'], ['soft', 'Soft chimes'], ['retro', 'Retro 8-bit'], ['pop', 'Bubbly pop'], ['glass', 'Glass'], ['silent', 'Silent']].map(([v, l]) => `<option value="${v}" ${S.soundTheme === v ? 'selected' : ''}>${l}</option>`).join('')}</select> <button class="btn sm" data-a="sndTest">${gl('play')}</button>`)}
        ${row('Startup style', '', seg('bootStyle', [['verbose', 'Boot log'], ['splash', 'Splash'], ['quick', 'Quick']]))}
      </div>
      <div class="set-gtitle">Fun</div><div class="set-group">
        ${row('Desktop pet', 'Sprig follows your cursor and naps when you are away', sw('pet'))}
        ${row('Wobbly windows', 'Windows wobble while you drag them', sw('wobbly'))}
        ${row('Party mode', 'Cycle the accent color through the rainbow', sw('party'))}
        ${row('Sparkle cursor trail', 'Mouse only', sw('trail'))}
        ${row('Celebrations', 'Confetti when you install an app', sw('celebrate'))}
        ${row('Throw confetti now', '', `<button class="btn sm" data-a="confetti">🎉 Go</button>`)}
      </div>`,
    bind(main, render) {
      main.querySelectorAll('[data-preset]').forEach((c) => (c.onclick = () => { OS.applyPreset(c.dataset.preset); render(); }));
      main.querySelectorAll('[data-live]').forEach((c) => { const cv = c.querySelector('canvas'); if (cv) { const stop = runAnim(cv, c.dataset.live, { fps: 20, lowres: true }); const obs = new MutationObserver(() => { if (!c.isConnected) { stop(); obs.disconnect(); } }); obs.observe(main, { childList: true, subtree: true }); } c.onclick = () => { OS.set('liveWp', c.dataset.live); render(); }; });
      main.querySelectorAll('[data-widget]').forEach((i) => (i.onchange = () => { const s = new Set(OS.settings.widgets || []); i.checked ? s.add(i.dataset.widget) : s.delete(i.dataset.widget); OS.set('widgets', [...s]); }));
      main.querySelector('[data-select=saver]').onchange = (e) => OS.set('saver', +e.target.value);
      const A = (n, f) => { const b = main.querySelector(`[data-a=${n}]`); if (b) b.onclick = f; };
      A('saverPreview', () => setTimeout(() => startSaver(OS.settings.saverStyle), 300));
      A('wgReset', () => OS.set('widgetPos', {}));
      A('sndTest', () => OS.sound('notify'));
      A('confetti', () => OS.confetti(160));
      main.querySelectorAll('[data-range=radius],[data-range=panelBlur]').forEach((r) => r.addEventListener('input', () => { const sm = r.closest('.set-row').querySelector('small'); if (sm) sm.textContent = r.value + 'px'; }));
    },
  });
  OS.settingsExtra.push({
    id: 'accessibility', label: 'Accessibility', icon: 'eye', after: 'display',
    html: ({ row, sw, S }) => `
      <div class="set-group">
        ${row('Color filter', 'Applies to the whole screen', `<select class="inp" data-select="filter">${[['none', 'None'], ['grayscale', 'Grayscale'], ['sepia', 'Sepia'], ['warm', 'Warm'], ['dim', 'Dim'], ['contrast', 'Increased contrast'], ['invert', 'Inverted colors'], ['deuteranopia', 'Simulate deuteranopia'], ['protanopia', 'Simulate protanopia'], ['tritanopia', 'Simulate tritanopia']].map(([v, l]) => `<option value="${v}" ${S.filter === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}
        ${row('High contrast theme', '', `<button class="btn sm" data-a="hc">${S.preset === 'contrast' ? 'On' : 'Turn on'}</button>`)}
        ${row('Large mouse pointer', '', sw('bigCursor'))}
        ${row('Reduce motion', 'Turn off animations', `<label class="switch"><input type="checkbox" data-rm ${S.animations ? '' : 'checked'}><i></i></label>`)}
        ${row('Text size', S.fontScale + '%', `<input type="range" min="80" max="140" step="5" value="${S.fontScale}" data-range="fontScale" style="width:180px">`)}
        ${row('Screen reader hints', 'Speak notifications aloud', sw('speakNotifs', S.speakNotifs))}
      </div>`,
    bind(main, render) {
      main.querySelector('[data-a=hc]').onclick = () => { OS.applyPreset(OS.settings.preset === 'contrast' ? '' : 'contrast'); render(); };
      main.querySelector('[data-rm]').onchange = (e) => OS.set('animations', !e.target.checked);
    },
  });
  OS.on('notify', (n) => { if (OS.settings.speakNotifs && window.speechSynthesis) { const u = new SpeechSynthesisUtterance(`${n.title}. ${n.body}`); speechSynthesis.speak(u); } });
})();
