/* Cirrus Linux — full-screen terminal programs: nano, vi/vim, less/more, man, top, htop, watch, alsamixer */
(function () {
  'use strict';
  const { def, opts, readInput, lines, C, stripAnsi, procs, uptimeStr } = OS.shell;
  const HELP = OS.shell.HELP;
  const TAB = 4;
  const ESC_RE = /\x1b\[[0-9;]*m/g;
  const vlen = (s) => s.replace(ESC_RE, '').length;
  const inv = (s) => `\x1b[7m${s}\x1b[27m`;
  const bold = (s) => `\x1b[1m${s}\x1b[22m`;
  /* ANSI-aware cut / pad */
  function cutA(s, n) {
    let out = '', vis = 0; const parts = s.split(/(\x1b\[[0-9;]*m)/);
    for (const p of parts) { if (/^\x1b\[/.test(p)) { out += p; continue; } if (vis >= n) continue; const take = p.slice(0, n - vis); out += take; vis += take.length; }
    return out;
  }
  const padA = (s, n) => { const l = vlen(s); return l >= n ? cutA(s, n) : s + ' '.repeat(n - l); };
  const center = (s, n) => { const l = vlen(s); if (l >= n) return cutA(s, n); const a = Math.floor((n - l) / 2); return ' '.repeat(a) + s + ' '.repeat(n - l - a); };
  /* wrap an ANSI line to width, carrying color state */
  function wrapA(s, w) {
    if (vlen(s) <= w) return [s];
    const out = []; let cur = '', vis = 0, sgr = '';
    for (const p of s.split(/(\x1b\[[0-9;]*m)/)) {
      if (/^\x1b\[/.test(p)) { cur += p; sgr = p === '\x1b[0m' ? '' : sgr + p; continue; }
      for (const ch of p) { if (vis >= w) { out.push(cur + '\x1b[0m'); cur = sgr; vis = 0; } cur += ch; vis++; }
    }
    out.push(cur); return out;
  }
  const clean = (s) => s.replace(/\x1b/g, '^[').replace(/[\x00-\x08\x0b-\x1f]/g, '?');
  /* tab-aware visual columns */
  const expand = (l) => { let o = ''; for (const ch of l) { if (ch === '\t') o += ' '.repeat(TAB - (o.length % TAB)); else o += ch; } return o; };
  const vcol = (l, x) => expand(l.slice(0, x)).length;
  const xFromV = (l, v) => { let c = 0; for (let i = 0; i < l.length; i++) { const n = l[i] === '\t' ? TAB - (c % TAB) : 1; if (c + n > v) return i; c += n; } return l.length; };
  const isPrint = (k) => k.length === 1 && k >= ' ';
  const needTTY = (ctx, name) => { if (!ctx.term.tui || !ctx.isTTY) { ctx.err(`${name}: standard output is not a terminal\n`); return false; } return true; };
  function loadBuf(path) {
    if (!path) return { L: [''], msg: '' };
    if (OS.fs.isDir(path)) return { L: [''], msg: `"${OS.fs.basename(path)}" is a directory`, err: true };
    if (!OS.fs.exists(path)) return { L: [''], msg: 'New File', isNew: true };
    let c = OS.fs.read(path); if (OS.isDataUrl(c)) return { L: ['[binary data]'], msg: 'Binary file', err: true };
    const L = c.split('\n'); if (L.length > 1 && L[L.length - 1] === '') L.pop();
    return { L, msg: '', bytes: c.length };
  }
  const writeBuf = (path, L) => OS.fs.write(path, L.length === 1 && L[0] === '' ? '' : L.join('\n') + '\n');
  const touchOnly = (list) => (OS.isTouch() ? list : null);

  /* ============================== NANO ============================== */
  function nano(ctx, file, startLine) {
    const path = file ? ctx.path(file) : null;
    const b = loadBuf(path);
    let L = b.L, cy = 0, cx = 0, top = 0, mod = false, name = file || '', msg = b.isNew ? '[ New File ]' : b.err ? `[ ${b.msg} ]` : path ? `[ Read ${L.length} line${L.length === 1 ? '' : 's'} ]` : '';
    let prompt = null, cutbuf = [], lastCut = false, help = false, undo = [], redo = [], lastT = 0, lastKind = '', wantV = null, lastSearch = '', softMode = '', curHs = 0;
    if (startLine) cy = OS.clamp(startLine - 1, 0, L.length - 1);
    const H = (api) => Math.max(1, api.rows - 4);
    const snap = (kind) => { const t = Date.now(); if (kind !== lastKind || t - lastT > 1200) { undo.push({ L: L.slice(), cy, cx }); if (undo.length > 300) undo.shift(); redo = []; } lastKind = kind; lastT = t; mod = true; };
    const save = (fn) => { try { const p = ctx.path(fn); writeBuf(p, L); name = fn; mod = false; msg = `[ Wrote ${L.length} line${L.length === 1 ? '' : 's'} ]`; return true; } catch (e) { msg = `[ Error writing ${fn}: ${e.code || e.message} ]`; return false; } };
    const ask = (label, init, cb, yn) => { prompt = { label, buf: init || '', cur: (init || '').length, cb, yn }; };
    const find = (q, from) => { if (!q) return; lastSearch = q; const ql = q.toLowerCase(); for (let n = 0; n <= L.length; n++) { const i = (cy + n) % L.length; const start = n === 0 ? from : 0; const j = L[i].toLowerCase().indexOf(ql, start); if (j >= 0) { if (n && i <= cy) msg = '[ Search Wrapped ]'; cy = i; cx = j; return; } } msg = `[ "${q}" not found ]`; };
    const doExit = (api) => api.exit();
    const SC = [['^G', 'Help', 'C-g'], ['^O', 'Write Out', 'C-o'], ['^W', 'Where Is', 'C-w'], ['^K', 'Cut', 'C-k'], ['^T', 'Execute', 'C-t'], ['^C', 'Location', 'C-c'], ['M-U', 'Undo', 'M-u'], ['^X', 'Exit', 'C-x'], ['^R', 'Read File', 'C-r'], ['^\\', 'Replace', 'C-\\'], ['^U', 'Paste', 'C-u'], ['^J', 'Justify', 'C-j'], ['^_', 'Go To Line', 'C-_'], ['M-E', 'Redo', 'M-e']];
    const scLayout = (api) => { const items = prompt ? (prompt.yn ? [[' Y', 'Yes', 'y'], [' N', 'No', 'n'], ['^C', 'Cancel', 'C-c']] : [['^G', 'Help', 'C-g'], ['^C', 'Cancel', 'C-c']]) : api.cols < 56 ? [SC[0], SC[1], SC[2], SC[3], SC[7], SC[10], SC[6], SC[12]] : SC; const per = Math.ceil(items.length / 2); const w = Math.floor(api.cols / per); return { items, per, w }; };
    const updSoft = (api) => {
      const mode = prompt ? (prompt.yn ? 'yn' : 'p') : help ? 'h' : 'e'; if (mode === softMode) return; softMode = mode;
      api.soft(touchOnly(mode === 'yn' ? [{ k: 'Y', label: 'Yes', send: 'y' }, { k: 'N', label: 'No', send: 'n' }, { k: '^C', label: 'Cancel', send: 'C-c' }] : mode === 'p' ? [{ k: '↵', label: 'OK', send: 'Enter' }, { k: '^C', label: 'Cancel', send: 'C-c' }] : mode === 'h' ? [{ k: '^X', label: 'Close help', send: 'C-x' }] : [{ k: '^X', label: 'Exit', send: 'C-x' }, { k: '^S', label: 'Save', send: 'C-s' }, { k: '^O', label: 'Save as', send: 'C-o' }, { k: '^W', label: 'Find', send: 'C-w' }, { k: '^K', label: 'Cut', send: 'C-k' }, { k: '^U', label: 'Paste', send: 'C-u' }, { k: 'M-U', label: 'Undo', send: 'M-u' }, { k: 'M-E', label: 'Redo', send: 'M-e' }, { k: '^_', label: 'Line', send: 'C-_' }, { k: '^C', label: 'Where', send: 'C-c' }, { k: '^G', label: 'Help', send: 'C-g' }]));
    };
    const HELPTXT = ['Main nano help text', '', 'The nano editor is designed to emulate the functionality and ease-of-use of the', 'UW Pico text editor. There are four main sections: the title bar at the top, the', 'edit window, the status bar, and the shortcut list at the bottom.', '', 'Shortcuts are written as ^ (Ctrl) or M- (Alt). On touch screens, use the', 'buttons below the editor or the sticky Ctrl key.', '', '^G  F1     Display this help text', '^X         Close the current buffer / Exit from nano', '^O         Write the current buffer to disk', '^S         Save file without prompting', '^R         Insert another file into the current one', '^W         Search forward for a string', '^\\         Replace a string', '^K         Cut current line into cutbuffer', '^U         Paste the contents of cutbuffer', '^C         Display the position of the cursor', '^_  M-G    Go to line and column number', 'M-U  ^Z   Undo the last operation', 'M-E        Redo the last undone operation', '^A  Home   Go to beginning of line', '^E  End    Go to end of line', '^Y  PgUp   Go one screenful up', '^V  PgDn   Go one screenful down', '', 'Press any key to close this help.'];
    return {
      wantsKeyboard: true,
      init(api) { updSoft(api); },
      key(k, api) {
        if (help) { help = false; updSoft(api); return; }
        if (prompt) {
          const p = prompt;
          if (k === 'C-c' || k === 'Escape') { prompt = null; msg = '[ Cancelled ]'; }
          else if (p.yn) { if (/^[yY]$/.test(k)) { prompt = null; p.cb('y'); } else if (/^[nN]$/.test(k)) { prompt = null; p.cb('n'); } }
          else if (k === 'Enter') { prompt = null; p.cb(p.buf); }
          else if (k === 'Backspace') { if (p.cur > 0) { p.buf = p.buf.slice(0, p.cur - 1) + p.buf.slice(p.cur); p.cur--; } }
          else if (k === 'Delete') p.buf = p.buf.slice(0, p.cur) + p.buf.slice(p.cur + 1);
          else if (k === 'ArrowLeft') p.cur = Math.max(0, p.cur - 1); else if (k === 'ArrowRight') p.cur = Math.min(p.buf.length, p.cur + 1);
          else if (k === 'Home' || k === 'C-a') p.cur = 0; else if (k === 'End' || k === 'C-e') p.cur = p.buf.length;
          else if (k === 'C-g') { prompt = null; help = true; }
          else if (isPrint(k)) { p.buf = p.buf.slice(0, p.cur) + k + p.buf.slice(p.cur); p.cur++; }
          updSoft(api); return;
        }
        msg = ''; let vert = false; const h = H(api); const pv = vcol(L[cy], cx);
        switch (k) {
          case 'Enter': case 'C-m': snap('enter'); L.splice(cy + 1, 0, L[cy].slice(cx)); L[cy] = L[cy].slice(0, cx); cy++; cx = 0; break;
          case 'Tab': snap('ins'); L[cy] = L[cy].slice(0, cx) + '\t' + L[cy].slice(cx); cx++; break;
          case 'Backspace': case 'C-h': if (cx > 0) { snap('del'); L[cy] = L[cy].slice(0, cx - 1) + L[cy].slice(cx); cx--; } else if (cy > 0) { snap('del'); cx = L[cy - 1].length; L[cy - 1] += L[cy]; L.splice(cy, 1); cy--; } break;
          case 'Delete': case 'C-d': if (cx < L[cy].length) { snap('del'); L[cy] = L[cy].slice(0, cx) + L[cy].slice(cx + 1); } else if (cy < L.length - 1) { snap('del'); L[cy] += L[cy + 1]; L.splice(cy + 1, 1); } break;
          case 'ArrowLeft': case 'C-b': if (cx > 0) cx--; else if (cy > 0) { cy--; cx = L[cy].length; } break;
          case 'ArrowRight': case 'C-f': if (cx < L[cy].length) cx++; else if (cy < L.length - 1) { cy++; cx = 0; } break;
          case 'ArrowUp': case 'C-p': vert = true; if (cy > 0) cy--; break;
          case 'ArrowDown': case 'C-n': vert = true; if (cy < L.length - 1) cy++; break;
          case 'Home': case 'C-a': cx = 0; break; case 'End': case 'C-e': cx = L[cy].length; break;
          case 'PageUp': case 'C-y': vert = true; cy = Math.max(0, cy - h); top = Math.max(0, top - h); break;
          case 'PageDown': case 'C-v': vert = true; cy = Math.min(L.length - 1, cy + h); top = Math.min(Math.max(0, L.length - 1), top + h); break;
          case 'WheelUp': top = Math.max(0, top - 3); vert = true; if (cy >= top + h) cy = top + h - 1; break;
          case 'WheelDown': top = Math.min(Math.max(0, L.length - h), top + 3); vert = true; if (cy < top) cy = top; break;
          case 'C-k': snap('cut'); if (!lastCut) cutbuf = []; cutbuf.push(L[cy]); if (L.length > 1) L.splice(cy, 1); else L[0] = ''; cy = Math.min(cy, L.length - 1); cx = 0; break;
          case 'C-u': if (!cutbuf.length) { msg = '[ Cutbuffer is empty ]'; break; } snap('paste'); L.splice(cy, 0, ...cutbuf); cy += cutbuf.length; cx = 0; break;
          case 'C-s': if (name) save(name); else ask('File Name to Write: ', '', (f) => f && save(f)); break;
          case 'C-o': ask('File Name to Write: ', name, (f) => (f ? save(f) : (msg = '[ Cancelled ]'))); break;
          case 'C-x':
            if (!mod) return doExit(api);
            ask('Save modified buffer?  ', '', (a) => { if (a === 'n') return doExit(api); if (name) { if (save(name)) doExit(api); } else ask('File Name to Write: ', '', (f) => { if (f && save(f)) doExit(api); }); }, true); break;
          case 'C-w': case 'F6': ask(`Search${lastSearch ? ` [${lastSearch}]` : ''}: `, '', (q) => find(q || lastSearch, cx + 1)); break;
          case 'M-w': find(lastSearch, cx + 1); break;
          case 'C-\\': case 'M-r': ask('Search (to replace): ', '', (q) => { if (!q) return; ask('Replace with: ', '', (r) => { let n = 0; snap('repl'); L = L.map((l, i) => { if (i < cy) return l; const parts = l.split(q); n += parts.length - 1; return parts.join(r); }); msg = `[ Replaced ${n} occurrence${n === 1 ? '' : 's'} ]`; lastKind = ''; }); }); break;
          case 'C-r': ask('File to insert: ', '', (f) => { if (!f) return; try { const t = OS.fs.read(ctx.path(f)).replace(/\n$/, '').split('\n'); snap('ins'); L.splice(cy, 0, ...t); cy += t.length; msg = `[ Read ${t.length} lines ]`; } catch (e) { msg = `[ ${e.message} ]`; } }); break;
          case 'C-t': msg = '[ Execute is not available in this build ]'; break;
          case 'C-j': msg = '[ Justify: nothing to justify ]'; break;
          case 'C-g': case 'F1': help = true; break;
          case 'C-c': { const chars = L.reduce((a, l) => a + l.length + 1, 0), pos = L.slice(0, cy).reduce((a, l) => a + l.length + 1, 0) + cx; msg = `[ line ${cy + 1}/${L.length} (${Math.round((cy + 1) / L.length * 100)}%), col ${cx + 1}/${L[cy].length + 1} (${Math.round((cx + 1) / (L[cy].length + 1) * 100)}%), char ${pos + 1}/${chars} (${Math.round((pos + 1) / chars * 100)}%) ]`; break; }
          case 'C-_': case 'M-g': ask('Enter line number, column number: ', '', (v) => { const [a, c] = v.split(/[,\s]+/).map(Number); if (a) { cy = OS.clamp(a - 1, 0, L.length - 1); cx = OS.clamp((c || 1) - 1, 0, L[cy].length); } }); break;
          case 'M-u': case 'C-z': if (!undo.length) { msg = '[ Nothing to undo ]'; break; } redo.push({ L: L.slice(), cy, cx }); ({ L, cy, cx } = undo.pop()); lastKind = ''; mod = true; msg = '[ Undid action ]'; break;
          case 'M-e': if (!redo.length) { msg = '[ Nothing to redo ]'; break; } undo.push({ L: L.slice(), cy, cx }); ({ L, cy, cx } = redo.pop()); lastKind = ''; mod = true; msg = '[ Redid action ]'; break;
          case 'Escape': break;
          default: if (isPrint(k)) { snap('ins'); L[cy] = L[cy].slice(0, cx) + k + L[cy].slice(cx); cx++; }
        }
        lastCut = k === 'C-k';
        cy = OS.clamp(cy, 0, L.length - 1);
        if (vert) { if (wantV == null) wantV = pv; cx = xFromV(L[cy], wantV); } else wantV = null;
        cx = OS.clamp(cx, 0, L[cy].length);
        if (!k.startsWith('Wheel')) { if (cy < top) top = cy; if (cy >= top + h) top = cy - h + 1; }
        updSoft(api);
      },
      paste(t) { snap('paste'); const parts = t.replace(/\r/g, '').split('\n'); const rest = L[cy].slice(cx); L[cy] = L[cy].slice(0, cx) + parts[0]; for (let i = 1; i < parts.length; i++) L.splice(cy + i, 0, parts[i]); cy += parts.length - 1; cx = L[cy].length; L[cy] += rest; lastKind = ''; },
      click(col, row, api) {
        const h = H(api);
        if (row >= api.rows - 2) { const { items, per, w } = scLayout(api); const i = (row - (api.rows - 2)) * per + Math.floor(col / w); if (items[i]) this.key(items[i][2], api); return; }
        if (prompt || help || row < 1 || row > h) return;
        cy = OS.clamp(top + row - 1, 0, L.length - 1); cx = xFromV(L[cy], col + (top + row - 1 === cy ? curHs : 0)); wantV = null;
      },
      render(api) {
        const W = api.cols, h = H(api), out = [];
        const title = '  GNU nano 7.2', nm = name || 'New Buffer', right = mod ? 'Modified  ' : '';
        let t = title + ' '.repeat(Math.max(1, Math.floor((W - nm.length) / 2) - title.length)) + nm; t = padA(t, W - right.length) + right; out.push(inv(padA(t, W)));
        if (help) { for (let r = 0; r < h; r++) out.push(clean(HELPTXT[r] || '')); }
        else for (let r = 0; r < h; r++) {
          const i = top + r; if (i >= L.length) { out.push(''); continue; }
          const ex = expand(L[i]);
          if (i === cy && !prompt) {
            const v = vcol(L[i], cx); let hs = 0; if (v >= W - 1) hs = v - W + 2; curHs = hs;
            let seg = ex.slice(hs, hs + W); const cv = v - hs; const chr = seg[cv] || ' ';
            out.push((hs ? '\x1b[7m<\x1b[27m' + clean(seg.slice(1, cv)) : clean(seg.slice(0, cv))) + inv(clean(chr)) + clean(seg.slice(cv + 1, W - (ex.length > hs + W ? 1 : 0))) + (ex.length > hs + W ? '\x1b[7m>\x1b[27m' : ''));
          } else out.push(ex.length > W ? clean(ex.slice(0, W - 1)) + '\x1b[7m>\x1b[27m' : clean(ex));
        }
        if (prompt) { const p = prompt; const s = p.label + p.buf; const cpos = p.label.length + p.cur; out.push(inv(clean(s.slice(0, cpos))) + clean(s[cpos] || ' ') + inv(padA(clean(s.slice(cpos + 1)), Math.max(0, W - cpos - 1)))); }
        else if (msg) { const m = msg.slice(0, W); const a = Math.max(0, Math.floor((W - m.length) / 2)); out.push(' '.repeat(a) + inv(m)); }
        else out.push('');
        const { items, per, w } = scLayout(api);
        for (let r = 0; r < 2; r++) { let line = ''; items.slice(r * per, r * per + per).forEach(([k, l]) => { line += inv(k) + ' ' + padA(l, Math.max(0, w - k.length - 2)) + ' '; }); out.push(line); }
        return out;
      },
    };
  }
  def('nano pico edit editor sensible-editor', 'small, friendly terminal text editor', async (ctx) => {
    if (!needTTY(ctx, 'nano')) return 1;
    const [o, r] = opts(ctx.args); if (o.version || o.V) return ctx.println(' GNU nano, version 7.2');
    let f = r[0], line = 0; if (f && /^\+\d+/.test(f)) { line = +f.slice(1); f = r[1]; }
    await ctx.term.tui(nano(ctx, f, line));
  });

  /* ============================== VI / VIM ============================== */
  function vim(ctx, file, opt = {}) {
    const path = file ? ctx.path(file) : null; const b = loadBuf(path);
    let L = opt.text ? opt.text.split('\n') : b.L, cy = 0, cx = 0, top = 0, mode = 'normal', cmd = '', cmdType = ':', count = '', pend = '', reg = null, msg = '', err = false, mod = false, name = file || '', nu = false, lastSearch = '', lastSearchDir = 1, undo = [], redo = [], intro = !file && !opt.text, softMode = '', insSnap = false, ro = !!opt.readonly;
    if (path && !b.isNew && !b.err) msg = `"${file}" ${L.length}L, ${b.bytes}B`; else if (b.isNew && file) msg = `"${file}" [New]`; else if (b.err) { msg = b.msg; err = true; }
    const snap = () => { undo.push({ L: L.slice(), cy, cx }); if (undo.length > 300) undo.shift(); redo = []; mod = true; };
    const textH = (api) => api.rows - 1;
    const gutter = () => (nu ? Math.max(3, String(L.length).length) + 1 : 0);
    const tw = (api) => Math.max(10, api.cols - gutter());
    const rowsOf = (api, i) => Math.max(1, Math.ceil(expand(L[i]).length / tw(api)));
    const firstNB = (l) => Math.max(0, l.search(/\S/));
    const isW = (c) => /\w/.test(c || '');
    const clampX = () => { cy = OS.clamp(cy, 0, L.length - 1); const max = mode === 'insert' ? L[cy].length : Math.max(0, L[cy].length - 1); cx = OS.clamp(cx, 0, max); };
    const wordFwd = () => { let l = L[cy]; if (cx >= l.length - 1) { if (cy < L.length - 1) { cy++; cx = firstNB(L[cy]); } return; } const w = isW(l[cx]); let i = cx; while (i < l.length && l[i] !== ' ' && isW(l[i]) === w) i++; while (i < l.length && l[i] === ' ') i++; if (i >= l.length && cy < L.length - 1) { cy++; cx = firstNB(L[cy]); } else cx = Math.min(i, l.length - 1); };
    const wordBack = () => { if (cx === 0) { if (cy > 0) { cy--; cx = Math.max(0, L[cy].length - 1); } return; } const l = L[cy]; let i = cx - 1; while (i > 0 && l[i] === ' ') i--; const w = isW(l[i]); while (i > 0 && l[i - 1] !== ' ' && isW(l[i - 1]) === w) i--; cx = i; };
    const wordEnd = () => { const l = L[cy]; let i = cx + 1; while (i < l.length && l[i] === ' ') i++; const w = isW(l[i]); while (i < l.length - 1 && l[i + 1] !== ' ' && isW(l[i + 1]) === w) i++; cx = Math.min(i, l.length - 1); };
    const search = (q, dir) => { if (!q) { msg = 'E35: No previous regular expression'; err = true; return; } lastSearch = q; let re; try { re = new RegExp(q); } catch (e) { re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); }
      for (let n = 1; n <= L.length + 1; n++) {
        const i = ((cy + dir * (n - 1)) % L.length + L.length) % L.length; const l = L[i]; let found = -1;
        if (dir > 0) { const from = n === 1 ? cx + 1 : 0; const m = re.exec(l.slice(from)); if (m) found = from + m.index; }
        else { let last = -1; const lim = n === 1 ? cx : l.length + 1; let m; const g = new RegExp(re.source, 'g'); while ((m = g.exec(l)) && m.index < lim) { last = m.index; if (!m[0].length) g.lastIndex++; } found = last; }
        if (found >= 0) { if ((dir > 0 && i < cy) || (dir < 0 && i > cy)) msg = dir > 0 ? 'search hit BOTTOM, continuing at TOP' : 'search hit TOP, continuing at BOTTOM'; else msg = (dir > 0 ? '/' : '?') + q; cy = i; cx = found; return; }
      }
      msg = 'E486: Pattern not found: ' + q; err = true;
    };
    const write = (f) => { const fn = f || name; if (!fn) { msg = 'E32: No file name'; err = true; return false; } if (ro && !f) { msg = "E45: 'readonly' option is set (add ! to override)"; err = true; return false; } try { writeBuf(ctx.path(fn), L); if (!name) name = fn; mod = false; const bytes = L.join('\n').length + 1; msg = `"${fn}" ${L.length}L, ${bytes}B written`; return true; } catch (e) { msg = `E212: Can't open file for writing: ${e.message}`; err = true; return false; } };
    const exCmd = (c, api) => {
      c = c.trim(); let m;
      if (!c) return;
      if (/^\d+$/.test(c)) { cy = OS.clamp(+c - 1, 0, L.length - 1); cx = firstNB(L[cy]); return; }
      if (c === '$') { cy = L.length - 1; return; }
      if ((m = /^(w|write)(!?)(?:\s+(.+))?$/.exec(c))) { write(m[3]); return; }
      if ((m = /^(wq|x|xit|exit|wq!|x!)(?:\s+(.+))?$/.exec(c))) { if (c.startsWith('x') && !mod) return api.exit(); if (write(m[2])) api.exit(); return; }
      if (c === 'q' || c === 'quit') { if (mod) { msg = 'E37: No write since last change (add ! to override)'; err = true; } else api.exit(); return; }
      if (c === 'q!' || c === 'qa!' || c === 'qa' || c === 'cq') return api.exit();
      if ((m = /^e(!?)(?:\s+(.+))?$/.exec(c))) { if (mod && !m[1]) { msg = 'E37: No write since last change (add ! to override)'; err = true; return; } const f = m[2] || name; if (!f) { msg = 'E32: No file name'; err = true; return; } const nb = loadBuf(ctx.path(f)); L = nb.L; name = f; mod = false; cy = cx = top = 0; undo = []; msg = nb.isNew ? `"${f}" [New]` : `"${f}" ${L.length}L`; return; }
      if ((m = /^set?\s+(\w+)$/.exec(c))) { const o = m[1]; if (o === 'nu' || o === 'number') nu = true; else if (o === 'nonu' || o === 'nonumber') nu = false; else if (o === 'invnu' || o === 'nu!') nu = !nu; else { msg = 'E518: Unknown option: ' + o; err = true; } return; }
      if ((m = /^(%|\d*)s(.)(.*?)\2(.*?)(?:\2([gi]*))?$/.exec(c))) { let re; try { re = new RegExp(m[3], (m[5] || '').includes('g') ? 'g' : ''); } catch (e) { msg = 'E486: bad pattern'; err = true; return; } snap(); let n = 0; const rng = m[1] === '%' ? [0, L.length - 1] : [cy, cy]; for (let i = rng[0]; i <= rng[1]; i++) { const nl = L[i].replace(re, () => { n++; return m[4].replace(/\\n/g, '\n'); }); if (nl !== L[i]) { L[i] = nl; cy = i; } } if (!n) { undo.pop(); msg = 'E486: Pattern not found: ' + m[3]; err = true; } else msg = n > 1 ? `${n} substitutions` : ''; L = L.join('\n').split('\n'); return; }
      if (c === 'noh' || c === 'nohlsearch') { lastSearch = ''; return; }
      if (/^h(elp)?\b/.test(c)) { msg = 'Help: i insert · Esc normal mode · :w save · :q quit · :wq save+quit · dd delete line · u undo · /text search'; return; }
      if (c === 'version' || c === 've') { msg = 'VIM - Vi IMproved 9.1 (Cirrus build)'; return; }
      msg = 'E492: Not an editor command: ' + c; err = true;
    };
    const updSoft = (api) => {
      const m = mode === 'insert' ? 'i' : mode === 'cmd' ? 'c' : 'n'; if (m === softMode) return; softMode = m;
      api.soft(touchOnly(m === 'i' ? [{ k: 'Esc', label: 'Normal mode', send: 'Escape' }] : m === 'c' ? [{ k: '↵', label: 'Run', send: 'Enter' }, { k: 'Esc', label: 'Cancel', send: 'Escape' }] : [
        { k: 'i', label: 'Insert', send: 'i' }, { k: ':w', label: 'Save', send: [':', 'w', 'Enter'] }, { k: ':q', label: 'Quit', send: [':', 'q', 'Enter'] }, { k: ':wq', label: 'Save+quit', send: [':', 'w', 'q', 'Enter'] }, { k: ':q!', label: 'Discard', send: [':', 'q', '!', 'Enter'] },
        { k: 'u', label: 'Undo', send: 'u' }, { k: 'dd', label: 'Del line', send: ['d', 'd'] }, { k: 'x', label: 'Del char', send: 'x' }, { k: 'o', label: 'New line', send: 'o' }, { k: '/', label: 'Search', send: '/' }, { k: 'n', label: 'Next', send: 'n' }]));
    };
    function normal(k, api) {
      if (/^[1-9]$/.test(k) || (k === '0' && count)) { count += k; return; }
      const n = Math.max(1, parseInt(count || '1')); const hadCount = !!count; count = '';
      const h = textH(api);
      if (pend === 'r') { pend = ''; if (isPrint(k) && L[cy].length) { snap(); L[cy] = L[cy].slice(0, cx) + k.repeat(Math.min(n, L[cy].length - cx)) + L[cy].slice(cx + n); } return; }
      if (pend === 'g') { pend = ''; if (k === 'g') { cy = hadCount ? n - 1 : 0; cx = firstNB(L[OS.clamp(cy, 0, L.length - 1)]); } return; }
      if (pend === 'Z') { pend = ''; if (k === 'Z') { if (!mod || write()) api.exit(); } else if (k === 'Q') api.exit(); return; }
      if (pend === 'd' || pend === 'c' || pend === 'y' || pend === '>' || pend === '<') {
        const op = pend; pend = '';
        if ((op === 'd' && k === 'd') || (op === 'c' && k === 'c') || (op === 'y' && k === 'y') || (op === '>' && k === '>') || (op === '<' && k === '<')) {
          const cnt = Math.min(n, L.length - cy);
          if (op === 'y') { reg = { lines: true, text: L.slice(cy, cy + cnt) }; msg = cnt > 1 ? `${cnt} lines yanked` : ''; return; }
          snap();
          if (op === '>') { for (let i = cy; i < cy + cnt; i++) L[i] = '    ' + L[i]; return; }
          if (op === '<') { for (let i = cy; i < cy + cnt; i++) L[i] = L[i].replace(/^( {1,4}|\t)/, ''); return; }
          reg = { lines: true, text: L.slice(cy, cy + cnt) };
          if (op === 'c') { L.splice(cy, cnt, ''); cx = 0; mode = 'insert'; insSnap = true; return; }
          L.splice(cy, cnt); if (!L.length) L = ['']; cy = Math.min(cy, L.length - 1); cx = firstNB(L[cy]); if (cnt > 2) msg = `${cnt} fewer lines`; return;
        }
        // motions: w, e, $, b, 0
        const sx = cx; let ex = cx; const l = L[cy];
        if (k === 'w' || k === 'e') { let i = cx; for (let r = 0; r < n; r++) { const w = isW(l[i]); while (i < l.length && l[i] !== ' ' && isW(l[i]) === w) i++; if (k === 'w' && op !== 'c') while (i < l.length && l[i] === ' ') i++; } ex = i; }
        else if (k === '$') ex = l.length; else if (k === 'b') { let i = cx; for (let r = 0; r < n && i > 0; r++) { i--; while (i > 0 && l[i] === ' ') i--; const w = isW(l[i]); while (i > 0 && l[i - 1] !== ' ' && isW(l[i - 1]) === w) i--; } ex = i; } else if (k === '0') ex = 0; else if (k === 'l') ex = Math.min(l.length, cx + n); else if (k === 'h') ex = Math.max(0, cx - n);
        else return;
        const a = Math.min(sx, ex), z = Math.max(sx, ex); const txt = l.slice(a, z);
        if (op === 'y') { reg = { lines: false, text: txt }; return; }
        snap(); reg = { lines: false, text: txt }; L[cy] = l.slice(0, a) + l.slice(z); cx = a; if (op === 'c') { mode = 'insert'; insSnap = true; }
        return;
      }
      switch (k) {
        case 'h': case 'ArrowLeft': case 'Backspace': cx = Math.max(0, cx - n); break;
        case 'l': case 'ArrowRight': case ' ': cx = Math.min(Math.max(0, L[cy].length - 1), cx + n); break;
        case 'j': case 'ArrowDown': case 'C-n': cy = Math.min(L.length - 1, cy + n); break;
        case 'k': case 'ArrowUp': case 'C-p': cy = Math.max(0, cy - n); break;
        case 'Enter': case '+': cy = Math.min(L.length - 1, cy + n); cx = firstNB(L[cy]); break;
        case '-': cy = Math.max(0, cy - n); cx = firstNB(L[cy]); break;
        case '0': case 'Home': cx = 0; break; case '^': cx = firstNB(L[cy]); break; case '$': case 'End': cx = L[cy].length - 1; break;
        case 'w': for (let i = 0; i < n; i++) wordFwd(); break; case 'b': for (let i = 0; i < n; i++) wordBack(); break; case 'e': for (let i = 0; i < n; i++) wordEnd(); break;
        case 'g': pend = 'g'; if (hadCount) count = String(n); break;
        case 'G': cy = hadCount ? Math.min(L.length - 1, n - 1) : L.length - 1; cx = firstNB(L[cy]); break;
        case 'C-d': cy = Math.min(L.length - 1, cy + Math.floor(h / 2)); top = Math.min(Math.max(0, L.length - 1), top + Math.floor(h / 2)); break;
        case 'C-u': cy = Math.max(0, cy - Math.floor(h / 2)); top = Math.max(0, top - Math.floor(h / 2)); break;
        case 'C-f': case 'PageDown': cy = Math.min(L.length - 1, cy + h - 2); top = Math.min(Math.max(0, L.length - 1), top + h - 2); break;
        case 'C-b': case 'PageUp': cy = Math.max(0, cy - h + 2); top = Math.max(0, top - h + 2); break;
        case 'WheelDown': top = Math.min(Math.max(0, L.length - 1), top + 3); if (cy < top) cy = top; break;
        case 'WheelUp': top = Math.max(0, top - 3); break;
        case 'H': cy = top; break; case 'L': cy = Math.min(L.length - 1, top + h - 1); break; case 'M': cy = Math.min(L.length - 1, top + Math.floor(h / 2)); break;
        case 'x': case 'Delete': if (L[cy].length) { snap(); reg = { lines: false, text: L[cy].slice(cx, cx + n) }; L[cy] = L[cy].slice(0, cx) + L[cy].slice(cx + n); } break;
        case 'X': if (cx > 0) { snap(); const a = Math.max(0, cx - n); L[cy] = L[cy].slice(0, a) + L[cy].slice(cx); cx = a; } break;
        case 'D': snap(); reg = { lines: false, text: L[cy].slice(cx) }; L[cy] = L[cy].slice(0, cx); break;
        case 'C': snap(); L[cy] = L[cy].slice(0, cx); mode = 'insert'; break;
        case 's': snap(); L[cy] = L[cy].slice(0, cx) + L[cy].slice(cx + n); mode = 'insert'; break;
        case 'S': snap(); L[cy] = ''; cx = 0; mode = 'insert'; break;
        case 'd': case 'c': case 'y': case '>': case '<': pend = k; if (hadCount) count = String(n); break;
        case 'Y': reg = { lines: true, text: L.slice(cy, cy + n) }; break;
        case 'p': case 'P': if (!reg) { msg = 'E353: Nothing in register "'; err = true; break; } snap();
          if (reg.lines) { const at = k === 'p' ? cy + 1 : cy; for (let r = 0; r < n; r++) L.splice(at, 0, ...reg.text); cy = at; cx = firstNB(L[cy]); }
          else { const at = k === 'p' && L[cy].length ? cx + 1 : cx; L[cy] = L[cy].slice(0, at) + reg.text.repeat(n) + L[cy].slice(at); cx = at + reg.text.length * n - 1; }
          break;
        case 'i': case 'Insert': snap(); mode = 'insert'; break;
        case 'a': snap(); mode = 'insert'; if (L[cy].length) cx++; break;
        case 'I': snap(); mode = 'insert'; cx = firstNB(L[cy]); break;
        case 'A': snap(); mode = 'insert'; cx = L[cy].length; break;
        case 'o': snap(); L.splice(cy + 1, 0, ''); cy++; cx = 0; mode = 'insert'; break;
        case 'O': snap(); L.splice(cy, 0, ''); cx = 0; mode = 'insert'; break;
        case 'r': pend = 'r'; if (hadCount) count = String(n); break;
        case 'J': if (cy < L.length - 1) { snap(); cx = L[cy].length; L[cy] = L[cy].replace(/\s+$/, '') + ' ' + L[cy + 1].replace(/^\s+/, ''); L.splice(cy + 1, 1); } break;
        case '~': if (L[cy].length) { snap(); const c = L[cy][cx]; L[cy] = L[cy].slice(0, cx) + (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()) + L[cy].slice(cx + 1); cx = Math.min(cx + 1, L[cy].length - 1); } break;
        case 'u': if (!undo.length) { msg = 'Already at oldest change'; break; } redo.push({ L: L.slice(), cy, cx }); ({ L, cy, cx } = undo.pop()); msg = '1 change; before #' + (undo.length + 1); mod = true; break;
        case 'C-r': if (!redo.length) { msg = 'Already at newest change'; break; } undo.push({ L: L.slice(), cy, cx }); ({ L, cy, cx } = redo.pop()); mod = true; break;
        case 'n': search(lastSearch, lastSearchDir); break; case 'N': search(lastSearch, -lastSearchDir); break;
        case '*': { const m = /\w+/.exec(L[cy].slice(cx)); if (m) { lastSearchDir = 1; search('\\b' + m[0] + '\\b', 1); } break; }
        case ':': case '/': case '?': mode = 'cmd'; cmdType = k; cmd = ''; break;
        case 'Z': pend = 'Z'; break;
        case 'v': case 'V': case 'C-v': msg = 'Visual mode is not supported in this build'; break;
        case 'C-g': msg = `"${name || '[No Name]'}"${mod ? ' [Modified]' : ''} ${L.length} lines --${Math.round((cy + 1) / L.length * 100)}%--`; break;
        case 'F1': exCmd('help', api); break;
        case 'Escape': pend = ''; break;
        case 'C-c': msg = 'Type  :qa!  and press <Enter> to abandon all changes and exit Vim'; break;
      }
    }
    return {
      wantsKeyboard: true,
      init(api) { updSoft(api); },
      key(k, api) {
        if (k !== 'Escape' || mode !== 'normal') { msg = mode === 'cmd' ? msg : ''; err = false; }
        if (intro && k !== 'WheelUp' && k !== 'WheelDown') intro = false;
        if (mode === 'insert') {
          if (k === 'Escape' || k === 'C-c' || k === 'C-[') { mode = 'normal'; cx = Math.max(0, cx - 1); }
          else if (k === 'Enter') { L.splice(cy + 1, 0, L[cy].slice(cx)); L[cy] = L[cy].slice(0, cx); cy++; cx = 0; mod = true; }
          else if (k === 'Backspace' || k === 'C-h') { if (cx > 0) { L[cy] = L[cy].slice(0, cx - 1) + L[cy].slice(cx); cx--; } else if (cy > 0) { cx = L[cy - 1].length; L[cy - 1] += L[cy]; L.splice(cy, 1); cy--; } mod = true; }
          else if (k === 'Delete') { if (cx < L[cy].length) L[cy] = L[cy].slice(0, cx) + L[cy].slice(cx + 1); else if (cy < L.length - 1) { L[cy] += L[cy + 1]; L.splice(cy + 1, 1); } mod = true; }
          else if (k === 'C-w') { const a = L[cy].slice(0, cx).replace(/\w+\s*$|\W\s*$/, '').length; L[cy] = L[cy].slice(0, a) + L[cy].slice(cx); cx = a; mod = true; }
          else if (k === 'ArrowLeft') cx = Math.max(0, cx - 1); else if (k === 'ArrowRight') cx = Math.min(L[cy].length, cx + 1);
          else if (k === 'ArrowUp') cy = Math.max(0, cy - 1); else if (k === 'ArrowDown') cy = Math.min(L.length - 1, cy + 1);
          else if (k === 'Home') cx = 0; else if (k === 'End') cx = L[cy].length;
          else if (k === 'Tab') { L[cy] = L[cy].slice(0, cx) + '\t' + L[cy].slice(cx); cx++; mod = true; }
          else if (k === 'WheelUp') top = Math.max(0, top - 3); else if (k === 'WheelDown') top = Math.min(L.length - 1, top + 3);
          else if (isPrint(k)) { L[cy] = L[cy].slice(0, cx) + k + L[cy].slice(cx); cx++; mod = true; }
        } else if (mode === 'cmd') {
          if (k === 'Escape' || k === 'C-c') { mode = 'normal'; cmd = ''; }
          else if (k === 'Enter') { mode = 'normal'; const c = cmd; cmd = ''; if (cmdType === ':') exCmd(c, api); else { lastSearchDir = cmdType === '/' ? 1 : -1; search(c || lastSearch, lastSearchDir); } }
          else if (k === 'Backspace') { if (!cmd) mode = 'normal'; else cmd = cmd.slice(0, -1); }
          else if (isPrint(k)) cmd += k;
        } else normal(k, api);
        clampX();
        // keep cursor visible
        if (!k.startsWith('Wheel')) { if (cy < top) top = cy; let used = 0; for (let i = top; i <= cy; i++) used += rowsOf(api, i); while (used > textH(api) && top < cy) { used -= rowsOf(api, top); top++; } }
        updSoft(api);
      },
      paste(t) { if (mode !== 'insert') { snap(); mode = 'insert'; } const parts = t.replace(/\r/g, '').split('\n'); const rest = L[cy].slice(cx); L[cy] = L[cy].slice(0, cx) + parts[0]; for (let i = 1; i < parts.length; i++) L.splice(cy + i, 0, parts[i]); cy += parts.length - 1; cx = L[cy].length; L[cy] += rest; mod = true; },
      click(col, row, api) {
        if (mode === 'cmd') return; let r = 0;
        for (let i = top; i < L.length; i++) { const n = rowsOf(api, i); if (row < r + n) { cy = i; cx = xFromV(L[i], (row - r) * tw(api) + Math.max(0, col - gutter())); clampX(); return; } r += n; }
      },
      render(api) {
        const out = [], H = textH(api), W = api.cols, g = gutter(), w = tw(api);
        if (intro) {
          const txt = ['VIM - Vi IMproved', '', 'version 9.1 (Cirrus build)', 'Vim is open source and freely distributable', '', 'type  :q<Enter>               to exit         ', 'type  :help<Enter>  or  <F1>  for on-line help', 'type  i                       to insert text  ', 'type  :w file<Enter>          to save         '];
          const s = Math.max(1, Math.floor((H - txt.length) / 2));
          for (let r = 0; r < H; r++) { if (r === 0) out.push(inv(' ') + ''); else if (r >= s && r < s + txt.length) out.push('\x1b[94m~\x1b[0m' + center(txt[r - s], W - 1)); else out.push('\x1b[94m~\x1b[0m'); }
        } else {
          let i = top, srow = 0;
          while (srow < H && i < L.length) {
            const ex = expand(L[i]); const chunks = []; for (let p = 0; p < Math.max(1, ex.length); p += w) chunks.push(ex.slice(p, p + w)); if (!chunks.length) chunks.push('');
            const cv = i === cy ? vcol(L[i], cx) : -1;
            chunks.forEach((ch, ci) => {
              if (srow >= H) return;
              let num = g ? (ci === 0 ? `\x1b[33m${String(i + 1).padStart(g - 1)}\x1b[0m ` : ' '.repeat(g)) : '';
              let text = clean(ch);
              if (lastSearch && mode !== 'insert') { try { const re = new RegExp(lastSearch, 'g'); text = ch.replace(re, (m) => (m ? `\x1b[43;30m${clean(m)}\x1b[0m` : m)); if (!re.test(ch)) text = clean(ch); } catch (e) {} }
              if (cv >= ci * w && (cv < (ci + 1) * w || (ci === chunks.length - 1 && cv === ex.length && cv < (ci + 1) * w)) && mode !== 'cmd') { const p = cv - ci * w; text = clean(ch.slice(0, p)) + inv(clean(ch[p] || ' ')) + clean(ch.slice(p + 1)); }
              out.push(num + text); srow++;
            });
            i++;
          }
          while (srow < H) { out.push('\x1b[94m~\x1b[0m'); srow++; }
        }
        // last line
        const ruler = `${cy + 1},${L[cy].length ? cx + 1 : '0-1'}`.padEnd(14) + (L.length <= H ? 'All' : top === 0 ? 'Top' : top + H >= L.length ? 'Bot' : Math.round(top / (L.length - H) * 100) + '%');
        let left;
        if (mode === 'cmd') left = cmdType + clean(cmd) + inv(' ');
        else if (msg) left = err ? `\x1b[41;97m${clean(msg)}\x1b[0m` : clean(msg);
        else if (mode === 'insert') left = bold('-- INSERT --');
        else left = pend || count ? ' '.repeat(Math.max(0, W - 30)) + (count + pend) : '';
        const rw = W >= 40 ? 18 : 0;
        out.push(rw && mode !== 'cmd' && vlen(left) < W - rw ? padA(left, W - rw) + ruler : cutA(left, W));
        return out;
      },
    };
  }
  def('vi vim view', 'Vi IMproved, a programmer\'s text editor', async (ctx) => {
    if (!needTTY(ctx, 'vim')) return 1;
    const [o, r] = opts(ctx.args); if (o.version) return ctx.println('VIM - Vi IMproved 9.1 (Cirrus build)');
    await ctx.term.tui(vim(ctx, r[0], { readonly: ctx.name === 'view' || o.R }));
  });
  const TUTOR = `===============================================================================
=    W e l c o m e   t o   t h e   V I M   T u t o r    -    Version 1.7      =
===============================================================================

     Vim is a very powerful editor that has many commands. This tutor
     teaches the few you need to get started. It takes about 15 minutes.

     ATTENTION: The commands in the lessons will modify the text, but this
     buffer is not saved anywhere, so feel free to experiment.

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                        Lesson 1.1:  MOVING THE CURSOR

   ** To move the cursor, press the h,j,k,l keys as indicated. **
             ^
             k              Hint:  The h key is at the left and moves left.
       < h       l >               The l key is at the right and moves right.
             j                     The j key looks like a down arrow.
             v
  1. Move the cursor around the screen until you are comfortable.
  2. Hold down the down key (j) until it repeats.
  3. Using the down key, move to Lesson 1.2.

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                            Lesson 1.2: EXITING VIM

  1. Press the <ESC> key (to make sure you are in Normal mode).
  2. Type:  :q! <ENTER>    This exits the editor, DISCARDING any changes.

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                     Lesson 1.3: TEXT EDITING - DELETION

   ** Press  x  to delete the character under the cursor. **

  1. Move the cursor to the line below marked --->.
  2. Move the cursor on top of each character to be deleted and press x.

---> The ccow jumpedd ovverr thhe mooon.

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                      Lesson 1.4: TEXT EDITING - INSERTION

   ** Press  i  to insert text. **

  1. Move the cursor to the first line below marked --->.
  2. Press  i  and type in the necessary additions, then press <ESC>.

---> There is text misng this .
---> There is some text missing from this line.

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                         Lesson 1 SUMMARY

  1. The cursor is moved using either the arrow keys or the hjkl keys.
  2. To exit Vim type:  <ESC> :q! <ENTER>  to trash all changes,
                  or:  <ESC> :wq <ENTER>  to save the changes.
  3. To delete the character at the cursor type:  x
  4. To insert text before the cursor type:  i  type text  <ESC>
  5. dd deletes a line, u undoes, /word searches, n finds the next match.`;
  def('vimtutor', 'the Vim tutor', async (ctx) => { if (!needTTY(ctx, 'vimtutor')) return 1; await ctx.term.tui(vim(ctx, null, { text: TUTOR })); });

  /* ============================== PAGER ============================== */
  function pager({ source, name = '', kind = 'less' }) {
    let vis = [], top = 0, prompt = null, pat = '', msg = '', W = 0, helpMode = false, saved = null;
    const HELPP = ['', bold('                   SUMMARY OF LESS COMMANDS'), '', '  h  H                 Display this help.', '  q  :q  Q  :Q  ZZ     Exit.', '', bold('                           MOVING'), '', '  e  ^E  j  ^N  CR     Forward  one line', '  y  ^Y  k  ^K  ^P     Backward one line', '  f  ^F  ^V  SPACE     Forward  one window', '  b  ^B  ESC-v         Backward one window', '  d  ^D                Forward  one half-window', '  u  ^U                Backward one half-window', '  g  <  ESC-<          Go to first line in file', '  G  >  ESC->          Go to last line in file', '', bold('                          SEARCHING'), '', '  /pattern             Search forward for matching line.', '  n                    Repeat previous search.', '  N                    Repeat previous search in reverse direction.', '', 'Press q to leave help.'];
    const build = (api) => { W = api.cols; const raw = helpMode ? HELPP : typeof source === 'function' ? source(W) : source; vis = []; raw.forEach((l) => wrapA(l.replace(/\t/g, '        '), W).forEach((x) => vis.push(x))); };
    const H = (api) => api.rows - 1;
    const clampTop = (api) => { top = OS.clamp(top, 0, Math.max(0, vis.length - H(api))); };
    const find = (dir, api) => { if (!pat) return; let re; try { re = new RegExp(pat, 'i'); } catch (e) { re = new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); } for (let i = top + dir; i >= 0 && i < vis.length; i += dir) if (re.test(stripAnsi(vis[i]))) { top = i; clampTop(api); return; } msg = 'Pattern not found'; };
    return {
      init(api) { build(api); api.soft(touchOnly([{ k: 'q', label: 'Quit', send: 'q' }, { k: '/', label: 'Search', send: '/' }, { k: 'n', label: 'Next', send: 'n' }, { k: 'g', label: 'Top', send: 'g' }, { k: 'G', label: 'End', send: 'G' }, { k: 'h', label: 'Help', send: 'h' }])); },
      resize(api) { const frac = vis.length ? top / vis.length : 0; build(api); top = Math.round(frac * vis.length); clampTop(api); },
      key(k, api) {
        msg = ''; const h = H(api);
        if (prompt != null) { if (k === 'Enter') { pat = prompt || pat; prompt = null; find(1, api); if (msg && top === 0) {} } else if (k === 'Escape' || k === 'C-c') prompt = null; else if (k === 'Backspace') { if (!prompt) prompt = null; else prompt = prompt.slice(0, -1); } else if (isPrint(k)) prompt += k; return; }
        if (helpMode && /^[qQ]$/.test(k)) { helpMode = false; top = saved; build(api); return; }
        switch (k) {
          case 'q': case 'Q': case 'C-c': return api.exit();
          case 'j': case 'e': case 'C-e': case 'C-n': case 'Enter': case 'ArrowDown': top++; break;
          case 'k': case 'y': case 'C-y': case 'C-p': case 'C-k': case 'ArrowUp': top--; break;
          case 'WheelDown': top += 3; break; case 'WheelUp': top -= 3; break;
          case ' ': case 'f': case 'C-f': case 'C-v': case 'PageDown': case 'z': if (kind === 'more' && top + h >= vis.length) return api.exit(); top += h; break;
          case 'b': case 'C-b': case 'PageUp': case 'w': top -= h; break;
          case 'd': case 'C-d': top += Math.floor(h / 2); break; case 'u': case 'C-u': top -= Math.floor(h / 2); break;
          case 'g': case '<': case 'Home': top = 0; break; case 'G': case '>': case 'End': top = vis.length; break;
          case '/': prompt = ''; break; case 'n': find(1, api); break; case 'N': find(-1, api); break;
          case 'h': case 'H': if (!helpMode) { saved = top; helpMode = true; top = 0; build(api); } break;
          case 'ArrowLeft': case 'ArrowRight': break;
        }
        clampTop(api);
      },
      click(col, row, api) { if (row === api.rows - 1) this.key(' ', api); },
      render(api) {
        if (api.cols !== W) build(api);
        const h = H(api), out = [];
        let re = null; if (pat) { try { re = new RegExp(pat, 'gi'); } catch (e) {} }
        for (let r = 0; r < h; r++) { let l = vis[top + r]; if (l === undefined) { out.push(kind === 'more' ? '' : '\x1b[1;34m~\x1b[0m'); continue; } if (re && !l.includes('\x1b')) l = l.replace(re, (m) => inv(m)); out.push(l); }
        const atEnd = top + h >= vis.length;
        let st;
        if (prompt != null) st = '/' + prompt + inv(' ');
        else if (msg) st = inv(msg + '  (press RETURN)');
        else if (helpMode) st = inv('HELP -- ' + (atEnd ? 'END -- ' : '') + 'Press q when done');
        else if (kind === 'man') st = inv(` Manual page ${name} line ${top + 1}${atEnd ? ' (END)' : ''} (press h for help or q to quit)`);
        else if (kind === 'more') st = inv(atEnd ? '--More--(END)' : `--More--(${Math.round((top + h) / vis.length * 100)}%)`);
        else st = atEnd ? inv('(END)') : top === 0 && name ? inv(name) : ':';
        out.push(cutA(st, api.cols));
        return out;
      },
    };
  }
  def('less more most', 'file perusal filter for viewing text', async (ctx) => {
    const [o, r] = opts(ctx.args);
    let text, name = r[0] || '';
    if (r.length) { try { text = r.map((f) => OS.fs.read(ctx.path(f))).join(''); } catch (e) { ctx.err(`${ctx.name}: ${e.message}\n`); return 1; } }
    else if (ctx.stdin != null) text = ctx.stdin;
    else { ctx.err(`Missing filename ("${ctx.name} --help" for help)\n`); return 1; }
    if (OS.isDataUrl(text)) { ctx.err(`"${name}" may be a binary file.\n`); return 1; }
    if (!ctx.isTTY || !ctx.term.tui) { ctx.out(text); return; }
    let ls = lines(text); if (o.N) ls = ls.map((l, i) => `\x1b[33m${String(i + 1).padStart(6)}\x1b[0m ${l}`);
    if (ctx.name === 'more' && ls.length < 8) { ctx.out(text); return; }
    await ctx.term.tui(pager({ source: ls, name, kind: ctx.name === 'more' ? 'more' : 'less' }));
  });

  /* ============================== MAN ============================== */
  const MAN = {
    ls: ['ls [OPTION]... [FILE]...', 'List information about the FILEs (the current directory by default). Sort entries alphabetically if none of -tS is specified.', [['-a, --all', 'do not ignore entries starting with .'], ['-A', 'do not list implied . and ..'], ['-d', 'list directories themselves, not their contents'], ['-F', 'append indicator (one of */=>@|) to entries'], ['-h', 'with -l, print sizes like 1K 234M 2G etc.'], ['-l', 'use a long listing format'], ['-r', 'reverse order while sorting'], ['-S', 'sort by file size, largest first'], ['-t', 'sort by time, newest first'], ['-1', 'list one file per line']], ['ls -la ~', 'ls -lh /home']],
    cd: ['cd [DIR]', 'Change the shell working directory. The default DIR is the value of the HOME shell variable. "cd -" returns to the previous directory.', [], ['cd ~/Documents', 'cd ..', 'cd -']],
    pwd: ['pwd', 'Print the name of the current working directory.', [], []],
    cat: ['cat [OPTION]... [FILE]...', 'Concatenate FILE(s) to standard output. With no FILE, or when FILE is -, read standard input.', [['-n, --number', 'number all output lines']], ['cat notes.md', 'cat a.txt b.txt > both.txt']],
    less: ['less [OPTIONS] [FILE]...', 'Less is a program similar to more, but which allows backward movement in the file as well as forward movement. Press h inside less for a summary of commands.', [['-N', 'display line numbers']], ['less /etc/os-release', 'ls -la / | less']],
    more: ['more [OPTIONS] FILE...', 'more is a filter for paging through text one screenful at a time. Press SPACE for the next page and q to quit.', [], ['more /var/log/syslog']],
    man: ['man [SECTION] PAGE', 'man is the system\'s manual pager. Each page argument given to man is normally the name of a program or utility. Use "man -k keyword" to search page descriptions.', [['-k KEYWORD', 'search the short descriptions (same as apropos)'], ['-f PAGE', 'display a short description (same as whatis)']], ['man ls', 'man -k editor']],
    cp: ['cp [OPTION]... SOURCE... DEST', 'Copy SOURCE to DEST, or multiple SOURCE(s) to DIRECTORY.', [['-r, -R', 'copy directories recursively'], ['-a', 'same as -r on cirrusfs']], ['cp notes.md notes.bak', 'cp -r Documents /tmp']],
    mv: ['mv SOURCE... DEST', 'Rename SOURCE to DEST, or move SOURCE(s) to DIRECTORY.', [], ['mv a.txt b.txt', 'mv *.svg ~/Pictures']],
    rm: ['rm [OPTION]... FILE...', 'rm removes each specified file. By default, it does not remove directories.', [['-f', 'ignore nonexistent files, never prompt'], ['-r, -R', 'remove directories and their contents recursively'], ['-v', 'explain what is being done']], ['rm old.txt', 'rm -rf build/']],
    mkdir: ['mkdir [OPTION]... DIRECTORY...', 'Create the DIRECTORY(ies), if they do not already exist.', [['-p', 'no error if existing, make parent directories as needed'], ['-v', 'print a message for each created directory']], ['mkdir -p projects/web/css']],
    touch: ['touch FILE...', 'Update the access and modification times of each FILE to the current time. A FILE argument that does not exist is created empty.', [], ['touch todo.txt']],
    echo: ['echo [-n] [-e] [STRING]...', 'Echo the STRING(s) to standard output.', [['-n', 'do not output the trailing newline'], ['-e', 'enable interpretation of backslash escapes']], ['echo "Hello $USER"', 'echo hi > file.txt']],
    grep: ['grep [OPTION...] PATTERNS [FILE...]', 'grep searches for PATTERNS in each FILE. PATTERNS is a regular expression.', [['-i', 'ignore case distinctions'], ['-v', 'select non-matching lines'], ['-n', 'prefix each line with its line number'], ['-c', 'print only a count of matching lines'], ['-l', 'print only names of files with matches'], ['-r', 'read all files under each directory, recursively']], ['grep -n milk todo.txt', 'ps aux | grep cirrus']],
    find: ['find [PATH] [EXPRESSION]', 'Search for files in a directory hierarchy.', [['-name PATTERN', 'base of file name matches shell PATTERN'], ['-iname PATTERN', 'like -name, but case insensitive'], ['-type d|f', 'file is a directory or regular file']], ['find ~ -name "*.svg"', 'find . -type d']],
    head: ['head [-n NUM] [FILE]...', 'Print the first 10 lines of each FILE to standard output.', [['-n NUM, -NUM', 'print the first NUM lines']], ['head -5 todo.txt']],
    tail: ['tail [-n NUM] [FILE]...', 'Print the last 10 lines of each FILE to standard output.', [['-n NUM, -NUM', 'output the last NUM lines']], ['tail -n 3 /var/log/syslog']],
    sort: ['sort [OPTION]... [FILE]...', 'Write sorted concatenation of all FILE(s) to standard output.', [['-n', 'compare according to numerical value'], ['-r', 'reverse the result of comparisons'], ['-u', 'output only unique lines'], ['-f', 'fold lower case to upper case']], ['sort -n numbers.txt']],
    wc: ['wc [OPTION]... [FILE]...', 'Print newline, word, and byte counts for each FILE.', [['-l', 'print the newline counts'], ['-w', 'print the word counts'], ['-c', 'print the byte counts']], ['wc -l notes.md']],
    nano: ['nano [+LINE] [FILE]', 'nano is a small and friendly editor. It copies the look and feel of Pico, but adds features. The bottom two lines show the most important shortcuts: ^ means Ctrl and M- means Alt. On touch screens, use the buttons under the editor or the sticky Ctrl key.', [['^O', 'write the buffer to a file'], ['^S', 'save without prompting'], ['^X', 'exit (asks to save if modified)'], ['^W', 'search'], ['^K / ^U', 'cut / paste a line'], ['M-U / M-E', 'undo / redo'], ['^_', 'go to a line number']], ['nano notes.md', 'nano +10 script.sh']],
    vim: ['vim [OPTIONS] [FILE]', 'Vim is a text editor that is upwards compatible to Vi. It is modal: in Normal mode keys are commands, in Insert mode they insert text. Press i to start typing, Esc to stop, :w to save and :q to quit. Run vimtutor for a short course.', [['i a o', 'enter Insert mode before/after cursor or on a new line'], ['Esc', 'return to Normal mode'], [':w  :q  :wq  :q!', 'write, quit, write and quit, quit without saving'], ['dd yy p', 'delete line, yank (copy) line, put (paste)'], ['u  ^R', 'undo, redo'], ['/text  n', 'search forward, next match'], [':%s/a/b/g', 'replace a with b everywhere'], [':set nu', 'show line numbers']], ['vim script.sh', 'vimtutor']],
    vi: null, top: ['top [-b] [-n NUM]', 'The top program provides a dynamic real-time view of the running system. It displays system summary information and a list of processes. Press q to quit.', [['P', 'sort by %CPU'], ['M', 'sort by %MEM'], ['N', 'sort by PID'], ['T', 'sort by TIME+'], ['k', 'kill a task'], ['1', 'toggle per-CPU states'], ['-b', 'batch mode: print once and exit (useful in pipes)']], ['top', 'top -b -n 1 | head -15']],
    htop: ['htop [-s COLUMN]', 'htop is a cross-platform interactive process viewer. Use the arrow keys or tap to select a process, F9 to kill it, F6 to change the sort column, F3 to search and F10 or q to quit.', [], ['htop']],
    ps: ['ps [aux]', 'ps displays information about a selection of the active processes.', [['aux', 'show all processes for all users with resource usage']], ['ps aux', 'ps aux | grep bash']],
    kill: ['kill PID...', 'Send a signal (TERM) to the given processes. Only processes owned by you (open application windows) can be terminated.', [], ['kill 4242', 'killall terminal']],
    apt: ['apt [options] command [package...]', 'apt provides a high-level commandline interface for the package management system. Installing and removing packages requires root, so prefix those commands with sudo.', [['update', 'download package information from all configured sources'], ['upgrade', 'install available upgrades of all packages'], ['install PKG', 'install packages'], ['remove PKG', 'remove packages'], ['search TERM', 'search for packages'], ['show PKG', 'show package details'], ['list --installed', 'list installed packages'], ['-y', 'assume yes to all prompts']], ['sudo apt update', 'sudo apt install cowsay htop', 'apt search game']],
    sudo: ['sudo COMMAND', 'sudo allows a permitted user to execute a command as the superuser. If a password is set in Settings > Users, it is asked once every 5 minutes.', [], ['sudo apt install figlet', 'sudo reboot']],
    curl: ['curl [options] URL', 'curl is a tool for transferring data from or to a server. In Cirrus it uses the browser network stack, so servers must allow cross-origin requests (CORS).', [['-o FILE', 'write output to FILE'], ['-O', 'write output to a file named like the remote file'], ['-I', 'fetch headers only'], ['-i', 'include response headers in output']], ['curl https://api.github.com/zen', 'curl -o data.json https://httpbin.org/json']],
    wget: ['wget [option]... URL', 'GNU Wget is a utility for downloading files from the Web.', [['-O FILE', 'write documents to FILE']], ['wget https://httpbin.org/image/svg']],
    ping: ['ping [-c COUNT] HOST', 'ping measures the round-trip time to a network host (using HTTPS requests in the browser).', [['-c COUNT', 'stop after sending COUNT packets']], ['ping -c 3 wikipedia.org']],
    chmod: ['chmod MODE FILE...', 'Change file mode bits. cirrusfs does not store permissions, so this only checks that the files exist.', [], ['chmod +x script.sh']],
    tree: ['tree [-a] [-L level] [directory]', 'Tree is a recursive directory listing program that produces a depth-indented listing of files.', [['-a', 'all files are printed, including hidden ones'], ['-L level', 'max display depth of the directory tree']], ['tree -L 2 ~']],
    watch: ['watch [-n SECONDS] COMMAND', 'watch runs COMMAND repeatedly, displaying its output full-screen. Press q to exit.', [['-n SECONDS', 'specify update interval (default 2)']], ['watch -n 1 date', 'watch free -h']],
    alsamixer: ['alsamixer', 'alsamixer is a graphical mixer program for the terminal. Use the up/down arrow keys to change the volume, M to mute, and Esc to quit.', [], []],
    df: ['df [-h]', 'Report file system disk space usage.', [['-h', 'print sizes in human readable format']], ['df -h']],
    du: ['du [-sh] [FILE]...', 'Summarize disk usage of each FILE, recursively for directories.', [['-s', 'display only a total for each argument'], ['-h', 'print sizes in human readable format']], ['du -sh ~']],
    free: ['free [-h]', 'Display amount of free and used memory in the system.', [['-h', 'show all output fields in human readable units']], ['free -h']],
    sed: ['sed [-i] s/REGEXP/REPLACEMENT/[g] [FILE]...', 'Stream editor for filtering and transforming text. This build supports the s (substitute) command.', [['-i', 'edit files in place']], ['echo hello | sed s/l/L/g', 'sed -i "s/old/new/g" file.txt']],
    git: ['git <command> [<args>]', 'Git is a version control system. This build supports local repositories: init, status, add, commit, log, diff and branch.', [], ['git init', 'git add . && git commit -m "first"', 'git log --oneline']],
    python3: ['python3 [-c COMMAND] [FILE]', 'A tiny Python interpreter supporting print, variables, arithmetic, lists, if/elif/else, for/while loops and def.', [['-c COMMAND', 'program passed in as string']], ['python3 -c "print(2**10)"', 'python3 script.py']],
    node: ['node [-e SCRIPT] [FILE]', 'Node.js JavaScript runtime. Supports console.log and a small fs module.', [['-e SCRIPT', 'evaluate script'], ['-v', 'print version']], ['node -e "1+2"', 'node script.js']],
    bash: ['bash [FILE [ARGS]]', 'Bash is the shell. It supports pipes (|), redirection (> >> < 2>), command lists (; && ||), variables ($VAR), command substitution ($(cmd)), arithmetic ($((1+2))), globs (*.txt), aliases, for loops, if blocks and functions in scripts.', [], ['bash script.sh', 'for f in *.txt; do echo $f; done']],
    neofetch: ['neofetch', 'Neofetch displays information about your operating system, software and hardware next to a logo.', [], []],
    cowsay: ['cowsay [-f tux|dragon] [-d -g -p -s -t -w -y] MESSAGE', 'cowsay generates an ASCII picture of a cow saying something provided by the user.', [['-f FILE', 'use another figure (tux, dragon)'], ['-d', 'dead cow'], ['-t', 'tired cow']], ['cowsay Moo', 'fortune | cowsay -f tux']],
    date: ['date [+FORMAT]', 'Display the current time in the given FORMAT.', [['%Y %m %d', 'year, month, day'], ['%H %M %S', 'hour, minute, second'], ['%A %B', 'weekday and month name']], ['date', 'date +%Y-%m-%d']],
    history: ['history [-c]', 'Display the command history list with line numbers. -c clears it.', [], []],
    alias: ['alias [NAME=VALUE]', 'Define or display aliases. Aliases in ~/.bashrc are loaded by every new shell.', [], ["alias ll='ls -la'"]],
    clear: ['clear', 'Clear the terminal screen. Ctrl+L does the same.', [], []],
  };
  MAN.vi = MAN.vim; MAN.sh = MAN.bash; MAN.nodejs = MAN.node; MAN.python = MAN.python3; MAN.dir = MAN.ls; MAN['apt-get'] = MAN.apt;
  function manPage(n) {
    const m = MAN[n]; const desc = HELP[n] || 'no description available';
    return (W) => {
      const ind = 7, tw = Math.max(20, W - ind - 1);
      const wrap = (t, extra = 0) => { const out = []; t.split('\n').forEach((para) => { let line = ''; para.split(' ').forEach((w) => { if ((line + ' ' + w).trim().length > tw - extra) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); }); out.push(line); }); return out.map((l) => ' '.repeat(ind + extra) + l); };
      const up = `${n.toUpperCase()}(1)`, mid = 'User Commands';
      const head = up + center(mid, Math.max(0, W - up.length * 2)) + up;
      const L = [bold(cutA(head, W)), '', bold('NAME'), ...wrap(`${n} - ${desc}`), '', bold('SYNOPSIS'), ...wrap(m ? m[0] : `${n} [OPTION]... [ARG]...`), '', bold('DESCRIPTION'), ...wrap(m ? m[1] : `${n[0].toUpperCase() + n.slice(1)}: ${desc}.`)];
      if (m && m[2].length) { L.push('', bold('OPTIONS')); m[2].forEach(([o, d]) => { L.push(' '.repeat(ind) + bold(o)); L.push(...wrap(d, 4)); L.push(''); }); L.pop(); }
      if (m && m[3].length) { L.push('', bold('EXAMPLES')); m[3].forEach((e) => L.push(' '.repeat(ind) + '\x1b[32m$\x1b[0m ' + e)); }
      L.push('', bold('SEE ALSO'), ...wrap('help(1), man(1), apropos(1)'), '');
      const foot = `Cirrus Linux ${OS.version}`, dt = 'November 2026'; L.push(foot + center(dt, Math.max(0, W - foot.length - up.length)) + up);
      return L;
    };
  }
  const CMDS = OS.shell.CMDS;
  def('man info', 'an interface to the system reference manuals', async (ctx) => {
    const [o, r] = opts(ctx.args, 'k:f:');
    if (o.k) return CMDS.apropos(Object.assign({}, ctx, { args: [o.k] }));
    if (o.f) return CMDS.whatis(Object.assign({}, ctx, { args: [o.f] }));
    const n = r.filter((x) => !/^\d$/.test(x))[0];
    if (!n) { ctx.err('What manual page do you want?\nFor example, try \'man man\'.\n'); return 1; }
    if (!CMDS[n] && !MAN[n]) { ctx.err(`No manual entry for ${n}\n`); return 16; }
    const src = manPage(n);
    if (!ctx.isTTY || !ctx.term.tui) { ctx.out(src(80).join('\n') + '\n'); return; }
    await ctx.term.tui(pager({ source: src, name: `${n}(1)`, kind: 'man' }));
  });
  def('apropos', 'search the manual page names and descriptions', (ctx) => { const q = (ctx.args[0] || '').toLowerCase(); if (!q) { ctx.err('apropos what?\n'); return 1; } const hits = Object.keys(HELP).filter((n) => OS.pkg.cmdAvailable(n) === true && (n.includes(q) || HELP[n].toLowerCase().includes(q))).sort(); if (!hits.length) { ctx.println(`${q}: nothing appropriate.`); return 1; } hits.forEach((n) => ctx.println(`${n} (1)`.padEnd(20) + ' - ' + HELP[n])); });
  def('whatis', 'display one-line manual page descriptions', (ctx) => { let c = 0; ctx.args.forEach((n) => { if (HELP[n]) ctx.println(`${n} (1)`.padEnd(20) + ' - ' + HELP[n]); else { ctx.println(`${n}: nothing appropriate.`); c = 1; } }); return c; });

  /* ============================== TOP ============================== */
  const memInfo = () => { const tot = (navigator.deviceMemory || 8) * 1024; const ps = procs(); const used = Math.min(tot * 0.9, ps.reduce((a, p) => a + p.res, 0) + 900 + (performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 0)); const cache = tot * 0.14; return { tot, used, cache, free: tot - used - cache }; };
  const fmtTime = (s) => { const m = Math.floor(s / 60); return `${m}:${(s % 60).toFixed(2).padStart(5, '0')}`; };
  const sortProcs = (ps, by) => ps.sort((a, b) => (by === 'mem' ? b.res - a.res : by === 'pid' ? a.pid - b.pid : by === 'time' ? b.time - a.time : b.cpu - a.cpu || b.res - a.res));
  function topScreen(W, H, st) {
    const ps = sortProcs(procs(), st.sort), cpus = navigator.hardwareConcurrency || 4, mi = memInfo();
    const totCpu = Math.min(100, ps.reduce((a, p) => a + p.cpu, 0) / cpus); const us = totCpu * 0.7, sy = totCpu * 0.3; const la = OS.fs.read('/proc/loadavg').split(' ');
    const now = new Date(); const out = [];
    const narrow = W < 74;
    out.push(narrow ? `top - ${OS.fmtTime(now, true)} up ${uptimeStr()}, load ${la[0]}` : `top - ${now.toTimeString().slice(0, 8)} up ${uptimeStr()},  1 user,  load average: ${la[0]}, ${la[1]}, ${la[2]}`);
    out.push(narrow ? `Tasks: ${bold(ps.length)} total, ${bold(1)} running` : `Tasks: ${bold(String(ps.length).padStart(3))} total,   ${bold(1)} running, ${bold(String(ps.length - 1).padStart(3))} sleeping,   ${bold(0)} stopped,   ${bold(0)} zombie`);
    const cpuLine = (lbl, u, s) => (narrow ? `${lbl} ${bold(u.toFixed(1))} us, ${bold(s.toFixed(1))} sy, ${bold((100 - u - s).toFixed(1))} id` : `${lbl}${bold(u.toFixed(1).padStart(5))} us,${bold(s.toFixed(1).padStart(5))} sy,  ${bold('0.0')} ni,${bold((100 - u - s).toFixed(1).padStart(5))} id,  ${bold('0.1')} wa,  ${bold('0.0')} hi,  ${bold('0.1')} si,  ${bold('0.0')} st`);
    if (st.perCpu) for (let i = 0; i < cpus; i++) { const u = Math.max(0, us + (Math.random() - 0.5) * 4); out.push(cpuLine(`%Cpu${i}  :`, u, sy)); } else out.push(cpuLine('%Cpu(s):', us, sy));
    out.push(narrow ? `MiB Mem: ${bold(mi.tot.toFixed(0))} tot, ${bold(mi.used.toFixed(0))} used` : `MiB Mem : ${bold(mi.tot.toFixed(1).padStart(8))} total, ${bold(mi.free.toFixed(1).padStart(8))} free, ${bold(mi.used.toFixed(1).padStart(8))} used, ${bold(mi.cache.toFixed(1).padStart(8))} buff/cache`);
    out.push(narrow ? `MiB Swap: ${bold('2048')} tot, ${bold('0')} used` : `MiB Swap: ${bold('  2048.0')} total, ${bold('  2048.0')} free, ${bold('     0.0')} used. ${bold((mi.tot - mi.used).toFixed(1).padStart(8))} avail Mem`);
    out.push(st.prompt != null ? `\x1b[1m${st.prompt.label}\x1b[0m${st.prompt.buf}${inv(' ')}` : st.msg ? `\x1b[1;31m${st.msg}\x1b[0m` : '');
    const sk = st.sort; const mark = (n, k) => (sk === k ? `\x1b[1m${n}\x1b[22m` : n);
    if (narrow) out.push(inv(padA(`${mark('  PID', 'pid')} USER     ${mark('%CPU', 'cpu')} ${mark('%MEM', 'mem')} ${mark('    TIME+', 'time')} COMMAND`, W)));
    else out.push(inv(padA(`${mark('    PID', 'pid')} USER      PR  NI    VIRT    RES    SHR S  ${mark('%CPU', 'cpu')}  ${mark('%MEM', 'mem')}     ${mark('TIME+', 'time')} COMMAND`, W)));
    const room = H - out.length; st.maxScroll = Math.max(0, ps.length - room); st.scroll = OS.clamp(st.scroll || 0, 0, st.maxScroll);
    ps.slice(st.scroll, st.scroll + room).forEach((p) => {
      const run = p.cpu > 1.5; const row = narrow
        ? `${String(p.pid).padStart(5)} ${p.user.slice(0, 8).padEnd(8)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${fmtTime(p.time).padStart(9)} ${p.cmd}`
        : `${String(p.pid).padStart(7)} ${p.user.slice(0, 8).padEnd(8)}  20   0 ${String(Math.round(p.virt * 1024)).padStart(7)} ${String(Math.round(p.res * 1024)).padStart(6)} ${String(Math.round(p.shr * 1024)).padStart(6)} ${run ? 'R' : p.s} ${p.cpu.toFixed(1).padStart(5)} ${p.mem.toFixed(1).padStart(5)} ${fmtTime(p.time).padStart(9)} ${p.cmd}`;
      out.push(run ? bold(cutA(row, W)) : cutA(row, W));
    });
    return out;
  }
  def('top', 'display processes and system resource usage', async (ctx) => {
    const [o] = opts(ctx.args, 'n:d:s:');
    if (o.b || !ctx.isTTY || !ctx.term.tui) { const n = +(o.n || 1); for (let i = 0; i < n; i++) { ctx.out(topScreen(100, 60, { sort: 'cpu' }).map(stripAnsi).join('\n') + '\n\n'); if (i < n - 1) await OS.sleep(+(o.d || 3) * 1000); } return; }
    const st = { sort: 'cpu', perCpu: false, prompt: null, msg: '', scroll: 0 }; let help = false;
    await ctx.term.tui({
      init(api) { api.interval(() => {}, +(o.d || 3) * 1000); api.soft(touchOnly([{ k: 'q', label: 'Quit', send: 'q' }, { k: 'P', label: 'CPU', send: 'P' }, { k: 'M', label: 'Mem', send: 'M' }, { k: 'N', label: 'PID', send: 'N' }, { k: 'T', label: 'Time', send: 'T' }, { k: 'k', label: 'Kill', send: 'k' }, { k: '1', label: 'Per-CPU', send: '1' }, { k: 'h', label: 'Help', send: 'h' }])); },
      key(k, api) {
        if (help) { help = false; return; }
        if (st.prompt) { const p = st.prompt; if (k === 'Enter') { st.prompt = null; p.cb(p.buf || p.def); } else if (k === 'Escape' || k === 'C-c') st.prompt = null; else if (k === 'Backspace') p.buf = p.buf.slice(0, -1); else if (/^\d$/.test(k)) p.buf += k; return; }
        st.msg = '';
        if (k === 'q' || k === 'C-c') return api.exit();
        if (k === 'P') st.sort = 'cpu'; else if (k === 'M') st.sort = 'mem'; else if (k === 'N') st.sort = 'pid'; else if (k === 'T') st.sort = 'time';
        else if (k === '1') st.perCpu = !st.perCpu; else if (k === 'h' || k === '?') help = true;
        else if (k === 'ArrowDown' || k === 'WheelDown') st.scroll++; else if (k === 'ArrowUp' || k === 'WheelUp') st.scroll--; else if (k === 'PageDown') st.scroll += 10; else if (k === 'PageUp') st.scroll -= 10;
        else if (k === 'k') { const def = sortProcs(procs(), st.sort)[0]; st.prompt = { label: `PID to signal/kill [default pid = ${def.pid}] `, buf: '', def: String(def.pid), cb: (v) => { const p = procs().find((x) => String(x.pid) === v); if (!p) st.msg = `Failed signal pid '${v}' with 15: No such process`; else if (!p.win) st.msg = `Failed signal pid '${v}' with 15: Operation not permitted`; else { OS.wm.close(p.win); st.msg = ''; } } }; }
      },
      render(api) {
        if (help) return ['Help for Interactive Commands - procps-ng 4.0.4', '', '  P M N T   Sort by %CPU, %MEM, PID, TIME+', '  1         Toggle per-CPU states', '  k         Kill a task', '  ↑ ↓       Scroll the task list', '  q         Quit', '', 'Press any key to continue'];
        return topScreen(api.cols, api.rows, st);
      },
    });
  });

  /* ============================== HTOP ============================== */
  def('htop', 'interactive process viewer', async (ctx) => {
    if (!needTTY(ctx, 'htop')) return 1;
    const SORTS = ['cpu', 'mem', 'pid', 'time']; let sort = 'cpu', sel = 0, scroll = 0, prompt = null, confirm = null, help = false, search = '';
    const FKEYS = [['F1', 'Help', 'F1'], ['F2', 'Setup', 'F2'], ['F3', 'Search', 'F3'], ['F4', 'Filter', 'F4'], ['F5', 'Tree', 'F5'], ['F6', 'SortBy', 'F6'], ['F7', 'Nice -', 'F7'], ['F8', 'Nice +', 'F8'], ['F9', 'Kill', 'F9'], ['F10', 'Quit', 'F10']];
    let filter = '', hdrRows = 0, listRows = 0, list = [];
    const bar = (label, pct, w, txt, colors) => { const inner = Math.max(4, w - label.length - 2); const n = Math.round(OS.clamp(pct, 0, 100) / 100 * inner); const t = txt.slice(0, inner); let fill = ''; for (let i = 0; i < inner; i++) { const ch = i >= inner - t.length ? t[i - (inner - t.length)] : i < n ? '|' : ' '; const c = i < n ? (colors ? colors(i / inner) : '\x1b[32m') : '\x1b[90m'; fill += c + ch; } return `\x1b[36m${label}\x1b[0m\x1b[1m[\x1b[0m${fill}\x1b[0m\x1b[1m]\x1b[0m`; };
    await ctx.term.tui({
      init(api) { api.interval(() => {}, 1500); api.soft(touchOnly([{ k: 'F3', label: 'Search', send: 'F3' }, { k: 'F6', label: 'Sort', send: 'F6' }, { k: 'F9', label: 'Kill', send: 'F9' }, { k: 'F1', label: 'Help', send: 'F1' }, { k: 'F10', label: 'Quit', send: 'F10' }])); },
      key(k, api) {
        if (help) { help = false; return; }
        if (confirm) { if (k === 'Enter') { const p = confirm; confirm = null; if (p.win) OS.wm.close(p.win); else prompt = { msg: `Operation not permitted for PID ${p.pid}` }; } else if (k === 'Escape' || k === 'q') confirm = null; return; }
        if (prompt && prompt.input != null) { if (k === 'Enter' || k === 'Escape') { if (k === 'Escape' && prompt.kind === 'filter') filter = ''; prompt = null; } else if (k === 'Backspace') prompt.input = prompt.input.slice(0, -1); else if (isPrint(k)) prompt.input += k; if (prompt) { if (prompt.kind === 'search') { search = prompt.input; const i = list.findIndex((p) => p.cmd.toLowerCase().includes(search.toLowerCase())); if (i >= 0) sel = i; } else filter = prompt.input; } return; }
        prompt = null;
        switch (k) {
          case 'q': case 'F10': case 'C-c': return api.exit();
          case 'ArrowDown': case 'j': sel++; break; case 'ArrowUp': sel--; break; case 'WheelDown': sel += 3; break; case 'WheelUp': sel -= 3; break;
          case 'PageDown': sel += listRows; break; case 'PageUp': sel -= listRows; break; case 'Home': sel = 0; break; case 'End': sel = 1e9; break;
          case 'F6': case '>': case '.': sort = SORTS[(SORTS.indexOf(sort) + 1) % SORTS.length]; break;
          case 'P': sort = 'cpu'; break; case 'M': sort = 'mem'; break; case 'T': sort = 'time'; break; case 'N': sort = 'pid'; break;
          case 'F9': case 'k': if (list[sel]) confirm = list[sel]; break;
          case 'F3': case '/': prompt = { kind: 'search', input: '' }; break;
          case 'F4': case '\\': prompt = { kind: 'filter', input: filter }; break;
          case 'n': { const i = list.findIndex((p, j) => j > sel && search && p.cmd.toLowerCase().includes(search.toLowerCase())); if (i >= 0) sel = i; break; }
          case 'F1': case 'h': case '?': help = true; break;
          case 'F2': case 'S': prompt = { msg: 'Setup is not available in this build' }; break;
          case 'F5': case 't': prompt = { msg: 'Tree view is not available in this build' }; break;
          case 'F7': case 'F8': case ']': case '[': prompt = { msg: 'Changing priority requires root' }; break;
        }
      },
      click(col, row, api) {
        if (row === api.rows - 1) { const w = Math.floor(api.cols / FKEYS.length) || 1; const fk = FKEYS[Math.min(FKEYS.length - 1, Math.floor(col / Math.max(6, w)))]; if (fk) this.key(fk[2], api); return; }
        const i = row - hdrRows - 1; if (i >= 0 && i < listRows) sel = scroll + i;
      },
      render(api) {
        const W = api.cols, H = api.rows, out = [];
        if (help) return [bold('htop 3.3.0 - (C) 2004-2024 htop dev team.'), 'Released under the GNU GPLv2+.', '', `CPU usage bar: [\x1b[32mnormal\x1b[0m/\x1b[31mkernel\x1b[0m       used%]`, `Memory bar:    [\x1b[32mused\x1b[0m/\x1b[34mbuffers\x1b[0m/\x1b[33mcache\x1b[0m   used/total]`, '', ' Arrows, PgUp/PgDn, Home/End: scroll process list', '   F3 /: incremental search      F4 \\: filter by name', '   F6 >: select sort column      P M T N: sort by CPU/MEM/TIME/PID', '   F9 k: kill process            F10 q: quit', '   Tap a process to select it; tap the bottom bar for F-keys.', '', 'Press any key to return.'];
        const cpus = navigator.hardwareConcurrency || 4, ps = sortProcs(procs(), sort), mi = memInfo(), la = OS.fs.read('/proc/loadavg').split(' ');
        list = filter ? ps.filter((p) => p.cmd.toLowerCase().includes(filter.toLowerCase())) : ps;
        const tot = ps.reduce((a, p) => a + p.cpu, 0) / cpus;
        const meters = []; const nShow = Math.min(cpus, 8);
        for (let i = 0; i < nShow; i++) { const v = Math.max(0, tot + (Math.random() - 0.5) * 6); meters.push([String(i + 1).padStart(3), v, v.toFixed(1) + '%']); }
        const memBar = ['Mem', mi.used / mi.tot * 100, `${(mi.used / 1024).toFixed(2)}G/${(mi.tot / 1024).toFixed(2)}G`], swpBar = ['Swp', 0, `0K/2.00G`];
        const info = [`\x1b[36mTasks: \x1b[1m${ps.length}\x1b[0m\x1b[36m, \x1b[0m\x1b[1m${ps.length * 2 + 30}\x1b[0m\x1b[36m thr; \x1b[1;32m1\x1b[0m\x1b[36m running\x1b[0m`, `\x1b[36mLoad average: \x1b[1m${la[0]} ${la[1]} ${la[2]}\x1b[0m`, `\x1b[36mUptime: \x1b[1m${OS.fmtDur((Date.now() - OS.bootTime) / 1000).padStart(8, '0')}\x1b[0m`];
        const colorsCpu = (f) => (f < 0.7 ? '\x1b[32m' : '\x1b[31m');
        const colorsMem = (f) => (f < 0.6 ? '\x1b[32m' : f < 0.8 ? '\x1b[34m' : '\x1b[33m');
        if (W >= 80) {
          const half = Math.floor(W / 2) - 1; const left = [], right = [];
          meters.forEach((m, i) => (nShow > 4 && i >= Math.ceil(nShow / 2) ? right : left).push(bar(m[0], m[1], half, m[2], colorsCpu)));
          left.push(bar(memBar[0], memBar[1], half, memBar[2], colorsMem)); left.push(bar(swpBar[0], 0, half, swpBar[2]));
          right.push(...info);
          for (let i = 0; i < Math.max(left.length, right.length); i++) out.push(padA(left[i] || '', half + 2) + (right[i] || ''));
        } else {
          if (nShow <= 4) meters.forEach((m) => out.push(bar(m[0], m[1], W, m[2], colorsCpu))); else out.push(bar('CPU', tot, W, tot.toFixed(1) + '%', colorsCpu));
          out.push(bar(memBar[0], memBar[1], W, memBar[2], colorsMem)); out.push(bar(swpBar[0], 0, W, swpBar[2])); out.push(...info);
        }
        out.push(''); hdrRows = out.length;
        const narrow = W < 72; const ar = (k) => (sort === k ? '▽' : ' ');
        const hdr = narrow ? `  PID USER     CPU%${ar('cpu')}MEM%${ar('mem')}  TIME+  Command` : `    PID USER       PRI  NI  VIRT   RES   SHR S CPU%${ar('cpu')}MEM%${ar('mem')}  TIME+${ar('time')} Command`;
        out.push(`\x1b[30;42m${padA(hdr, W)}\x1b[0m`);
        listRows = H - out.length - 1; sel = OS.clamp(sel, 0, Math.max(0, list.length - 1));
        if (sel < scroll) scroll = sel; if (sel >= scroll + listRows) scroll = sel - listRows + 1; scroll = OS.clamp(scroll, 0, Math.max(0, list.length - listRows));
        const kb = (v) => (v >= 1024 ? (v / 1024).toFixed(1) + 'G' : Math.round(v) + 'M');
        for (let i = 0; i < listRows; i++) {
          const p = list[scroll + i]; if (!p) { out.push(''); continue; }
          const mine = p.user === OS.settings.username;
          const cmdc = p.win ? `\x1b[1m${p.cmd}\x1b[22m` : p.cmd.startsWith('cirrus') || p.cmd === 'Xwayland' ? `\x1b[32m${p.cmd}\x1b[39m` : p.cmd;
          let row = narrow ? `${String(p.pid).padStart(5)} ${p.user.slice(0, 8).padEnd(8)} ${p.cpu.toFixed(1).padStart(4)}  ${p.mem.toFixed(1).padStart(4)}  ${fmtTime(p.time).padStart(7)} ${cmdc}`
            : `${String(p.pid).padStart(7)} ${p.user.slice(0, 9).padEnd(9)}  20   0 ${kb(p.virt).padStart(5)} ${kb(p.res).padStart(5)} ${kb(p.shr).padStart(5)} ${p.cpu > 1.5 ? '\x1b[32mR\x1b[39m' : p.s} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${fmtTime(p.time).padStart(8)} ${cmdc}`;
          if (!mine && scroll + i !== sel) row = `\x1b[90m${stripAnsi(row)}\x1b[0m`;
          out.push(scroll + i === sel ? `\x1b[30;46m${padA(stripAnsi(row), W)}\x1b[0m` : cutA(row, W));
        }
        // bottom bar
        if (confirm) out.push(`\x1b[30;46m${padA(` Send signal 15 (SIGTERM) to ${confirm.cmd} (PID ${confirm.pid})?  Enter = send   Esc = cancel`, W)}\x1b[0m`);
        else if (prompt && prompt.input != null) out.push(`\x1b[30;46m${prompt.kind === 'search' ? 'Search: ' : 'Filter: '}\x1b[0m${prompt.input}${inv(' ')}`);
        else if (prompt && prompt.msg) out.push(`\x1b[30;43m${padA(' ' + prompt.msg, W)}\x1b[0m`);
        else { let s = ''; const w = Math.max(6, Math.floor(W / FKEYS.length)); FKEYS.forEach(([f, l]) => { if (vlen(s) + w > W + 1) return; s += `\x1b[0m${f}\x1b[30;46m${l.padEnd(w - f.length)}`; }); out.push(cutA(s, W) + '\x1b[0m'); }
        return out;
      },
    });
  });

  /* ============================== WATCH ============================== */
  def('watch', 'execute a program periodically, showing output fullscreen', async (ctx) => {
    const a = ctx.args.slice(); let n = 2, noTitle = false;
    while (a.length && a[0].startsWith('-')) { const f = a.shift(); if (f === '-n') n = Math.max(0.1, parseFloat(a.shift()) || 2); else if (/^-n\d/.test(f)) n = parseFloat(f.slice(2)); else if (f === '-t') noTitle = true; }
    const cmd = a.join(' '); if (!cmd) { ctx.err('Usage:\n watch [options] command\n'); return 1; }
    if (!needTTY(ctx, 'watch')) return 1;
    let output = '', running = false;
    const run = async (api) => { if (running) return; running = true; let buf = ''; const io = Object.assign({}, ctx.term, { write: (t) => (buf += t), clear() {}, live: () => ({ set() {}, done() {} }), readLine: async () => null, tui: null, signal: null }); try { await ctx.sh.run(cmd, io); } catch (e) { buf += e.message; } output = stripAnsi(buf); running = false; api.draw(); };
    await ctx.term.tui({
      init(api) { run(api); api.interval(() => run(api), n * 1000); api.soft(touchOnly([{ k: 'q', label: 'Quit', send: 'q' }])); },
      key(k, api) { if (k === 'q' || k === 'C-c' || k === 'Escape') api.exit(); },
      render(api) { const W = api.cols, out = []; if (!noTitle) { const l = `Every ${n.toFixed(1)}s: ${cmd}`, r = `${OS.settings.hostname}: ${new Date().toString().slice(0, 24)}`; out.push(vlen(l) + vlen(r) + 1 <= W ? padA(l, W - r.length) + r : cutA(l, W)); out.push(''); } output.split('\n').forEach((l) => wrapA(l, W).forEach((x) => out.push(x))); return out; },
    });
  });

  /* ============================== ALSAMIXER ============================== */
  def('alsamixer', 'soundcard mixer for ALSA soundcard driver, with ncurses interface', async (ctx) => {
    if (!needTTY(ctx, 'alsamixer')) return 1;
    let ch = 0, saved = OS.settings.volume || 70; let barTop = 0, barH = 0, colX = [];
    const chans = () => [{ name: 'Master', get: () => OS.settings.volume, set: (v) => OS.set('volume', v), mute: () => OS.settings.volume === 0 }, { name: 'System', get: () => (OS.settings.sounds ? OS.settings.volume : 0), set: (v) => { OS.set('sounds', v > 0); }, mute: () => !OS.settings.sounds }];
    await ctx.term.tui({
      init(api) { api.soft(touchOnly([{ k: 'Esc', label: 'Exit', send: 'Escape' }, { k: '↑', label: 'Louder', send: 'ArrowUp' }, { k: '↓', label: 'Softer', send: 'ArrowDown' }, { k: 'M', label: 'Mute', send: 'm' }, { k: '←→', label: 'Channel', send: 'ArrowRight' }])); },
      key(k, api) {
        const c = chans()[ch];
        if (k === 'Escape' || k === 'q' || k === 'C-c') return api.exit();
        if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'Tab') ch = (ch + 1) % 2;
        else if (k === 'ArrowUp' || k === 'k' || k === 'w' || k === '+' || k === 'WheelUp') { c.set(OS.clamp(c.get() + 5, 0, 100)); OS.sound('click'); }
        else if (k === 'ArrowDown' || k === 'j' || k === 'x' || k === '-' || k === 'WheelDown') c.set(OS.clamp(c.get() - 5, 0, 100));
        else if (k === 'PageUp') c.set(OS.clamp(c.get() + 20, 0, 100)); else if (k === 'PageDown') c.set(OS.clamp(c.get() - 20, 0, 100));
        else if (k === 'm' || k === 'M') { if (ch === 0) { if (OS.settings.volume) { saved = OS.settings.volume; OS.set('volume', 0); } else OS.set('volume', saved || 70); } else OS.set('sounds', !OS.settings.sounds); }
        else if (/^[0-9]$/.test(k)) c.set(k === '0' ? 100 : +k * 10);
      },
      click(col, row, api) { const i = colX.findIndex((x) => col >= x - 2 && col <= x + 6); if (i >= 0) { ch = i; if (row >= barTop && row < barTop + barH) chans()[i].set(Math.round((1 - (row - barTop) / barH) * 20) * 5); } },
      render(api) {
        const W = api.cols, H = api.rows, out = []; const c = chans();
        const box = (s) => `\x1b[36m${s}\x1b[0m`;
        out.push(box('┌' + center(' AlsaMixer v1.2.9 ', W - 2).replace(/ /g, '─').replace('─AlsaMixer─v1.2.9─', ' AlsaMixer v1.2.9 ') + '┐'));
        const info = [`Card: Cirrus HDA`, `Chip: Cirrus Virtual Audio`, `View: \x1b[1mPlayback\x1b[0m`, `Item: \x1b[1m${c[ch].name}\x1b[0m`];
        info.forEach((t) => out.push(box('│') + ' ' + padA(t, W - 3) + box('│')));
        barTop = out.length + 1; barH = Math.max(3, H - barTop - 5);
        colX = [Math.floor(W / 2) - 10, Math.floor(W / 2) + 4];
        const grid = Array.from({ length: barH + 4 }, () => Array(W - 2).fill(' '));
        const lines2 = grid.map(() => '');
        void lines2;
        const rows = [];
        for (let r = 0; r < barH + 4; r++) {
          let line = '';
          for (let x = 0; x < W - 2; x++) {
            let chr = ' ', style = '';
            c.forEach((cc, i) => {
              const cx = colX[i]; const v = cc.get(); const filled = Math.round(v / 100 * barH);
              if (r === 0 && x >= cx - 1 && x <= cx + 4) { chr = x === cx - 1 ? '┌' : x === cx + 4 ? '┐' : '─'; style = '\x1b[0m'; }
              else if (r > 0 && r <= barH && (x === cx - 1 || x === cx + 4)) { chr = '│'; style = '\x1b[0m'; }
              else if (r > 0 && r <= barH && x >= cx && x <= cx + 3) { const lvl = barH - r + 1; if (lvl <= filled) { const f = lvl / barH; chr = ' '; style = f > 0.85 ? '\x1b[41m' : f > 0.65 ? '\x1b[43m' : '\x1b[47m'; } }
              else if (r === barH + 1 && x >= cx - 1 && x <= cx + 4) { chr = x === cx - 1 ? '└' : x === cx + 4 ? '┘' : '─'; style = '\x1b[0m'; }
              else if (r === barH + 2 && x >= cx && x <= cx + 3) { const m = cc.mute() ? 'MM' : 'OO'; if (x >= cx + 1 && x <= cx + 2) { chr = m[x - cx - 1]; style = cc.mute() ? '\x1b[41;97m' : '\x1b[42;30m'; } }
              else if (r === barH + 3) { const lbl = String(cc.get()); const s0 = cx + 2 - Math.floor(lbl.length / 2); if (x >= s0 && x < s0 + lbl.length) { chr = lbl[x - s0]; style = '\x1b[1m'; } }
            });
            line += style ? style + chr + '\x1b[0m' : chr;
          }
          rows.push(line);
        }
        rows.forEach((l) => out.push(box('│') + l + box('│')));
        const labels = Array(W - 2).fill(' '); c.forEach((cc, i) => { const s = (i === ch ? `<${cc.name}>` : cc.name); const s0 = colX[i] + 2 - Math.floor(s.length / 2); [...s].forEach((t, j) => { if (s0 + j >= 0 && s0 + j < labels.length) labels[s0 + j] = t; }); });
        let lab = labels.join(''); c.forEach((cc, i) => { const s = i === ch ? `<${cc.name}>` : null; if (s) lab = lab.replace(s, `\x1b[1;31m${s}\x1b[0m`); });
        out.push(box('│') + lab + box('│'));
        while (out.length < H - 1) out.splice(out.length - 1, 0, box('│') + ' '.repeat(W - 2) + box('│'));
        out.push(box('└' + '─'.repeat(W - 2) + '┘'));
        return out.slice(0, H);
      },
    });
  });
  def('amixer', 'command-line mixer', (ctx) => { const [sub, , val] = ctx.args; if (sub === 'set' && val) { const v = parseInt(val); if (!isNaN(v)) OS.set('volume', OS.clamp(v, 0, 100)); else if (val === 'mute') OS.set('volume', 0); } ctx.println(`Simple mixer control 'Master',0\n  Capabilities: pvolume pswitch\n  Playback channels: Mono\n  Limits: Playback 0 - 100\n  Mono: Playback ${OS.settings.volume} [${OS.settings.volume}%] [${OS.settings.volume ? 'on' : 'off'}]`); });
})();
