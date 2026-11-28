/* Cirrus Linux — persistent virtual file system (stored in localStorage) */
(function () {
  'use strict';
  const now = () => Date.now();
  const D = (c = {}) => ({ t: 'd', c, m: now() });
  const F = (d = '') => ({ t: 'f', d, m: now() });

  function picture(hue1, hue2, shape) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue1},80%,60%)"/><stop offset="1" stop-color="hsl(${hue2},80%,45%)"/></linearGradient></defs><rect width="800" height="500" fill="url(#a)"/>${shape}</svg>`;
  }

  function makeDefault(user) {
    const home = D({
      Desktop: D({
        'Welcome.txt': F(`Welcome to Cirrus Linux!\n========================\n\nThis is a complete desktop that runs in your browser.\nEverything you create is saved on this device.\n\nThings to try:\n  • Open the Terminal and run:  neofetch\n  • Install software:           sudo apt install cowsay\n                                cowsay "Hello!"\n  • Browse the web with the Browser app\n  • Change themes, accent colors and wallpapers in Settings\n  • Play games from the app menu (Games category)\n  • Right-click (or long-press on touch) for context menus\n  • Drag files from your real computer onto the Files app to import them\n\nKeyboard shortcuts:\n  Ctrl+Alt+T   open a terminal\n  Alt+Space    open the app menu\n  Ctrl+S       save (in the Text Editor)\n\nHave fun!\n`),
      }),
      Documents: D({
        'notes.md': F(`# My notes\n\n- [x] Boot Cirrus Linux\n- [ ] Customize the desktop\n- [ ] Beat my Snake high score\n\n## Ideas\nWrite a shell script in ~/Documents/hello.sh and run it with:\n\n    sh ~/Documents/hello.sh\n`),
        'todo.txt': F('buy milk\nwater the plants\nlearn grep\ncall mum\nfinish the project\n'),
        'hello.sh': F(`#!/bin/sh\n# A tiny shell script. Run it with: sh hello.sh\necho "Hello from a shell script, $USER!"\necho "Today is $(date)"\necho "You are in: $(pwd)"\nls ~\n`),
        'page.html': F(`<!doctype html>\n<html>\n<head><title>My first page</title>\n<style>body{font-family:system-ui;background:linear-gradient(135deg,#6c8cff,#b06cff);color:#fff;display:grid;place-items:center;height:100vh;margin:0}button{font-size:20px;padding:10px 20px;border-radius:12px;border:0}</style>\n</head>\n<body>\n<div style="text-align:center">\n<h1>Hello from Cirrus!</h1>\n<p>This page lives in ~/Documents/page.html</p>\n<button onclick="this.textContent='Clicked ' + (++window.n||(window.n=1)) + 'x'">Click me</button>\n</div>\n</body>\n</html>\n`),
        'budget.csv': F('item,cost\nrent,800\nfood,250\ninternet,30\nfun,100\n'),
        'script.js': F(`// Run with: node script.js   (install nodejs first: sudo apt install nodejs)\nconst fib = n => n < 2 ? n : fib(n - 1) + fib(n - 2);\nfor (let i = 0; i < 10; i++) console.log('fib(' + i + ') =', fib(i));\n`),
      }),
      Downloads: D(),
      Music: D(),
      Pictures: D({
        'sunrise.svg': F(picture(30, 340, '<circle cx="400" cy="330" r="110" fill="#ffe7a0" opacity=".95"/><path d="M0 380 Q200 320 400 380 T800 370 V500 H0Z" fill="#3a1d4f" opacity=".85"/>')),
        'ocean.svg': F(picture(195, 230, '<path d="M0 300 C150 250 250 350 400 300 S650 250 800 300 V500 H0Z" fill="#fff" opacity=".25"/><path d="M0 360 C150 310 250 410 400 360 S650 310 800 360 V500 H0Z" fill="#fff" opacity=".35"/><circle cx="640" cy="120" r="50" fill="#fff" opacity=".8"/>')),
        'shapes.svg': F(picture(260, 300, '<circle cx="220" cy="250" r="110" fill="#fff" opacity=".3"/><rect x="380" y="140" width="200" height="200" rx="30" fill="#fff" opacity=".45" transform="rotate(15 480 240)"/><path d="M640 360 L720 200 L800 360Z" fill="#fff" opacity=".35"/>')),
        'forest.svg': F(picture(120, 160, '<g fill="#0d3b25">' + [60, 160, 260, 360, 460, 560, 660, 760].map((x, i) => `<path d="M${x} ${180 + (i % 3) * 30} L${x + 60} 430 L${x - 60} 430Z"/>`).join('') + '</g><rect y="420" width="800" height="80" fill="#0a2a1a"/>')),
      }),
      Videos: D(),
      Public: D(),
      '.bashrc': F(`# ~/.bashrc\nalias ll='ls -la'\nalias la='ls -a'\nalias ..='cd ..'\nexport EDITOR=nano\n`),
      '.profile': F('# ~/.profile\n'),
      '.local': D({ share: D({ Trash: D() }) }),
      '.config': D(),
    });
    return D({
      bin: D(), boot: D({ 'vmlinuz-6.8.0-cirrus': F('\x7fELF (kernel image)'), 'initrd.img': F('initramfs') }),
      dev: D({ null: F(''), zero: F(''), random: F(''), tty: F('') }),
      etc: D({
        hostname: F('cirrus\n'),
        'os-release': F(`PRETTY_NAME="Cirrus Linux 24.11 (Nimbus)"\nNAME="Cirrus Linux"\nVERSION_ID="24.11"\nVERSION="24.11 (Nimbus)"\nVERSION_CODENAME=nimbus\nID=cirrus\nID_LIKE=debian\nHOME_URL="https://cirruslinux.example"\n`),
        passwd: F(`root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\n${user}:x:1000:1000:${user}:/home/${user}:/bin/bash\n`),
        hosts: F('127.0.0.1\tlocalhost\n127.0.1.1\tcirrus\n::1\tlocalhost ip6-localhost\n'),
        motd: F('Welcome to Cirrus Linux 24.11 (Nimbus)\n\n * Documentation:  type "help"\n * Software:       sudo apt install <package>\n\n'),
        shells: F('/bin/sh\n/bin/bash\n'), timezone: F(Intl.DateTimeFormat().resolvedOptions().timeZone + '\n'),
        fstab: F('# <file system> <mount point> <type> <options>\nlocalStorage  /  cirrusfs  defaults  0 1\n'),
        apt: D({ 'sources.list': F('deb http://archive.cirruslinux.example/cirrus nimbus main restricted universe\ndeb http://archive.cirruslinux.example/cirrus nimbus-updates main\ndeb http://security.cirruslinux.example/cirrus nimbus-security main\n') }),
      }),
      home: D({ [user]: home }),
      lib: D(), media: D(), mnt: D(), opt: D(),
      proc: D({ cpuinfo: F(''), meminfo: F(''), uptime: F(''), version: F(''), loadavg: F('') }),
      root: D(), run: D(), sbin: D(), srv: D(),
      tmp: D(),
      usr: D({ bin: D(), lib: D(), local: D({ bin: D() }), share: D({ applications: D(), doc: D(), fonts: D(), icons: D() }) }),
      var: D({ log: D({ syslog: F(`${new Date().toUTCString()} cirrus kernel: Linux version 6.8.0-cirrus\n${new Date().toUTCString()} cirrus systemd[1]: Started Cirrus Desktop.\n`), 'apt': D({ 'history.log': F('') }) }), cache: D(), lib: D({ dpkg: D() }), tmp: D() }),
    });
  }

  let root = null;
  let saveTimer = null;
  const fs = (OS.fs = {});

  fs.load = () => {
    root = OS.store.get('fs', null);
    if (!root || root.t !== 'd') { root = makeDefault(OS.settings.username); fs.saveNow(); }
  };
  fs.saveNow = () => { clearTimeout(saveTimer); saveTimer = null; OS.store.set('fs', root); };
  fs.save = () => { if (!saveTimer) saveTimer = setTimeout(fs.saveNow, 300); };
  window.addEventListener('beforeunload', () => { if (saveTimer) fs.saveNow(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && saveTimer) fs.saveNow(); });
  fs.reset = () => { root = makeDefault(OS.settings.username); fs.saveNow(); OS.emit('fs', '/'); };

  const err = (p, m = 'No such file or directory') => { const e = new Error(`${p}: ${m}`); e.code = m; return e; };

  fs.norm = (p, cwd = OS.home()) => {
    p = String(p || '').trim() || '.';
    if (p === '~' || p.startsWith('~/')) p = OS.home() + p.slice(1);
    if (!p.startsWith('/')) p = cwd.replace(/\/$/, '') + '/' + p;
    const out = [];
    for (const part of p.split('/')) { if (!part || part === '.') continue; if (part === '..') out.pop(); else out.push(part); }
    return '/' + out.join('/');
  };
  fs.join = (...a) => fs.norm(a.join('/'), '/');
  fs.dirname = (p) => { p = fs.norm(p, '/'); const i = p.lastIndexOf('/'); return i <= 0 ? '/' : p.slice(0, i); };
  fs.basename = (p) => { p = fs.norm(p, '/'); return p === '/' ? '/' : p.slice(p.lastIndexOf('/') + 1); };
  fs.pretty = (p) => { const h = OS.home(); return p === h ? '~' : p.startsWith(h + '/') ? '~' + p.slice(h.length) : p; };

  const node = (p) => {
    p = fs.norm(p, '/'); if (p === '/') return root;
    let n = root;
    for (const part of p.slice(1).split('/')) { if (!n || n.t !== 'd') return null; n = n.c[part]; }
    return n || null;
  };
  fs.node = node;
  const parentOf = (p) => { const dp = fs.dirname(p), dn = node(dp); if (!dn) throw err(dp); if (dn.t !== 'd') throw err(dp, 'Not a directory'); return dn; };
  const touchMod = (p) => { let x = root; x.m = now(); for (const part of fs.norm(p, '/').slice(1).split('/').slice(0, -1)) { x = x.c[part]; if (!x) break; x.m = now(); } };
  const changed = (p) => { fs.save(); OS.emit('fs', fs.dirname(p), p); };

  /* virtual files */
  const PROC = {
    '/proc/cpuinfo': () => { const n = navigator.hardwareConcurrency || 4; let s = ''; for (let i = 0; i < n; i++) s += `processor\t: ${i}\nvendor_id\t: CirrusVirtual\nmodel name\t: Cirrus vCPU @ 3.20GHz\ncpu MHz\t\t: 3200.000\ncache size\t: 8192 KB\ncpu cores\t: ${n}\n\n`; return s; },
    '/proc/meminfo': () => { const tot = (navigator.deviceMemory || 8) * 1048576, used = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024) : 812340; return `MemTotal:       ${tot} kB\nMemFree:        ${tot - used - 1200000} kB\nMemAvailable:   ${tot - used} kB\nBuffers:          98304 kB\nCached:          1100000 kB\nSwapTotal:      2097148 kB\nSwapFree:       2097148 kB\n`; },
    '/proc/uptime': () => { const u = (Date.now() - OS.bootTime) / 1000; return `${u.toFixed(2)} ${(u * 3.6).toFixed(2)}\n`; },
    '/proc/version': () => `Linux version ${OS.kernel} (builder@cirrus) (gcc 13.2.0) #1 SMP PREEMPT_DYNAMIC ${new Date(OS.bootTime).toUTCString()}\n`,
    '/proc/loadavg': () => `${(Math.random() * .6 + .1).toFixed(2)} ${(Math.random() * .5 + .2).toFixed(2)} ${(Math.random() * .4 + .2).toFixed(2)} 1/214 4242\n`,
    '/dev/random': () => Array.from({ length: 64 }, () => String.fromCharCode(33 + Math.random() * 94 | 0)).join(''),
    '/dev/zero': () => '\0'.repeat(32),
  };
  const virtualDirs = () => ({ '/bin': OS.shell ? OS.shell.commandNames() : [], '/usr/bin': OS.shell ? OS.shell.commandNames() : [], '/usr/share/applications': Object.keys(OS.apps).filter((id) => OS.pkg ? OS.pkg.appAvailable(id) : true).map((id) => id + '.desktop') });

  fs.exists = (p) => !!node(p) || (PROC[fs.norm(p, '/')] !== undefined);
  fs.isDir = (p) => { const n = node(p); return !!n && n.t === 'd'; };
  fs.isFile = (p) => { const n = node(p); return !!n && n.t === 'f'; };
  fs.sizeOf = (n) => (!n ? 0 : n.t === 'f' ? (n.d || '').length : Object.values(n.c).reduce((a, x) => a + fs.sizeOf(x), 0));
  fs.count = (n) => (!n || n.t === 'f' ? 1 : Object.values(n.c).reduce((a, x) => a + fs.count(x), 1));
  fs.stat = (p) => {
    p = fs.norm(p, '/'); const n = node(p); if (!n) throw err(p);
    return { path: p, name: fs.basename(p), type: n.t === 'd' ? 'dir' : 'file', size: n.t === 'f' ? (n.d || '').length : Object.keys(n.c).length, bytes: fs.sizeOf(n), mtime: n.m || now(), items: n.t === 'd' ? Object.keys(n.c).length : 0 };
  };
  fs.ls = (p) => {
    p = fs.norm(p, '/'); const n = node(p); if (!n) throw err(p); if (n.t !== 'd') return [fs.stat(p)];
    const items = Object.keys(n.c).map((name) => { const c = n.c[name]; return { name, path: fs.join(p, name), type: c.t === 'd' ? 'dir' : 'file', size: c.t === 'f' ? (c.d || '').length : Object.keys(c.c).length, mtime: c.m || 0 }; });
    const v = virtualDirs()[p]; if (v) v.forEach((name) => { if (!n.c[name]) items.push({ name, path: fs.join(p, name), type: 'file', size: 0, mtime: OS.bootTime, virtual: true }); });
    return items.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }) : a.type === 'dir' ? -1 : 1));
  };
  fs.read = (p) => {
    p = fs.norm(p, '/'); if (PROC[p]) return PROC[p]();
    const vd = virtualDirs(); const dp = fs.dirname(p); if (vd[dp] && vd[dp].includes(fs.basename(p)) && !node(p)) return dp.includes('applications') ? `[Desktop Entry]\nType=Application\nName=${OS.apps[fs.basename(p).replace('.desktop', '')]?.name}\nExec=${fs.basename(p).replace('.desktop', '')}\n` : '\x7fELF\x02\x01\x01 (binary)';
    const n = node(p); if (!n) throw err(p); if (n.t === 'd') throw err(p, 'Is a directory'); return n.d || '';
  };
  fs.write = (p, data, opts = {}) => {
    p = fs.norm(p, '/'); if (p === '/') throw err(p, 'Is a directory');
    if (p.startsWith('/proc/')) throw err(p, 'Permission denied');
    const dn = parentOf(p), name = fs.basename(p), ex = dn.c[name];
    if (ex && ex.t === 'd') throw err(p, 'Is a directory');
    if (ex) { ex.d = opts.append ? (ex.d || '') + data : String(data); ex.m = now(); } else dn.c[name] = F(String(data));
    touchMod(p); changed(p); return p;
  };
  fs.append = (p, data) => fs.write(p, data, { append: true });
  fs.touch = (p) => { p = fs.norm(p, '/'); const n = node(p); if (n) { n.m = now(); changed(p); } else fs.write(p, ''); };
  fs.mkdir = (p, opts = {}) => {
    p = fs.norm(p, '/');
    if (opts.p) { let cur = ''; for (const part of p.slice(1).split('/')) { if (!part) continue; cur += '/' + part; const n = node(cur); if (!n) { parentOf(cur).c[part] = D(); } else if (n.t !== 'd') throw err(cur, 'Not a directory'); } changed(p); return p; }
    if (node(p)) throw err(p, 'File exists');
    parentOf(p).c[fs.basename(p)] = D(); touchMod(p); changed(p); return p;
  };
  fs.rm = (p, opts = {}) => {
    p = fs.norm(p, '/'); if (p === '/') throw err(p, 'Permission denied (refusing to remove root)');
    const n = node(p); if (!n) { if (opts.f) return; throw err(p); }
    if (n.t === 'd' && !opts.r && Object.keys(n.c).length) throw err(p, 'Is a directory');
    delete parentOf(p).c[fs.basename(p)]; touchMod(p); changed(p);
  };
  const clone = (n) => JSON.parse(JSON.stringify(n));
  fs.cp = (src, dst, opts = {}) => {
    src = fs.norm(src, '/'); dst = fs.norm(dst, '/'); const n = node(src); if (!n) throw err(src);
    if (n.t === 'd' && !opts.r) throw err(src, 'Is a directory (use -r)');
    if (fs.isDir(dst)) dst = fs.join(dst, fs.basename(src));
    if (dst === src || dst.startsWith(src + '/')) throw err(dst, 'Cannot copy a directory into itself');
    const c = clone(n); c.m = now(); parentOf(dst).c[fs.basename(dst)] = c; touchMod(dst); changed(dst); return dst;
  };
  fs.mv = (src, dst) => {
    src = fs.norm(src, '/'); dst = fs.norm(dst, '/'); const n = node(src); if (!n) throw err(src);
    if (fs.isDir(dst)) dst = fs.join(dst, fs.basename(src));
    if (dst === src) return dst;
    if (dst.startsWith(src + '/')) throw err(dst, 'Cannot move a directory into itself');
    const dp = parentOf(dst); delete parentOf(src).c[fs.basename(src)]; dp.c[fs.basename(dst)] = n; n.m = now();
    touchMod(dst); fs.save(); OS.emit('fs', fs.dirname(src), src); OS.emit('fs', fs.dirname(dst), dst); return dst;
  };
  fs.find = (p, pred, max = 500) => {
    const out = []; const walk = (path, n) => { if (out.length >= max) return; if (pred(fs.basename(path), n, path)) out.push(path); if (n.t === 'd') for (const k of Object.keys(n.c)) walk(fs.join(path, k), n.c[k]); };
    const n = node(p); if (n) walk(fs.norm(p, '/'), n); return out;
  };
  fs.uniqueName = (dir, base) => { if (!fs.exists(fs.join(dir, base))) return fs.join(dir, base); const m = /^(.*?)(\.[^.]*)?$/.exec(base); for (let i = 2; i < 999; i++) { const p = fs.join(dir, `${m[1]} ${i}${m[2] || ''}`); if (!fs.exists(p)) return p; } return fs.join(dir, base + Date.now()); };
  fs.totalSize = () => fs.sizeOf(root);

  /* trash */
  const TRASH = () => OS.home() + '/.local/share/Trash';
  fs.trashPath = TRASH;
  fs.trash = (p) => {
    p = fs.norm(p, '/'); fs.mkdir(TRASH(), { p: true });
    if (p.startsWith(TRASH())) { fs.rm(p, { r: true }); return; }
    const dst = fs.uniqueName(TRASH(), fs.basename(p));
    const info = OS.store.get('trashinfo', {}); info[fs.basename(dst)] = { from: p, at: Date.now() }; OS.store.set('trashinfo', info);
    fs.mv(p, dst); OS.sound('trash'); OS.emit('trash');
  };
  fs.restore = (p) => {
    const info = OS.store.get('trashinfo', {}); const name = fs.basename(p); const meta = info[name];
    let to = meta ? meta.from : fs.join(OS.home(), name); if (!fs.isDir(fs.dirname(to))) fs.mkdir(fs.dirname(to), { p: true });
    if (fs.exists(to)) to = fs.uniqueName(fs.dirname(to), fs.basename(to));
    fs.mv(p, to); delete info[name]; OS.store.set('trashinfo', info); OS.emit('trash'); return to;
  };
  fs.emptyTrash = () => { const t = node(TRASH()); if (t) { t.c = {}; changed(TRASH() + '/x'); } OS.store.set('trashinfo', {}); OS.emit('trash'); };
  fs.trashCount = () => { const t = node(TRASH()); return t ? Object.keys(t.c).length : 0; };

  /* switch the whole system to a new user account: home folder, /etc files, paths inside files and app data */
  fs.applyAccount = async ({ oldUser, user, fullname, host, password }) => {
    if (oldUser && oldUser !== user) fs.renameHome(oldUser, user);
    if (!node('/home/' + user)) { const h = node('/home'); h.c[user] = makeDefault(user).c.home.c[user]; }
    const re = oldUser && oldUser !== user ? new RegExp('/home/' + oldUser.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=[/\\s"\'`:;,)\\]}]|$)', 'g') : null;
    if (re) {
      (function walk(n, path) { if (path === '/proc') return; if (n.t === 'd') { for (const k in n.c) walk(n.c[k], path === '/' ? '/' + k : path + '/' + k); return; } if (typeof n.d === 'string' && !n.d.startsWith('data:') && n.d.length < 2e6 && re.test(n.d)) { re.lastIndex = 0; n.d = n.d.replace(re, '/home/' + user); } re.lastIndex = 0; })(root, '/');
      try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (!k.startsWith('cirrus.') || k === 'cirrus.fs' || k === 'cirrus.settings') continue; const v = localStorage.getItem(k); if (v && v.includes('/home/' + oldUser)) localStorage.setItem(k, v.replace(re, '/home/' + user)); } } catch (e) {}
    }
    const hash = password ? '$6$cirrus$' + Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('cirrus:' + password)))).map((b) => b.toString(16).padStart(2, '0')).join('') : '!';
    const day = Math.floor(Date.now() / 864e5);
    const etc = node('/etc');
    etc.c.passwd = F(`root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nmessagebus:x:100:102::/nonexistent:/usr/sbin/nologin\n${user}:x:1000:1000:${fullname || user},,,:/home/${user}:/bin/bash\n`);
    etc.c.group = F(`root:x:0:\nadm:x:4:${user}\ncdrom:x:24:${user}\nsudo:x:27:${user}\naudio:x:29:${user}\nvideo:x:44:${user}\nplugdev:x:46:${user}\nusers:x:100:${user}\n${user}:x:1000:\n`);
    etc.c.shadow = F(`root:*:${day}:0:99999:7:::\ndaemon:*:${day}:0:99999:7:::\n${user}:${hash}:${day}:0:99999:7:::\n`);
    if (host) { etc.c.hostname = F(host + '\n'); etc.c.hosts = F(`127.0.0.1\tlocalhost\n127.0.1.1\t${host}\n::1\tlocalhost ip6-localhost\n`); }
    const log = node('/var/log'); if (log) log.c['auth.log'] = F(`${new Date().toUTCString()} ${host || 'cirrus'} useradd[812]: new user: name=${user}, UID=1000, GID=1000, home=/home/${user}, shell=/bin/bash\n${new Date().toUTCString()} ${host || 'cirrus'} passwd[815]: password changed for ${user}\n`);
    fs.saveNow(); OS.emit('fs', '/');
  };
  /* rename home when username changes */
  fs.renameHome = (oldU, newU) => {
    const h = node('/home'); if (!h || !h.c[oldU] || h.c[newU]) return;
    h.c[newU] = h.c[oldU]; delete h.c[oldU]; fs.save(); OS.emit('fs', '/home');
  };
})();
