/* Cirrus Linux — bash-like shell + terminal emulator */
(function () {
  'use strict';
  const fs = () => OS.fs;
  const esc = OS.esc;
  const C = { r: '\x1b[0m', b: '\x1b[1m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', mag: '\x1b[35m', cyan: '\x1b[36m', gray: '\x1b[90m', bblue: '\x1b[1;34m', bgreen: '\x1b[1;32m', bcyan: '\x1b[1;36m' };

  /* ---------- ANSI → HTML ---------- */
  const COLORS = ['#3b4252', '#ff6b6b', '#7ee787', '#f2cc60', '#79c0ff', '#d2a8ff', '#56d4dd', '#d6dae3'];
  const BRIGHT = ['#6e7681', '#ffa198', '#a5f3a1', '#ffdf5d', '#a5d6ff', '#e2c5ff', '#7ce7f0', '#ffffff'];
  function ansiToHtml(s) {
    let out = '', st = {}, open = false;
    const parts = String(s).split(/(\x1b\[[0-9;]*m)/);
    for (const p of parts) {
      const m = /^\x1b\[([0-9;]*)m$/.exec(p);
      if (!m) { out += esc(p); continue; }
      const codes = m[1].split(';').map(Number);
      for (let i = 0; i < codes.length; i++) {
        const c = codes[i];
        if (c === 0 || isNaN(c)) st = {};
        else if (c === 1) st.b = 1; else if (c === 3) st.i = 1; else if (c === 4) st.u = 1; else if (c === 7) st.inv = 1; else if (c === 27) st.inv = 0; else if (c === 22) st.b = 0; else if (c === 39) delete st.fg; else if (c === 49) delete st.bg; else if (c === 2) st.dim = 1;
        else if (c >= 30 && c <= 37) st.fg = COLORS[c - 30]; else if (c >= 90 && c <= 97) st.fg = BRIGHT[c - 90];
        else if (c >= 40 && c <= 47) st.bg = COLORS[c - 40];
        else if (c === 38 && codes[i + 1] === 2) { st.fg = `rgb(${codes[i + 2]},${codes[i + 3]},${codes[i + 4]})`; i += 4; }
        else if (c === 48 && codes[i + 1] === 2) { st.bg = `rgb(${codes[i + 2]},${codes[i + 3]},${codes[i + 4]})`; i += 4; }
      }
      if (open) out += '</span>';
      const css = (st.inv ? `color:${st.bg || 'var(--tbg)'};background:${st.fg || 'var(--tfg)'};` : (st.fg ? `color:${st.fg};` : '') + (st.bg ? `background:${st.bg};` : '')) + (st.dim ? 'opacity:.6;' : '') + (st.b ? 'font-weight:700;' : '') + (st.i ? 'font-style:italic;' : '') + (st.u ? 'text-decoration:underline;' : '');
      if (st.b && !st.fg) {} // bold only
      out += `<span style="${css}">`; open = true;
    }
    if (open) out += '</span>';
    return out;
  }
  const stripAnsi = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, '');

  /* ---------- tokenizer ---------- */
  function tokenize(line, env) {
    const toks = []; let cur = '', q = null, has = false, i = 0;
    const push = () => { if (has) toks.push({ v: cur, quoted: q !== null || toks._q }); cur = ''; has = false; toks._q = false; };
    const expandVar = (s, j) => {
      if (s[j + 1] === '{') { const e = s.indexOf('}', j); const n = s.slice(j + 2, e); return [env[n] ?? '', e + 1]; }
      if (s[j + 1] === '?') return [String(env['?'] ?? 0), j + 2];
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(j + 1)); if (!m) return ['$', j + 1];
      return [env[m[0]] ?? '', j + 1 + m[0].length];
    };
    while (i < line.length) {
      const c = line[i];
      if (q === "'") { if (c === "'") { q = null; toks._q = true; } else cur += c; i++; continue; }
      if (q === '"') {
        if (c === '"') { q = null; toks._q = true; i++; continue; }
        if (c === '\\' && /["\\$`]/.test(line[i + 1])) { cur += line[i + 1]; i += 2; continue; }
        if (c === '$' && line[i + 1] === '(') { const [v, j] = subst(line, i); cur += v; i = j; continue; }
        if (c === '$') { const [v, j] = expandVar(line, i); cur += v; i = j; continue; }
        cur += c; i++; continue;
      }
      if (c === "'" || c === '"') { q = c; has = true; i++; continue; }
      if (c === '\\') { cur += line[i + 1] || ''; has = true; i += 2; continue; }
      if (c === '#' && !has) break;
      if (/\s/.test(c)) { push(); i++; continue; }
      if (c === '$' && line[i + 1] === '(') { const [v, j] = subst(line, i); cur += v; has = true; i = j; continue; }
      if (c === '$') { const [v, j] = expandVar(line, i); cur += v; has = true; i = j; continue; }
      if (c === '~' && !has && (line[i + 1] === undefined || line[i + 1] === '/' || /\s/.test(line[i + 1]))) { cur += OS.home(); has = true; i++; continue; }
      const two = line.slice(i, i + 2);
      if (['&&', '||', '>>', '2>'].includes(two)) { push(); toks.push({ op: two === '2>' ? '2>' : two }); i += 2; if (two === '2>' && line[i] === '&') { i += 2; toks[toks.length - 1].op = '2>&1'; } continue; }
      if ('|;><&'.includes(c)) { push(); toks.push({ op: c }); i++; continue; }
      cur += c; has = true; i++;
    }
    if (q) throw new Error('unexpected EOF while looking for matching `' + q + "'");
    push();
    return toks;
  }
  // $(...) substitution marker; resolved synchronously via cached outputs not possible -> we support simple builtins sync
  function subst(line, i) {
    let depth = 0, j = i + 1;
    for (; j < line.length; j++) { if (line[j] === '(') depth++; else if (line[j] === ')') { depth--; if (depth === 0) break; } }
    const inner = line.slice(i + 2, j);
    return [Shell.syncEval(inner), j + 1];
  }

  /* split a command line into ; && || segments (respecting quotes and $( )) */
  function splitTop(line) {
    const segs = []; let cur = '', op = ';', sq = false, dq = false, depth = 0;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '\\' && !sq) { cur += c + (line[i + 1] || ''); i++; continue; }
      if (c === "'" && !dq) sq = !sq;
      else if (c === '"' && !sq) dq = !dq;
      else if (!sq && !dq) {
        if (c === '#' && (!cur.trim() || /\s$/.test(cur)) && depth === 0) break;
        if (c === '(' && line[i - 1] === '$') depth++;
        else if (c === '(' && depth) depth++;
        else if (c === ')' && depth) depth--;
        else if (!depth) {
          const two = line.slice(i, i + 2);
          if (two === '&&' || two === '||') { segs.push({ op, text: cur }); op = two; cur = ''; i++; continue; }
          if (c === ';' || (c === '&' && line[i - 1] !== '>' && line[i + 1] !== '>')) { segs.push({ op, text: cur }); op = ';'; cur = ''; continue; }
        }
      }
      cur += c;
    }
    if (sq || dq) throw new Error('unexpected EOF while looking for matching `' + (sq ? "'" : '"') + "'");
    segs.push({ op, text: cur });
    return segs.filter((x) => x.text.trim());
  }

  /* glob expansion */
  function glob(pattern, cwd) {
    if (!/[*?[]/.test(pattern)) return [pattern];
    const abs = pattern.startsWith('/'); const parts = pattern.split('/');
    let bases = [abs ? '/' : cwd];
    const prefix = [];
    for (let k = abs ? 1 : 0; k < parts.length; k++) {
      const part = parts[k]; if (!part) continue;
      if (!/[*?[]/.test(part)) { bases = bases.map((b) => OS.fs.join(b, part)).filter((b) => OS.fs.exists(b)); prefix.push(part); continue; }
      const re = new RegExp('^' + part.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
      const nb = [];
      bases.forEach((b) => { if (!OS.fs.isDir(b)) return; OS.fs.ls(b).forEach((it) => { if (re.test(it.name) && (part.startsWith('.') || !it.name.startsWith('.'))) nb.push(it.path); }); });
      bases = nb;
    }
    if (!bases.length) return [pattern];
    return bases.map((b) => (abs ? b : b.startsWith(cwd === '/' ? '/' : cwd + '/') ? b.slice(cwd === '/' ? 1 : cwd.length + 1) : b)).sort();
  }

  /* ---------- the shell ---------- */
  const CMDS = {};
  const HELP = {};
  const def = (names, help, fn) => { names.split(' ').forEach((n) => { CMDS[n] = fn; if (help) HELP[n] = help; }); };

  class Shell {
    constructor(term, opts = {}) {
      this.term = term; this.cwd = opts.cwd && OS.fs.isDir(opts.cwd) ? OS.fs.norm(opts.cwd) : OS.home();
      this.history = OS.store.get('bash_history', []);
      this.env = { HOME: OS.home(), USER: OS.settings.username, LOGNAME: OS.settings.username, SHELL: '/bin/bash', PATH: '/usr/local/bin:/usr/bin:/bin', TERM: 'xterm-256color', LANG: 'en_US.UTF-8', HOSTNAME: OS.settings.hostname, PWD: this.cwd, EDITOR: 'nano', '?': 0 };
      this.aliases = {}; this.funcs = {};
      this.loadRc();
    }
    loadRc() { try { const rc = OS.fs.read(OS.home() + '/.bashrc'); rc.split('\n').forEach((l) => { l = l.trim(); const m = /^alias\s+([^=]+)=(['"]?)(.*)\2$/.exec(l); if (m) this.aliases[m[1]] = m[3]; const x = /^export\s+([A-Za-z_]\w*)=(.*)$/.exec(l); if (x) this.env[x[1]] = x[2].replace(/^['"]|['"]$/g, ''); }); } catch (e) {} }
    prompt() { return `\x1b[1;32m${OS.settings.username}@${OS.settings.hostname}\x1b[0m:\x1b[1;34m${OS.fs.pretty(this.cwd)}\x1b[0m$ `; }
    addHistory(l) { if (!l.trim() || this.history[this.history.length - 1] === l) return; this.history.push(l); if (this.history.length > 500) this.history.shift(); OS.store.set('bash_history', this.history); }

    async run(line, io = this.term) {
      Shell.cur = this;
      let segs;
      try { segs = splitTop(line); } catch (e) { io.write(`bash: ${e.message}\n`); this.env['?'] = 2; return 2; }
      let code = this.env['?'] || 0;
      for (const sg of segs) {
        if (sg.op === '&&' && code !== 0) continue;
        if (sg.op === '||' && code === 0) continue;
        if (io.signal && io.signal.aborted) break;
        let toks;
        try { toks = tokenize(await this.expandSubst(sg.text, io), this.env); } catch (e) { io.write(`bash: ${e.message}\n`); code = 2; this.env['?'] = 2; continue; }
        if (!toks.length) continue;
        code = await this.pipeline(toks, io);
        this.env['?'] = code;
      }
      return code;
    }

    /* expand $(cmd), `cmd` and $((arith)) before tokenizing */
    async expandSubst(t, io) {
      if (!/\$\(|`/.test(t)) return t;
      let out = '', i = 0, sq = false, dq = false;
      const capture = async (inner) => {
        let buf = '';
        const io2 = Object.assign({}, io, { write: (x) => (buf += x), clear() {}, live: () => ({ set() {}, done() {} }) });
        await this.run(inner, io2);
        return stripAnsi(buf).replace(/\n+$/, '');
      };
      const put = (val) => { out += dq ? val.replace(/[\\"$`]/g, '\\$&') : val.split(/\s+/).filter(Boolean).map((w) => "'" + w.replace(/'/g, "'\\''") + "'").join(' '); };
      while (i < t.length) {
        const c = t[i];
        if (c === '\\' && !sq) { out += c + (t[i + 1] || ''); i += 2; continue; }
        if (c === "'" && !dq) { sq = !sq; out += c; i++; continue; }
        if (c === '"' && !sq) { dq = !dq; out += c; i++; continue; }
        if (!sq && t.startsWith('$((', i)) {
          const e = t.indexOf('))', i); if (e < 0) throw new Error('unexpected EOF in arithmetic');
          const ex = t.slice(i + 3, e).replace(/\$?([A-Za-z_]\w*)/g, (m, n) => this.env[n] ?? 0);
          let v; try { v = Math.trunc(OS.calc(ex, { implicit: false })); } catch (er) { throw new Error(`${ex}: syntax error in expression`); }
          out += String(v); i = e + 2; continue;
        }
        if (!sq && t.startsWith('$(', i)) {
          let d = 0, j = i + 1;
          for (; j < t.length; j++) { if (t[j] === '(') d++; else if (t[j] === ')') { d--; if (d === 0) break; } }
          if (j >= t.length) throw new Error("unexpected EOF while looking for matching `)'");
          put(await capture(t.slice(i + 2, j))); i = j + 1; continue;
        }
        if (!sq && c === '`') {
          const j = t.indexOf('`', i + 1); if (j < 0) throw new Error('unexpected EOF while looking for matching ``\'');
          put(await capture(t.slice(i + 1, j))); i = j + 1; continue;
        }
        out += c; i++;
      }
      return out;
    }

    async pipeline(toks, io) {
      const stages = []; let cur = [];
      for (const t of toks) { if (t.op === '|') { stages.push(cur); cur = []; } else cur.push(t); }
      stages.push(cur);
      let input = null, code = 0;
      for (let s = 0; s < stages.length; s++) {
        const last = s === stages.length - 1;
        // redirections
        let args = [], outFile = null, append = false, inFile = null, errFile = null, errToOut = false; const st = stages[s];
        for (let k = 0; k < st.length; k++) {
          const t = st[k];
          if (t.op === '>' || t.op === '>>') { outFile = st[++k]?.v; append = t.op === '>>'; }
          else if (t.op === '<') inFile = st[++k]?.v;
          else if (t.op === '2>') errFile = st[++k]?.v;
          else if (t.op === '2>&1') errToOut = true;
          else if (t.op) {}
          else { if (!t.quoted) glob(t.v, this.cwd).forEach((g) => args.push(g)); else args.push(t.v); }
        }
        if (!args.length) { if (outFile) { try { OS.fs.write(OS.fs.norm(outFile, this.cwd), '', { append }); } catch (e) { io.write(`bash: ${e.message}\n`); } } continue; }
        // variable assignment
        if (/^[A-Za-z_]\w*=/.test(args[0]) && args.length === 1) { const i = args[0].indexOf('='); this.env[args[0].slice(0, i)] = args[0].slice(i + 1); code = 0; continue; }
        // alias expansion
        if (this.aliases[args[0]]) { const at = tokenize(this.aliases[args[0]], this.env).filter((t) => !t.op).map((t) => t.v); args = [...at, ...args.slice(1)]; }
        if (inFile) { try { input = OS.fs.read(OS.fs.norm(inFile, this.cwd)); } catch (e) { io.write(`bash: ${inFile}: No such file or directory\n`); return 1; } }
        const capture = !last || outFile;
        let buf = '';
        const ctx = {
          sh: this, args: args.slice(1), name: args[0], stdin: input, signal: io.signal, term: io, isTTY: !capture,
          out: (t) => { t = String(t); if (capture) buf += t; else io.write(t); },
          err: (t) => { t = String(t); if (errFile) { try { OS.fs.write(OS.fs.norm(errFile, this.cwd), stripAnsi(t), { append: true }); } catch (e) {} } else if (errToOut && capture) buf += t; else io.write(t); },
          path: (p) => OS.fs.norm(p, this.cwd),
          readLine: (p, pw) => io.readLine(p, pw),
        };
        ctx.println = (t = '') => ctx.out(t + '\n');
        code = await this.exec(args[0], ctx);
        if (outFile) { try { OS.fs.write(ctx.path(outFile), stripAnsi(buf), { append }); } catch (e) { io.write(`bash: ${outFile}: ${e.code || e.message}\n`); code = 1; } buf = ''; input = ''; }
        else input = buf;
      }
      return code;
    }

    async exec(name, ctx) {
      try {
        if (this.funcs[name]) { let c = 0; for (const l of this.funcs[name]) c = await this.run(l, ctx.term); return c; }
        let fn = CMDS[name];
        // scripts / executables by path
        if (!fn && (name.includes('/'))) { const p = ctx.path(name); if (OS.fs.isFile(p)) return await CMDS.sh(Object.assign({}, ctx, { args: [p, ...ctx.args] })); }
        // GUI app launchers
        if (!fn) { const app = Shell.appAlias(name); if (app) { let a = app; if (ctx.args.includes('--writer')) a = 'writer'; else if (ctx.args.includes('--calc')) a = 'sheets'; else if (ctx.args.includes('--impress')) a = 'slides'; const f = ctx.args.find((x) => !x.startsWith('-')); if (f && a === 'office' && OS.fs.exists(ctx.path(f))) { OS.desktop.openPath(ctx.path(f)); return 0; } OS.wm.open(a, f ? { path: ctx.path(f), url: f } : {}); return 0; } }
        if (!fn) {
          const p = OS.pkg.pkgForCmd(name);
          if (p) ctx.err(`Command '${name}' not found, but can be installed with:\n\nsudo apt install ${p}\n\n`);
          else ctx.err(`${name}: command not found\n`);
          return 127;
        }
        const avail = OS.pkg.cmdAvailable(name);
        if (avail !== true) { ctx.err(`Command '${name}' not found, but can be installed with:\n\nsudo apt install ${avail}\n\n`); return 127; }
        const r = await fn(ctx);
        return typeof r === 'number' ? r : 0;
      } catch (e) {
        ctx.err(`${name}: ${e.message}\n`); return 1;
      }
    }
    static appAlias(n) {
      const map = { libreoffice: 'office', soffice: 'office', lowriter: 'writer', localc: 'sheets', loimpress: 'slides', abiword: 'writer', gnumeric: 'sheets', firefox: 'browser', chromium: 'browser', 'google-chrome': 'browser', nautilus: 'files', thunar: 'files', dolphin: 'files', gedit: 'editor', 'gnome-text-editor': 'editor', kate: 'editor', code: 'editor', 'gnome-calculator': 'calculator', gimp: 'paint', eog: 'viewer', 'gnome-system-monitor': 'monitor', 'gnome-control-center': 'settings', rhythmbox: 'music', 'gnome-software': 'software', 'gnome-terminal': 'terminal', xterm: 'terminal', konsole: 'terminal' };
      if (map[n]) return map[n];
      if (OS.apps[n] && OS.pkg.appAvailable(n) && !CMDS[n]) return n;
      return null;
    }
    static syncEval(inner) {
      // minimal synchronous command substitution for common cases
      const sh = Shell.cur; const t = inner.trim().split(/\s+/);
      try {
        switch (t[0]) {
          case 'date': return new Date().toString();
          case 'pwd': return sh ? sh.cwd : OS.home();
          case 'whoami': return OS.settings.username;
          case 'hostname': return OS.settings.hostname;
          case 'uname': return t[1] === '-r' ? OS.kernel : 'Linux';
          case 'echo': return t.slice(1).join(' ');
          case 'cat': return OS.fs.read(OS.fs.norm(t[1], sh ? sh.cwd : OS.home())).replace(/\n$/, '');
          case 'ls': return OS.fs.ls(OS.fs.norm(t[1] || '.', sh ? sh.cwd : OS.home())).map((x) => x.name).filter((n) => !n.startsWith('.')).join(' ');
          case 'expr': case 'calc': return String(OS.calc(t.slice(1).join('')));
          case 'seq': { const a = +t[1], b = t[2] ? +t[2] : a; const s = t[2] ? a : 1; const out = []; for (let i = s; i <= b; i++) out.push(i); return out.join(' '); }
          default: return '';
        }
      } catch (e) { return ''; }
    }
    commandNames() { return Object.keys(CMDS).filter((c) => OS.pkg.cmdAvailable(c) === true).sort(); }
  }
  OS.Shell = Shell;
  OS.shell = { commandNames: () => Object.keys(CMDS).filter((c) => OS.pkg.cmdAvailable(c) === true).sort(), CMDS, HELP };

  /* ---------- option parsing helper ---------- */
  function opts(args, spec = '') {
    const o = {}, rest = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '--') { rest.push(...args.slice(i + 1)); break; }
      if (a.startsWith('--') && a.length > 2) { const [k, v] = a.slice(2).split('='); o[k] = v ?? true; }
      else if (a.startsWith('-') && a.length > 1 && !/^-\d/.test(a)) {
        for (let j = 1; j < a.length; j++) { const f = a[j]; if (spec.includes(f + ':')) { o[f] = a.slice(j + 1) || args[++i]; break; } o[f] = true; }
      } else rest.push(a);
    }
    return [o, rest];
  }
  const readInput = (ctx, files) => {
    if (!files.length) return ctx.stdin ?? '';
    return files.map((f) => { if (f === '-') return ctx.stdin ?? ''; return OS.fs.read(ctx.path(f)); }).join('');
  };
  const lines = (s) => { const l = s.split('\n'); if (l[l.length - 1] === '') l.pop(); return l; };
  const needRoot = (ctx, what) => { if (!ctx.sudo) { ctx.err(`${what}: Permission denied${ctx.name === 'apt' || ctx.name === 'apt-get' ? '' : ' (are you root?)'}\n`); return false; } return true; };

  /* ================= commands ================= */
  def('help', 'show this help', (ctx) => {
    const groups = {
      'Files': 'ls cd pwd cat less head tail touch mkdir rm rmdir cp mv ln find tree du df stat file wc open xdg-open nano',
      'Text': 'echo printf grep sed sort uniq cut tr rev tac nl base64 md5sum sha256sum diff',
      'System': 'whoami id hostname uname uptime date cal ps top htop kill free neofetch history env export alias unalias which type man clear reset exit shutdown reboot lock',
      'Network': 'ping curl wget ip ifconfig hostname -I nslookup',
      'Packages': 'apt apt-get dpkg snap',
      'Fun': 'cowsay figlet fortune sl cmatrix lolcat toilet asciiquarium guess banner rot13 yes',
      'Dev': 'node python3 git bc calc jq sh bash js',
    };
    ctx.println(`${C.b}Cirrus Linux shell${C.r} — GNU bash compatible, version 5.2\n`);
    for (const g in groups) ctx.println(`${C.bcyan}${g}${C.r}\n  ${groups[g].split(' ').join('  ')}\n`);
    ctx.println(`Pipes ${C.yellow}|${C.r}, redirection ${C.yellow}> >> <${C.r}, chaining ${C.yellow}&& || ;${C.r}, variables ${C.yellow}$VAR${C.r}, globs ${C.yellow}*.txt${C.r} and ${C.yellow}$(cmd)${C.r} are supported.`);
    ctx.println(`GUI apps can be launched by name, e.g. ${C.green}firefox${C.r}, ${C.green}nautilus .${C.r}, ${C.green}gedit notes.md${C.r}. Type ${C.green}man <cmd>${C.r} for details.`);
  });
  def('man', 'show manual for a command', (ctx) => {
    const n = ctx.args[0]; if (!n) { ctx.err('What manual page do you want?\nFor example, try \'man man\'.\n'); return 1; }
    if (!CMDS[n]) { ctx.err(`No manual entry for ${n}\n`); return 16; }
    ctx.println(`${C.b}${n.toUpperCase()}(1)${C.r}                 Cirrus Manual                 ${C.b}${n.toUpperCase()}(1)${C.r}\n\n${C.b}NAME${C.r}\n       ${n} - ${HELP[n] || 'no description'}\n\n${C.b}SYNOPSIS${C.r}\n       ${n} [OPTION]... [ARG]...\n`);
  });
  def('clear reset', 'clear the screen', (ctx) => { ctx.term.clear(); });
  def('echo', 'print text', (ctx) => { const [o, r] = [{}, ctx.args.slice()]; while (r[0] === '-n' || r[0] === '-e') { o[r.shift()] = true; } let s = r.join(' '); if (o['-e']) s = s.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\e|\\033|\\x1b/g, '\x1b'); ctx.out(s + (o['-n'] ? '' : '\n')); });
  def('printf', 'format and print', (ctx) => { let [f, ...a] = ctx.args; f = (f || '').replace(/\\n/g, '\n').replace(/\\t/g, '\t'); let i = 0; ctx.out(f.replace(/%(-?\d*)(\.\d+)?([sdfx%])/g, (m, w, p, t) => { if (t === '%') return '%'; let v = a[i++] ?? ''; if (t === 'd') v = String(parseInt(v) || 0); if (t === 'f') v = (parseFloat(v) || 0).toFixed(p ? +p.slice(1) : 6); if (t === 'x') v = (parseInt(v) || 0).toString(16); const n = parseInt(w) || 0; return n < 0 ? String(v).padEnd(-n) : String(v).padStart(n); })); });
  def('pwd', 'print working directory', (ctx) => ctx.println(ctx.sh.cwd));
  def('cd', 'change directory', (ctx) => {
    let t = ctx.args[0] || OS.home(); if (t === '-') t = ctx.sh.env.OLDPWD || ctx.sh.cwd;
    const p = ctx.path(t); if (!OS.fs.exists(p)) { ctx.err(`bash: cd: ${t}: No such file or directory\n`); return 1; }
    if (!OS.fs.isDir(p)) { ctx.err(`bash: cd: ${t}: Not a directory\n`); return 1; }
    ctx.sh.env.OLDPWD = ctx.sh.cwd; ctx.sh.cwd = p; ctx.sh.env.PWD = p;
  });
  const lsColor = (it, full) => {
    const n = full || it.name;
    if (it.type === 'dir') return C.bblue + n + C.r;
    if (/\.(sh|py)$/.test(it.name) || it.virtual) return C.bgreen + n + C.r;
    if (OS.ftype(it.name) === 'image') return C.mag + n + C.r;
    if (OS.ftype(it.name) === 'archive') return '\x1b[1;31m' + n + C.r;
    return n;
  };
  const perm = (it) => (it.type === 'dir' ? 'drwxr-xr-x' : it.virtual || /\.(sh|py)$/.test(it.name) ? '-rwxr-xr-x' : '-rw-r--r--');
  def('ls dir', 'list directory contents', (ctx) => {
    const [o, r] = opts(ctx.args); const targets = r.length ? r : ['.']; let code = 0;
    const all = o.a || o.A, long = o.l, human = o.h, one = o['1'];
    const fileT = targets.filter((t) => OS.fs.exists(ctx.path(t)) && !OS.fs.isDir(ctx.path(t)));
    const dirT = targets.filter((t) => !fileT.includes(t));
    if (fileT.length && !o.d) { const its = fileT.map((t) => Object.assign(OS.fs.stat(ctx.path(t)), { name: t })); if (long) its.forEach((it) => { const d = new Date(it.mtime); ctx.println(`${perm(it)} 1 ${OS.settings.username} ${OS.settings.username} ${String(it.size).padStart(6)} ${d.toLocaleString('en', { month: 'short' })} ${String(d.getDate()).padStart(2)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ctx.isTTY ? lsColor(it) : it.name}`); }); else ctx.println(its.map((it) => (ctx.isTTY ? lsColor(it) : it.name)).join(ctx.isTTY ? '  ' : '\n')); if (dirT.length) ctx.println(''); }
    (o.d ? targets : dirT).forEach((t, ti) => {
      const p = ctx.path(t);
      if (!OS.fs.exists(p)) { ctx.err(`ls: cannot access '${t}': No such file or directory\n`); code = 2; return; }
      let items = OS.fs.isDir(p) && !o.d ? OS.fs.ls(p) : [Object.assign(OS.fs.stat(p), { name: t })];
      if (!all) items = items.filter((x) => !x.name.startsWith('.'));
      if (o.a && OS.fs.isDir(p)) items = [{ name: '.', type: 'dir', size: 0, mtime: Date.now() }, { name: '..', type: 'dir', size: 0, mtime: Date.now() }, ...items];
      if (o.t) items.sort((a, b) => b.mtime - a.mtime); if (o.S) items.sort((a, b) => b.size - a.size); if (o.r) items.reverse();
      if (targets.length > 1 && !o.d) ctx.println((ti ? '\n' : '') + t + ':');
      if (long) {
        if (OS.fs.isDir(p)) ctx.println('total ' + items.length * 4);
        items.forEach((it) => { const sz = it.type === 'dir' ? 4096 : it.size; const d = new Date(it.mtime); ctx.println(`${perm(it)} 1 ${OS.settings.username} ${OS.settings.username} ${(human ? OS.fmtSize(sz) : String(sz)).padStart(human ? 7 : 6)} ${d.toLocaleString('en', { month: 'short' })} ${String(d.getDate()).padStart(2)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ctx.isTTY ? lsColor(it) : it.name}${it.type === 'dir' && o.F ? '/' : ''}`); });
      } else if (one || !ctx.isTTY) items.forEach((it) => ctx.println(ctx.isTTY ? lsColor(it) : it.name));
      else if (items.length) {
        const cols = ctx.term.cols ? ctx.term.cols() : 80; const w = Math.max(...items.map((x) => x.name.length)) + 2; const per = Math.max(1, Math.floor(cols / w)); const rows = Math.ceil(items.length / per);
        for (let rr = 0; rr < rows; rr++) { let line = ''; for (let cc = 0; cc < per; cc++) { const it = items[cc * rows + rr]; if (it) line += lsColor(it) + ' '.repeat(Math.max(1, w - it.name.length)); } ctx.println(line.trimEnd()); }
      }
    });
    return code;
  });
  def('cat', 'print files', (ctx) => { const [o, r] = opts(ctx.args); let s = readInput(ctx, r); if (o.n) s = lines(s).map((l, i) => String(i + 1).padStart(6) + '  ' + l).join('\n') + '\n'; if (OS.isDataUrl(s)) s = `[binary data, ${OS.fmtSize(s.length)}]\n`; ctx.out(s); });
  def('tac', 'concatenate and print in reverse', (ctx) => ctx.out(lines(readInput(ctx, ctx.args)).reverse().join('\n') + '\n'));
  def('head', 'first lines', (ctx) => { const [o, r] = opts(ctx.args.map((a) => (/^-\d+$/.test(a) ? '-n' + a.slice(1) : a)), 'n:c:'); const n = +(o.n || 10); ctx.out(lines(readInput(ctx, r)).slice(0, n).map((l) => l + '\n').join('')); });
  def('tail', 'last lines', (ctx) => { const [o, r] = opts(ctx.args.map((a) => (/^-\d+$/.test(a) ? '-n' + a.slice(1) : a)), 'n:'); const n = +(o.n || 10); ctx.out(lines(readInput(ctx, r)).slice(-n).map((l) => l + '\n').join('')); });
  def('touch', 'create empty file / update time', (ctx) => { if (!ctx.args.length) { ctx.err('touch: missing file operand\n'); return 1; } ctx.args.forEach((f) => OS.fs.touch(ctx.path(f))); });
  def('mkdir', 'make directories', (ctx) => { const [o, r] = opts(ctx.args); if (!r.length) { ctx.err('mkdir: missing operand\n'); return 1; } let c = 0; r.forEach((d) => { try { OS.fs.mkdir(ctx.path(d), { p: o.p }); if (o.v) ctx.println(`mkdir: created directory '${d}'`); } catch (e) { ctx.err(`mkdir: cannot create directory '${d}': ${e.code}\n`); c = 1; } }); return c; });
  def('rmdir', 'remove empty directories', (ctx) => { let c = 0; ctx.args.forEach((d) => { const p = ctx.path(d); if (!OS.fs.isDir(p)) { ctx.err(`rmdir: failed to remove '${d}': Not a directory\n`); c = 1; } else if (OS.fs.ls(p).length) { ctx.err(`rmdir: failed to remove '${d}': Directory not empty\n`); c = 1; } else OS.fs.rm(p); }); return c; });
  def('rm', 'remove files', (ctx) => {
    const [o, r] = opts(ctx.args); if (!r.length) { ctx.err('rm: missing operand\n'); return 1; } let c = 0;
    for (const f of r) { const p = ctx.path(f); if (p === '/' ) { ctx.err("rm: it is dangerous to operate recursively on '/'\nrm: use --no-preserve-root to override this failsafe\n"); return 1; }
      if (!OS.fs.exists(p)) { if (!o.f) { ctx.err(`rm: cannot remove '${f}': No such file or directory\n`); c = 1; } continue; }
      if (OS.fs.isDir(p) && !(o.r || o.R)) { ctx.err(`rm: cannot remove '${f}': Is a directory\n`); c = 1; continue; }
      OS.fs.rm(p, { r: true }); if (o.v) ctx.println(`removed '${f}'`); }
    return c;
  });
  def('cp', 'copy files', (ctx) => { const [o, r] = opts(ctx.args); if (r.length < 2) { ctx.err('cp: missing destination file operand\n'); return 1; } const dst = ctx.path(r.pop()); if (r.length > 1 && !OS.fs.isDir(dst)) { ctx.err(`cp: target '${dst}' is not a directory\n`); return 1; } let c = 0; r.forEach((s) => { try { OS.fs.cp(ctx.path(s), dst, { r: o.r || o.R || o.a }); } catch (e) { ctx.err(`cp: ${e.message.includes('Is a directory') ? `-r not specified; omitting directory '${s}'` : e.message}\n`); c = 1; } }); return c; });
  def('mv', 'move/rename files', (ctx) => { const [, r] = opts(ctx.args); if (r.length < 2) { ctx.err('mv: missing destination file operand\n'); return 1; } const dst = ctx.path(r.pop()); let c = 0; r.forEach((s) => { try { OS.fs.mv(ctx.path(s), dst); } catch (e) { ctx.err(`mv: cannot move '${s}': ${e.code || e.message}\n`); c = 1; } }); return c; });
  def('ln', 'make links (copies in cirrusfs)', (ctx) => { const [, r] = opts(ctx.args); if (r.length < 2) { ctx.err('ln: missing operand\n'); return 1; } OS.fs.cp(ctx.path(r[0]), ctx.path(r[1]), { r: true }); });
  def('stat', 'file status', (ctx) => { ctx.args.forEach((f) => { const s = OS.fs.stat(ctx.path(f)); ctx.println(`  File: ${f}\n  Size: ${s.bytes}\t\tBlocks: ${Math.ceil(s.bytes / 512)}\t${s.type === 'dir' ? 'directory' : 'regular file'}\nAccess: (${s.type === 'dir' ? '0755/drwxr-xr-x' : '0644/-rw-r--r--'})  Uid: ( 1000/ ${OS.settings.username})\nModify: ${new Date(s.mtime).toISOString()}`); }); });
  def('file', 'determine file type', (ctx) => { ctx.args.forEach((f) => { const p = ctx.path(f); if (OS.fs.isDir(p)) return ctx.println(`${f}: directory`); const c = OS.fs.read(p); const t = OS.ftype(f); const m = OS.isDataUrl(c) ? /^data:([^;,]+)/.exec(c)[1] : null; ctx.println(`${f}: ${m ? m + ' data' : t === 'image' ? 'SVG Scalable Vector Graphics image' : c.startsWith('#!') ? 'POSIX shell script, ASCII text executable' : t === 'html' ? 'HTML document, ASCII text' : !c.length ? 'empty' : 'ASCII text'}`); }); });
  def('wc', 'count lines, words, bytes', (ctx) => { const [o, r] = opts(ctx.args); const files = r.length ? r : [null]; files.forEach((f) => { const s = f ? OS.fs.read(ctx.path(f)) : ctx.stdin || ''; const l = (s.match(/\n/g) || []).length, w = s.split(/\s+/).filter(Boolean).length, c = s.length; const parts = o.l ? [l] : o.w ? [w] : o.c ? [c] : [l, w, c]; ctx.println(!f && parts.length === 1 ? String(parts[0]) : parts.map((x) => String(x).padStart(7)).join(' ') + (f ? ' ' + f : '')); }); });
  def('grep egrep', 'search text', (ctx) => {
    const [o, r] = opts(ctx.args, 'e:m:'); const pat = o.e || r.shift(); if (pat == null) { ctx.err('Usage: grep [OPTION]... PATTERNS [FILE]...\n'); return 2; }
    let re; try { re = new RegExp(pat, o.i ? 'i' : ''); } catch (e) { re = new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), o.i ? 'i' : ''); }
    let files = r; if (o.r || o.R) { files = []; (r.length ? r : ['.']).forEach((d) => OS.fs.find(ctx.path(d), (n, nd) => nd.t === 'f').forEach((p) => files.push(OS.fs.pretty(p)))); }
    let found = 0;
    const src = files.length ? files.map((f) => { try { return [f, OS.fs.read(ctx.path(f))]; } catch (e) { ctx.err(`grep: ${f}: No such file or directory\n`); return [f, '']; } }) : [[null, ctx.stdin || '']];
    for (const [f, txt] of src) {
      if (OS.isDataUrl(txt)) continue; let cnt = 0;
      lines(txt).forEach((l, i) => {
        const hit = re.test(l) !== !!o.v; if (!hit) return; found++; cnt++;
        if (o.c || o.l || o.q) return;
        const hl = ctx.isTTY && !o.v ? l.replace(new RegExp(re.source, 'g' + (o.i ? 'i' : '')), (m) => C.red + C.b + m + C.r) : l;
        ctx.println((src.length > 1 || o.r ? (ctx.isTTY ? C.mag + f + C.r + C.cyan + ':' + C.r : f + ':') : '') + (o.n ? (ctx.isTTY ? C.green + (i + 1) + C.r + ':' : i + 1 + ':') : '') + hl);
      });
      if (o.c) ctx.println((src.length > 1 ? f + ':' : '') + cnt); if (o.l && cnt) ctx.println(f);
    }
    return found ? 0 : 1;
  });
  def('sed', 'stream editor (s/// only)', (ctx) => {
    const [o, r] = opts(ctx.args, 'e:'); const expr = o.e || r.shift(); const m = /^s(.)(.*?)\1(.*?)\1([gi]*)$/.exec(expr || '');
    if (!m) { ctx.err('sed: only s/pattern/replacement/flags is supported\n'); return 1; }
    const re = new RegExp(m[2], m[4].includes('g') ? (m[4].includes('i') ? 'gi' : 'g') : m[4].includes('i') ? 'i' : '');
    const rep = m[3].replace(/\\(\d)/g, '$$$1').replace(/&/g, '$$&');
    if (o.i && r.length) { r.forEach((f) => { const p = ctx.path(f); OS.fs.write(p, lines(OS.fs.read(p)).map((l) => l.replace(re, rep)).join('\n') + '\n'); }); return; }
    ctx.out(lines(readInput(ctx, r)).map((l) => l.replace(re, rep) + '\n').join(''));
  });
  def('sort', 'sort lines', (ctx) => { const [o, r] = opts(ctx.args); let l = lines(readInput(ctx, r)); l.sort(o.n ? (a, b) => parseFloat(a) - parseFloat(b) : (a, b) => (o.f ? a.toLowerCase().localeCompare(b.toLowerCase()) : a < b ? -1 : a > b ? 1 : 0)); if (o.r) l.reverse(); if (o.u) l = [...new Set(l)]; ctx.out(l.map((x) => x + '\n').join('')); });
  def('uniq', 'remove duplicate adjacent lines', (ctx) => { const [o, r] = opts(ctx.args); const l = lines(readInput(ctx, r)); const out = []; l.forEach((x) => { if (out.length && out[out.length - 1][0] === x) out[out.length - 1][1]++; else out.push([x, 1]); }); ctx.out(out.filter(([, n]) => (o.d ? n > 1 : true)).map(([x, n]) => (o.c ? String(n).padStart(7) + ' ' : '') + x + '\n').join('')); });
  def('cut', 'cut fields', (ctx) => { const [o, r] = opts(ctx.args, 'd:f:c:'); const d = o.d || '\t'; const sel = (spec, n) => { const s = new Set(); spec.split(',').forEach((p) => { const [a, b] = p.split('-'); const lo = a ? +a : 1, hi = p.includes('-') ? (b ? +b : n) : lo; for (let i = lo; i <= hi; i++) s.add(i); }); return [...s].sort((x, y) => x - y); }; ctx.out(lines(readInput(ctx, r)).map((l) => { if (o.c) { return sel(o.c, l.length).map((i) => l[i - 1] || '').join(''); } const f = l.split(d); return sel(o.f || '1', f.length).map((i) => f[i - 1]).filter((x) => x !== undefined).join(d); }).join('\n') + '\n'); });
  def('tr', 'translate characters', (ctx) => { const [o, r] = opts(ctx.args); const exp = (s) => s.replace(/(\w)-(\w)/g, (m, a, b) => { let x = ''; for (let c = a.charCodeAt(0); c <= b.charCodeAt(0); c++) x += String.fromCharCode(c); return x; }).replace(/\[:upper:\]/g, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ').replace(/\[:lower:\]/g, 'abcdefghijklmnopqrstuvwxyz').replace(/\\n/g, '\n'); const a = exp(r[0] || ''), b = exp(r[1] || ''); let s = ctx.stdin || ''; if (o.d) s = [...s].filter((c) => !a.includes(c)).join(''); else s = [...s].map((c) => { const i = a.indexOf(c); return i < 0 ? c : b[Math.min(i, b.length - 1)] ?? ''; }).join(''); ctx.out(s); });
  def('rev', 'reverse lines', (ctx) => ctx.out(lines(readInput(ctx, ctx.args)).map((l) => [...l].reverse().join('') + '\n').join('')));
  def('nl', 'number lines', (ctx) => ctx.out(lines(readInput(ctx, ctx.args)).map((l, i) => String(i + 1).padStart(6) + '\t' + l + '\n').join('')));
  def('base64', 'base64 encode/decode', (ctx) => { const [o, r] = opts(ctx.args); const s = readInput(ctx, r); try { ctx.out(o.d ? decodeURIComponent(escape(atob(s.trim()))) : btoa(unescape(encodeURIComponent(s))) + '\n'); } catch (e) { ctx.err('base64: invalid input\n'); return 1; } });
  const hashHex = async (algo, s) => { const b = await crypto.subtle.digest(algo, new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); };
  def('sha256sum', 'SHA256 checksum', async (ctx) => { const files = ctx.args.length ? ctx.args : ['-']; for (const f of files) ctx.println((await hashHex('SHA-256', f === '-' ? ctx.stdin || '' : OS.fs.read(ctx.path(f)))) + '  ' + f); });
  def('sha1sum md5sum', 'SHA1 checksum', async (ctx) => { const files = ctx.args.length ? ctx.args : ['-']; for (const f of files) { const h = await hashHex('SHA-1', f === '-' ? ctx.stdin || '' : OS.fs.read(ctx.path(f))); ctx.println((ctx.name === 'md5sum' ? h.slice(0, 32) : h) + '  ' + f); } });
  def('diff', 'compare files line by line', (ctx) => { const [a, b] = ctx.args.map((f) => lines(OS.fs.read(ctx.path(f)))); let d = 0; const n = Math.max(a.length, b.length); for (let i = 0; i < n; i++) { if (a[i] !== b[i]) { d = 1; ctx.println(`${i + 1}c${i + 1}`); if (a[i] !== undefined) ctx.println(C.red + '< ' + a[i] + C.r); ctx.println('---'); if (b[i] !== undefined) ctx.println(C.green + '> ' + b[i] + C.r); } } return d; });
  def('find', 'search for files', (ctx) => {
    const a = ctx.args.slice(); const start = a[0] && !a[0].startsWith('-') ? a.shift() : '.'; let name = null, type = null, iname = false;
    for (let i = 0; i < a.length; i++) { if (a[i] === '-name' || a[i] === '-iname') { iname = a[i] === '-iname'; name = a[++i]; } else if (a[i] === '-type') type = a[++i]; }
    const re = name ? new RegExp('^' + name.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', iname ? 'i' : '') : null;
    const base = ctx.path(start);
    if (!OS.fs.exists(base)) { ctx.err(`find: '${start}': No such file or directory\n`); return 1; }
    OS.fs.find(base, (n, nd) => (!re || re.test(n)) && (!type || (type === 'd' ? nd.t === 'd' : nd.t === 'f')), 5000).forEach((p) => ctx.println(start === '.' ? '.' + p.slice(base.length) : p === base ? start : start.replace(/\/$/, '') + p.slice(base.length)));
  });
  def('tree', 'list directory tree', (ctx) => {
    const [o, r] = opts(ctx.args, 'L:'); const root = ctx.path(r[0] || '.'); let dirs = 0, files = 0; const max = o.L ? +o.L : 20;
    ctx.println(ctx.isTTY ? C.bblue + (r[0] || '.') + C.r : r[0] || '.');
    const walk = (p, pre, depth) => { if (depth > max) return; const items = OS.fs.ls(p).filter((x) => o.a || !x.name.startsWith('.')); items.forEach((it, i) => { const last = i === items.length - 1; ctx.println(pre + (last ? '└── ' : '├── ') + (ctx.isTTY ? lsColor(it) : it.name)); if (it.type === 'dir') { dirs++; if (!it.virtual) walk(it.path, pre + (last ? '    ' : '│   '), depth + 1); } else files++; }); };
    walk(root, '', 1); ctx.println(`\n${dirs} directories, ${files} files`);
  });
  def('du', 'disk usage', (ctx) => { const [o, r] = opts(ctx.args); (r.length ? r : ['.']).forEach((f) => { const p = ctx.path(f); const n = OS.fs.node(p); const s = OS.fs.sizeOf(n); if (!o.s && n && n.t === 'd') Object.keys(n.c).forEach((k) => { const c = n.c[k]; if (c.t === 'd') ctx.println((o.h ? OS.fmtSize(OS.fs.sizeOf(c)) : Math.ceil(OS.fs.sizeOf(c) / 1024)) + '\t' + f.replace(/\/$/, '') + '/' + k); }); ctx.println((o.h ? OS.fmtSize(s) : Math.ceil(s / 1024)) + '\t' + f); }); });
  def('df', 'disk free', (ctx) => { const used = OS.store.size(), total = 10 * 1024 * 1024; const h = (b) => (ctx.args.includes('-h') ? OS.fmtSize(b) : String(Math.ceil(b / 1024))); ctx.println('Filesystem      Size  Used Avail Use% Mounted on'); ctx.println(`cirrusfs     ${h(total).padStart(7)} ${h(used).padStart(5)} ${h(total - used).padStart(5)} ${String(Math.ceil(used / total * 100)).padStart(3)}% /`); ctx.println(`tmpfs        ${h(2147483648).padStart(7)} ${h(0).padStart(5)} ${h(2147483648).padStart(5)}   0% /dev/shm`); });
  def('whoami', 'print user name', (ctx) => ctx.println(ctx.sudo ? 'root' : OS.settings.username));
  def('id', 'print user identity', (ctx) => ctx.println(ctx.sudo ? 'uid=0(root) gid=0(root) groups=0(root)' : `uid=1000(${OS.settings.username}) gid=1000(${OS.settings.username}) groups=1000(${OS.settings.username}),4(adm),27(sudo)`));
  def('groups', 'print groups', (ctx) => ctx.println(`${OS.settings.username} adm sudo`));
  def('hostname', 'show hostname', (ctx) => { if (ctx.args[0] === '-I') return ctx.println('10.0.2.15'); if (ctx.args[0]) { if (!needRoot(ctx, 'hostname')) return 1; OS.set('hostname', ctx.args[0]); OS.fs.write('/etc/hostname', ctx.args[0] + '\n'); return; } ctx.println(OS.settings.hostname); });
  def('uname', 'system information', (ctx) => { const a = ctx.args.join(''); ctx.println(a.includes('a') ? `Linux ${OS.settings.hostname} ${OS.kernel} #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux` : a.includes('r') ? OS.kernel : a.includes('m') ? 'x86_64' : a.includes('n') ? OS.settings.hostname : 'Linux'); });
  const uptimeStr = () => { const s = (Date.now() - OS.bootTime) / 1000; const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h}:${String(m).padStart(2, '0')}` : `${m} min`; };
  def('uptime', 'how long the system has been running', (ctx) => ctx.println(ctx.args[0] === '-p' ? 'up ' + uptimeStr() : ` ${OS.fmtTime(new Date(), true)} up ${uptimeStr()},  1 user,  load average: ${OS.fs.read('/proc/loadavg').split(' ').slice(0, 3).join(', ')}`));
  def('date', 'print date', (ctx) => { const d = new Date(); const f = ctx.args.find((x) => x.startsWith('+')); if (f) { const map = { Y: d.getFullYear(), m: String(d.getMonth() + 1).padStart(2, '0'), d: String(d.getDate()).padStart(2, '0'), H: String(d.getHours()).padStart(2, '0'), M: String(d.getMinutes()).padStart(2, '0'), S: String(d.getSeconds()).padStart(2, '0'), A: d.toLocaleDateString('en', { weekday: 'long' }), B: d.toLocaleDateString('en', { month: 'long' }), s: Math.floor(d / 1000), j: Math.ceil((d - new Date(d.getFullYear(), 0, 1)) / 864e5) }; return ctx.println(f.slice(1).replace(/%([a-zA-Z])/g, (m, k) => map[k] ?? m)); } ctx.println(d.toString().replace(/\(.*\)/, '').trim()); });
  def('cal ncal', 'calendar', (ctx) => {
    const d = new Date(); const y = +(ctx.args[1] || d.getFullYear()), mo = ctx.args[0] ? +ctx.args[0] - 1 : d.getMonth();
    const title = new Date(y, mo).toLocaleDateString('en', { month: 'long', year: 'numeric' }); ctx.println(title.padStart(10 + title.length / 2)); ctx.println('Su Mo Tu We Th Fr Sa');
    const first = new Date(y, mo, 1).getDay(), n = new Date(y, mo + 1, 0).getDate(); let line = '   '.repeat(first);
    for (let i = 1; i <= n; i++) { const today = i === d.getDate() && mo === d.getMonth() && y === d.getFullYear(); line += (today && ctx.isTTY ? '\x1b[7m' + String(i).padStart(2) + C.r : String(i).padStart(2)) + ' '; if ((first + i) % 7 === 0) { ctx.println(line.trimEnd()); line = ''; } }
    if (line) ctx.println(line.trimEnd());
  });
  const SYSPROCS = [
    [1, 'root', 'systemd', 167, 12.4, 9.1, 'S'], [2, 'root', 'kthreadd', 0, 0, 0, 'S'], [14, 'root', 'rcu_preempt', 0, 0, 0, 'I'], [118, 'root', 'kworker/u8:2-events', 0, 0, 0, 'I'],
    [284, 'root', 'systemd-journald', 50, 22.1, 20.8, 'S'], [311, 'root', 'systemd-udevd', 26, 7.2, 4.4, 'S'], [498, 'systemd+', 'systemd-resolved', 21, 13.6, 11.2, 'S'],
    [512, 'root', 'NetworkManager', 318, 19.8, 15.9, 'S'], [520, 'message+', 'dbus-daemon', 10, 6.1, 3.9, 'S'], [533, 'root', 'polkitd', 391, 11.5, 7.9, 'S'], [541, 'root', 'systemd-logind', 17, 7.9, 6.6, 'S'],
    [560, 'root', 'cron', 7, 2.8, 2.5, 'S'], [612, 'root', 'cupsd', 37, 12.3, 9.8, 'S'], [640, '%u', 'pipewire', 110, 14.6, 8.1, 'S'], [646, '%u', 'wireplumber', 340, 24.2, 16.8, 'S'],
    [702, '%u', 'cirrus-shell', 4210, 312.5, 118.3, 'S'], [733, '%u', 'cirrus-compositor', 1980, 188.1, 92.4, 'S'], [760, '%u', 'Xwayland', 512, 64.2, 41.7, 'S'], [801, '%u', 'gnome-keyring-d', 389, 9.4, 7.1, 'S'],
  ];
  const pstate = {};
  const procs = () => {
    const u = OS.settings.username, now = Date.now();
    const list = SYSPROCS.map(([pid, user, cmd, virt, res, shr, s]) => ({ pid, user: user === '%u' ? u : user, cmd, virt, res, shr, s, base: cmd.startsWith('cirrus') ? 1.6 : cmd === 'Xwayland' ? 0.6 : res > 15 ? 0.15 : 0, start: OS.bootTime }));
    OS.wm.wins.forEach((w) => list.push({ pid: w.pid, user: u, cmd: w.app, virt: 900 + (w.pid % 700), res: 60 + (w.pid % 180), shr: 30 + (w.pid % 50), s: 'S', base: 0.8, win: w, start: w.started }));
    list.push({ pid: 4242, user: u, cmd: 'bash', virt: 11, res: 5.4, shr: 3.6, s: 'S', base: 0, start: OS.bootTime + 2000 });
    const memTot = (navigator.deviceMemory || 8) * 1024;
    list.forEach((p) => {
      const st = pstate[p.pid] || (pstate[p.pid] = { cpu: p.base, t: 0, last: now });
      if (now - st.last > 900) { st.cpu = Math.max(0, st.cpu * 0.6 + p.base * 0.4 + (p.base ? (Math.random() - 0.4) * p.base * 1.5 : Math.random() < 0.05 ? Math.random() * 0.7 : 0)); st.t += st.cpu * (now - st.last) / 100000; st.last = now; }
      p.cpu = st.cpu; p.mem = p.res / memTot * 100; p.time = st.t + (now - p.start) / 1000 * p.base / 100;
    });
    return list;
  };
  OS.procs = procs;
  def('ps', 'list processes', (ctx) => { const full = ctx.args.some((a) => /a|e|u|x/.test(a)); ctx.println(full ? 'USER         PID %CPU %MEM COMMAND' : '    PID TTY          TIME CMD'); procs().filter((p) => full || p.user === OS.settings.username).forEach((p) => ctx.println(full ? `${p.user.padEnd(10)} ${String(p.pid).padStart(5)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${p.cmd}` : `${String(p.pid).padStart(7)} pts/0    00:00:00 ${p.cmd}`)); });
  def('kill killall pkill', 'terminate processes', (ctx) => { const t = ctx.args.filter((a) => !a.startsWith('-')); let c = 0; t.forEach((x) => { const p = procs().find((p) => String(p.pid) === x || p.cmd === x); if (p && p.win) OS.wm.close(p.win); else if (p) { ctx.err(`kill: (${p.pid}) - Operation not permitted\n`); c = 1; } else { ctx.err(`kill: (${x}) - No such process\n`); c = 1; } }); return c; });
  def('free', 'memory usage', (ctx) => { const tot = (navigator.deviceMemory || 8) * 1024 * 1024; const used = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024) + 900000 : 1500000; const f = (k) => (ctx.args.includes('-h') ? OS.fmtSize(k * 1024) : String(k)); ctx.println('               total        used        free      shared  buff/cache   available'); ctx.println(`Mem:    ${f(tot).padStart(12)} ${f(used).padStart(11)} ${f(tot - used - 1100000).padStart(11)} ${f(48000).padStart(11)} ${f(1100000).padStart(11)} ${f(tot - used).padStart(11)}`); ctx.println(`Swap:   ${f(2097148).padStart(12)} ${f(0).padStart(11)} ${f(2097148).padStart(11)}`); });
  def('history', 'command history', (ctx) => { if (ctx.args[0] === '-c') { ctx.sh.history = []; OS.store.set('bash_history', []); return; } ctx.sh.history.forEach((h, i) => ctx.println(String(i + 1).padStart(5) + '  ' + h)); });
  def('env printenv', 'print environment', (ctx) => { Object.entries(ctx.sh.env).filter(([k]) => k !== '?').forEach(([k, v]) => ctx.println(`${k}=${v}`)); });
  def('export', 'set environment variable', (ctx) => { ctx.args.forEach((a) => { const i = a.indexOf('='); if (i > 0) ctx.sh.env[a.slice(0, i)] = a.slice(i + 1); }); });
  def('unset', 'unset variable', (ctx) => ctx.args.forEach((a) => delete ctx.sh.env[a]));
  def('alias', 'define alias', (ctx) => { if (!ctx.args.length) return Object.entries(ctx.sh.aliases).forEach(([k, v]) => ctx.println(`alias ${k}='${v}'`)); ctx.args.forEach((a) => { const i = a.indexOf('='); if (i > 0) ctx.sh.aliases[a.slice(0, i)] = a.slice(i + 1); else if (ctx.sh.aliases[a]) ctx.println(`alias ${a}='${ctx.sh.aliases[a]}'`); }); });
  def('unalias', 'remove alias', (ctx) => ctx.args.forEach((a) => delete ctx.sh.aliases[a]));
  def('which type command', 'locate a command', (ctx) => { let c = 0; ctx.args.forEach((a) => { if (ctx.sh.aliases[a] && ctx.name === 'type') ctx.println(`${a} is aliased to \`${ctx.sh.aliases[a]}'`); else if (CMDS[a] && OS.pkg.cmdAvailable(a) === true) ctx.println(ctx.name === 'type' ? `${a} is /usr/bin/${a}` : `/usr/bin/${a}`); else if (Shell.appAlias(a)) ctx.println(`/usr/bin/${a}`); else { c = 1; if (ctx.name === 'type') ctx.err(`bash: type: ${a}: not found\n`); } }); return c; });
  def('true', '', () => 0); def('false', '', () => 1); def(':', '', () => 0);
  def('exit logout', 'close the terminal', (ctx) => { ctx.term.exit && ctx.term.exit(); });
  def('sleep', 'delay', async (ctx) => { const ms = parseFloat(ctx.args[0] || '1') * 1000; const end = Date.now() + ms; while (Date.now() < end) { if (ctx.signal?.aborted) return 130; await OS.sleep(Math.min(100, end - Date.now())); } });
  def('seq', 'print sequence', (ctx) => { const n = ctx.args.map(Number); let [a, s, b] = n.length === 1 ? [1, 1, n[0]] : n.length === 2 ? [n[0], 1, n[1]] : n; let out = ''; for (let i = a, k = 0; s > 0 ? i <= b : i >= b; i += s, k++) { out += i + '\n'; if (k > 100000) break; } ctx.out(out); });
  def('yes', 'repeat a string', async (ctx) => { const s = (ctx.args.join(' ') || 'y') + '\n'; if (!ctx.isTTY) return ctx.out(s.repeat(1000)); for (let i = 0; i < 2000 && !ctx.signal?.aborted; i++) { ctx.out(s.repeat(20)); await OS.sleep(16); } });
  def('expr calc', 'evaluate expression', (ctx) => { try { const v = OS.calc(ctx.args.join(' ')); ctx.println(Number.isInteger(v) ? v : +v.toPrecision(12)); } catch (e) { ctx.err('expr: ' + e.message + '\n'); return 2; } });
  def('bc', 'calculator', async (ctx) => {
    const run = (l) => { try { const v = OS.calc(l.replace(/\bsqrt\b/g, 'sqrt')); return String(Number.isInteger(v) ? v : +v.toPrecision(15)); } catch (e) { return '(standard_in) 1: ' + e.message; } };
    if (ctx.stdin != null) { lines(ctx.stdin).forEach((l) => l.trim() && ctx.println(run(l))); return; }
    ctx.println('bc 1.07.1\nCopyright 1991-2017 Free Software Foundation, Inc.\nType quit to exit.');
    for (;;) { const l = await ctx.readLine(''); if (l == null || l.trim() === 'quit') break; if (l.trim()) ctx.println(run(l)); }
  });
  def('read', 'read a line into a variable', async (ctx) => { const [o, r] = opts(ctx.args, 'p:'); const v = await ctx.readLine(o.p || '', o.s); ctx.sh.env[r[0] || 'REPLY'] = v ?? ''; });
  def('test [', 'evaluate condition', (ctx) => { const a = ctx.args.filter((x) => x !== ']'); if (a[0] === '-f') return OS.fs.isFile(ctx.path(a[1])) ? 0 : 1; if (a[0] === '-d') return OS.fs.isDir(ctx.path(a[1])) ? 0 : 1; if (a[0] === '-e') return OS.fs.exists(ctx.path(a[1])) ? 0 : 1; if (a[0] === '-z') return !a[1] ? 0 : 1; if (a[0] === '-n') return a[1] ? 0 : 1; const [x, op, y] = a; const m = { '=': x === y, '==': x === y, '!=': x !== y, '-eq': +x === +y, '-ne': +x !== +y, '-lt': +x < +y, '-le': +x <= +y, '-gt': +x > +y, '-ge': +x >= +y }; return m[op] ? 0 : 1; });
  def('sh bash source .', 'run a shell script', async (ctx) => {
    if (!ctx.args.length) { ctx.println('Already running bash. Pass a script file to execute it.'); return; }
    const p = ctx.path(ctx.args[0]); if (!OS.fs.isFile(p)) { ctx.err(`bash: ${ctx.args[0]}: No such file or directory\n`); return 127; }
    const src = OS.fs.read(p); const saved = { ...ctx.sh.env }; ctx.args.forEach((a, i) => (ctx.sh.env[String(i)] = a));
    const ls = src.split('\n'); let code = 0;
    // support simple for-loops and if blocks on one level
    for (let i = 0; i < ls.length; i++) {
      if (ctx.signal?.aborted) return 130;
      let l = ls[i].trim(); if (!l || l.startsWith('#')) continue;
      const fm = /^for\s+(\w+)\s+in\s+(.+?)(;\s*do)?$/.exec(l);
      if (fm) { const body = []; let j = i + 1; if (!fm[3]) j++; for (; j < ls.length && ls[j].trim() !== 'done'; j++) body.push(ls[j]); i = j; const items = tokenize(fm[2], ctx.sh.env).filter((t) => !t.op).flatMap((t) => glob(t.v, ctx.sh.cwd)); for (const it of items) { ctx.sh.env[fm[1]] = it; for (const b of body) code = await ctx.sh.run(b.trim(), ctx.term); } continue; }
      const im = /^if\s+(.+?);\s*then$/.exec(l);
      if (im) { const thenB = [], elseB = []; let cur = thenB, j = i + 1; for (; j < ls.length && ls[j].trim() !== 'fi'; j++) { if (ls[j].trim() === 'else') cur = elseB; else cur.push(ls[j]); } i = j; const c = await ctx.sh.run(im[1].replace(/^\[\s*(.*?)\s*\]$/, 'test $1'), ctx.term); for (const b of c === 0 ? thenB : elseB) code = await ctx.sh.run(b.trim(), ctx.term); continue; }
      const fn = /^(\w+)\s*\(\)\s*\{$/.exec(l);
      if (fn) { const body = []; let j = i + 1; for (; j < ls.length && ls[j].trim() !== '}'; j++) body.push(ls[j].trim()); i = j; ctx.sh.funcs[fn[1]] = body; continue; }
      code = await ctx.sh.run(l, ctx.term);
    }
    if (ctx.name !== 'source' && ctx.name !== '.') { Object.keys(ctx.sh.env).forEach((k) => { if (/^\d+$/.test(k)) delete ctx.sh.env[k]; }); Object.assign(ctx.sh.env, saved, { '?': code }); }
    return code;
  });
  def('chmod chown chgrp', 'change permissions (no-op on cirrusfs)', (ctx) => { if (ctx.args.length < 2) { ctx.err(`${ctx.name}: missing operand\n`); return 1; } ctx.args.slice(1).forEach((f) => { if (!OS.fs.exists(ctx.path(f))) ctx.err(`${ctx.name}: cannot access '${f}': No such file or directory\n`); }); });
  def('sudo', 'run as root', async (ctx) => {
    if (!ctx.args.length) { ctx.err('usage: sudo command\n'); return 1; }
    if (ctx.args[0] === '-i' || ctx.args[0] === 'su') { ctx.println('root shell is disabled on Cirrus. Use sudo <command>.'); return 1; }
    if (OS.settings.password && !(ctx.sh.sudoUntil > Date.now())) {
      for (let k = 0; k < 3; k++) { const pw = await ctx.readLine(`[sudo] password for ${OS.settings.username}: `, true); if (pw === OS.settings.password) { ctx.sh.sudoUntil = Date.now() + 5 * 60e3; break; } if (pw == null) return 1; ctx.err('Sorry, try again.\n'); if (k === 2) { ctx.err('sudo: 3 incorrect password attempts\n'); return 1; } }
    }
    const sub = Object.assign({}, ctx, { name: ctx.args[0], args: ctx.args.slice(1), sudo: true });
    if (!CMDS[sub.name]) return ctx.sh.exec(sub.name, sub);
    const avail = OS.pkg.cmdAvailable(sub.name); if (avail !== true) { ctx.err(`sudo: ${sub.name}: command not found\n`); return 1; }
    return CMDS[sub.name](sub);
  });
  def('su', 'switch user', (ctx) => { ctx.err('su: Authentication failure (use sudo)\n'); return 1; });
  def('passwd', 'change password', async (ctx) => { const cur = OS.settings.password; if (cur) { const c = await ctx.readLine('Current password: ', true); if (c !== cur) { ctx.err('passwd: Authentication token manipulation error\n'); return 1; } } const a = await ctx.readLine('New password: ', true); const b = await ctx.readLine('Retype new password: ', true); if (a !== b) { ctx.err('Sorry, passwords do not match.\n'); return 1; } OS.set('password', a || ''); ctx.println('passwd: password updated successfully'); });
  def('open xdg-open gio', 'open file with default app', (ctx) => { const t = ctx.args[ctx.name === 'gio' ? 1 : 0] || '.'; if (/^https?:\/\//.test(t)) { OS.wm.open('browser', { url: t }); return; } const p = ctx.path(t); if (!OS.fs.exists(p)) { ctx.err(`${ctx.name}: ${t}: No such file\n`); return 1; } OS.desktop.openPath(p); });
  def('lock', 'lock screen', () => OS.desktop.lock());
  def('shutdown poweroff halt', 'power off', async (ctx) => { if (!needRoot(ctx, 'shutdown')) { ctx.err('Try: sudo shutdown now\n'); return 1; } ctx.println('Broadcast message: The system will power off now!'); await OS.sleep(800); OS.desktop.shutdown(); });
  def('reboot', 'restart', async (ctx) => { if (!needRoot(ctx, 'reboot')) { ctx.err('Try: sudo reboot\n'); return 1; } ctx.println('Rebooting…'); await OS.sleep(800); OS.desktop.restart(); });
  def('notify-send', 'send a desktop notification', (ctx) => { OS.notify(ctx.args[0] || 'Notification', ctx.args.slice(1).join(' '), { app: 'terminal' }); });
  def('gsettings', 'change desktop settings', (ctx) => { const [a, , k, v] = ctx.args; if (a === 'set' && k in OS.settings) { OS.set(k, v === 'true' ? true : v === 'false' ? false : isNaN(v) ? v.replace(/^'|'$/g, '') : +v); return; } if (a === 'get' && k in OS.settings) return ctx.println(String(OS.settings[k])); if (a === 'list-keys') return Object.keys(OS.settings).forEach((x) => ctx.println(x)); ctx.println('Usage: gsettings set org.cirrus.desktop <key> <value>   e.g. gsettings set org.cirrus.desktop theme light'); });
  def('wallpaper', 'set wallpaper', (ctx) => { const id = ctx.args[0]; if (!id || !OS.wallpapers[id]) { ctx.println('Available: ' + Object.keys(OS.wallpapers).join(', ')); return; } OS.set('wallpaper', id); });
  def('theme', 'switch theme', (ctx) => { const t = ctx.args[0]; if (!['dark', 'light', 'auto'].includes(t)) { ctx.println('Usage: theme dark|light|auto'); return; } OS.set('theme', t); });
  def('screenshot gnome-screenshot', 'take a screenshot', () => OS.desktop.screenshot());

  /* ---------- networking ---------- */
  def('ip ifconfig', 'network interfaces', (ctx) => {
    const on = navigator.onLine;
    if (ctx.name === 'ifconfig') { ctx.println(`eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 10.0.2.15  netmask 255.255.255.0  broadcast 10.0.2.255\n        ether 52:54:00:12:34:56  txqueuelen 1000  (Ethernet)\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0`); return; }
    ctx.println(`1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state ${on ? 'UP' : 'DOWN'}\n    link/ether 52:54:00:12:34:56 brd ff:ff:ff:ff:ff:ff\n    inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic eth0`);
  });
  const normUrl = (u) => (/^[a-z]+:\/\//i.test(u) ? u : 'https://' + u);
  def('ping', 'test network reachability', async (ctx) => {
    const [o, r] = opts(ctx.args, 'c:'); const host = r[0]; if (!host) { ctx.err('ping: usage error: Destination address required\n'); return 1; }
    const count = o.c ? +o.c : 4; const url = normUrl(host.replace(/^https?:\/\//, '')).replace(/\/$/, '') + '/favicon.ico';
    ctx.println(`PING ${host} (${host}) 56(84) bytes of data.`); const times = []; let lost = 0;
    for (let i = 1; i <= count; i++) {
      if (ctx.signal?.aborted) break;
      const t0 = performance.now(); let ok = true;
      try { await fetch(url + '?_=' + Math.random(), { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined }); } catch (e) { ok = false; }
      const dt = performance.now() - t0;
      if (ok) { times.push(dt); ctx.println(`64 bytes from ${host}: icmp_seq=${i} ttl=56 time=${dt.toFixed(1)} ms`); } else { lost++; ctx.println(`From ${host} icmp_seq=${i} Destination Host Unreachable`); }
      if (i < count) await OS.sleep(Math.max(0, 1000 - dt));
    }
    ctx.println(`\n--- ${host} ping statistics ---\n${times.length + lost} packets transmitted, ${times.length} received, ${Math.round(lost / Math.max(1, times.length + lost) * 100)}% packet loss`);
    if (times.length) ctx.println(`rtt min/avg/max = ${Math.min(...times).toFixed(1)}/${(times.reduce((a, b) => a + b) / times.length).toFixed(1)}/${Math.max(...times).toFixed(1)} ms`);
    return times.length ? 0 : 1;
  });
  async function httpGet(url, ctx) {
    const res = await fetch(url, { signal: ctx.signal });
    const ct = res.headers.get('content-type') || '';
    const isText = /text|json|xml|javascript|svg/.test(ct) || !ct;
    let body;
    if (isText) body = await res.text(); else { const b = await res.blob(); body = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); }
    return { res, body, ct, isText };
  }
  const corsHelp = (ctx, url, e) => { ctx.err(`curl: (7) Failed to connect to ${url}: ${e.name === 'AbortError' ? 'Operation aborted' : 'Connection refused or blocked by CORS policy'}\n`); ctx.err(`${C.gray}hint: browsers only allow requests to servers that send CORS headers. Try e.g.\n  curl https://api.github.com/zen\n  curl wttr.in/?format=3\n  curl https://httpbin.org/json${C.r}\n`); };
  def('curl', 'transfer a URL', async (ctx) => {
    const [o, r] = opts(ctx.args, 'o:X:H:d:'); const u = r[0]; if (!u) { ctx.err("curl: try 'curl --help' for more information\n"); return 2; }
    const url = normUrl(u);
    try {
      const { res, body, ct, isText } = await httpGet(url, ctx);
      if (o.I || o.i) { ctx.println(`HTTP/2 ${res.status} ${res.statusText}`); res.headers.forEach((v, k) => ctx.println(`${k}: ${v}`)); ctx.println(''); if (o.I) return; }
      if (o.o || o.O) { const fn = o.o || OS.fs.basename(new URL(url).pathname) || 'index.html'; OS.fs.write(ctx.path(fn), body); ctx.err(`  % Total    % Received\n100 ${OS.fmtSize(body.length).padStart(8)}  100 ${OS.fmtSize(body.length)}\n`); return; }
      if (!isText) { ctx.println(`Warning: Binary output can mess up your terminal (${ct}). Use "-o <file>" to save it.`); return; }
      ctx.out(body.endsWith('\n') ? body : body + '\n');
      return res.ok ? 0 : 22;
    } catch (e) { if (ctx.signal?.aborted) return 130; corsHelp(ctx, new URL(url).host, e); return 7; }
  });
  def('wget', 'download files', async (ctx) => {
    const [o, r] = opts(ctx.args, 'O:'); const u = r[0]; if (!u) { ctx.err('wget: missing URL\n'); return 1; }
    const url = normUrl(u); const host = new URL(url).host;
    ctx.println(`--${new Date().toISOString().replace('T', ' ').slice(0, 19)}--  ${url}\nResolving ${host} (${host})... ok\nConnecting to ${host}|:443... connected.\nHTTP request sent, awaiting response... `);
    try {
      const { res, body, ct } = await httpGet(url, ctx);
      const fn = o.O || decodeURIComponent(OS.fs.basename(new URL(url).pathname)) || 'index.html';
      ctx.println(`${res.status} ${res.statusText || 'OK'}\nLength: ${body.length} (${OS.fmtSize(body.length)}) [${ct.split(';')[0] || 'application/octet-stream'}]\nSaving to: ‘${fn}’\n`);
      const live = ctx.term.live(); for (let i = 0; i <= 20; i++) { live.set(`${fn.padEnd(20).slice(0, 20)} ${String(i * 5).padStart(3)}%[${'='.repeat(i)}>${' '.repeat(20 - i)}] ${OS.fmtSize(body.length * i / 20).padStart(8)}`); await OS.sleep(25); } live.done();
      OS.fs.write(ctx.path(fn), body);
      ctx.println(`\n${new Date().toISOString().replace('T', ' ').slice(0, 19)} (${(body.length / 1024 / 0.3).toFixed(0)} KB/s) - ‘${fn}’ saved [${body.length}/${body.length}]`);
    } catch (e) { if (ctx.signal?.aborted) return 130; ctx.println('failed.'); corsHelp(ctx, host, e); return 4; }
  });
  def('nslookup dig host', 'DNS lookup (via DNS-over-HTTPS)', async (ctx) => {
    const h = ctx.args.find((a) => !a.startsWith('-')); if (!h) { ctx.err('usage: nslookup <host>\n'); return 1; }
    try { const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(h)}&type=A`, { headers: { accept: 'application/dns-json' }, signal: ctx.signal }); const j = await r.json(); ctx.println(`Server:\t\t1.1.1.1\nAddress:\t1.1.1.1#53\n\nNon-authoritative answer:`); (j.Answer || []).forEach((a) => ctx.println(a.type === 1 ? `Name:\t${a.name.replace(/\.$/, '')}\nAddress: ${a.data}` : `${a.name}\tcanonical name = ${a.data}`)); if (!j.Answer) ctx.println(`** server can't find ${h}: NXDOMAIN`); } catch (e) { ctx.err(';; connection timed out; no servers could be reached\n'); return 1; }
  });

  /* ---------- package management ---------- */
  async function aptInstall(ctx, names) {
    const R = OS.pkg.repo;
    ctx.println('Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done');
    const missing = names.filter((n) => !R[n]);
    if (missing.length) { ctx.err(`${C.red}E:${C.r} Unable to locate package ${missing[0]}\n`); return 100; }
    const todo = names.filter((n) => !OS.pkg.isInstalled(n));
    names.filter((n) => OS.pkg.isInstalled(n)).forEach((n) => ctx.println(`${n} is already the newest version (${R[n].v}).`));
    if (!todo.length) { ctx.println('0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.'); return 0; }
    const tot = todo.reduce((a, n) => a + R[n].size, 0);
    ctx.println(`The following NEW packages will be installed:\n  ${todo.join(' ')}\n0 upgraded, ${todo.length} newly installed, 0 to remove and 0 not upgraded.\nNeed to get ${OS.fmtSize(tot * 300)} of archives.\nAfter this operation, ${OS.fmtSize(tot * 1024)} of additional disk space will be used.`);
    if (!ctx.yes && tot > 1000) { const a = await ctx.readLine('Do you want to continue? [Y/n] '); if (a == null || /^n/i.test(a.trim())) { ctx.println('Abort.'); return 1; } }
    let i = 0;
    for (const n of todo) { i++; ctx.println(`Get:${i} http://archive.cirruslinux.example/cirrus nimbus/main amd64 ${n} amd64 ${R[n].v} [${OS.fmtSize(R[n].size * 300)}]`); await OS.sleep(60); }
    ctx.println(`Fetched ${OS.fmtSize(tot * 300)} in 1s (${OS.fmtSize(tot * 280)}/s)`);
    for (const n of todo) {
      ctx.println(`Selecting previously unselected package ${n}.\n(Reading database ... ${48000 + Math.floor(Math.random() * 900)} files and directories currently installed.)\nPreparing to unpack .../${n}_${R[n].v}_amd64.deb ...\nUnpacking ${n} (${R[n].v}) ...`);
      const live = ctx.term.live();
      await OS.pkg.install(n, (p) => { const w = 40, k = Math.round(p * w); live.set(`\x1b[30;42mProgress: [${String(Math.round(p * 100)).padStart(3)}%]\x1b[0m [${'#'.repeat(k)}${'.'.repeat(w - k)}]`); });
      live.done(true);
      ctx.println(`Setting up ${n} (${R[n].v}) ...`);
      if (R[n].type === 'app') ctx.println(`Processing triggers for desktop-file-utils ...\n${C.green}${OS.apps[n]?.name || n} is now available in the app menu.${C.r}`);
    }
    ctx.println('Processing triggers for man-db (2.12.0-4build2) ...');
    return 0;
  }
  async function aptRemove(ctx, names, purge) {
    ctx.println('Reading package lists... Done\nBuilding dependency tree... Done');
    for (const n of names) {
      if (!OS.pkg.repo[n]) { ctx.err(`${C.red}E:${C.r} Unable to locate package ${n}\n`); return 100; }
      if (!OS.pkg.isInstalled(n)) { ctx.println(`Package '${n}' is not installed, so not removed`); continue; }
      if (OS.pkg.repo[n].core) { ctx.err(`${C.red}E:${C.r} Removing essential system-critical package ${n} is not permitted.\n`); return 100; }
      ctx.println(`The following packages will be REMOVED:\n  ${n}${purge ? '*' : ''}`);
      if (!ctx.yes) { const a = await ctx.readLine('Do you want to continue? [Y/n] '); if (a == null || /^n/i.test(a.trim())) { ctx.println('Abort.'); return 1; } }
      ctx.println(`Removing ${n} (${OS.pkg.repo[n].v}) ...`); await OS.pkg.remove(n);
    }
    return 0;
  }
  def('apt apt-get aptitude', 'package manager', async (ctx) => {
    const [o, r] = opts(ctx.args); const sub = r[0]; const names = r.slice(1); ctx.yes = o.y || o.yes || o['assume-yes'];
    const R = OS.pkg.repo;
    const lockErr = () => { ctx.err(`${C.red}E:${C.r} Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\n${C.red}E:${C.r} Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?\n`); return 100; };
    switch (sub) {
      case 'update': {
        if (!ctx.sudo) return lockErr();
        const src = ['http://archive.cirruslinux.example/cirrus nimbus InRelease', 'http://archive.cirruslinux.example/cirrus nimbus-updates InRelease', 'http://security.cirruslinux.example/cirrus nimbus-security InRelease'];
        for (let i = 0; i < src.length; i++) { await OS.sleep(250 + Math.random() * 300); ctx.println(`${i ? 'Get' : 'Hit'}:${i + 1} ${src[i]}${i ? ` [${(90 + Math.random() * 60).toFixed(1)} kB]` : ''}`); }
        ctx.println(`Fetched ${(240 + Math.random() * 90).toFixed(0)} kB in 1s\nReading package lists... Done\nBuilding dependency tree... Done`);
        const up = OS.pkg.upgradable().length; ctx.println(up ? `${up} packages can be upgraded. Run 'apt list --upgradable' to see them.` : 'All packages are up to date.');
        return 0;
      }
      case 'upgrade': case 'full-upgrade': case 'dist-upgrade': {
        if (!ctx.sudo) return lockErr();
        const up = OS.pkg.upgradable();
        ctx.println('Reading package lists... Done\nBuilding dependency tree... Done\nCalculating upgrade... Done');
        if (!up.length) { ctx.println('0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.'); return 0; }
        ctx.println(`The following packages will be upgraded:\n  ${up.join(' ')}\n${up.length} upgraded, 0 newly installed, 0 to remove and 0 not upgraded.`);
        if (!ctx.yes) { const a = await ctx.readLine('Do you want to continue? [Y/n] '); if (a == null || /^n/i.test(a.trim())) { ctx.println('Abort.'); return 1; } }
        for (const n of up) { const live = ctx.term.live(); for (let i = 0; i <= 10; i++) { live.set(`Unpacking ${n} (${R[n].v}+1) over (${R[n].v}) ... ${i * 10}%`); await OS.sleep(60); } live.done(true); ctx.println(`Setting up ${n} (${R[n].v}+1) ...`); }
        OS.pkg.markUpgraded(); return 0;
      }
      case 'install': case 'reinstall':
        if (!names.length) { ctx.println('0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.'); return 0; }
        if (!ctx.sudo) return lockErr();
        return aptInstall(ctx, names);
      case 'remove': case 'purge': case 'uninstall':
        if (!ctx.sudo) return lockErr();
        return aptRemove(ctx, names, sub === 'purge');
      case 'autoremove': if (!ctx.sudo) return lockErr(); ctx.println('Reading package lists... Done\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.'); return 0;
      case 'search': { const q = names.join(' '); if (!q) { ctx.err('E: You must give at least one search pattern\n'); return 100; } ctx.println('Sorting... Done\nFull Text Search... Done'); OS.pkg.search(q).forEach((n) => ctx.println(`${C.green}${n}${C.r}/nimbus ${R[n].v} amd64${OS.pkg.isInstalled(n) ? ' [installed]' : ''}\n  ${R[n].desc}\n`)); return 0; }
      case 'show': case 'info': { const n = names[0]; if (!R[n]) { ctx.err(`E: No packages found\n`); return 100; } ctx.println(`Package: ${n}\nVersion: ${R[n].v}\nPriority: optional\nSection: ${R[n].sec.toLowerCase()}\nMaintainer: Cirrus Developers <dev@cirruslinux.example>\nInstalled-Size: ${R[n].size} kB\nStatus: ${OS.pkg.isInstalled(n) ? 'installed' : 'not installed'}\nDescription: ${R[n].desc}`); return 0; }
      case 'list': {
        let ns = Object.keys(R).sort();
        if (o.installed) ns = ns.filter((n) => OS.pkg.isInstalled(n));
        if (o.upgradable) ns = OS.pkg.upgradable();
        ctx.println('Listing... Done'); ns.forEach((n) => ctx.println(`${C.green}${n}${C.r}/nimbus ${R[n].v} amd64${OS.pkg.isInstalled(n) ? ' [installed]' : ''}`)); return 0;
      }
      case 'moo': ctx.println('                 (__)\n                 (oo)\n           /------\\/\n          / |    ||\n         *  /\\---/\\\n            ~~   ~~\n..."Have you mooed today?"...'); return 0;
      default:
        ctx.println(`apt 2.7.14 (amd64)\nUsage: apt [options] command\n\nMost used commands:\n  list - list packages based on package names\n  search - search in package descriptions\n  show - show package details\n  install - install packages\n  remove - remove packages\n  update - update list of available packages\n  upgrade - upgrade the system by installing/upgrading packages\n\nTry: ${C.green}sudo apt install cowsay${C.r}  or  ${C.green}apt search game${C.r}`);
        return sub ? 1 : 0;
    }
  });
  def('dpkg', 'package manager backend', (ctx) => { if (ctx.args[0] === '-l' || ctx.args[0] === '--list') { ctx.println('||/ Name                 Version         Description\n+++-====================-===============-========================================'); OS.pkg.installed().sort().forEach((n) => ctx.println(`ii  ${n.padEnd(20)} ${OS.pkg.repo[n].v.padEnd(15)} ${OS.pkg.repo[n].desc}`)); return; } ctx.println('Usage: dpkg -l'); });
  def('snap flatpak', 'universal packages', (ctx) => ctx.println(`${ctx.name} is not available on Cirrus Linux. Use: sudo apt install <package>`));

  /* ---------- fun ---------- */
  def('neofetch fastfetch', 'system info with logo', (ctx) => {
    const s = OS.settings; const ua = navigator.userAgent; const browser = /Firefox\/(\d+)/.exec(ua) ? 'Firefox ' + /Firefox\/(\d+)/.exec(ua)[1] : /Edg\/(\d+)/.exec(ua) ? 'Edge ' + /Edg\/(\d+)/.exec(ua)[1] : /Chrome\/(\d+)/.exec(ua) ? 'Chrome ' + /Chrome\/(\d+)/.exec(ua)[1] : /Safari/.test(ua) ? 'Safari' : 'Browser';
    const L = [
      '            .-~~~~~-.            ', '        .-~~         ~~-.        ', '      .~      .---.      ~.      ', '     /      .~     ~.      \\     ', '    |      /  .-.    \\      |    ', '  .-~     |  (   )    |     ~-.  ', ' /         \\  `-´    /         \\ ', '|           `.___.´            |', '|                              |', ' \\                            / ', "  `-.______________________.-'  ", '                                 ', '      c i r r u s   l i n u x     ',
    ];
    const mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576 + 900) : 1480; const memT = (navigator.deviceMemory || 8) * 1024;
    const info = [
      `${C.bcyan}${s.username}${C.r}@${C.bcyan}${s.hostname}${C.r}`, '-'.repeat(s.username.length + s.hostname.length + 1),
      `${C.bcyan}OS${C.r}: Cirrus Linux ${OS.version} (${OS.codename}) x86_64`, `${C.bcyan}Host${C.r}: ${browser} Virtual Machine`, `${C.bcyan}Kernel${C.r}: ${OS.kernel}`, `${C.bcyan}Uptime${C.r}: ${uptimeStr()}`, `${C.bcyan}Packages${C.r}: ${OS.pkg.installed().length} (dpkg)`, `${C.bcyan}Shell${C.r}: bash 5.2.21`, `${C.bcyan}Resolution${C.r}: ${screen.width}x${screen.height}`, `${C.bcyan}DE${C.r}: Cirrus Desktop ${OS.version}`, `${C.bcyan}Theme${C.r}: Cirrus-${s.theme} [GTK3]`, `${C.bcyan}Terminal${C.r}: cirrus-terminal`, `${C.bcyan}CPU${C.r}: Cirrus vCPU (${navigator.hardwareConcurrency || 4}) @ 3.20GHz`, `${C.bcyan}Memory${C.r}: ${mem}MiB / ${memT}MiB`, '', COLORS.map((c, i) => `\x1b[4${i}m   `).join('') + C.r, BRIGHT.map((c, i) => `\x1b[48;2;${parseInt(c.slice(1, 3), 16)};${parseInt(c.slice(3, 5), 16)};${parseInt(c.slice(5, 7), 16)}m   `).join('') + C.r,
    ];
    const n = Math.max(L.length, info.length);
    for (let i = 0; i < n; i++) ctx.println(`${C.bcyan}${(L[i] || '').padEnd(34)}${C.r} ${info[i] || ''}`);
  });
  def('cowsay cowthink', 'a talking cow', (ctx) => {
    const [o, r] = opts(ctx.args, 'f:'); let msg = r.join(' ') || (ctx.stdin || '').trim() || 'Moo!'; const think = ctx.name === 'cowthink';
    const wrap = []; msg.split('\n').forEach((p) => { while (p.length > 40) { let k = p.lastIndexOf(' ', 40); if (k < 1) k = 40; wrap.push(p.slice(0, k)); p = p.slice(k).trimStart(); } wrap.push(p); });
    const w = Math.max(...wrap.map((l) => l.length));
    let s = ' ' + '_'.repeat(w + 2) + '\n';
    if (wrap.length === 1) s += (think ? '( ' : '< ') + wrap[0] + (think ? ' )' : ' >') + '\n';
    else wrap.forEach((l, i) => (s += (think ? '(' : i === 0 ? '/' : i === wrap.length - 1 ? '\\' : '|') + ' ' + l.padEnd(w) + ' ' + (think ? ')' : i === 0 ? '\\' : i === wrap.length - 1 ? '/' : '|') + '\n'));
    s += ' ' + '-'.repeat(w + 2) + '\n';
    const t = think ? 'o' : '\\'; const eyes = o.d ? 'xx' : o.b ? '==' : o.g ? '$$' : o.p ? '@@' : o.s ? '**' : o.t ? '--' : o.w ? 'OO' : o.y ? '..' : 'oo';
    if (o.f === 'tux') s += `   ${t}\n    ${t}\n        .--.\n       |o_o |\n       |:_/ |\n      //   \\ \\\n     (|     | )\n    /'\\_   _/\`\\\n    \\___)=(___/\n`;
    else if (o.f === 'dragon') s += `      ${t}                    / \\  //\\\n       ${t}    |\\___/|      /   \\//  \\\\\n            /0  0  \\__  /    //  | \\ \\\n           /     /  \\/_/    //   |  \\  \\\n           @_^_@'/   \\/_   //    |   \\   \\\n           //_^_/     \\/_ //     |    \\    \\\n        ( //) |        \\///      |     \\     \\\n      ( / /) _|_ /   )  //       |      \\     _\\\n`;
    else s += `        ${t}   ^__^\n         ${t}  (${eyes})\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||\n`;
    ctx.out(s);
  });
  const FONT = (() => {
    const f = { A: [' ██ ', '█  █', '████', '█  █', '█  █'], B: ['███ ', '█  █', '███ ', '█  █', '███ '], C: [' ███', '█   ', '█   ', '█   ', ' ███'], D: ['███ ', '█  █', '█  █', '█  █', '███ '], E: ['████', '█   ', '███ ', '█   ', '████'], F: ['████', '█   ', '███ ', '█   ', '█   '], G: [' ███', '█   ', '█ ██', '█  █', ' ███'], H: ['█  █', '█  █', '████', '█  █', '█  █'], I: ['███', ' █ ', ' █ ', ' █ ', '███'], J: ['  ██', '   █', '   █', '█  █', ' ██ '], K: ['█  █', '█ █ ', '██  ', '█ █ ', '█  █'], L: ['█   ', '█   ', '█   ', '█   ', '████'], M: ['█   █', '██ ██', '█ █ █', '█   █', '█   █'], N: ['█   █', '██  █', '█ █ █', '█  ██', '█   █'], O: [' ██ ', '█  █', '█  █', '█  █', ' ██ '], P: ['███ ', '█  █', '███ ', '█   ', '█   '], Q: [' ██ ', '█  █', '█  █', '█ ██', ' ███'], R: ['███ ', '█  █', '███ ', '█ █ ', '█  █'], S: [' ███', '█   ', ' ██ ', '   █', '███ '], T: ['█████', '  █  ', '  █  ', '  █  ', '  █  '], U: ['█  █', '█  █', '█  █', '█  █', ' ██ '], V: ['█   █', '█   █', '█   █', ' █ █ ', '  █  '], W: ['█   █', '█   █', '█ █ █', '██ ██', '█   █'], X: ['█   █', ' █ █ ', '  █  ', ' █ █ ', '█   █'], Y: ['█   █', ' █ █ ', '  █  ', '  █  ', '  █  '], Z: ['████', '   █', '  █ ', ' █  ', '████'], 0: [' ██ ', '█ ██', '██ █', '█  █', ' ██ '], 1: [' █ ', '██ ', ' █ ', ' █ ', '███'], 2: ['███ ', '   █', ' ██ ', '█   ', '████'], 3: ['███ ', '   █', ' ██ ', '   █', '███ '], 4: ['█  █', '█  █', '████', '   █', '   █'], 5: ['████', '█   ', '███ ', '   █', '███ '], 6: [' ██ ', '█   ', '███ ', '█  █', ' ██ '], 7: ['████', '   █', '  █ ', ' █  ', ' █  '], 8: [' ██ ', '█  █', ' ██ ', '█  █', ' ██ '], 9: [' ██ ', '█  █', ' ███', '   █', ' ██ '], ' ': ['  ', '  ', '  ', '  ', '  '], '!': ['█', '█', '█', ' ', '█'], '?': ['███ ', '   █', ' ██ ', '    ', ' █  '], '.': [' ', ' ', ' ', ' ', '█'], '-': ['   ', '   ', '███', '   ', '   '], ':': [' ', '█', ' ', '█', ' '], "'": ['█', '█', ' ', ' ', ' '], ',': ['  ', '  ', '  ', ' █', '█ '] };
    return f;
  })();
  const bigText = (t, ch) => { const rows = ['', '', '', '', '']; for (const c of t.toUpperCase()) { const g = FONT[c] || FONT['?']; for (let i = 0; i < 5; i++) rows[i] += g[i].replace(/█/g, ch || '█') + ' '; } return rows.map((r) => r.trimEnd()).join('\n') + '\n'; };
  def('figlet banner', 'big letters', (ctx) => { const t = ctx.args.join(' ') || (ctx.stdin || '').trim() || 'Cirrus'; ctx.out(bigText(t, ctx.name === 'banner' ? '#' : '█')); });
  const rainbow = (s, seed = Math.random() * 10) => { let out = ''; let i = 0; for (const line of s.split('\n')) { for (const ch of line) { const f = 0.12, x = seed + i * f; const r = Math.round(Math.sin(x) * 127 + 128), g = Math.round(Math.sin(x + 2.09) * 127 + 128), b = Math.round(Math.sin(x + 4.19) * 127 + 128); out += `\x1b[38;2;${r};${g};${b}m${ch}`; i++; } out += '\x1b[0m\n'; i = i - line.length + 3; } return out.replace(/\n$/, ''); };
  def('lolcat', 'rainbow text', (ctx) => { const s = readInput(ctx, ctx.args); ctx.out(rainbow(stripAnsi(s).replace(/\n$/, '')) + '\n'); });
  def('toilet', 'colorful big text', (ctx) => ctx.out(rainbow(bigText(ctx.args.filter((a) => !a.startsWith('-')).join(' ') || 'Cirrus').replace(/\n$/, '')) + '\n'));
  const FORTUNES = ['The best way to predict the future is to invent it. — Alan Kay', 'Talk is cheap. Show me the code. — Linus Torvalds', 'Simplicity is prerequisite for reliability. — Edsger Dijkstra', 'Any sufficiently advanced technology is indistinguishable from magic. — Arthur C. Clarke', 'You will find a bug in the last place you look.', 'There are 10 kinds of people: those who understand binary and those who do not.', 'It works on my machine.', 'A journey of a thousand miles begins with a single step.', 'Your lucky number is 42.', 'Premature optimization is the root of all evil. — Donald Knuth', 'Today is a good day to commit your changes.', 'Be curious, not judgmental. — Walt Whitman', 'In a world without fences, who needs Gates?', 'The quieter you become, the more you are able to hear.', 'You have mail. Probably spam.', 'Do one thing and do it well. — The Unix philosophy', 'Weeks of coding can save you hours of planning.', 'Fortune favors the bold, and those who make backups.'];
  def('fortune', 'random quote', (ctx) => ctx.println(FORTUNES[Math.floor(Math.random() * FORTUNES.length)]));
  def('rot13', 'rotate letters by 13', (ctx) => ctx.out((ctx.args.join(' ') || ctx.stdin || '').replace(/[a-z]/gi, (c) => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)) + (ctx.args.length ? '\n' : '')));
  def('factor', 'prime factors', (ctx) => { (ctx.args.length ? ctx.args : lines(ctx.stdin || '')).forEach((a) => { let n = parseInt(a); const f = []; for (let d = 2; d * d <= n; d++) while (n % d === 0) { f.push(d); n /= d; } if (n > 1) f.push(n); ctx.println(`${a}: ${f.join(' ')}`); }); });
  def('guess', 'number guessing game', async (ctx) => { const n = 1 + Math.floor(Math.random() * 100); ctx.println("I'm thinking of a number between 1 and 100."); for (let t = 1; ; t++) { const a = await ctx.readLine('Your guess: '); if (a == null) return 130; const g = parseInt(a); if (isNaN(g)) { ctx.println('Please enter a number.'); continue; } if (g === n) { ctx.println(`${C.green}Correct! You got it in ${t} tries.${C.r}`); return 0; } ctx.println(g < n ? 'Too low!' : 'Too high!'); } });
  def('sl', 'steam locomotive', async (ctx) => {
    const train = ['      ====        ________                ___________ ', '  _D _|  |_______/        \\__I_I_____===__|_________| ', '   |(_)---  |   H\\________/ |   |        =|___ ___|   ', '   /     |  |   H  |  |     |   |         ||_| |_||   ', '  |      |  |   H  |__--------------------| [___] |   ', '  | ________|___H__/__|_____/[][]~\\_______|       |   ', '  |/ |   |-----------I_____I [][] []  D   |=======|__ ', '__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ', ' |/-=|___|=    ||    ||    ||    |_____/~\\___/        ', '  \\_/      \\O=====O=====O=====O_/      \\_/            '];
    await ctx.term.fullscreen((pre, done) => { let x = pre.parentNode.clientWidth; pre.textContent = train.join('\n'); pre.style.top = '35%'; const t = setInterval(() => { x -= 9; pre.style.left = x + 'px'; if (x < -pre.offsetWidth) done(); }, 30); return () => clearInterval(t); });
  });
  def('cmatrix', 'digital rain', async (ctx) => {
    await ctx.term.fullscreen((pre, done, box) => {
      const c = document.createElement('canvas'); box.appendChild(c); pre.remove(); const W = (c.width = box.clientWidth), H = (c.height = box.clientHeight); const g = c.getContext('2d'); const fs = 15; const cols = Math.floor(W / fs); const drops = Array(cols).fill(0).map(() => Math.random() * -50);
      const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF';
      const t = setInterval(() => { g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 0, W, H); g.font = fs + 'px monospace'; drops.forEach((y, i) => { g.fillStyle = Math.random() < .05 ? '#cfc' : '#0f0'; g.fillText(chars[Math.random() * chars.length | 0], i * fs, y * fs); drops[i] = y * fs > H && Math.random() > .975 ? 0 : y + 1; }); }, 45);
      return () => clearInterval(t);
    });
  });
  def('asciiquarium', 'aquarium', async (ctx) => {
    await ctx.term.fullscreen((pre, done, box) => {
      const W = Math.floor(box.clientWidth / 7.3), H = Math.floor(box.clientHeight / 13.5); const fish = Array.from({ length: 8 }, () => ({ x: Math.random() * W, y: 3 + Math.random() * (H - 6), d: Math.random() < .5 ? 1 : -1, s: .3 + Math.random() * .8, c: ['#ff6b6b', '#f2cc60', '#79c0ff', '#d2a8ff', '#7ee787'][Math.random() * 5 | 0] })); let tick = 0;
      pre.style.left = '0'; pre.style.top = '0'; pre.style.color = '#79c0ff'; box.style.background = '#001b33';
      const t = setInterval(() => {
        tick++; const grid = Array.from({ length: H }, () => Array(W).fill(' ')); const col = Array.from({ length: H }, () => Array(W).fill(null));
        for (let x = 0; x < W; x++) grid[1][x] = '~≈'[(x + tick) % 2]; for (let x = 0; x < W; x++) grid[H - 1][x] = '_';
        [5, 20, 45, 70].forEach((sx) => { for (let y = H - 2; y > H - 7; y--) if (sx < W) { grid[y][sx + ((y + tick / 4 | 0) % 2)] = '(' ; col[y][sx] = '#3fdc77'; } });
        fish.forEach((f) => { f.x += f.d * f.s; if (f.x > W + 6) f.x = -6; if (f.x < -6) f.x = W + 6; const art = f.d > 0 ? '><(((°>' : '<°)))><'; for (let k = 0; k < art.length; k++) { const xx = Math.round(f.x) + k, yy = Math.round(f.y); if (xx >= 0 && xx < W && yy < H) { grid[yy][xx] = art[k]; col[yy][xx] = f.c; } } });
        if (tick % 3 === 0) fish.forEach((f) => { if (Math.random() < .1) { const yy = Math.round(f.y) - 1; const xx = Math.round(f.x); if (yy > 1 && xx >= 0 && xx < W) grid[yy][xx] = 'o'; } });
        pre.innerHTML = grid.map((row, y) => row.map((ch, x) => (col[y][x] ? `<span style="color:${col[y][x]}">${esc(ch)}</span>` : esc(ch))).join('')).join('\n');
      }, 90);
      return () => { clearInterval(t); };
    }, '#001b33');
  });

  /* ---------- dev ---------- */
  function jsRun(code, ctx) {
    const logs = []; const fmt = (a) => a.map((x) => (typeof x === 'string' ? x : (() => { try { return JSON.stringify(x, null, 2); } catch (e) { return String(x); } })())).join(' ');
    const con = { log: (...a) => ctx.println(fmt(a)), info: (...a) => ctx.println(fmt(a)), warn: (...a) => ctx.println(C.yellow + fmt(a) + C.r), error: (...a) => ctx.err(C.red + fmt(a) + C.r + '\n'), table: (x) => ctx.println(fmt([x])) };
    const fsApi = { readFileSync: (p) => OS.fs.read(ctx.path(p)), writeFileSync: (p, d) => OS.fs.write(ctx.path(p), String(d)), existsSync: (p) => OS.fs.exists(ctx.path(p)), readdirSync: (p) => OS.fs.ls(ctx.path(p)).map((x) => x.name) };
    const req = (m) => { if (m === 'fs') return fsApi; if (m === 'os') return { hostname: () => OS.settings.hostname, platform: () => 'linux', cpus: () => Array(navigator.hardwareConcurrency || 4).fill({ model: 'Cirrus vCPU' }) }; if (m === 'path') return { join: (...a) => a.join('/').replace(/\/+/g, '/'), basename: OS.fs.basename, dirname: OS.fs.dirname }; throw new Error(`Cannot find module '${m}'`); };
    const proc = { argv: ['node', ...ctx.args], env: ctx.sh.env, platform: 'linux', version: 'v20.11.1', cwd: () => ctx.sh.cwd, exit: () => {} };
    void logs;
    return new Function('console', 'require', 'process', 'window', 'document', 'OS', `"use strict";\n${code}`)(con, req, proc, undefined, undefined, undefined);
  }
  def('node nodejs js', 'JavaScript runtime', async (ctx) => {
    const [o, r] = opts(ctx.args, 'e:');
    if (o.v || o.version) return ctx.println('v20.11.1');
    if (o.e) { try { const v = jsRun(`return (${o.e})`, ctx); if (v !== undefined) ctx.println(String(v)); } catch (e) { ctx.err(`${C.red}${e.name}: ${e.message}${C.r}\n`); return 1; } return; }
    if (r[0]) { try { const res = jsRun(OS.fs.read(ctx.path(r[0])), ctx); if (res && res.then) await res; } catch (e) { ctx.err(`${C.red}${r[0]}\n${e.name}: ${e.message}${C.r}\n`); return 1; } return; }
    ctx.println(`Welcome to Node.js v20.11.1.\nType ".exit" to exit.`);
    const scope = {};
    for (;;) {
      const l = await ctx.readLine('> '); if (l == null || l.trim() === '.exit') break; if (!l.trim()) continue;
      try { const v = new Function('scope', 'console', `with(scope){ return eval(${JSON.stringify(l.replace(/^(const|let)\s+/, 'var '))}) }`)(scope, { log: (...a) => ctx.println(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')) }); ctx.println(typeof v === 'string' ? `${C.green}'${v}'${C.r}` : typeof v === 'number' ? C.yellow + v + C.r : v === undefined ? C.gray + 'undefined' + C.r : (() => { try { return JSON.stringify(v); } catch (e) { return String(v); } })()); }
      catch (e) { ctx.println(`${C.red}Uncaught ${e.name}: ${e.message}${C.r}`); }
    }
  });
  /* tiny python: translates a subset of Python to JS */
  function py2js(src) {
    const out = []; const stack = [0];
    const conv = (e) => e.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null').replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\s+/g, '!').replace(/(\S+)\s*\/\/\s*(\S+)/g, 'Math.floor($1/$2)').replace(/\*\*/g, '**').replace(/\blen\(/g, '__len(').replace(/f(["'])(.*?)\1/g, (m, q, s) => '`' + s.replace(/\{([^}]+)\}/g, '${$1}') + '`').replace(/\bin\b(?=\s*[\[\w"'])/g, ' __in ');
    const linesP = [];
    src.split('\n').forEach((ln) => { const m = /^(\s*)((?:for|while|if|elif|def)\b[^#]*?|else):\s*(\S.*)$/.exec(ln); if (m && !/["']/.test(m[2])) { linesP.push(m[1] + m[2] + ':'); m[3].split(/;\s*/).forEach((st) => linesP.push(m[1] + '    ' + st)); } else linesP.push(ln); });
    for (let raw of linesP) {
      if (!raw.trim() || raw.trim().startsWith('#')) continue;
      const ind = raw.match(/^\s*/)[0].length; let l = raw.trim();
      while (ind < stack[stack.length - 1]) { stack.pop(); out.push('}'); }
      let m;
      if ((m = /^for\s+(\w+)\s+in\s+range\((.*)\):$/.exec(l))) { const a = m[2].split(',').map((x) => conv(x.trim())); const [s, e, st] = a.length === 1 ? ['0', a[0], '1'] : [a[0], a[1], a[2] || '1']; out.push(`for (let ${m[1]} = ${s}; (${st}) > 0 ? ${m[1]} < ${e} : ${m[1]} > ${e}; ${m[1]} += ${st}) {`); }
      else if ((m = /^for\s+(\w+)\s+in\s+(.+):$/.exec(l))) out.push(`for (let ${m[1]} of __iter(${conv(m[2])})) {`);
      else if ((m = /^while\s+(.+):$/.exec(l))) out.push(`while (${conv(m[1])}) { if (++__guard > 1e6) throw new Error('loop limit');`);
      else if ((m = /^if\s+(.+):$/.exec(l))) out.push(`if (${conv(m[1])}) {`);
      else if ((m = /^elif\s+(.+):$/.exec(l))) { out.push(`else if (${conv(m[1])}) {`); }
      else if (l === 'else:') out.push('else {');
      else if ((m = /^def\s+(\w+)\((.*)\):$/.exec(l))) out.push(`function ${m[1]}(${m[2]}) {`);
      else if ((m = /^import\s+(\w+)/.exec(l))) { out.push(`/* import ${m[1]} */`); continue; }
      else if (/^(pass|continue|break)$/.test(l)) { out.push(l === 'pass' ? ';' : l + ';'); continue; }
      else if ((m = /^return\s*(.*)$/.exec(l))) { out.push(`return ${conv(m[1])};`); continue; }
      else if ((m = /^([\w.]+)\s*([+\-*/]?=)\s*(.+)$/.exec(l)) && !l.includes('==')) { out.push(`${m[2] === '=' && !m[1].includes('.') && !m[1].includes('[') ? `if (typeof ${m[1]} === 'undefined') var ${m[1]}; ` : ''}${m[1]} ${m[2]} ${conv(m[3])};`); continue; }
      else { out.push(conv(l) + ';'); continue; }
      stack.push(ind + 1); // placeholder; actual indent learned on next line
      stack[stack.length - 1] = (linesP[linesP.indexOf(raw) + 1] || '').match(/^\s*/)[0].length || ind + 4;
    }
    while (stack.length > 1) { stack.pop(); out.push('}'); }
    return out.join('\n');
  }
  function pyRun(src, ctx) {
    const pstr = (x) => (x === true ? 'True' : x === false ? 'False' : x === null || x === undefined ? 'None' : Array.isArray(x) ? '[' + x.map((y) => (typeof y === 'string' ? `'${y}'` : pstr(y))).join(', ') + ']' : String(x));
    const env = {
      print: (...a) => { let end = '\n'; if (a.length && a[a.length - 1] && a[a.length - 1].__kw) end = a.pop().end; ctx.out(a.map(pstr).join(' ') + end); },
      __len: (x) => (x && x.length !== undefined ? x.length : Object.keys(x).length), __iter: (x) => (typeof x === 'string' ? [...x] : Array.isArray(x) ? x : Object.keys(x)),
      range: (a, b, s = 1) => { if (b === undefined) { b = a; a = 0; } const r = []; for (let i = a; s > 0 ? i < b : i > b; i += s) r.push(i); return r; },
      str: (x) => pstr(x), int: (x) => parseInt(x), float: (x) => parseFloat(x), abs: Math.abs, max: (...a) => Math.max(...(a.length === 1 ? a[0] : a)), min: (...a) => Math.min(...(a.length === 1 ? a[0] : a)), sum: (a) => a.reduce((x, y) => x + y, 0), round: (x, n = 0) => +x.toFixed(n), sorted: (a) => [...a].sort((x, y) => (x > y ? 1 : -1)), list: (x) => [...x], type: (x) => `<class '${Array.isArray(x) ? 'list' : typeof x === 'string' ? 'str' : Number.isInteger(x) ? 'int' : typeof x === 'number' ? 'float' : 'object'}'>`,
      math: { sqrt: Math.sqrt, pi: Math.PI, e: Math.E, floor: Math.floor, ceil: Math.ceil, sin: Math.sin, cos: Math.cos, pow: Math.pow, factorial: (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; } },
      random: { randint: (a, b) => a + Math.floor(Math.random() * (b - a + 1)), random: Math.random, choice: (a) => a[Math.floor(Math.random() * a.length)] },
    };
    const js = py2js(src).replace(/print\((.*),\s*end\s*=\s*(.+)\)/g, 'print($1, {__kw:1, end:$2})').replace(/(\w+)\.append\(/g, '$1.push(').replace(/\.upper\(\)/g, '.toUpperCase()').replace(/\.lower\(\)/g, '.toLowerCase()').replace(/(\S+)\s+__in\s+(\S+)/g, '__iter($2).includes($1)');
    return new Function(...Object.keys(env), `let __guard = 0;\n${js}`)(...Object.values(env));
  }
  def('python3 python', 'Python interpreter (subset)', async (ctx) => {
    if (ctx.args[0] === '--version' || ctx.args[0] === '-V') return ctx.println('Python 3.12.3');
    if (ctx.args[0] === '-c') { try { pyRun(ctx.args.slice(1).join(' '), ctx); } catch (e) { ctx.err(`Traceback (most recent call last):\n  File "<string>", line 1\n${e.name === 'ReferenceError' ? 'NameError' : 'Error'}: ${e.message}\n`); return 1; } return; }
    if (ctx.args[0]) { try { pyRun(OS.fs.read(ctx.path(ctx.args[0])), ctx); } catch (e) { ctx.err(`Traceback (most recent call last):\n  File "${ctx.args[0]}"\n${e.name === 'ReferenceError' ? 'NameError' : e.name === 'SyntaxError' ? 'SyntaxError' : 'Error'}: ${e.message}\n`); return 1; } return; }
    ctx.println('Python 3.12.3 (cirrus) [GCC 13.2.0] on linux\nType "exit()" to quit. (Cirrus mini-Python: print, math, loops, if, def)');
    let buf = [];
    for (;;) {
      const l = await ctx.readLine(buf.length ? '... ' : '>>> '); if (l == null || /^(exit|quit)\(\)$/.test(l.trim())) break;
      if (l.trim().endsWith(':') || (buf.length && l.trim())) { buf.push(l); continue; }
      const src = buf.length ? buf.join('\n') : l; buf = [];
      if (!src.trim()) continue;
      try { if (!buf.length && /^[^=]+$/.test(src) && !/^(print|for|while|if|def|import)\b/.test(src.trim())) pyRun(`print(${src})`, ctx); else pyRun(src, ctx); }
      catch (e) { ctx.println(`${C.red}Traceback (most recent call last):\n  File "<stdin>", line 1\n${e.name === 'ReferenceError' ? 'NameError' : e.name}: ${e.message}${C.r}`); }
    }
  });
  def('jq', 'JSON processor', (ctx) => { const f = ctx.args[0] || '.'; try { let v = JSON.parse(readInput(ctx, ctx.args.slice(1))); if (f !== '.') f.replace(/^\./, '').split('.').filter(Boolean).forEach((k) => { const m = /^(\w*)\[(\d*)\]$/.exec(k); if (m) { if (m[1]) v = v[m[1]]; if (m[2]) v = v[+m[2]]; } else v = v?.[k]; }); const s = JSON.stringify(v, null, 2) ?? 'null'; ctx.println(ctx.isTTY ? s.replace(/("(?:[^"\\]|\\.)*")(\s*:)?|\b(-?\d+\.?\d*)\b|\b(true|false|null)\b/g, (m, str, colon, num, kw) => (str ? (colon ? C.bblue + str + C.r + colon : C.green + str + C.r) : num ? num : C.gray + kw + C.r)) : s); } catch (e) { ctx.err(`jq: error: ${e.message}\n`); return 2; } });
  /* tiny git */
  def('git', 'version control (local)', async (ctx) => {
    const [sub, ...a] = ctx.args;
    const findRepo = (p) => { while (true) { if (OS.fs.isDir(OS.fs.join(p, '.git'))) return p; if (p === '/') return null; p = OS.fs.dirname(p); } };
    const repo = findRepo(ctx.sh.cwd); const gp = repo && OS.fs.join(repo, '.git/db.json');
    const load = () => JSON.parse(OS.fs.read(gp)); const save = (d) => OS.fs.write(gp, JSON.stringify(d));
    const snapshot = (root) => { const files = {}; OS.fs.find(root, (n, nd, p) => nd.t === 'f' && !p.includes('/.git/')).forEach((p) => (files[p.slice(root.length + 1)] = OS.fs.read(p))); return files; };
    const hash = () => Math.random().toString(16).slice(2, 9) + Math.random().toString(16).slice(2, 9);
    if (sub === '--version' || sub === 'version') return ctx.println('git version 2.43.0');
    if (sub === 'init') { const root = ctx.sh.cwd; OS.fs.mkdir(OS.fs.join(root, '.git'), { p: true }); OS.fs.write(OS.fs.join(root, '.git/db.json'), JSON.stringify({ commits: [], staged: {}, branch: 'main' })); OS.fs.write(OS.fs.join(root, '.git/HEAD'), 'ref: refs/heads/main\n'); return ctx.println(`Initialized empty Git repository in ${root}/.git/`); }
    if (sub === 'clone') { ctx.err(`Cloning into '${(a[0] || '').split('/').pop()?.replace('.git', '')}'...\nfatal: unable to access '${a[0]}': network access for git is not supported in Cirrus. Use curl/wget for raw files.\n`); return 128; }
    if (!repo) { ctx.err('fatal: not a git repository (or any of the parent directories): .git\n'); return 128; }
    const db = load(); const head = db.commits[db.commits.length - 1]; const tree = head ? head.tree : {};
    const work = snapshot(repo);
    const changes = () => { const all = new Set([...Object.keys(tree), ...Object.keys(work)]); const res = []; all.forEach((f) => { const t = f in db.staged ? db.staged[f] : tree[f]; if (!(f in work)) res.push(['deleted', f]); else if (!(f in tree) && !(f in db.staged)) res.push(['untracked', f]); else if (work[f] !== t) res.push(['modified', f]); }); return res; };
    switch (sub) {
      case 'status': {
        ctx.println(`On branch ${db.branch}`); if (!head) ctx.println('\nNo commits yet');
        const st = Object.keys(db.staged); if (st.length) { ctx.println('\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)'); st.forEach((f) => ctx.println(`\t${C.green}${f in tree ? 'modified' : 'new file'}:   ${f}${C.r}`)); }
        const ch = changes(); const mod = ch.filter((c) => c[0] !== 'untracked'), un = ch.filter((c) => c[0] === 'untracked');
        if (mod.length) { ctx.println('\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)'); mod.forEach(([k, f]) => ctx.println(`\t${C.red}${k}:   ${f}${C.r}`)); }
        if (un.length) { ctx.println('\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)'); un.forEach(([, f]) => ctx.println(`\t${C.red}${f}${C.r}`)); }
        if (!st.length && !ch.length) ctx.println('nothing to commit, working tree clean');
        return;
      }
      case 'add': { const all = a.includes('.') || a.includes('-A') || a.includes('--all'); Object.keys(work).forEach((f) => { const abs = OS.fs.join(repo, f); if (all || a.some((x) => ctx.path(x) === abs || abs.startsWith(ctx.path(x) + '/'))) if (work[f] !== tree[f]) db.staged[f] = work[f]; }); save(db); return; }
      case 'commit': { const mi = a.indexOf('-m'); const msg = mi >= 0 ? a[mi + 1] : null; if (a.includes('-a') || a.includes('-am')) changes().forEach(([k, f]) => { if (k === 'modified') db.staged[f] = work[f]; }); const m2 = msg || (a.includes('-am') ? a[a.indexOf('-am') + 1] : null); if (!m2) { ctx.err('error: please supply a message with -m "message"\n'); return 1; } if (!Object.keys(db.staged).length) { ctx.println(`On branch ${db.branch}\nnothing to commit, working tree clean`); return 1; } const h = hash(); const n = Object.keys(db.staged).length; db.commits.push({ h, msg: m2, at: Date.now(), author: OS.settings.fullname, tree: Object.assign({}, tree, db.staged) }); db.staged = {}; save(db); ctx.println(`[${db.branch}${db.commits.length === 1 ? ' (root-commit)' : ''} ${h.slice(0, 7)}] ${m2}\n ${n} file${n > 1 ? 's' : ''} changed`); return; }
      case 'log': { if (!db.commits.length) { ctx.err(`fatal: your current branch '${db.branch}' does not have any commits yet\n`); return 128; } const one = a.includes('--oneline'); db.commits.slice().reverse().forEach((c, i) => ctx.println(one ? `${C.yellow}${c.h.slice(0, 7)}${C.r} ${c.msg}` : `${C.yellow}commit ${c.h}${i === 0 ? ` (${C.bcyan}HEAD -> ${C.bgreen}${db.branch}${C.yellow})` : ''}${C.r}\nAuthor: ${c.author} <${OS.settings.username}@${OS.settings.hostname}>\nDate:   ${new Date(c.at).toString().slice(0, 24)}\n\n    ${c.msg}\n`)); return; }
      case 'diff': { changes().filter(([k]) => k === 'modified').forEach(([, f]) => { ctx.println(`${C.b}diff --git a/${f} b/${f}${C.r}`); const o = (tree[f] || '').split('\n'), n = (work[f] || '').split('\n'); const L = Math.max(o.length, n.length); for (let i = 0; i < L; i++) if (o[i] !== n[i]) { if (o[i] !== undefined) ctx.println(C.red + '-' + o[i] + C.r); if (n[i] !== undefined) ctx.println(C.green + '+' + n[i] + C.r); } }); return; }
      case 'branch': return ctx.println(`* ${C.green}${db.branch}${C.r}`);
      case 'push': case 'pull': case 'fetch': ctx.err("fatal: 'origin' does not appear to be a git repository\n"); return 128;
      default: ctx.println('usage: git <command>\n\n   init, status, add, commit, log, diff, branch'); return sub ? 1 : 0;
    }
  });

  /* ================= terminal UI ================= */
  OS.registerApp({
    id: 'terminal', name: 'Terminal', icon: 'terminal', color: ['#2b2f3a', '#0d0f14'], cat: 'System', w: 760, h: 480, desc: 'Command line', keywords: 'console shell bash command',
    launch(win, args) {
      const light = OS.settings.termTheme === 'light';
      win.body.innerHTML = `<div class="term ${light ? 'light' : ''}" style="font-size:${OS.settings.termFont}px"></div>${OS.isTouch() ? `<div class="term-keys">${['Tab', 'Ctrl', '↑', '↓', '←', '→', 'Ctrl+C', 'Esc', '|', '/', '-', '~', '>', '&', '$', '*'].map((k) => `<button data-k="${k}">${k}</button>`).join('')}</div>` : ''}`;
      const box = win.body.querySelector('.term');
      let inputLine = null, inp = null, ctrl = null, hIdx = -1, draft = '', readResolve = null, busy = false, fullscreenStop = null, tuiStop = null, tuiTa = null, sticky = false;
      const updSticky = () => win.body.querySelectorAll('[data-k=Ctrl]').forEach((b) => b.classList.toggle('on', sticky));
      const term = {
        write(t) { const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40; const parts = String(t).split('\n'); let last = box.lastElementChild && box.lastElementChild.classList.contains('ln') && !box.lastElementChild._closed ? box.lastElementChild : null;
          if (inputLine) inputLine.remove();
          parts.forEach((p, i) => { if (i > 0) { if (last) last._closed = true; last = null; } if (!last) { last = document.createElement('div'); last.className = 'ln'; box.appendChild(last); } if (p) last.insertAdjacentHTML('beforeend', ansiToHtml(p)); });
          if (String(t).endsWith('\n') && last) { if (!last.innerHTML) last.remove(); else last._closed = true; }
          if (inputLine) box.appendChild(inputLine);
          while (box.children.length > 2500) box.firstElementChild.remove();
          if (atBottom || true) box.scrollTop = box.scrollHeight; },
        clear() { box.innerHTML = ''; if (inputLine) box.appendChild(inputLine); },
        cols() { return Math.floor((box.clientWidth - 24) / (OS.settings.termFont * 0.6)); },
        live() { if (inputLine) inputLine.remove(); const el = document.createElement('div'); el.className = 'ln'; el._closed = true; box.appendChild(el); if (inputLine) box.appendChild(inputLine); return { set: (t) => { el.innerHTML = ansiToHtml(t); box.scrollTop = box.scrollHeight; }, done: (rm) => { if (rm) el.remove(); } }; },
        readLine(promptText, secret) { return new Promise((res) => { readResolve = res; showInput(promptText, secret); }); },
        exit() { setTimeout(() => win.close(), 50); },
        fullscreen(setup, bg) { return new Promise((res) => { const fsEl = OS.el('<div class="term-full"><pre></pre></div>'); if (bg) fsEl.style.background = bg; win.body.appendChild(fsEl); const pre = fsEl.querySelector('pre'); let cleanup = null; const done = () => { if (!fsEl.isConnected) return; cleanup && cleanup(); fsEl.remove(); fullscreenStop = null; document.removeEventListener('keydown', kh, true); res(); focus(); }; const kh = (e) => { if (OS.wm.active !== win) return; if (e.key === 'q' || e.key === 'Escape' || (e.ctrlKey && e.key === 'c')) { e.preventDefault(); done(); } }; document.addEventListener('keydown', kh, true); fsEl.addEventListener('click', done); fullscreenStop = done; cleanup = setup(pre, done, fsEl); }); },

        tui(prog) {
          return new Promise((res) => {
            const keysEl = win.body.querySelector('.term-keys:not(.tui-keys)');
            const touch = OS.isTouch();
            const el = OS.el(`<div class="term-tui ${light ? 'light' : ''}"><pre class="tui-scr"></pre><textarea class="tui-in" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false"></textarea><div class="tui-soft" hidden></div>${touch ? `<div class="term-keys tui-keys">${['Esc', 'Ctrl', 'Tab', '↑', '↓', '←', '→', 'PgUp', 'PgDn', 'Home', 'End'].map((k) => `<button data-k="${k}">${k}</button>`).join('')}</div>` : ''}</div>`);
            box.style.display = 'none'; if (keysEl) keysEl.style.display = 'none';
            win.body.insertBefore(el, keysEl || null);
            const pre = el.querySelector('pre'), ta = el.querySelector('textarea'), soft = el.querySelector('.tui-soft');
            const fsz = OS.settings.termFont; pre.style.fontSize = fsz + 'px'; const lh = Math.round(fsz * 1.3); pre.style.lineHeight = lh + 'px';
            let cw = fsz * 0.6, done = false; const timers = [];
            const api = {
              cols: 80, rows: 24, sh, draw, exit,
              interval(f, ms) { const t = setInterval(() => { if (!done) { f(); draw(); } }, ms); timers.push(t); return t; },
              soft(list) { soft.hidden = !list || !list.length; soft.innerHTML = ''; (list || []).forEach((it) => { const b = OS.el(`<button>${it.k ? `<b>${esc(it.k)}</b> ` : ''}${esc(it.label)}</button>`); b.addEventListener('pointerdown', (e) => { e.preventDefault(); (Array.isArray(it.send) ? it.send : [it.send]).forEach((k) => send(k, true)); }); soft.appendChild(b); }); measure(); },
              keyboard() { ta.focus({ preventScroll: true }); },
            };
            function measure() {
              const sp = document.createElement('span'); sp.textContent = 'M'.repeat(50); pre.appendChild(sp); cw = sp.getBoundingClientRect().width / 50 || cw; sp.remove();
              api.cols = Math.max(20, Math.floor((pre.clientWidth - 8) / cw)); api.rows = Math.max(6, Math.floor((pre.clientHeight - 4) / lh));
            }
            function draw() {
              if (done) return; let ls; try { ls = prog.render(api) || []; } catch (e) { console.error(e); ls = ['render error: ' + e.message]; }
              const out = []; for (let i = 0; i < api.rows; i++) out.push(ansiToHtml(ls[i] ?? ''));
              pre.innerHTML = out.join('\n');
            }
            function exit(v) {
              if (done) return; done = true; timers.forEach(clearInterval); ro.disconnect(); prog.close && prog.close();
              el.remove(); box.style.display = ''; if (keysEl) keysEl.style.display = ''; tuiStop = null; tuiTa = null; sticky = false; updSticky();
              box.scrollTop = box.scrollHeight; res(v); setTimeout(focus, 0);
            }
            function send(k, fromSoft) {
              if (done) return;
              if (sticky && !fromSoft && k.length === 1) k = 'C-' + k.toLowerCase();
              if (sticky) { sticky = false; updSticky(); }
              try { prog.key(k, api); } catch (e) { console.error(e); }
              draw();
            }
            const NAMED = ['Enter', 'Backspace', 'Delete', 'Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Insert', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'];
            ta.value = ' ';
            ta.addEventListener('keydown', (e) => {
              if (e.isComposing || e.keyCode === 229 || e.key === 'Unidentified' || e.key === 'Process') return;
              let k = e.key; if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'OS'].includes(k)) return;
              if (e.ctrlKey && !e.altKey && k.length === 1) k = 'C-' + k.toLowerCase();
              else if (e.altKey && !e.ctrlKey && k.length === 1) k = 'M-' + (e.code.startsWith('Key') ? e.code.slice(3).toLowerCase() : k.toLowerCase());
              else if (k.length !== 1 && !NAMED.includes(k)) return;
              if (k === 'C-v' && !prog.wantsCtrlV) return; // allow native paste
              e.preventDefault(); e.stopPropagation(); send(k);
            });
            ta.addEventListener('paste', (e) => { const t = e.clipboardData.getData('text'); e.preventDefault(); if (prog.paste) { prog.paste(t, api); draw(); } else [...t].forEach((c) => send(c === '\n' ? 'Enter' : c)); });
            ta.addEventListener('beforeinput', (e) => {
              const t = e.inputType;
              if (t === 'insertText' && e.data) { e.preventDefault(); [...e.data].forEach((c) => send(c)); }
              else if (t === 'insertLineBreak' || t === 'insertParagraph') { e.preventDefault(); send('Enter'); }
              else if (t === 'deleteContentBackward' && ta.value.length > 0 && ta.selectionStart > 0) { e.preventDefault(); send('Backspace'); }
              else if (t === 'deleteContentForward') { e.preventDefault(); send('Delete'); }
            });
            ta.addEventListener('input', () => { const v = ta.value; if (v.length === 0) send('Backspace'); else if (v.length > 1) [...v.slice(1)].forEach((c) => send(c === '\n' ? 'Enter' : c)); ta.value = ' '; ta.setSelectionRange(1, 1); });
            // pointer: tap = click / focus, drag = scroll
            let py = null, px = null, acc = 0, moved = false;
            pre.addEventListener('pointerdown', (e) => { e.preventDefault(); py = e.clientY; px = e.clientX; acc = 0; moved = false; pre.setPointerCapture(e.pointerId); });
            pre.addEventListener('pointermove', (e) => { if (py == null) return; const dy = e.clientY - py; if (Math.abs(dy) > 6 || Math.abs(e.clientX - px) > 6) moved = true; acc += dy; py = e.clientY; while (Math.abs(acc) >= lh) { send(acc > 0 ? 'WheelUp' : 'WheelDown'); acc -= Math.sign(acc) * lh; } });
            pre.addEventListener('pointerup', (e) => {
              if (py == null) return; py = null;
              if (!moved) { const r = pre.getBoundingClientRect(); const col = Math.floor((e.clientX - r.left - 4) / cw), row = Math.floor((e.clientY - r.top - 2) / lh); if (prog.click) { prog.click(col, row, api); draw(); } if (!touch || prog.wantsKeyboard) ta.focus({ preventScroll: true }); }
            });
            pre.addEventListener('wheel', (e) => { e.preventDefault(); const n = Math.max(1, Math.round(Math.abs(e.deltaY) / 40)); for (let i = 0; i < n; i++) send(e.deltaY > 0 ? 'WheelDown' : 'WheelUp'); }, { passive: false });
            el.querySelectorAll('.tui-keys button').forEach((b) => b.addEventListener('pointerdown', (e) => {
              e.preventDefault(); const k = b.dataset.k;
              if (k === 'Ctrl') { sticky = !sticky; updSticky(); return; }
              send({ Esc: 'Escape', Tab: 'Tab', '↑': 'ArrowUp', '↓': 'ArrowDown', '←': 'ArrowLeft', '→': 'ArrowRight', PgUp: 'PageUp', PgDn: 'PageDown', Home: 'Home', End: 'End' }[k], true);
            }));
            const ro = new ResizeObserver(() => { if (done) return; const c = api.cols, r = api.rows; measure(); if (c !== api.cols || r !== api.rows) { prog.resize && prog.resize(api); draw(); } });
            ro.observe(pre);
            tuiStop = () => exit(); tuiTa = ta;
            measure(); try { prog.init && prog.init(api); } catch (e) { console.error(e); }
            draw();
            if (!touch || prog.wantsKeyboard) setTimeout(() => ta.focus({ preventScroll: true }), 30);
          });
        },
        signal: null,
      };
      const sh = new Shell(term, { cwd: args.cwd });
      win.shell = sh;
      function showInput(promptText, secret) {
        if (inputLine) inputLine.remove();
        inputLine = OS.el(`<div class="inl"><span class="pr"></span><input type="${secret ? 'password' : 'text'}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"></div>`);
        inputLine.querySelector('.pr').innerHTML = ansiToHtml(promptText);
        box.appendChild(inputLine); inp = inputLine.querySelector('input'); inp.onkeydown = onKey;
        inp.addEventListener('beforeinput', (e) => { if (sticky && e.data) { e.preventDefault(); sticky = false; updSticky(); onKey({ key: e.data.slice(-1).toLowerCase(), ctrlKey: true, preventDefault() {} }); } });
        box.scrollTop = box.scrollHeight; focus();
      }
      function focus() { if (tuiTa) { if (OS.wm.active === win) tuiTa.focus({ preventScroll: true }); return; } if (inp && OS.wm.active === win && !window.getSelection().toString()) inp.focus({ preventScroll: true }); }
      async function submit(line) {
        const pr = inputLine.querySelector('.pr').innerHTML; const secret = inp.type === 'password';
        inputLine.remove(); inputLine = null;
        const echo = document.createElement('div'); echo.className = 'ln'; echo._closed = true; echo.innerHTML = pr + esc(secret ? '' : line); box.appendChild(echo);
        if (readResolve) { const r = readResolve; readResolve = null; r(line); return; }
        sh.addHistory(line); hIdx = -1; draft = '';
        if (line.trim()) {
          busy = true; ctrl = new AbortController(); term.signal = ctrl.signal;
          if (line.trim() === '!!' && sh.history.length > 1) line = sh.history[sh.history.length - 2];
          try { await sh.run(line, term); } catch (e) { term.write(`bash: ${e.message}\n`); }
          busy = false; ctrl = null; term.signal = null;
        }
        if (win._closing) return;
        showInput(sh.prompt());
      }
      function complete() {
        const v = inp.value.slice(0, inp.selectionStart); const rest = inp.value.slice(inp.selectionStart);
        const m = /(\S*)$/.exec(v); const word = m[1]; const isCmd = !v.slice(0, v.length - word.length).trim();
        let cands = [];
        if (isCmd && !word.includes('/')) cands = [...new Set([...sh.commandNames(), ...Object.keys(sh.aliases)])].filter((c) => c.startsWith(word));
        else {
          const dirPart = word.includes('/') ? word.slice(0, word.lastIndexOf('/') + 1) : ''; const base = word.slice(dirPart.length);
          const dir = OS.fs.norm(dirPart || '.', sh.cwd);
          if (OS.fs.isDir(dir)) cands = OS.fs.ls(dir).filter((it) => it.name.startsWith(base) && (base.startsWith('.') || !it.name.startsWith('.'))).map((it) => dirPart + it.name + (it.type === 'dir' ? '/' : ''));
          if (/^(sudo )?apt(-get)? (install|remove|show) /.test(v)) cands = Object.keys(OS.pkg.repo).filter((n) => n.startsWith(word));
        }
        if (!cands.length) return;
        if (cands.length === 1) { const c = cands[0] + (cands[0].endsWith('/') ? '' : ' '); inp.value = v.slice(0, v.length - word.length) + c + rest; inp.setSelectionRange(inp.value.length - rest.length, inp.value.length - rest.length); return; }
        let pre = cands[0]; cands.forEach((c) => { while (!c.startsWith(pre)) pre = pre.slice(0, -1); });
        if (pre.length > word.length) { inp.value = v.slice(0, v.length - word.length) + pre + rest; return; }
        const pr = inputLine.querySelector('.pr').innerHTML; const cur = inp.value; inputLine.remove(); inputLine = null;
        const echo = document.createElement('div'); echo.className = 'ln'; echo._closed = true; echo.innerHTML = pr + esc(cur); box.appendChild(echo);
        term.write(cands.map((c) => c.split('/').filter(Boolean).pop() + (c.endsWith('/') ? '/' : '')).join('  ') + '\n');
        showInput(sh.prompt()); inp.value = cur;
      }
      function onKey(e) {
        if (e.key === 'Enter') { e.preventDefault(); submit(inp.value); }
        else if (e.key === 'Tab') { e.preventDefault(); if (!readResolve) complete(); }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          if (readResolve) return; e.preventDefault(); const h = sh.history; if (!h.length) return;
          if (hIdx === -1) { draft = inp.value; hIdx = h.length; }
          hIdx = OS.clamp(hIdx + (e.key === 'ArrowUp' ? -1 : 1), 0, h.length);
          inp.value = hIdx === h.length ? draft : h[hIdx]; setTimeout(() => inp.setSelectionRange(inp.value.length, inp.value.length));
        }
        else if (e.ctrlKey && (e.key === 'c' || e.key === 'C') && !window.getSelection().toString()) { e.preventDefault(); interrupt(); }
        else if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); term.clear(); }
        else if (e.ctrlKey && (e.key === 'd' || e.key === 'D') && !inp.value) { e.preventDefault(); if (readResolve) { const r = readResolve; readResolve = null; inputLine.remove(); inputLine = null; r(null); } else win.close(); }
        else if (e.ctrlKey && e.key === 'u') { e.preventDefault(); inp.value = ''; }
      }
      function interrupt() {
        if (fullscreenStop) return fullscreenStop();
        const pr = inputLine ? inputLine.querySelector('.pr').innerHTML : ''; const cur = inp ? inp.value : '';
        if (readResolve) { const r = readResolve; readResolve = null; if (inputLine) { inputLine.remove(); inputLine = null; } term.write('^C\n'); r(null); if (ctrl) ctrl.abort(); return; }
        if (busy && ctrl) { ctrl.abort(); term.write('^C\n'); return; }
        if (inputLine) { inputLine.remove(); inputLine = null; const echo = document.createElement('div'); echo.className = 'ln'; echo._closed = true; echo.innerHTML = pr + esc(cur) + '^C'; box.appendChild(echo); showInput(sh.prompt()); }
      }
      box.addEventListener('mouseup', () => { if (!window.getSelection().toString()) focus(); });
      box.addEventListener('click', () => focus());
      win.onFocus = () => setTimeout(focus, 0);
      win.onClose(() => { if (ctrl) ctrl.abort(); if (fullscreenStop) fullscreenStop(); if (tuiStop) tuiStop(); });
      win.body.querySelectorAll('.term-keys button').forEach((b) => b.addEventListener('pointerdown', (e) => {
        e.preventDefault(); const k = b.dataset.k;
        if (!inp) return;
        if (k === 'Ctrl') { sticky = !sticky; updSticky(); return; }
        if (k === 'Tab') complete(); else if (k === '↑' || k === '↓') onKey({ key: k === '↑' ? 'ArrowUp' : 'ArrowDown', preventDefault() {} });
        else if (k === 'Ctrl+C') interrupt(); else if (k === 'Esc') inp.value = '';
        else if (k === '←' || k === '→') { const p = inp.selectionStart + (k === '←' ? -1 : 1); inp.setSelectionRange(p, p); }
        else { const s = inp.selectionStart; inp.value = inp.value.slice(0, s) + k + inp.value.slice(inp.selectionEnd); inp.setSelectionRange(s + 1, s + 1); }
        inp.focus();
      }));
      // context menu
      OS.onContext(box, (e, x, y) => OS.menu(x, y, [
        { label: 'Copy', icon: 'copy', key: 'Ctrl+Shift+C', action: () => navigator.clipboard?.writeText(window.getSelection().toString()) },
        { label: 'Paste', icon: 'clipboard', key: 'Ctrl+Shift+V', action: async () => { try { const t = await navigator.clipboard.readText(); if (inp) { inp.value += t; inp.focus(); } } catch (er) {} } },
        '-', { label: 'Clear', icon: 'x', action: () => term.clear() },
        { label: 'Zoom in', icon: 'zoomin', action: () => { OS.set('termFont', Math.min(24, OS.settings.termFont + 1)); box.style.fontSize = OS.settings.termFont + 'px'; } },
        { label: 'Zoom out', icon: 'zoomout', action: () => { OS.set('termFont', Math.max(9, OS.settings.termFont - 1)); box.style.fontSize = OS.settings.termFont + 'px'; } },
        { label: 'New Terminal', icon: 'terminal', action: () => OS.wm.open('terminal', { cwd: sh.cwd }) },
      ]));
      // intro
      if (!args.cmd) term.write(`${C.b}Cirrus Linux ${OS.version}${C.r} (${OS.codename}) — type ${C.green}help${C.r} for commands, ${C.green}neofetch${C.r} for system info.\n\n`);
      (async () => {
        if (args.cmd) { term.write(ansiToHtml && sh.prompt() + args.cmd + '\n'); busy = true; ctrl = new AbortController(); term.signal = ctrl.signal; await sh.run(args.cmd, term); busy = false; ctrl = null; term.signal = null; }
        showInput(sh.prompt());
      })();
    },
  });
  OS.ansiToHtml = ansiToHtml;
  Object.assign(OS.shell, { def, opts, readInput, lines, C, stripAnsi, procs, uptimeStr });
})();
