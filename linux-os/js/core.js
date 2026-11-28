/* Cirrus Linux — core utilities, settings, icons, dialogs, notifications */
(function () {
  'use strict';
  const OS = (window.OS = {
    apps: {}, name: 'Cirrus Linux', version: '24.11', codename: 'Nimbus', kernel: '6.8.0-cirrus',
    bootTime: Date.now(), clipboard: null, notifications: [],
  });

  /* ---------- tiny DOM helpers ---------- */
  OS.$ = (s, r = document) => r.querySelector(s);
  OS.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  OS.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  OS.el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  OS.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  OS.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  OS.uid = () => Math.random().toString(36).slice(2, 10);

  /* ---------- events ---------- */
  const ev = {};
  OS.on = (n, f) => { (ev[n] = ev[n] || []).push(f); return () => OS.off(n, f); };
  OS.off = (n, f) => { ev[n] = (ev[n] || []).filter((x) => x !== f); };
  OS.emit = (n, ...a) => (ev[n] || []).slice().forEach((f) => { try { f(...a); } catch (e) { console.error(e); } });

  /* ---------- storage ---------- */
  OS.store = {
    get(k, d) { try { const v = localStorage.getItem('cirrus.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('cirrus.' + k, JSON.stringify(v)); return true; } catch (e) { OS.notify && OS.notify('Storage full', 'Could not save data: browser storage quota exceeded.', { icon: 'monitor' }); return false; } },
    del(k) { try { localStorage.removeItem('cirrus.' + k); } catch (e) {} },
    size() { let n = 0; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); n += k.length + (localStorage.getItem(k) || '').length; } } catch (e) {} return n * 2; },
  };

  /* ---------- settings ---------- */
  const DEF = {
    theme: 'dark', accent: '#6c8cff', wallpaper: 'aurora', customWallpaper: '', transparency: true, animations: true,
    panelPos: 'bottom', iconSize: 'medium', fontScale: 100, brightness: 100, nightLight: false, volume: 70, sounds: true,
    clock24: true, showSeconds: false, username: 'user', fullname: 'Cirrus User', password: '', passwordHint: '', accountSetup: false, avatar: '#6c8cff',
    hostname: 'cirrus', installed: null, pinned: ['files', 'terminal', 'browser', 'office', 'software', 'settings'],
    homepage: 'about:home', searchEngine: 'cirrus', showLabels: false, dnd: false, desktopIcons: true,
    termTheme: 'dark', termFont: 13.5, bookmarks: null, lockOnBoot: true, mobileMode: 'auto', fullscreenOnLogin: true,
    preset: '', font: 'inter', radius: 14, winAnim: 'zoom', dockStyle: 'bar', magnify: true, panelBlur: 24, liveWp: 'none', saver: 0, saverStyle: 'starfield', saverLock: false,
    widgets: [], widgetPos: {}, soundTheme: 'classic', wobbly: false, party: false, trail: false, pet: false, filter: 'none', bigCursor: false, bootStyle: 'verbose', celebrate: true,
  };
  OS.defaults = DEF;
  OS.settings = Object.assign({}, DEF, OS.store.get('settings', {}));
  OS.saveSettings = () => OS.store.set('settings', OS.settings);
  OS.set = (k, v) => { OS.settings[k] = v; OS.saveSettings(); OS.applySettings(); OS.emit('settings', k, v); };
  OS.home = () => '/home/' + OS.settings.username;

  /* ---------- wallpapers ---------- */
  const svgUrl = (s) => `url("data:image/svg+xml;utf8,${encodeURIComponent(s)}")`;
  OS.wallpapers = {
    aurora: 'radial-gradient(ellipse at 18% 18%,#8b5cff 0,transparent 45%),radial-gradient(ellipse at 82% 28%,#00c8ff 0,transparent 45%),radial-gradient(ellipse at 60% 90%,#ff5ca8 0,transparent 50%),linear-gradient(160deg,#0b1030,#101845)',
    sunset: 'radial-gradient(circle at 50% 70%,#ffd36b 0,transparent 25%),linear-gradient(180deg,#2b1055 0%,#7a2a7a 35%,#ff6b6b 65%,#ffb36b 100%)',
    forest: 'radial-gradient(ellipse at 30% 10%,#a8ffce55 0,transparent 50%),linear-gradient(170deg,#0e2a1d,#1f5a3a 50%,#4c9a5a)',
    ocean: 'radial-gradient(ellipse at 70% 20%,#9ee7ff 0,transparent 40%),linear-gradient(200deg,#03203c,#065a82 55%,#1fb5c9)',
    candy: 'radial-gradient(circle at 20% 30%,#ffc3e6 0,transparent 40%),radial-gradient(circle at 80% 20%,#c3d8ff 0,transparent 40%),radial-gradient(circle at 60% 85%,#c8ffe1 0,transparent 45%),linear-gradient(135deg,#fdf2ff,#eef4ff)',
    graphite: 'radial-gradient(circle at 50% 0%,#3a3f4b 0,transparent 60%),linear-gradient(180deg,#16181d,#0c0d10)',
    mountains: svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#1d2b64'/><stop offset='.6' stop-color='#f8a488'/><stop offset='1' stop-color='#fcd9a8'/></linearGradient></defs><rect width='1600' height='1000' fill='url(#s)'/><circle cx='1100' cy='560' r='90' fill='#fff3d6' opacity='.9'/><path d='M0 620 L220 420 L380 560 L560 360 L760 600 L900 470 L1080 640 L1260 430 L1460 610 L1600 500 V1000 H0Z' fill='#5b4a8a' opacity='.75'/><path d='M0 720 L180 560 L360 700 L540 520 L720 720 L900 580 L1100 760 L1300 560 L1500 720 L1600 650 V1000 H0Z' fill='#3b2f63'/><path d='M0 840 L260 700 L520 850 L800 690 L1060 860 L1340 720 L1600 840 V1000 H0Z' fill='#1f1a3a'/></svg>`),
    waves: svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000' preserveAspectRatio='xMidYMid slice'><rect width='1600' height='1000' fill='#0f1226'/><path d='M0 600 C300 500 500 700 800 600 S1300 500 1600 600 V1000 H0Z' fill='#3d2c8d' opacity='.8'/><path d='M0 700 C300 620 600 800 900 700 S1400 620 1600 700 V1000 H0Z' fill='#916bbf' opacity='.7'/><path d='M0 800 C400 720 700 900 1000 800 S1400 760 1600 820 V1000 H0Z' fill='#c996cc' opacity='.6'/><circle cx='1200' cy='260' r='120' fill='#f6d5ff' opacity='.15'/></svg>`),
    dunes: svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000' preserveAspectRatio='xMidYMid slice'><rect width='1600' height='1000' fill='#f7e3c3'/><circle cx='400' cy='300' r='110' fill='#fff' opacity='.7'/><path d='M0 560 Q400 420 800 560 T1600 520 V1000 H0Z' fill='#f0c58f'/><path d='M0 700 Q500 560 900 700 T1600 660 V1000 H0Z' fill='#e2a565'/><path d='M0 840 Q450 740 1000 850 T1600 800 V1000 H0Z' fill='#c98242'/></svg>`),
  };
  OS.wallpaperCss = (id) => (id === 'custom' && OS.settings.customWallpaper ? `url("${OS.settings.customWallpaper}") center/cover` : (OS.wallpapers[id] || OS.wallpapers.aurora));
  OS.accents = ['#6c8cff', '#8b5cff', '#ff5ca8', '#ff6b6b', '#ff9f43', '#f7c948', '#3fdc77', '#1fc8b0', '#2bb3ff', '#8a93a6'];

  /* ---------- mobile detection ---------- */
  OS.isMobile = () => OS.settings.mobileMode === 'on' || (OS.settings.mobileMode === 'auto' && (window.innerWidth < 760 || (window.innerHeight < 500 && matchMedia('(pointer:coarse)').matches)));
  OS.isTouch = () => matchMedia('(pointer:coarse)').matches;

  const mqDark = matchMedia('(prefers-color-scheme: dark)');
  OS.applySettings = () => {
    const s = OS.settings, b = document.body, root = document.documentElement;
    const theme = s.theme === 'auto' ? (mqDark.matches ? 'dark' : 'light') : s.theme;
    root.dataset.theme = theme;
    root.style.setProperty('--accent', s.accent);
    root.style.fontSize = s.fontScale + '%';
    document.body.style.fontSize = (14 * s.fontScale / 100) + 'px';
    b.classList.toggle('no-anim', !s.animations);
    b.classList.toggle('no-glass', !s.transparency);
    b.classList.toggle('panel-top', s.panelPos === 'top');
    b.classList.remove('icons-small', 'icons-large');
    if (s.iconSize !== 'medium') b.classList.add('icons-' + s.iconSize);
    b.classList.toggle('mobile', OS.isMobile());
    const wp = OS.$('#wallpaper'); if (wp) wp.style.background = OS.wallpaperCss(s.wallpaper);
    const lb = OS.$('#lock .lbg'); if (lb) lb.style.background = OS.wallpaperCss(s.wallpaper);
    const br = OS.$('#ov-bright'); if (br) br.style.opacity = (1 - s.brightness / 100) * 0.85;
    const nl = OS.$('#ov-night'); if (nl) nl.style.opacity = s.nightLight ? 0.35 : 0;
    const meta = OS.$('meta[name=theme-color]'); if (meta) meta.content = theme === 'dark' ? '#14161b' : '#eef0f4';
    OS.emit('apply', s);
  };
  mqDark.addEventListener && mqDark.addEventListener('change', () => OS.applySettings());

  /* ---------- glyphs (stroke icons, 24x24) ---------- */
  const G = {
    folder: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/>',
    terminal: '<path d="M5 16.5l5.5-4.5L5 7.5"/><path d="M12.5 17.5H19"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    filetext: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    calc: '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8.5 7h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    bag: '<path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    brush: '<path d="M18.4 2.6a2 2 0 0 1 2.9 2.9L12 14.8 9.2 12z"/><path d="M9 12.5c-2.5 0-4.5 1.8-4.5 4.3 0 1.2-.8 2.2-2 2.7 4 1.5 8.8.6 9.3-3.8"/>',
    cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9.6a4.5 4.5 0 0 1-.5 8.9z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
    rain: '<path d="M7 15a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 6.1 4.5 4.5 0 0 1 17.5 15"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
    snow: '<path d="M7 14a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 5.1 4.5 4.5 0 0 1 17.5 14"/><path d="M8 18h.01M12 18h.01M16 18h.01M10 21h.01M14 21h.01"/>',
    storm: '<path d="M7 15a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 6.1 4.5 4.5 0 0 1 17.5 15"/><path d="M13 13l-3 4h4l-3 4"/>',
    fog: '<path d="M4 10h16M3 14h18M5 18h14M7 6h10"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
    gamepad: '<rect x="2" y="6.5" width="20" height="12" rx="6"/><path d="M7 10v5M4.5 12.5h5M15 11.5h.01M18 13.5h.01"/>',
    snake: '<path d="M4 19c0-3 2-4 5-4s4-1 4-3-1.5-3-4-3-4-1-4-3 2-3 4.5-3H18"/><path d="M18 3l3 1.5L18 6"/>',
    bomb: '<circle cx="10.5" cy="14" r="7"/><path d="M15.5 9l2.5-2.5M19.5 2.5v2M21.5 5h-2M20.5 3.5l1-1"/>',
    grid4: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
    blocks: '<path d="M3.5 14.5h5.5v5.5H3.5zM9 14.5h5.5v5.5H9zM9 9h5.5v5.5H9zM14.5 14.5H20v5.5h-5.5z"/><path d="M11.8 2v3"/>',
    brick: '<rect x="3" y="3.5" width="8" height="4" rx="1"/><rect x="13" y="3.5" width="8" height="4" rx="1"/><rect x="7" y="9.5" width="10" height="4" rx="1"/><path d="M8 20.5h8"/><circle cx="12" cy="17" r="1.2"/>',
    cards: '<rect x="3" y="6" width="11" height="15" rx="2"/><path d="M10 3.5l9.2 2.3a1 1 0 0 1 .7 1.2L17 18"/>',
    hash: '<path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
    sudoku: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
    pong: '<path d="M5 4v9M19 11v9"/><circle cx="12" cy="10" r="1.6"/>',
    piano: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16M13 4v16M18 4v16"/><path d="M6.5 4v8M10.5 4v8M15.5 4v8" stroke-width="3"/>',
    home: '<path d="M3 11l9-7 9 7v8.5a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 19.5z"/>',
    code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    power: '<path d="M18.4 6.6a9 9 0 1 1-12.8 0M12 2v10"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    restart: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    wifi: '<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0"/><path d="M12 19.5h.01"/>',
    wifioff: '<path d="M2 2l20 20M8.5 16a5 5 0 0 1 7 0M5 12.5a10 10 0 0 1 4.2-2.4M16.7 10.9a10 10 0 0 1 2.3 1.6M2 9a15 15 0 0 1 4.2-2.8M10.7 5.1A15 15 0 0 1 22 9"/><path d="M12 19.5h.01"/>',
    volume: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    mute: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/>',
    battery: '<rect x="2" y="7" width="17" height="10" rx="2.5"/><path d="M22 11v2"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    belloff: '<path d="M2 2l20 20M8.7 3.6A6 6 0 0 1 18 8c0 3 .5 5 1.2 6.4M17 17H3s3-2 3-9c0-.5 0-1 .2-1.5M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', x: '<path d="M18 6L6 18M6 6l12 12"/>',
    square: '<rect x="5" y="5" width="14" height="14" rx="2"/>', squares: '<rect x="8" y="3" width="13" height="13" rx="2"/><path d="M16 21H5a2 2 0 0 1-2-2V8"/>',
    left: '<path d="M15 18l-6-6 6-6"/>', right: '<path d="M9 18l6-6-6-6"/>', up: '<path d="M18 15l-6-6-6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
    arrowup: '<path d="M12 19V5M5 12l7-7 7 7"/>', refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>', upload: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
    star: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.3 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    monitor: '<rect x="2" y="3.5" width="20" height="13" rx="2"/><path d="M8 21h8M12 16.5V21"/>',
    package: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>', pause: '<path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" fill="currentColor"/>',
    next: '<path d="M5 5v14l10-7zM19 5v14"/>', prev: '<path d="M19 5v14L9 12zM5 5v14"/>',
    shuffle: '<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', dots: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    check: '<path d="M20 6L9 17l-5-5"/>', eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1.2"/><circle cx="17.5" cy="10.5" r="1.2"/><circle cx="8.5" cy="7.5" r="1.2"/><circle cx="6.5" cy="12.5" r="1.2"/><path d="M12 2a10 10 0 0 0 0 20c1 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7h2A5.6 5.6 0 0 0 22 11c0-5-4.5-9-10-9z"/>',
    zoomin: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/>', zoomout: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/>',
    rotate: '<path d="M21 2v6h-6"/><path d="M21 13a9 9 0 1 1-3-7.7L21 8"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>', redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/>',
    chat: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z"/><path d="M8.5 9.5h.01M12 9.5h.01M15.5 9.5h.01" stroke-width="2.6"/>',
    send: '<path d="M4 12l16-8-6 17-3-7z"/><path d="M11 14l9-10"/>',
    pin: '<path d="M9 3h6l-1 6 4 4H6l4-4z"/><path d="M12 13v8"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 2.1 2.1.7-2.1.7L19 21l-.7-2.5-2.1-.7 2.1-.7z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17h.01"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/><path d="M8 7h8M8 11h6"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    eraser: '<path d="M20 20H7L3 16a1.4 1.4 0 0 1 0-2L13 4a1.4 1.4 0 0 1 2 0l5 5a1.4 1.4 0 0 1 0 2l-9 9"/><path d="M6 11l7 7"/>',
    bucket: '<path d="M19 11l-8-8-8.5 8.5a2 2 0 0 0 0 2.8l5.2 5.2a2 2 0 0 0 2.8 0z"/><path d="M5 2l5 5M2 13h15M22 20a2 2 0 1 1-4 0c0-1.6 2-4 2-4s2 2.4 2 4z"/>',
    line: '<path d="M5 19L19 5"/>', circle: '<circle cx="12" cy="12" r="8"/>',
    pipette: '<path d="M2 22l1-1h3l9-9M3 21v-3l9-9"/><path d="M15 6l3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3z"/>',
    flag: '<path d="M4 22V4a1 1 0 0 1 1-1h12l-2 4 2 4H5"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
    zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>', leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.2-6"/>',
    anchor: '<circle cx="12" cy="5" r="3"/><path d="M12 22V8M5 12H2a10 10 0 0 0 20 0h-3"/>', rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1zM12 15l-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/>',
    crown: '<path d="M2 18h20M3 8l4 5 5-8 5 8 4-5-2 10H5z"/>', diamond: '<path d="M6 3h12l4 6-10 13L2 9z"/><path d="M2 9h20"/>',
    fish: '<path d="M6.5 12c.9-3.6 4.6-6 8.5-6 3.4 0 5.9 2.6 7 6-1.1 3.4-3.6 6-7 6-3.9 0-7.6-2.4-8.5-6zM6.5 12L2 9v6z"/><path d="M18 12h.01"/>',
    tree: '<path d="M12 22v-5M8 17h8l-4-6h3l-3-5h2l-4-4-4 4h2l-3 5h3l-4 6z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    sidebar: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
    overview: '<rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/>',
    cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    hdd: '<path d="M22 12H2M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/><path d="M6 16h.01M10 16h.01"/>',
    keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M8 16h8"/>',
    type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>', bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>',
    map: '<path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4z"/><path d="M8 2v16M16 6v16"/>', book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    video: '<rect x="2" y="5" width="14" height="14" rx="2"/><path d="M22 7l-6 5 6 5z"/>', mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 0 1-14 0M12 17v5"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4"/>', alarm: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M5 3L2 6M22 6l-3-3"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 3.1a4 4 0 0 1 0 7.8M22 21a7 7 0 0 0-5-6.7"/>',
    droplet: '<path d="M12 2.7l5.7 5.6a8 8 0 1 1-11.3 0z"/>', wind: '<path d="M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2M17.7 7.7A2.5 2.5 0 1 1 19.5 12H2"/>',
    location: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>', italic: '<path d="M10 4h8M6 20h8M14 4l-4 16"/>', underline: '<path d="M7 4v7a5 5 0 0 0 10 0V4M5 20h14"/>',
    strike: '<path d="M16 6.5A4 4 0 0 0 12 4C9.5 4 8 5.5 8 7.3c0 1.4 1 2.4 3 3M4 12h16M8 17.5A4.5 4.5 0 0 0 12 20c2.5 0 4.5-1.5 4.5-3.5 0-1.2-.6-2.2-1.6-2.9"/>',
    alignl: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>', alignc: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>', alignr: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>', alignj: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>',
    listul: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2" fill="currentColor"/><circle cx="4.5" cy="12" r="1.2" fill="currentColor"/><circle cx="4.5" cy="18" r="1.2" fill="currentColor"/>',
    listol: '<path d="M10 6h10M10 12h10M10 18h10M4 4h1v4M3.5 8h3M4 14.5a1.2 1.2 0 0 1 2 .8c0 .8-2 1.7-2 2.7h2.2"/>',
    indent: '<path d="M10 6h10M10 12h10M10 18h10M3 9l3 3-3 3"/>', outdent: '<path d="M10 6h10M10 12h10M10 18h10M7 9l-3 3 3 3"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16M15 4v16"/>', chart: '<path d="M4 20V11M10 20V5M16 20v-7M22 20H2"/>',
    sigma: '<path d="M18 5H6l6 7-6 7h12"/>', printer: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/>',
    highlight: '<path d="M9 11l-6 6v3h9l3-3M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>', present: '<rect x="2" y="3" width="20" height="13" rx="2"/><path d="M12 16v5M8 21h8M10 6.8l4.5 2.7-4.5 2.7z"/>',
    shape: '<rect x="3" y="11" width="9" height="9" rx="1"/><circle cx="16" cy="8" r="5"/>', hr: '<path d="M3 12h18"/>', clearfmt: '<path d="M4 7V4h16v3M9 20h6M12 4l-4 16M15 15l6 6M21 15l-6 6"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20"/>', arrowdown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    textbox: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 9h8M12 9v6"/>', fontsize: '<path d="M3 18l5-12 5 12M4.7 14h6.6M15 18l3-7 3 7M15.9 16h4.2"/>', fill: '<path d="M4 20h16" stroke-width="4"/><path d="M7 4l8 8-4 4-6-6z"/>',
    rows: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 12h18"/>', cols: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/>', sortaz: '<path d="M4 6h7M4 12h5M4 18h3M17 4v16M14 17l3 3 3-3"/>', sortza: '<path d="M4 6h3M4 12h5M4 18h7M17 4v16M14 17l3 3 3-3"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  };
  OS.G = G;
  OS.glyph = (name, cls = 'g') => `<svg class="${cls}" viewBox="0 0 24 24">${G[name] || G.file}</svg>`;
  OS.logo = (size = 30) => `<svg width="${size}" height="${size}" viewBox="0 0 64 64" class="logo"><defs><linearGradient id="lg${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7aa2ff"/><stop offset="1" stop-color="#b06cff"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="url(#lg${size})"/><path d="M19 42a9 9 0 0 1-.6-18A12 12 0 0 1 41.6 21 10 10 0 0 1 44 42z" fill="#fff"/><path d="M26 34l5 -5 5 5" stroke="url(#lg${size})" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  OS.appIcon = (app, size) => {
    if (typeof app === 'string') app = OS.apps[app] || { icon: 'package', color: ['#8a93a6', '#5c6270'] };
    const c = app.color || ['#6c8cff', '#8b5cff'];
    const st = size ? `width:${size}px;height:${size}px;` : '';
    return `<span class="app-ico" style="${st}background:linear-gradient(140deg,${c[0]},${c[1]})">${OS.glyph(app.icon, '')}</span>`;
  };

  /* ---------- file type helpers ---------- */
  OS.ext = (n) => { const m = /\.([^./]+)$/.exec(n); return m ? m[1].toLowerCase() : ''; };
  const TYPES = {
    image: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico', 'avif'], audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'opus'],
    video: ['mp4', 'webm', 'mov', 'mkv', 'ogv'], html: ['html', 'htm'], code: ['js', 'json', 'css', 'py', 'sh', 'c', 'cpp', 'h', 'ts', 'rs', 'go', 'java', 'rb', 'php', 'xml', 'yml', 'yaml', 'toml', 'ini', 'conf'],
    archive: ['zip', 'tar', 'gz', 'deb', '7z', 'rar', 'xz'], writer: ['cdoc', 'doc', 'docx', 'odt', 'rtf'], sheet: ['csht', 'csv', 'tsv', 'ods', 'xlsx'], slide: ['cslide', 'odp', 'pptx'], doc: ['md', 'txt', 'log'], pdf: ['pdf'],
  };
  OS.ftype = (name) => { const e = OS.ext(name); for (const k in TYPES) if (TYPES[k].includes(e)) return k; return 'text'; };
  const FCOL = { image: '#3fb8af', audio: '#ff5ca8', video: '#ff7a45', html: '#ff9f43', code: '#6c8cff', archive: '#a37cff', writer: '#2f7cf6', sheet: '#1fa774', slide: '#ff7a45', doc: '#8a93a6', pdf: '#e5484d', text: '#8a93a6' };
  OS.fileIcon = (name, isDir, path) => {
    if (isDir) {
      const special = { Desktop: 'monitor', Documents: 'filetext', Downloads: 'download', Music: 'music', Pictures: 'image', Videos: 'video', Trash: 'trash' };
      const g = special[name];
      return `<svg viewBox="0 0 64 64"><path d="M6 16a5 5 0 0 1 5-5h14l5 5h23a5 5 0 0 1 5 5v28a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5z" fill="color-mix(in srgb, var(--accent) 70%, #000)"/><path d="M6 23a5 5 0 0 1 5-5h42a5 5 0 0 1 5 5v26a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5z" fill="var(--accent)"/>${g ? `<g transform="translate(22 26) scale(.85)" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${G[g]}</g>` : ''}</svg>`;
    }
    const t = OS.ftype(name), col = FCOL[t], e = OS.ext(name).slice(0, 4).toUpperCase();
    return `<svg viewBox="0 0 64 64"><path d="M14 4h26l14 14v38a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" fill="var(--surface3)" stroke="var(--border2)"/><path d="M40 4v10a4 4 0 0 0 4 4h10" fill="var(--surface2)" stroke="var(--border2)"/>${e ? `<rect x="10" y="38" width="${Math.max(24, e.length * 9 + 10)}" height="14" rx="3" fill="${col}"/><text x="${10 + Math.max(24, e.length * 9 + 10) / 2}" y="48.5" font-size="10" font-weight="700" font-family="system-ui,sans-serif" fill="#fff" text-anchor="middle">${e}</text>` : `<path d="M20 30h24M20 38h24M20 46h16" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`}</svg>`;
  };
  OS.isDataUrl = (s) => typeof s === 'string' && s.startsWith('data:');
  OS.toDataUrl = (content, name) => {
    if (OS.isDataUrl(content)) return content;
    if (OS.ext(name) === 'svg') return 'data:image/svg+xml;utf8,' + encodeURIComponent(content);
    return 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
  };

  /* ---------- formatting ---------- */
  OS.fmtSize = (b) => { if (b < 1024) return b + ' B'; const u = ['KB', 'MB', 'GB', 'TB']; let i = -1; do { b /= 1024; i++; } while (b >= 1024 && i < 3); return b.toFixed(b < 10 ? 1 : 0) + ' ' + u[i]; };
  OS.fmtDate = (t) => new Date(t).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: !OS.settings.clock24 });
  OS.fmtTime = (d = new Date(), sec) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: sec ? '2-digit' : undefined, hour12: !OS.settings.clock24 });
  OS.fmtDur = (s) => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };

  /* ---------- math expression evaluator (safe) ---------- */
  OS.calc = (src, opts = {}) => {
    const deg = !!opts.deg; const toR = (x) => (deg ? (x * Math.PI) / 180 : x); const fromR = (x) => (deg ? (x * 180) / Math.PI : x);
    const s = String(src).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/π/g, 'pi').replace(/√/g, 'sqrt');
    let i = 0;
    const fact = (n) => { if (n < 0 || n % 1) return NaN; let r = 1; for (let k = 2; k <= n; k++) r *= k; return r; };
    const F = { sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, sin: (x) => Math.sin(toR(x)), cos: (x) => Math.cos(toR(x)), tan: (x) => Math.tan(toR(x)), asin: (x) => fromR(Math.asin(x)), acos: (x) => fromR(Math.acos(x)), atan: (x) => fromR(Math.atan(x)), ln: Math.log, log: Math.log10, log2: Math.log2, exp: Math.exp, floor: Math.floor, ceil: Math.ceil, round: Math.round };
    const C = { pi: Math.PI, e: Math.E, tau: Math.PI * 2, phi: (1 + Math.sqrt(5)) / 2, ans: opts.ans || 0 };
    const ws = () => { while (s[i] === ' ') i++; };
    const peek = () => { ws(); return s[i]; };
    function expr() { let v = term(); for (;;) { const c = peek(); if (c === '+') { i++; v += term(); } else if (c === '-') { i++; v -= term(); } else return v; } }
    function term() { let v = factor(); for (;;) { const c = peek(); if (c === '*') { i++; v *= factor(); } else if (c === '/') { i++; v /= factor(); } else if (c === '%') { i++; v %= factor(); } else if (c && /[a-z(0-9.]/i.test(c) && opts.implicit !== false) { v *= factor(); } else return v; } }
    function factor() { let v = unary(); if (peek() === '^' || (s[i] === '*' && s[i + 1] === '*')) { i += s[i] === '^' ? 1 : 2; v = Math.pow(v, factor()); } return v; }
    function unary() { const c = peek(); if (c === '-') { i++; return -unary(); } if (c === '+') { i++; return unary(); } return postfix(); }
    function postfix() { let v = atom(); while (peek() === '!') { i++; v = fact(v); } return v; }
    function atom() {
      const c = peek();
      if (c === '(') { i++; const v = expr(); if (peek() !== ')') throw new Error('missing )'); i++; return v; }
      let m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i));
      if (m) { i += m[0].length; return parseFloat(m[0]); }
      m = /^[a-z_][a-z0-9_]*/i.exec(s.slice(i));
      if (m) { const n = m[0].toLowerCase(); i += m[0].length; if (F[n]) { const a = atom(); return F[n](a); } if (n in C) return C[n]; throw new Error('unknown: ' + n); }
      throw new Error('syntax error');
    }
    const v = expr(); ws(); if (i < s.length) throw new Error('syntax error near "' + s.slice(i) + '"');
    return v;
  };

  /* ---------- sounds (WebAudio) ---------- */
  let actx = null;
  OS.audio = () => { if (!actx) { const A = window.AudioContext || window.webkitAudioContext; if (A) actx = new A(); } if (actx && actx.state === 'suspended') actx.resume(); return actx; };
  OS.sound = (type) => {
    const thm = OS.settings.soundTheme || 'classic';
    if (!OS.settings.sounds || OS.settings.volume === 0 || thm === 'silent') return;
    const a = OS.audio(); if (!a) return;
    const TH = { classic: ['sine', 1, 1, 1], soft: ['triangle', 0.75, 0.6, 1.8], retro: ['square', 1, 0.35, 0.8], pop: ['sine', 1.5, 1, 0.6], glass: ['sine', 2, 0.7, 2.4] }[thm] || ['sine', 1, 1, 1];
    const vol = OS.settings.volume / 100 * 0.18 * TH[2];
    const seqs = { notify: [[880, 0, .09], [1320, .09, .14]], error: [[220, 0, .12], [180, .12, .2]], click: [[1200, 0, .03]], startup: [[523, 0, .18], [659, .12, .2], [784, .24, .22], [1047, .38, .5]], trash: [[400, 0, .06], [260, .05, .1]], unlock: [[660, 0, .08], [990, .07, .12]], done: [[784, 0, .1], [1047, .1, .2]] };
    (seqs[type] || seqs.click).forEach(([f, t, d]) => {
      const o = a.createOscillator(), g = a.createGain(); o.type = type === 'error' && thm === 'classic' ? 'square' : TH[0]; o.frequency.value = thm === 'retro' ? Math.round(f * TH[1] / 110) * 110 : f * TH[1]; if (thm === 'pop') o.frequency.exponentialRampToValueAtTime(f * 0.7, a.currentTime + t + d);
      d *= TH[3]; const s0 = a.currentTime + t; g.gain.setValueAtTime(0, s0); g.gain.linearRampToValueAtTime(vol * (type === 'error' ? .4 : 1), s0 + .01); g.gain.exponentialRampToValueAtTime(0.0001, s0 + d);
      o.connect(g).connect(a.destination); o.start(s0); o.stop(s0 + d + .05);
    });
  };

  /* ---------- notifications ---------- */
  OS.notify = (title, body = '', opts = {}) => {
    const n = { id: OS.uid(), title, body, icon: opts.icon || 'bell', app: opts.app, time: Date.now(), onclick: opts.onclick };
    OS.notifications.unshift(n); OS.notifications.length = Math.min(OS.notifications.length, 50);
    OS.emit('notify', n);
    if (OS.settings.dnd && !opts.force) return n;
    const host = OS.$('#toasts'); if (!host) return n;
    const ic = n.app && OS.apps[n.app] ? OS.appIcon(n.app) : `<span class="app-ico" style="background:linear-gradient(140deg,var(--accent),#8b5cff)">${OS.glyph(n.icon, '')}</span>`;
    const t = OS.el(`<div class="toast menu-surface" style="position:relative">${ic}<div style="min-width:0;flex:1"><b>${OS.esc(title)}</b><small>${OS.esc(body)}</small></div></div>`);
    const kill = () => { t.classList.add('out'); setTimeout(() => t.remove(), 260); };
    t.onclick = () => { kill(); n.onclick && n.onclick(); };
    host.appendChild(t); OS.sound('notify');
    setTimeout(kill, opts.timeout || 4500);
    while (host.children.length > 4) host.firstElementChild.remove();
    return n;
  };

  /* ---------- context menu ---------- */
  let ctxEl = null;
  OS.closeMenu = () => { if (ctxEl) { ctxEl.remove(); ctxEl = null; } };
  OS.menu = (x, y, items) => {
    OS.closeMenu();
    const m = OS.el('<div class="ctx menu-surface pop-anim"></div>');
    items.filter(Boolean).forEach((it) => {
      if (it === '-' || it.sep) { m.appendChild(document.createElement('hr')); return; }
      const b = OS.el(`<button ${it.disabled ? 'disabled' : ''} class="${it.danger ? 'danger' : ''}">${it.icon ? OS.glyph(it.icon) : '<span style="width:1.25em"></span>'}<span>${OS.esc(it.label)}</span>${it.key ? `<span class="k">${OS.esc(it.key)}</span>` : ''}</button>`);
      b.onclick = (e) => { e.stopPropagation(); OS.closeMenu(); it.action && it.action(); };
      m.appendChild(b);
    });
    document.body.appendChild(m); ctxEl = m;
    const r = m.getBoundingClientRect();
    m.style.left = Math.max(4, Math.min(x, innerWidth - r.width - 4)) + 'px';
    m.style.top = Math.max(4, Math.min(y, innerHeight - r.height - 4)) + 'px';
    return m;
  };
  document.addEventListener('pointerdown', (e) => { if (ctxEl && !ctxEl.contains(e.target)) OS.closeMenu(); }, true);

  /* context menu + long-press for touch */
  OS.onContext = (el, fn) => {
    el.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); fn(e, e.clientX, e.clientY); });
    let timer = null, sx = 0, sy = 0;
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return; const t = e.touches[0]; sx = t.clientX; sy = t.clientY;
      timer = setTimeout(() => { timer = null; el._lp = true; if (navigator.vibrate) navigator.vibrate(15); fn(e, sx, sy); setTimeout(() => (el._lp = false), 400); }, 520);
    }, { passive: true });
    const cancel = () => { if (timer) clearTimeout(timer); timer = null; };
    el.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (Math.hypot(t.clientX - sx, t.clientY - sy) > 10) cancel(); }, { passive: true });
    el.addEventListener('touchend', cancel); el.addEventListener('touchcancel', cancel);
    el.addEventListener('click', (e) => { if (el._lp) { e.stopPropagation(); e.preventDefault(); } }, true);
  };

  /* swipe detection */
  OS.onSwipe = (el, fn, min = 24) => {
    let sx, sy, id = null;
    el.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; id = e.pointerId; });
    el.addEventListener('pointerup', (e) => {
      if (id !== e.pointerId) return; id = null;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < min) { fn('tap', e); return; }
      fn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up', e);
    });
  };

  /* ---------- dialogs ---------- */
  OS.dialog = ({ title = '', message = '', input = null, password = false, buttons = [{ label: 'OK', value: true, primary: true }], html = '', read = null }) =>
    new Promise((resolve) => {
      const back = OS.el('<div class="dlg-back"></div>');
      const d = OS.el(`<div class="dlg menu-surface pop-anim">${title ? `<h3>${OS.esc(title)}</h3>` : ''}${message ? `<p>${OS.esc(message)}</p>` : ''}${html}${input !== null ? `<input class="inp" type="${password ? 'password' : 'text'}" value="${OS.esc(input)}" spellcheck="false">` : ''}<div class="btns"></div></div>`);
      back.appendChild(d);
      const inp = d.querySelector('input.inp');
      const done = (v) => { if (read && v) v = read(d, v); back.remove(); document.removeEventListener('keydown', key, true); resolve(v); };
      buttons.forEach((b) => {
        const el = OS.el(`<button class="btn ${b.primary ? 'primary' : ''} ${b.danger ? 'danger' : ''}">${OS.esc(b.label)}</button>`);
        el.onclick = () => done(b.value === true && inp ? inp.value : b.value); d.querySelector('.btns').appendChild(el);
      });
      const key = (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); done(inp ? null : false); }
        if (e.key === 'Enter' && !(e.target.tagName === 'TEXTAREA')) { e.preventDefault(); e.stopPropagation(); const p = buttons.find((b) => b.primary); if (p) done(p.value === true && inp ? inp.value : p.value); }
      };
      document.addEventListener('keydown', key, true);
      back.addEventListener('pointerdown', (e) => { if (e.target === back) d.classList.remove('shake'), void d.offsetWidth, d.classList.add('shake'); });
      document.body.appendChild(back);
      setTimeout(() => { if (inp) { inp.focus(); if (/^(text|password|search)$/.test(inp.type)) { const dot = inp.value.lastIndexOf('.'); inp.setSelectionRange(0, dot > 0 ? dot : inp.value.length); } } else d.querySelector('.btn.primary')?.focus(); }, 30);
      OS._dlg = { el: d, done };
    });
  OS.alert = (title, message) => OS.dialog({ title, message });
  OS.confirm = (title, message, okLabel = 'OK', danger = false) => OS.dialog({ title, message, buttons: [{ label: 'Cancel', value: false }, { label: okLabel, value: true, primary: true, danger }] });
  OS.prompt = (title, message, def = '', password = false) => OS.dialog({ title, message, input: def, password, buttons: [{ label: 'Cancel', value: null }, { label: 'OK', value: true, primary: true }] });

  /* file picker dialog: mode 'open' | 'save' | 'dir' */
  OS.pickFile = ({ mode = 'open', path, name = '', title, filter } = {}) =>
    new Promise((resolve) => {
      let cur = path || OS.home(), sel = null;
      const html = `<div class="row" style="gap:6px"><button class="ibtn up">${OS.glyph('up')}</button><input class="inp cur" style="flex:1" spellcheck="false"></div><div class="picker-list"></div>${mode === 'save' ? '<input class="inp fname" placeholder="File name" spellcheck="false">' : ''}`;
      OS.dialog({ title: title || (mode === 'save' ? 'Save As' : mode === 'dir' ? 'Choose Folder' : 'Open File'), html, buttons: [{ label: 'Cancel', value: null }, { label: mode === 'save' ? 'Save' : mode === 'dir' ? 'Choose' : 'Open', value: '__ok', primary: true }] })
        .then((v) => {
          if (v !== '__ok') return resolve(null);
          if (mode === 'save') { const n = OS._pfName.value.trim(); return resolve(n ? OS.fs.join(cur, n) : null); }
          if (mode === 'dir') return resolve(cur);
          resolve(sel);
        });
      const d = OS._dlg.el; d.style.width = 'min(520px,100%)';
      const list = d.querySelector('.picker-list'), curInp = d.querySelector('.cur'); OS._pfName = d.querySelector('.fname');
      if (OS._pfName) OS._pfName.value = name;
      const render = () => {
        curInp.value = cur; list.innerHTML = '';
        let items; try { items = OS.fs.ls(cur); } catch (e) { items = []; }
        items.filter((it) => !it.name.startsWith('.')).forEach((it) => {
          if (mode === 'dir' && it.type !== 'dir') return;
          if (filter && it.type !== 'dir' && !filter(it.name)) return;
          const b = OS.el(`<button><span class="ico">${OS.fileIcon(it.name, it.type === 'dir')}</span><span>${OS.esc(it.name)}</span></button>`);
          b.onclick = () => { list.querySelectorAll('.sel').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); if (it.type !== 'dir') { sel = it.path; if (OS._pfName) OS._pfName.value = it.name; } };
          b.ondblclick = () => { if (it.type === 'dir') { cur = it.path; render(); } else if (mode === 'open') { sel = it.path; OS._dlg.done('__ok'); } };
          if (OS.isTouch()) b.addEventListener('click', () => { if (it.type === 'dir') { cur = it.path; render(); } });
          list.appendChild(b);
        });
      };
      d.querySelector('.up').onclick = () => { cur = OS.fs.dirname(cur); render(); };
      curInp.onchange = () => { if (OS.fs.isDir(curInp.value)) { cur = OS.fs.norm(curInp.value); render(); } };
      render();
    });

  /* download a blob/dataurl to the real device */
  OS.downloadReal = (name, content) => {
    const a = document.createElement('a');
    a.href = OS.isDataUrl(content) ? content : URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
  };
  /* read real files (from <input type=file> or drop) into the virtual FS */
  OS.importFiles = async (files, dir) => {
    let n = 0;
    for (const f of files) {
      const isText = /^text\/|json|javascript|xml|svg/.test(f.type) || /\.(txt|md|js|json|css|html?|sh|py|csv|log|svg|xml|ya?ml|ini|conf|c|cpp|h|ts)$/i.test(f.name);
      if (f.size > 3.5 * 1024 * 1024) { OS.notify('File too large', `${f.name} is larger than 3.5 MB and can't be stored in browser storage.`, { icon: 'upload' }); continue; }
      const data = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); isText ? r.readAsText(f) : r.readAsDataURL(f); });
      let p = OS.fs.join(dir, f.name), k = 1;
      while (OS.fs.exists(p)) { const e = OS.ext(f.name); p = OS.fs.join(dir, f.name.replace(/(\.[^.]+)?$/, ` (${k++})$1`)); if (k > 99) break; void e; }
      try { OS.fs.write(p, data); n++; } catch (e) { OS.notify('Upload failed', e.message); }
    }
    if (n) OS.notify('Files imported', `${n} file${n > 1 ? 's' : ''} copied to ${dir.replace(OS.home(), '~')}`, { app: 'files' });
    return n;
  };
  OS.uploadPicker = (dir, accept) => {
    const i = document.createElement('input'); i.type = 'file'; i.multiple = true; if (accept) i.accept = accept;
    i.onchange = () => OS.importFiles([...i.files], dir); i.click();
  };

  /* fullscreen (must be called from a user gesture) */
  OS.enterFullscreen = () => {
    const d = document.documentElement; if (document.fullscreenElement || document.webkitFullscreenElement) return;
    try { const r = (d.requestFullscreen || d.webkitRequestFullscreen)?.call(d, { navigationUI: 'hide' }); if (r && r.catch) r.catch(() => {}); } catch (e) {}
  };

  /* app registration */
  OS.registerApp = (app) => { OS.apps[app.id] = Object.assign({ cat: 'Accessories', w: 760, h: 520 }, app); };
})();
