/* Cirrus Linux — core apps: Files, Trash, Text Editor, Browser, Settings, Software */
(function () {
  'use strict';
  const esc = OS.esc, gl = OS.glyph, fs = () => OS.fs;

  /* ======================= FILES ======================= */
  const SIDE = () => [
    ['Home', OS.home(), 'home'], ['Desktop', OS.home() + '/Desktop', 'monitor'], ['Documents', OS.home() + '/Documents', 'filetext'], ['Downloads', OS.home() + '/Downloads', 'download'],
    ['Music', OS.home() + '/Music', 'music'], ['Pictures', OS.home() + '/Pictures', 'image'], ['Videos', OS.home() + '/Videos', 'video'], ['Trash', OS.fs.trashPath(), 'trash'], ['Computer', '/', 'hdd'],
  ];
  function filesApp(win, args, trashMode) {
    let cur = args.path && OS.fs.isDir(args.path) ? OS.fs.norm(args.path) : trashMode ? OS.fs.trashPath() : OS.home();
    let hist = [cur], hi = 0, sel = new Set(), view = OS.store.get('fm-view', 'grid'), showHidden = false, filter = '', lastClicked = null;
    win.body.innerHTML = `
      <div class="toolbar">
        <button class="ibtn side-toggle" data-a="side">${gl('sidebar')}</button>
        <button class="ibtn" data-a="back" title="Back">${gl('left')}</button><button class="ibtn" data-a="fwd" title="Forward">${gl('right')}</button><button class="ibtn hide-m" data-a="up" title="Up">${gl('arrowup')}</button>
        <div class="fm-path"></div>
        <button class="ibtn" data-a="search" title="Search">${gl('search')}</button>
        <button class="ibtn" data-a="view" title="Toggle view"></button>
        <button class="ibtn" data-a="more" title="Menu">${gl('dots')}</button>
      </div>
      <div class="toolbar fm-searchbar" hidden><input class="inp" style="flex:1" placeholder="Filter files in this folder…"><button class="ibtn" data-a="closesearch">${gl('x')}</button></div>
      <div class="split" style="position:relative">
        <div class="sidebar"></div>
        <div class="scroll fm-main" tabindex="0" style="outline:0"></div>
      </div>
      <div class="statusbar"><span class="fm-status"></span><span class="spacer"></span><span class="fm-free"></span></div>`;
    const $ = (s) => win.body.querySelector(s);
    const main = $('.fm-main'), side = $('.sidebar');
    const go = (p, push = true) => { p = OS.fs.norm(p); if (!OS.fs.isDir(p)) return OS.alert('Cannot open folder', p + ' does not exist.'); cur = p; sel.clear(); filter = ''; $('.fm-searchbar input').value = ''; if (push) { hist = hist.slice(0, hi + 1); hist.push(p); hi = hist.length - 1; } side.classList.remove('open'); render(); };
    const inTrash = () => cur.startsWith(OS.fs.trashPath());
    function renderSide() {
      side.innerHTML = `<div class="side-head">Places</div>` + SIDE().map(([n, p, i]) => `<button class="side-item ${cur === p ? 'on' : ''}" data-p="${esc(p)}">${gl(i)}${n}${n === 'Trash' && OS.fs.trashCount() ? `<span class="spacer"></span><small class="muted">${OS.fs.trashCount()}</small>` : ''}</button>`).join('') +
        `<div class="side-head">Device</div><button class="side-item" data-a="import">${gl('upload')}Import from device…</button><div class="pad small muted" style="padding:8px 10px">${OS.fmtSize(OS.store.size())} used of ~10 MB</div>`;
      side.querySelectorAll('[data-p]').forEach((b) => { b.onclick = () => go(b.dataset.p); b.ondragover = (e) => e.preventDefault(); b.ondrop = (e) => dropOn(e, b.dataset.p); });
      side.querySelector('[data-a=import]').onclick = () => OS.uploadPicker(cur);
    }
    function crumbs() {
      const host = $('.fm-path'); host.innerHTML = '';
      const h = OS.home(); let parts, base;
      if (cur.startsWith(h)) { base = h; parts = cur.slice(h.length).split('/').filter(Boolean); host.appendChild(crumb('Home', h, 'home')); }
      else { base = ''; parts = cur.split('/').filter(Boolean); host.appendChild(crumb('/', '/', 'hdd')); }
      let acc = base; parts.forEach((p) => { acc += '/' + p; host.appendChild(OS.el(`<span class="muted">›</span>`)); host.appendChild(crumb(p === 'Trash' && acc === OS.fs.trashPath() ? 'Trash' : p, acc)); });
      host.scrollLeft = 9999;
    }
    const crumb = (label, p, icon) => { const b = OS.el(`<button>${icon ? gl(icon) + ' ' : ''}${esc(label)}</button>`); b.onclick = () => go(p); b.ondragover = (e) => e.preventDefault(); b.ondrop = (e) => dropOn(e, p); return b; };
    function items() { let it = []; try { it = OS.fs.ls(cur); } catch (e) {} if (!showHidden) it = it.filter((x) => !x.name.startsWith('.')); if (filter) { const f = filter.toLowerCase(); it = cur === OS.home() || true ? OS.fs.find(cur, (n) => n.toLowerCase().includes(f) && (showHidden || !n.startsWith('.')), 200).filter((p) => p !== cur).map((p) => Object.assign(OS.fs.stat(p), { name: OS.fs.basename(p), type: OS.fs.isDir(p) ? 'dir' : 'file' })) : it; } return it; }
    function render() {
      renderSide(); crumbs();
      $('[data-a=back]').disabled = hi <= 0; $('[data-a=fwd]').disabled = hi >= hist.length - 1;
      $('[data-a=view]').innerHTML = gl(view === 'grid' ? 'list' : 'grid');
      win.setTitle(cur === OS.home() ? 'Home' : inTrash() ? 'Trash' : OS.fs.basename(cur) || 'Computer');
      const list = items();
      main.innerHTML = '';
      if (inTrash() && list.length) main.appendChild(OS.el(`<div class="br-note" style="margin:0">${gl('trash')}<span style="flex:1">Items in Trash</span><button class="btn sm" data-a="restoreall">Restore all</button><button class="btn sm primary danger" data-a="empty">Empty Trash</button></div>`));
      const wrap = OS.el(`<div class="${view === 'grid' ? 'fm-grid' : 'fm-list'}"></div>`); main.appendChild(wrap);
      if (!list.length) main.appendChild(OS.el(`<div class="empty">${gl(inTrash() ? 'trash' : filter ? 'search' : 'folder')}<div>${inTrash() ? 'Trash is empty' : filter ? 'No matching files' : 'This folder is empty'}</div>${!filter && !inTrash() ? '<div class="small">Right-click (or long-press) for options, or drop files here</div>' : ''}</div>`));
      list.forEach((it) => {
        const isImg = it.type === 'file' && OS.ftype(it.name) === 'image';
        const icon = isImg && view === 'grid' ? OS.desktop.thumb(it) : OS.fileIcon(it.name, it.type === 'dir');
        const el = OS.el(`<div class="fm-item ${sel.has(it.path) ? 'sel' : ''} ${OS.clipboard && OS.clipboard.mode === 'cut' && OS.clipboard.paths.includes(it.path) ? 'cut' : ''}" draggable="true" data-p="${esc(it.path)}"><span class="ico">${icon}</span><span>${esc(it.name)}</span>${view === 'list' ? `<em>${it.type === 'dir' ? it.size + ' items' : OS.fmtSize(it.size)}</em><em class="d">${OS.fmtDate(it.mtime)}</em>` : ''}</div>`);
        el.onclick = (e) => {
          if (e.ctrlKey || e.metaKey) { sel.has(it.path) ? sel.delete(it.path) : sel.add(it.path); }
          else if (e.shiftKey && lastClicked) { const ps = list.map((x) => x.path); const a = ps.indexOf(lastClicked), b = ps.indexOf(it.path); ps.slice(Math.min(a, b), Math.max(a, b) + 1).forEach((p) => sel.add(p)); }
          else { sel.clear(); sel.add(it.path); if (OS.isTouch() && e.pointerType !== 'mouse' && !selectMode) return open(it); }
          lastClicked = it.path; updSel();
        };
        el.ondblclick = () => open(it);
        OS.onContext(el, (e, x, y) => { if (!sel.has(it.path)) { sel.clear(); sel.add(it.path); updSel(); } itemMenu(x, y, it); });
        el.ondragstart = (e) => { if (!sel.has(it.path)) { sel.clear(); sel.add(it.path); updSel(); } e.dataTransfer.setData('text/cirrus-paths', JSON.stringify([...sel])); e.dataTransfer.effectAllowed = 'move'; };
        if (it.type === 'dir') { el.ondragover = (e) => { e.preventDefault(); el.classList.add('drop'); }; el.ondragleave = () => el.classList.remove('drop'); el.ondrop = (e) => { el.classList.remove('drop'); dropOn(e, it.path); }; }
        wrap.appendChild(el);
      });
      const ra = main.querySelector('[data-a=restoreall]'); if (ra) ra.onclick = () => { list.forEach((it) => OS.fs.restore(it.path)); };
      const em = main.querySelector('[data-a=empty]'); if (em) em.onclick = async () => { if (await OS.confirm('Empty Trash?', 'All items in the Trash will be permanently deleted.', 'Empty Trash', true)) OS.fs.emptyTrash(); };
      updSel();
    }
    let selectMode = false;
    function updSel() {
      main.querySelectorAll('.fm-item').forEach((el) => el.classList.toggle('sel', sel.has(el.dataset.p)));
      const list = items(); const n = sel.size;
      $('.fm-status').textContent = n ? `${n} selected` : `${list.length} item${list.length === 1 ? '' : 's'}`;
      $('.fm-free').textContent = n === 1 ? (() => { try { const s = OS.fs.stat([...sel][0]); return s.type === 'dir' ? s.items + ' items' : OS.fmtSize(s.bytes); } catch (e) { return ''; } })() : '';
    }
    function open(it) { if (it.type === 'dir') go(it.path); else if (inTrash()) OS.alert('File is in Trash', 'Restore it first to open it.'); else OS.desktop.openPath(it.path); }
    async function dropOn(e, dir) {
      e.preventDefault(); e.stopPropagation(); main.classList.remove('dropzone');
      if (e.dataTransfer.files && e.dataTransfer.files.length) return OS.importFiles([...e.dataTransfer.files], dir);
      const d = e.dataTransfer.getData('text/cirrus-paths'); if (!d) return;
      JSON.parse(d).forEach((p) => { if (p === dir || OS.fs.dirname(p) === dir) return; try { OS.fs.mv(p, dir); } catch (er) { OS.alert('Move failed', er.message); } });
    }
    main.ondragover = (e) => { e.preventDefault(); if (e.dataTransfer.types.includes('Files')) main.classList.add('dropzone'); };
    main.ondragleave = (e) => { if (e.target === main) main.classList.remove('dropzone'); };
    main.ondrop = (e) => dropOn(e, cur);

    const selPaths = () => [...sel];
    async function rename(p) { const n = await OS.prompt('Rename', '', OS.fs.basename(p)); if (n && n !== OS.fs.basename(p)) { if (n.includes('/')) return OS.alert('Invalid name', 'Names cannot contain "/".'); const to = OS.fs.join(OS.fs.dirname(p), n); if (OS.fs.exists(to)) return OS.alert('Name taken', `“${n}” already exists.`); OS.fs.mv(p, to); } }
    async function del(paths, permanent) {
      if (!paths.length) return;
      if (permanent || inTrash()) { if (!(await OS.confirm(`Permanently delete ${paths.length > 1 ? paths.length + ' items' : '“' + OS.fs.basename(paths[0]) + '”'}?`, 'This cannot be undone.', 'Delete', true))) return; paths.forEach((p) => OS.fs.rm(p, { r: true, f: true })); }
      else paths.forEach((p) => OS.fs.trash(p));
      sel.clear();
    }
    function props(p) {
      const s = OS.fs.stat(p);
      OS.dialog({ title: s.name, html: `<div class="row" style="gap:14px;align-items:flex-start"><span class="ico" style="width:64px;height:64px">${OS.fileIcon(s.name, s.type === 'dir')}</span><div class="small col" style="gap:4px"><div><b>Type:</b> ${s.type === 'dir' ? 'Folder' : OS.ftype(s.name) + ' file'}</div><div><b>Location:</b> ${esc(OS.fs.dirname(p))}</div><div><b>Size:</b> ${OS.fmtSize(s.bytes)}${s.type === 'dir' ? ` (${s.items} items)` : ''}</div><div><b>Modified:</b> ${OS.fmtDate(s.mtime)}</div><div><b>Permissions:</b> ${s.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--'}</div></div></div>` });
    }
    function itemMenu(x, y, it) {
      const paths = selPaths(); const multi = paths.length > 1;
      if (inTrash()) return OS.menu(x, y, [{ label: 'Restore', icon: 'undo', action: () => paths.forEach((p) => OS.fs.restore(p)) }, { label: 'Delete permanently', icon: 'trash', danger: true, action: () => del(paths, true) }]);
      const t = OS.ftype(it.name);
      OS.menu(x, y, [
        { label: 'Open', icon: 'external', action: () => open(it) },
        !multi && it.type === 'file' && { label: 'Open with Text Editor', icon: 'edit', action: () => OS.wm.open('editor', { path: it.path }) },
        !multi && it.type === 'file' && (t === 'html' || t === 'image') && { label: 'Open with Browser', icon: 'globe', action: () => OS.wm.open('browser', { url: 'file://' + it.path }) },
        !multi && it.type === 'file' && /\.(sh|py|js)$/.test(it.name) && { label: 'Run in Terminal', icon: 'terminal', action: () => OS.wm.open('terminal', { cwd: cur, cmd: (it.name.endsWith('.py') ? 'python3 ' : it.name.endsWith('.js') ? 'node ' : 'sh ') + JSON.stringify(it.name) }) },
        !multi && t === 'image' && { label: 'Set as Wallpaper', icon: 'image', action: () => { OS.settings.customWallpaper = OS.toDataUrl(OS.fs.read(it.path), it.name); OS.set('wallpaper', 'custom'); } },
        !multi && it.type === 'dir' && { label: 'Open in Terminal', icon: 'terminal', action: () => OS.wm.open('terminal', { cwd: it.path }) },
        '-',
        { label: 'Cut', icon: 'scissors', key: 'Ctrl+X', action: () => { OS.clipboard = { mode: 'cut', paths }; render(); } },
        { label: 'Copy', icon: 'copy', key: 'Ctrl+C', action: () => (OS.clipboard = { mode: 'copy', paths }) },
        it.type === 'dir' && OS.clipboard && { label: 'Paste into folder', icon: 'clipboard', action: () => OS.desktop.paste(it.path) },
        !multi && { label: 'Rename…', icon: 'edit', key: 'F2', action: () => rename(it.path) },
        !multi && { label: 'Duplicate', icon: 'squares', action: () => OS.fs.cp(it.path, OS.fs.uniqueName(cur, it.name), { r: true }) },
        !multi && it.type === 'file' && { label: 'Download to device', icon: 'download', action: () => OS.downloadReal(it.name, OS.fs.read(it.path)) },
        !multi && it.type === 'dir' && { label: OS.settings.pinned && 'Add to Desktop', icon: 'monitor', action: () => OS.fs.cp(it.path, OS.fs.uniqueName(OS.home() + '/Desktop', it.name), { r: true }) },
        '-',
        { label: 'Move to Trash', icon: 'trash', danger: true, key: 'Del', action: () => del(paths) },
        !multi && { label: 'Properties', icon: 'info', action: () => props(it.path) },
      ]);
    }
    async function newItem(dir) { const n = await OS.prompt(dir ? 'New Folder' : 'New Document', '', dir ? 'New Folder' : 'Untitled.txt'); if (!n) return; try { const p = OS.fs.uniqueName(cur, n); dir ? OS.fs.mkdir(p) : OS.fs.write(p, ''); } catch (e) { OS.alert('Error', e.message); } }
    function bgMenu(x, y) {
      OS.menu(x, y, inTrash() ? [{ label: 'Empty Trash', icon: 'trash', danger: true, action: () => OS.fs.emptyTrash() }] : [
        { label: 'New Folder', icon: 'folder', key: 'Ctrl+Shift+N', action: () => newItem(true) },
        { label: 'New Document', icon: 'filetext', action: () => newItem(false) },
        { label: 'Paste', icon: 'clipboard', key: 'Ctrl+V', disabled: !OS.clipboard, action: () => OS.desktop.paste(cur) },
        { label: 'Select All', icon: 'check', key: 'Ctrl+A', action: () => { items().forEach((i) => sel.add(i.path)); updSel(); } },
        '-',
        { label: 'Import files from device…', icon: 'upload', action: () => OS.uploadPicker(cur) },
        { label: 'Open in Terminal', icon: 'terminal', action: () => OS.wm.open('terminal', { cwd: cur }) },
        { label: showHidden ? 'Hide hidden files' : 'Show hidden files', icon: 'eye', key: 'Ctrl+H', action: () => { showHidden = !showHidden; render(); } },
        { label: 'Properties', icon: 'info', action: () => props(cur) },
      ]);
    }
    OS.onContext(main, (e, x, y) => { if (!e.target.closest('.fm-item')) { sel.clear(); updSel(); bgMenu(x, y); } });
    main.addEventListener('click', (e) => { if (!e.target.closest('.fm-item') && !e.target.closest('button')) { sel.clear(); updSel(); } });
    $('[data-a=back]').onclick = () => { if (hi > 0) go(hist[--hi], false); };
    $('[data-a=fwd]').onclick = () => { if (hi < hist.length - 1) go(hist[++hi], false); };
    $('[data-a=up]').onclick = () => go(OS.fs.dirname(cur));
    $('[data-a=side]').onclick = () => side.classList.toggle('open');
    $('[data-a=view]').onclick = () => { view = view === 'grid' ? 'list' : 'grid'; OS.store.set('fm-view', view); render(); };
    $('[data-a=search]').onclick = () => { $('.fm-searchbar').hidden = false; $('.fm-searchbar input').focus(); };
    $('[data-a=closesearch]').onclick = () => { $('.fm-searchbar').hidden = true; filter = ''; $('.fm-searchbar input').value = ''; render(); };
    $('.fm-searchbar input').oninput = (e) => { filter = e.target.value.trim(); render(); };
    $('[data-a=more]').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left - 180, r.bottom + 4, [
      { label: 'New Folder', icon: 'folder', action: () => newItem(true) }, { label: 'New Document', icon: 'filetext', action: () => newItem(false) },
      { label: 'Import from device…', icon: 'upload', action: () => OS.uploadPicker(cur) },
      { label: 'Paste', icon: 'clipboard', disabled: !OS.clipboard, action: () => OS.desktop.paste(cur) },
      { label: selectMode ? 'Tap to open' : 'Tap to select', icon: 'check', action: () => { selectMode = !selectMode; } },
      '-', { label: showHidden ? 'Hide hidden files' : 'Show hidden files', icon: 'eye', action: () => { showHidden = !showHidden; render(); } },
      { label: 'Open Terminal here', icon: 'terminal', action: () => OS.wm.open('terminal', { cwd: cur }) },
      sel.size && '-', sel.size && { label: `Move ${sel.size} to Trash`, icon: 'trash', danger: true, action: () => del(selPaths()) },
    ]); };
    OS.wm.keys(win, (e) => {
      if (e.target.tagName === 'INPUT') return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (e.key === 'Delete') { e.preventDefault(); del(selPaths(), e.shiftKey); }
      else if (e.key === 'F2' && sel.size === 1) { e.preventDefault(); rename([...sel][0]); }
      else if (e.key === 'Backspace' || (e.altKey && e.key === 'ArrowUp')) { e.preventDefault(); go(OS.fs.dirname(cur)); }
      else if (e.key === 'Enter' && sel.size === 1) { const p = [...sel][0]; open({ path: p, type: OS.fs.isDir(p) ? 'dir' : 'file', name: OS.fs.basename(p) }); }
      else if (ctrl && e.key === 'a') { e.preventDefault(); items().forEach((i) => sel.add(i.path)); updSel(); }
      else if (ctrl && e.key === 'c' && sel.size) { OS.clipboard = { mode: 'copy', paths: selPaths() }; }
      else if (ctrl && e.key === 'x' && sel.size) { OS.clipboard = { mode: 'cut', paths: selPaths() }; render(); }
      else if (ctrl && e.key === 'v') { OS.desktop.paste(cur); }
      else if (ctrl && e.key === 'h') { e.preventDefault(); showHidden = !showHidden; render(); }
      else if (ctrl && e.shiftKey && e.key === 'N') { e.preventDefault(); newItem(true); }
      else if (ctrl && e.key === 'f') { e.preventDefault(); $('[data-a=search]').click(); }
    });
    let t = null; const off = OS.on('fs', () => { clearTimeout(t); t = setTimeout(() => { if (!OS.fs.isDir(cur)) cur = OS.home(); render(); }, 40); });
    const off2 = OS.on('trash', () => renderSide());
    win.onClose(() => { off(); off2(); });
    win.onArgs = (a) => { if (a.path) go(a.path); };
    render();
  }
  OS.registerApp({ id: 'files', name: 'Files', icon: 'folder', color: ['#5b9dff', '#3a6fe0'], cat: 'System', w: 860, h: 540, desc: 'File manager', keywords: 'explorer nautilus folder', launch: (w, a) => filesApp(w, a) });
  OS.registerApp({ id: 'trash', name: 'Trash', icon: 'trash', color: ['#8a93a6', '#5c6270'], cat: 'System', w: 760, h: 480, desc: 'Deleted files', hidden: false, launch: (w, a) => filesApp(w, Object.assign({}, a, { path: OS.fs.trashPath() }), true) });

  /* ======================= TEXT EDITOR ======================= */
  OS.registerApp({
    id: 'editor', name: 'Text Editor', icon: 'edit', color: ['#ffb347', '#ff7a45'], cat: 'Accessories', w: 780, h: 540, desc: 'Edit text and code', keywords: 'gedit notepad code nano',
    launch(win, args) {
      let path = args.path || null, dirty = false, wrap = OS.store.get('ed-wrap', true), size = OS.store.get('ed-size', 14), nums = OS.store.get('ed-nums', true);
      win.body.innerHTML = `<div class="toolbar">
        <button class="ibtn" data-a="new" title="New">${gl('plus')}</button><button class="ibtn" data-a="open" title="Open (Ctrl+O)">${gl('folder')}</button><button class="ibtn" data-a="save" title="Save (Ctrl+S)">${gl('save')}</button>
        <span class="tsep" style="height:22px"></span>
        <button class="ibtn" data-a="undo" title="Undo">${gl('undo')}</button><button class="ibtn" data-a="redo" title="Redo">${gl('redo')}</button>
        <button class="ibtn" data-a="find" title="Find & Replace (Ctrl+F)">${gl('search')}</button>
        <span class="grow"></span>
        <button class="btn sm" data-a="run" hidden>${gl('play')}Run</button>
        <button class="ibtn" data-a="more" title="Menu">${gl('dots')}</button></div>
        <div class="toolbar ed-find" hidden><input class="inp" placeholder="Find" style="flex:1;min-width:80px"><input class="inp" placeholder="Replace" style="flex:1;min-width:80px"><button class="btn sm" data-f="next">Next</button><button class="btn sm" data-f="rep">Replace</button><button class="btn sm" data-f="all">All</button><button class="ibtn" data-f="x">${gl('x')}</button></div>
        <div class="editor-wrap"><div class="editor-gutter"></div><textarea class="editor" spellcheck="false" autocapitalize="off" autocorrect="off"></textarea></div>
        <div class="statusbar"><span class="ed-pos">Ln 1, Col 1</span><span class="ed-type"></span><span class="spacer"></span><span class="ed-info"></span></div>`;
      const $ = (s) => win.body.querySelector(s); const ta = $('.editor'), gut = $('.editor-gutter');
      const apply = () => { ta.classList.toggle('wrap', wrap); win.body.style.setProperty('--efs', size + 'px'); gut.style.display = nums && !wrap ? '' : 'none'; updGutter(); };
      const updGutter = () => { if (gut.style.display === 'none') return; const n = ta.value.split('\n').length; let s = ''; for (let i = 1; i <= n; i++) s += i + '\n'; gut.textContent = s; gut.scrollTop = ta.scrollTop; };
      const title = () => { win.setTitle((dirty ? '• ' : '') + (path ? OS.fs.basename(path) : 'Untitled') + ' — Text Editor'); $('.ed-type').textContent = path ? (OS.ext(path) || 'plain').toUpperCase() : 'Plain text'; $('[data-a=run]').hidden = !(path && /\.(html?|js|sh|py|md|svg)$/.test(path)); };
      const updPos = () => { const v = ta.value.slice(0, ta.selectionStart); const ln = v.split('\n'); $('.ed-pos').textContent = `Ln ${ln.length}, Col ${ln[ln.length - 1].length + 1}`; $('.ed-info').textContent = `${ta.value.length} chars · ${ta.value.split(/\s+/).filter(Boolean).length} words`; };
      const load = (p) => { try { const c = OS.fs.read(p); if (OS.isDataUrl(c)) { OS.alert('Binary file', 'This file contains binary data and cannot be edited as text.'); return false; } ta.value = c; path = p; dirty = false; title(); updGutter(); updPos(); return true; } catch (e) { if (OS.fs.isDir(OS.fs.dirname(p))) { ta.value = ''; path = p; dirty = false; title(); return true; } OS.alert('Cannot open', e.message); return false; } };
      const save = async (as) => {
        let p = path; if (!p || as) { p = await OS.pickFile({ mode: 'save', path: path ? OS.fs.dirname(path) : OS.home() + '/Documents', name: path ? OS.fs.basename(path) : 'Untitled.txt' }); if (!p) return false; if (OS.fs.exists(p) && p !== path && !(await OS.confirm('Replace file?', `“${OS.fs.basename(p)}” already exists. Replace it?`, 'Replace', true))) return false; }
        try { OS.fs.write(p, ta.value); path = p; dirty = false; title(); return true; } catch (e) { OS.alert('Save failed', e.message); return false; }
      };
      const confirmLose = async () => { if (!dirty) return true; const r = await OS.dialog({ title: 'Save changes?', message: `Save changes to “${path ? OS.fs.basename(path) : 'Untitled'}” before closing?`, buttons: [{ label: 'Cancel', value: 'c' }, { label: "Don't save", value: 'd', danger: true }, { label: 'Save', value: 's', primary: true }] }); if (r === 's') return save(); return r === 'd'; };
      win.beforeClose = confirmLose;
      ta.oninput = () => { if (!dirty) { dirty = true; title(); } updGutter(); updPos(); };
      ta.onscroll = () => (gut.scrollTop = ta.scrollTop);
      ta.onkeyup = ta.onclick = updPos;
      ta.onkeydown = (e) => {
        const ctrl = e.ctrlKey || e.metaKey;
        if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '    '); }
        else if (ctrl && e.key === 's') { e.preventDefault(); save(e.shiftKey); }
        else if (ctrl && e.key === 'o') { e.preventDefault(); $('[data-a=open]').click(); }
        else if (ctrl && e.key === 'f') { e.preventDefault(); $('[data-a=find]').click(); }
        else if (ctrl && (e.key === '=' || e.key === '+')) { e.preventDefault(); size = Math.min(32, size + 1); OS.store.set('ed-size', size); apply(); }
        else if (ctrl && e.key === '-') { e.preventDefault(); size = Math.max(9, size - 1); OS.store.set('ed-size', size); apply(); }
        else if (e.key === 'Enter') { const v = ta.value.slice(0, ta.selectionStart); const ind = /(^|\n)([ \t]*)[^\n]*$/.exec(v)[2]; const extra = /[{[(:]\s*$/.test(v) ? '    ' : ''; if (ind || extra) { e.preventDefault(); document.execCommand('insertText', false, '\n' + ind + extra); } }
      };
      $('[data-a=new]').onclick = async () => { if (await confirmLose()) { ta.value = ''; path = null; dirty = false; title(); updGutter(); } };
      $('[data-a=open]').onclick = async () => { if (!(await confirmLose())) return; const p = await OS.pickFile({ mode: 'open', path: path ? OS.fs.dirname(path) : OS.home() + '/Documents' }); if (p) load(p); };
      $('[data-a=save]').onclick = () => save();
      $('[data-a=undo]').onclick = () => { ta.focus(); document.execCommand('undo'); };
      $('[data-a=redo]').onclick = () => { ta.focus(); document.execCommand('redo'); };
      $('[data-a=run]').onclick = async () => {
        if (dirty) await save(); if (!path) return; const e = OS.ext(path);
        if (e === 'html' || e === 'htm' || e === 'svg') OS.wm.open('browser', { url: 'file://' + path });
        else if (e === 'md') OS.wm.open('browser', { url: 'file://' + path });
        else OS.wm.open('terminal', { cwd: OS.fs.dirname(path), cmd: (e === 'js' ? 'node ' : e === 'py' ? 'python3 ' : 'sh ') + JSON.stringify(OS.fs.basename(path)) });
      };
      $('[data-a=more]').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left - 190, r.bottom + 4, [
        { label: 'Save As…', icon: 'save', key: 'Ctrl+Shift+S', action: () => save(true) },
        { label: 'Download to device', icon: 'download', action: () => OS.downloadReal(path ? OS.fs.basename(path) : 'untitled.txt', ta.value) },
        '-', { label: (wrap ? '✓ ' : '') + 'Word wrap', icon: 'type', action: () => { wrap = !wrap; OS.store.set('ed-wrap', wrap); apply(); } },
        { label: (nums ? '✓ ' : '') + 'Line numbers', icon: 'list', action: () => { nums = !nums; OS.store.set('ed-nums', nums); apply(); } },
        { label: 'Bigger text', icon: 'zoomin', key: 'Ctrl++', action: () => { size = Math.min(32, size + 2); OS.store.set('ed-size', size); apply(); } },
        { label: 'Smaller text', icon: 'zoomout', key: 'Ctrl+-', action: () => { size = Math.max(9, size - 2); OS.store.set('ed-size', size); apply(); } },
        '-', { label: 'Insert date/time', icon: 'clock', action: () => { ta.focus(); document.execCommand('insertText', false, new Date().toLocaleString()); } },
        { label: 'UPPERCASE selection', icon: 'type', action: () => { ta.focus(); const s = ta.value.slice(ta.selectionStart, ta.selectionEnd); document.execCommand('insertText', false, s.toUpperCase()); } },
        { label: 'Sort lines', icon: 'list', action: () => { ta.value = ta.value.split('\n').sort((a, b) => a.localeCompare(b)).join('\n'); ta.oninput(); } },
      ]); };
      // find/replace
      const fb = $('.ed-find'), [fi, ri] = fb.querySelectorAll('input');
      $('[data-a=find]').onclick = () => { fb.hidden = !fb.hidden; if (!fb.hidden) { fi.value = ta.value.slice(ta.selectionStart, ta.selectionEnd) || fi.value; fi.focus(); fi.select(); } };
      const findNext = () => { const q = fi.value; if (!q) return false; let i = ta.value.toLowerCase().indexOf(q.toLowerCase(), ta.selectionEnd); if (i < 0) i = ta.value.toLowerCase().indexOf(q.toLowerCase()); if (i < 0) { fi.classList.add('shake'); setTimeout(() => fi.classList.remove('shake'), 400); return false; } ta.focus(); ta.setSelectionRange(i, i + q.length); const before = ta.value.slice(0, i).split('\n').length; ta.scrollTop = (before - 5) * size * 1.55; fi.focus(); return true; };
      fb.querySelector('[data-f=next]').onclick = findNext;
      fi.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); findNext(); } if (e.key === 'Escape') fb.hidden = true; };
      fb.querySelector('[data-f=rep]').onclick = () => { const s = ta.value.slice(ta.selectionStart, ta.selectionEnd); if (s && s.toLowerCase() === fi.value.toLowerCase()) { ta.focus(); document.execCommand('insertText', false, ri.value); } findNext(); };
      fb.querySelector('[data-f=all]').onclick = () => { if (!fi.value) return; const n = ta.value.split(fi.value).length - 1; ta.value = ta.value.split(fi.value).join(ri.value); ta.oninput(); OS.notify('Replaced', `${n} occurrence${n === 1 ? '' : 's'}`, { app: 'editor' }); };
      fb.querySelector('[data-f=x]').onclick = () => (fb.hidden = true);
      win.onResize = updGutter; win.onFocus = () => ta.focus();
      if (path) load(path); else { title(); }
      apply(); updPos(); setTimeout(() => ta.focus(), 50);
    },
  });

  /* ======================= BROWSER ======================= */
  const DEFAULT_BM = [
    { t: 'Wikipedia', u: 'https://en.m.wikipedia.org/wiki/Main_Page', i: 'book' }, { t: 'OpenStreetMap', u: 'https://www.openstreetmap.org/export/embed.html?bbox=-10,35,30,60&layer=mapnik', i: 'map' },
    { t: 'Wiktionary', u: 'https://en.m.wiktionary.org/', i: 'type' }, { t: 'Example', u: 'https://example.com', i: 'globe' },
    { t: 'Internet Archive', u: 'https://archive.org', i: 'hdd' }, { t: 'Cirrus Docs', u: 'about:help', i: 'info' },
  ];
  const searchUrl = (q) => ({ wikipedia: 'https://en.m.wikipedia.org/w/index.php?search=', duckduckgo: 'https://duckduckgo.com/html/?q=', bing: 'https://www.bing.com/search?q=', google: 'https://www.google.com/search?igu=1&q=' }[OS.settings.searchEngine] || 'https://en.m.wikipedia.org/w/index.php?search=') + encodeURIComponent(q);
  function internalPage(url) {
    const accent = OS.settings.accent; const dark = document.documentElement.dataset.theme === 'dark';
    const base = `<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:${dark ? '#16181d' : '#f6f7fb'};color:${dark ? '#e9ebf1' : '#1a1c22'}}a{color:${accent}}.wrap{max-width:760px;margin:0 auto;padding:32px 20px}h1{font-weight:700}.card{background:${dark ? '#22252d' : '#fff'};border-radius:16px;padding:18px;box-shadow:0 2px 10px rgba(0,0,0,.08);margin:12px 0}code{background:${dark ? '#0d0f14' : '#eef'};padding:2px 6px;border-radius:6px}</style><script>document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(a){e.preventDefault();parent.postMessage({cirrusNav:a.getAttribute('href')},'*')}});<\/script>`;
    if (url === 'about:home' || url === 'about:newtab') {
      const bms = OS.settings.bookmarks || DEFAULT_BM;
      const h = new Date().getHours(); const greet = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
      return `<!doctype html><html><head>${base}<style>body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 20% 20%,${accent}33,transparent 40%),radial-gradient(circle at 80% 80%,#b06cff33,transparent 40%),${dark ? '#16181d' : '#f6f7fb'}}.box{width:min(640px,92vw);text-align:center}h1{font-size:clamp(28px,6vw,44px);margin:0 0 6px}p{opacity:.7;margin:0 0 26px}form{display:flex;background:${dark ? '#22252d' : '#fff'};border-radius:999px;box-shadow:0 6px 24px rgba(0,0,0,.12);overflow:hidden;border:1px solid ${dark ? '#333' : '#e3e5ea'}}input{flex:1;border:0;background:transparent;padding:16px 22px;font-size:17px;outline:0;color:inherit;min-width:0}button{border:0;background:${accent};color:#fff;padding:0 22px;font-size:15px;cursor:pointer}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:12px;margin-top:30px}.grid a{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 6px;border-radius:16px;text-decoration:none;color:inherit;background:${dark ? '#22252d' : '#fff'};box-shadow:0 2px 10px rgba(0,0,0,.06);font-size:13px}.grid a:hover{transform:translateY(-2px)}.grid span{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;color:#fff;font-weight:700;font-size:20px}</style></head><body><div class="box"><h1>${greet}!</h1><p>Search the web or pick a shortcut</p><form onsubmit="event.preventDefault();parent.postMessage({cirrusNav:this.q.value},'*')"><input name="q" placeholder="Search or enter address" autofocus autocomplete="off"><button>Search</button></form><div class="grid">${bms.map((b, i) => `<a href="${esc(b.u)}"><span style="background:hsl(${(i * 57 + 220) % 360},70%,55%)">${esc(b.t[0])}</span>${esc(b.t)}</a>`).join('')}</div></div></body></html>`;
    }
    if (url === 'about:help') return `<!doctype html><html><head>${base}</head><body><div class="wrap"><h1>Cirrus Browser</h1><div class="card"><b>How browsing works here</b><p>Cirrus Browser shows real websites inside the desktop. Some websites (Google, YouTube, GitHub, many news sites) <b>refuse to be shown inside another page</b>; when that happens the page stays blank. Use the <b>Open externally</b> button in the toolbar to open them in a real browser tab.</p><p>Sites that work well: <a href="https://en.m.wikipedia.org/wiki/Linux">Wikipedia</a>, <a href="https://www.openstreetmap.org/export/embed.html?bbox=-0.2,51.4,0.1,51.6&layer=mapnik">OpenStreetMap</a>, <a href="https://example.com">example.com</a>, <a href="https://www.youtube.com/embed/aqz-KE-bpKQ">YouTube embeds</a>.</p></div><div class="card"><b>Local files</b><p>Open HTML pages from your home folder with <code>file://~/Documents/page.html</code>, or right-click a file in Files → Open with Browser.</p></div><div class="card"><b>Shortcuts</b><p><code>Ctrl+T</code> new tab · <code>Ctrl+W</code> close tab · <code>Ctrl+L</code> focus address bar · <code>F5</code> reload</p></div></div></body></html>`;
    if (url === 'about:blank') return '<!doctype html><html><body></body></html>';
    return `<!doctype html><html><head>${base}</head><body><div class="wrap"><h1>Page not found</h1><p>${esc(url)} is not a known internal page. Try <a href="about:home">about:home</a> or <a href="about:help">about:help</a>.</p></div></body></html>`;
  }
  function mdToHtml(md) {
    let h = esc(md);
    h = h.replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^# (.*)$/gm, '<h1>$1</h1>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/^- \[x\] (.*)$/gm, '<div>☑ $1</div>').replace(/^- \[ \] (.*)$/gm, '<div>☐ $1</div>').replace(/^[-*] (.*)$/gm, '<li>$1</li>').replace(/^    (.*)$/gm, '<pre>$1</pre>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>').replace(/\n\n/g, '<p>');
    return `<!doctype html><meta name="viewport" content="width=device-width"><style>body{font-family:system-ui;max-width:760px;margin:0 auto;padding:24px;line-height:1.6}code,pre{background:#f0f0f5;padding:2px 6px;border-radius:6px}</style>${h}`;
  }
  OS.registerApp({
    id: 'browser', name: 'Browser', icon: 'globe', color: ['#4facfe', '#7b5cff'], cat: 'Internet', w: 980, h: 640, desc: 'Browse the web', keywords: 'web internet firefox chrome',
    launch(win, args) {
      if (!OS.settings.bookmarks) { OS.settings.bookmarks = DEFAULT_BM; OS.saveSettings(); }
      const tabs = []; let active = null;
      win.body.innerHTML = `<div class="br-tabs"></div>
        <div class="toolbar"><button class="ibtn" data-a="back">${gl('left')}</button><button class="ibtn" data-a="fwd">${gl('right')}</button><button class="ibtn" data-a="reload">${gl('refresh')}</button><button class="ibtn hide-m" data-a="home">${gl('home')}</button>
        <form class="br-url"><span class="br-lock">${gl('globe')}</span><input spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="Search or enter address"></form>
        <button class="ibtn" data-a="star" title="Bookmark">${gl('star')}</button><button class="ibtn" data-a="ext" title="Open externally">${gl('external')}</button><button class="ibtn" data-a="menu">${gl('dots')}</button></div>
        <div class="br-bm"></div><div class="br-note" hidden></div><div class="br-view"><div class="br-progress"></div></div>`;
      const $ = (s) => win.body.querySelector(s); const view = $('.br-view'), urlIn = $('.br-url input'), prog = $('.br-progress');
      const renderBm = () => { const host = $('.br-bm'); host.innerHTML = ''; (OS.settings.bookmarks || []).forEach((b) => { const el = OS.el(`<button>${gl(b.i || 'globe')}${esc(b.t)}</button>`); el.onclick = () => nav(b.u); OS.onContext(el, (e, x, y) => OS.menu(x, y, [{ label: 'Open in new tab', icon: 'plus', action: () => newTab(b.u) }, { label: 'Remove bookmark', icon: 'trash', danger: true, action: () => { OS.set('bookmarks', OS.settings.bookmarks.filter((z) => z !== b)); renderBm(); } }])); host.appendChild(el); }); };
      const toUrl = (q) => {
        q = q.trim(); if (!q) return 'about:home';
        if (/^(about|file):/.test(q)) return q.startsWith('file://~') ? 'file://' + OS.home() + q.slice(8) : q;
        if (q.startsWith('~/') || q.startsWith('/')) return 'file://' + OS.fs.norm(q);
        if (/^https?:\/\//i.test(q)) return q;
        if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/.test(q) && !/\s/.test(q)) return 'https://' + q;
        if (/^localhost(:\d+)?/.test(q)) return 'http://' + q;
        return searchUrl(q);
      };
      function newTab(u) {
        const t = { id: OS.uid(), hist: [], hi: -1, title: 'New Tab', frame: document.createElement('iframe') };
        t.frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups allow-same-origin allow-modals allow-popups-to-escape-sandbox allow-presentation');
        t.frame.setAttribute('allow', 'fullscreen; autoplay; encrypted-media; geolocation; clipboard-write');
        t.frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        t.frame.onload = () => { prog.style.width = '100%'; setTimeout(() => (prog.style.opacity = 0), 300); try { const d = t.frame.contentDocument; if (d && d.title) { t.title = d.title; renderTabs(); } } catch (e) {} };
        view.appendChild(t.frame); tabs.push(t); select(t); load(t, toUrl(u || OS.settings.homepage), true);
      }
      function select(t) { active = t; tabs.forEach((x) => (x.frame.style.display = x === t ? '' : 'none')); renderTabs(); updBar(); }
      function closeTab(t) { const i = tabs.indexOf(t); t.frame.remove(); tabs.splice(i, 1); if (!tabs.length) return win.close(); if (active === t) select(tabs[Math.max(0, i - 1)]); else renderTabs(); }
      function renderTabs() {
        const host = $('.br-tabs'); host.innerHTML = '';
        tabs.forEach((t) => { const el = OS.el(`<div class="br-tab ${t === active ? 'on' : ''}">${gl(t.url && t.url.startsWith('file:') ? 'file' : 'globe')}<span>${esc(t.title)}</span><button class="ibtn">${gl('x')}</button></div>`); el.onclick = () => select(t); el.querySelector('.ibtn').onclick = (e) => { e.stopPropagation(); closeTab(t); }; el.onauxclick = (e) => { if (e.button === 1) closeTab(t); }; host.appendChild(el); });
        const add = OS.el(`<button class="ibtn" title="New tab (Ctrl+T)">${gl('plus')}</button>`); add.onclick = () => newTab(); host.appendChild(add);
        if (active) win.setTitle(active.title + ' — Browser');
      }
      function updBar() {
        if (!active) return; urlIn.value = active.url && !active.url.startsWith('about:home') ? active.url : '';
        $('[data-a=back]').disabled = active.hi <= 0; $('[data-a=fwd]').disabled = active.hi >= active.hist.length - 1;
        const ext = active.url && /^https?:/.test(active.url);
        $('.br-lock').innerHTML = gl(active.url?.startsWith('https') ? 'lock' : active.url?.startsWith('file') ? 'file' : 'info');
        const note = $('.br-note');
        if (ext && !OS.store.get('br-note-hide')) { note.hidden = false; note.innerHTML = `${gl('info')}<span style="flex:1">If this page stays blank, the site doesn't allow being embedded.</span><button class="btn sm" data-n="open">Open externally</button><button class="ibtn" data-n="x">${gl('x')}</button>`; note.querySelector('[data-n=open]').onclick = () => window.open(active.url, '_blank', 'noopener'); note.querySelector('[data-n=x]').onclick = () => { OS.store.set('br-note-hide', 1); note.hidden = true; }; }
        else note.hidden = true;
        const bm = (OS.settings.bookmarks || []).some((b) => b.u === active.url); $('[data-a=star]').classList.toggle('on', bm);
      }
      function load(t, url, push) {
        if (push) { t.hist = t.hist.slice(0, t.hi + 1); t.hist.push(url); t.hi = t.hist.length - 1; }
        t.url = url; prog.style.opacity = 1; prog.style.width = '30%';
        if (!navigator.onLine && /^https?:/.test(url)) { t.frame.removeAttribute('src'); t.frame.srcdoc = `<body style="font-family:system-ui;display:grid;place-items:center;height:90vh;color:#666;text-align:center"><div><div style="font-size:48px">⚡</div><h2>No internet</h2><p>Check your connection and try again.</p></div></body>`; t.title = 'No internet'; }
        else if (url.startsWith('about:')) { t.frame.removeAttribute('src'); t.frame.srcdoc = internalPage(url); t.title = url === 'about:home' || url === 'about:newtab' ? 'New Tab' : url; }
        else if (url.startsWith('file://')) {
          const p = decodeURIComponent(url.slice(7)); t.frame.removeAttribute('src'); t.title = OS.fs.basename(p);
          try { const c = OS.fs.read(p); const ty = OS.ftype(p); if (ty === 'html') t.frame.srcdoc = c; else if (ty === 'image' || OS.isDataUrl(c)) t.frame.srcdoc = `<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#222"><${ty === 'pdf' ? 'embed type="application/pdf" style="width:100vw;height:100vh"' : 'img style="max-width:100%"'} src="${esc(OS.toDataUrl(c, p))}"></body>`; else if (OS.ext(p) === 'md') t.frame.srcdoc = mdToHtml(c); else t.frame.srcdoc = `<pre style="white-space:pre-wrap;font:14px monospace;padding:16px">${esc(c)}</pre>`; }
          catch (e) { t.frame.srcdoc = `<body style="font-family:system-ui;padding:40px"><h2>File not found</h2><p>${esc(p)}</p></body>`; }
        }
        else { t.frame.removeAttribute('srcdoc'); t.frame.src = url; try { t.title = new URL(url).hostname.replace(/^www\.|^en\.m\./, ''); } catch (e) { t.title = url; } }
        renderTabs(); updBar();
      }
      const nav = (q) => load(active, toUrl(q), true);
      const onMsg = (e) => { const t = tabs.find((x) => x.frame.contentWindow === e.source); if (t && e.data && typeof e.data.cirrusNav === 'string') { select(t); nav(e.data.cirrusNav); } };
      window.addEventListener('message', onMsg); win.onClose(() => window.removeEventListener('message', onMsg));
      $('.br-url').onsubmit = (e) => { e.preventDefault(); nav(urlIn.value); urlIn.blur(); };
      urlIn.onfocus = () => setTimeout(() => urlIn.select(), 0);
      $('[data-a=back]').onclick = () => { if (active.hi > 0) load(active, active.hist[--active.hi]); };
      $('[data-a=fwd]').onclick = () => { if (active.hi < active.hist.length - 1) load(active, active.hist[++active.hi]); };
      $('[data-a=reload]').onclick = () => load(active, active.url);
      $('[data-a=home]').onclick = () => nav(OS.settings.homepage);
      $('[data-a=ext]').onclick = () => { if (/^https?:/.test(active.url)) window.open(active.url, '_blank', 'noopener'); else OS.notify('Local page', 'Only web pages can be opened externally.', { app: 'browser' }); };
      $('[data-a=star]').onclick = async () => {
        const bms = OS.settings.bookmarks || []; const ex = bms.find((b) => b.u === active.url);
        if (ex) OS.set('bookmarks', bms.filter((b) => b !== ex)); else { const n = await OS.prompt('Add bookmark', 'Name:', active.title); if (n) OS.set('bookmarks', [...bms, { t: n, u: active.url, i: 'star' }]); }
        renderBm(); updBar();
      };
      $('[data-a=menu]').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left - 200, r.bottom + 4, [
        { label: 'New tab', icon: 'plus', key: 'Ctrl+T', action: () => newTab() },
        { label: 'Open local file…', icon: 'folder', action: async () => { const p = await OS.pickFile({ mode: 'open', path: OS.home() + '/Documents' }); if (p) nav('file://' + p); } },
        { label: 'Save page link to Downloads', icon: 'download', disabled: !/^https?:/.test(active.url), action: () => { OS.fs.write(OS.fs.uniqueName(OS.home() + '/Downloads', (active.title || 'link').replace(/[\/\\]/g, '-') + '.url'), `[InternetShortcut]\nURL=${active.url}\n`); OS.notify('Saved', 'Link saved to Downloads', { app: 'browser' }); } },
        { label: 'Help', icon: 'info', action: () => newTab('about:help') },
        '-', { label: 'Search engine: ' + OS.settings.searchEngine, icon: 'search', action: () => OS.wm.open('settings', { page: 'apps' }) },
        { label: 'Reset bookmarks', icon: 'refresh', action: () => { OS.set('bookmarks', DEFAULT_BM); renderBm(); } },
      ]); };
      OS.wm.keys(win, (e) => {
        const c = e.ctrlKey || e.metaKey;
        if (c && e.key === 't') { e.preventDefault(); newTab(); } else if (c && e.key === 'w') { e.preventDefault(); closeTab(active); } else if (c && e.key === 'l') { e.preventDefault(); urlIn.focus(); } else if (e.key === 'F5') { e.preventDefault(); load(active, active.url); }
      });
      win.onArgs = (a) => newTab(a.url || a.path && 'file://' + a.path);
      renderBm(); newTab(args.url || (args.path ? 'file://' + args.path : undefined));
    },
  });

  /* ======================= SETTINGS ======================= */
  const PAGES = [['appearance', 'Appearance', 'palette'], ['desktop', 'Desktop & Panel', 'monitor'], ['display', 'Display', 'sun'], ['sound', 'Sound', 'volume'], ['network', 'Network', 'wifi'], ['notifications', 'Notifications', 'bell'], ['users', 'Users', 'user'], ['apps', 'Apps', 'grid'], ['datetime', 'Date & Time', 'clock'], ['storage', 'Storage', 'hdd'], ['about', 'About', 'info']];
  OS.registerApp({
    id: 'settings', name: 'Settings', icon: 'gear', color: ['#8a93a6', '#4c5466'], cat: 'System', w: 900, h: 600, single: true, desc: 'System settings', keywords: 'preferences control panel theme wallpaper',
    launch(win, args) {
      let page = args.page || 'appearance';
      win.body.innerHTML = `<div class="toolbar" style="display:none"></div><div class="split" style="position:relative"><div class="sidebar"></div><div class="scroll set-main"></div></div>`;
      const side = win.body.querySelector('.sidebar'), main = win.body.querySelector('.set-main');
      const renderSide = () => { side.innerHTML = `<div class="sm-search" style="margin:4px 2px 10px;height:38px"><input placeholder="Search settings" spellcheck="false"></div>` + PAGES.map(([id, n, i]) => `<button class="side-item ${id === page ? 'on' : ''}" data-p="${id}">${gl(i)}${n}</button>`).join(''); side.querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => { page = b.dataset.p; side.classList.remove('open'); render(); })); side.querySelector('input').oninput = (e) => { const q = e.target.value.toLowerCase(); side.querySelectorAll('[data-p]').forEach((b) => (b.style.display = !q || b.textContent.toLowerCase().includes(q) ? '' : 'none')); }; };
      const S = OS.settings;
      const sw = (k, v = S[k]) => `<label class="switch"><input type="checkbox" data-k="${k}" ${v ? 'checked' : ''}><i></i></label>`;
      const row = (title, sub, ctl) => `<div class="set-row"><div class="lab"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div>${ctl}</div>`;
      const seg = (k, opts) => `<div class="seg" data-seg="${k}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(S[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
      const head = (t) => `<div class="row" style="margin-bottom:16px"><button class="ibtn side-toggle" data-a="side">${gl('menu')}</button><h2 style="margin:0">${t}</h2></div>`;
      function render() {
        renderSide(); const t = PAGES.find((p) => p[0] === page)[1]; win.setTitle(t + ' — Settings');
        let h = '';
        if (page === 'appearance') {
          h = head('Appearance') + `<div class="set-gtitle">Style</div><div class="set-group"><div class="theme-cards">${[['light', 'Light'], ['dark', 'Dark'], ['auto', 'Automatic']].map(([v, l]) => `<div class="theme-card ${S.theme === v ? 'on' : ''}" data-theme="${v}"><div class="tp ${v}"><i></i><b></b></div>${l}</div>`).join('')}</div></div>
          <div class="set-gtitle">Accent color</div><div class="set-group"><div class="set-row"><div class="swatches">${OS.accents.map((c) => `<div class="swatch ${S.accent === c ? 'on' : ''}" data-accent="${c}" style="background:${c}"></div>`).join('')}<label class="swatch" style="background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red);position:relative" title="Custom"><input type="color" value="${S.accent}" data-custom-accent style="opacity:0;position:absolute;inset:0;width:100%;height:100%"></label></div></div></div>
          <div class="set-gtitle">Wallpaper</div><div class="set-group"><div class="wp-grid">${Object.keys(OS.wallpapers).map((id) => `<div class="wp ${S.wallpaper === id ? 'on' : ''}" data-wp="${id}" style="background:${esc(OS.wallpapers[id])};background-size:cover"></div>`).join('')}${S.customWallpaper ? `<div class="wp ${S.wallpaper === 'custom' ? 'on' : ''}" data-wp="custom" style="background:url('${S.customWallpaper}') center/cover"></div>` : ''}<div class="wp add" data-a="upwp">${gl('plus')}</div><div class="wp add" data-a="fswp" title="Choose from Pictures">${gl('image')}</div></div></div>
          <div class="set-gtitle">Effects</div><div class="set-group">${row('Transparency', 'Blurred, see-through panels and menus', sw('transparency'))}${row('Animations', 'Smooth window and menu animations', sw('animations'))}</div>`;
        } else if (page === 'desktop') {
          h = head('Desktop & Panel') + `<div class="set-group">${row('Panel position', '', seg('panelPos', [['bottom', 'Bottom'], ['top', 'Top']]))}${row('Show window titles in panel', 'Labels next to app icons', sw('showLabels'))}${row('Desktop icons', 'Show Home, Trash and files on the desktop', sw('desktopIcons'))}${row('Icon size', '', seg('iconSize', [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]))}${row('Mobile layout', 'Full-screen windows and touch-friendly UI', seg('mobileMode', [['auto', 'Auto'], ['on', 'On'], ['off', 'Off']]))}</div>
          <div class="set-gtitle">Pinned apps</div><div class="set-group">${S.pinned.filter((id) => OS.apps[id]).map((id) => row(`<span class="row">${OS.appIcon(id, 28)} ${esc(OS.apps[id].name)}</span>`, '', `<button class="btn sm" data-unpin="${id}">Unpin</button>`)).join('') || row('No pinned apps', 'Right-click an app in the menu to pin it', '')}</div>
          <div class="set-gtitle">Window behavior</div><div class="set-group">${row('Keyboard shortcuts', 'Ctrl+Alt+T terminal · Alt+Space menu · Alt+F4 close · Super key opens menu', '')}${row('Snapping', 'Drag windows to the screen edges to snap them; to the top to maximize', '')}</div>`;
        } else if (page === 'display') {
          h = head('Display') + `<div class="set-group">${row('Brightness', '', `<input type="range" min="20" max="100" value="${S.brightness}" data-range="brightness" style="width:200px">`)}${row('Night Light', 'Warmer colors to reduce eye strain', sw('nightLight'))}${row('Text size', S.fontScale + '%', `<input type="range" min="80" max="130" step="5" value="${S.fontScale}" data-range="fontScale" style="width:200px">`)}</div>
          <div class="set-group">${row('Resolution', `${screen.width} × ${screen.height} (${devicePixelRatio}× scale)`, '')}${row('Fullscreen', 'Hide the browser interface', `<button class="btn sm" data-a="fullscreen">${document.fullscreenElement ? 'Exit' : 'Enter'} fullscreen</button>`)}</div>`;
        } else if (page === 'sound') {
          h = head('Sound') + `<div class="set-group">${row('Output volume', S.volume + '%', `<input type="range" min="0" max="100" value="${S.volume}" data-range="volume" style="width:200px">`)}${row('System sounds', 'Startup, notifications and alerts', sw('sounds'))}${row('Test', '', `<button class="btn sm" data-a="testsound">${gl('play')}Play test sound</button>`)}</div>`;
        } else if (page === 'network') {
          const c = navigator.connection || {};
          h = head('Network') + `<div class="set-group">${row('Status', navigator.onLine ? 'Connected' : 'Offline', `<span class="row" style="color:${navigator.onLine ? '#3fdc77' : '#e5484d'}">${gl(navigator.onLine ? 'wifi' : 'wifioff')}</span>`)}${row('Connection type', (c.effectiveType || 'unknown').toUpperCase() + (c.downlink ? ` · ~${c.downlink} Mbps` : '') + (c.rtt ? ` · ${c.rtt} ms RTT` : ''), '')}${row('IP address', '10.0.2.15 (virtual)', '')}${row('Hostname', esc(S.hostname), `<button class="btn sm" data-a="hostname">Change</button>`)}</div>
          <div class="set-group">${row('Speed test', 'Measures latency to a public server', `<button class="btn sm" data-a="speed">Run test</button>`)}<div class="set-row small muted speed-out" hidden></div></div>`;
        } else if (page === 'notifications') {
          h = head('Notifications') + `<div class="set-group">${row('Do Not Disturb', 'Hide notification pop-ups', sw('dnd'))}${row('Send a test notification', '', `<button class="btn sm" data-a="testnotif">Send</button>`)}</div>`;
        } else if (page === 'users') {
          h = head('Users') + `<div class="set-group"><div class="set-row" style="gap:18px"><div class="avatar" style="width:72px;height:72px;font-size:30px;background:${S.avatar}">${esc((S.fullname || S.username)[0].toUpperCase())}</div><div class="lab"><b style="font-size:18px">${esc(S.fullname)}</b><small>${esc(S.username)} · Administrator</small></div></div>
            ${row('Full name', '', `<input class="inp" data-text="fullname" value="${esc(S.fullname)}" style="width:200px">`)}
            ${row('Username', 'Your home folder is /home/' + esc(S.username), `<button class="btn sm" data-a="username">Change</button>`)}
            ${row('Avatar color', '', `<div class="swatches">${OS.accents.slice(0, 8).map((c) => `<div class="swatch ${S.avatar === c ? 'on' : ''}" data-avatar="${c}" style="background:${c}"></div>`).join('')}</div>`)}
            ${row('Password', S.password ? 'Password is set — required to unlock and for sudo' : 'No password set', `<button class="btn sm" data-a="password">${S.password ? 'Change' : 'Set'}</button>${S.password ? ' <button class="btn sm danger" data-a="nopass">Remove</button>' : ''}`)}
            ${row('Show lock screen at startup', '', sw('lockOnBoot'))}</div>`;
        } else if (page === 'apps') {
          const inst = Object.keys(OS.pkg.repo).filter((n) => OS.pkg.repo[n].type === 'app' && OS.pkg.isInstalled(n) && OS.apps[n]);
          h = head('Apps') + `<div class="set-gtitle">Default apps</div><div class="set-group">${row('Web search engine', 'Used by the Browser and app menu', `<select class="inp" data-select="searchEngine">${['wikipedia', 'duckduckgo', 'bing', 'google'].map((e) => `<option ${S.searchEngine === e ? 'selected' : ''}>${e}</option>`).join('')}</select>`)}${row('Browser home page', '', `<input class="inp" data-text="homepage" value="${esc(S.homepage)}" style="width:200px">`)}${row('Terminal colors', '', seg('termTheme', [['dark', 'Dark'], ['light', 'Light']]))}</div>
            <div class="set-gtitle">Installed apps (${inst.length})</div><div class="set-group">${inst.map((id) => row(`<span class="row">${OS.appIcon(id, 30)} ${esc(OS.apps[id].name)}</span>`, `${OS.pkg.repo[id].v} · ${OS.fmtSize(OS.pkg.repo[id].size * 1024)}`, OS.pkg.repo[id].core ? '<small class="muted">System</small>' : `<button class="btn sm danger" data-uninstall="${id}">Uninstall</button>`)).join('')}</div>
            <button class="btn" data-a="software">${gl('bag')}Get more apps</button>`;
        } else if (page === 'datetime') {
          h = head('Date & Time') + `<div class="set-group">${row('Current time', new Date().toLocaleString(), '')}${row('Time zone', Intl.DateTimeFormat().resolvedOptions().timeZone, '')}${row('24-hour clock', '', sw('clock24'))}${row('Show seconds in panel', '', sw('showSeconds'))}</div>`;
        } else if (page === 'storage') {
          const used = OS.store.size(), quota = 10 * 1024 * 1024, fsz = OS.fs.totalSize();
          h = head('Storage') + `<div class="set-group"><div class="set-row" style="display:block"><div class="row" style="margin-bottom:10px"><b style="flex:1">Browser storage</b><span class="muted">${OS.fmtSize(used)} of ~${OS.fmtSize(quota)}</span></div><div class="meter"><i style="width:${Math.min(100, used / quota * 100)}%"></i></div></div>
            ${row('Files', OS.fmtSize(fsz) + ' in ' + OS.fs.count(OS.fs.node('/')) + ' items', `<button class="btn sm" data-a="openfiles">Open</button>`)}${row('Trash', OS.fs.trashCount() + ' items', `<button class="btn sm danger" data-a="emptytrash">Empty</button>`)}
            ${row('Export backup', 'Download all files and settings as a JSON file', `<button class="btn sm" data-a="export">Export</button>`)}${row('Import backup', 'Restore from a backup file', `<button class="btn sm" data-a="import">Import</button>`)}</div>
            <div class="set-gtitle" style="color:#e5484d">Danger zone</div><div class="set-group">${row('Factory reset', 'Erase all files, settings and installed apps', `<button class="btn sm primary danger" data-a="reset">Reset…</button>`)}</div>`;
        } else if (page === 'about') {
          h = head('About') + `<div class="set-group"><div class="set-row" style="flex-direction:column;padding:28px;gap:10px">${OS.logo(84)}<b style="font-size:22px">Cirrus Linux</b><span class="muted">${OS.version} “${OS.codename}”</span></div>
            ${row('Device name', esc(S.hostname), '')}${row('Processor', `Cirrus vCPU × ${navigator.hardwareConcurrency || 4}`, '')}${row('Memory', (navigator.deviceMemory || 8) + ' GB', '')}${row('Kernel', OS.kernel, '')}${row('Desktop', 'Cirrus Desktop ' + OS.version, '')}${row('Windowing system', 'Web Compositor (HTML5)', '')}${row('Packages', OS.pkg.installed().length + ' installed', '')}${row('Host browser', esc(navigator.userAgent.split(') ').pop()), '')}</div>`;
        }
        main.innerHTML = `<div class="set-sec">${h}</div>`;
        bind();
      }
      function bind() {
        const q = (s) => main.querySelectorAll(s);
        q('[data-a=side]').forEach((b) => (b.onclick = () => side.classList.toggle('open')));
        q('input[data-k]').forEach((i) => (i.onchange = () => OS.set(i.dataset.k, i.checked)));
        q('[data-seg]').forEach((s) => s.querySelectorAll('button').forEach((b) => (b.onclick = () => { OS.set(s.dataset.seg, b.dataset.v); render(); })));
        q('[data-theme]').forEach((c) => (c.onclick = () => { OS.set('theme', c.dataset.theme); render(); }));
        q('[data-accent]').forEach((c) => (c.onclick = () => { OS.set('accent', c.dataset.accent); render(); }));
        q('[data-custom-accent]').forEach((c) => (c.onchange = () => { OS.set('accent', c.value); render(); }));
        q('[data-avatar]').forEach((c) => (c.onclick = () => { OS.set('avatar', c.dataset.avatar); render(); }));
        q('[data-wp]').forEach((c) => (c.onclick = () => { OS.set('wallpaper', c.dataset.wp); render(); }));
        q('[data-range]').forEach((r) => { r.oninput = () => { OS.settings[r.dataset.range] = +r.value; OS.saveSettings(); OS.applySettings(); OS.emit('settings', r.dataset.range, +r.value); const sm = r.closest('.set-row').querySelector('small'); if (sm && r.dataset.range !== 'brightness') sm.textContent = r.value + '%'; }; });
        q('[data-text]').forEach((i) => (i.onchange = () => OS.set(i.dataset.text, i.value.trim() || OS.defaults[i.dataset.text])));
        q('[data-select]').forEach((i) => (i.onchange = () => OS.set(i.dataset.select, i.value)));
        q('[data-unpin]').forEach((b) => (b.onclick = () => { OS.set('pinned', OS.settings.pinned.filter((x) => x !== b.dataset.unpin)); render(); }));
        q('[data-uninstall]').forEach((b) => (b.onclick = async () => { const id = b.dataset.uninstall; if (await OS.confirm(`Uninstall ${OS.apps[id].name}?`, '', 'Uninstall', true)) { await OS.pkg.remove(id); render(); } }));
        const A = (n, f) => q(`[data-a=${n}]`).forEach((b) => (b.onclick = f));
        A('upwp', () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = () => { const f = i.files[0]; if (!f) return; const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); const sc = Math.min(1, 1920 / img.width); c.width = img.width * sc; c.height = img.height * sc; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); OS.settings.customWallpaper = c.toDataURL('image/jpeg', 0.82); OS.set('wallpaper', 'custom'); render(); }; img.src = URL.createObjectURL(f); }; i.click(); });
        A('fswp', async () => { const p = await OS.pickFile({ mode: 'open', path: OS.home() + '/Pictures', filter: (n) => OS.ftype(n) === 'image' }); if (p) { OS.settings.customWallpaper = OS.toDataUrl(OS.fs.read(p), p); OS.set('wallpaper', 'custom'); render(); } });
        A('fullscreen', () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); setTimeout(render, 400); });
        A('testsound', () => OS.sound('startup'));
        A('testnotif', () => OS.notify('Hello there!', 'This is what notifications look like.', { app: 'settings', force: true }));
        A('hostname', async () => { const n = await OS.prompt('Device name', '', S.hostname); if (n && /^[a-z0-9-]+$/i.test(n)) { OS.set('hostname', n); OS.fs.write('/etc/hostname', n + '\n'); render(); } else if (n) OS.alert('Invalid name', 'Use letters, numbers and dashes only.'); });
        A('speed', async () => { const o = main.querySelector('.speed-out'); o.hidden = false; o.textContent = 'Testing…'; const times = []; for (let i = 0; i < 4; i++) { const t0 = performance.now(); try { await fetch('https://www.wikipedia.org/favicon.ico?' + Math.random(), { mode: 'no-cors', cache: 'no-store' }); times.push(performance.now() - t0); } catch (e) {} } o.textContent = times.length ? `Latency: ${Math.min(...times).toFixed(0)} ms (best of ${times.length}) · ${navigator.connection?.downlink ? 'Estimated bandwidth ' + navigator.connection.downlink + ' Mbps' : ''}` : 'Could not reach the test server.'; });
        A('username', async () => { const n = await OS.prompt('Change username', 'Your home folder will be renamed.', S.username); if (!n || n === S.username) return; if (!/^[a-z_][a-z0-9_-]{0,30}$/.test(n)) return OS.alert('Invalid username', 'Use lowercase letters, digits, - and _.'); const old = S.username; OS.fs.renameHome(old, n); OS.set('username', n); OS.fs.write('/etc/passwd', OS.fs.read('/etc/passwd').split(old).join(n)); render(); });
        A('password', async () => { if (S.password) { const c = await OS.prompt('Current password', '', '', true); if (c !== S.password) return c !== null && OS.alert('Wrong password', ''); } const a = await OS.prompt('New password', '', '', true); if (a == null) return; const b = await OS.prompt('Confirm password', '', '', true); if (a !== b) return OS.alert('Passwords do not match', ''); OS.set('password', a); render(); });
        A('nopass', async () => { const c = await OS.prompt('Current password', '', '', true); if (c === S.password) { OS.set('password', ''); render(); } else if (c !== null) OS.alert('Wrong password', ''); });
        A('software', () => OS.wm.open('software'));
        A('openfiles', () => OS.wm.open('files', { path: '/' }));
        A('emptytrash', () => { OS.fs.emptyTrash(); render(); });
        A('export', () => { const data = { v: 1, settings: OS.settings, fs: OS.store.get('fs'), at: Date.now() }; OS.downloadReal(`cirrus-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data)); });
        A('import', () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.onchange = async () => { try { const d = JSON.parse(await i.files[0].text()); if (!d.fs || !d.settings) throw new Error('Not a Cirrus backup'); OS.store.set('fs', d.fs); OS.store.set('settings', d.settings); location.reload(); } catch (e) { OS.alert('Import failed', e.message); } }; i.click(); });
        A('reset', async () => { if (await OS.confirm('Factory reset?', 'All files, settings and apps will be erased. This cannot be undone.', 'Erase everything', true)) { try { Object.keys(localStorage).filter((k) => k.startsWith('cirrus.')).forEach((k) => localStorage.removeItem(k)); } catch (e) {} location.reload(); } });
      }
      const off = OS.on('settings', () => {}); win.onClose(off);
      win.onArgs = (a) => { if (a.page) { page = a.page; render(); } };
      render();
    },
  });

  /* ======================= SOFTWARE ======================= */
  OS.registerApp({
    id: 'software', name: 'Software', icon: 'bag', color: ['#ff6b9d', '#c147e9'], cat: 'System', w: 920, h: 620, single: true, desc: 'App store', keywords: 'store install apt packages',
    launch(win, args) {
      let tab = 'explore', q = args.q || '', cat = 'All'; const busy = {};
      win.body.innerHTML = `<div class="toolbar"><div class="seg" style="flex:none"><button data-t="explore">Explore</button><button data-t="installed">Installed</button><button data-t="updates">Updates</button></div><span class="grow"></span><div class="sm-search" style="margin:0;height:36px;width:min(280px,45%)">${gl('search')}<input placeholder="Search apps & packages" spellcheck="false"></div></div><div class="scroll sw-main"></div>`;
      const main = win.body.querySelector('.sw-main'), inp = win.body.querySelector('input'); inp.value = q;
      win.body.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { tab = b.dataset.t; render(); }));
      inp.oninput = () => { q = inp.value.trim(); tab = 'explore'; render(); };
      const R = OS.pkg.repo;
      const card = (n) => {
        const p = R[n], app = OS.apps[n], inst = OS.pkg.isInstalled(n);
        const icon = app ? OS.appIcon(app) : `<span class="pkg-ico">${gl(p.sec === 'Games' ? 'gamepad' : p.sec === 'Development' ? 'code' : p.sec === 'Network' ? 'globe' : 'terminal')}</span>`;
        const b = busy[n];
        return `<div class="sw-card" data-n="${n}">${icon}<div style="flex:1;min-width:0"><h4>${esc(app ? app.name : n)}</h4><div class="sw-meta">${esc(p.sec)} · ${p.type === 'app' ? 'App' : 'Command line'} · ${OS.fmtSize(p.size * 1024)}</div><p>${esc(p.desc)}</p>
          ${b ? `<div class="small muted">${b.label}</div><div class="prog"><i style="width:${Math.round(b.p * 100)}%"></i></div>` : `<div class="row" style="gap:6px">${inst ? `${app ? `<button class="btn sm primary" data-open="${n}">Open</button>` : p.cmds ? `<button class="btn sm" data-try="${n}">${gl('terminal')}Try</button>` : ''}${p.core ? '<small class="muted">System</small>' : `<button class="btn sm danger" data-rm="${n}">Remove</button>`}` : `<button class="btn sm primary" data-inst="${n}">${gl('download')}Install</button>`}</div>`}</div></div>`;
      };
      function render() {
        win.body.querySelectorAll('[data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
        let h = '';
        if (tab === 'explore') {
          let names = Object.keys(R).filter((n) => R[n].type !== 'lib');
          if (q) names = OS.pkg.search(q).filter((n) => R[n].type !== 'lib');
          const cats = ['All', ...new Set(Object.values(R).filter((p) => p.type !== 'lib').map((p) => p.sec))];
          if (cat !== 'All' && !q) names = names.filter((n) => R[n].sec === cat);
          names.sort((a, b) => (OS.pkg.isInstalled(a) - OS.pkg.isInstalled(b)) || (R[b].type === 'app') - (R[a].type === 'app') || a.localeCompare(b));
          if (!q && cat === 'All') h += `<div class="sw-hero">${OS.logo(64)}<div><h2>Discover great apps</h2><p>Games, tools and command-line utilities — installed in seconds. Everything here can also be installed with <b>sudo apt install</b>.</p></div></div>`;
          if (!q) h += `<div class="chips" style="padding:16px 16px 0">${cats.map((c) => `<button class="chip ${c === cat ? 'on' : ''}" data-cat="${c}">${c}</button>`).join('')}</div>`;
          h += names.length ? `<div class="sw-grid">${names.map(card).join('')}</div>` : `<div class="empty">${gl('search')}<div>No results for “${esc(q)}”</div></div>`;
        } else if (tab === 'installed') {
          const names = OS.pkg.installed().filter((n) => R[n] && R[n].type !== 'lib').sort();
          h = `<div class="pad muted small">${names.length} packages installed</div><div class="sw-grid" style="padding-top:0">${names.map(card).join('')}</div>`;
        } else {
          const up = OS.pkg.upgradable();
          h = up.length ? `<div class="pad row"><b style="flex:1">${up.length} updates available</b><button class="btn primary" data-a="upall">${gl('download')}Update all</button></div><div class="sw-grid" style="padding-top:0">${up.map((n) => `<div class="sw-card">${OS.apps[n] ? OS.appIcon(n) : `<span class="pkg-ico">${gl('package')}</span>`}<div><h4>${esc(OS.pkg.label(n))}</h4><div class="sw-meta">${R[n].v} → ${R[n].v}+1</div><p>Bug fixes and security improvements.</p></div></div>`).join('')}</div>` : `<div class="empty">${gl('check')}<div><b>Your system is up to date</b></div><div class="small">Last checked just now</div></div>`;
        }
        main.innerHTML = h;
        main.querySelectorAll('[data-cat]').forEach((b) => (b.onclick = () => { cat = b.dataset.cat; render(); }));
        main.querySelectorAll('[data-inst]').forEach((b) => (b.onclick = () => install(b.dataset.inst)));
        main.querySelectorAll('[data-rm]').forEach((b) => (b.onclick = async () => { const n = b.dataset.rm; if (!(await OS.confirm(`Remove ${OS.pkg.label(n)}?`, '', 'Remove', true))) return; busy[n] = { p: .5, label: 'Removing…' }; render(); await OS.pkg.remove(n); delete busy[n]; render(); }));
        main.querySelectorAll('[data-open]').forEach((b) => (b.onclick = () => OS.wm.open(b.dataset.open)));
        main.querySelectorAll('[data-try]').forEach((b) => (b.onclick = () => OS.wm.open('terminal', { cmd: { cowsay: 'cowsay Hello from Cirrus!', figlet: 'figlet Cirrus', fortune: 'fortune | cowsay', sl: 'sl', cmatrix: 'cmatrix', lolcat: 'fortune | lolcat', htop: 'htop', tree: 'tree ~', nodejs: 'node', python3: 'python3', git: 'git --version', bc: 'bc', toilet: 'toilet Hi', 'bsd-games': 'guess', asciiquarium: 'asciiquarium', neofetch: 'neofetch', curl: 'curl https://api.github.com/zen', wget: 'wget --help', 'iputils-ping': 'ping -c 3 wikipedia.org', jq: 'echo \'{"hello":"world"}\' | jq .', nano: 'nano', vim: 'vim' }[b.dataset.try] || b.dataset.try })));
        const ua = main.querySelector('[data-a=upall]'); if (ua) ua.onclick = async () => { ua.disabled = true; ua.textContent = 'Updating…'; await OS.sleep(1500); OS.pkg.markUpgraded(); OS.notify('System updated', 'All packages are up to date.', { app: 'software' }); render(); };
      }
      async function install(n) {
        busy[n] = { p: 0, label: 'Downloading…' }; render();
        await OS.pkg.install(n, (p, stage) => { busy[n] = { p, label: stage === 'unpack' ? 'Installing…' : `Downloading… ${Math.round(p * 100)}%` }; const c = main.querySelector(`[data-n="${n}"] .prog i`); const l = main.querySelector(`[data-n="${n}"] .small`); if (c) c.style.width = p * 100 + '%'; if (l) l.textContent = busy[n].label; });
        delete busy[n]; render();
        OS.notify(`${OS.pkg.label(n)} installed`, OS.apps[n] ? 'Find it in the app menu.' : `Run it from the Terminal.`, { app: OS.apps[n] ? n : 'software', onclick: () => (OS.apps[n] ? OS.wm.open(n) : OS.wm.open('terminal')) });
      }
      const off = OS.on('pkg', () => render()); win.onClose(off);
      win.onArgs = (a) => { if (a.q) { q = a.q; inp.value = q; tab = 'explore'; render(); } };
      render();
    },
  });
})();
