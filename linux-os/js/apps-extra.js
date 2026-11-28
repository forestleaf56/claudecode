/* Cirrus Linux — accessory apps */
(function () {
  'use strict';
  const esc = OS.esc, gl = OS.glyph;

  /* ======================= CALCULATOR ======================= */
  OS.registerApp({
    id: 'calculator', name: 'Calculator', icon: 'calc', color: ['#5ee7a0', '#1fa774'], cat: 'Accessories', w: 360, h: 560, desc: 'Basic & scientific calculator', keywords: 'math',
    launch(win, args) {
      let expr = args.expr || '', ans = 0, sci = false, deg = true, history = OS.store.get('calc-hist', []);
      const basic = [['C', 'fn'], ['(', 'fn'], [')', 'fn'], ['÷', 'op'], ['7'], ['8'], ['9'], ['×', 'op'], ['4'], ['5'], ['6'], ['−', 'op'], ['1'], ['2'], ['3'], ['+', 'op'], ['⌫', 'fn'], ['0'], ['.'], ['=', 'eq']];
      const sciK = [['sin', 'fn'], ['cos', 'fn'], ['tan', 'fn'], ['^', 'fn'], ['√', 'fn'], ['ln', 'fn'], ['log', 'fn'], ['!', 'fn'], ['π', 'fn'], ['e', 'fn'], ['%', 'fn'], ['ans', 'fn']];
      function render() {
        win.body.innerHTML = `<div class="calc"><div class="row"><div class="seg"><button data-m="0" class="${!sci ? 'on' : ''}">Basic</button><button data-m="1" class="${sci ? 'on' : ''}">Scientific</button></div><span class="spacer"></span>${sci ? `<button class="btn sm" data-a="deg">${deg ? 'DEG' : 'RAD'}</button>` : ''}<button class="ibtn" data-a="hist" title="History">${gl('clock')}</button></div>
          <div class="calc-disp"><div class="ex"></div><div class="res">0</div></div>
          ${sci ? `<div class="calc-keys" style="--cols:6;flex:none">${sciK.map(([k, c]) => `<button class="${c || ''}" data-k="${k}">${k}</button>`).join('')}</div>` : ''}
          <div class="calc-keys">${basic.map(([k, c]) => `<button class="${c || ''}" data-k="${k}">${k}</button>`).join('')}</div></div>`;
        win.body.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { sci = b.dataset.m === '1'; render(); }));
        const dg = win.body.querySelector('[data-a=deg]'); if (dg) dg.onclick = () => { deg = !deg; render(); };
        win.body.querySelector('[data-a=hist]').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left - 200, r.bottom, history.length ? [...history.slice(-10).reverse().map((h) => ({ label: `${h.e} = ${h.r}`, action: () => { expr = String(h.r); upd(); } })), '-', { label: 'Clear history', icon: 'trash', action: () => { history = []; OS.store.set('calc-hist', []); } }] : [{ label: 'No history yet', disabled: true }]); };
        win.body.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => press(b.dataset.k)));
        upd();
      }
      const preview = () => { try { const v = OS.calc(expr, { deg, ans }); return isFinite(v) ? fmt(v) : ''; } catch (e) { return ''; } };
      const fmt = (v) => (Math.abs(v) > 1e15 || (Math.abs(v) < 1e-9 && v !== 0) ? v.toExponential(8) : String(+v.toPrecision(14)));
      function upd(res) { win.body.querySelector('.ex').textContent = res ? expr + ' =' : expr; win.body.querySelector('.res').textContent = res ?? (preview() || (expr ? '' : '0')); }
      function press(k) {
        if (k === 'C') expr = ''; else if (k === '⌫') expr = expr.slice(0, -1);
        else if (k === '=') { try { const v = OS.calc(expr, { deg, ans }); if (!isFinite(v)) throw new Error('Math error'); const r = fmt(v); history.push({ e: expr, r }); if (history.length > 50) history.shift(); OS.store.set('calc-hist', history); upd(r); ans = v; expr = r; return; } catch (e) { upd('Error'); return; } }
        else if (['sin', 'cos', 'tan', 'ln', 'log', '√'].includes(k)) expr += k + '(';
        else expr += k;
        upd();
      }
      OS.wm.keys(win, (e) => { const k = e.key; if (/^[0-9.()+\-*/^%!]$/.test(k)) { e.preventDefault(); press(k === '*' ? '×' : k === '/' ? '÷' : k === '-' ? '−' : k); } else if (k === 'Enter' || k === '=') { e.preventDefault(); press('='); } else if (k === 'Backspace') press('⌫'); else if (k === 'Escape' || k === 'Delete') press('C'); });
      render();
    },
  });

  /* ======================= IMAGE / VIDEO VIEWER ======================= */
  OS.registerApp({
    id: 'viewer', name: 'Image Viewer', icon: 'image', color: ['#3fd1c7', '#1f8fb8'], cat: 'Graphics', w: 820, h: 600, desc: 'View images and videos', keywords: 'photo picture eog video',
    launch(win, args) {
      let path = args.path, zoom = 1, rot = 0, list = [];
      win.body.innerHTML = `<div class="toolbar"><button class="ibtn" data-a="open">${gl('folder')}</button><button class="ibtn" data-a="prev">${gl('left')}</button><button class="ibtn" data-a="next">${gl('right')}</button><span class="grow" style="text-align:center;font-size:13px" data-name></span><button class="ibtn" data-a="zo">${gl('zoomout')}</button><button class="ibtn" data-a="fit">${gl('square')}</button><button class="ibtn" data-a="zi">${gl('zoomin')}</button><button class="ibtn" data-a="rot">${gl('rotate')}</button><button class="ibtn" data-a="more">${gl('dots')}</button></div><div class="viewer"></div><div class="statusbar"><span data-info></span></div>`;
      const v = win.body.querySelector('.viewer');
      function show() {
        if (!path) { v.innerHTML = `<div class="empty">${gl('image')}<div>No image open</div><button class="btn" data-a="open2">Open image…</button></div>`; v.querySelector('[data-a=open2]').onclick = openDlg; return; }
        const dir = OS.fs.dirname(path); list = OS.fs.ls(dir).filter((f) => f.type === 'file' && ['image', 'video'].includes(OS.ftype(f.name))).map((f) => f.path);
        let c; try { c = OS.fs.read(path); } catch (e) { v.innerHTML = `<div class="empty">${gl('info')}File not found</div>`; return; }
        const t = OS.ftype(path); const src = OS.toDataUrl(c, path);
        v.innerHTML = t === 'video' ? `<video src="${esc(src)}" controls autoplay style="max-width:100%;max-height:100%"></video>` : `<img src="${esc(src)}" draggable="false">`;
        const img = v.querySelector('img');
        if (img) img.onload = () => { fit(); win.body.querySelector('[data-info]').textContent = `${img.naturalWidth} × ${img.naturalHeight} · ${OS.fmtSize(c.length)} · ${list.indexOf(path) + 1} of ${list.length}`; };
        win.body.querySelector('[data-name]').textContent = OS.fs.basename(path); win.setTitle(OS.fs.basename(path) + ' — Image Viewer');
      }
      function apply() { const img = v.querySelector('img'); if (img) { img.style.width = img.naturalWidth * zoom + 'px'; img.style.transform = `rotate(${rot}deg)`; } }
      function fit() { const img = v.querySelector('img'); if (!img) return; const w = img.naturalWidth || 800, h = img.naturalHeight || 600; zoom = Math.min(1, (v.clientWidth - 20) / w, (v.clientHeight - 20) / h); apply(); }
      const step = (d) => { if (!list.length) return; const i = (list.indexOf(path) + d + list.length) % list.length; path = list[i]; rot = 0; show(); };
      const openDlg = async () => { const p = await OS.pickFile({ mode: 'open', path: path ? OS.fs.dirname(path) : OS.home() + '/Pictures', filter: (n) => ['image', 'video'].includes(OS.ftype(n)) }); if (p) { path = p; show(); } };
      const A = (n, f) => (win.body.querySelector(`[data-a=${n}]`).onclick = f);
      A('open', openDlg); A('prev', () => step(-1)); A('next', () => step(1)); A('zi', () => { zoom *= 1.25; apply(); }); A('zo', () => { zoom /= 1.25; apply(); }); A('fit', fit); A('rot', () => { rot = (rot + 90) % 360; apply(); });
      A('more', (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left - 190, r.bottom, [
        { label: 'Set as wallpaper', icon: 'image', disabled: !path, action: () => { OS.settings.customWallpaper = OS.toDataUrl(OS.fs.read(path), path); OS.set('wallpaper', 'custom'); } },
        { label: 'Open in Paint', icon: 'brush', disabled: !path, action: () => OS.wm.open('paint', { path }) },
        { label: 'Download to device', icon: 'download', disabled: !path, action: () => OS.downloadReal(OS.fs.basename(path), OS.toDataUrl(OS.fs.read(path), path)) },
        { label: 'Move to Trash', icon: 'trash', danger: true, disabled: !path, action: () => { const p = path; step(1); OS.fs.trash(p); if (path === p) { path = null; show(); } } },
      ]); });
      OS.onSwipe(v, (d) => { if (d === 'left') step(1); else if (d === 'right') step(-1); });
      v.addEventListener('wheel', (e) => { if (e.ctrlKey) { e.preventDefault(); zoom *= e.deltaY < 0 ? 1.1 : 0.9; apply(); } }, { passive: false });
      OS.wm.keys(win, (e) => { if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); else if (e.key === '+') { zoom *= 1.25; apply(); } else if (e.key === '-') { zoom /= 1.25; apply(); } });
      win.onResize = fit; win.onArgs = (a) => { if (a.path) { path = a.path; show(); } };
      show();
    },
  });

  /* ======================= SYSTEM MONITOR ======================= */
  OS.registerApp({
    id: 'monitor', name: 'System Monitor', icon: 'activity', color: ['#ff8a5c', '#e5484d'], cat: 'System', w: 780, h: 540, single: true, desc: 'Processes & resources', keywords: 'task manager top htop cpu',
    launch(win) {
      let tab = 'proc', sel = null; const cpu = Array(60).fill(0), mem = Array(60).fill(0), net = Array(60).fill(0);
      let lastT = performance.now(), lag = 0;
      win.body.innerHTML = `<div class="tabs"><button class="tab" data-t="proc">Processes</button><button class="tab" data-t="res">Resources</button><button class="tab" data-t="fs">File Systems</button></div><div class="scroll mon-main"></div><div class="statusbar mon-status"></div>`;
      const main = win.body.querySelector('.mon-main');
      win.body.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { tab = b.dataset.t; render(); }));
      function sample() {
        const n = performance.now(); lag = Math.max(0, n - lastT - 1000); lastT = n;
        const base = 4 + OS.wm.wins.length * 2.5 + Math.min(40, lag / 5);
        cpu.push(OS.clamp(base + Math.random() * 10, 0, 100)); cpu.shift();
        const used = performance.memory ? performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100 : 22 + OS.wm.wins.length * 1.5 + Math.random();
        mem.push(OS.clamp(used + 15, 0, 100)); mem.shift();
        net.push(Math.random() * (navigator.onLine ? 40 : 0)); net.shift();
      }
      function graph(canvas, data, color) {
        const dpr = devicePixelRatio || 1, W = canvas.clientWidth, H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; const g = canvas.getContext('2d'); g.scale(dpr, dpr);
        g.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border'); g.lineWidth = 1;
        for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, H * i / 4); g.lineTo(W, H * i / 4); g.stroke(); }
        g.beginPath(); data.forEach((v, i) => { const x = i / (data.length - 1) * W, y = H - v / 100 * H; i ? g.lineTo(x, y) : g.moveTo(x, y); });
        g.strokeStyle = color; g.lineWidth = 2; g.stroke(); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fillStyle = color + '33'; g.fill();
      }
      function render() {
        win.body.querySelectorAll('[data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
        if (tab === 'proc') {
          const ps = OS.procs().sort((a, b) => b.cpu - a.cpu);
          main.innerHTML = `<table class="proc-table"><thead><tr><th>Process</th><th>PID</th><th>User</th><th>% CPU</th><th>Memory</th></tr></thead><tbody>${ps.map((p) => `<tr data-pid="${p.pid}" class="${sel === p.pid ? 'sel' : ''}"><td><span class="row" style="gap:8px">${p.win ? OS.appIcon(p.win.app, 20) : `<span class="pkg-ico" style="width:20px;height:20px;border-radius:6px">${gl('cpu')}</span>`}${esc(p.win ? p.win.title : p.cmd)}</span></td><td>${p.pid}</td><td>${esc(p.user)}</td><td>${p.cpu.toFixed(1)}</td><td>${(p.mem * 12.3).toFixed(1)} MB</td></tr>`).join('')}</tbody></table><div class="pad"><button class="btn danger" data-a="kill" ${sel && ps.find((p) => p.pid === sel)?.win ? '' : 'disabled'}>${gl('x')}End process</button></div>`;
          main.querySelectorAll('tr[data-pid]').forEach((tr) => (tr.onclick = () => { sel = +tr.dataset.pid; render(); }));
          main.querySelector('[data-a=kill]').onclick = () => { const p = OS.procs().find((x) => x.pid === sel); if (p && p.win) { OS.wm.close(p.win); sel = null; render(); } };
        } else if (tab === 'res') {
          main.innerHTML = `<div class="pad col" style="gap:18px"><div><div class="row"><b style="flex:1">CPU</b><span class="muted small" data-v="cpu"></span></div><canvas class="graph" data-g="cpu"></canvas></div><div><div class="row"><b style="flex:1">Memory</b><span class="muted small" data-v="mem"></span></div><canvas class="graph" data-g="mem"></canvas></div><div><div class="row"><b style="flex:1">Network</b><span class="muted small" data-v="net"></span></div><canvas class="graph" data-g="net"></canvas></div></div>`;
          draw();
        } else {
          const used = OS.store.size(), q = 10 * 1024 * 1024;
          main.innerHTML = `<table class="proc-table"><thead><tr><th>Device</th><th>Mount</th><th>Type</th><th>Total</th><th>Used</th><th style="width:30%"></th></tr></thead><tbody><tr><td>cirrusfs</td><td>/</td><td>localStorage</td><td>${OS.fmtSize(q)}</td><td>${OS.fmtSize(used)}</td><td><div class="meter"><i style="width:${used / q * 100}%"></i></div></td></tr><tr><td>tmpfs</td><td>/dev/shm</td><td>tmpfs</td><td>2.0 GB</td><td>0 B</td><td><div class="meter"><i style="width:0"></i></div></td></tr></tbody></table>`;
        }
      }
      function draw() {
        if (tab !== 'res') return; const ac = OS.settings.accent;
        const g = (k) => main.querySelector(`[data-g=${k}]`); if (!g('cpu')) return;
        graph(g('cpu'), cpu, ac); graph(g('mem'), mem, '#ff5ca8'); graph(g('net'), net, '#3fdc77');
        main.querySelector('[data-v=cpu]').textContent = cpu[cpu.length - 1].toFixed(1) + '% · ' + (navigator.hardwareConcurrency || 4) + ' cores';
        main.querySelector('[data-v=mem]').textContent = mem[mem.length - 1].toFixed(1) + '%' + (performance.memory ? ` · ${OS.fmtSize(performance.memory.usedJSHeapSize)} JS heap` : '');
        main.querySelector('[data-v=net]').textContent = navigator.onLine ? net[net.length - 1].toFixed(1) + ' KB/s' : 'offline';
      }
      OS.wm.interval(win, () => { sample(); if (tab === 'proc') render(); else draw(); win.body.querySelector('.mon-status').textContent = `${OS.procs().length} processes · CPU ${cpu[cpu.length - 1].toFixed(0)}% · Memory ${mem[mem.length - 1].toFixed(0)}% · Uptime ${OS.fmtDur((Date.now() - OS.bootTime) / 1000)}`; }, 1000);
      for (let i = 0; i < 60; i++) sample(); render();
    },
  });

  /* ======================= CALENDAR ======================= */
  OS.registerApp({
    id: 'calendar', name: 'Calendar', icon: 'calendar', color: ['#ff6b6b', '#e5484d'], cat: 'Office', w: 820, h: 580, single: true, desc: 'Events & dates', keywords: 'date schedule',
    launch(win) {
      const file = () => OS.home() + '/.local/share/calendar.json';
      const loadEv = () => { try { return JSON.parse(OS.fs.read(file())); } catch (e) { return {}; } };
      const saveEv = (ev) => { OS.fs.mkdir(OS.home() + '/.local/share', { p: true }); OS.fs.write(file(), JSON.stringify(ev)); };
      let ev = loadEv(), month = new Date(), selD = new Date(); month.setDate(1);
      const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      function render() {
        const y = month.getFullYear(), m = month.getMonth(), today = new Date();
        const first = (new Date(y, m, 1).getDay() + 6) % 7; const start = new Date(y, m, 1 - first);
        let cells = ''; for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); const k = key(d); cells += `<button data-d="${k}" class="${d.getMonth() !== m ? 'o' : ''} ${k === key(today) ? 'today' : ''} ${k === key(selD) ? 'sel' : ''} ${ev[k]?.length ? 'ev' : ''}">${d.getDate()}</button>`; }
        const list = ev[key(selD)] || [];
        const upcoming = Object.keys(ev).filter((k) => k >= key(today) && ev[k].length).sort().slice(0, 6);
        win.body.innerHTML = `<div class="split" style="flex-wrap:wrap;overflow:auto"><div style="flex:2;min-width:300px;padding:16px">
          <div class="row" style="margin-bottom:12px"><h2 style="margin:0;flex:1;font-size:20px">${month.toLocaleDateString([], { month: 'long', year: 'numeric' })}</h2><button class="btn sm" data-a="today">Today</button><button class="ibtn" data-a="prev">${gl('left')}</button><button class="ibtn" data-a="next">${gl('right')}</button></div>
          <div class="cal-grid">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<span class="dn">${d}</span>`).join('')}${cells}</div></div>
          <div style="flex:1;min-width:240px;padding:16px;border-left:1px solid var(--border);background:var(--surface2)">
          <div class="row"><b style="flex:1">${selD.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</b><button class="btn sm primary" data-a="add">${gl('plus')}Event</button></div>
          <div class="col" style="margin-top:12px;gap:6px">${list.length ? list.map((e, i) => `<div class="notif" style="background:var(--surface)"><span style="width:4px;border-radius:4px;background:${OS.accents[i % 8]}"></span><div style="flex:1"><b>${esc(e.t)}</b><small>${esc(e.time || 'All day')}</small></div><button class="ibtn" data-del="${i}">${gl('trash')}</button></div>`).join('') : '<div class="muted small">No events</div>'}</div>
          <div class="sm-title" style="margin:20px 0 8px">Upcoming</div>${upcoming.map((k) => ev[k].map((e) => `<div class="small" style="padding:4px 0"><b>${new Date(k + 'T00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })}</b> · ${esc(e.time || '')} ${esc(e.t)}</div>`).join('')).join('') || '<div class="muted small">Nothing planned</div>'}</div></div>`;
        const q = (s) => win.body.querySelector(s);
        win.body.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => { selD = new Date(b.dataset.d + 'T00:00'); if (selD.getMonth() !== month.getMonth()) { month = new Date(selD); month.setDate(1); } render(); }));
        q('[data-a=prev]').onclick = () => { month.setMonth(month.getMonth() - 1); render(); };
        q('[data-a=next]').onclick = () => { month.setMonth(month.getMonth() + 1); render(); };
        q('[data-a=today]').onclick = () => { selD = new Date(); month = new Date(); month.setDate(1); render(); };
        q('[data-a=add]').onclick = () => {
          const p = OS.dialog({ title: 'New event', html: `<input class="inp" placeholder="Title" data-f="t"><input class="inp" type="time" data-f="time">`, buttons: [{ label: 'Cancel', value: null }, { label: 'Add', value: 'ok', primary: true }] });
          const d = OS._dlg.el; const t = d.querySelector('[data-f=t]'), tm = d.querySelector('[data-f=time]'); setTimeout(() => t.focus(), 50);
          p.then((v) => { if (v === 'ok' && t.value.trim()) { const k = key(selD); (ev[k] = ev[k] || []).push({ t: t.value.trim(), time: tm.value }); ev[k].sort((a, b) => (a.time || '').localeCompare(b.time || '')); saveEv(ev); render(); } });
        };
        win.body.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => { const k = key(selD); ev[k].splice(+b.dataset.del, 1); saveEv(ev); render(); }));
      }
      render();
    },
  });

  /* ======================= CLOCK ======================= */
  OS.registerApp({
    id: 'clock', name: 'Clock', icon: 'clock', color: ['#4e5b78', '#232a3b'], cat: 'Accessories', w: 560, h: 560, single: true, desc: 'World clock, stopwatch, timer, alarms', keywords: 'stopwatch timer alarm time',
    launch(win) {
      let tab = 'world'; const zones = OS.store.get('clock-zones', ['Europe/London', 'America/New_York', 'Asia/Tokyo', 'Australia/Sydney']);
      let sw = { run: false, t0: 0, acc: 0, laps: [] }, tm = { run: false, end: 0, left: 300000, total: 300000 }, alarms = OS.store.get('alarms', []);
      win.body.innerHTML = `<div class="tabs" style="justify-content:center"><button class="tab" data-t="world">${gl('globe')} World</button><button class="tab" data-t="sw">${gl('timer')} Stopwatch</button><button class="tab" data-t="timer">${gl('clock')} Timer</button><button class="tab" data-t="alarm">${gl('alarm')} Alarms</button></div><div class="scroll pad clk"></div>`;
      const main = win.body.querySelector('.clk');
      win.body.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { tab = b.dataset.t; render(); }));
      const fmtMs = (ms) => { const s = Math.floor(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}.${String(Math.floor(ms % 1000 / 10)).padStart(2, '0')}`; };
      function render() {
        win.body.querySelectorAll('[data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
        if (tab === 'world') {
          main.innerHTML = `<div class="big-time" data-local></div><div class="muted" style="text-align:center;margin-bottom:20px">${Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ')}</div><div class="col" data-zones></div><button class="btn" style="margin-top:12px" data-a="addz">${gl('plus')}Add city</button>`;
          main.querySelector('[data-a=addz]').onclick = async () => { const all = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : ['Europe/Paris', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata', 'America/Los_Angeles']; const q = await OS.prompt('Add city', 'Type a city (e.g. Paris, Tokyo, Chicago):', ''); if (!q) return; const z = all.find((x) => x.toLowerCase().includes(q.toLowerCase().replace(/ /g, '_'))); if (!z) return OS.alert('Not found', 'No time zone matches “' + q + '”.'); zones.push(z); OS.store.set('clock-zones', zones); render(); };
        } else if (tab === 'sw') {
          main.innerHTML = `<div class="big-time" data-sw style="margin:30px 0"></div><div class="row" style="justify-content:center;gap:10px"><button class="btn primary" data-a="ss" style="min-width:110px"></button><button class="btn" data-a="lap"></button></div><div class="col" style="margin-top:20px;gap:0">${sw.laps.map((l, i) => `<div class="row" style="padding:8px;border-bottom:1px solid var(--border)"><span class="muted" style="flex:1">Lap ${sw.laps.length - i}</span><b style="font-variant-numeric:tabular-nums">${fmtMs(l)}</b></div>`).join('')}</div>`;
          const ss = main.querySelector('[data-a=ss]'), lap = main.querySelector('[data-a=lap]');
          ss.textContent = sw.run ? 'Pause' : sw.acc ? 'Resume' : 'Start'; lap.textContent = sw.run ? 'Lap' : 'Reset';
          ss.onclick = () => { if (sw.run) { sw.acc += performance.now() - sw.t0; sw.run = false; } else { sw.t0 = performance.now(); sw.run = true; } render(); };
          lap.onclick = () => { if (sw.run) sw.laps.unshift(sw.acc + performance.now() - sw.t0); else { sw.acc = 0; sw.laps = []; } render(); };
        } else if (tab === 'timer') {
          main.innerHTML = `<div class="big-time" data-tm style="margin:30px 0 10px"></div><div class="prog" style="max-width:360px;margin:0 auto 24px"><i data-tp></i></div>
            ${tm.run || tm.left !== tm.total ? '' : `<div class="row" style="justify-content:center;gap:6px;flex-wrap:wrap;margin-bottom:16px">${[1, 3, 5, 10, 15, 25, 45, 60].map((m) => `<button class="chip ${tm.total === m * 60000 ? 'on' : ''}" data-m="${m}">${m} min</button>`).join('')}<button class="chip" data-m="custom">Custom…</button></div>`}
            <div class="row" style="justify-content:center;gap:10px"><button class="btn primary" data-a="ts" style="min-width:110px">${tm.run ? 'Pause' : 'Start'}</button><button class="btn" data-a="tr">Reset</button></div>`;
          main.querySelectorAll('[data-m]').forEach((b) => (b.onclick = async () => { let m = b.dataset.m; if (m === 'custom') { m = await OS.prompt('Timer', 'Minutes:', '20'); if (!m || isNaN(m)) return; } tm.total = tm.left = +m * 60000; render(); }));
          main.querySelector('[data-a=ts]').onclick = () => { if (tm.run) { tm.left = tm.end - Date.now(); tm.run = false; } else { tm.end = Date.now() + tm.left; tm.run = true; } render(); };
          main.querySelector('[data-a=tr]').onclick = () => { tm.run = false; tm.left = tm.total; render(); };
        } else {
          main.innerHTML = `<div class="col">${alarms.map((a, i) => `<div class="set-row card" style="padding:12px 16px"><div class="lab"><b style="font-size:28px;font-weight:300">${a.t}</b><small>${esc(a.label || 'Alarm')}</small></div><label class="switch"><input type="checkbox" data-al="${i}" ${a.on ? 'checked' : ''}><i></i></label><button class="ibtn" data-del="${i}">${gl('trash')}</button></div>`).join('') || '<div class="empty">' + gl('alarm') + '<div>No alarms</div><div class="small">Alarms ring while Cirrus is open</div></div>'}</div><button class="btn primary" style="margin-top:12px" data-a="adda">${gl('plus')}Add alarm</button>`;
          main.querySelectorAll('[data-al]').forEach((c) => (c.onchange = () => { alarms[+c.dataset.al].on = c.checked; OS.store.set('alarms', alarms); }));
          main.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => { alarms.splice(+b.dataset.del, 1); OS.store.set('alarms', alarms); render(); }));
          main.querySelector('[data-a=adda]').onclick = () => { const p = OS.dialog({ title: 'New alarm', html: '<input class="inp" type="time" value="07:00" data-f="t"><input class="inp" placeholder="Label" data-f="l">', buttons: [{ label: 'Cancel', value: null }, { label: 'Add', value: 'ok', primary: true }] }); const d = OS._dlg.el; const t = d.querySelector('[data-f=t]'), l = d.querySelector('[data-f=l]'); p.then((v) => { if (v === 'ok' && t.value) { alarms.push({ t: t.value, label: l.value, on: true }); OS.store.set('alarms', alarms); render(); } }); };
        }
        tick();
      }
      function tick() {
        const q = (s) => main.querySelector(s);
        if (q('[data-local]')) { q('[data-local]').textContent = OS.fmtTime(new Date(), true); const z = q('[data-zones]'); z.innerHTML = zones.map((zn, i) => { const t = new Date().toLocaleTimeString([], { timeZone: zn, hour: '2-digit', minute: '2-digit', hour12: !OS.settings.clock24 }); const off = (new Date(new Date().toLocaleString('en-US', { timeZone: zn })) - new Date(new Date().toLocaleString('en-US'))) / 3600000; return `<div class="set-row card" style="padding:12px 16px"><div class="lab"><b>${esc(zn.split('/').pop().replace(/_/g, ' '))}</b><small>${off === 0 ? 'Same time' : (off > 0 ? '+' : '') + off + ' h'}</small></div><b style="font-size:24px;font-weight:300">${t}</b><button class="ibtn" data-rz="${i}">${gl('x')}</button></div>`; }).join(''); z.querySelectorAll('[data-rz]').forEach((b) => (b.onclick = () => { zones.splice(+b.dataset.rz, 1); OS.store.set('clock-zones', zones); render(); })); }
        if (q('[data-sw]')) q('[data-sw]').textContent = fmtMs(sw.acc + (sw.run ? performance.now() - sw.t0 : 0));
        if (q('[data-tm]')) { const left = tm.run ? Math.max(0, tm.end - Date.now()) : tm.left; q('[data-tm]').textContent = OS.fmtDur(Math.ceil(left / 1000)); q('[data-tp]').style.width = (1 - left / tm.total) * 100 + '%'; }
      }
      const loop = OS.wm.interval(win, () => {
        tick();
        if (tm.run && Date.now() >= tm.end) { tm.run = false; tm.left = tm.total; OS.notify('Timer finished', `${OS.fmtDur(tm.total / 1000)} timer is done`, { app: 'clock', force: true }); OS.sound('startup'); if (tab === 'timer') render(); }
      }, 50); void loop;
      render();
    },
  });
  // background alarm checker
  setInterval(() => { const al = OS.store.get('alarms', []); const now = new Date(); const t = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'); if (now.getSeconds() < 1) al.forEach((a) => { if (a.on && a.t === t) { OS.notify('⏰ ' + (a.label || 'Alarm'), a.t, { app: 'clock', force: true, timeout: 15000 }); OS.sound('startup'); setTimeout(() => OS.sound('startup'), 900); } }); }, 1000);

  /* ======================= MUSIC ======================= */
  const SONGS = [
    { t: 'Neon Drift', a: 'Cirrus Synths', bpm: 112, key: 57, scale: [0, 3, 5, 7, 10], seed: 3, c: ['#ff5ca8', '#7b5cff'] },
    { t: 'Morning Fjord', a: 'Cirrus Synths', bpm: 92, key: 60, scale: [0, 2, 4, 7, 9], seed: 11, c: ['#4facfe', '#00f2fe'] },
    { t: 'Pixel Forest', a: '8-bit Ensemble', bpm: 132, key: 64, scale: [0, 2, 4, 5, 7, 9, 11], seed: 7, c: ['#3fdc77', '#1f8f5a'] },
    { t: 'Night Bus', a: 'Lo-Fi Collective', bpm: 78, key: 53, scale: [0, 3, 5, 7, 10], seed: 21, c: ['#f7971e', '#ffd200'] },
    { t: 'Starfield', a: 'Ambient Works', bpm: 70, key: 62, scale: [0, 2, 4, 7, 9], seed: 5, c: ['#232a3b', '#6c8cff'] },
  ];
  const rng = (seed) => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  OS.registerApp({
    id: 'music', name: 'Music', icon: 'music', color: ['#ff5ca8', '#c147e9'], cat: 'Multimedia', w: 760, h: 560, single: true, desc: 'Music player', keywords: 'audio player songs rhythmbox',
    launch(win, args) {
      const A = OS.audio(); let cur = -1, playing = false, timer = null, startAt = 0, step = 0, master = null, analyser = null, audioEl = null, raf = null;
      const LEN = 64; // bars of 16 steps -> length
      const files = () => { const d = OS.home() + '/Music'; return OS.fs.isDir(d) ? OS.fs.ls(d).filter((f) => OS.ftype(f.name) === 'audio').map((f) => ({ t: f.name.replace(/\.[^.]+$/, ''), a: 'Local file', path: f.path, c: ['#8a93a6', '#4c5466'] })) : []; };
      let tracks = [...SONGS, ...files()];
      win.body.innerHTML = `<div class="split" style="flex-wrap:wrap;overflow:auto"><div style="flex:1;min-width:260px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:20px">
        <div class="mus-art"></div><div style="text-align:center"><b class="mus-t" style="font-size:18px">Not playing</b><div class="muted mus-a"></div></div>
        <canvas class="mus-vis" style="width:100%;max-width:300px;height:50px"></canvas>
        <div class="row" style="width:100%;max-width:320px;gap:8px"><small class="mus-pos muted">0:00</small><input type="range" class="mus-seek" min="0" max="1000" value="0" style="flex:1"><small class="mus-len muted">0:00</small></div>
        <div class="row" style="gap:12px"><button class="ibtn" data-a="shuf">${gl('shuffle')}</button><button class="ibtn" data-a="prev" style="width:46px;height:46px">${gl('prev')}</button><button class="btn primary" data-a="play" style="width:60px;height:60px;border-radius:50%;padding:0">${gl('play')}</button><button class="ibtn" data-a="next" style="width:46px;height:46px">${gl('next')}</button><button class="ibtn" data-a="add" title="Import songs">${gl('upload')}</button></div></div>
        <div class="mus-list scroll" style="flex:1;min-width:260px;border-left:1px solid var(--border);padding:10px;background:var(--surface2)"></div></div>`;
      const $ = (s) => win.body.querySelector(s); let shuffle = false;
      const durOf = (s) => (s.path ? (audioEl && audioEl.duration) || 0 : (LEN * 16 * 60) / s.bpm / 4);
      function list() { tracks = [...SONGS, ...files()]; $('.mus-list').innerHTML = `<div class="sm-title">Library</div>` + tracks.map((s, i) => `<button class="${i === cur ? 'on' : ''}" data-i="${i}"><span class="app-ico" style="width:38px;height:38px;background:linear-gradient(140deg,${s.c[0]},${s.c[1]})">${gl(i === cur && playing ? 'volume' : 'music', '')}</span><div style="flex:1;min-width:0"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.t)}</div><small class="muted">${esc(s.a)}</small></div><small class="muted">${s.path ? '' : OS.fmtDur(durOf(s))}</small></button>`).join('') + `<div class="small muted pad">Add your own MP3/OGG files to ~/Music (use the upload button).</div>`; $('.mus-list').querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => play(+b.dataset.i))); }
      function ensureGraph() { if (master) return; master = A.createGain(); analyser = A.createAnalyser(); analyser.fftSize = 128; master.connect(analyser); analyser.connect(A.destination); }
      const vol = () => OS.settings.volume / 100 * 0.5;
      function note(freq, t, dur, type, g, det = 0) { const o = A.createOscillator(), gn = A.createGain(); o.type = type; o.frequency.value = freq; o.detune.value = det; gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(g, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(gn).connect(master); o.start(t); o.stop(t + dur + 0.05); }
      function drum(t, kind) { if (kind === 'k') { const o = A.createOscillator(), g = A.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15); g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2); o.connect(g).connect(master); o.start(t); o.stop(t + 0.25); } else { const b = A.createBuffer(1, A.sampleRate * 0.1, A.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); const s = A.createBufferSource(); s.buffer = b; const g = A.createGain(); g.gain.value = kind === 's' ? 0.35 : 0.08; const f = A.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = kind === 's' ? 1200 : 7000; s.connect(f).connect(g).connect(master); s.start(t); } }
      function compose(s) {
        const r = rng(s.seed); const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12); const sc = (deg, oct = 0) => s.key + s.scale[((deg % s.scale.length) + s.scale.length) % s.scale.length] + 12 * (oct + Math.floor(deg / s.scale.length));
        const prog = [0, 3, 4, 2].map((x) => Math.floor(r() * s.scale.length) || x); const mel = Array.from({ length: 32 }, () => (r() < 0.55 ? Math.floor(r() * 8) : null)); const arp = Array.from({ length: 16 }, () => Math.floor(r() * 3) * 2);
        return { mtof, sc, prog, mel, arp };
      }
      function schedule(s, comp) {
        const spb = 60 / s.bpm / 4; const ahead = 0.15;
        while (startAt + step * spb < A.currentTime + ahead) {
          const t = startAt + step * spb; const bar = Math.floor(step / 16) % 4, st = step % 16; const sec = Math.floor(step / 64) % 4;
          const root = comp.prog[bar];
          if (st % 4 === 0) drum(t, 'k'); if (st % 8 === 4 && sec > 0) drum(t, 's'); if (st % 2 === 0 && sec > 0) drum(t, 'h');
          if (st % 4 === 0) note(comp.mtof(comp.sc(root, -2)), t, spb * 3.5, 'triangle', 0.25);
          if (st % 2 === 0) note(comp.mtof(comp.sc(root + comp.arp[st % 16], 0)), t, spb * 1.6, 'square', 0.035);
          const m = comp.mel[(step % 32)]; if (m !== null && sec !== 0 && st % 2 === 0) note(comp.mtof(comp.sc(root + m, 1)), t, spb * 2.5, 'sawtooth', 0.045, 6);
          if (st === 0) [0, 2, 4].forEach((d) => note(comp.mtof(comp.sc(root + d, 0)), t, spb * 15, 'sine', 0.05));
          step++;
          if (step >= LEN * 16) { stopSynth(); next(); return; }
        }
      }
      function stopSynth() { clearInterval(timer); timer = null; }
      function stop() { stopSynth(); if (audioEl) { audioEl.pause(); audioEl.src = ''; audioEl = null; } playing = false; }
      function play(i) {
        stop(); cur = i; const s = tracks[i]; if (!s) return; ensureGraph(); master.gain.value = vol(); A.resume();
        $('.mus-art').style.background = `linear-gradient(140deg,${s.c[0]},${s.c[1]})`; $('.mus-art').innerHTML = gl('music', ''); $('.mus-t').textContent = s.t; $('.mus-a').textContent = s.a; win.setTitle(s.t + ' — Music');
        if (s.path) { audioEl = new Audio(OS.fs.read(s.path)); const src = A.createMediaElementSource(audioEl); src.connect(master); audioEl.play().catch(() => {}); audioEl.onended = next; }
        else { const comp = compose(s); step = 0; startAt = A.currentTime + 0.05; timer = setInterval(() => schedule(s, comp), 40); }
        playing = true; upd(); list();
      }
      function toggle() {
        if (cur < 0) return play(0);
        if (playing) { if (audioEl) audioEl.pause(); else { stopSynth(); A.suspend(); } playing = false; }
        else { A.resume(); if (audioEl) audioEl.play(); else { const s = tracks[cur], comp = compose(s); const spb = 60 / s.bpm / 4; startAt = A.currentTime - step * spb + 0.05; timer = setInterval(() => schedule(s, comp), 40); } playing = true; }
        upd(); list();
      }
      const next = () => play(shuffle ? Math.floor(Math.random() * tracks.length) : (cur + 1) % tracks.length);
      const prev = () => play((cur - 1 + tracks.length) % tracks.length);
      function upd() { $('[data-a=play]').innerHTML = gl(playing ? 'pause' : 'play'); }
      function frame() {
        raf = requestAnimationFrame(frame);
        const s = tracks[cur]; if (s) { const d = durOf(s); const p = s.path ? (audioEl ? audioEl.currentTime : 0) : step * 60 / s.bpm / 4; $('.mus-pos').textContent = OS.fmtDur(p); $('.mus-len').textContent = OS.fmtDur(d); if (!$('.mus-seek')._drag) $('.mus-seek').value = d ? (p / d) * 1000 : 0; }
        const c = $('.mus-vis'); if (!c || !analyser) return; const W = (c.width = c.clientWidth * 2), H = (c.height = 100); const g = c.getContext('2d'); const d = new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(d); const n = 32, bw = W / n;
        for (let i = 0; i < n; i++) { const v = d[i * 2] / 255; g.fillStyle = OS.settings.accent; g.globalAlpha = 0.4 + v * 0.6; g.fillRect(i * bw + 2, H - v * H, bw - 4, v * H); }
      }
      const seek = $('.mus-seek'); seek.onpointerdown = () => (seek._drag = true); seek.onchange = () => { seek._drag = false; const s = tracks[cur]; if (!s) return; if (audioEl) audioEl.currentTime = (seek.value / 1000) * audioEl.duration; else { step = Math.floor((seek.value / 1000) * LEN * 16); const spb = 60 / s.bpm / 4; startAt = A.currentTime - step * spb + 0.05; } };
      $('[data-a=play]').onclick = toggle; $('[data-a=next]').onclick = next; $('[data-a=prev]').onclick = prev;
      $('[data-a=shuf]').onclick = (e) => { shuffle = !shuffle; e.currentTarget.classList.toggle('on', shuffle); };
      $('[data-a=add]').onclick = () => { OS.fs.mkdir(OS.home() + '/Music', { p: true }); OS.uploadPicker(OS.home() + '/Music', 'audio/*'); };
      const offS = OS.on('settings', (k) => { if (k === 'volume' && master) master.gain.value = vol(); });
      const offF = OS.on('fs', (d) => { if (d === OS.home() + '/Music') list(); });
      OS.wm.keys(win, (e) => { if (e.key === ' ' && e.target.tagName !== 'INPUT') { e.preventDefault(); toggle(); } });
      win.onClose(() => { stop(); cancelAnimationFrame(raf); offS(); offF(); if (master) master.disconnect(); if (A.state === 'suspended') A.resume(); });
      win.onArgs = (a) => { if (a.path) { list(); const i = tracks.findIndex((t) => t.path === a.path); if (i >= 0) play(i); } };
      list(); frame(); $('.mus-art').style.background = 'linear-gradient(140deg,#ff5ca8,#c147e9)'; $('.mus-art').innerHTML = gl('music', '');
      if (args.path) win.onArgs(args);
    },
  });

  /* ======================= PAINT ======================= */
  OS.registerApp({
    id: 'paint', name: 'Paint', icon: 'brush', color: ['#ffd36b', '#ff8a5c'], cat: 'Graphics', w: 900, h: 620, desc: 'Draw and paint', keywords: 'draw gimp sketch',
    launch(win, args) {
      let tool = 'brush', color = '#2b2f3a', size = 6, path = args.path || null, undo = [], redo = [], drawing = false, sx = 0, sy = 0, snap = null, dirty = false;
      const PAL = ['#000000', '#ffffff', '#8a93a6', '#e5484d', '#ff8a5c', '#f7c948', '#3fdc77', '#1fc8b0', '#2bb3ff', '#6c8cff', '#8b5cff', '#ff5ca8', '#8b5a2b'];
      win.body.innerHTML = `<div class="toolbar">${[['brush', 'brush'], ['eraser', 'eraser'], ['line', 'line'], ['rect', 'square'], ['circle', 'circle'], ['fill', 'bucket'], ['pick', 'pipette']].map(([t, i]) => `<button class="ibtn" data-tool="${t}" title="${t}">${gl(i)}</button>`).join('')}<span class="tsep" style="height:22px"></span>
        <input type="color" value="${color}" data-c><input type="range" min="1" max="60" value="${size}" data-s style="width:90px" title="Size"><span class="grow"></span>
        <button class="ibtn" data-a="undo">${gl('undo')}</button><button class="ibtn" data-a="redo">${gl('redo')}</button><button class="ibtn" data-a="save">${gl('save')}</button><button class="ibtn" data-a="more">${gl('dots')}</button></div>
        <div class="toolbar" style="gap:6px">${PAL.map((c) => `<div class="colorbox" data-p="${c}" style="background:${c};width:24px;height:24px"></div>`).join('')}</div>
        <div class="paint-wrap"><canvas></canvas></div>`;
      const $ = (s) => win.body.querySelector(s); const cv = $('canvas'), g = cv.getContext('2d', { willReadFrequently: true });
      const wrap = $('.paint-wrap');
      const init = (w, h) => { cv.width = w; cv.height = h; g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); };
      init(Math.max(320, Math.min(1200, wrap.clientWidth - 20)), Math.max(240, Math.min(900, wrap.clientHeight - 20)));
      const title = () => win.setTitle((dirty ? '• ' : '') + (path ? OS.fs.basename(path) : 'Untitled') + ' — Paint');
      const push = () => { undo.push(g.getImageData(0, 0, cv.width, cv.height)); if (undo.length > 30) undo.shift(); redo = []; dirty = true; title(); };
      const setTool = (t) => { tool = t; win.body.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === t)); };
      setTool('brush');
      const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
      function flood(x, y) {
        x |= 0; y |= 0; const im = g.getImageData(0, 0, cv.width, cv.height), d = im.data, W = cv.width, H = cv.height; const i0 = (y * W + x) * 4; const t = [d[i0], d[i0 + 1], d[i0 + 2], d[i0 + 3]];
        const c = parseInt(color.slice(1), 16); const fc = [(c >> 16) & 255, (c >> 8) & 255, c & 255, 255]; if (t.every((v, i) => Math.abs(v - fc[i]) < 4)) return;
        const match = (i) => Math.abs(d[i] - t[0]) < 32 && Math.abs(d[i + 1] - t[1]) < 32 && Math.abs(d[i + 2] - t[2]) < 32 && Math.abs(d[i + 3] - t[3]) < 32;
        const st = [[x, y]]; while (st.length) { let [px, py] = st.pop(); let i = (py * W + px) * 4; while (py >= 0 && match(i)) { py--; i -= W * 4; } py++; i += W * 4; let l = false, r = false; while (py < H && match(i)) { d[i] = fc[0]; d[i + 1] = fc[1]; d[i + 2] = fc[2]; d[i + 3] = 255; if (px > 0) { if (match(i - 4)) { if (!l) { st.push([px - 1, py]); l = true; } } else l = false; } if (px < W - 1) { if (match(i + 4)) { if (!r) { st.push([px + 1, py]); r = true; } } else r = false; } py++; i += W * 4; } }
        g.putImageData(im, 0, 0);
      }
      cv.onpointerdown = (e) => {
        cv.setPointerCapture(e.pointerId); const [x, y] = pos(e);
        if (tool === 'pick') { const p = g.getImageData(x, y, 1, 1).data; color = '#' + [p[0], p[1], p[2]].map((v) => v.toString(16).padStart(2, '0')).join(''); $('[data-c]').value = color; setTool('brush'); return; }
        push(); if (tool === 'fill') { flood(x, y); return; }
        drawing = true; sx = x; sy = y; snap = g.getImageData(0, 0, cv.width, cv.height);
        g.lineCap = g.lineJoin = 'round'; g.lineWidth = size * (e.pressure && e.pointerType === 'pen' ? e.pressure * 2 : 1); g.strokeStyle = tool === 'eraser' ? '#fff' : color; g.fillStyle = color;
        if (tool === 'brush' || tool === 'eraser') { g.beginPath(); g.arc(x, y, g.lineWidth / 2, 0, 7); g.fillStyle = g.strokeStyle; g.fill(); g.beginPath(); g.moveTo(x, y); }
      };
      cv.onpointermove = (e) => {
        if (!drawing) return; const [x, y] = pos(e);
        if (tool === 'brush' || tool === 'eraser') { g.lineTo(x, y); g.stroke(); g.beginPath(); g.moveTo(x, y); }
        else { g.putImageData(snap, 0, 0); g.beginPath(); if (tool === 'line') { g.moveTo(sx, sy); g.lineTo(x, y); } else if (tool === 'rect') g.rect(sx, sy, x - sx, y - sy); else if (tool === 'circle') g.ellipse((sx + x) / 2, (sy + y) / 2, Math.abs(x - sx) / 2, Math.abs(y - sy) / 2, 0, 0, 7); g.stroke(); }
      };
      cv.onpointerup = cv.onpointercancel = () => { drawing = false; };
      win.body.querySelectorAll('[data-tool]').forEach((b) => (b.onclick = () => setTool(b.dataset.tool)));
      win.body.querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => { color = b.dataset.p; $('[data-c]').value = color; if (tool === 'eraser' || tool === 'pick') setTool('brush'); }));
      $('[data-c]').oninput = (e) => (color = e.target.value); $('[data-s]').oninput = (e) => (size = +e.target.value);
      const doUndo = () => { if (!undo.length) return; redo.push(g.getImageData(0, 0, cv.width, cv.height)); g.putImageData(undo.pop(), 0, 0); };
      const doRedo = () => { if (!redo.length) return; undo.push(g.getImageData(0, 0, cv.width, cv.height)); g.putImageData(redo.pop(), 0, 0); };
      $('[data-a=undo]').onclick = doUndo; $('[data-a=redo]').onclick = doRedo;
      const save = async (as) => { let p = path && !/\.svg$/i.test(path) ? path : null; if (!p || as) { p = await OS.pickFile({ mode: 'save', path: OS.home() + '/Pictures', name: path ? OS.fs.basename(path).replace(/\.\w+$/, '.png') : 'Drawing.png' }); if (!p) return false; if (!/\.png$/i.test(p)) p += '.png'; } try { OS.fs.write(p, cv.toDataURL('image/png')); path = p; dirty = false; title(); OS.notify('Saved', OS.fs.pretty(p), { app: 'paint' }); return true; } catch (e) { OS.alert('Save failed', e.message + '\nTry a smaller canvas.'); return false; } };
      $('[data-a=save]').onclick = () => save();
      const load = (p) => { const img = new Image(); img.onload = () => { init(img.naturalWidth || 800, img.naturalHeight || 600); g.drawImage(img, 0, 0); path = p; dirty = false; undo = []; title(); }; img.src = OS.toDataUrl(OS.fs.read(p), p); };
      $('[data-a=more]').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left - 200, r.bottom, [
        { label: 'New canvas', icon: 'plus', action: async () => { if (dirty && !(await OS.confirm('Discard drawing?', '', 'Discard', true))) return; init(cv.width, cv.height); path = null; dirty = false; undo = []; title(); } },
        { label: 'Open image…', icon: 'folder', action: async () => { const p = await OS.pickFile({ mode: 'open', path: OS.home() + '/Pictures', filter: (n) => OS.ftype(n) === 'image' }); if (p) load(p); } },
        { label: 'Save As…', icon: 'save', action: () => save(true) },
        { label: 'Download PNG', icon: 'download', action: () => OS.downloadReal((path ? OS.fs.basename(path).replace(/\.\w+$/, '') : 'drawing') + '.png', cv.toDataURL('image/png')) },
        '-', { label: 'Clear', icon: 'trash', danger: true, action: () => { push(); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); } },
        { label: 'Invert colors', icon: 'refresh', action: () => { push(); const im = g.getImageData(0, 0, cv.width, cv.height); for (let i = 0; i < im.data.length; i += 4) { im.data[i] = 255 - im.data[i]; im.data[i + 1] = 255 - im.data[i + 1]; im.data[i + 2] = 255 - im.data[i + 2]; } g.putImageData(im, 0, 0); } },
        { label: 'Grayscale', icon: 'palette', action: () => { push(); const im = g.getImageData(0, 0, cv.width, cv.height); for (let i = 0; i < im.data.length; i += 4) { const v = im.data[i] * .3 + im.data[i + 1] * .59 + im.data[i + 2] * .11; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; } g.putImageData(im, 0, 0); } },
      ]); };
      OS.wm.keys(win, (e) => { const c = e.ctrlKey || e.metaKey; if (c && e.key === 'z') { e.preventDefault(); doUndo(); } else if (c && e.key === 'y') { e.preventDefault(); doRedo(); } else if (c && e.key === 's') { e.preventDefault(); save(); } });
      win.beforeClose = async () => { if (!dirty) return true; const r = await OS.dialog({ title: 'Save drawing?', message: 'Your changes will be lost otherwise.', buttons: [{ label: 'Cancel', value: 'c' }, { label: "Don't save", value: 'd', danger: true }, { label: 'Save', value: 's', primary: true }] }); return r === 's' ? save() : r === 'd'; };
      if (path) load(path); else title();
    },
  });

  /* ======================= WEATHER ======================= */
  const WMO = { 0: ['Clear sky', 'sun'], 1: ['Mainly clear', 'sun'], 2: ['Partly cloudy', 'cloud'], 3: ['Overcast', 'cloud'], 45: ['Fog', 'fog'], 48: ['Rime fog', 'fog'], 51: ['Light drizzle', 'rain'], 53: ['Drizzle', 'rain'], 55: ['Heavy drizzle', 'rain'], 61: ['Light rain', 'rain'], 63: ['Rain', 'rain'], 65: ['Heavy rain', 'rain'], 66: ['Freezing rain', 'rain'], 67: ['Freezing rain', 'rain'], 71: ['Light snow', 'snow'], 73: ['Snow', 'snow'], 75: ['Heavy snow', 'snow'], 77: ['Snow grains', 'snow'], 80: ['Rain showers', 'rain'], 81: ['Rain showers', 'rain'], 82: ['Violent showers', 'storm'], 85: ['Snow showers', 'snow'], 86: ['Snow showers', 'snow'], 95: ['Thunderstorm', 'storm'], 96: ['Thunderstorm, hail', 'storm'], 99: ['Thunderstorm, hail', 'storm'] };
  OS.registerApp({
    id: 'weather', name: 'Weather', icon: 'cloud', color: ['#6fb1fc', '#4364f7'], cat: 'Internet', w: 640, h: 620, single: true, desc: 'Live weather forecasts', keywords: 'forecast temperature',
    launch(win) {
      let loc = OS.store.get('wx-loc', { name: 'Stockholm', lat: 59.33, lon: 18.07 }), unit = OS.store.get('wx-unit', 'C');
      win.body.innerHTML = `<div class="toolbar"><form class="br-url" style="flex:1">${gl('search')}<input placeholder="Search city…" spellcheck="false"></form><button class="ibtn" data-a="geo" title="My location">${gl('location')}</button><button class="btn sm" data-a="unit"></button></div><div class="scroll pad wx"></div>`;
      const main = win.body.querySelector('.wx'), inp = win.body.querySelector('input');
      const T = (c) => Math.round(unit === 'C' ? c : c * 9 / 5 + 32) + '°';
      async function load() {
        main.innerHTML = `<div class="empty"><div class="spinner" style="border-color:var(--border2);border-top-color:var(--accent)"></div><div>Loading weather for ${esc(loc.name)}…</div></div>`;
        win.body.querySelector('[data-a=unit]').textContent = '°' + unit;
        try {
          const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=7`);
          if (!r.ok) throw new Error('HTTP ' + r.status); const d = await r.json(); const c = d.current; const [desc, ic] = WMO[c.weather_code] || ['Unknown', 'cloud'];
          const nowI = d.hourly.time.findIndex((t) => t >= c.time.slice(0, 13));
          main.innerHTML = `<div class="wx-hero" style="background:${c.is_day ? 'linear-gradient(160deg,#4f8cff,#7b5cff)' : 'linear-gradient(160deg,#1d2b64,#3a2a6e)'}">${gl(c.is_day || ic !== 'sun' ? ic : 'moon')}<div style="flex:1"><div style="font-size:18px;font-weight:600">${esc(loc.name)}</div><div class="t">${T(c.temperature_2m)}</div><div>${desc}</div></div><div class="small" style="line-height:1.9">Feels like ${T(c.apparent_temperature)}<br>${gl('droplet')} ${c.relative_humidity_2m}%<br>${gl('wind')} ${Math.round(c.wind_speed_10m)} km/h</div></div>
            <div class="sm-title" style="margin:20px 0 8px">Next 24 hours</div><div class="wx-hours">${d.hourly.time.slice(Math.max(0, nowI), Math.max(0, nowI) + 24).map((t, i) => { const k = Math.max(0, nowI) + i; return `<div><div class="muted">${i ? new Date(t).getHours() + ':00' : 'Now'}</div>${gl((WMO[d.hourly.weather_code[k]] || [0, 'cloud'])[1])}<b>${T(d.hourly.temperature_2m[k])}</b></div>`; }).join('')}</div>
            <div class="sm-title" style="margin:16px 0 4px">7-day forecast</div><div class="wx-days">${d.daily.time.map((t, i) => `<div><span style="width:90px">${i ? new Date(t + 'T12:00').toLocaleDateString([], { weekday: 'long' }) : 'Today'}</span>${gl((WMO[d.daily.weather_code[i]] || [0, 'cloud'])[1])}<span class="muted" style="flex:1">${(WMO[d.daily.weather_code[i]] || ['?'])[0]}</span><span class="muted">${T(d.daily.temperature_2m_min[i])}</span><b style="width:40px;text-align:right">${T(d.daily.temperature_2m_max[i])}</b></div>`).join('')}</div>
            <div class="small muted" style="margin-top:14px">Sunrise ${d.daily.sunrise[0].slice(11)} · Sunset ${d.daily.sunset[0].slice(11)} · Data: Open-Meteo</div>`;
          win.setTitle(`${loc.name} ${T(c.temperature_2m)} — Weather`);
        } catch (e) { main.innerHTML = `<div class="empty">${gl('wifioff')}<div><b>Couldn't load weather</b></div><div class="small">${navigator.onLine ? esc(e.message) : 'You are offline.'}</div><button class="btn" data-a="retry">Try again</button></div>`; main.querySelector('[data-a=retry]').onclick = load; }
      }
      win.body.querySelector('form').onsubmit = async (e) => {
        e.preventDefault(); const q = inp.value.trim(); if (!q) return;
        try { const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6`); const j = await r.json(); if (!j.results || !j.results.length) return OS.alert('Not found', `No place called “${q}”.`); const pickOne = (x) => { loc = { name: x.name, lat: x.latitude, lon: x.longitude }; OS.store.set('wx-loc', loc); inp.value = ''; load(); }; if (j.results.length === 1) return pickOne(j.results[0]); const r2 = inp.getBoundingClientRect(); OS.menu(r2.left, r2.bottom + 4, j.results.map((x) => ({ label: `${x.name}, ${x.admin1 ? x.admin1 + ', ' : ''}${x.country || ''}`, icon: 'location', action: () => pickOne(x) }))); } catch (er) { OS.alert('Search failed', 'Check your internet connection.'); }
      };
      win.body.querySelector('[data-a=geo]').onclick = () => { if (!navigator.geolocation) return OS.alert('Unavailable', 'Location is not supported.'); navigator.geolocation.getCurrentPosition((p) => { loc = { name: 'My location', lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3) }; OS.store.set('wx-loc', loc); load(); }, (e) => OS.alert('Location denied', e.message)); };
      win.body.querySelector('[data-a=unit]').onclick = () => { unit = unit === 'C' ? 'F' : 'C'; OS.store.set('wx-unit', unit); load(); };
      load();
    },
  });

  /* ======================= NOTES ======================= */
  OS.registerApp({
    id: 'notes', name: 'Notes', icon: 'filetext', color: ['#f7c948', '#f59f00'], cat: 'Office', w: 760, h: 520, single: true, desc: 'Quick notes', keywords: 'sticky memo',
    launch(win) {
      const dir = () => OS.home() + '/Documents/Notes'; OS.fs.mkdir(dir(), { p: true });
      let cur = null, t = null;
      win.body.innerHTML = `<div class="split" style="position:relative"><div class="sidebar" style="width:230px"><button class="btn primary" data-a="new" style="width:100%;margin-bottom:8px">${gl('plus')}New note</button><div class="nl"></div></div><div style="flex:1;display:flex;flex-direction:column;min-width:0"><div class="toolbar"><button class="ibtn side-toggle" data-a="side">${gl('menu')}</button><input class="inp nt" style="flex:1;font-weight:600;border:0;background:transparent;font-size:16px" placeholder="Title"><button class="ibtn" data-a="del">${gl('trash')}</button></div><textarea class="editor wrap nb" style="font-family:var(--font);font-size:15px;padding:16px" placeholder="Start typing…"></textarea></div></div>`;
      const $ = (s) => win.body.querySelector(s); const nl = $('.nl'), ti = $('.nt'), tb = $('.nb');
      const notes = () => OS.fs.ls(dir()).filter((f) => f.type === 'file').sort((a, b) => b.mtime - a.mtime);
      function list() { nl.innerHTML = notes().map((f) => { const c = OS.fs.read(f.path); return `<button class="side-item ${f.path === cur ? 'on' : ''}" data-p="${esc(f.path)}" style="flex-direction:column;align-items:flex-start;gap:2px"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${esc(f.name.replace(/\.txt$/, ''))}</b><small class="muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${esc(c.slice(0, 50).replace(/\n/g, ' ') || 'Empty note')}</small></button>`; }).join('') || '<div class="muted small pad">No notes yet</div>'; nl.querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => { open(b.dataset.p); $('.sidebar').classList.remove('open'); })); }
      function open(p) { cur = p; ti.value = OS.fs.basename(p).replace(/\.txt$/, ''); tb.value = OS.fs.read(p); list(); tb.focus(); }
      function save() { if (!cur) return; OS.fs.write(cur, tb.value); let name = (ti.value.trim() || 'Untitled').replace(/\//g, '-') + '.txt'; const np = OS.fs.join(dir(), name); if (np !== cur) { const fin = OS.fs.exists(np) ? OS.fs.uniqueName(dir(), name) : np; OS.fs.mv(cur, fin); cur = fin; } list(); }
      const later = () => { clearTimeout(t); t = setTimeout(save, 500); };
      tb.oninput = later; ti.oninput = later;
      $('[data-a=new]').onclick = () => { const p = OS.fs.uniqueName(dir(), 'New note.txt'); OS.fs.write(p, ''); open(p); ti.select(); };
      $('[data-a=del]').onclick = () => { if (!cur) return; clearTimeout(t); OS.fs.trash(cur); cur = null; const n = notes(); if (n[0]) open(n[0].path); else { ti.value = tb.value = ''; list(); } };
      $('[data-a=side]').onclick = () => $('.sidebar').classList.toggle('open');
      win.onClose(() => { clearTimeout(t); save(); });
      const n = notes(); if (n.length) open(n[0].path); else { OS.fs.write(OS.fs.join(dir(), 'Welcome.txt'), 'Notes save automatically to ~/Documents/Notes.\n\nTry editing this note!'); open(OS.fs.join(dir(), 'Welcome.txt')); }
    },
  });

  /* ======================= CAMERA ======================= */
  OS.registerApp({
    id: 'camera', name: 'Camera', icon: 'camera', color: ['#4e5b78', '#1b1f2b'], cat: 'Multimedia', w: 720, h: 560, single: true, desc: 'Take photos', keywords: 'webcam photo selfie',
    launch(win) {
      let stream = null, facing = 'user';
      win.body.innerHTML = `<div class="cam"><video autoplay playsinline muted></video><div class="flash"></div><button class="shutter" title="Take photo"></button><button class="ibtn" data-a="flip" style="position:absolute;bottom:30px;right:24px;color:#fff;background:rgba(255,255,255,.2)">${gl('refresh')}</button><button class="ibtn" data-a="gal" style="position:absolute;bottom:30px;left:24px;color:#fff;background:rgba(255,255,255,.2)">${gl('image')}</button></div>`;
      const v = win.body.querySelector('video');
      async function start() { stop(); try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false }); v.srcObject = stream; } catch (e) { win.body.querySelector('.cam').innerHTML = `<div class="empty" style="color:#aaa">${gl('camera')}<div><b>Camera unavailable</b></div><div class="small">${esc(e.message || 'Permission denied')}</div></div>`; } }
      function stop() { if (stream) stream.getTracks().forEach((t) => t.stop()); stream = null; }
      win.body.querySelector('.shutter').onclick = () => {
        if (!v.videoWidth) return; const c = document.createElement('canvas'); const sc = Math.min(1, 1280 / v.videoWidth); c.width = v.videoWidth * sc; c.height = v.videoHeight * sc; const g = c.getContext('2d'); if (facing === 'user') { g.translate(c.width, 0); g.scale(-1, 1); } g.drawImage(v, 0, 0, c.width, c.height);
        const f = win.body.querySelector('.flash'); f.style.opacity = 0.9; setTimeout(() => (f.style.opacity = 0), 120); OS.sound('click');
        OS.fs.mkdir(OS.home() + '/Pictures', { p: true }); const p = OS.fs.uniqueName(OS.home() + '/Pictures', `Photo ${new Date().toISOString().slice(0, 19).replace('T', ' ').replace(/:/g, '-')}.jpg`); OS.fs.write(p, c.toDataURL('image/jpeg', 0.85)); OS.notify('Photo saved', OS.fs.pretty(p), { app: 'camera', onclick: () => OS.wm.open('viewer', { path: p }) });
      };
      win.body.querySelector('[data-a=flip]').onclick = () => { facing = facing === 'user' ? 'environment' : 'user'; v.style.transform = facing === 'user' ? 'scaleX(-1)' : ''; start(); };
      win.body.querySelector('[data-a=gal]').onclick = () => OS.wm.open('files', { path: OS.home() + '/Pictures' });
      v.style.transform = 'scaleX(-1)'; win.onClose(stop); start();
    },
  });

  /* ======================= PIANO ======================= */
  OS.registerApp({
    id: 'piano', name: 'Piano', icon: 'piano', color: ['#3a3f4b', '#111318'], cat: 'Multimedia', w: 820, h: 400, desc: 'Play the piano', keywords: 'music synth keyboard',
    launch(win) {
      const A = OS.audio(); let wave = 'triangle', octave = 4; const active = {};
      const KEYS = 'awsedftgyhujkolp;'; const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E'];
      win.body.innerHTML = `<div class="game" style="justify-content:flex-start;padding-top:16px"><div class="row" style="flex-wrap:wrap;justify-content:center"><div class="seg">${['sine', 'triangle', 'square', 'sawtooth'].map((w) => `<button data-w="${w}" class="${w === wave ? 'on' : ''}">${w}</button>`).join('')}</div><button class="ibtn" data-o="-1">${gl('minus')}</button><b data-oct>Octave ${octave}</b><button class="ibtn" data-o="1">${gl('plus')}</button></div><div class="piano"></div><div class="small muted">Play with your keyboard: A W S E D F T G Y H U J K O L P</div></div>`;
      const pn = win.body.querySelector('.piano'); const whites = NOTES.map((n, i) => [n, i]).filter(([n]) => !n.includes('#'));
      whites.forEach(([n, i]) => pn.insertAdjacentHTML('beforeend', `<div class="wk" data-i="${i}">${n}<br>${KEYS[i].toUpperCase()}</div>`));
      const ww = 100 / whites.length;
      NOTES.forEach((n, i) => { if (!n.includes('#')) return; const wi = whites.findIndex(([, j]) => j === i - 1); pn.insertAdjacentHTML('beforeend', `<div class="bk" data-i="${i}" style="left:calc(${(wi + 1) * ww}% - ${ww * 0.3}%);width:${ww * 0.6}%">${KEYS[i].toUpperCase()}</div>`); });
      const freq = (i) => 440 * Math.pow(2, (i + (octave - 4) * 12 - 9) / 12);
      function on(i) { if (active[i]) return; const o = A.createOscillator(), g = A.createGain(); o.type = wave; o.frequency.value = freq(i); const v = OS.settings.volume / 100 * 0.3; g.gain.setValueAtTime(0, A.currentTime); g.gain.linearRampToValueAtTime(v, A.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(v * 0.4, A.currentTime + 0.5); o.connect(g).connect(A.destination); o.start(); active[i] = { o, g }; pn.querySelector(`[data-i="${i}"]`)?.classList.add('on'); }
      function off(i) { const a = active[i]; if (!a) return; a.g.gain.cancelScheduledValues(A.currentTime); a.g.gain.setValueAtTime(a.g.gain.value, A.currentTime); a.g.gain.exponentialRampToValueAtTime(0.0001, A.currentTime + 0.4); a.o.stop(A.currentTime + 0.45); delete active[i]; pn.querySelector(`[data-i="${i}"]`)?.classList.remove('on'); }
      const ptr = {};
      pn.onpointerdown = (e) => { const k = e.target.closest('[data-i]'); if (!k) return; pn.setPointerCapture(e.pointerId); ptr[e.pointerId] = +k.dataset.i; on(+k.dataset.i); };
      pn.onpointermove = (e) => { if (!(e.pointerId in ptr)) return; const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-i]'); const i = el ? +el.dataset.i : null; if (i !== ptr[e.pointerId]) { off(ptr[e.pointerId]); if (i != null) on(i); ptr[e.pointerId] = i; } };
      pn.onpointerup = pn.onpointercancel = (e) => { if (e.pointerId in ptr) { off(ptr[e.pointerId]); delete ptr[e.pointerId]; } };
      OS.wm.keys(win, (e) => { if (e.repeat) return; const i = KEYS.indexOf(e.key.toLowerCase()); if (i >= 0) { e.preventDefault(); on(i); } });
      const ku = (e) => { const i = KEYS.indexOf(e.key.toLowerCase()); if (i >= 0) off(i); }; document.addEventListener('keyup', ku); win.onClose(() => { document.removeEventListener('keyup', ku); Object.keys(active).forEach(off); });
      win.body.querySelectorAll('[data-w]').forEach((b) => (b.onclick = () => { wave = b.dataset.w; win.body.querySelectorAll('[data-w]').forEach((x) => x.classList.toggle('on', x === b)); }));
      win.body.querySelectorAll('[data-o]').forEach((b) => (b.onclick = () => { octave = OS.clamp(octave + +b.dataset.o, 1, 7); win.body.querySelector('[data-oct]').textContent = 'Octave ' + octave; }));
    },
  });
})();
