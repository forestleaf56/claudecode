/* Cirrus Linux — extra apps & games for the Software store, plus fun terminal programs */
(function () {
  'use strict';
  const esc = OS.esc, gl = OS.glyph;
  const best = (k, v, low) => { const s = OS.store.get('scores', {}); if (v !== undefined && (s[k] === undefined || (low ? v < s[k] : v > s[k]))) { s[k] = v; OS.store.set('scores', s); } return s[k]; };
  const fitCanvas = (cv, host, aspect, max = 900) => { const r = host.getBoundingClientRect(); let w = Math.min(max, r.width - 16), h = w / aspect; if (h > r.height - 16) { h = r.height - 16; w = h * aspect; } cv.style.width = Math.max(100, w) + 'px'; cv.style.height = Math.max(100 / aspect, h) + 'px'; };
  const overlay = (host, title, sub, btn, fn) => { host.style.position = 'relative'; host.querySelector('.game-over')?.remove(); const o = OS.el(`<div class="game-over"><div><h2>${title}</h2><p>${sub}</p><button class="btn primary">${btn}</button></div></div>`); o.querySelector('button').onclick = () => { o.remove(); fn(); }; host.appendChild(o); };
  const tone = (f, d = 0.12, type = 'sine', v = 0.15) => { const A = OS.audio(); if (!A || !OS.settings.sounds) return; const o = A.createOscillator(), g = A.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v * OS.settings.volume / 100, A.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, A.currentTime + d); o.connect(g).connect(A.destination); o.start(); o.stop(A.currentTime + d + 0.05); };

  /* =================== SOLITAIRE (Klondike) =================== */
  OS.registerApp({ id: 'solitaire', name: 'Solitaire', icon: 'cards', color: ['#1f9d55', '#0b5d32'], cat: 'Games', w: 820, h: 640, desc: 'Klondike solitaire', launch(win) {
    const SUITS = ['♠', '♥', '♦', '♣'], RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    let st, sel = null, moves = 0, t0, timer, history = [], draw3 = OS.store.get('sol-draw3', false);
    win.body.innerHTML = `<div class="sol"><div class="toolbar sol-tb"><button class="btn sm" data-a="new">${gl('refresh')}New game</button><button class="btn sm" data-a="undo">${gl('undo')}Undo</button><button class="btn sm" data-a="auto">${gl('zap')}Auto finish</button><label class="small row" style="gap:4px"><input type="checkbox" data-a="d3" ${draw3 ? 'checked' : ''}> Draw 3</label><span class="spacer"></span><span class="small" data-st></span></div><div class="sol-table"></div></div>`;
    const T = win.body.querySelector('.sol-table');
    const red = (c) => c.s === 1 || c.s === 2;
    function deal() { const deck = []; for (let s = 0; s < 4; s++) for (let r = 0; r < 13; r++) deck.push({ s, r, up: false }); for (let i = deck.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [deck[i], deck[j]] = [deck[j], deck[i]]; } st = { stock: [], waste: [], found: [[], [], [], []], tab: [[], [], [], [], [], [], []] }; for (let i = 0; i < 7; i++) for (let j = i; j < 7; j++) { const c = deck.pop(); c.up = j === i; st.tab[j].push(c); } st.stock = deck; sel = null; moves = 0; history = []; t0 = Date.now(); clearInterval(timer); timer = setInterval(stat, 1000); T.querySelector('.game-over')?.remove(); render(); }
    const snap = () => { history.push(JSON.stringify(st)); if (history.length > 200) history.shift(); };
    const stat = () => (win.body.querySelector('[data-st]').textContent = `Moves ${moves} · ${OS.fmtDur((Date.now() - t0) / 1000)}`);
    const cardHtml = (c, attrs = '') => (c.up ? `<div class="pcard ${red(c) ? 'red' : ''}" ${attrs}><b>${RANKS[c.r]}<i>${SUITS[c.s]}</i></b><span>${SUITS[c.s]}</span><b class="br">${RANKS[c.r]}<i>${SUITS[c.s]}</i></b></div>` : `<div class="pcard back" ${attrs}></div>`);
    const canFound = (c, f) => (f.length ? f[f.length - 1].s === c.s && f[f.length - 1].r === c.r - 1 : c.r === 0);
    const canTab = (c, t) => (t.length ? t[t.length - 1].up && red(t[t.length - 1]) !== red(c) && t[t.length - 1].r === c.r + 1 : c.r === 12);
    function take(src) { if (src.p === 'waste') return [st.waste.pop()]; if (src.p === 'found') return [st.found[src.i].pop()]; return st.tab[src.i].splice(src.j); }
    function peek(src) { if (src.p === 'waste') return [st.waste[st.waste.length - 1]]; if (src.p === 'found') return [st.found[src.i][st.found[src.i].length - 1]]; return st.tab[src.i].slice(src.j); }
    function moveTo(src, dst) {
      const cards = peek(src); if (!cards[0]) return false; const c = cards[0];
      if (dst.p === 'found') { if (cards.length !== 1 || !canFound(c, st.found[dst.i])) return false; } else if (dst.p === 'tab') { if (dst.i === src.i && src.p === 'tab') return false; if (!canTab(c, st.tab[dst.i])) return false; } else return false;
      snap(); const mv = take(src); (dst.p === 'found' ? st.found[dst.i] : st.tab[dst.i]).push(...mv); if (src.p === 'tab') { const t = st.tab[src.i]; if (t.length && !t[t.length - 1].up) t[t.length - 1].up = true; } moves++; tone(500, 0.05); return true;
    }
    function autoMove(src) { const c = peek(src)[0]; if (!c) return false; if (peek(src).length === 1) for (let i = 0; i < 4; i++) if (moveTo(src, { p: 'found', i })) return true; for (let i = 0; i < 7; i++) { const t = st.tab[(i + (src.i || 0) + 1) % 7]; if (t.length && canTab(c, t) && moveTo(src, { p: 'tab', i: (i + (src.i || 0) + 1) % 7 })) return true; } for (let i = 0; i < 7; i++) if (!st.tab[i].length && c.r === 12 && !(src.p === 'tab' && src.j === 0) && moveTo(src, { p: 'tab', i })) return true; return false; }
    function render() {
      const w = st.waste.slice(draw3 ? -3 : -1);
      T.innerHTML = `<div class="sol-top"><div class="pile stock" data-p="stock">${st.stock.length ? cardHtml({ up: false }) : `<div class="pile-empty">${gl('refresh')}</div>`}</div><div class="pile waste" data-p="waste">${w.map((c, i) => cardHtml(c, `style="left:${i * 18}px" ${i === w.length - 1 ? 'data-top' : ''}`)).join('')}</div><div class="sol-gap"></div>${st.found.map((f, i) => `<div class="pile found" data-p="found" data-i="${i}">${f.length ? cardHtml(f[f.length - 1], 'data-top') : `<div class="pile-empty">${SUITS[i]}</div>`}</div>`).join('')}</div>
        <div class="sol-tab">${st.tab.map((t, i) => `<div class="pile tab" data-p="tab" data-i="${i}">${t.length ? t.map((c, j) => cardHtml(c, `data-j="${j}" style="top:calc(${t.slice(0, j).reduce((a, x) => a + (x.up ? 1 : 0.45), 0)} * var(--fan))"`)).join('') : '<div class="pile-empty"></div>'}</div>`).join('')}</div>`;
      if (sel) { const el = sel.p === 'tab' ? T.querySelector(`.tab[data-i="${sel.i}"] [data-j="${sel.j}"]`) : T.querySelector(`[data-p="${sel.p}"]${sel.p === 'found' ? `[data-i="${sel.i}"]` : ''} [data-top]`); el && el.classList.add('sel'); }
      stat();
      if (st.found.every((f) => f.length === 13)) { clearInterval(timer); const t = Math.floor((Date.now() - t0) / 1000); best('solitaire', t, true); OS.confetti && OS.confetti(200); OS.sound('done'); overlay(T, 'You win! 🎉', `${moves} moves in ${OS.fmtDur(t)}`, 'Play again', deal); }
    }
    T.addEventListener('click', (e) => {
      const pile = e.target.closest('.pile'); if (!pile) { sel = null; render(); return; }
      const p = pile.dataset.p, i = +pile.dataset.i; const card = e.target.closest('.pcard');
      if (p === 'stock') { snap(); if (st.stock.length) { for (let k = 0; k < (draw3 ? 3 : 1) && st.stock.length; k++) { const c = st.stock.pop(); c.up = true; st.waste.push(c); } } else { st.stock = st.waste.reverse().map((c) => ({ ...c, up: false })); st.waste = []; } sel = null; tone(300, 0.04); render(); return; }
      let src = null;
      if (card && card.classList.contains('back')) return;
      if (p === 'waste' && st.waste.length) src = { p: 'waste' }; else if (p === 'found' && st.found[i].length) src = { p: 'found', i }; else if (p === 'tab' && card) src = { p: 'tab', i, j: +card.dataset.j };
      if (sel) { const dst = p === 'found' ? { p: 'found', i } : p === 'tab' ? { p: 'tab', i } : null; const ok = dst && moveTo(sel, dst); sel = null; if (ok || !src) { render(); return; } }
      if (src) { if (!autoMove(src)) sel = src; render(); }
    });
    win.body.querySelector('[data-a=new]').onclick = deal;
    win.body.querySelector('[data-a=undo]').onclick = () => { if (history.length) { st = JSON.parse(history.pop()); sel = null; render(); } };
    win.body.querySelector('[data-a=auto]').onclick = async () => { let any = true; while (any) { any = false; const srcs = [{ p: 'waste' }, ...st.tab.map((t, i) => ({ p: 'tab', i, j: t.length - 1 }))]; for (const s of srcs) { if (!peek(s)[0] || (s.p === 'tab' && s.j < 0)) continue; for (let f = 0; f < 4; f++) if (moveTo(s, { p: 'found', i: f })) { any = true; render(); await OS.sleep(90); break; } } } };
    win.body.querySelector('[data-a=d3]').onchange = (e) => { draw3 = e.target.checked; OS.store.set('sol-draw3', draw3); render(); };
    win.onClose(() => clearInterval(timer)); deal();
  } });

  /* =================== CHESS =================== */
  OS.registerApp({ id: 'chess', name: 'Chess', icon: 'crown', color: ['#8b6b4a', '#4a3424'], cat: 'Games', w: 720, h: 720, desc: 'Chess vs computer', launch(win) {
    const GLYPH = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
    const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
    let B, turn, sel = null, legal = [], cast, ep, history = [], mode = 'cpu', level = OS.store.get('chess-lvl', 2), over = false, last = null, thinking = false;
    win.body.innerHTML = `<div class="game" style="justify-content:flex-start"><div class="game-head"><div class="seg"><button data-m="cpu">vs CPU</button><button data-m="2p">2 Players</button></div><div class="seg" data-lv>${['Easy', 'Medium', 'Hard'].map((l, i) => `<button data-l="${i + 1}">${l}</button>`).join('')}</div><button class="btn sm" data-a="undo">${gl('undo')}</button><button class="btn sm" data-a="new">${gl('refresh')}New</button></div><div class="chess-msg" data-msg></div><div class="chess-wrap"><div class="chess"></div></div><div class="small muted" data-cap></div></div>`;
    const board = win.body.querySelector('.chess'), wrap = win.body.querySelector('.chess-wrap');
    const isW = (p) => p && p === p.toUpperCase(); const col = (p) => (p ? (isW(p) ? 'w' : 'b') : null);
    function reset() { B = 'rnbqkbnrpppppppp' + '.'.repeat(32) + 'PPPPPPPPRNBQKBNR'; B = B.split('').map((c) => (c === '.' ? null : c)); turn = 'w'; cast = { K: true, Q: true, k: true, q: true }; ep = -1; history = []; sel = null; legal = []; over = false; last = null; render(); }
    function pseudo(b, sq, c, ep2, cs) {
      const p = b[sq]; if (!p || col(p) !== c) return []; const out = []; const r = sq >> 3, f = sq & 7; const t = p.toLowerCase(); const add = (to, flag) => out.push({ from: sq, to, flag });
      const slide = (dirs, one) => dirs.forEach(([dr, df]) => { let rr = r + dr, ff = f + df; while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) { const q = b[rr * 8 + ff]; if (!q) add(rr * 8 + ff); else { if (col(q) !== c) add(rr * 8 + ff); break; } if (one) break; rr += dr; ff += df; } });
      if (t === 'p') { const d = c === 'w' ? -1 : 1, start = c === 'w' ? 6 : 1; const one = sq + d * 8; if (r + d >= 0 && r + d < 8 && !b[one]) { add(one); if (r === start && !b[one + d * 8]) add(one + d * 8, 'double'); } [-1, 1].forEach((df) => { const ff = f + df; if (ff < 0 || ff > 7) return; const to = (r + d) * 8 + ff; if (b[to] && col(b[to]) !== c) add(to); if (to === ep2) add(to, 'ep'); }); }
      else if (t === 'n') slide([[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]], true);
      else if (t === 'b') slide([[1, 1], [1, -1], [-1, 1], [-1, -1]]); else if (t === 'r') slide([[1, 0], [-1, 0], [0, 1], [0, -1]]); else if (t === 'q') slide([[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]);
      else if (t === 'k') { slide([[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]], true); const home = c === 'w' ? 60 : 4; if (sq === home && cs) { const K = c === 'w' ? 'K' : 'k', Q = c === 'w' ? 'Q' : 'q'; if (cs[K] && !b[home + 1] && !b[home + 2] && b[home + 3] && b[home + 3].toLowerCase() === 'r') add(home + 2, 'castleK'); if (cs[Q] && !b[home - 1] && !b[home - 2] && !b[home - 3] && b[home - 4] && b[home - 4].toLowerCase() === 'r') add(home - 2, 'castleQ'); } }
      return out;
    }
    const attacked = (b, sq, by) => { for (let i = 0; i < 64; i++) if (b[i] && col(b[i]) === by && pseudo(b, i, by, -1, null).some((m) => m.to === sq)) return true; return false; };
    const kingSq = (b, c) => b.indexOf(c === 'w' ? 'K' : 'k');
    function apply(b, m) { const n = b.slice(); const p = n[m.from]; n[m.to] = p; n[m.from] = null; if (m.flag === 'ep') n[m.to + (col(p) === 'w' ? 8 : -8)] = null; if (m.flag === 'castleK') { n[m.to - 1] = n[m.to + 1]; n[m.to + 1] = null; } if (m.flag === 'castleQ') { n[m.to + 1] = n[m.to - 2]; n[m.to - 2] = null; } if (p.toLowerCase() === 'p' && (m.to < 8 || m.to >= 56)) n[m.to] = col(p) === 'w' ? 'Q' : 'q'; return n; }
    function legalMoves(b, c, ep2, cs) { const out = []; const opp = c === 'w' ? 'b' : 'w'; for (let i = 0; i < 64; i++) if (b[i] && col(b[i]) === c) pseudo(b, i, c, ep2, cs).forEach((m) => { if (m.flag && m.flag.startsWith('castle')) { if (attacked(b, m.from, opp) || attacked(b, (m.from + m.to) / 2, opp)) return; } const n = apply(b, m); if (!attacked(n, kingSq(n, c), opp)) out.push(m); }); return out; }
    const PST = (t, sq, c) => { const r = c === 'w' ? sq >> 3 : 7 - (sq >> 3), f = sq & 7; const center = 3.5 - Math.abs(3.5 - f) + 3.5 - Math.abs(3.5 - r); if (t === 'p') return (6 - r) * 8 + (f > 1 && f < 6 ? 6 : 0); if (t === 'n' || t === 'b') return center * 5; if (t === 'k') return r > 5 ? 10 : -10; return center * 1.5; };
    const evalB = (b) => { let s = 0; for (let i = 0; i < 64; i++) { const p = b[i]; if (!p) continue; const t = p.toLowerCase(); const v = VAL[t] + PST(t, i, col(p)); s += isW(p) ? v : -v; } return s; };
    function search(b, depth, alpha, beta, c, ep2) { const ms = legalMoves(b, c, ep2, null); if (!ms.length) { const opp = c === 'w' ? 'b' : 'w'; return attacked(b, kingSq(b, c), opp) ? (c === 'w' ? -99999 - depth : 99999 + depth) : 0; } if (depth === 0) return evalB(b); ms.sort((x, y) => (b[y.to] ? VAL[b[y.to].toLowerCase()] : 0) - (b[x.to] ? VAL[b[x.to].toLowerCase()] : 0)); if (c === 'w') { let v = -1e9; for (const m of ms) { v = Math.max(v, search(apply(b, m), depth - 1, alpha, beta, 'b', m.flag === 'double' ? (m.from + m.to) / 2 : -1)); alpha = Math.max(alpha, v); if (beta <= alpha) break; } return v; } let v = 1e9; for (const m of ms) { v = Math.min(v, search(apply(b, m), depth - 1, alpha, beta, 'w', m.flag === 'double' ? (m.from + m.to) / 2 : -1)); beta = Math.min(beta, v); if (beta <= alpha) break; } return v; }
    function doMove(m) {
      history.push({ B: B.slice(), turn, cast: { ...cast }, ep, last }); const p = B[m.from];
      B = apply(B, m); ep = m.flag === 'double' ? (m.from + m.to) / 2 : -1; last = m;
      if (p === 'K') cast.K = cast.Q = false; if (p === 'k') cast.k = cast.q = false; [[63, 'K'], [56, 'Q'], [7, 'k'], [0, 'q']].forEach(([s, k]) => { if (m.from === s || m.to === s) cast[k] = false; });
      turn = turn === 'w' ? 'b' : 'w'; sel = null; legal = []; tone(m.flag ? 660 : 440, 0.06, 'triangle'); render();
      if (!over && mode === 'cpu' && turn === 'b') { thinking = true; render(); setTimeout(cpu, 120); }
    }
    function cpu() { const ms = legalMoves(B, 'b', ep, cast); if (!ms.length) { thinking = false; return render(); } let bestM = ms[0], bv = 1e9; const depth = level === 1 ? 1 : level === 2 ? 2 : 3; ms.forEach((m) => { const v = search(apply(B, m), depth - 1, -1e9, 1e9, 'w', m.flag === 'double' ? (m.from + m.to) / 2 : -1) + (level === 1 ? Math.random() * 120 : Math.random() * 8); if (v < bv) { bv = v; bestM = m; } }); thinking = false; doMove(bestM); }
    function render() {
      const ms = legalMoves(B, turn, ep, cast); const inCheck = attacked(B, kingSq(B, turn), turn === 'w' ? 'b' : 'w');
      let msg = thinking ? 'Computer is thinking…' : `${turn === 'w' ? 'White' : 'Black'} to move${inCheck ? ' — check!' : ''}`;
      if (!ms.length) { over = true; msg = inCheck ? `Checkmate! ${turn === 'w' ? 'Black' : 'White'} wins` : 'Stalemate — draw'; if (inCheck && turn === 'b') OS.confetti && OS.confetti(); }
      win.body.querySelector('[data-msg]').textContent = msg;
      board.innerHTML = B.map((p, i) => { const r = i >> 3, f = i & 7; const isL = legal.some((m) => m.to === i); return `<div class="sq ${(r + f) % 2 ? 'd' : 'l'} ${sel === i ? 'sel' : ''} ${last && (last.from === i || last.to === i) ? 'last' : ''} ${inCheck && i === kingSq(B, turn) ? 'chk' : ''}" data-i="${i}">${p ? `<span class="pc ${isW(p) ? 'w' : 'b'}">${GLYPH[p.toLowerCase()]}</span>` : ''}${isL ? `<i class="${p ? 'cap' : 'dot'}"></i>` : ''}${f === 0 ? `<em class="rk">${8 - r}</em>` : ''}${r === 7 ? `<em class="fl">${'abcdefgh'[f]}</em>` : ''}</div>`; }).join('');
      const caps = (c) => { const start = { p: 8, n: 2, b: 2, r: 2, q: 1 }; let s = ''; Object.keys(start).forEach((t) => { const have = B.filter((x) => x && x.toLowerCase() === t && col(x) === c).length; s += GLYPH[t].repeat(Math.max(0, start[t] - have)); }); return s; };
      win.body.querySelector('[data-cap]').textContent = `Captured — by White: ${caps('b') || '–'}   by Black: ${caps('w') || '–'}`;
      win.body.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('on', b.dataset.m === mode)); win.body.querySelectorAll('[data-l]').forEach((b) => b.classList.toggle('on', +b.dataset.l === level)); win.body.querySelector('[data-lv]').style.display = mode === 'cpu' ? '' : 'none';
    }
    board.addEventListener('click', (e) => { const sq = e.target.closest('.sq'); if (!sq || over || thinking || (mode === 'cpu' && turn === 'b')) return; const i = +sq.dataset.i; const m = legal.find((x) => x.to === i); if (m) return doMove(m); if (B[i] && col(B[i]) === turn) { sel = i; legal = legalMoves(B, turn, ep, cast).filter((x) => x.from === i); } else { sel = null; legal = []; } render(); });
    win.body.querySelector('[data-a=new]').onclick = reset;
    win.body.querySelector('[data-a=undo]').onclick = () => { if (thinking) return; const n = mode === 'cpu' ? 2 : 1; for (let k = 0; k < n && history.length; k++) { const h = history.pop(); B = h.B; turn = h.turn; cast = h.cast; ep = h.ep; last = h.last; } over = false; sel = null; legal = []; render(); };
    win.body.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { mode = b.dataset.m; reset(); }));
    win.body.querySelectorAll('[data-l]').forEach((b) => (b.onclick = () => { level = +b.dataset.l; OS.store.set('chess-lvl', level); render(); }));
    const fit = () => { const r = wrap.getBoundingClientRect(); const s = Math.max(240, Math.min(r.width - 8, r.height - 8, 640)); board.style.width = board.style.height = s + 'px'; }; win.onResize = fit; new ResizeObserver(fit).observe(wrap);
    reset();
  } });

  /* =================== SPACE ROCKS =================== */
  OS.registerApp({ id: 'rocks', name: 'Space Rocks', icon: 'rocket', color: ['#30336b', '#130f40'], cat: 'Games', w: 760, h: 600, desc: 'Asteroid shooter', launch(win) {
    const W = 800, H = 600; let ship, rocks, shots, parts, score, lives, level, raf, keys = {}, over = false, inv = 0;
    win.body.innerHTML = `<div class="game"><div class="game-head"><div class="stat"><small>Score</small><b data-s>0</b></div><div class="stat"><small>Lives</small><b data-l>3</b></div><div class="stat"><small>Best</small><b data-b>${best('rocks') || 0}</b></div></div><div class="gwrap" style="flex:1;width:100%;display:grid;place-items:center;min-height:0;position:relative"><canvas width="${W}" height="${H}" style="background:#05060f"></canvas></div><div class="rocks-pad"><button data-k="ArrowLeft">${gl('rotate')}</button><button data-k="ArrowRight" style="transform:scaleX(-1)">${gl('rotate')}</button><button data-k="ArrowUp">${gl('rocket')}</button><button data-k=" " class="fire">${gl('zap')}</button></div></div>`;
    const cv = win.body.querySelector('canvas'), g = cv.getContext('2d'), wrap = win.body.querySelector('.gwrap');
    const rock = (x, y, s) => ({ x, y, s, vx: (Math.random() - 0.5) * (4 - s) * 1.3, vy: (Math.random() - 0.5) * (4 - s) * 1.3, a: 0, va: (Math.random() - 0.5) * 0.05, pts: Array.from({ length: 10 }, () => 0.75 + Math.random() * 0.35) });
    const R = (s) => [0, 16, 30, 52][s];
    function newLevel() { rocks = []; for (let i = 0; i < 3 + level; i++) { let x, y; do { x = Math.random() * W; y = Math.random() * H; } while (Math.hypot(x - ship.x, y - ship.y) < 180); rocks.push(rock(x, y, 3)); } }
    function reset() { ship = { x: W / 2, y: H / 2, a: -Math.PI / 2, vx: 0, vy: 0, cool: 0 }; shots = []; parts = []; score = 0; lives = 3; level = 1; over = false; inv = 120; newLevel(); upd(); wrap.querySelector('.game-over')?.remove(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
    const upd = () => { win.body.querySelector('[data-s]').textContent = score; win.body.querySelector('[data-l]').textContent = lives; win.body.querySelector('[data-b]').textContent = best('rocks', score) || 0; };
    const boom = (x, y, n, c) => { for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, l: 40, c }); };
    function loop() {
      raf = requestAnimationFrame(loop);
      if (!over) {
        if (keys.ArrowLeft) ship.a -= 0.075; if (keys.ArrowRight) ship.a += 0.075;
        if (keys.ArrowUp) { ship.vx += Math.cos(ship.a) * 0.18; ship.vy += Math.sin(ship.a) * 0.18; if (Math.random() < 0.5) parts.push({ x: ship.x - Math.cos(ship.a) * 14, y: ship.y - Math.sin(ship.a) * 14, vx: -Math.cos(ship.a) * 2 + (Math.random() - 0.5), vy: -Math.sin(ship.a) * 2 + (Math.random() - 0.5), l: 15, c: '#ffb347' }); }
        ship.vx *= 0.99; ship.vy *= 0.99; ship.x = (ship.x + ship.vx + W) % W; ship.y = (ship.y + ship.vy + H) % H; ship.cool--; inv--;
        if (keys[' '] && ship.cool <= 0 && shots.length < 8) { shots.push({ x: ship.x + Math.cos(ship.a) * 14, y: ship.y + Math.sin(ship.a) * 14, vx: Math.cos(ship.a) * 9 + ship.vx, vy: Math.sin(ship.a) * 9 + ship.vy, l: 60 }); ship.cool = 9; tone(900, 0.05, 'square', 0.05); }
      }
      shots.forEach((s) => { s.x = (s.x + s.vx + W) % W; s.y = (s.y + s.vy + H) % H; s.l--; }); shots = shots.filter((s) => s.l > 0);
      rocks.forEach((r) => { r.x = (r.x + r.vx + W) % W; r.y = (r.y + r.vy + H) % H; r.a += r.va; });
      for (const s of shots) for (const r of rocks) if (!r.dead && Math.hypot(s.x - r.x, s.y - r.y) < R(r.s)) { r.dead = true; s.l = 0; score += [0, 100, 50, 20][r.s]; boom(r.x, r.y, 12, '#ccc'); tone(120 + r.s * 40, 0.15, 'sawtooth', 0.06); if (r.s > 1) rocks.push(rock(r.x, r.y, r.s - 1), rock(r.x, r.y, r.s - 1)); upd(); break; }
      rocks = rocks.filter((r) => !r.dead);
      if (!over && inv <= 0 && rocks.some((r) => Math.hypot(ship.x - r.x, ship.y - r.y) < R(r.s) + 10)) { boom(ship.x, ship.y, 40, '#6cf'); lives--; upd(); OS.sound('error'); if (lives <= 0) { over = true; overlay(wrap, 'Game over', `Score: ${score}`, 'Play again', reset); } else { Object.assign(ship, { x: W / 2, y: H / 2, vx: 0, vy: 0 }); inv = 120; } }
      if (!rocks.length) { level++; newLevel(); OS.sound('done'); }
      g.fillStyle = 'rgba(5,6,15,.6)'; g.fillRect(0, 0, W, H);
      parts.forEach((p) => { p.x += p.vx; p.y += p.vy; p.l--; g.fillStyle = p.c; g.globalAlpha = p.l / 40; g.fillRect(p.x, p.y, 2, 2); }); g.globalAlpha = 1; parts = parts.filter((p) => p.l > 0);
      g.strokeStyle = '#dfe6ff'; g.lineWidth = 2; rocks.forEach((r) => { g.beginPath(); r.pts.forEach((k, i) => { const a = r.a + i / r.pts.length * Math.PI * 2; const x = r.x + Math.cos(a) * R(r.s) * k, y = r.y + Math.sin(a) * R(r.s) * k; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.stroke(); });
      g.fillStyle = '#ff6'; shots.forEach((s) => { g.beginPath(); g.arc(s.x, s.y, 2.2, 0, 7); g.fill(); });
      if (!over && (inv <= 0 || Math.floor(inv / 6) % 2)) { g.save(); g.translate(ship.x, ship.y); g.rotate(ship.a); g.strokeStyle = '#6cf'; g.beginPath(); g.moveTo(16, 0); g.lineTo(-11, -10); g.lineTo(-6, 0); g.lineTo(-11, 10); g.closePath(); g.stroke(); g.restore(); }
      g.fillStyle = '#556'; g.font = '14px Inter'; g.fillText('Level ' + level, 12, 22);
    }
    OS.wm.keys(win, (e) => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(e.key)) { e.preventDefault(); keys[e.key] = true; } });
    const ku = (e) => (keys[e.key] = false); document.addEventListener('keyup', ku);
    win.body.querySelectorAll('.rocks-pad [data-k]').forEach((b) => { const k = b.dataset.k; b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.setPointerCapture(e.pointerId); keys[k] = true; }); ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => b.addEventListener(ev, () => (keys[k] = false))); });
    win.onResize = () => fitCanvas(cv, wrap, W / H); win.onClose(() => { cancelAnimationFrame(raf); document.removeEventListener('keyup', ku); }); setTimeout(win.onResize, 0); reset();
  } });

  /* =================== SKY HOP =================== */
  OS.registerApp({ id: 'skyhop', name: 'Sky Hop', icon: 'leaf', color: ['#4fc3f7', '#0288d1'], cat: 'Games', w: 440, h: 680, desc: 'Tap to fly', launch(win) {
    const W = 400, H = 600; let b, pipes, score, raf, state = 'ready', frame = 0;
    win.body.innerHTML = `<div class="game"><div class="game-head"><div class="stat"><small>Score</small><b data-s>0</b></div><div class="stat"><small>Best</small><b data-b>${best('skyhop') || 0}</b></div></div><div class="gwrap" style="flex:1;width:100%;display:grid;place-items:center;min-height:0;position:relative"><canvas width="${W}" height="${H}"></canvas></div><div class="small muted">Tap, click or press Space to flap</div></div>`;
    const cv = win.body.querySelector('canvas'), g = cv.getContext('2d'), wrap = win.body.querySelector('.gwrap');
    const reset = () => { b = { y: H / 2, v: 0 }; pipes = []; score = 0; state = 'ready'; frame = 0; win.body.querySelector('[data-s]').textContent = 0; };
    const flap = () => { if (state === 'dead') { reset(); return; } if (state === 'ready') state = 'play'; b.v = -7.2; tone(700, 0.06, 'triangle', 0.08); };
    function loop() {
      raf = requestAnimationFrame(loop); frame++;
      if (state === 'play') { b.v += 0.42; b.y += b.v; if (frame % 95 === 0) pipes.push({ x: W, gap: 90 + Math.random() * (H - 300), done: false }); pipes.forEach((p) => { p.x -= 2.6; if (!p.done && p.x + 60 < 90) { p.done = true; score++; win.body.querySelector('[data-s]').textContent = score; tone(1200, 0.08, 'square', 0.05); } if (p.x < 112 && p.x + 64 > 68 && (b.y - 14 < p.gap || b.y + 14 > p.gap + 150)) die(); }); pipes = pipes.filter((p) => p.x > -70); if (b.y > H - 60 || b.y < 0) die(); }
      else if (state === 'ready') b.y = H / 2 + Math.sin(frame / 12) * 8;
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#7fd4ff'); gr.addColorStop(1, '#d8f3ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.8)'; [[(200 - frame * 0.3) % 500 + 100, 90], [(420 - frame * 0.2) % 520 + 80, 160]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 18, 0, 7); g.arc(x + 20, y - 8, 22, 0, 7); g.arc(x + 42, y, 16, 0, 7); g.fill(); });
      pipes.forEach((p) => { g.fillStyle = '#4caf50'; g.fillRect(p.x, 0, 64, p.gap); g.fillRect(p.x, p.gap + 150, 64, H); g.fillStyle = '#388e3c'; g.fillRect(p.x - 4, p.gap - 22, 72, 22); g.fillRect(p.x - 4, p.gap + 150, 72, 22); });
      g.fillStyle = '#ded895'; g.fillRect(0, H - 60, W, 60); g.fillStyle = '#8bc34a'; g.fillRect(0, H - 60, W, 10);
      g.save(); g.translate(90, b.y); g.rotate(Math.max(-0.5, Math.min(1.2, b.v / 10))); g.fillStyle = '#ffd54f'; g.beginPath(); g.ellipse(0, 0, 17, 14, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(7, -4, 5, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(9, -4, 2.2, 0, 7); g.fill(); g.fillStyle = '#ff7043'; g.beginPath(); g.moveTo(14, 1); g.lineTo(24, 4); g.lineTo(14, 8); g.fill(); g.fillStyle = '#ffb300'; g.beginPath(); g.ellipse(-6, 3 + Math.sin(frame / 3) * 3, 8, 5, -0.3, 0, 7); g.fill(); g.restore();
      g.fillStyle = '#fff'; g.strokeStyle = '#333'; g.lineWidth = 4; g.font = '800 44px Inter, system-ui'; g.textAlign = 'center'; if (state !== 'ready') { g.strokeText(score, W / 2, 80); g.fillText(score, W / 2, 80); } else { g.font = '800 30px Inter'; g.strokeText('Tap to start', W / 2, H / 2 - 70); g.fillText('Tap to start', W / 2, H / 2 - 70); } if (state === 'dead') { g.font = '800 34px Inter'; g.strokeText('Game over', W / 2, H / 2 - 40); g.fillText('Game over', W / 2, H / 2 - 40); g.font = '600 18px Inter'; g.strokeText('Tap to try again', W / 2, H / 2); g.fillText('Tap to try again', W / 2, H / 2); }
    }
    const die = () => { if (state !== 'play') return; state = 'dead'; OS.sound('error'); win.body.querySelector('[data-b]').textContent = best('skyhop', score); };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); flap(); });
    OS.wm.keys(win, (e) => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); flap(); } });
    win.onResize = () => fitCanvas(cv, wrap, W / H, 600); win.onClose(() => cancelAnimationFrame(raf)); setTimeout(win.onResize, 0); reset(); raf = requestAnimationFrame(loop);
  } });

  /* =================== FOUR IN A ROW =================== */
  OS.registerApp({ id: 'fourrow', name: 'Four in a Row', icon: 'grid4', color: ['#e53935', '#fdd835'], cat: 'Games', w: 560, h: 620, desc: 'Connect four discs', launch(win) {
    const C = 7, R = 6; let b, turn, over, mode = 'cpu', winLine = [];
    win.body.innerHTML = `<div class="game"><div class="game-head"><div class="seg"><button data-m="cpu">vs CPU</button><button data-m="2p">2 Players</button></div><button class="btn sm" data-a="new">${gl('refresh')}New</button></div><div data-msg style="font-weight:600"></div><div class="c4"></div></div>`;
    const host = win.body.querySelector('.c4');
    const reset = () => { b = Array.from({ length: R }, () => Array(C).fill(0)); turn = 1; over = false; winLine = []; render(); };
    const drop = (bb, c, p) => { for (let r = R - 1; r >= 0; r--) if (!bb[r][c]) { bb[r][c] = p; return r; } return -1; };
    const lines = (bb, p) => { const out = []; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) [[0, 1], [1, 0], [1, 1], [1, -1]].forEach(([dr, dc]) => { const cells = [0, 1, 2, 3].map((k) => [r + dr * k, c + dc * k]); if (cells.every(([rr, cc]) => rr >= 0 && rr < R && cc >= 0 && cc < C && bb[rr][cc] === p)) out.push(cells); }); return out; };
    const score = (bb, p) => { let s = 0; const o = 3 - p; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) [[0, 1], [1, 0], [1, 1], [1, -1]].forEach(([dr, dc]) => { const w = [0, 1, 2, 3].map((k) => [r + dr * k, c + dc * k]); if (!w.every(([rr, cc]) => rr >= 0 && rr < R && cc >= 0 && cc < C)) return; const v = w.map(([rr, cc]) => bb[rr][cc]); const mine = v.filter((x) => x === p).length, th = v.filter((x) => x === o).length; if (mine && !th) s += [0, 1, 6, 40, 10000][mine]; if (th && !mine) s -= [0, 1, 7, 60, 10000][th]; }); for (let r = 0; r < R; r++) if (bb[r][3] === p) s += 4; return s; };
    function mm(bb, d, p, a, be) { const w1 = lines(bb, 2).length, w2 = lines(bb, 1).length; if (w1) return 1e6 + d; if (w2) return -1e6 - d; if (d === 0) return score(bb, 2); const cols = [3, 2, 4, 1, 5, 0, 6].filter((c) => !bb[0][c]); if (!cols.length) return 0; if (p === 2) { let v = -1e9; for (const c of cols) { const n = bb.map((r) => r.slice()); drop(n, c, 2); v = Math.max(v, mm(n, d - 1, 1, a, be)); a = Math.max(a, v); if (a >= be) break; } return v; } let v = 1e9; for (const c of cols) { const n = bb.map((r) => r.slice()); drop(n, c, 1); v = Math.min(v, mm(n, d - 1, 2, a, be)); be = Math.min(be, v); if (a >= be) break; } return v; }
    function play(c) { if (over || b[0][c]) return; drop(b, c, turn); tone(turn === 1 ? 300 : 400, 0.08); const L = lines(b, turn); if (L.length) { over = true; winLine = L[0]; if (turn === 1 && mode === 'cpu') OS.confetti && OS.confetti(); } else if (b[0].every(Boolean)) over = true; turn = 3 - turn; render(); if (!over && mode === 'cpu' && turn === 2) setTimeout(() => { let bc = 3, bv = -1e9; [3, 2, 4, 1, 5, 0, 6].filter((cc) => !b[0][cc]).forEach((cc) => { const n = b.map((r) => r.slice()); drop(n, cc, 2); const v = mm(n, 4, 1, -1e9, 1e9); if (v > bv) { bv = v; bc = cc; } }); play(bc); }, 250); }
    function render() { const L = lines(b, 1).length ? 1 : lines(b, 2).length ? 2 : 0; win.body.querySelector('[data-msg]').innerHTML = over ? (L ? `<span style="color:${L === 1 ? '#e53935' : '#f9a825'}">${L === 1 ? 'Red' : 'Yellow'} wins!</span>` : 'Draw!') : `<span style="color:${turn === 1 ? '#e53935' : '#f9a825'}">●</span> ${turn === 1 ? 'Red' : 'Yellow'}'s turn`; host.innerHTML = Array.from({ length: C }, (_, c) => `<div class="c4col" data-c="${c}">${b.map((row, r) => `<i class="${row[c] === 1 ? 'r' : row[c] === 2 ? 'y' : ''} ${winLine.some(([rr, cc]) => rr === r && cc === c) ? 'win' : ''}"></i>`).join('')}</div>`).join(''); host.querySelectorAll('.c4col').forEach((col) => (col.onclick = () => { if (mode === 'cpu' && turn === 2) return; play(+col.dataset.c); })); win.body.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('on', x.dataset.m === mode)); }
    win.body.querySelectorAll('[data-m]').forEach((x) => (x.onclick = () => { mode = x.dataset.m; reset(); })); win.body.querySelector('[data-a=new]').onclick = reset; reset();
  } });

  /* =================== HANGMAN =================== */
  const WORDS = 'planet garden rocket window keyboard library mountain dolphin volcano penguin lantern harbor journey crystal blanket compass thunder rainbow pyramid octopus treasure sunflower midnight elephant computer melody galaxy umbrella cupcake squirrel adventure lighthouse butterfly snowflake waterfall dinosaur notebook pancake orchestra'.split(' ');
  OS.registerApp({ id: 'hangman', name: 'Hangman', icon: 'type', color: ['#6d4c41', '#3e2723'], cat: 'Games', w: 560, h: 620, desc: 'Guess the word', launch(win) {
    let word, guessed, wrong, wins = OS.store.get('hm-wins', 0);
    win.body.innerHTML = `<div class="game" style="justify-content:flex-start"><div class="game-head"><div class="stat"><small>Wins</small><b data-w></b></div><div class="stat"><small>Lives</small><b data-l></b></div><button class="btn sm" data-a="new">${gl('refresh')}New word</button></div><svg class="hm-svg" viewBox="0 0 200 180"></svg><div class="hm-word"></div><div class="hm-keys"></div><div data-msg style="font-weight:700;min-height:22px"></div></div>`;
    const svg = win.body.querySelector('.hm-svg');
    const PARTS = ['<line x1="20" y1="170" x2="120" y2="170"/>', '<line x1="50" y1="170" x2="50" y2="20"/>', '<line x1="50" y1="20" x2="130" y2="20"/><line x1="130" y1="20" x2="130" y2="40"/>', '<circle cx="130" cy="55" r="15"/>', '<line x1="130" y1="70" x2="130" y2="115"/>', '<line x1="130" y1="80" x2="110" y2="100"/>', '<line x1="130" y1="80" x2="150" y2="100"/>', '<line x1="130" y1="115" x2="112" y2="145"/><line x1="130" y1="115" x2="148" y2="145"/>'];
    const reset = () => { word = WORDS[Math.random() * WORDS.length | 0]; guessed = new Set(); wrong = 0; render(); };
    function guess(ch) { if (guessed.has(ch) || done()) return; guessed.add(ch); if (!word.includes(ch)) { wrong++; tone(200, 0.15, 'sawtooth', 0.05); } else tone(700, 0.08); render(); }
    const won = () => [...word].every((c) => guessed.has(c)); const lost = () => wrong >= PARTS.length; const done = () => won() || lost();
    function render() {
      svg.innerHTML = `<g stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round">${PARTS.slice(0, wrong).join('')}</g>`;
      win.body.querySelector('.hm-word').innerHTML = [...word].map((c) => `<span>${guessed.has(c) || lost() ? c : ''}</span>`).join('');
      win.body.querySelector('.hm-keys').innerHTML = [...'abcdefghijklmnopqrstuvwxyz'].map((c) => `<button data-c="${c}" ${guessed.has(c) ? 'disabled' : ''} class="${guessed.has(c) ? (word.includes(c) ? 'ok' : 'no') : ''}">${c}</button>`).join('');
      win.body.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => guess(b.dataset.c)));
      if (won() && !render.done) { wins++; OS.store.set('hm-wins', wins); OS.sound('done'); } render.done = done();
      win.body.querySelector('[data-msg]').textContent = won() ? '🎉 You got it!' : lost() ? `The word was “${word}”` : '';
      win.body.querySelector('[data-w]').textContent = wins; win.body.querySelector('[data-l]').textContent = PARTS.length - wrong;
    }
    OS.wm.keys(win, (e) => { if (/^[a-z]$/i.test(e.key)) guess(e.key.toLowerCase()); else if (e.key === 'Enter' && done()) reset(); });
    win.body.querySelector('[data-a=new]').onclick = () => { render.done = false; reset(); }; reset();
  } });

  /* =================== GAME OF LIFE =================== */
  OS.registerApp({ id: 'life', name: 'Game of Life', icon: 'grid', color: ['#26a69a', '#00695c'], cat: 'Education', w: 760, h: 620, desc: 'Cellular automaton', launch(win) {
    const N = 60, M = 40; let g = new Uint8Array(N * M), run = false, gen = 0, timer = null, speed = 8;
    win.body.innerHTML = `<div class="game"><div class="game-head"><button class="btn sm primary" data-a="play">${gl('play')}Play</button><button class="btn sm" data-a="step">Step</button><button class="btn sm" data-a="rand">Random</button><button class="btn sm" data-a="clear">Clear</button><select class="inp" data-pat style="min-height:32px;padding:4px"><option value="">Patterns…</option><option>Glider</option><option>Lightweight ship</option><option>Pulsar</option><option>Glider gun</option><option>R-pentomino</option></select><label class="small row">Speed<input type="range" min="1" max="30" value="8" data-sp style="width:80px"></label><span class="small muted" data-gen></span></div><div class="gwrap" style="flex:1;width:100%;display:grid;place-items:center;min-height:0"><canvas width="${N * 12}" height="${M * 12}"></canvas></div><div class="small muted">Tap or drag on the grid to draw cells</div></div>`;
    const cv = win.body.querySelector('canvas'), c = cv.getContext('2d'), wrap = win.body.querySelector('.gwrap');
    const draw = () => { c.fillStyle = '#0f1a1a'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#26e6b4'; for (let i = 0; i < N * M; i++) if (g[i]) c.fillRect((i % N) * 12 + 1, Math.floor(i / N) * 12 + 1, 10, 10); win.body.querySelector('[data-gen]').textContent = `Generation ${gen} · ${g.reduce((a, b) => a + b, 0)} alive`; };
    const step = () => { const n = new Uint8Array(N * M); for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) { let k = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) k += g[((y + dy + M) % M) * N + (x + dx + N) % N]; const a = g[y * N + x]; n[y * N + x] = k === 3 || (a && k === 2) ? 1 : 0; } g = n; gen++; draw(); };
    const PAT = { Glider: ['.#.', '..#', '###'], 'Lightweight ship': ['.#..#', '#....', '#...#', '####.'], Pulsar: ['..###...###..', '.............', '#....#.#....#', '#....#.#....#', '#....#.#....#', '..###...###..', '.............', '..###...###..', '#....#.#....#', '#....#.#....#', '#....#.#....#', '.............', '..###...###..'], 'Glider gun': ['........................#...........', '......................#.#...........', '............##......##............##', '...........#...#....##............##', '##........#.....#...##..............', '##........#...#.##....#.#...........', '..........#.....#.......#...........', '...........#...#....................', '............##......................'], 'R-pentomino': ['.##', '##.', '.#.'] };
    const place = (p) => { const rows = PAT[p]; const ox = Math.floor((N - rows[0].length) / 2), oy = Math.floor((M - rows.length) / 2); rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') g[(oy + y) * N + ox + x] = 1; })); draw(); };
    const setRun = (v) => { run = v; clearInterval(timer); if (run) timer = setInterval(step, 1000 / speed); win.body.querySelector('[data-a=play]').innerHTML = run ? `${gl('pause')}Pause` : `${gl('play')}Play`; };
    let paint = null; const cell = (e) => { const r = cv.getBoundingClientRect(); return Math.floor((e.clientY - r.top) / r.height * M) * N + Math.floor((e.clientX - r.left) / r.width * N); };
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); const i = cell(e); paint = g[i] ? 0 : 1; g[i] = paint; draw(); }); cv.addEventListener('pointermove', (e) => { if (paint == null) return; g[cell(e)] = paint; draw(); }); cv.addEventListener('pointerup', () => (paint = null)); cv.style.touchAction = 'none';
    const A = (n, f) => (win.body.querySelector(`[data-a=${n}]`).onclick = f);
    A('play', () => setRun(!run)); A('step', step); A('rand', () => { g = g.map(() => (Math.random() < 0.25 ? 1 : 0)); gen = 0; draw(); }); A('clear', () => { g = new Uint8Array(N * M); gen = 0; draw(); });
    win.body.querySelector('[data-pat]').onchange = (e) => { if (e.target.value) place(e.target.value); e.target.value = ''; };
    win.body.querySelector('[data-sp]').oninput = (e) => { speed = +e.target.value; if (run) setRun(true); };
    win.onResize = () => fitCanvas(cv, wrap, N / M); win.onClose(() => clearInterval(timer)); setTimeout(win.onResize, 0); place('Glider gun');
  } });

  /* =================== FRACTAL EXPLORER =================== */
  OS.registerApp({ id: 'fractal', name: 'Fractal Explorer', icon: 'diamond', color: ['#ff6f00', '#6a1b9a'], cat: 'Graphics', w: 820, h: 620, desc: 'Mandelbrot & Julia sets', launch(win) {
    let cx = -0.6, cy = 0, scale = 3, iters = 200, julia = false, jc = [-0.8, 0.156], pal = 0, job = 0;
    win.body.innerHTML = `<div class="toolbar"><div class="seg"><button data-f="m" class="on">Mandelbrot</button><button data-f="j">Julia</button></div><select class="inp" data-pal style="min-height:32px;padding:4px"><option value="0">Fire</option><option value="1">Ocean</option><option value="2">Rainbow</option><option value="3">Mono</option></select><label class="small row">Detail<input type="range" min="50" max="1000" value="200" data-it style="width:90px"></label><span class="grow"></span><button class="ibtn" data-a="out" title="Zoom out">${gl('zoomout')}</button><button class="ibtn" data-a="reset" title="Reset">${gl('refresh')}</button><button class="ibtn" data-a="save" title="Save image">${gl('save')}</button></div><div style="flex:1;position:relative;min-height:0;background:#000"><canvas style="position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:zoom-in"></canvas><div class="small" data-info style="position:absolute;left:8px;bottom:6px;color:#fff;text-shadow:0 1px 2px #000"></div></div>`;
    const cv = win.body.querySelector('canvas'), g = cv.getContext('2d');
    const color = (t) => { if (t >= 1) return [0, 0, 0]; const P = [(x) => [255 * Math.min(1, x * 3), 255 * Math.max(0, Math.min(1, x * 3 - 1)), 255 * Math.max(0, x * 3 - 2)], (x) => [20 * x, 120 * Math.sqrt(x) + 40 * x, 255 * Math.sqrt(x)], (x) => { const h = x * 6; return [Math.sin(h) * 127 + 128, Math.sin(h + 2.1) * 127 + 128, Math.sin(h + 4.2) * 127 + 128]; }, (x) => [255 * x, 255 * x, 255 * x]][pal]; return P(t); };
    async function render() {
      const my = ++job; const W = cv.width = Math.min(1400, cv.clientWidth), H = cv.height = Math.min(1000, cv.clientHeight); if (!W || !H) return; const img = g.createImageData(W, H); const k = scale / W;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) { let zx, zy, px, py; if (julia) { zx = cx + (x - W / 2) * k; zy = cy + (y - H / 2) * k; px = jc[0]; py = jc[1]; } else { zx = 0; zy = 0; px = cx + (x - W / 2) * k; py = cy + (y - H / 2) * k; } let i = 0; while (i < iters && zx * zx + zy * zy < 16) { const t = zx * zx - zy * zy + px; zy = 2 * zx * zy + py; zx = t; i++; } const sm = i < iters ? i + 1 - Math.log2(Math.log2(zx * zx + zy * zy) / 2) : iters; const [r, gg, b] = color(i >= iters ? 1 : (sm / iters) ** 0.5); const o = (y * W + x) * 4; img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255; }
        if (y % 40 === 0) { g.putImageData(img, 0, 0); await new Promise((r) => setTimeout(r)); if (my !== job) return; }
      }
      g.putImageData(img, 0, 0); win.body.querySelector('[data-info]').textContent = `center ${cx.toFixed(6)}, ${cy.toFixed(6)} · zoom ×${(3 / scale).toExponential(1)}`;
    }
    const at = (e) => { const r = cv.getBoundingClientRect(); return [cx + (e.clientX - r.left - r.width / 2) * scale / r.width, cy + (e.clientY - r.top - r.height / 2) * scale / r.width]; };
    cv.addEventListener('click', (e) => { [cx, cy] = at(e); scale /= 3; render(); });
    cv.addEventListener('contextmenu', (e) => { e.preventDefault(); scale *= 3; render(); });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); const [x, y] = at(e); const f = e.deltaY < 0 ? 0.7 : 1.4; cx = x + (cx - x) * f; cy = y + (cy - y) * f; scale *= f; render(); }, { passive: false });
    win.body.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { julia = b.dataset.f === 'j'; cx = julia ? 0 : -0.6; cy = 0; scale = 3; win.body.querySelectorAll('[data-f]').forEach((x) => x.classList.toggle('on', x === b)); render(); }));
    win.body.querySelector('[data-pal]').onchange = (e) => { pal = +e.target.value; render(); };
    win.body.querySelector('[data-it]').onchange = (e) => { iters = +e.target.value; render(); };
    win.body.querySelector('[data-a=out]').onclick = () => { scale *= 3; render(); }; win.body.querySelector('[data-a=reset]').onclick = () => { cx = julia ? 0 : -0.6; cy = 0; scale = 3; render(); };
    win.body.querySelector('[data-a=save]').onclick = () => { OS.fs.mkdir(OS.home() + '/Pictures', { p: true }); const p = OS.fs.uniqueName(OS.home() + '/Pictures', 'Fractal.jpg'); OS.fs.write(p, cv.toDataURL('image/jpeg', 0.85)); OS.notify('Saved', OS.fs.pretty(p), { app: 'fractal' }); };
    let rt = null; win.onResize = () => { clearTimeout(rt); rt = setTimeout(render, 250); }; win.onClose(() => job++); setTimeout(render, 50);
  } });

  /* =================== PIXEL ART =================== */
  OS.registerApp({ id: 'pixelart', name: 'Pixel Art', icon: 'grid4', color: ['#ec407a', '#7e57c2'], cat: 'Graphics', w: 760, h: 680, desc: 'Draw pixel sprites', launch(win) {
    let N = 16, px = Array(N * N).fill(null), color = '#222034', tool = 'pen', undo = [], mirror = false;
    const PAL = ['#000000', '#222034', '#45283c', '#663931', '#8f563b', '#df7126', '#d9a066', '#eec39a', '#fbf236', '#99e550', '#6abe30', '#37946e', '#4b692f', '#524b24', '#323c39', '#3f3f74', '#306082', '#5b6ee1', '#639bff', '#5fcde4', '#cbdbfc', '#ffffff', '#9badb7', '#847e87', '#696a6a', '#595652', '#76428a', '#ac3232', '#d95763', '#d77bba', '#8f974a', '#8a6f30'];
    win.body.innerHTML = `<div class="toolbar">${[['pen', 'edit'], ['erase', 'eraser'], ['fill', 'bucket'], ['pick', 'pipette']].map(([t, i]) => `<button class="ibtn" data-t="${t}" title="${t}">${gl(i)}</button>`).join('')}<button class="ibtn" data-a="mirror" title="Mirror drawing">${gl('squares')}</button><button class="ibtn" data-a="undo">${gl('undo')}</button><select class="inp" data-n style="min-height:32px;padding:4px"><option>16</option><option>24</option><option>32</option></select><span class="grow"></span><button class="btn sm" data-a="clear">Clear</button><button class="btn sm primary" data-a="save">${gl('save')}Save PNG</button></div><div class="pa-pal">${PAL.map((c) => `<i data-c="${c}" style="background:${c}"></i>`).join('')}<input type="color" data-custom value="#ff5ca8"></div><div class="gwrap" style="flex:1;display:grid;place-items:center;min-height:0;padding:8px"><canvas class="pa-cv" width="512" height="512"></canvas></div>`;
    const cv = win.body.querySelector('canvas'), g = cv.getContext('2d'), wrap = win.body.querySelector('.gwrap');
    const draw = () => { const s = 512 / N; g.clearRect(0, 0, 512, 512); for (let i = 0; i < N * N; i++) { const x = i % N, y = Math.floor(i / N); g.fillStyle = px[i] || ((x + y) % 2 ? '#e8e8ee' : '#f6f6fa'); g.fillRect(x * s, y * s, s, s); } g.strokeStyle = 'rgba(0,0,0,.06)'; for (let i = 0; i <= N; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(512, i * s); g.stroke(); } };
    const setTool = (t) => { tool = t; win.body.querySelectorAll('[data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === t)); };
    const idx = (e) => { const r = cv.getBoundingClientRect(); const x = Math.floor((e.clientX - r.left) / r.width * N), y = Math.floor((e.clientY - r.top) / r.height * N); return x >= 0 && y >= 0 && x < N && y < N ? y * N + x : -1; };
    const setPx = (i, v) => { px[i] = v; if (mirror) px[Math.floor(i / N) * N + (N - 1 - (i % N))] = v; };
    const fill = (i) => { const t = px[i]; if (t === color) return; const st = [i]; while (st.length) { const k = st.pop(); if (k < 0 || k >= N * N || px[k] !== t) continue; px[k] = color; const x = k % N; st.push(k + N, k - N); if (x > 0) st.push(k - 1); if (x < N - 1) st.push(k + 1); } };
    let down = false; cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', (e) => { const i = idx(e); if (i < 0) return; cv.setPointerCapture(e.pointerId); undo.push(px.slice()); if (undo.length > 50) undo.shift(); if (tool === 'fill') { fill(i); draw(); return; } if (tool === 'pick') { if (px[i]) { color = px[i]; win.body.querySelector('[data-custom]').value = color; } setTool('pen'); return; } down = true; setPx(i, tool === 'erase' ? null : color); draw(); });
    cv.addEventListener('pointermove', (e) => { if (!down) return; const i = idx(e); if (i >= 0) { setPx(i, tool === 'erase' ? null : color); draw(); } });
    cv.addEventListener('pointerup', () => (down = false));
    win.body.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => setTool(b.dataset.t)));
    win.body.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => { color = b.dataset.c; win.body.querySelectorAll('[data-c]').forEach((x) => x.classList.toggle('on', x === b)); if (tool !== 'fill') setTool('pen'); }));
    win.body.querySelector('[data-custom]').oninput = (e) => { color = e.target.value; setTool('pen'); };
    win.body.querySelector('[data-a=mirror]').onclick = (e) => { mirror = !mirror; e.currentTarget.classList.toggle('on', mirror); };
    win.body.querySelector('[data-a=undo]').onclick = () => { if (undo.length) { px = undo.pop(); draw(); } };
    win.body.querySelector('[data-a=clear]').onclick = () => { undo.push(px.slice()); px = Array(N * N).fill(null); draw(); };
    win.body.querySelector('[data-n]').onchange = (e) => { N = +e.target.value; px = Array(N * N).fill(null); undo = []; draw(); };
    win.body.querySelector('[data-a=save]').onclick = async () => { const n = await OS.prompt('Save sprite', 'File name:', 'sprite.png'); if (!n) return; const c2 = document.createElement('canvas'); const s = Math.max(1, Math.floor(256 / N)); c2.width = c2.height = N * s; const g2 = c2.getContext('2d'); px.forEach((c, i) => { if (c) { g2.fillStyle = c; g2.fillRect((i % N) * s, Math.floor(i / N) * s, s, s); } }); OS.fs.mkdir(OS.home() + '/Pictures', { p: true }); const p = OS.fs.uniqueName(OS.home() + '/Pictures', n.endsWith('.png') ? n : n + '.png'); OS.fs.write(p, c2.toDataURL('image/png')); OS.notify('Saved', OS.fs.pretty(p), { app: 'pixelart', onclick: () => OS.wm.open('viewer', { path: p }) }); };
    win.onResize = () => fitCanvas(cv, wrap, 1, 640); setTimeout(win.onResize, 0); setTool('pen');
    // default: a little heart
    [[2, 4], [3, 3], [4, 3], [5, 4], [6, 3], [7, 3], [8, 4], [2, 5], [8, 5], [3, 6], [7, 6], [4, 7], [6, 7], [5, 8]].forEach(([x, y]) => (px[(y + 3) * N + x + 3] = '#ac3232')); draw();
  } });

  /* =================== POMODORO =================== */
  OS.registerApp({ id: 'pomodoro', name: 'Focus Timer', icon: 'timer', color: ['#ff7043', '#d84315'], cat: 'Office', w: 420, h: 560, single: true, desc: 'Pomodoro timer', launch(win) {
    const P = Object.assign({ work: 25, short: 5, long: 15 }, OS.store.get('pomo', {})); let mode = 'work', left = P.work * 60, run = false, done = OS.store.get('pomo-done-' + new Date().toDateString(), 0), end = 0;
    win.body.innerHTML = `<div class="game" style="gap:14px"><div class="seg">${[['work', 'Focus'], ['short', 'Short break'], ['long', 'Long break']].map(([m, l]) => `<button data-m="${m}">${l}</button>`).join('')}</div><div class="pomo-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg"/></svg><div><b data-t></b><small data-ml></small></div></div><div class="row" style="gap:8px"><button class="btn primary" data-a="go" style="min-width:120px"></button><button class="btn" data-a="reset">${gl('refresh')}</button><button class="btn" data-a="skip">${gl('next')}</button></div><div class="small muted" data-done></div><details class="small" style="width:100%;max-width:300px"><summary>Durations</summary>${['work', 'short', 'long'].map((k) => `<label class="row" style="justify-content:space-between;margin:6px 0">${k === 'work' ? 'Focus' : k === 'short' ? 'Short break' : 'Long break'} (min)<input class="inp" type="number" min="1" max="120" value="${P[k]}" data-k="${k}" style="width:70px"></label>`).join('')}</details></div>`;
    const fg = win.body.querySelector('.fg'); const C = 2 * Math.PI * 52; fg.style.strokeDasharray = C;
    const total = () => P[mode] * 60;
    const render = () => { if (run) left = Math.max(0, (end - Date.now()) / 1000); win.body.querySelector('[data-t]').textContent = OS.fmtDur(Math.ceil(left)); win.body.querySelector('[data-ml]').textContent = mode === 'work' ? 'Focus' : 'Break'; fg.style.strokeDashoffset = C * (left / total()); fg.style.stroke = mode === 'work' ? '#ff7043' : '#26a69a'; win.body.querySelector('[data-a=go]').innerHTML = run ? `${gl('pause')}Pause` : `${gl('play')}Start`; win.body.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('on', b.dataset.m === mode)); win.body.querySelector('[data-done]').textContent = `🍅 ${done} focus session${done === 1 ? '' : 's'} today`; if (run) win.setTitle(`${OS.fmtDur(Math.ceil(left))} — Focus Timer`); else win.setTitle('Focus Timer'); };
    const setMode = (m) => { mode = m; left = total(); run = false; render(); };
    const tick = () => { if (!run) return; if (Date.now() >= end) { run = false; if (mode === 'work') { done++; OS.store.set('pomo-done-' + new Date().toDateString(), done); } OS.notify(mode === 'work' ? 'Focus session done! 🍅' : 'Break is over', mode === 'work' ? 'Time for a break.' : 'Back to focus.', { app: 'pomodoro', force: true }); OS.sound('startup'); setMode(mode === 'work' ? (done % 4 === 0 ? 'long' : 'short') : 'work'); } render(); };
    const iv = setInterval(tick, 250); win.onClose(() => clearInterval(iv));
    win.body.querySelector('[data-a=go]').onclick = () => { if (run) { run = false; left = (end - Date.now()) / 1000; } else { run = true; end = Date.now() + left * 1000; } render(); };
    win.body.querySelector('[data-a=reset]').onclick = () => setMode(mode); win.body.querySelector('[data-a=skip]').onclick = () => setMode(mode === 'work' ? 'short' : 'work');
    win.body.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => setMode(b.dataset.m)));
    win.body.querySelectorAll('[data-k]').forEach((i) => (i.onchange = () => { P[i.dataset.k] = OS.clamp(+i.value || 1, 1, 120); OS.store.set('pomo', P); if (!run) setMode(mode); }));
    render();
  } });

  /* =================== UNIT CONVERTER =================== */
  const UNITS = {
    Length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254, 'nautical mi': 1852, 'light-year': 9.4607e15 },
    Mass: { kg: 1, g: 0.001, mg: 1e-6, t: 1000, lb: 0.45359237, oz: 0.028349523, st: 6.35029318 },
    Temperature: { '°C': 'c', '°F': 'f', K: 'k' },
    Speed: { 'm/s': 1, 'km/h': 1 / 3.6, mph: 0.44704, knot: 0.514444, 'ft/s': 0.3048, mach: 343 },
    Area: { 'm²': 1, 'km²': 1e6, 'cm²': 1e-4, ha: 1e4, acre: 4046.8564, 'ft²': 0.09290304, 'mi²': 2589988.11 },
    Volume: { L: 1, mL: 0.001, 'm³': 1000, 'US gal': 3.78541, 'UK gal': 4.54609, cup: 0.24, 'fl oz': 0.0295735, tbsp: 0.0147868, tsp: 0.00492892 },
    Data: { B: 1, KB: 1000, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1048576, GiB: 1073741824, bit: 0.125 },
    Time: { s: 1, ms: 0.001, min: 60, h: 3600, day: 86400, week: 604800, year: 31557600 },
    Energy: { J: 1, kJ: 1000, cal: 4.184, kcal: 4184, Wh: 3600, kWh: 3.6e6, eV: 1.602e-19 },
  };
  OS.registerApp({ id: 'units', name: 'Unit Converter', icon: 'sliders', color: ['#5c6bc0', '#283593'], cat: 'Accessories', w: 460, h: 560, desc: 'Convert units', launch(win) {
    let cat = 'Length';
    win.body.innerHTML = `<div class="scroll pad"><div class="chips" style="padding:0 0 10px;flex-wrap:wrap">${Object.keys(UNITS).map((c) => `<button class="chip" data-c="${c}">${c}</button>`).join('')}</div><div class="card col"><div class="row"><input class="inp uc-v" data-v="a" inputmode="decimal" value="1" style="flex:1;font-size:20px"><select class="inp" data-u="a"></select></div><div style="text-align:center"><button class="ibtn" data-a="swap">${gl('arrowdown')}</button></div><div class="row"><input class="inp uc-v" data-v="b" inputmode="decimal" style="flex:1;font-size:20px"><select class="inp" data-u="b"></select></div></div><div class="uc-all small"></div></div>`;
    const $ = (s) => win.body.querySelector(s);
    const toBase = (v, u) => { const f = UNITS[cat][u]; if (cat === 'Temperature') return f === 'c' ? v : f === 'f' ? (v - 32) * 5 / 9 : v - 273.15; return v * f; };
    const fromBase = (v, u) => { const f = UNITS[cat][u]; if (cat === 'Temperature') return f === 'c' ? v : f === 'f' ? v * 9 / 5 + 32 : v + 273.15; return v / f; };
    const fmt = (n) => (Math.abs(n) >= 1e9 || (Math.abs(n) < 1e-6 && n !== 0) ? n.toExponential(6) : String(+n.toPrecision(10)));
    function conv(from) { const a = from === 'a', v = parseFloat($(`[data-v=${from}]`).value); const ua = $('[data-u=a]').value, ub = $('[data-u=b]').value; if (isNaN(v)) return; const base = toBase(v, a ? ua : ub); $(`[data-v=${a ? 'b' : 'a'}]`).value = fmt(fromBase(base, a ? ub : ua)); const all = Object.keys(UNITS[cat]).map((u) => `<div class="row" style="justify-content:space-between;padding:6px 4px;border-bottom:1px solid var(--border)"><span class="muted">${u}</span><b>${fmt(fromBase(toBase(parseFloat($('[data-v=a]').value) || 0, ua), u))}</b></div>`).join(''); $('.uc-all').innerHTML = all; }
    function setCat(c) { cat = c; const us = Object.keys(UNITS[c]); ['a', 'b'].forEach((k, i) => ($(`[data-u=${k}]`).innerHTML = us.map((u) => `<option ${u === us[i] ? 'selected' : ''}>${u}</option>`).join(''))); win.body.querySelectorAll('[data-c]').forEach((b) => b.classList.toggle('on', b.dataset.c === c)); conv('a'); }
    win.body.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => setCat(b.dataset.c)));
    $('[data-v=a]').oninput = () => conv('a'); $('[data-v=b]').oninput = () => conv('b'); $('[data-u=a]').onchange = () => conv('a'); $('[data-u=b]').onchange = () => conv('a');
    $('[data-a=swap]').onclick = () => { const a = $('[data-u=a]').value; $('[data-u=a]').value = $('[data-u=b]').value; $('[data-u=b]').value = a; conv('a'); };
    setCat('Length');
  } });

  /* =================== FIREWORKS =================== */
  OS.registerApp({ id: 'fireworks', name: 'Fireworks', icon: 'star', color: ['#1a237e', '#ad1457'], cat: 'Graphics', w: 760, h: 560, desc: 'Tap to launch fireworks', launch(win) {
    win.body.innerHTML = `<div style="flex:1;position:relative;background:#03030b;min-height:0"><canvas style="position:absolute;inset:0;width:100%;height:100%;touch-action:none"></canvas><div class="row" style="position:absolute;left:10px;top:10px"><button class="btn sm" data-a="auto">Auto show</button><span class="small" style="color:#99a">Tap anywhere to launch</span></div></div>`;
    const cv = win.body.querySelector('canvas'), g = cv.getContext('2d'); let rockets = [], sparks = [], raf, auto = false, W, H;
    const size = () => { W = cv.width = cv.clientWidth; H = cv.height = cv.clientHeight; };
    const launch = (tx, ty) => { rockets.push({ x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H, tx, ty, hue: Math.random() * 360 }); tone(200 + Math.random() * 100, 0.3, 'sawtooth', 0.02); };
    const burst = (r) => { const n = 80 + Math.random() * 60, kind = Math.random(); for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = kind < 0.3 ? 4 : Math.random() * 5 + 1; sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 60 + Math.random() * 40, hue: kind > 0.7 ? Math.random() * 360 : r.hue }); } const A = OS.audio(); if (A && OS.settings.sounds) { const b = A.createBuffer(1, A.sampleRate * 0.5, A.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3; const s = A.createBufferSource(); s.buffer = b; const gg = A.createGain(); gg.gain.value = 0.25 * OS.settings.volume / 100; const f = A.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; s.connect(f).connect(gg).connect(A.destination); s.start(); } };
    function loop() { raf = requestAnimationFrame(loop); if (cv.clientWidth !== W) size(); g.fillStyle = 'rgba(3,3,11,.22)'; g.fillRect(0, 0, W, H); if (auto && Math.random() < 0.04) launch(Math.random() * W, H * 0.15 + Math.random() * H * 0.4);
      rockets.forEach((r) => { const dx = r.tx - r.x, dy = r.ty - r.y, d = Math.hypot(dx, dy); r.x += dx / d * 8; r.y += dy / d * 8; g.fillStyle = `hsl(${r.hue},100%,80%)`; g.fillRect(r.x, r.y, 3, 3); if (d < 10) { r.done = true; burst(r); } }); rockets = rockets.filter((r) => !r.done);
      g.globalCompositeOperation = 'lighter'; sparks.forEach((s) => { s.vx *= 0.98; s.vy = s.vy * 0.98 + 0.05; s.x += s.vx; s.y += s.vy; s.l--; g.fillStyle = `hsla(${s.hue},100%,${50 + s.l / 4}%,${s.l / 100})`; g.fillRect(s.x, s.y, 2.2, 2.2); }); g.globalCompositeOperation = 'source-over'; sparks = sparks.filter((s) => s.l > 0); }
    cv.addEventListener('pointerdown', (e) => { const r = cv.getBoundingClientRect(); OS.audio(); launch(e.clientX - r.left, e.clientY - r.top); });
    win.body.querySelector('[data-a=auto]').onclick = (e) => { auto = !auto; e.currentTarget.classList.toggle('primary', auto); };
    win.onClose(() => cancelAnimationFrame(raf)); size(); raf = requestAnimationFrame(loop);
  } });

  /* =================== MAPS =================== */
  OS.registerApp({ id: 'maps', name: 'Maps', icon: 'map', color: ['#43a047', '#1e88e5'], cat: 'Internet', w: 960, h: 640, desc: 'World map', launch(win) {
    let st = OS.store.get('maps', { lat: 48.85, lon: 2.35, z: 5, name: 'Paris' }), marker = null;
    win.body.innerHTML = `<div class="toolbar"><form class="br-url" style="flex:1">${gl('search')}<input placeholder="Search places…" spellcheck="false"></form><button class="ibtn" data-a="me" title="My location">${gl('location')}</button><button class="ibtn" data-a="in">${gl('plus')}</button><button class="ibtn" data-a="out">${gl('minus')}</button><button class="ibtn" data-a="ext" title="Open on openstreetmap.org">${gl('external')}</button></div><div style="flex:1;position:relative;min-height:0;background:#aad3df"><iframe style="position:absolute;inset:0;width:100%;height:100%;border:0" loading="lazy" referrerpolicy="no-referrer"></iframe><div class="map-note small" hidden></div></div>`;
    const fr = win.body.querySelector('iframe');
    function show() { const span = 360 / 2 ** st.z * 1.2; const h = span * 0.6; const bbox = [st.lon - span / 2, st.lat - h / 2, st.lon + span / 2, st.lat + h / 2].map((x) => x.toFixed(5)).join(','); fr.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker ? `&marker=${marker[0]},${marker[1]}` : ''}`; OS.store.set('maps', st); win.setTitle(`${st.name || 'Map'} — Maps`); const n = win.body.querySelector('.map-note'); n.hidden = navigator.onLine; n.textContent = 'You are offline — the map needs an internet connection.'; }
    win.body.querySelector('form').onsubmit = async (e) => { e.preventDefault(); const q = win.body.querySelector('input').value.trim(); if (!q) return; try { const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`); const j = await r.json(); if (!j.length) return OS.alert('Not found', `No results for “${q}”.`); const go = (x) => { st = { lat: +x.lat, lon: +x.lon, z: x.type === 'city' ? 11 : x.class === 'boundary' ? 6 : 14, name: x.display_name.split(',')[0] }; marker = [st.lat, st.lon]; show(); }; if (j.length === 1) return go(j[0]); const rr = win.body.querySelector('form').getBoundingClientRect(); OS.menu(rr.left, rr.bottom + 4, j.map((x) => ({ label: x.display_name.slice(0, 70), icon: 'location', action: () => go(x) }))); } catch (er) { try { const r2 = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`); const j2 = await r2.json(); if (j2.results?.[0]) { const x = j2.results[0]; st = { lat: x.latitude, lon: x.longitude, z: 11, name: x.name }; marker = [st.lat, st.lon]; show(); return; } } catch (e2) {} OS.alert('Search failed', 'Check your internet connection.'); } };
    const A = (n, f) => (win.body.querySelector(`[data-a=${n}]`).onclick = f);
    A('in', () => { st.z = Math.min(18, st.z + 1); show(); }); A('out', () => { st.z = Math.max(1, st.z - 1); show(); });
    A('me', () => navigator.geolocation ? navigator.geolocation.getCurrentPosition((p) => { st = { lat: p.coords.latitude, lon: p.coords.longitude, z: 14, name: 'My location' }; marker = [st.lat, st.lon]; show(); }, (e) => OS.alert('Location unavailable', e.message)) : OS.alert('Unavailable', 'Location is not supported.'));
    A('ext', () => window.open(`https://www.openstreetmap.org/#map=${st.z}/${st.lat}/${st.lon}`, '_blank', 'noopener'));
    show();
  } });

  /* =================== PASSWORD GENERATOR =================== */
  const PW_WORDS = 'apple river cloud tiger maple ocean pixel rocket silver forest candle orbit velvet meadow comet harbor jungle lemon marble nectar oasis pepper quartz raven saddle tulip umbra violet walnut yonder zephyr amber breeze cactus dragon ember falcon glacier hazel island jasmine kettle lagoon mango nimbus olive panda quill ripple sierra thistle urchin valley willow xenon yarrow zinnia'.split(' ');
  OS.registerApp({ id: 'passgen', name: 'Password Generator', icon: 'lock', color: ['#00897b', '#004d40'], cat: 'Accessories', w: 480, h: 560, desc: 'Strong passwords', launch(win) {
    const o = Object.assign({ len: 18, up: true, low: true, num: true, sym: true, mode: 'chars', words: 5 }, OS.store.get('pg', {}));
    win.body.innerHTML = `<div class="scroll pad col"><div class="seg" style="align-self:flex-start"><button data-m="chars">Password</button><button data-m="words">Passphrase</button></div><div class="pg-out selectable" data-out></div><div class="meter"><i data-meter></i></div><div class="small muted" data-strength></div><div class="row"><button class="btn primary" data-a="gen">${gl('refresh')}Generate</button><button class="btn" data-a="copy">${gl('copy')}Copy</button></div><div class="card col" data-opts></div></div>`;
    const $ = (s) => win.body.querySelector(s); const rnd = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
    function gen() {
      let pw, bits;
      if (o.mode === 'words') { const ws = Array.from({ length: o.words }, () => PW_WORDS[rnd(PW_WORDS.length)]); pw = ws.map((w, i) => (i === 0 ? w[0].toUpperCase() + w.slice(1) : w)).join('-') + '-' + rnd(100); bits = o.words * Math.log2(PW_WORDS.length) + 6.6; }
      else { let set = ''; if (o.low) set += 'abcdefghijkmnopqrstuvwxyz'; if (o.up) set += 'ABCDEFGHJKLMNPQRSTUVWXYZ'; if (o.num) set += '23456789'; if (o.sym) set += '!@#$%^&*-_=+?'; if (!set) set = 'abcdefghijkmnopqrstuvwxyz'; pw = Array.from({ length: o.len }, () => set[rnd(set.length)]).join(''); bits = o.len * Math.log2(set.length); }
      $('[data-out]').textContent = pw; const pct = Math.min(100, bits / 1.28); $('[data-meter]').style.width = pct + '%'; $('[data-meter]').style.background = bits < 50 ? '#e5484d' : bits < 80 ? '#f7c948' : '#3fdc77'; $('[data-strength]').textContent = `${Math.round(bits)} bits of entropy — ${bits < 50 ? 'weak' : bits < 80 ? 'good' : 'very strong'}`;
    }
    function opts() { win.body.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('on', b.dataset.m === o.mode)); $('[data-opts]').innerHTML = o.mode === 'words' ? `<label class="row" style="justify-content:space-between">Words: <b>${o.words}</b><input type="range" min="3" max="10" value="${o.words}" data-k="words"></label>` : `<label class="row" style="justify-content:space-between">Length: <b>${o.len}</b><input type="range" min="6" max="64" value="${o.len}" data-k="len"></label>${[['up', 'Uppercase (A–Z)'], ['low', 'Lowercase (a–z)'], ['num', 'Numbers (2–9)'], ['sym', 'Symbols (!@#…)']].map(([k, l]) => `<label class="row" style="justify-content:space-between">${l}<label class="switch"><input type="checkbox" data-k="${k}" ${o[k] ? 'checked' : ''}><i></i></label></label>`).join('')}`; win.body.querySelectorAll('[data-k]').forEach((i) => (i.oninput = () => { o[i.dataset.k] = i.type === 'checkbox' ? i.checked : +i.value; OS.store.set('pg', o); opts(); gen(); })); }
    win.body.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { o.mode = b.dataset.m; OS.store.set('pg', o); opts(); gen(); }));
    $('[data-a=gen]').onclick = gen; $('[data-a=copy]').onclick = async () => { try { await navigator.clipboard.writeText($('[data-out]').textContent); OS.notify('Copied', 'Password copied to clipboard', { app: 'passgen' }); } catch (e) { OS.alert('Copy failed', 'Select the password and copy it manually.'); } };
    opts(); gen();
  } });

  /* =================== DICE & COIN =================== */
  OS.registerApp({ id: 'dice', name: 'Dice & Coin', icon: 'squares', color: ['#ef5350', '#b71c1c'], cat: 'Games', w: 520, h: 600, desc: 'Roll dice', launch(win) {
    let n = 2, sides = 6, hist = [];
    win.body.innerHTML = `<div class="game" style="justify-content:flex-start"><div class="game-head"><div class="seg" data-n>${[1, 2, 3, 4, 5, 6].map((x) => `<button data-v="${x}">${x}</button>`).join('')}</div><select class="inp" data-s style="min-height:32px;padding:4px">${[4, 6, 8, 10, 12, 20, 100].map((x) => `<option value="${x}" ${x === 6 ? 'selected' : ''}>d${x}</option>`).join('')}</select></div><div class="dice-area"></div><div class="row"><button class="btn primary" data-a="roll" style="min-width:120px">${gl('refresh')}Roll</button><button class="btn" data-a="coin">🪙 Flip coin</button></div><div data-total style="font-size:22px;font-weight:700"></div><div class="small muted" data-h style="text-align:center;max-width:420px"></div></div>`;
    const area = win.body.querySelector('.dice-area');
    const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
    const face = (v) => (sides === 6 ? `<div class="die">${Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[v].includes(i) ? 'p' : ''}"></i>`).join('')}</div>` : `<div class="die num">${v}</div>`);
    async function roll() { tone(300, 0.05); for (let k = 0; k < 8; k++) { area.innerHTML = Array.from({ length: n }, () => face(1 + Math.floor(Math.random() * sides))).join(''); area.querySelectorAll('.die').forEach((d) => (d.style.transform = `rotate(${(Math.random() - 0.5) * 40}deg)`)); await OS.sleep(55); } const vals = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * sides)); area.innerHTML = vals.map(face).join(''); const t = vals.reduce((a, b) => a + b, 0); win.body.querySelector('[data-total]').textContent = n > 1 ? `Total: ${t}` : ''; hist.unshift(`${n}d${sides}: ${vals.join('+')}${n > 1 ? '=' + t : ''}`); hist = hist.slice(0, 6); win.body.querySelector('[data-h]').textContent = hist.join('  ·  '); tone(500, 0.08); }
    async function coin() { area.innerHTML = '<div class="coin">🪙</div>'; const c = area.querySelector('.coin'); c.classList.add('flip'); await OS.sleep(900); const r = Math.random() < 0.5 ? 'Heads' : 'Tails'; area.innerHTML = `<div class="coin done">${r === 'Heads' ? '👑' : '🦅'}<small>${r}</small></div>`; win.body.querySelector('[data-total]').textContent = r; hist.unshift(r); hist = hist.slice(0, 6); win.body.querySelector('[data-h]').textContent = hist.join('  ·  '); }
    win.body.querySelectorAll('[data-v]').forEach((b) => (b.onclick = () => { n = +b.dataset.v; win.body.querySelectorAll('[data-v]').forEach((x) => x.classList.toggle('on', x === b)); roll(); }));
    win.body.querySelector('[data-s]').onchange = (e) => { sides = +e.target.value; roll(); };
    win.body.querySelector('[data-a=roll]').onclick = roll; win.body.querySelector('[data-a=coin]').onclick = coin;
    OS.wm.keys(win, (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); roll(); } });
    win.body.querySelector('[data-v="2"]').classList.add('on'); roll();
  } });

  /* =================== MORSE =================== */
  const MORSE = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.', '@': '.--.-.', '=': '-...-' };
  const RMORSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
  OS.registerApp({ id: 'morse', name: 'Morse Code', icon: 'zap', color: ['#546e7a', '#263238'], cat: 'Education', w: 560, h: 560, desc: 'Text ↔ Morse', launch(win) {
    let playing = false;
    win.body.innerHTML = `<div class="scroll pad col"><label class="small muted">Text</label><textarea class="inp" data-t rows="3" style="resize:vertical;font-size:16px">SOS hello world</textarea><label class="small muted">Morse ( . - and / between words )</label><textarea class="inp" data-m rows="3" style="resize:vertical;font-family:var(--mono);font-size:18px;letter-spacing:2px"></textarea><div class="row"><button class="btn primary" data-a="play">${gl('play')}Play sound</button><label class="small row">Speed<input type="range" min="8" max="30" value="16" data-wpm style="width:90px"></label><div class="morse-lamp"></div></div><details class="small"><summary>Alphabet</summary><div class="morse-tab">${Object.entries(MORSE).map(([k, v]) => `<span><b>${k.toUpperCase()}</b> ${v}</span>`).join('')}</div></details></div>`;
    const $ = (s) => win.body.querySelector(s);
    const toM = () => ($('[data-m]').value = $('[data-t]').value.toLowerCase().split(/\s+/).filter(Boolean).map((w) => [...w].map((c) => MORSE[c] || '').filter(Boolean).join(' ')).join(' / '));
    const toT = () => ($('[data-t]').value = $('[data-m]').value.trim().split(/\s*\/\s*/).map((w) => w.split(/\s+/).map((c) => RMORSE[c] || '').join('')).join(' ').toUpperCase());
    $('[data-t]').oninput = toM; $('[data-m]').oninput = toT;
    $('[data-a=play]').onclick = async () => { if (playing) { playing = false; return; } playing = true; $('[data-a=play]').innerHTML = `${gl('square')}Stop`; const A = OS.audio(); const u = 1.2 / +$('[data-wpm]').value; const lamp = $('.morse-lamp'); for (const ch of $('[data-m]').value) { if (!playing) break; if (ch === '.' || ch === '-') { const d = ch === '.' ? u : u * 3; if (A) { const o = A.createOscillator(), g = A.createGain(); o.frequency.value = 650; g.gain.setValueAtTime(0.0001, A.currentTime); g.gain.linearRampToValueAtTime(0.2 * OS.settings.volume / 100, A.currentTime + 0.005); g.gain.setValueAtTime(0.2 * OS.settings.volume / 100, A.currentTime + d); g.gain.linearRampToValueAtTime(0.0001, A.currentTime + d + 0.01); o.connect(g).connect(A.destination); o.start(); o.stop(A.currentTime + d + 0.03); } lamp.classList.add('on'); await OS.sleep(d * 1000); lamp.classList.remove('on'); await OS.sleep(u * 1000); } else if (ch === ' ') await OS.sleep(u * 2000); else if (ch === '/') await OS.sleep(u * 4000); } playing = false; $('[data-a=play]').innerHTML = `${gl('play')}Play sound`; };
    win.onClose(() => (playing = false)); toM();
  } });

  /* =================== KALEIDOSCOPE =================== */
  OS.registerApp({ id: 'kaleido', name: 'Kaleidoscope', icon: 'palette', color: ['#ab47bc', '#26c6da'], cat: 'Graphics', w: 720, h: 680, desc: 'Symmetry drawing', launch(win) {
    let n = 8, hue = 0, size = 4, mirror = true;
    win.body.innerHTML = `<div class="toolbar"><label class="small row">Mirrors<input type="range" min="2" max="16" value="8" data-n style="width:90px"></label><label class="small row">Brush<input type="range" min="1" max="20" value="4" data-sz style="width:80px"></label><button class="ibtn on" data-a="mir" title="Reflect">${gl('squares')}</button><span class="grow"></span><button class="btn sm" data-a="clear">Clear</button><button class="btn sm primary" data-a="save">${gl('save')}Save</button></div><div class="gwrap" style="flex:1;display:grid;place-items:center;min-height:0;background:#0b0b14"><canvas width="900" height="900" style="touch-action:none;border-radius:50%;background:#0b0b14"></canvas></div>`;
    const cv = win.body.querySelector('canvas'), g = cv.getContext('2d'), wrap = win.body.querySelector('.gwrap'); g.lineCap = 'round';
    let last = null; const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 900 - 450, (e.clientY - r.top) / r.height * 900 - 450]; };
    const stroke = (a, b) => { hue = (hue + 1.5) % 360; g.strokeStyle = `hsl(${hue},90%,60%)`; g.lineWidth = size; g.shadowBlur = size * 1.5; g.shadowColor = g.strokeStyle; for (let i = 0; i < n; i++) { const ang = i * Math.PI * 2 / n; [1, mirror ? -1 : null].forEach((m) => { if (m == null) return; g.save(); g.translate(450, 450); g.rotate(ang); g.scale(1, m); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); g.restore(); }); } };
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); last = pos(e); }); cv.addEventListener('pointermove', (e) => { if (!last) return; const p = pos(e); stroke(last, p); last = p; }); cv.addEventListener('pointerup', () => (last = null));
    win.body.querySelector('[data-n]').oninput = (e) => (n = +e.target.value); win.body.querySelector('[data-sz]').oninput = (e) => (size = +e.target.value);
    win.body.querySelector('[data-a=mir]').onclick = (e) => { mirror = !mirror; e.currentTarget.classList.toggle('on', mirror); };
    win.body.querySelector('[data-a=clear]').onclick = () => g.clearRect(0, 0, 900, 900);
    win.body.querySelector('[data-a=save]').onclick = () => { const c2 = document.createElement('canvas'); c2.width = c2.height = 900; const g2 = c2.getContext('2d'); g2.fillStyle = '#0b0b14'; g2.fillRect(0, 0, 900, 900); g2.drawImage(cv, 0, 0); OS.fs.mkdir(OS.home() + '/Pictures', { p: true }); const p = OS.fs.uniqueName(OS.home() + '/Pictures', 'Kaleidoscope.jpg'); OS.fs.write(p, c2.toDataURL('image/jpeg', 0.85)); OS.notify('Saved', OS.fs.pretty(p), { app: 'kaleido' }); };
    win.onResize = () => fitCanvas(cv, wrap, 1, 900); setTimeout(win.onResize, 0);
  } });

  /* =================== REACTION TIME =================== */
  OS.registerApp({ id: 'reaction', name: 'Reaction Time', icon: 'zap', color: ['#fdd835', '#f57f17'], cat: 'Games', w: 520, h: 520, desc: 'How fast are you?', launch(win) {
    let state = 'idle', t0 = 0, timer = null, times = [];
    win.body.innerHTML = `<div class="rx" data-st="idle"><b data-big>Tap to start</b><small data-small>When the screen turns green, tap as fast as you can.</small></div>`;
    const el = win.body.querySelector('.rx'), big = el.querySelector('[data-big]'), small = el.querySelector('[data-small]');
    const set = (s, b, sm) => { state = s; el.dataset.st = s; big.textContent = b; small.textContent = sm; };
    el.addEventListener('pointerdown', () => {
      if (state === 'idle' || state === 'result' || state === 'early') { set('wait', 'Wait for green…', ''); timer = setTimeout(() => { set('go', 'TAP!', ''); t0 = performance.now(); }, 1200 + Math.random() * 2500); }
      else if (state === 'wait') { clearTimeout(timer); set('early', 'Too soon!', 'Tap to try again.'); OS.sound('error'); }
      else if (state === 'go') { const ms = Math.round(performance.now() - t0); times.push(ms); const b = best('reaction', ms, true); set('result', `${ms} ms`, `Average ${Math.round(times.reduce((a, x) => a + x, 0) / times.length)} ms · best ${b} ms · tap to go again`); tone(880, 0.1); }
    });
    win.onClose(() => clearTimeout(timer));
  } });

  /* =================== CLI fun =================== */
  const { def, opts, stripAnsi } = OS.shell;
  const needTTY = (ctx, n) => { if (!ctx.term.tui || !ctx.isTTY) { ctx.err(`${n}: needs an interactive terminal\n`); return false; } return true; };
  const touchSoft = (l) => (OS.isTouch() ? l : null);
  def('pet', 'toggle the desktop pet', (ctx) => { const on = ctx.args[0] === 'off' ? false : ctx.args[0] === 'on' ? true : !OS.settings.pet; OS.set('pet', on); ctx.println(on ? '🌱 Sprig is now living on your desktop! (pet off to say goodbye)' : 'Sprig waves goodbye 👋'); });
  def('espeak say spd-say', 'speak text aloud', (ctx) => { const t = ctx.args.filter((a) => !a.startsWith('-')).join(' ') || (ctx.stdin || '').trim(); if (!t) { ctx.err('Usage: say <text>\n'); return 1; } if (!window.speechSynthesis) { ctx.err('speech synthesis is not supported by this browser\n'); return 1; } const u = new SpeechSynthesisUtterance(t); u.volume = OS.settings.volume / 100; speechSynthesis.speak(u); return new Promise((r) => { u.onend = () => r(0); setTimeout(() => r(0), Math.min(60000, t.length * 120 + 1000)); }); });
  def('rig', 'random identity generator', (ctx) => { const F = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Riley', 'Casey', 'Jamie', 'Avery', 'Quinn', 'Robin', 'Charlie'], L = ['Lindqvist', 'Moreno', 'Okafor', 'Nakamura', 'Fischer', 'Rossi', 'Kowalski', 'Haddad', 'Silva', 'Novak', 'Andersson', 'Dubois'], S = ['Maple', 'Harbor', 'Elm', 'Cedar', 'Willow', 'Ocean', 'Hill', 'Lake', 'Pine', 'River'], C = [['Springfield', 'IL', '62701'], ['Riverside', 'CA', '92501'], ['Fairview', 'TN', '37062'], ['Greenville', 'SC', '29601'], ['Madison', 'WI', '53703'], ['Salem', 'OR', '97301']]; const r = (a) => a[Math.random() * a.length | 0]; const c = r(C); ctx.println(`${r(F)} ${r(L)}\n${100 + (Math.random() * 9800 | 0)} ${r(S)} St\n${c[0]}, ${c[1]}  ${c[2]}\n(${200 + (Math.random() * 700 | 0)}) 555-${String(Math.random() * 10000 | 0).padStart(4, '0')}`); });
  def('boxes', 'draw a box around text', (ctx) => { const [o, r] = opts(ctx.args, 'd:'); const text = (r.join(' ') || (ctx.stdin || '').replace(/\n$/, '') || 'Hello, Cirrus!').split('\n'); const w = Math.max(...text.map((l) => stripAnsi(l).length)); const styles = { stone: ['+', '-', '+', '|', '+', '+'], double: ['╔', '═', '╗', '║', '╚', '╝'], round: ['╭', '─', '╮', '│', '╰', '╯'], stars: ['*', '*', '*', '*', '*', '*'], hash: ['#', '#', '#', '#', '#', '#'] }; const [tl, h, tr, v, bl, br] = styles[o.d] || styles.round; ctx.println(tl + h.repeat(w + 2) + tr); text.forEach((l) => ctx.println(`${v} ${l}${' '.repeat(w - stripAnsi(l).length)} ${v}`)); ctx.println(bl + h.repeat(w + 2) + br); if (!o.d) ctx.println('\x1b[90m(styles: boxes -d stone|double|round|stars|hash)\x1b[0m'); });
  def('wttr', 'weather report from wttr.in', async (ctx) => { const loc = ctx.args.join('+'); try { const r = await fetch(`https://wttr.in/${encodeURIComponent(loc)}?format=4`, { signal: ctx.signal }); if (!r.ok) throw new Error(r.status); ctx.println((await r.text()).trim()); } catch (e) { try { const l = OS.store.get('wx-loc', { name: 'Stockholm', lat: 59.33, lon: 18.07 }); const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${l.lat}&longitude=${l.lon}&current=temperature_2m,wind_speed_10m,relative_humidity_2m`); const j = await r.json(); ctx.println(`${l.name}: 🌡️ ${j.current.temperature_2m}°C 💨 ${j.current.wind_speed_10m} km/h 💧 ${j.current.relative_humidity_2m}%`); } catch (e2) { ctx.err('wttr: could not reach the weather service (offline?)\n'); return 1; } } });
  // animated TUI toys
  const anim = (ctx, name, setup) => { if (!needTTY(ctx, name)) return 1; return ctx.term.tui(Object.assign({ key(k, api) { if (k === 'q' || k === 'C-c' || k === 'Escape') api.exit(); } }, setup)); };
  def('cbonsai', 'grow a bonsai tree', async (ctx) => {
    const [o] = opts(ctx.args); const live = !o.p;
    let grid, colr, growth = 0, total = 0, msg = o.m || '';
    const plan = (W, H) => { grid = Array.from({ length: H }, () => Array(W).fill(' ')); colr = Array.from({ length: H }, () => Array(W).fill('')); const steps = []; const branch = (x, y, life, dx, kind) => { while (life-- > 0 && y > 1 && x > 1 && x < W - 2) { const d = Math.random(); let nx = x, ny = y; if (kind === 'trunk') { ny--; nx += d < 0.25 ? -1 : d > 0.75 ? 1 : 0; } else { nx += dx; if (d < 0.4) ny--; } x = OS.clamp(nx, 1, W - 2); y = ny; const ch = kind === 'trunk' ? (dx < 0 ? '\\' : '|') : dx > 0 ? '/' : '\\'; steps.push([x, y, life < 3 ? '&' : ch, life < 3 ? 'leaf' : 'wood']); if (kind === 'trunk' && Math.random() < 0.3 && life > 3) branch(x, y, 4 + (Math.random() * 6 | 0), Math.random() < 0.5 ? -1 : 1, 'branch'); if (life < 4) for (let k = 0; k < 4; k++) steps.push([OS.clamp(x + (Math.random() * 5 | 0) - 2, 1, W - 2), OS.clamp(y + (Math.random() * 3 | 0) - 1, 1, H - 1), '&', 'leaf']); } }; branch(Math.floor(W / 2), H - 4, Math.min(H - 6, 16 + (Math.random() * 8 | 0)), 0, 'trunk'); return steps; };
    let steps = null;
    return anim(ctx, 'cbonsai', {
      init(api) { steps = plan(api.cols, api.rows); total = steps.length; if (!live) growth = total; else api.interval(() => { growth = Math.min(total, growth + 2); }, 30); api.soft(touchSoft([{ k: 'q', label: 'Quit', send: 'q' }, { k: 'r', label: 'Regrow', send: 'r' }])); },
      key(k, api) { if (k === 'r') { steps = plan(api.cols, api.rows); total = steps.length; growth = live ? 0 : total; } else if (k === 'q' || k === 'C-c' || k === 'Escape') api.exit(); },
      render(api) { const W = api.cols, H = api.rows; grid = Array.from({ length: H }, () => Array(W).fill(' ')); colr = Array.from({ length: H }, () => Array(W).fill('')); steps.slice(0, growth).forEach(([x, y, ch, t]) => { if (y >= 0 && y < H && x < W) { grid[y][x] = ch; colr[y][x] = t === 'leaf' ? (Math.random() < 0.5 ? '\x1b[92m' : '\x1b[32m') : '\x1b[33m'; } }); const px = Math.floor(W / 2) - 6; const pot = ['\x1b[90m:\x1b[33m___________\x1b[90m./~~\\.\x1b[33m___________\x1b[90m:', ' \\                          / ', '  \\________________________/ ', '  (_)                    (_)']; const out = grid.map((row, y) => row.map((c, x) => (colr[y][x] ? colr[y][x] + c + '\x1b[0m' : c)).join('')); pot.forEach((l, i) => { const y = H - 4 + i; if (y >= 0) out[y] = ' '.repeat(Math.max(0, px - 8)) + '\x1b[90m' + l + '\x1b[0m'; }); if (msg) out[1] = '  ' + msg; return out; },
    });
  });
  def('pipes pipes.sh', 'animated pipes screensaver', async (ctx) => {
    const COLS = [31, 32, 33, 34, 35, 36, 91, 92, 93, 94, 95, 96]; let scr = [], ps = [];
    const CH = { '0,0': '│', '1,1': '│', '2,2': '─', '3,3': '─', '0,2': '┌', '0,3': '┐', '1,2': '└', '1,3': '┘', '2,0': '┘', '2,1': '┐', '3,0': '└', '3,1': '┌' };
    return anim(ctx, 'pipes', {
      init(api) { scr = Array.from({ length: api.rows }, () => Array(api.cols).fill(' ')); ps = Array.from({ length: 5 }, () => ({ x: Math.random() * api.cols | 0, y: Math.random() * api.rows | 0, d: Math.random() * 4 | 0, c: COLS[Math.random() * COLS.length | 0] })); let n = 0; api.interval(() => { if (++n > 1600) { n = 0; scr = Array.from({ length: api.rows }, () => Array(api.cols).fill(' ')); } ps.forEach((p) => { let nd = p.d; if (Math.random() < 0.15) nd = p.d < 2 ? 2 + (Math.random() * 2 | 0) : Math.random() * 2 | 0; const ch = CH[`${p.d},${nd}`] || (nd < 2 ? '│' : '─'); if (scr[p.y]) scr[p.y][p.x] = `\x1b[${p.c}m${ch}\x1b[0m`; p.d = nd; p.y += [-1, 1, 0, 0][nd]; p.x += [0, 0, 1, -1][nd]; if (p.x < 0 || p.y < 0 || p.x >= api.cols || p.y >= api.rows) { p.x = (p.x + api.cols) % api.cols; p.y = (p.y + api.rows) % api.rows; p.c = COLS[Math.random() * COLS.length | 0]; } }); }, 25); api.soft(touchSoft([{ k: 'q', label: 'Quit', send: 'q' }])); },
      resize(api) { scr = Array.from({ length: api.rows }, () => Array(api.cols).fill(' ')); },
      render() { return scr.map((r) => r.join('')); },
    });
  });
  def('nyancat', 'rainbow cat flying through space', async (ctx) => {
    let t = 0; const cat = ['  ,------,', '  |   /\\_/\\', '~|__( ^ .^)', '  ""  ""   '];
    return anim(ctx, 'nyancat', {
      init(api) { api.interval(() => t++, 90); api.soft(touchSoft([{ k: 'q', label: 'Quit', send: 'q' }])); },
      render(api) { const W = api.cols, H = api.rows; const out = Array.from({ length: H }, (_, y) => { let s = ''; for (let x = 0; x < W; x++) s += (x * 7 + y * 13 + t * 3) % 97 === 0 ? '\x1b[97m*\x1b[0m' : (x * 5 + y * 3 - t) % 89 === 0 ? '\x1b[90m.\x1b[0m' : ' '; return '\x1b[44m' + s + '\x1b[0m'; }); const cy = Math.floor(H / 2) - 3, cx = Math.floor(W / 2) - 5, cols = [41, 43, 103, 42, 44, 45]; for (let i = 0; i < 6; i++) { const y = cy + i; if (y < 0 || y >= H) continue; let row = ''; for (let x = 0; x < cx; x++) row += `\x1b[${cols[i]}m${((x + t) >> 2) % 2 ? ' ' : ' '}`; out[y] = row + '\x1b[0m\x1b[44m' + ' '.repeat(Math.max(0, W - cx)) + '\x1b[0m'; } cat.forEach((l, i) => { const y = cy + 1 + i + ((t >> 1) % 2); if (y >= 0 && y < H) out[y] = out[y].replace(/\x1b\[44m( +)\x1b\[0m$/, (m, sp) => `\x1b[44;97m${l}${' '.repeat(Math.max(0, sp.length - l.length))}\x1b[0m`); }); out[H - 1] = `\x1b[44;97m  You have nyaned for ${(t * 0.09).toFixed(1)} seconds!`.padEnd(W + 8) + '\x1b[0m'; return out; },
    });
  });
  def('hollywood', 'fill the terminal with hacker movie screens', async (ctx) => {
    const lines = []; const gen = () => { const r = Math.random(); if (r < 0.2) return `\x1b[32m${Array.from({ length: 8 }, () => (Math.random() * 65536 | 0).toString(16).padStart(4, '0')).join(' ')}\x1b[0m`; if (r < 0.4) return `\x1b[36m[${new Date().toISOString().slice(11, 19)}]\x1b[0m ${['ACCESS GRANTED', 'decrypting packet', 'rerouting proxy', 'compiling kernel module', 'scanning port ' + (Math.random() * 65535 | 0), 'injecting payload', 'bypassing firewall', 'handshake OK'][Math.random() * 8 | 0]}`; if (r < 0.6) return `\x1b[33m${'█'.repeat(Math.random() * 30 | 0)}\x1b[90m${'░'.repeat(Math.random() * 20 | 0)}\x1b[0m ${Math.random() * 100 | 0}%`; if (r < 0.8) return `\x1b[35mfunction\x1b[0m ${['hack', 'trace', 'crack', 'sync'][Math.random() * 4 | 0]}_${(Math.random() * 999 | 0)}() { \x1b[90m/* ${Math.random().toString(36).slice(2)} */\x1b[0m }`; return `\x1b[31m${Math.random().toString(2).slice(2, 50)}\x1b[0m`; };
    return anim(ctx, 'hollywood', { init(api) { api.interval(() => { for (let i = 0; i < 3; i++) lines.push(gen()); if (lines.length > 400) lines.splice(0, 200); }, 60); api.soft(touchSoft([{ k: 'q', label: 'Quit', send: 'q' }])); }, render(api) { const W = api.cols, H = api.rows, half = Math.floor(W / 2); const L = lines.slice(-H), R = lines.slice(-H * 2, -H); const cut = (s, n) => { let out = '', v = 0; for (const p of s.split(/(\x1b\[[0-9;]*m)/)) { if (/^\x1b/.test(p)) { out += p; continue; } const t2 = p.slice(0, n - v); out += t2; v += t2.length; } return out + '\x1b[0m' + ' '.repeat(Math.max(0, n - v)); }; return Array.from({ length: H }, (_, i) => cut(L[i] || '', half - 1) + '\x1b[90m│\x1b[0m' + cut(R[i] || '', W - half)); } });
  });
  def('tty-clock', 'big digital clock', async (ctx) => {
    const D = { 0: ['███', '█ █', '█ █', '█ █', '███'], 1: ['  █', '  █', '  █', '  █', '  █'], 2: ['███', '  █', '███', '█  ', '███'], 3: ['███', '  █', '███', '  █', '███'], 4: ['█ █', '█ █', '███', '  █', '  █'], 5: ['███', '█  ', '███', '  █', '███'], 6: ['███', '█  ', '███', '█ █', '███'], 7: ['███', '  █', '  █', '  █', '  █'], 8: ['███', '█ █', '███', '█ █', '███'], 9: ['███', '█ █', '███', '  █', '███'], ':': [' ', '█', ' ', '█', ' '] };
    const [o] = opts(ctx.args); let color = 32;
    return anim(ctx, 'tty-clock', {
      init(api) { api.interval(() => {}, 500); api.soft(touchSoft([{ k: 'q', label: 'Quit', send: 'q' }, { k: 'c', label: 'Color', send: 'c' }])); },
      key(k, api) { if (k === 'c') color = 31 + ((color - 30) % 7); else if (k === 'q' || k === 'C-c' || k === 'Escape') api.exit(); },
      render(api) { const W = api.cols, H = api.rows; const d = new Date(); const t = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}${o.s ? ':' + String(d.getSeconds()).padStart(2, '0') : ''}`; const big = W >= 60; const rows = Array.from({ length: 5 }, (_, r) => [...t].map((c) => D[c][r].replace(/█/g, big ? '██' : '█').replace(/ /g, big ? '  ' : ' ')).join(big ? '  ' : ' ')); const out = Array(H).fill(''); const y0 = Math.floor(H / 2) - 3; rows.forEach((l, i) => (out[y0 + i] = ' '.repeat(Math.max(0, Math.floor((W - l.length) / 2))) + `\x1b[${color}m${l}\x1b[0m`)); const ds = d.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' }); out[y0 + 6] = ' '.repeat(Math.max(0, Math.floor((W - ds.length) / 2))) + `\x1b[${color}m${ds}\x1b[0m`; return out; },
    });
  });
  def('donut', 'spinning ASCII donut', async (ctx) => {
    let A = 0, B = 0;
    return anim(ctx, 'donut', {
      init(api) { api.interval(() => { A += 0.07; B += 0.03; }, 40); api.soft(touchSoft([{ k: 'q', label: 'Quit', send: 'q' }])); },
      render(api) { const W = api.cols, H = api.rows; const b = Array(W * H).fill(' '), z = Array(W * H).fill(0); const cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B); const K = Math.min(W / 2.2, H) * 0.9; for (let j = 0; j < 6.28; j += 0.07) { const ct = Math.cos(j), st = Math.sin(j); for (let i = 0; i < 6.28; i += 0.02) { const sp = Math.sin(i), cp = Math.cos(i), h = ct + 2, D = 1 / (sp * h * sA + st * cA + 5), t = sp * h * cA - st * sA; const x = Math.floor(W / 2 + K * 0.75 * D * (cp * h * cB - t * sB) * 2), y = Math.floor(H / 2 + K * 0.45 * D * (cp * h * sB + t * cB) * 2); const o = x + W * y, N = Math.floor(8 * ((st * sA - sp * ct * cA) * cB - sp * ct * sA - st * cA - cp * ct * sB)); if (y >= 0 && y < H && x >= 0 && x < W && D > z[o]) { z[o] = D; b[o] = '.,-~:;=!*#$@'[N > 0 ? N : 0]; } } } const out = []; for (let y = 0; y < H; y++) out.push('\x1b[33m' + b.slice(y * W, y * W + W).join('') + '\x1b[0m'); return out; },
    });
  });
  def('2048', 'play 2048 in the terminal', async (ctx) => {
    if (!needTTY(ctx, '2048')) return 1;
    let g = Array(16).fill(0), score = 0, over = false, best2 = OS.store.get('scores', {})['2048cli'] || 0;
    const add = () => { const e = g.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0); if (e.length) g[e[Math.random() * e.length | 0]] = Math.random() < 0.9 ? 2 : 4; };
    const move = (d) => { let moved = false; for (let k = 0; k < 4; k++) { const idx = [0, 1, 2, 3].map((j) => (d === 'l' ? k * 4 + j : d === 'r' ? k * 4 + 3 - j : d === 'u' ? j * 4 + k : (3 - j) * 4 + k)); const v = idx.map((i) => g[i]).filter(Boolean); const out = []; for (let i = 0; i < v.length; i++) { if (v[i] === v[i + 1]) { out.push(v[i] * 2); score += v[i] * 2; i++; } else out.push(v[i]); } while (out.length < 4) out.push(0); idx.forEach((i, j) => { if (g[i] !== out[j]) moved = true; g[i] = out[j]; }); } if (moved) add(); over = !g.some((v, i) => !v || (i % 4 < 3 && v === g[i + 1]) || (i < 12 && v === g[i + 4])); if (over) { const s = OS.store.get('scores', {}); if (score > (s['2048cli'] || 0)) { s['2048cli'] = score; OS.store.set('scores', s); best2 = score; } } };
    add(); add();
    const COL = { 0: '90', 2: '97', 4: '93', 8: '33', 16: '91', 32: '31', 64: '95', 128: '35', 256: '94', 512: '34', 1024: '96', 2048: '92' };
    return ctx.term.tui({
      init(api) { api.soft(touchSoft([{ k: '←', label: '', send: 'ArrowLeft' }, { k: '↑', label: '', send: 'ArrowUp' }, { k: '↓', label: '', send: 'ArrowDown' }, { k: '→', label: '', send: 'ArrowRight' }, { k: 'r', label: 'Restart', send: 'r' }, { k: 'q', label: 'Quit', send: 'q' }])); },
      key(k, api) { const m = { ArrowLeft: 'l', a: 'l', h: 'l', ArrowRight: 'r', d: 'r', l: 'r', ArrowUp: 'u', w: 'u', k: 'u', ArrowDown: 'dn', s: 'dn', j: 'dn', WheelUp: 'u', WheelDown: 'dn' }[k]; if (k === 'q' || k === 'C-c' || k === 'Escape') return api.exit(); if (k === 'r') { g = Array(16).fill(0); score = 0; over = false; add(); add(); return; } if (m && !over) move(m === 'dn' ? 'd' : m); },
      render(api) { const out = ['', `  \x1b[1m2048\x1b[0m   score \x1b[1m${score}\x1b[0m   best ${best2}`, '']; const cw = 7; out.push('  ┌' + Array(4).fill('─'.repeat(cw)).join('┬') + '┐'); for (let r = 0; r < 4; r++) { out.push('  │' + [0, 1, 2, 3].map((c) => { const v = g[r * 4 + c]; const s = v ? String(v) : '·'; const p = cw - s.length; return ' '.repeat(Math.floor(p / 2)) + `\x1b[1;${COL[Math.min(v, 2048)] || 92}m${s}\x1b[0m` + ' '.repeat(Math.ceil(p / 2)); }).join('│') + '│'); if (r < 3) out.push('  ├' + Array(4).fill('─'.repeat(cw)).join('┼') + '┤'); } out.push('  └' + Array(4).fill('─'.repeat(cw)).join('┴') + '┘'); out.push(''); out.push(over ? '  \x1b[1;31mGame over!\x1b[0m  r = restart, q = quit' : '  arrows / wasd / hjkl to move · r restart · q quit'); return out; },
    });
  });
})();
