/* Cirrus Linux — Sprout: visual block programming */
(function () {
  'use strict';
  const esc = OS.esc, gl = OS.glyph;
  const CATS = { Events: '#e8a400', Motion: '#3b82f6', Looks: '#8b5cf6', Sound: '#d946ef', Control: '#f08c00', Sensing: '#0ea5c6', Operators: '#22a855', Variables: '#f0681a', Pen: '#0d9488' };
  const KEYS = ['space', 'up arrow', 'down arrow', 'left arrow', 'right arrow', 'any', ...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')];
  const SOUNDS = ['pop', 'boing', 'laser', 'coin', 'jump', 'drum', 'chime', 'oops'];
  const BACKDROPS = { sky: 'linear-gradient(#8fd3ff,#e6f6ff)', night: 'linear-gradient(#0b1030,#2a2060)', grass: 'linear-gradient(#9be7ff 0 65%,#5cc25c 65%)', sunset: 'linear-gradient(#ff7e5f,#feb47b)', space: 'radial-gradient(circle at 30% 30%,#2a2a6a,#05050f)', ocean: 'linear-gradient(#4fc3f7,#01579b)', desert: 'linear-gradient(#ffe0a3 0 60%,#e8b86b 60%)', white: '#ffffff' };
  const EMOJI = ['🌱', '🐱', '🐶', '🐸', '🐟', '🐢', '🦊', '🐼', '🐧', '🦋', '🐝', '🦄', '🐉', '👾', '🤖', '👻', '🚀', '🛸', '✈️', '🚗', '⭐', '🌟', '🌙', '☀️', '⚽', '🏀', '🍎', '🍕', '🍩', '💎', '❤️', '🎈', '🎁', '🔥', '💧', '🌸', '🌳', '🏠', '🧱', '🪙', '🎯', '🦖'];
  // spec: [cat, type, text, defaults]
  const S = {
    ev_flag: ['Events', 'hat', 'when ▶ clicked'], ev_key: ['Events', 'hat', 'when %k key pressed', ['space']], ev_click: ['Events', 'hat', 'when this sprite clicked'], ev_recv: ['Events', 'hat', 'when I receive %m', ['go']], ev_bcast: ['Events', 'stack', 'broadcast %m', ['go']], ev_bcastw: ['Events', 'stack', 'broadcast %m and wait', ['go']],
    mv_move: ['Motion', 'stack', 'move %n steps', [10]], mv_turnr: ['Motion', 'stack', 'turn ↻ %n degrees', [15]], mv_turnl: ['Motion', 'stack', 'turn ↺ %n degrees', [15]], mv_goto: ['Motion', 'stack', 'go to x: %n y: %n', [0, 0]], mv_rand: ['Motion', 'stack', 'go to random position'], mv_mouse: ['Motion', 'stack', 'go to mouse pointer'], mv_glide: ['Motion', 'stack', 'glide %n secs to x: %n y: %n', [1, 0, 0]], mv_point: ['Motion', 'stack', 'point in direction %n', [90]], mv_towards: ['Motion', 'stack', 'point towards mouse'], mv_cx: ['Motion', 'stack', 'change x by %n', [10]], mv_sx: ['Motion', 'stack', 'set x to %n', [0]], mv_cy: ['Motion', 'stack', 'change y by %n', [10]], mv_sy: ['Motion', 'stack', 'set y to %n', [0]], mv_bounce: ['Motion', 'stack', 'if on edge, bounce'], mv_rot: ['Motion', 'stack', 'set rotation style %d:all around|left-right|don\'t rotate', ['left-right']], r_x: ['Motion', 'reporter', 'x position'], r_y: ['Motion', 'reporter', 'y position'], r_dir: ['Motion', 'reporter', 'direction'],
    lk_sayfor: ['Looks', 'stack', 'say %s for %n seconds', ['Hello!', 2]], lk_say: ['Looks', 'stack', 'say %s', ['Hello!']], lk_thinkfor: ['Looks', 'stack', 'think %s for %n seconds', ['Hmm…', 2]], lk_think: ['Looks', 'stack', 'think %s', ['Hmm…']], lk_cost: ['Looks', 'stack', 'switch costume to %o'], lk_next: ['Looks', 'stack', 'next costume'], lk_back: ['Looks', 'stack', 'switch backdrop to %d:' + Object.keys(BACKDROPS).join('|'), ['sky']], lk_csize: ['Looks', 'stack', 'change size by %n', [10]], lk_ssize: ['Looks', 'stack', 'set size to %n %', [100]], lk_ceff: ['Looks', 'stack', 'change %d:color|ghost|spin effect by %n', ['color', 25]], lk_seff: ['Looks', 'stack', 'set %d:color|ghost|spin effect to %n', ['ghost', 50]], lk_clear: ['Looks', 'stack', 'clear graphic effects'], lk_show: ['Looks', 'stack', 'show'], lk_hide: ['Looks', 'stack', 'hide'], lk_front: ['Looks', 'stack', 'go to front layer'], r_size: ['Looks', 'reporter', 'size'], r_cnum: ['Looks', 'reporter', 'costume number'],
    sd_play: ['Sound', 'stack', 'start sound %d:' + SOUNDS.join('|'), ['pop']], sd_playw: ['Sound', 'stack', 'play sound %d:' + SOUNDS.join('|') + ' until done', ['coin']], sd_note: ['Sound', 'stack', 'play note %n for %n beats', [60, 0.5]], sd_drum: ['Sound', 'stack', 'play drum %d:kick|snare|hat|clap for %n beats', ['kick', 0.25]], sd_vol: ['Sound', 'stack', 'set volume to %n %', [100]], sd_tempo: ['Sound', 'stack', 'set tempo to %n bpm', [120]], sd_say: ['Sound', 'stack', 'speak %s', ['Hello there!']],
    ct_wait: ['Control', 'stack', 'wait %n seconds', [1]], ct_repeat: ['Control', 'c', 'repeat %n', [10]], ct_forever: ['Control', 'c-cap', 'forever'], ct_if: ['Control', 'c', 'if %b then'], ct_ifelse: ['Control', 'c2', 'if %b then'], ct_waitu: ['Control', 'stack', 'wait until %b'], ct_until: ['Control', 'c', 'repeat until %b'], ct_stop: ['Control', 'cap', 'stop %d:all|this script|other scripts in sprite', ['all']], ct_cloneh: ['Control', 'hat', 'when I start as a clone'], ct_clone: ['Control', 'stack', 'create clone of myself'], ct_delc: ['Control', 'cap', 'delete this clone'],
    sn_touch: ['Sensing', 'boolean', 'touching %t ?', ['mouse-pointer']], sn_key: ['Sensing', 'boolean', 'key %k pressed?', ['space']], sn_mdown: ['Sensing', 'boolean', 'mouse down?'], r_mx: ['Sensing', 'reporter', 'mouse x'], r_my: ['Sensing', 'reporter', 'mouse y'], sn_ask: ['Sensing', 'stack', 'ask %s and wait', ["What's your name?"]], r_ans: ['Sensing', 'reporter', 'answer'], r_timer: ['Sensing', 'reporter', 'timer'], sn_rtimer: ['Sensing', 'stack', 'reset timer'], r_dist: ['Sensing', 'reporter', 'distance to mouse-pointer'], r_year: ['Sensing', 'reporter', 'current %d:year|month|date|hour|minute|second', ['hour']],
    op_add: ['Operators', 'reporter', '%n + %n', ['', '']], op_sub: ['Operators', 'reporter', '%n − %n', ['', '']], op_mul: ['Operators', 'reporter', '%n × %n', ['', '']], op_div: ['Operators', 'reporter', '%n ÷ %n', ['', '']], op_rand: ['Operators', 'reporter', 'pick random %n to %n', [1, 10]], op_gt: ['Operators', 'boolean', '%s > %s', ['', 50]], op_lt: ['Operators', 'boolean', '%s < %s', ['', 50]], op_eq: ['Operators', 'boolean', '%s = %s', ['', 50]], op_and: ['Operators', 'boolean', '%b and %b'], op_or: ['Operators', 'boolean', '%b or %b'], op_not: ['Operators', 'boolean', 'not %b'], op_join: ['Operators', 'reporter', 'join %s %s', ['apple ', 'banana']], op_letter: ['Operators', 'reporter', 'letter %n of %s', [1, 'apple']], op_len: ['Operators', 'reporter', 'length of %s', ['apple']], op_mod: ['Operators', 'reporter', '%n mod %n', ['', '']], op_round: ['Operators', 'reporter', 'round %n', ['']], op_math: ['Operators', 'reporter', '%d:abs|sqrt|floor|ceiling|sin|cos|tan of %n', ['sqrt', 9]],
    vr_set: ['Variables', 'stack', 'set %v to %s', ['', 0]], vr_change: ['Variables', 'stack', 'change %v by %n', ['', 1]], vr_show: ['Variables', 'stack', 'show variable %v'], vr_hide: ['Variables', 'stack', 'hide variable %v'], vr_get: ['Variables', 'reporter', '%V'],
    pn_clear: ['Pen', 'stack', 'erase all'], pn_stamp: ['Pen', 'stack', 'stamp'], pn_down: ['Pen', 'stack', 'pen down'], pn_up: ['Pen', 'stack', 'pen up'], pn_color: ['Pen', 'stack', 'set pen color to %c', ['#3b82f6']], pn_chue: ['Pen', 'stack', 'change pen color by %n', [10]], pn_size: ['Pen', 'stack', 'set pen size to %n', [3]], pn_csize: ['Pen', 'stack', 'change pen size by %n', [1]],
  };
  const isC = (t) => t === 'c' || t === 'c2' || t === 'c-cap';
  const mk = (op, args) => { const sp = S[op]; const n = (sp[2].match(/%[a-zA-Z]/g) || []).length; const d = sp[3] || []; return { op, args: args || Array.from({ length: n }, (_, i) => (d[i] !== undefined ? d[i] : '')), next: null, sub: null, sub2: null }; };
  const chain = (...bs) => { for (let i = 0; i < bs.length - 1; i++) bs[i].next = bs[i + 1]; return bs[0]; };
  const uid = () => Math.random().toString(36).slice(2, 8);
  function demoProject() {
    const sp = { id: uid(), name: 'Sprig', costumes: ['🌱', '🌿', '🌳'], c: 0, x: -60, y: -40, dir: 90, size: 100, visible: true, rot: 'left-right', scripts: [] };
    const st = { id: uid(), name: 'Star', costumes: ['⭐', '🌟'], c: 0, x: 120, y: 90, dir: 90, size: 80, visible: true, rot: 'all', scripts: [] };
    const f = mk('ev_flag'); const say = mk('lk_sayfor', ["Hi! I'm Sprig. Drag blocks to program me!", 2]); const fo = mk('ct_forever'); fo.sub = chain(mk('mv_move', [4]), mk('mv_bounce'), mk('lk_next'), mk('ct_wait', [0.15])); chain(f, mk('mv_goto', [-60, -40]), mk('vr_set', ['score', 0]), say, fo);
    sp.scripts.push({ x: 20, y: 20, top: f });
    const c = mk('ev_click'); chain(c, mk('vr_change', ['score', 1]), mk('sd_play', ['coin']), mk('mv_rand'), mk('lk_csize', [10]));
    const f2 = mk('ev_flag'); const fo2 = mk('ct_forever'); fo2.sub = mk('mv_turnr', [3]); chain(f2, mk('lk_ssize', [80]), mk('vr_show', ['score']), fo2);
    st.scripts.push({ x: 20, y: 20, top: c }, { x: 20, y: 200, top: f2 });
    return { v: 1, name: 'My first project', sprites: [sp, st], backdrop: 'sky', vars: { score: 0 }, cur: sp.id };
  }

  OS.registerApp({
    id: 'sprout', name: 'Sprout', icon: 'blocks', color: ['#22c55e', '#0d9488'], cat: 'Development', w: 1120, h: 720, desc: 'Visual block programming', keywords: 'scratch blocks coding programming kids games animation visual',
    launch(win, args) {
      let proj = demoProject(), path = null, dirty = false, cat = 'Events', mtab = 'code', running = [], raf = 0, keysDown = new Set(), mouse = { x: 0, y: 0, down: false }, timerStart = performance.now(), answer = '', asking = null, penCv = null, penG = null, clones = [], volume = 1, tempo = 120, shownVars = new Set(['score']);
      win.body.innerHTML = `<div class="sp">
        <div class="toolbar sp-tb"><button class="ibtn" data-a="menu">${gl('menu')}</button><input class="inp sp-name" spellcheck="false"><span class="grow"></span><div class="seg sp-mtabs"><button data-t="code">Code</button><button data-t="stage">Stage</button></div><button class="sp-go" data-a="go" title="Start (▶)">${gl('play')}</button><button class="sp-stop" data-a="stop" title="Stop">${gl('square')}</button></div>
        <div class="sp-main"><div class="sp-cats"></div><div class="sp-palette"></div><div class="sp-ws"><div class="sp-canvas"></div><div class="sp-trash">${gl('trash')}</div></div>
          <div class="sp-right"><div class="sp-stagebox"><div class="sp-stage"><canvas width="480" height="360"></canvas><div class="sp-overlay"></div></div></div><div class="sp-pad"></div><div class="sp-sprites"></div></div></div>
      </div>`;
      const $ = (s) => win.body.querySelector(s), ws = $('.sp-ws'), canvas = $('.sp-canvas'), pal = $('.sp-palette'), stageCv = $('.sp-stage canvas'), G = stageCv.getContext('2d'), overlay = $('.sp-overlay');
      penCv = document.createElement('canvas'); penCv.width = 480; penCv.height = 360; penG = penCv.getContext('2d'); penG.lineCap = 'round';
      const cur = () => proj.sprites.find((s) => s.id === proj.cur) || proj.sprites[0];
      const title = () => win.setTitle(`${dirty ? '• ' : ''}${proj.name} — Sprout`);
      const touch = () => { if (!dirty) { dirty = true; title(); } };
      /* ---------- rendering blocks ---------- */
      const varNames = () => Object.keys(proj.vars);
      function slotEl(b, ai, kind, opt, inPalette) {
        const v = b.args[ai];
        const wrap = document.createElement('span'); wrap.className = 'sb-slot'; wrap._owner = b; wrap._ai = ai; wrap._kind = kind;
        if (v && typeof v === 'object') { wrap.appendChild(blockEl(v, inPalette)); return wrap; }
        let inp;
        const sel = (opts, val) => { const s = document.createElement('select'); s.className = 'sb-in sb-sel'; s.innerHTML = opts.map((o) => `<option ${String(o) === String(val) ? 'selected' : ''}>${esc(o)}</option>`).join(''); return s; };
        if (kind === 'b') { wrap.classList.add('sb-boolslot'); return wrap; }
        if (kind === 'n' || kind === 's') { inp = document.createElement('input'); inp.className = 'sb-in' + (kind === 'n' ? ' num' : ''); inp.value = v; inp.size = Math.max(2, String(v).length + 1); if (kind === 'n') inp.inputMode = 'decimal'; inp.spellcheck = false; inp.oninput = () => { inp.size = Math.max(2, inp.value.length + 1); b.args[ai] = inp.value; touch(); }; }
        else if (kind === 'k') inp = sel(KEYS, v);
        else if (kind === 'm') { inp = document.createElement('input'); inp.className = 'sb-in'; inp.value = v; inp.size = Math.max(3, String(v).length + 1); inp.oninput = () => { b.args[ai] = inp.value; touch(); }; }
        else if (kind === 'v' || kind === 'V') { if (kind === 'V') { const t = document.createElement('span'); t.className = 'sb-varname'; t.textContent = v; wrap.appendChild(t); return wrap; } inp = sel(varNames().length ? varNames() : ['my variable'], v); if (!v && varNames()[0]) b.args[ai] = varNames()[0]; }
        else if (kind === 'c') { inp = document.createElement('input'); inp.type = 'color'; inp.className = 'sb-color'; inp.value = v || '#3b82f6'; }
        else if (kind === 'o') inp = sel(cur().costumes.map((c, i) => `${i + 1}: ${c}`), typeof v === 'number' || /^\d/.test(v) ? `${parseInt(v) || 1}: ${cur().costumes[(parseInt(v) || 1) - 1] || ''}` : v);
        else if (kind === 't') inp = sel(['mouse-pointer', 'edge', ...proj.sprites.filter((s) => s !== cur()).map((s) => s.name)], v);
        else if (kind === 'd') inp = sel(opt, v || opt[0]);
        if (inp.tagName === 'SELECT' || inp.type === 'color') inp.onchange = () => { b.args[ai] = kind === 'o' ? parseInt(inp.value) : inp.value; touch(); };
        inp.addEventListener('pointerdown', (e) => e.stopPropagation());
        wrap.appendChild(inp); return wrap;
      }
      function headerEls(b, row, text, inPalette) {
        let ai = 0;
        text.split(/(%[a-zA-Z](?::[^ ]+)?)/).forEach((tok) => {
          if (!tok) return;
          const m = /^%([a-zA-Z])(?::(.+))?$/.exec(tok);
          if (m) { row.appendChild(slotEl(b, ai, m[1], m[2] ? m[2].split('|') : null, inPalette)); ai++; }
          else tok.split(/( ?\/ ?)/).forEach((t) => { if (t.trim()) { const s = document.createElement('span'); s.textContent = t.trim(); row.appendChild(s); } });
        });
      }
      function blockEl(b, inPalette) {
        const sp = S[b.op]; if (!sp) { const d = document.createElement('div'); d.textContent = '?'; return d; }
        const [c, type, text] = sp; const el = document.createElement('div'); el.className = `sb sb-${type}`; el.style.setProperty('--c', CATS[c]); el._b = b;
        const row = document.createElement('div'); row.className = 'sb-row'; headerEls(b, row, text, inPalette); el.appendChild(row);
        if (isC(type)) {
          const m1 = document.createElement('div'); m1.className = 'sb-mouth'; m1._b = b; m1._k = 'sub'; chainEls(b.sub, m1, inPalette); el.appendChild(m1);
          if (type === 'c2') { const r2 = document.createElement('div'); r2.className = 'sb-row'; r2.innerHTML = '<span>else</span>'; el.appendChild(r2); const m2 = document.createElement('div'); m2.className = 'sb-mouth'; m2._b = b; m2._k = 'sub2'; chainEls(b.sub2, m2, inPalette); el.appendChild(m2); }
          const ft = document.createElement('div'); ft.className = 'sb-foot'; el.appendChild(ft);
        }
        return el;
      }
      function chainEls(b, host, inPalette) { while (b) { host.appendChild(blockEl(b, inPalette)); b = b.next; } }
      function renderWS() {
        canvas.innerHTML = '';
        cur().scripts.forEach((s) => { const d = document.createElement('div'); d.className = 'sb-script'; d.style.left = s.x + 'px'; d.style.top = s.y + 'px'; d._s = s; chainEls(s.top, d); canvas.appendChild(d); });
        const maxX = Math.max(800, ...cur().scripts.map((s) => s.x + 500)), maxY = Math.max(600, ...cur().scripts.map((s) => s.y + 600)); canvas.style.width = maxX + 'px'; canvas.style.height = maxY + 'px';
      }
      function renderCats() { $('.sp-cats').innerHTML = Object.entries(CATS).map(([n, c]) => `<button class="sp-cat ${n === cat ? 'on' : ''}" data-c="${n}"><i style="background:${c}"></i>${n}</button>`).join(''); win.body.querySelectorAll('.sp-cat').forEach((b) => (b.onclick = () => { cat = b.dataset.c; renderCats(); renderPalette(); })); }
      function renderPalette() {
        pal.innerHTML = `<div class="sp-phead" style="color:${CATS[cat]}">${cat}</div>`;
        if (cat === 'Variables') { const btn = OS.el(`<button class="btn sm" style="margin:4px 8px 8px">${gl('plus')}Make a variable</button>`); btn.onclick = async () => { const n = await OS.prompt('New variable', 'Variable name:', ''); if (n && n.trim() && !(n in proj.vars)) { proj.vars[n.trim()] = 0; shownVars.add(n.trim()); touch(); renderPalette(); } }; pal.appendChild(btn); varNames().forEach((v) => addPal(mk('vr_get', [v]), v)); }
        Object.entries(S).filter(([op, sp]) => sp[0] === cat && op !== 'vr_get').forEach(([op]) => addPal(mk(op)));
        if (cat === 'Variables' && varNames().length) pal.appendChild(OS.el('<div class="small muted" style="padding:6px 10px">Right-click a variable to rename or delete it.</div>'));
      }
      function addPal(b, varName) { const el = blockEl(b, true); el.classList.add('sb-pal'); const w = document.createElement('div'); w.className = 'sp-palitem'; w.appendChild(el); pal.appendChild(w); el._pal = true;
        if (varName) OS.onContext(el, (e, x, y) => OS.menu(x, y, [{ label: shownVars.has(varName) ? 'Hide on stage' : 'Show on stage', icon: 'eye', action: () => { shownVars.has(varName) ? shownVars.delete(varName) : shownVars.add(varName); } }, { label: 'Rename…', icon: 'edit', action: async () => { const n = await OS.prompt('Rename variable', '', varName); if (n && n !== varName) { proj.vars[n] = proj.vars[varName]; delete proj.vars[varName]; const walk = (bb) => { if (!bb) return; if (/^vr_/.test(bb.op) && bb.args[0] === varName) bb.args[0] = n; bb.args.forEach((a) => a && typeof a === 'object' && walk(a)); walk(bb.next); walk(bb.sub); walk(bb.sub2); }; proj.sprites.forEach((s) => s.scripts.forEach((sc) => walk(sc.top))); touch(); renderPalette(); renderWS(); } } }, { label: 'Delete', icon: 'trash', danger: true, action: () => { delete proj.vars[varName]; touch(); renderPalette(); } }])); }
      /* ---------- model helpers ---------- */
      function findParent(t) {
        for (const s of cur().scripts) { if (s.top === t) return { s, kind: 'top' }; const r = walkP(s.top, t); if (r) return r; }
        return null;
      }
      function walkP(b, t) { if (!b) return null; if (b.next === t) return { b, kind: 'next' }; if (b.sub === t) return { b, kind: 'sub' }; if (b.sub2 === t) return { b, kind: 'sub2' }; for (let i = 0; i < b.args.length; i++) { const a = b.args[i]; if (a === t) return { b, kind: 'arg', i }; if (a && typeof a === 'object') { const r = walkP(a, t); if (r) return r; } } return walkP(b.next, t) || walkP(b.sub, t) || walkP(b.sub2, t); }
      const lastOf = (b) => { while (b.next) b = b.next; return b; };
      const isReporter = (b) => ['reporter', 'boolean'].includes(S[b.op][1]);
      function detach(b) {
        const p = findParent(b); if (!p) return;
        if (p.kind === 'top') cur().scripts.splice(cur().scripts.indexOf(p.s), 1);
        else if (p.kind === 'arg') { const d = S[p.b.op][3] || []; p.b.args[p.i] = d[p.i] !== undefined ? d[p.i] : ''; }
        else p.b[p.kind] = null;
      }
      /* ---------- drag & drop ---------- */
      let drag = null;
      function beginDrag(b, el, e, fromPal) {
        const r = el.getBoundingClientRect();
        if (fromPal) b = JSON.parse(JSON.stringify(b)); else detach(b);
        if (!fromPal) renderWS();
        const ghost = document.createElement('div'); ghost.className = 'sb-drag'; chainEls(isReporter(b) ? Object.assign({}, b, { next: null }) : b, ghost); if (isReporter(b)) { ghost.innerHTML = ''; ghost.appendChild(blockEl(b)); }
        document.body.appendChild(ghost);
        drag = { b, ghost, dx: e.clientX - r.left, dy: e.clientY - r.top, target: null };
        moveDrag(e);
      }
      function candidates() {
        const out = []; const b = drag.b; const rep = isReporter(b); const hat = S[b.op][1] === 'hat'; const endsCap = ['cap', 'c-cap'].includes(S[lastOf(b).op][1]);
        if (rep) { canvas.querySelectorAll('.sb-slot').forEach((sl) => { if (sl.querySelector('.sb')) return; if (sl._kind === 'b' && S[b.op][1] !== 'boolean') return; if (!['n', 's', 'b'].includes(sl._kind)) return; const r = sl.getBoundingClientRect(); out.push({ x: r.left, y: r.top + r.height / 2, act: () => { sl._owner.args[sl._ai] = b; }, el: sl, kind: 'slot' }); }); return out; }
        canvas.querySelectorAll('.sb').forEach((el) => {
          const bb = el._b, t = S[bb.op][1]; if (isReporter(bb)) return;
          const r = el.getBoundingClientRect();
          if (!hat && !['cap', 'c-cap'].includes(t) && !(endsCap && bb.next)) out.push({ x: r.left, y: r.bottom, act: () => { lastOf(b).next = bb.next; bb.next = b; }, el, kind: 'after' });
          if (!hat && isC(t)) el.querySelectorAll(':scope > .sb-mouth').forEach((m) => { const mr = m.getBoundingClientRect(); if (endsCap && bb[m._k]) return; out.push({ x: mr.left + 2, y: mr.top, act: () => { lastOf(b).next = bb[m._k]; bb[m._k] = b; }, el: m, kind: 'mouth' }); });
        });
        if (!endsCap) canvas.querySelectorAll('.sb-script').forEach((sd) => { const s = sd._s; if (S[s.top.op][1] === 'hat') return; const r = sd.getBoundingClientRect(); out.push({ x: r.left, y: r.top - drag.ghost.offsetHeight, act: () => { lastOf(b).next = s.top; s.top = b; s.y -= drag.ghost.offsetHeight / zoomK(); }, el: sd, kind: 'before' }); });
        return out;
      }
      const zoomK = () => 1;
      let marker = null;
      function moveDrag(e) {
        const gx = e.clientX - drag.dx, gy = e.clientY - drag.dy; drag.ghost.style.left = gx + 'px'; drag.ghost.style.top = gy + 'px';
        const tr = $('.sp-trash'); const overPal = pointIn(e, pal) || pointIn(e, $('.sp-cats')); tr.classList.toggle('on', overPal); drag.overPal = overPal;
        let best = null, bd = 34; const rep = isReporter(drag.b);
        if (!overPal && pointIn(e, ws)) candidates().forEach((c) => { const d = Math.hypot(c.x - gx, c.y - (rep ? gy + drag.ghost.offsetHeight / 2 : gy)); if (d < bd) { bd = d; best = c; } });
        drag.target = best;
        if (marker) { marker.remove(); marker = null; }
        if (best) { marker = document.createElement('div'); marker.className = 'sb-marker ' + best.kind; const wr = canvas.getBoundingClientRect(); if (best.kind === 'slot') { const r = best.el.getBoundingClientRect(); Object.assign(marker.style, { left: r.left - wr.left - 3 + 'px', top: r.top - wr.top - 3 + 'px', width: r.width + 6 + 'px', height: r.height + 6 + 'px' }); } else Object.assign(marker.style, { left: best.x - wr.left + 'px', top: best.y - wr.top - 2 + 'px', width: Math.min(220, drag.ghost.offsetWidth) + 'px' }); canvas.appendChild(marker); }
      }
      const pointIn = (e, el) => { const r = el.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom && el.offsetParent !== null; };
      function endDrag(e) {
        if (!drag) return; const d = drag; drag = null; if (marker) { marker.remove(); marker = null; } $('.sp-trash').classList.remove('on'); d.ghost.remove();
        if (d.overPal) { renderWS(); touch(); return; }
        if (d.target) d.target.act();
        else if (pointIn(e, ws) || !isReporter(d.b)) { const wr = canvas.getBoundingClientRect(); cur().scripts.push({ x: Math.max(0, Math.round(e.clientX - d.dx - wr.left)), y: Math.max(0, Math.round(e.clientY - d.dy - wr.top)), top: d.b }); }
        renderWS(); touch();
      }
      // pointer handling for blocks (workspace + palette)
      let pend = null;
      win.body.addEventListener('pointerdown', (e) => {
        if (drag) return; const el = e.target.closest('.sb'); if (!el || e.target.closest('input,select')) return; if (!el.closest('.sp-canvas') && !el._pal && !el.closest('.sp-palitem')) return;
        const fromPal = !!el.closest('.sp-palette'); const top = fromPal ? el.closest('.sp-palitem').firstElementChild : el;
        pend = { el: top, b: top._b, x: e.clientX, y: e.clientY, fromPal, id: e.pointerId, touch: e.pointerType !== 'mouse', t: setTimeout(() => { if (pend && pend.touch) { const p = pend; pend = null; beginDrag(p.b, p.el, Object.assign({}, { clientX: p.x, clientY: p.y }), p.fromPal); if (navigator.vibrate) navigator.vibrate(10); } }, 260) };
        if (!fromPal) { e.preventDefault(); }
      });
      document.addEventListener('pointermove', onMove, { passive: false });
      function onMove(e) {
        if (drag) { e.preventDefault(); moveDrag(e); return; }
        if (!pend || e.pointerId !== pend.id) return; const dx = e.clientX - pend.x, dy = e.clientY - pend.y;
        if (Math.hypot(dx, dy) > 6) { const p = pend; if (p.fromPal && p.touch && Math.abs(dy) > Math.abs(dx)) { clearTimeout(p.t); pend = null; return; } clearTimeout(p.t); pend = null; beginDrag(p.b, p.el, e, p.fromPal); }
      }
      const onUp = (e) => { if (pend) { clearTimeout(pend.t); const p = pend; pend = null; if (!p.fromPal && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6) runScriptOf(p.b); else if (p.fromPal && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6) runSingle(p.b); } if (drag) endDrag(e); };
      document.addEventListener('pointerup', onUp); document.addEventListener('pointercancel', (e) => { if (pend && e.pointerId === pend.id) { clearTimeout(pend.t); pend = null; } });
      win.onClose(() => { document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); });
      OS.onContext(ws, (e, x, y) => { const el = e.target.closest('.sb'); if (el && el.closest('.sp-canvas')) { const b = el._b; OS.menu(x, y, [{ label: 'Duplicate', icon: 'copy', action: () => { const c = JSON.parse(JSON.stringify(b)); const r = el.getBoundingClientRect(), wr = canvas.getBoundingClientRect(); cur().scripts.push({ x: r.left - wr.left + 30, y: r.top - wr.top + 30, top: c }); renderWS(); touch(); } }, { label: 'Delete block', icon: 'trash', danger: true, action: () => { const nx = !isReporter(b) ? b.next : null; const p = findParent(b); detach(b); if (nx && p) { if (p.kind === 'top') cur().scripts.push({ x: p.s.x, y: p.s.y, top: nx }); else if (p.kind !== 'arg') p.b[p.kind] = nx; } renderWS(); touch(); } }]); } else OS.menu(x, y, [{ label: 'Clean up blocks', icon: 'list', action: () => { let y2 = 20; cur().scripts.forEach((s) => { s.x = 20; s.y = y2; y2 += countH(s.top) * 34 + 40; }); renderWS(); touch(); } }, { label: 'Add comment-free example', icon: 'star', action: () => { const f = mk('ev_flag'); const r = mk('ct_repeat', [36]); r.sub = chain(mk('mv_move', [10]), mk('mv_turnr', [10])); chain(f, mk('pn_clear'), mk('pn_down'), r, mk('pn_up')); cur().scripts.push({ x: 40, y: 40 + cur().scripts.length * 30, top: f }); renderWS(); touch(); } }]); });
      const countH = (b) => { let n = 0; while (b) { n += 1 + (b.sub ? countH(b.sub) : 0) + (b.sub2 ? countH(b.sub2) + 1 : 0) + (isC(S[b.op][1]) ? 1 : 0); b = b.next; } return n; };
      /* ---------- runtime ---------- */
      const W = 480, H = 360;
      const allSprites = () => [...proj.sprites, ...clones];
      const sndPlay = (name, wait) => { const A = OS.audio(); if (!A) return 0; const t = A.currentTime, o = A.createGain(); o.gain.value = 0.4 * volume; o.connect(A.destination); const T = (type, f0, f1, d, a = 0.005, st = 0) => { const x = A.createOscillator(); x.type = type; x.frequency.setValueAtTime(f0, t + st); x.frequency.exponentialRampToValueAtTime(f1, t + st + d); const g = A.createGain(); g.gain.setValueAtTime(0.0001, t + st); g.gain.exponentialRampToValueAtTime(1, t + st + a); g.gain.exponentialRampToValueAtTime(0.0001, t + st + d); x.connect(g).connect(o); x.start(t + st); x.stop(t + st + d + 0.05); };
        const N = (d, f) => { const b = A.createBuffer(1, A.sampleRate * d, A.sampleRate), c = b.getChannelData(0); for (let i = 0; i < c.length; i++) c[i] = (Math.random() * 2 - 1) * (1 - i / c.length); const s = A.createBufferSource(); s.buffer = b; const fl = A.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = f; s.connect(fl).connect(o); s.start(t); };
        const L = { pop: () => (T('sine', 900, 300, 0.08), 0.1), boing: () => (T('sine', 200, 700, 0.35), 0.4), laser: () => (T('square', 1800, 120, 0.3), 0.3), coin: () => (T('square', 988, 988, 0.08), T('square', 1319, 1319, 0.3, 0.005, 0.08), 0.4), jump: () => (T('square', 300, 900, 0.18), 0.2), drum: () => (T('sine', 150, 50, 0.3), 0.3), chime: () => ([523, 659, 784].forEach((f, i) => T('sine', f, f, 0.6, 0.005, i * 0.1)), 0.9), oops: () => (T('sawtooth', 400, 150, 0.4), 0.45), kick: () => (T('sine', 150, 45, 0.3), 0.3), snare: () => (N(0.2, 1500), 0.2), hat: () => (N(0.05, 7000), 0.05), clap: () => (N(0.15, 1000), 0.15) };
        return (L[name] || L.pop)(); };
      const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
      const now = () => performance.now();
      const radius = (s) => 26 * s.size / 100;
      function touching(s, what) {
        if (what === 'mouse-pointer') return Math.hypot(s.x - mouse.x, s.y - mouse.y) < radius(s);
        if (what === 'edge') return Math.abs(s.x) + radius(s) * 0.8 > W / 2 || Math.abs(s.y) + radius(s) * 0.8 > H / 2;
        return allSprites().some((o) => o !== s && o.visible && (o.name === what || o.parent === what) && Math.hypot(s.x - o.x, s.y - o.y) < radius(s) * 0.8 + radius(o) * 0.8);
      }
      function evalArg(a, s) {
        if (!a || typeof a !== 'object') return a;
        const A = a.args.map((x) => (x && typeof x === 'object' ? evalArg(x, s) : x));
        switch (a.op) {
          case 'r_x': return Math.round(s.x * 100) / 100; case 'r_y': return Math.round(s.y * 100) / 100; case 'r_dir': return s.dir; case 'r_size': return Math.round(s.size); case 'r_cnum': return s.c + 1;
          case 'r_mx': return Math.round(mouse.x); case 'r_my': return Math.round(mouse.y); case 'r_ans': return answer; case 'r_timer': return Math.round((now() - timerStart) / 100) / 10; case 'r_dist': return Math.round(Math.hypot(s.x - mouse.x, s.y - mouse.y));
          case 'r_year': { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() + 1, date: d.getDate(), hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() }[A[0]]; }
          case 'sn_touch': return touching(s, A[0]); case 'sn_key': return A[0] === 'any' ? keysDown.size > 0 : keysDown.has(A[0]); case 'sn_mdown': return mouse.down;
          case 'op_add': return num(A[0]) + num(A[1]); case 'op_sub': return num(A[0]) - num(A[1]); case 'op_mul': return num(A[0]) * num(A[1]); case 'op_div': return num(A[1]) === 0 ? Infinity : num(A[0]) / num(A[1]);
          case 'op_rand': { const lo = num(A[0]), hi = num(A[1]); const [a2, b2] = lo < hi ? [lo, hi] : [hi, lo]; return Number.isInteger(a2) && Number.isInteger(b2) && !String(A[0]).includes('.') && !String(A[1]).includes('.') ? a2 + Math.floor(Math.random() * (b2 - a2 + 1)) : a2 + Math.random() * (b2 - a2); }
          case 'op_gt': return cmp(A[0], A[1]) > 0; case 'op_lt': return cmp(A[0], A[1]) < 0; case 'op_eq': return cmp(A[0], A[1]) === 0;
          case 'op_and': return !!A[0] && !!A[1]; case 'op_or': return !!A[0] || !!A[1]; case 'op_not': return !A[0];
          case 'op_join': return String(A[0]) + String(A[1]); case 'op_letter': return String(A[1]).charAt(num(A[0]) - 1); case 'op_len': return String(A[0]).length;
          case 'op_mod': { const n = num(A[1]); return n ? ((num(A[0]) % n) + n) % n : NaN; } case 'op_round': return Math.round(num(A[0]));
          case 'op_math': { const x = num(A[1]); return +({ abs: Math.abs(x), sqrt: Math.sqrt(x), floor: Math.floor(x), ceiling: Math.ceil(x), sin: Math.sin(x * Math.PI / 180), cos: Math.cos(x * Math.PI / 180), tan: Math.tan(x * Math.PI / 180) }[A[0]]).toFixed(10); }
          case 'vr_get': return proj.vars[A[0]] ?? 0;
        }
        return '';
      }
      const cmp = (a, b) => { const x = parseFloat(a), y = parseFloat(b); if (!isNaN(x) && !isNaN(y) && String(a).trim() !== '' && String(b).trim() !== '') return x - y; return String(a).toLowerCase().localeCompare(String(b).toLowerCase()); };
      const fence = (s) => { const r = radius(s) * 0.5; s.x = OS.clamp(s.x, -W / 2 - r, W / 2 + r); s.y = OS.clamp(s.y, -H / 2 - r, H / 2 + r); };
      function penLine(s, x0, y0) { if (!s.pen) return; penG.strokeStyle = s.penColor; penG.lineWidth = s.penSize; penG.beginPath(); penG.moveTo(W / 2 + x0, H / 2 - y0); penG.lineTo(W / 2 + s.x, H / 2 - s.y); penG.stroke(); }
      const moveTo = (s, x, y) => { const x0 = s.x, y0 = s.y; s.x = x; s.y = y; fence(s); penLine(s, x0, y0); };
      function* waitSecs(sec) { const end = now() + sec * 1000; while (now() < end) yield; }
      function* runChain(b, s, th) { for (let c = b; c; c = c.next) { if (th.stop) return; yield* exec(c, s, th); } }
      function* exec(b, s, th) {
        const A = b.args.map((x) => (x && typeof x === 'object' ? evalArg(x, s) : x));
        switch (b.op) {
          case 'ev_bcast': broadcast(A[0]); break;
          case 'ev_bcastw': { const ts = broadcast(A[0]); while (ts.some((t) => !t.done)) yield; break; }
          case 'mv_move': { const r = (90 - s.dir) * Math.PI / 180; moveTo(s, s.x + num(A[0]) * Math.cos(r), s.y + num(A[0]) * Math.sin(r)); break; }
          case 'mv_turnr': s.dir = norm(s.dir + num(A[0])); break; case 'mv_turnl': s.dir = norm(s.dir - num(A[0])); break;
          case 'mv_goto': moveTo(s, num(A[0]), num(A[1])); break; case 'mv_rand': moveTo(s, (Math.random() - 0.5) * W, (Math.random() - 0.5) * H); break; case 'mv_mouse': moveTo(s, mouse.x, mouse.y); break;
          case 'mv_glide': { const x0 = s.x, y0 = s.y, t0 = now(), d = num(A[0]) * 1000; while (now() - t0 < d) { const k = (now() - t0) / d; moveTo(s, x0 + (num(A[1]) - x0) * k, y0 + (num(A[2]) - y0) * k); yield; } moveTo(s, num(A[1]), num(A[2])); break; }
          case 'mv_point': s.dir = norm(num(A[0])); break; case 'mv_towards': s.dir = norm(90 - Math.atan2(mouse.y - s.y, mouse.x - s.x) * 180 / Math.PI); break;
          case 'mv_cx': moveTo(s, s.x + num(A[0]), s.y); break; case 'mv_sx': moveTo(s, num(A[0]), s.y); break; case 'mv_cy': moveTo(s, s.x, s.y + num(A[0])); break; case 'mv_sy': moveTo(s, s.x, num(A[0])); break;
          case 'mv_bounce': { const r = radius(s) * 0.8; let dx = Math.sin(s.dir * Math.PI / 180), dy = Math.cos(s.dir * Math.PI / 180); if (s.x - r < -W / 2) { dx = Math.abs(dx); s.x = -W / 2 + r; } if (s.x + r > W / 2) { dx = -Math.abs(dx); s.x = W / 2 - r; } if (s.y - r < -H / 2) { dy = Math.abs(dy); s.y = -H / 2 + r; } if (s.y + r > H / 2) { dy = -Math.abs(dy); s.y = H / 2 - r; } s.dir = norm(Math.atan2(dx, dy) * 180 / Math.PI); break; }
          case 'mv_rot': s.rot = A[0]; break;
          case 'lk_sayfor': case 'lk_thinkfor': s.bubble = { t: String(A[0]), think: b.op === 'lk_thinkfor' }; yield* waitSecs(num(A[1])); s.bubble = null; break;
          case 'lk_say': case 'lk_think': s.bubble = String(A[0]) ? { t: String(A[0]), think: b.op === 'lk_think' } : null; break;
          case 'lk_cost': { const n = parseInt(A[0]); if (n) s.c = (n - 1) % s.costumes.length; break; } case 'lk_next': s.c = (s.c + 1) % s.costumes.length; break;
          case 'lk_back': proj.backdrop = A[0]; broadcast('backdrop:' + A[0]); break;
          case 'lk_csize': s.size = Math.max(5, s.size + num(A[0])); break; case 'lk_ssize': s.size = Math.max(5, num(A[0])); break;
          case 'lk_ceff': s.fx[A[0]] = (s.fx[A[0]] || 0) + num(A[1]); break; case 'lk_seff': s.fx[A[0]] = num(A[1]); break; case 'lk_clear': s.fx = {}; break;
          case 'lk_show': s.visible = true; break; case 'lk_hide': s.visible = false; break; case 'lk_front': { const L = s.isClone ? clones : proj.sprites; L.push(L.splice(L.indexOf(s), 1)[0]); break; }
          case 'sd_play': sndPlay(A[0]); break; case 'sd_playw': yield* waitSecs(sndPlay(A[0])); break;
          case 'sd_note': { const Au = OS.audio(); const d = num(A[1]) * 60 / tempo; if (Au) { const o = Au.createOscillator(), g = Au.createGain(); o.type = 'triangle'; o.frequency.value = 440 * 2 ** ((num(A[0]) - 69) / 12); g.gain.setValueAtTime(0.3 * volume, Au.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, Au.currentTime + d); o.connect(g).connect(Au.destination); o.start(); o.stop(Au.currentTime + d + 0.05); } yield* waitSecs(d); break; }
          case 'sd_drum': sndPlay(A[0]); yield* waitSecs(num(A[1]) * 60 / tempo); break;
          case 'sd_vol': volume = OS.clamp(num(A[0]), 0, 100) / 100; break; case 'sd_tempo': tempo = OS.clamp(num(A[0]), 20, 500); break;
          case 'sd_say': if (window.speechSynthesis) speechSynthesis.speak(new SpeechSynthesisUtterance(String(A[0]))); break;
          case 'ct_wait': yield* waitSecs(num(A[0])); break;
          case 'ct_repeat': { const n = Math.round(num(A[0])); for (let i = 0; i < n && !th.stop; i++) { yield* runChain(b.sub, s, th); yield; } break; }
          case 'ct_forever': while (!th.stop) { yield* runChain(b.sub, s, th); yield; } break;
          case 'ct_if': if (A[0]) yield* runChain(b.sub, s, th); break;
          case 'ct_ifelse': yield* runChain(A[0] ? b.sub : b.sub2, s, th); break;
          case 'ct_waitu': while (!evalArg(b.args[0], s) && !th.stop) yield; break;
          case 'ct_until': while (!evalArg(b.args[0], s) && !th.stop) { yield* runChain(b.sub, s, th); yield; } break;
          case 'ct_stop': if (A[0] === 'all') { stopAll(); } else if (A[0] === 'this script') th.stop = true; else running.forEach((t) => { if (t.s === s && t !== th) t.stop = true; }); break;
          case 'ct_clone': if (clones.length < 300) { const c = Object.assign(JSON.parse(JSON.stringify(Object.assign({}, s, { scripts: [], src: null, parent: null }))), { isClone: true, parent: s.parent || s.name, src: s.src || s, bubble: null }); clones.push(c); (c.src.scripts || []).forEach((sc) => { if (sc.top.op === 'ct_cloneh') spawn(sc.top.next, c); }); } break;
          case 'ct_delc': if (s.isClone) { clones.splice(clones.indexOf(s), 1); running.forEach((t) => { if (t.s === s) t.stop = true; }); th.stop = true; } break;
          case 'sn_ask': { s.bubble = { t: String(A[0]) }; asking = { s, done: false }; showAsk(String(A[0])); while (!asking.done) yield; asking = null; s.bubble = null; break; }
          case 'sn_rtimer': timerStart = now(); break;
          case 'vr_set': if (A[0]) proj.vars[A[0]] = A[1]; break; case 'vr_change': if (A[0]) proj.vars[A[0]] = num(proj.vars[A[0]]) + num(A[1]); break;
          case 'vr_show': shownVars.add(A[0]); break; case 'vr_hide': shownVars.delete(A[0]); break;
          case 'pn_clear': penG.clearRect(0, 0, W, H); break; case 'pn_down': s.pen = true; penLine(s, s.x, s.y); if (!s.penColor) s.penColor = '#3b82f6'; if (!s.penSize) s.penSize = 3; penG.fillStyle = s.penColor; penG.beginPath(); penG.arc(W / 2 + s.x, H / 2 - s.y, s.penSize / 2, 0, 7); penG.fill(); break; case 'pn_up': s.pen = false; break;
          case 'pn_color': s.penColor = A[0]; s.penHue = null; break; case 'pn_chue': { s.penHue = ((s.penHue ?? 210) + num(A[0]) * 3.6) % 360; s.penColor = `hsl(${s.penHue},80%,50%)`; break; }
          case 'pn_size': s.penSize = Math.max(1, num(A[0])); break; case 'pn_csize': s.penSize = Math.max(1, (s.penSize || 3) + num(A[0])); break;
          case 'pn_stamp': drawSprite(penG, s); break;
        }
      }
      const norm = (d) => { d = ((d + 180) % 360 + 360) % 360 - 180; return d === -180 ? 180 : d; };
      function spawn(b, s, hat) { if (!b) { const t = { done: true }; return t; } const th = { s, done: false, stop: false, hat }; th.gen = runChain(b, s, th); running.push(th); return th; }
      function broadcast(msg) { const ts = []; allSprites().forEach((s) => (s.isClone ? s.src : s).scripts.forEach((sc) => { if (sc.top.op === 'ev_recv' && String(sc.top.args[0]).toLowerCase() === String(msg).toLowerCase()) { running.filter((t) => t.s === s && t.hat === sc.top).forEach((t) => (t.stop = true)); ts.push(spawn(sc.top.next, s, sc.top)); } })); return ts; }
      function prep(s) { s.fx = s.fx || {}; s.bubble = null; s.pen = false; s.penColor = s.penColor || '#3b82f6'; s.penSize = s.penSize || 3; }
      function greenFlag() { stopAll(); OS.audio(); timerStart = now(); proj.sprites.forEach((s) => { prep(s); s.scripts.forEach((sc) => { if (sc.top.op === 'ev_flag') spawn(sc.top.next, s, sc.top); }); }); }
      function stopAll() { running.forEach((t) => (t.stop = true)); running = []; clones = []; proj.sprites.forEach((s) => { s.bubble = null; }); hideAsk(); }
      function runScriptOf(b) { const p = (() => { let x = b; let par; while ((par = findParent(x))) { if (par.kind === 'top') return par.s; x = par.b; } return null; })(); if (!p) return; const s = cur(); prep(s); const top = p.top; const already = running.find((t) => t.hat === top && !t.done); if (already) { already.stop = true; return; } const th = spawn(S[top.op][1] === 'hat' ? top.next : top, s, top); flash(top); void th; }
      function runSingle(b) { const s = cur(); prep(s); if (isReporter(b)) { const v = evalArg(b, s); OS.notify('Value', String(v), { app: 'sprout', timeout: 2000 }); return; } if (S[b.op][1] === 'hat') return; spawn(Object.assign({}, JSON.parse(JSON.stringify(b)), { next: null }), s); }
      function flash(top) { canvas.querySelectorAll('.sb-script').forEach((d) => { if (d._s.top === top) { d.classList.add('running'); setTimeout(() => d.classList.remove('running'), 600); } }); }
      // ask box
      function showAsk(q) { hideAsk(); const box = OS.el(`<form class="sp-ask"><input placeholder="${esc(q)}" autocomplete="off"><button class="btn sm primary">${gl('check')}</button></form>`); overlay.appendChild(box); const i = box.querySelector('input'); setTimeout(() => i.focus(), 30); box.onsubmit = (e) => { e.preventDefault(); answer = i.value; if (asking) asking.done = true; hideAsk(); }; }
      function hideAsk() { overlay.querySelector('.sp-ask')?.remove(); }
      /* ---------- stage drawing ---------- */
      const bgCache = {};
      function drawBackdrop() { const key = proj.backdrop; let img = bgCache[key]; if (!img) { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); const css = BACKDROPS[key] || '#fff'; const grads = { sky: [['#8fd3ff', 0], ['#e6f6ff', 1]], night: [['#0b1030', 0], ['#2a2060', 1]], sunset: [['#ff7e5f', 0], ['#feb47b', 1]], ocean: [['#4fc3f7', 0], ['#01579b', 1]] }; if (grads[key]) { const gr = g.createLinearGradient(0, 0, 0, H); grads[key].forEach(([c2, o]) => gr.addColorStop(o, c2)); g.fillStyle = gr; } else g.fillStyle = key === 'space' ? '#070718' : key === 'white' ? '#fff' : '#9be7ff'; g.fillRect(0, 0, W, H);
          if (key === 'grass') { g.fillStyle = '#5cc25c'; g.fillRect(0, H * 0.65, W, H); } if (key === 'desert') { g.fillStyle = '#ffe0a3'; g.fillRect(0, 0, W, H); g.fillStyle = '#e8b86b'; g.fillRect(0, H * 0.6, W, H); }
          if (key === 'night' || key === 'space') for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${Math.random()})`; g.fillRect(Math.random() * W, Math.random() * H * (key === 'night' ? 0.8 : 1), 1.5, 1.5); }
          if (key === 'sky') { g.fillStyle = 'rgba(255,255,255,.9)'; [[90, 70], [330, 50], [400, 120]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 22, 0, 7); g.arc(x + 24, y - 8, 26, 0, 7); g.arc(x + 50, y, 20, 0, 7); g.fill(); }); }
          void css; img = bgCache[key] = c; }
        G.drawImage(img, 0, 0); }
      function drawSprite(g, s) {
        if (!s.visible) return; const fs = 52 * s.size / 100; g.save(); g.translate(W / 2 + s.x, H / 2 - s.y);
        const fx = s.fx || {}; if (fx.ghost) g.globalAlpha = OS.clamp(1 - fx.ghost / 100, 0, 1); if (fx.color) g.filter = `hue-rotate(${fx.color * 1.8}deg)`;
        let rot = 0, flip = 1; if (s.rot === 'all around' || s.rot === 'all') rot = (s.dir - 90) * Math.PI / 180; else if (s.rot === 'left-right' && s.dir < 0) flip = -1;
        g.rotate(rot + (fx.spin || 0) * Math.PI / 180); g.scale(flip, 1); g.font = `${fs}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s.costumes[s.c] || '❓', 0, fs * 0.05); g.restore();
      }
      function drawBubble(s) { if (!s.bubble || !s.visible) return; const t = s.bubble.t.slice(0, 120); G.font = '14px Inter, system-ui'; const lines = []; let line = ''; t.split(' ').forEach((w) => { if (G.measureText(line + ' ' + w).width > 150) { lines.push(line); line = w; } else line = (line ? line + ' ' : '') + w; }); lines.push(line); const bw = Math.max(...lines.map((l) => G.measureText(l).width)) + 20, bh = lines.length * 18 + 14; let x = W / 2 + s.x + radius(s) * 0.6, y = H / 2 - s.y - radius(s) - bh; x = OS.clamp(x, 4, W - bw - 4); y = OS.clamp(y, 4, H - bh - 4); G.fillStyle = '#fff'; G.strokeStyle = '#bbb'; G.lineWidth = 1.5; G.beginPath(); G.roundRect(x, y, bw, bh, 12); G.fill(); G.stroke(); if (s.bubble.think) { [[0, 8, 4], [-8, 18, 3]].forEach(([dx, dy, r]) => { G.beginPath(); G.arc(x + 14 + dx, y + bh + dy, r, 0, 7); G.fill(); G.stroke(); }); } else { G.beginPath(); G.moveTo(x + 14, y + bh - 1); G.lineTo(x + 8, y + bh + 10); G.lineTo(x + 26, y + bh - 1); G.fill(); } G.fillStyle = '#222'; lines.forEach((l, i) => G.fillText(l, x + 10, y + 20 + i * 18)); }
      function drawStage() {
        drawBackdrop(); G.drawImage(penCv, 0, 0);
        allSprites().forEach((s) => drawSprite(G, s)); allSprites().forEach(drawBubble);
        // variable monitors
        let my = 6; G.font = '12px Inter, system-ui'; [...shownVars].filter((v) => v in proj.vars).forEach((v) => { const val = String(proj.vars[v]); const w1 = G.measureText(v).width, w2 = Math.max(24, G.measureText(val).width + 12); G.fillStyle = 'rgba(255,255,255,.92)'; G.strokeStyle = '#ccc'; G.beginPath(); G.roundRect(6, my, w1 + w2 + 20, 24, 6); G.fill(); G.stroke(); G.fillStyle = '#333'; G.fillText(v, 12, my + 16); G.fillStyle = CATS.Variables; G.beginPath(); G.roundRect(w1 + 18, my + 3, w2, 18, 9); G.fill(); G.fillStyle = '#fff'; G.textAlign = 'center'; G.fillText(val, w1 + 18 + w2 / 2, my + 16); G.textAlign = 'left'; my += 28; });
      }
      function loop() {
        raf = requestAnimationFrame(loop);
        const t0 = now();
        for (const th of running.slice()) { if (th.stop || th.done) continue; try { let steps = 0; let r; do { r = th.gen.next(); steps++; } while (!r.done && steps < 1 && now() - t0 < 30); if (r.done) th.done = true; } catch (e) { th.done = true; console.error(e); } }
        running = running.filter((t) => !t.done && !t.stop);
        $('[data-a=go]').classList.toggle('on', running.length > 0);
        drawStage();
      }
      /* ---------- stage input ---------- */
      const stageXY = (e) => { const r = stageCv.getBoundingClientRect(); return { x: Math.round((e.clientX - r.left) / r.width * W - W / 2), y: Math.round(H / 2 - (e.clientY - r.top) / r.height * H) }; };
      stageCv.addEventListener('pointermove', (e) => Object.assign(mouse, stageXY(e)));
      stageCv.addEventListener('pointerdown', (e) => {
        Object.assign(mouse, stageXY(e)); mouse.down = true; stageCv.setPointerCapture(e.pointerId); OS.audio();
        const hit = allSprites().slice().reverse().find((s) => s.visible && Math.hypot(s.x - mouse.x, s.y - mouse.y) < radius(s));
        if (hit) { (hit.isClone ? hit.src : hit).scripts.forEach((sc) => { if (sc.top.op === 'ev_click') spawn(sc.top.next, hit, sc.top); }); if (!running.length && !hit.isClone) { // drag sprite when not running
            const ox = hit.x - mouse.x, oy = hit.y - mouse.y; const mv = (ev) => { const p = stageXY(ev); hit.x = p.x + ox; hit.y = p.y + oy; renderSprites(); }; const up = () => { stageCv.removeEventListener('pointermove', mv); stageCv.removeEventListener('pointerup', up); touch(); }; stageCv.addEventListener('pointermove', mv); stageCv.addEventListener('pointerup', up); } }
      });
      stageCv.addEventListener('pointerup', () => (mouse.down = false));
      const keyName = (k) => ({ ' ': 'space', ArrowUp: 'up arrow', ArrowDown: 'down arrow', ArrowLeft: 'left arrow', ArrowRight: 'right arrow' }[k] || (k.length === 1 ? k.toLowerCase() : null));
      const keyEvt = (n) => { if (!n) return; if (keysDown.has(n)) return; keysDown.add(n); allSprites().forEach((s) => (s.isClone ? s.src : s).scripts.forEach((sc) => { if (sc.top.op === 'ev_key' && (sc.top.args[0] === n || sc.top.args[0] === 'any')) spawn(sc.top.next, s, sc.top); })); };
      OS.wm.keys(win, (e) => { if (e.target.closest('input,select,textarea')) return; const n = keyName(e.key); if (n) { if (n.includes('arrow') || n === 'space') e.preventDefault(); keyEvt(n); } });
      const ku = (e) => { const n = keyName(e.key); if (n) keysDown.delete(n); }; document.addEventListener('keyup', ku); win.onClose(() => document.removeEventListener('keyup', ku));
      // on-screen pad (touch)
      $('.sp-pad').innerHTML = OS.isTouch() ? ['left arrow', 'up arrow', 'down arrow', 'right arrow', 'space'].map((k) => `<button data-k="${k}">${{ 'left arrow': '←', 'up arrow': '↑', 'down arrow': '↓', 'right arrow': '→', space: 'Space' }[k]}</button>`).join('') : '';
      win.body.querySelectorAll('.sp-pad [data-k]').forEach((b) => { b.addEventListener('pointerdown', (e) => { e.preventDefault(); keyEvt(b.dataset.k); }); const up = () => keysDown.delete(b.dataset.k); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); });
      /* ---------- sprites panel ---------- */
      function renderSprites() {
        const s = cur(); const host = $('.sp-sprites');
        host.innerHTML = `<div class="sp-props"><input class="inp" data-p="name" value="${esc(s.name)}" title="Name"><label>x<input class="inp" data-p="x" value="${Math.round(s.x)}" inputmode="decimal"></label><label>y<input class="inp" data-p="y" value="${Math.round(s.y)}" inputmode="decimal"></label><label>size<input class="inp" data-p="size" value="${Math.round(s.size)}" inputmode="decimal"></label><label>dir<input class="inp" data-p="dir" value="${Math.round(s.dir)}" inputmode="decimal"></label><button class="ibtn ${s.visible ? 'on' : ''}" data-vis title="Show/hide">${gl('eye')}</button></div>
          <div class="sp-costumes"><small class="muted">Costumes</small>${s.costumes.map((c, i) => `<button class="sp-cos ${i === s.c ? 'on' : ''}" data-ci="${i}">${c}</button>`).join('')}<button class="sp-cos add" data-addcos title="Add costume">+</button></div>
          <div class="sp-list">${proj.sprites.map((x) => `<button class="sp-sprite ${x === s ? 'on' : ''}" data-sid="${x.id}"><span>${x.costumes[x.c]}</span><small>${esc(x.name)}</small></button>`).join('')}<button class="sp-sprite add" data-addspr title="New sprite"><span>+</span><small>Sprite</small></button><div class="sp-backs"><small class="muted">Backdrop</small><select class="inp" data-back>${Object.keys(BACKDROPS).map((b) => `<option ${proj.backdrop === b ? 'selected' : ''}>${b}</option>`).join('')}</select></div></div>`;
        host.querySelectorAll('[data-p]').forEach((i) => (i.onchange = () => { const p = i.dataset.p; s[p] = p === 'name' ? i.value.trim() || s.name : num(i.value); touch(); if (p === 'name') renderSprites(); }));
        host.querySelector('[data-vis]').onclick = () => { s.visible = !s.visible; touch(); renderSprites(); };
        host.querySelectorAll('[data-ci]').forEach((b) => { b.onclick = () => { s.c = +b.dataset.ci; touch(); renderSprites(); }; OS.onContext(b, (e, x, y) => OS.menu(x, y, [{ label: 'Delete costume', icon: 'trash', danger: true, disabled: s.costumes.length < 2, action: () => { s.costumes.splice(+b.dataset.ci, 1); s.c = 0; touch(); renderSprites(); } }])); });
        host.querySelector('[data-addcos]').onclick = () => pickEmoji((em) => { s.costumes.push(em); s.c = s.costumes.length - 1; touch(); renderSprites(); });
        host.querySelectorAll('[data-sid]').forEach((b) => { b.onclick = () => { proj.cur = b.dataset.sid; renderSprites(); renderWS(); renderPalette(); }; OS.onContext(b, (e, x, y) => { const sp = proj.sprites.find((q) => q.id === b.dataset.sid); OS.menu(x, y, [{ label: 'Duplicate', icon: 'copy', action: () => { const c = JSON.parse(JSON.stringify(sp)); c.id = uid(); c.name += '2'; c.x += 20; proj.sprites.push(c); touch(); renderSprites(); } }, { label: 'Delete sprite', icon: 'trash', danger: true, disabled: proj.sprites.length < 2, action: () => { proj.sprites.splice(proj.sprites.indexOf(sp), 1); proj.cur = proj.sprites[0].id; touch(); renderSprites(); renderWS(); } }]); }); });
        host.querySelector('[data-addspr]').onclick = () => pickEmoji((em) => { const n = { id: uid(), name: 'Sprite' + (proj.sprites.length + 1), costumes: [em], c: 0, x: Math.round((Math.random() - 0.5) * 300), y: Math.round((Math.random() - 0.5) * 200), dir: 90, size: 100, visible: true, rot: 'all', scripts: [] }; proj.sprites.push(n); proj.cur = n.id; touch(); renderSprites(); renderWS(); renderPalette(); });
        host.querySelector('[data-back]').onchange = (e) => { proj.backdrop = e.target.value; touch(); };
      }
      function pickEmoji(cb) { const p = OS.dialog({ title: 'Choose a costume', html: `<div class="sp-emoji">${EMOJI.map((e) => `<button data-e="${e}">${e}</button>`).join('')}</div><input class="inp" placeholder="…or type/paste any emoji" data-custom maxlength="8">`, buttons: [{ label: 'Cancel', value: null }, { label: 'Use typed', value: 'typed', primary: true }] }); const d = OS._dlg.el; d.querySelectorAll('[data-e]').forEach((b) => (b.onclick = () => OS._dlg.done(b.dataset.e))); const ci = d.querySelector('[data-custom]'); p.then((v) => { if (v === 'typed') v = ci.value.trim(); if (v) cb(v); }); }
      /* ---------- file ---------- */
      const dir = () => OS.home() + '/Documents/Sprout';
      const serialize = () => JSON.stringify(Object.assign({}, proj, { shown: [...shownVars] }));
      const save = async (as) => { let p = path; if (!p || as) { OS.fs.mkdir(dir(), { p: true }); p = await OS.pickFile({ mode: 'save', path: dir(), name: proj.name + '.sprout' }); if (!p) return false; if (!p.endsWith('.sprout')) p += '.sprout'; } try { OS.fs.write(p, serialize()); path = p; dirty = false; title(); return true; } catch (e) { OS.alert('Save failed', e.message); return false; } };
      const load = (p) => { try { const d = JSON.parse(OS.fs.read(p)); if (!d.sprites) throw new Error('Not a Sprout project'); stopAll(); proj = d; shownVars = new Set(d.shown || []); path = p; dirty = false; penG.clearRect(0, 0, W, H); $('.sp-name').value = proj.name; title(); renderAll(); } catch (e) { OS.alert('Could not open', e.message); } };
      const confirmLose = async () => { if (!dirty) return true; const r = await OS.dialog({ title: 'Save project?', message: `Save changes to “${proj.name}”?`, buttons: [{ label: 'Cancel', value: 'c' }, { label: "Don't save", value: 'd', danger: true }, { label: 'Save', value: 's', primary: true }] }); return r === 's' ? save() : r === 'd'; };
      win.beforeClose = confirmLose;
      $('.sp-name').oninput = (e) => { proj.name = e.target.value || 'Untitled'; touch(); };
      $('[data-a=menu]').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left, r.bottom + 4, [
        { label: 'New project', icon: 'plus', action: async () => { if (!(await confirmLose())) return; stopAll(); const s0 = { id: uid(), name: 'Sprite1', costumes: ['🌱'], c: 0, x: 0, y: 0, dir: 90, size: 100, visible: true, rot: 'all', scripts: [] }; proj = { v: 1, name: 'Untitled', sprites: [s0], backdrop: 'white', vars: { score: 0 }, cur: s0.id }; shownVars = new Set(); path = null; dirty = false; penG.clearRect(0, 0, W, H); $('.sp-name').value = proj.name; title(); renderAll(); } },
        { label: 'Open…', icon: 'folder', action: async () => { if (!(await confirmLose())) return; OS.fs.mkdir(dir(), { p: true }); const p = await OS.pickFile({ mode: 'open', path: dir(), filter: (n) => n.endsWith('.sprout') }); if (p) load(p); } },
        { label: 'Save', icon: 'save', action: () => save() }, { label: 'Save As…', icon: 'save', action: () => save(true) }, '-',
        { label: 'Load example: Sprig & Star', icon: 'star', action: async () => { if (await confirmLose()) { stopAll(); proj = demoProject(); shownVars = new Set(['score']); path = null; dirty = false; $('.sp-name').value = proj.name; title(); renderAll(); } } },
        { label: 'Save stage as picture', icon: 'image', action: () => { OS.fs.mkdir(OS.home() + '/Pictures', { p: true }); const p = OS.fs.uniqueName(OS.home() + '/Pictures', proj.name + '.png'); OS.fs.write(p, stageCv.toDataURL('image/png')); OS.notify('Saved', OS.fs.pretty(p), { app: 'sprout' }); } },
        { label: 'How to use Sprout', icon: 'info', action: () => OS.alert('Sprout', '• Drag blocks from the palette into the workspace and snap them together.\n• Start scripts with a yellow "when ▶ clicked" block, then press ▶.\n• Click a script to run it; click a palette block to try it.\n• Drop blocks back on the palette to delete them.\n• Round blocks are values — drop them into white slots. Pointy blocks are true/false.\n• On touch screens, press and hold a palette block, or drag it sideways, to pick it up.') },
      ]); };
      $('[data-a=go]').onclick = greenFlag; $('[data-a=stop]').onclick = () => { stopAll(); };
      win.body.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { mtab = b.dataset.t; layout(); }));
      function layout() { win.body.querySelector('.sp').classList.toggle('m-stage', mtab === 'stage'); win.body.querySelectorAll('[data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === mtab)); }
      function renderAll() { renderCats(); renderPalette(); renderWS(); renderSprites(); layout(); }
      win.onClose(() => { cancelAnimationFrame(raf); stopAll(); });
      win.onArgs = async (a) => { if (a.path && (await confirmLose())) load(a.path); };
      $('.sp-name').value = proj.name; title(); renderAll(); raf = requestAnimationFrame(loop);
      if (args.path) load(args.path);
      if (!OS.store.get('sprout-demo')) { OS.store.set('sprout-demo', 1); try { OS.fs.mkdir(dir(), { p: true }); OS.fs.write(dir() + '/Sprig and Star.sprout', JSON.stringify(Object.assign(demoProject(), { shown: ['score'] }))); } catch (e) {} }
    },
  });
})();
