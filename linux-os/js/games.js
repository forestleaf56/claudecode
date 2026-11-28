/* Cirrus Linux — games */
(function () {
  'use strict';
  const gl = OS.glyph, esc = OS.esc;
  const best = (k, v) => { const s = OS.store.get('scores', {}); if (v !== undefined && (s[k] === undefined || v > s[k])) { s[k] = v; OS.store.set('scores', s); } return s[k] || 0; };
  const bestLow = (k, v) => { const s = OS.store.get('scores', {}); if (v !== undefined && (s[k] === undefined || v < s[k])) { s[k] = v; OS.store.set('scores', s); } return s[k]; };
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  function overlay(host, title, sub, btn, fn) { host.style.position = 'relative'; const o = OS.el(`<div class="game-over"><div><h2>${title}</h2><p>${sub}</p><button class="btn primary">${btn}</button></div></div>`); o.querySelector('button').onclick = () => { o.remove(); fn(); }; host.appendChild(o); return o; }
  function fitCanvas(cv, host, aspect, max = 640) { const r = host.getBoundingClientRect(); let w = Math.min(max, r.width - 24), h = w / aspect; const mh = r.height - 24; if (h > mh) { h = mh; w = h * aspect; } cv.style.width = Math.max(120, w) + 'px'; cv.style.height = Math.max(120 / aspect, h) + 'px'; }
  const dpad = () => `<div class="dpad"><span></span><button data-d="up">${gl('up')}</button><span></span><button data-d="left">${gl('left')}</button><button data-d="down">${gl('down')}</button><button data-d="right">${gl('right')}</button></div>`;

  /* ======================= SNAKE ======================= */
  OS.registerApp({
    id: 'snake', name: 'Snake', icon: 'snake', color: ['#3fdc77', '#118a4b'], cat: 'Games', w: 520, h: 640, desc: 'Classic snake', launch(win) {
      const N = 20; let snake, dir, nextDir, food, score, alive, tick, speed, paused = false;
      win.body.innerHTML = `<div class="game"><div class="game-head"><div class="stat"><small>Score</small><b data-s>0</b></div><div class="stat"><small>Best</small><b data-b>${best('snake')}</b></div><button class="btn sm" data-a="p">Pause</button></div><div class="gwrap" style="flex:1;width:100%;display:grid;place-items:center;min-height:0;position:relative"><canvas width="400" height="400"></canvas></div>${OS.isTouch() ? dpad() : '<div class="small muted">Arrow keys / WASD · swipe on touch · Space to pause</div>'}</div>`;
      const cv = win.body.querySelector('canvas'), g = cv.getContext('2d'), wrap = win.body.querySelector('.gwrap');
      function reset() { snake = [[10, 10], [9, 10], [8, 10]]; dir = [1, 0]; nextDir = [1, 0]; score = 0; alive = true; speed = 130; place(); upd(); clearTimeout(tick); loop(); }
      function place() { do { food = [Math.random() * N | 0, Math.random() * N | 0]; } while (snake.some((s) => s[0] === food[0] && s[1] === food[1])); }
      const upd = () => { win.body.querySelector('[data-s]').textContent = score; win.body.querySelector('[data-b]').textContent = best('snake', score); };
      function step() {
        dir = nextDir; const h = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
        if (h[0] < 0 || h[1] < 0 || h[0] >= N || h[1] >= N || snake.some((s) => s[0] === h[0] && s[1] === h[1])) { alive = false; OS.sound('error'); draw(); overlay(wrap, 'Game over', `Score: ${score}`, 'Play again', reset); return; }
        snake.unshift(h); if (h[0] === food[0] && h[1] === food[1]) { score += 10; speed = Math.max(55, speed - 3); place(); OS.sound('click'); upd(); } else snake.pop();
      }
      function draw() {
        const c = 20; g.fillStyle = css('--surface2'); g.fillRect(0, 0, 400, 400);
        g.fillStyle = css('--surface3'); for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if ((x + y) % 2) g.fillRect(x * c, y * c, c, c);
        g.fillStyle = '#ff5c5c'; g.beginPath(); g.arc(food[0] * c + 10, food[1] * c + 10, 8, 0, 7); g.fill();
        snake.forEach((s, i) => { g.fillStyle = i ? `hsl(${145 - i * 1.5},65%,${48 - Math.min(i, 20) * 0.6}%)` : '#2bd46a'; g.beginPath(); g.roundRect(s[0] * c + 1, s[1] * c + 1, c - 2, c - 2, 6); g.fill(); });
        const h = snake[0]; g.fillStyle = '#fff'; g.beginPath(); g.arc(h[0] * c + 10 + dir[0] * 4 - dir[1] * 4, h[1] * c + 10 + dir[1] * 4 - dir[0] * 4, 2.5, 0, 7); g.arc(h[0] * c + 10 + dir[0] * 4 + dir[1] * 4, h[1] * c + 10 + dir[1] * 4 + dir[0] * 4, 2.5, 0, 7); g.fill();
      }
      function loop() { if (!alive) return; if (!paused) { step(); if (alive) draw(); } tick = setTimeout(loop, speed); }
      const turn = (d) => { const m = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d]; if (m && (m[0] !== -dir[0] || m[1] !== -dir[1])) nextDir = m; };
      OS.wm.keys(win, (e) => { const k = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }[e.key]; if (k) { e.preventDefault(); turn(k); } if (e.key === ' ') { e.preventDefault(); paused = !paused; } });
      OS.onSwipe(cv, (d) => turn(d), 15);
      win.body.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); turn(b.dataset.d); }));
      win.body.querySelector('[data-a=p]').onclick = (e) => { paused = !paused; e.target.textContent = paused ? 'Resume' : 'Pause'; };
      win.onResize = () => fitCanvas(cv, wrap, 1, 520); win.onClose(() => clearTimeout(tick));
      setTimeout(win.onResize, 0); reset();
    },
  });

  /* ======================= MINES ======================= */
  OS.registerApp({
    id: 'mines', name: 'Mines', icon: 'bomb', color: ['#8a93a6', '#3a3f4b'], cat: 'Games', w: 560, h: 660, desc: 'Find the mines', launch(win) {
      const LV = { Easy: [9, 9, 10], Medium: [16, 16, 40], Hard: [16, 30, 99] }; let lv = OS.store.get('mines-lv', 'Easy'), R, Cc, M, cells, first, over, flags, t0, timer, flagMode = false;
      win.body.innerHTML = `<div class="game" style="justify-content:flex-start"><div class="game-head"><div class="seg">${Object.keys(LV).map((k) => `<button data-l="${k}">${k}</button>`).join('')}</div><div class="stat"><small>Mines</small><b data-m></b></div><div class="stat"><small>Time</small><b data-t>0</b></div><button class="ibtn" data-a="flag" title="Flag mode">${gl('flag')}</button><button class="ibtn" data-a="new" title="New game">${gl('refresh')}</button></div><div class="gwrap" style="flex:1;width:100%;display:grid;place-items:center;overflow:auto;position:relative"><div class="mines"></div></div><div class="small muted">Click to reveal · right-click / long-press / flag mode to flag</div></div>`;
      const board = win.body.querySelector('.mines'), wrap = win.body.querySelector('.gwrap');
      const COL = ['', '#2bb3ff', '#3fdc77', '#ff6b6b', '#8b5cff', '#ff9f43', '#1fc8b0', '#555', '#999'];
      function reset() {
        [R, Cc, M] = LV[lv]; { const wr = wrap.getBoundingClientRect(); if (Cc > R && wr.height > wr.width) [R, Cc] = [Cc, R]; } cells = Array.from({ length: R * Cc }, () => ({ m: false, o: false, f: false, n: 0 })); first = true; over = false; flags = 0; clearInterval(timer); t0 = 0;
        win.body.querySelectorAll('[data-l]').forEach((b) => b.classList.toggle('on', b.dataset.l === lv)); win.body.querySelector('[data-t]').textContent = 0;
        wrap.querySelector('.game-over')?.remove(); size(); render();
      }
      function size() { const r = wrap.getBoundingClientRect(); const s = Math.max(22, Math.min(40, Math.floor(Math.min((r.width - 16) / Cc, (r.height - 16) / R)))); board.style.gridTemplateColumns = `repeat(${Cc},${s}px)`; board.style.gridAutoRows = s + 'px'; board.style.fontSize = s * 0.5 + 'px'; }
      const nb = (i) => { const r = Math.floor(i / Cc), c = i % Cc, o = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const rr = r + dr, cc = c + dc; if ((dr || dc) && rr >= 0 && cc >= 0 && rr < R && cc < Cc) o.push(rr * Cc + cc); } return o; };
      function plant(safe) { const no = new Set([safe, ...nb(safe)]); let k = 0; while (k < M) { const i = Math.random() * R * Cc | 0; if (!cells[i].m && !no.has(i)) { cells[i].m = true; k++; } } cells.forEach((c, i) => (c.n = nb(i).filter((j) => cells[j].m).length)); }
      function open(i) {
        const c = cells[i]; if (over || c.o || c.f) return;
        if (first) { first = false; plant(i); t0 = Date.now(); timer = setInterval(() => (win.body.querySelector('[data-t]').textContent = Math.floor((Date.now() - t0) / 1000)), 500); }
        if (c.m) { c.o = true; over = true; clearInterval(timer); cells.forEach((x) => { if (x.m) x.o = true; }); render(i); OS.sound('error'); overlay(wrap, 'Boom!', 'You hit a mine.', 'Try again', reset); return; }
        const st = [i]; while (st.length) { const j = st.pop(); const x = cells[j]; if (x.o || x.f) continue; x.o = true; if (!x.n) nb(j).forEach((k) => !cells[k].o && st.push(k)); }
        render();
        if (cells.every((x) => x.m || x.o)) { over = true; clearInterval(timer); const t = Math.floor((Date.now() - t0) / 1000); const b = bestLow('mines-' + lv, t); OS.sound('done'); overlay(wrap, 'You win!', `${lv} cleared in ${t}s · best ${b}s`, 'Play again', reset); }
      }
      function chord(i) { const c = cells[i]; if (!c.o || !c.n) return; const ns = nb(i); if (ns.filter((j) => cells[j].f).length === c.n) ns.forEach(open); }
      function flag(i) { const c = cells[i]; if (over || c.o) return; c.f = !c.f; flags += c.f ? 1 : -1; render(); }
      function render(boom) {
        board.innerHTML = ''; win.body.querySelector('[data-m]').textContent = M - flags;
        cells.forEach((c, i) => {
          const b = document.createElement('button'); if (c.o) { b.className = 'open' + (i === boom ? ' boom' : ''); if (c.m) b.innerHTML = gl('bomb'); else if (c.n) { b.textContent = c.n; b.style.color = COL[c.n]; } } else if (c.f) b.innerHTML = `<span style="color:#ff6b6b">${gl('flag')}</span>`;
          b.onclick = () => (flagMode && !c.o ? flag(i) : c.o ? chord(i) : open(i));
          OS.onContext(b, () => flag(i)); board.appendChild(b);
        });
      }
      win.body.querySelectorAll('[data-l]').forEach((b) => (b.onclick = () => { lv = b.dataset.l; OS.store.set('mines-lv', lv); reset(); }));
      win.body.querySelector('[data-a=new]').onclick = reset;
      win.body.querySelector('[data-a=flag]').onclick = (e) => { flagMode = !flagMode; e.currentTarget.classList.toggle('on', flagMode); };
      win.onResize = size; win.onClose(() => clearInterval(timer));
      setTimeout(reset, 0);
    },
  });

  /* ======================= MERGE (2048-style) ======================= */
  OS.registerApp({
    id: 'merge', name: 'Merge', icon: 'grid4', color: ['#f7c948', '#ff8a5c'], cat: 'Games', w: 480, h: 640, desc: 'Slide & merge tiles', launch(win) {
      let grid, score, won;
      win.body.innerHTML = `<div class="game"><div class="game-head"><div class="stat"><small>Score</small><b data-s>0</b></div><div class="stat"><small>Best</small><b data-b></b></div><button class="btn sm" data-a="new">${gl('refresh')}New</button></div><div class="merge"></div><div class="small muted">Arrow keys or swipe · merge to reach 2048</div></div>`;
      const board = win.body.querySelector('.merge');
      const color = (v) => { if (!v) return ''; const l = Math.log2(v); return `background:hsl(${(230 + l * 22) % 360},${55 + l * 2}%,${Math.max(38, 72 - l * 3)}%);color:#fff`; };
      function reset() { grid = Array(16).fill(0); score = 0; won = false; add(); add(); board.querySelector('.game-over')?.remove(); render(); }
      function add() { const e = grid.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0); if (!e.length) return -1; const i = e[Math.random() * e.length | 0]; grid[i] = Math.random() < 0.9 ? 2 : 4; return i; }
      function render(pop = []) { board.innerHTML = grid.map((v, i) => `<div class="${pop.includes(i) ? 'pop' : ''}" style="${color(v)};font-size:${v >= 1024 ? '0.75em' : v >= 128 ? '0.9em' : ''}">${v || ''}</div>`).join(''); win.body.querySelector('[data-s]').textContent = score; win.body.querySelector('[data-b]').textContent = best('merge', score); }
      function move(d) {
        const lines = []; for (let k = 0; k < 4; k++) { const l = []; for (let j = 0; j < 4; j++) l.push(d === 'left' ? k * 4 + j : d === 'right' ? k * 4 + 3 - j : d === 'up' ? j * 4 + k : (3 - j) * 4 + k); lines.push(l); }
        let moved = false; const pop = [];
        lines.forEach((l) => { const vals = l.map((i) => grid[i]).filter(Boolean); const out = []; for (let i = 0; i < vals.length; i++) { if (vals[i] === vals[i + 1]) { out.push(vals[i] * 2); score += vals[i] * 2; pop.push(l[out.length - 1]); if (vals[i] * 2 === 2048 && !won) { won = true; setTimeout(() => overlay(board, 'You made 2048!', 'Keep going for a higher score', 'Continue', () => {}), 200); } i++; } else out.push(vals[i]); } while (out.length < 4) out.push(0); l.forEach((idx, j) => { if (grid[idx] !== out[j]) moved = true; grid[idx] = out[j]; }); });
        if (!moved) return; const n = add(); render([...pop, n]);
        if (!canMove()) setTimeout(() => overlay(board, 'No more moves', `Score: ${score}`, 'Try again', reset), 300);
      }
      const canMove = () => grid.some((v, i) => !v || (i % 4 < 3 && v === grid[i + 1]) || (i < 12 && v === grid[i + 4]));
      OS.wm.keys(win, (e) => { const d = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key]; if (d) { e.preventDefault(); move(d); } });
      OS.onSwipe(board, (d) => d !== 'tap' && move(d), 20);
      win.body.querySelector('[data-a=new]').onclick = reset;
      reset();
    },
  });

  /* ======================= BLOCK DROP ======================= */
  OS.registerApp({
    id: 'blocks', name: 'Block Drop', icon: 'blocks', color: ['#8b5cff', '#4c2bd4'], cat: 'Games', w: 520, h: 680, desc: 'Falling blocks puzzle', launch(win) {
      const W = 10, H = 20; const SH = { I: [[1, 1, 1, 1]], O: [[1, 1], [1, 1]], T: [[0, 1, 0], [1, 1, 1]], S: [[0, 1, 1], [1, 1, 0]], Z: [[1, 1, 0], [0, 1, 1]], J: [[1, 0, 0], [1, 1, 1]], L: [[0, 0, 1], [1, 1, 1]] };
      const COL = { I: '#2bd4ff', O: '#f7c948', T: '#b06cff', S: '#3fdc77', Z: '#ff5c5c', J: '#4a7dff', L: '#ff9f43' };
      let board, piece, next, score, lines, level, alive, drop, last, raf, paused = false;
      win.body.innerHTML = `<div class="game"><div class="game-head"><div class="stat"><small>Score</small><b data-s>0</b></div><div class="stat"><small>Lines</small><b data-l>0</b></div><div class="stat"><small>Level</small><b data-v>1</b></div><div class="stat"><small>Best</small><b data-b></b></div><canvas data-n width="80" height="60" style="width:60px;height:45px;background:transparent"></canvas></div><div class="gwrap" style="flex:1;width:100%;display:grid;place-items:center;min-height:0;position:relative"><canvas data-g width="300" height="600"></canvas></div>
        <div class="row" style="gap:6px">${[['left', 'left'], ['rot', 'rotate'], ['right', 'right'], ['down', 'down'], ['drop', 'arrowup']].map(([a, i]) => `<button class="btn" data-k="${a}" style="width:54px;height:46px;padding:0">${a === 'drop' ? '<span style="transform:rotate(180deg);display:inline-flex">' + gl(i) + '</span>' : gl(i)}</button>`).join('')}<button class="btn" data-k="pause" style="height:46px">${gl('pause')}</button></div></div>`;
      const cv = win.body.querySelector('[data-g]'), g = cv.getContext('2d'), nv = win.body.querySelector('[data-n]'), ng = nv.getContext('2d'), wrap = win.body.querySelector('.gwrap');
      const rnd = () => { const k = Object.keys(SH)[Math.random() * 7 | 0]; return { k, m: SH[k].map((r) => r.slice()), x: 3, y: 0 }; };
      function reset() { board = Array.from({ length: H }, () => Array(W).fill(null)); score = 0; lines = 0; level = 1; alive = true; piece = rnd(); next = rnd(); drop = 0; last = performance.now(); wrap.querySelector('.game-over')?.remove(); upd(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
      const fits = (m, x, y) => m.every((r, i) => r.every((v, j) => !v || (x + j >= 0 && x + j < W && y + i < H && (y + i < 0 || !board[y + i][x + j]))));
      const rot = (m) => m[0].map((_, i) => m.map((r) => r[i]).reverse());
      function lock() {
        piece.m.forEach((r, i) => r.forEach((v, j) => { if (v && piece.y + i >= 0) board[piece.y + i][piece.x + j] = piece.k; }));
        let c = 0; for (let y = H - 1; y >= 0; y--) if (board[y].every(Boolean)) { board.splice(y, 1); board.unshift(Array(W).fill(null)); c++; y++; }
        if (c) { lines += c; score += [0, 100, 300, 500, 800][c] * level; level = 1 + Math.floor(lines / 10); OS.sound('click'); }
        piece = next; next = rnd(); if (!fits(piece.m, piece.x, piece.y)) { alive = false; OS.sound('error'); best('blocks', score); upd(); overlay(wrap, 'Game over', `Score: ${score} · ${lines} lines`, 'Play again', reset); }
        upd();
      }
      function act(a) {
        if (!alive || (paused && a !== 'pause')) return;
        if (a === 'left' && fits(piece.m, piece.x - 1, piece.y)) piece.x--;
        else if (a === 'right' && fits(piece.m, piece.x + 1, piece.y)) piece.x++;
        else if (a === 'down') { if (fits(piece.m, piece.x, piece.y + 1)) { piece.y++; score++; } else lock(); }
        else if (a === 'rot') { const m = rot(piece.m); for (const k of [0, -1, 1, -2, 2]) if (fits(m, piece.x + k, piece.y)) { piece.m = m; piece.x += k; break; } }
        else if (a === 'drop') { while (fits(piece.m, piece.x, piece.y + 1)) { piece.y++; score += 2; } lock(); }
        else if (a === 'pause') paused = !paused;
        draw(); upd();
      }
      const upd = () => { win.body.querySelector('[data-s]').textContent = score; win.body.querySelector('[data-l]').textContent = lines; win.body.querySelector('[data-v]').textContent = level; win.body.querySelector('[data-b]').textContent = best('blocks'); };
      function cell(gg, x, y, s, c) { gg.fillStyle = c; gg.beginPath(); gg.roundRect(x * s + 1, y * s + 1, s - 2, s - 2, 4); gg.fill(); gg.fillStyle = 'rgba(255,255,255,.25)'; gg.fillRect(x * s + 3, y * s + 3, s - 6, 3); }
      function draw() {
        const s = 30; g.fillStyle = css('--surface2'); g.fillRect(0, 0, 300, 600); g.strokeStyle = css('--border'); for (let x = 1; x < W; x++) { g.beginPath(); g.moveTo(x * s, 0); g.lineTo(x * s, 600); g.stroke(); }
        board.forEach((r, y) => r.forEach((k, x) => k && cell(g, x, y, s, COL[k])));
        let gy = piece.y; while (fits(piece.m, piece.x, gy + 1)) gy++;
        g.globalAlpha = 0.2; piece.m.forEach((r, i) => r.forEach((v, j) => v && cell(g, piece.x + j, gy + i, s, COL[piece.k]))); g.globalAlpha = 1;
        piece.m.forEach((r, i) => r.forEach((v, j) => v && cell(g, piece.x + j, piece.y + i, s, COL[piece.k])));
        if (paused) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, 0, 300, 600); g.fillStyle = '#fff'; g.font = 'bold 28px system-ui'; g.textAlign = 'center'; g.fillText('PAUSED', 150, 300); }
        ng.clearRect(0, 0, 80, 60); next.m.forEach((r, i) => r.forEach((v, j) => v && cell(ng, j + (4 - next.m[0].length) / 2, i + 0.5, 18, COL[next.k])));
      }
      function loop(t) { if (!alive) return; raf = requestAnimationFrame(loop); if (paused) return; drop += t - last; last = t; const sp = Math.max(70, 800 - (level - 1) * 70); if (drop > sp) { drop = 0; if (fits(piece.m, piece.x, piece.y + 1)) piece.y++; else lock(); } draw(); }
      OS.wm.keys(win, (e) => { const a = { ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'rot', ' ': 'drop', p: 'pause', x: 'rot', z: 'rot' }[e.key]; if (a) { e.preventDefault(); act(a); } });
      OS.onSwipe(cv, (d) => act({ tap: 'rot', left: 'left', right: 'right', down: 'drop', up: 'rot' }[d]), 18);
      win.body.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); act(b.dataset.k); }));
      win.onResize = () => fitCanvas(cv, wrap, 0.5, 400); win.onClose(() => cancelAnimationFrame(raf));
      setTimeout(win.onResize, 0); reset();
    },
  });

  /* ======================= MEMORY ======================= */
  OS.registerApp({
    id: 'memory', name: 'Memory', icon: 'cards', color: ['#ff5ca8', '#b06cff'], cat: 'Games', w: 480, h: 620, desc: 'Find matching pairs', launch(win) {
      const ICONS = ['heart', 'star', 'zap', 'leaf', 'anchor', 'rocket', 'crown', 'diamond', 'fish', 'tree', 'music', 'sun'];
      let cards, open, moves, matched, lock, t0, timer;
      win.body.innerHTML = `<div class="game"><div class="game-head"><div class="stat"><small>Moves</small><b data-m>0</b></div><div class="stat"><small>Time</small><b data-t>0</b></div><div class="stat"><small>Best</small><b data-b>-</b></div><button class="btn sm" data-a="new">${gl('refresh')}New</button></div><div class="memory"></div></div>`;
      const board = win.body.querySelector('.memory');
      function reset() {
        const pick = ICONS.slice().sort(() => Math.random() - 0.5).slice(0, 8); cards = [...pick, ...pick].sort(() => Math.random() - 0.5).map((ic, i) => ({ ic, i, done: false })); open = []; moves = 0; matched = 0; lock = false; clearInterval(timer); t0 = null;
        board.querySelector('.game-over')?.remove();
        board.innerHTML = cards.map((c, i) => `<div class="mcard" data-i="${i}"><div><div class="f"></div><div class="b" style="color:hsl(${ICONS.indexOf(c.ic) * 30},70%,55%)">${gl(c.ic)}</div></div></div>`).join('');
        board.querySelectorAll('.mcard').forEach((el) => (el.onclick = () => flip(+el.dataset.i)));
        upd();
      }
      const upd = () => { win.body.querySelector('[data-m]').textContent = moves; const b = bestLow('memory'); win.body.querySelector('[data-b]').textContent = b ?? '-'; };
      function flip(i) {
        const el = board.children[i]; if (lock || cards[i].done || open.includes(i)) return;
        if (!t0) { t0 = Date.now(); timer = setInterval(() => (win.body.querySelector('[data-t]').textContent = Math.floor((Date.now() - t0) / 1000)), 500); }
        el.classList.add('flip'); open.push(i);
        if (open.length === 2) {
          moves++; upd(); const [a, b] = open;
          if (cards[a].ic === cards[b].ic) { cards[a].done = cards[b].done = true; board.children[a].classList.add('done'); board.children[b].classList.add('done'); open = []; matched++; OS.sound('click');
            if (matched === 8) { clearInterval(timer); bestLow('memory', moves); upd(); OS.sound('done'); setTimeout(() => overlay(board, 'Well done!', `${moves} moves in ${Math.floor((Date.now() - t0) / 1000)}s`, 'Play again', reset), 400); } }
          else { lock = true; setTimeout(() => { board.children[a].classList.remove('flip'); board.children[b].classList.remove('flip'); open = []; lock = false; }, 800); }
        }
      }
      win.body.querySelector('[data-a=new]').onclick = reset; win.onClose(() => clearInterval(timer));
      reset();
    },
  });

  /* ======================= TIC-TAC-TOE ======================= */
  OS.registerApp({
    id: 'tictactoe', name: 'Tic-Tac-Toe', icon: 'hash', color: ['#2bb3ff', '#4a5bff'], cat: 'Games', w: 440, h: 580, desc: 'X and O', launch(win) {
      let b, turn, over, mode = 'cpu', diff = 'hard', sc = { X: 0, O: 0, D: 0 };
      const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
      win.body.innerHTML = `<div class="game"><div class="game-head"><div class="seg"><button data-mode="cpu">vs CPU</button><button data-mode="2p">2 Players</button></div><div class="seg" data-diffs><button data-d="easy">Easy</button><button data-d="hard">Hard</button></div></div><div class="game-head"><div class="stat"><small>X</small><b data-x>0</b></div><div class="stat"><small>Draws</small><b data-dr>0</b></div><div class="stat"><small>O</small><b data-o>0</b></div></div><div class="ttt"></div><div data-msg style="font-weight:600;min-height:24px"></div><button class="btn" data-a="new">${gl('refresh')}New round</button></div>`;
      const board = win.body.querySelector('.ttt');
      const winner = (s) => { for (const l of LINES) if (s[l[0]] && s[l[0]] === s[l[1]] && s[l[0]] === s[l[2]]) return { p: s[l[0]], l }; return s.every(Boolean) ? { p: 'D' } : null; };
      function minimax(s, p) { const w = winner(s); if (w) return { v: w.p === 'O' ? 10 : w.p === 'X' ? -10 : 0 }; let bestM = { v: p === 'O' ? -99 : 99 }; s.forEach((c, i) => { if (c) return; s[i] = p; const r = minimax(s, p === 'O' ? 'X' : 'O'); s[i] = null; if (p === 'O' ? r.v > bestM.v : r.v < bestM.v) bestM = { v: r.v, i }; }); return bestM; }
      function reset() { b = Array(9).fill(null); turn = 'X'; over = false; render(); }
      function play(i) {
        if (over || b[i]) return; b[i] = turn; turn = turn === 'X' ? 'O' : 'X'; OS.sound('click'); const w = winner(b);
        if (w) { over = true; sc[w.p]++; render(w); return; }
        render();
        if (mode === 'cpu' && turn === 'O') setTimeout(() => { const empty = b.map((c, k) => (c ? -1 : k)).filter((k) => k >= 0); const mv = diff === 'easy' && Math.random() < 0.6 ? empty[Math.random() * empty.length | 0] : minimax(b.slice(), 'O').i; play(mv); }, 350);
      }
      function render(w) {
        board.innerHTML = b.map((c, i) => `<button class="${c ? c.toLowerCase() : ''} ${w && w.l && w.l.includes(i) ? 'win' : ''}" data-i="${i}">${c || ''}</button>`).join('');
        board.querySelectorAll('button').forEach((x) => (x.onclick = () => { if (mode === 'cpu' && turn === 'O') return; play(+x.dataset.i); }));
        win.body.querySelector('[data-msg]').textContent = w ? (w.p === 'D' ? "It's a draw!" : `${w.p} wins!`) : `${turn}'s turn`;
        win.body.querySelector('[data-x]').textContent = sc.X; win.body.querySelector('[data-o]').textContent = sc.O; win.body.querySelector('[data-dr]').textContent = sc.D;
        win.body.querySelectorAll('[data-mode]').forEach((x) => x.classList.toggle('on', x.dataset.mode === mode)); win.body.querySelectorAll('[data-d]').forEach((x) => x.classList.toggle('on', x.dataset.d === diff)); win.body.querySelector('[data-diffs]').style.display = mode === 'cpu' ? '' : 'none';
      }
      win.body.querySelectorAll('[data-mode]').forEach((x) => (x.onclick = () => { mode = x.dataset.mode; sc = { X: 0, O: 0, D: 0 }; reset(); }));
      win.body.querySelectorAll('[data-d]').forEach((x) => (x.onclick = () => { diff = x.dataset.d; reset(); }));
      win.body.querySelector('[data-a=new]').onclick = reset;
      reset();
    },
  });

  /* ======================= SUDOKU ======================= */
  OS.registerApp({
    id: 'sudoku', name: 'Sudoku', icon: 'sudoku', color: ['#1fc8b0', '#118a7e'], cat: 'Games', w: 500, h: 680, desc: 'Number puzzle', launch(win) {
      let sol, puz, cur, given, sel = -1, diff = 'Medium', t0, timer;
      win.body.innerHTML = `<div class="game" style="justify-content:flex-start"><div class="game-head"><div class="seg">${['Easy', 'Medium', 'Hard'].map((d) => `<button data-d="${d}">${d}</button>`).join('')}</div><div class="stat"><small>Time</small><b data-t>0:00</b></div><button class="ibtn" data-a="hint" title="Hint">${gl('info')}</button><button class="ibtn" data-a="new">${gl('refresh')}</button></div><div class="sudoku" style="position:relative"></div><div class="numpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-n="${n}">${n}</button>`).join('')}<button data-n="0">${gl('eraser')}</button></div></div>`;
      const board = win.body.querySelector('.sudoku');
      function gen() {
        const g = Array(81).fill(0); const ok = (g, i, n) => { const r = Math.floor(i / 9), c = i % 9; for (let k = 0; k < 9; k++) if (g[r * 9 + k] === n || g[k * 9 + c] === n) return false; const br = r - r % 3, bc = c - c % 3; for (let a = 0; a < 3; a++) for (let b2 = 0; b2 < 3; b2++) if (g[(br + a) * 9 + bc + b2] === n) return false; return true; };
        const fill = (i) => { if (i === 81) return true; const ns = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5); for (const n of ns) if (ok(g, i, n)) { g[i] = n; if (fill(i + 1)) return true; g[i] = 0; } return false; };
        fill(0); sol = g.slice(); puz = g.slice(); const rm = { Easy: 36, Medium: 46, Hard: 54 }[diff]; const idx = [...Array(81).keys()].sort(() => Math.random() - 0.5); idx.slice(0, rm).forEach((i) => (puz[i] = 0));
        cur = puz.slice(); given = puz.map(Boolean); sel = -1; clearInterval(timer); t0 = Date.now(); timer = setInterval(() => (win.body.querySelector('[data-t]').textContent = OS.fmtDur((Date.now() - t0) / 1000)), 500);
        board.querySelector('.game-over')?.remove(); win.body.querySelectorAll('[data-d]').forEach((b) => b.classList.toggle('on', b.dataset.d === diff)); render();
      }
      const conflict = (i) => { const v = cur[i]; if (!v) return false; const r = Math.floor(i / 9), c = i % 9; for (let k = 0; k < 81; k++) { if (k === i || cur[k] !== v) continue; const r2 = Math.floor(k / 9), c2 = k % 9; if (r2 === r || c2 === c || (Math.floor(r2 / 3) === Math.floor(r / 3) && Math.floor(c2 / 3) === Math.floor(c / 3))) return true; } return false; };
      function render() {
        const sr = sel >= 0 ? Math.floor(sel / 9) : -1, sc = sel % 9;
        board.innerHTML = cur.map((v, i) => { const r = Math.floor(i / 9), c = i % 9; const hl = sel >= 0 && (r === sr || c === sc || (cur[sel] && v === cur[sel])); return `<div data-i="${i}" class="${given[i] ? 'given' : ''} ${i === sel ? 'sel' : hl ? 'hl' : ''} ${conflict(i) ? 'bad' : ''} ${c % 3 === 2 && c < 8 ? 'br' : ''} ${r % 3 === 2 && r < 8 ? 'bb' : ''}">${v || ''}</div>`; }).join('');
        board.querySelectorAll('[data-i]').forEach((d) => (d.onclick = () => { sel = +d.dataset.i; render(); }));
      }
      function put(n) {
        if (sel < 0 || given[sel]) return; cur[sel] = n; render();
        if (cur.every((v, i) => v === sol[i])) { clearInterval(timer); const t = Math.floor((Date.now() - t0) / 1000); bestLow('sudoku-' + diff, t); OS.sound('done'); overlay(board, 'Solved!', `${diff} in ${OS.fmtDur(t)}`, 'New puzzle', gen); }
      }
      win.body.querySelectorAll('[data-n]').forEach((b) => (b.onclick = () => put(+b.dataset.n)));
      win.body.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => { diff = b.dataset.d; gen(); }));
      win.body.querySelector('[data-a=new]').onclick = gen;
      win.body.querySelector('[data-a=hint]').onclick = () => { const e = cur.map((v, i) => (v !== sol[i] ? i : -1)).filter((i) => i >= 0); if (!e.length) return; const i = sel >= 0 && cur[sel] !== sol[sel] ? sel : e[Math.random() * e.length | 0]; sel = i; put(sol[i]); };
      OS.wm.keys(win, (e) => { if (/^[1-9]$/.test(e.key)) put(+e.key); else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') put(0); else { const d = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key]; if (d) { e.preventDefault(); sel = OS.clamp((sel < 0 ? 40 : sel) + d, 0, 80); render(); } } });
      win.onClose(() => clearInterval(timer));
      gen();
    },
  });

  /* ======================= PONG ======================= */
  OS.registerApp({
    id: 'pong', name: 'Pong', icon: 'pong', color: ['#3a3f4b', '#6c8cff'], cat: 'Games', w: 720, h: 520, desc: 'Paddle duel', launch(win) {
      const W = 640, H = 400; let p1, p2, ball, s1, s2, raf, keys = {}, running = false, vert = false;
      win.body.innerHTML = `<div class="game"><div class="game-head"><div class="stat"><small>You</small><b data-a>0</b></div><div class="stat"><small>CPU</small><b data-b>0</b></div></div><div class="gwrap" style="flex:1;width:100%;display:grid;place-items:center;min-height:0;position:relative"><canvas width="${W}" height="${H}"></canvas></div><div class="small muted">Move with mouse, touch, or ↑/↓ · first to 7 wins</div></div>`;
      const cv = win.body.querySelector('canvas'), g = cv.getContext('2d'), wrap = win.body.querySelector('.gwrap');
      function serve(dir) { ball = { x: W / 2, y: H / 2, vx: 5 * dir, vy: (Math.random() * 4 - 2) }; }
      function reset() { p1 = H / 2; p2 = H / 2; s1 = s2 = 0; serve(1); upd(); running = true; wrap.querySelector('.game-over')?.remove(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
      const upd = () => { win.body.querySelector('[data-a]').textContent = s1; win.body.querySelector('[data-b]').textContent = s2; };
      function loop() {
        raf = requestAnimationFrame(loop); if (!running) return;
        if (keys.ArrowUp || keys.ArrowLeft) p1 -= 7; if (keys.ArrowDown || keys.ArrowRight) p1 += 7; p1 = OS.clamp(p1, 40, H - 40);
        p2 += OS.clamp(ball.y - p2, -4.2, 4.2) * (ball.vx > 0 ? 1 : 0.3); p2 = OS.clamp(p2, 40, H - 40);
        ball.x += ball.vx; ball.y += ball.vy; if (ball.y < 8 || ball.y > H - 8) { ball.vy *= -1; ball.y = OS.clamp(ball.y, 8, H - 8); }
        const hit = (px, py) => Math.abs(ball.x - px) < 12 && Math.abs(ball.y - py) < 44;
        if (ball.vx < 0 && hit(24, p1)) { ball.vx = Math.min(14, -ball.vx * 1.06); ball.vy += (ball.y - p1) / 8; OS.sound('click'); }
        if (ball.vx > 0 && hit(W - 24, p2)) { ball.vx = Math.max(-14, -ball.vx * 1.06); ball.vy += (ball.y - p2) / 8; OS.sound('click'); }
        if (ball.x < 0) { s2++; upd(); serve(1); } if (ball.x > W) { s1++; upd(); serve(-1); }
        if (s1 >= 7 || s2 >= 7) { running = false; if (s1 >= 7) OS.sound('done'); overlay(wrap, s1 >= 7 ? 'You win!' : 'CPU wins', `${s1} – ${s2}`, 'Play again', reset); }
        const ac = OS.settings.accent; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0d0f14'; g.fillRect(0, 0, cv.width, cv.height); if (vert) g.setTransform(0, -1, 1, 0, 0, W); g.strokeStyle = '#ffffff22'; g.setLineDash([8, 10]); g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke(); g.setLineDash([]);
        g.fillStyle = ac; g.beginPath(); g.roundRect(16, p1 - 40, 10, 80, 5); g.fill(); g.fillStyle = '#ff8a5c'; g.beginPath(); g.roundRect(W - 26, p2 - 40, 10, 80, 5); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(ball.x, ball.y, 8, 0, 7); g.fill();
      }
      const aim = (e) => { const r = cv.getBoundingClientRect(); p1 = vert ? (e.clientX - r.left) * H / r.width : (e.clientY - r.top) * H / r.height; };
      cv.addEventListener('pointermove', aim);
      cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); aim(e); });
      OS.wm.keys(win, (e) => { if (e.key.startsWith('Arrow')) { e.preventDefault(); keys[e.key] = true; } });
      const ku = (e) => (keys[e.key] = false); document.addEventListener('keyup', ku);
      win.onResize = () => { const r = wrap.getBoundingClientRect(); const v = r.height > r.width * 1.1; if (v !== vert) { vert = v; cv.width = vert ? H : W; cv.height = vert ? W : H; win.body.querySelector('.small.muted').textContent = vert ? 'Drag left/right to move your paddle (bottom) · first to 7 wins' : 'Move with mouse, touch, or ↑/↓ · first to 7 wins'; } fitCanvas(cv, wrap, vert ? H / W : W / H, 900); }; win.onClose(() => { cancelAnimationFrame(raf); document.removeEventListener('keyup', ku); });
      setTimeout(win.onResize, 0); reset();
    },
  });

  /* ======================= BRICKS ======================= */
  OS.registerApp({
    id: 'bricks', name: 'Bricks', icon: 'brick', color: ['#ff9f43', '#e5484d'], cat: 'Games', w: 600, h: 640, desc: 'Break the bricks', launch(win) {
      const W = 480, H = 560; let px, ball, bricks, lives, score, level, stuck, raf;
      win.body.innerHTML = `<div class="game"><div class="game-head"><div class="stat"><small>Score</small><b data-s>0</b></div><div class="stat"><small>Lives</small><b data-l>3</b></div><div class="stat"><small>Level</small><b data-v>1</b></div><div class="stat"><small>Best</small><b data-b></b></div></div><div class="gwrap" style="flex:1;width:100%;display:grid;place-items:center;min-height:0;position:relative"><canvas width="${W}" height="${H}"></canvas></div><div class="small muted">Move with mouse/touch or ←/→ · tap or Space to launch</div></div>`;
      const cv = win.body.querySelector('canvas'), g = cv.getContext('2d'), wrap = win.body.querySelector('.gwrap'); const keys = {};
      function build() { bricks = []; const rows = Math.min(8, 4 + level); for (let r = 0; r < rows; r++) for (let c = 0; c < 8; c++) if (level < 3 || (r + c) % (level % 3 + 2)) bricks.push({ x: 8 + c * 58, y: 50 + r * 24, w: 54, h: 20, hp: r < level - 1 ? 2 : 1, c: `hsl(${r * 40 + level * 30},75%,58%)` }); }
      function attach() { stuck = true; ball = { x: px, y: H - 40, vx: 0, vy: 0, r: 7 }; }
      function reset() { px = W / 2; lives = 3; score = 0; level = 1; build(); attach(); upd(); wrap.querySelector('.game-over')?.remove(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
      const upd = () => { win.body.querySelector('[data-s]').textContent = score; win.body.querySelector('[data-l]').textContent = lives; win.body.querySelector('[data-v]').textContent = level; win.body.querySelector('[data-b]').textContent = best('bricks', score); };
      const launch = () => { if (stuck) { stuck = false; const sp = 5 + level * 0.4; ball.vx = sp * (Math.random() - 0.5); ball.vy = -sp; } };
      function loop() {
        raf = requestAnimationFrame(loop);
        if (keys.ArrowLeft) px -= 8; if (keys.ArrowRight) px += 8; px = OS.clamp(px, 45, W - 45);
        if (stuck) { ball.x = px; } else {
          ball.x += ball.vx; ball.y += ball.vy;
          if (ball.x < ball.r || ball.x > W - ball.r) { ball.vx *= -1; ball.x = OS.clamp(ball.x, ball.r, W - ball.r); }
          if (ball.y < ball.r) { ball.vy *= -1; ball.y = ball.r; }
          if (ball.vy > 0 && ball.y > H - 34 && ball.y < H - 18 && Math.abs(ball.x - px) < 50) { const sp = Math.hypot(ball.vx, ball.vy); const a = (ball.x - px) / 50 * 1.1; ball.vx = sp * Math.sin(a); ball.vy = -sp * Math.cos(a); OS.sound('click'); }
          if (ball.y > H + 10) { lives--; upd(); if (lives <= 0) { cancelAnimationFrame(raf); OS.sound('error'); best('bricks', score); overlay(wrap, 'Game over', `Score: ${score}`, 'Play again', reset); return; } attach(); }
          for (const b of bricks) { if (ball.x > b.x - ball.r && ball.x < b.x + b.w + ball.r && ball.y > b.y - ball.r && ball.y < b.y + b.h + ball.r) { const ox = Math.min(ball.x - (b.x - ball.r), b.x + b.w + ball.r - ball.x), oy = Math.min(ball.y - (b.y - ball.r), b.y + b.h + ball.r - ball.y); if (ox < oy) ball.vx *= -1; else ball.vy *= -1; b.hp--; if (b.hp <= 0) { bricks.splice(bricks.indexOf(b), 1); score += 10 * level; } upd(); break; } }
          if (!bricks.length) { level++; OS.sound('done'); build(); attach(); upd(); }
        }
        g.fillStyle = '#12141a'; g.fillRect(0, 0, W, H);
        bricks.forEach((b) => { g.fillStyle = b.c; g.globalAlpha = b.hp > 1 ? 1 : 0.85; g.beginPath(); g.roundRect(b.x, b.y, b.w, b.h, 5); g.fill(); if (b.hp > 1) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); } }); g.globalAlpha = 1;
        g.fillStyle = OS.settings.accent; g.beginPath(); g.roundRect(px - 45, H - 30, 90, 12, 6); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(ball.x, ball.y, ball.r, 0, 7); g.fill();
        if (stuck) { g.fillStyle = '#ffffff99'; g.font = '16px system-ui'; g.textAlign = 'center'; g.fillText('Tap or press Space to launch', W / 2, H / 2 + 60); }
      }
      const mv = (e) => { const r = cv.getBoundingClientRect(); px = (e.clientX - r.left) * W / r.width; };
      cv.addEventListener('pointermove', mv); cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); mv(e); launch(); });
      OS.wm.keys(win, (e) => { if (e.key.startsWith('Arrow')) { e.preventDefault(); keys[e.key] = true; } if (e.key === ' ') { e.preventDefault(); launch(); } });
      const ku = (e) => (keys[e.key] = false); document.addEventListener('keyup', ku);
      win.onResize = () => fitCanvas(cv, wrap, W / H, 560); win.onClose(() => { cancelAnimationFrame(raf); document.removeEventListener('keyup', ku); });
      setTimeout(win.onResize, 0); reset();
    },
  });

  /* ======================= TYPING TEST ======================= */
  const TEXTS = ['The quick brown fox jumps over the lazy dog while the sun sets behind the quiet hills.', 'A terminal is a window into the heart of the machine, where every command tells a small story.', 'Clouds drift slowly across the sky, changing shape as the wind carries them over the sea.', 'Practice makes progress, and every keystroke brings your fingers closer to effortless speed.', 'Open source software is built by people all over the world who share their code freely.'];
  OS.registerApp({
    id: 'typing', name: 'Typing Test', icon: 'keyboard', color: ['#5ee7a0', '#2bb3ff'], cat: 'Games', w: 680, h: 440, desc: 'Measure your typing speed', launch(win) {
      let text, t0, done;
      win.body.innerHTML = `<div class="game"><div class="game-head"><div class="stat"><small>WPM</small><b data-w>0</b></div><div class="stat"><small>Accuracy</small><b data-a>100%</b></div><div class="stat"><small>Best</small><b data-b>${best('typing')}</b></div><button class="btn sm" data-n>${gl('refresh')}New</button></div><div class="card" data-t style="font-size:20px;line-height:1.7;max-width:600px;font-family:var(--mono)"></div><input class="inp" style="width:min(600px,100%);font-size:18px" placeholder="Start typing here…" autocomplete="off" autocapitalize="off" spellcheck="false"></div>`;
      const inp = win.body.querySelector('input'), tx = win.body.querySelector('[data-t]');
      function reset() { text = TEXTS[Math.random() * TEXTS.length | 0]; t0 = null; done = false; inp.value = ''; inp.disabled = false; render(); inp.focus(); }
      function render() { const v = inp.value; tx.innerHTML = [...text].map((c, i) => `<span style="${i < v.length ? (v[i] === c ? 'color:#3fdc77' : 'color:#ff6b6b;background:#ff6b6b22') : i === v.length ? 'border-bottom:2px solid var(--accent)' : 'color:var(--fg3)'}">${esc(c)}</span>`).join('');
        if (t0) { const m = (Date.now() - t0) / 60000; const correct = [...v].filter((c, i) => c === text[i]).length; win.body.querySelector('[data-w]').textContent = Math.round(correct / 5 / Math.max(m, 0.01)); win.body.querySelector('[data-a]').textContent = Math.round(correct / Math.max(1, v.length) * 100) + '%'; } }
      inp.oninput = () => { if (done) return; if (!t0) t0 = Date.now(); render(); if (inp.value.length >= text.length) { done = true; inp.disabled = true; const w = +win.body.querySelector('[data-w]').textContent; win.body.querySelector('[data-b]').textContent = best('typing', w); OS.sound('done'); OS.notify('Typing test', `${w} WPM · ${win.body.querySelector('[data-a]').textContent} accuracy`, { app: 'typing' }); } };
      win.body.querySelector('[data-n]').onclick = reset; win.onFocus = () => inp.focus();
      reset();
    },
  });
})();
