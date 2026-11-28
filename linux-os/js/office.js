/* Cirrus Linux — Cumulus Office: Writer, Sheets, Slides and the start center */
(function () {
  'use strict';
  const esc = OS.esc, gl = OS.glyph;
  const office = (OS.office = {});

  /* ---------- shared document plumbing ---------- */
  function docController(win, { appName, defaultName, dir = 'Documents', saveExt, filter, serialize, deserialize, onTitle }) {
    const c = { path: null, dirty: false };
    c.title = () => { win.setTitle((c.dirty ? '• ' : '') + (c.path ? OS.fs.basename(c.path) : defaultName) + ' — ' + appName); onTitle && onTitle(); };
    c.touch = () => { if (!c.dirty) { c.dirty = true; c.title(); } };
    c.save = async (as) => {
      let p = c.path && c.path.endsWith('.' + saveExt) ? c.path : null;
      if (!p || as) {
        const base = c.path ? OS.fs.basename(c.path).replace(/\.[^.]+$/, '') : defaultName;
        p = await OS.pickFile({ mode: 'save', path: c.path ? OS.fs.dirname(c.path) : OS.home() + '/' + dir, name: base + '.' + saveExt });
        if (!p) return false; if (!new RegExp('\\.' + saveExt + '$', 'i').test(p)) p += '.' + saveExt;
        if (OS.fs.exists(p) && p !== c.path && !(await OS.confirm('Replace file?', `“${OS.fs.basename(p)}” already exists. Replace it?`, 'Replace', true))) return false;
      }
      try { OS.fs.write(p, serialize()); c.path = p; c.dirty = false; c.title(); OS.emit('office-recent'); return true; } catch (e) { OS.alert('Could not save', e.message + (/quota/i.test(e.message) ? '\nBrowser storage is full — try removing large images.' : '')); return false; }
    };
    c.open = async () => { if (!(await c.confirmLose())) return; const p = await OS.pickFile({ mode: 'open', path: c.path ? OS.fs.dirname(c.path) : OS.home() + '/' + dir, filter }); if (p) c.load(p); };
    c.load = (p) => { try { const content = OS.fs.read(p); deserialize(content, p); c.path = p; c.dirty = false; c.title(); return true; } catch (e) { OS.alert('Could not open file', e.message); return false; } };
    c.confirmLose = async () => { if (!c.dirty) return true; const r = await OS.dialog({ title: 'Save changes?', message: `Save changes to “${c.path ? OS.fs.basename(c.path) : defaultName}” before closing?`, buttons: [{ label: 'Cancel', value: 'c' }, { label: "Don't save", value: 'd', danger: true }, { label: 'Save', value: 's', primary: true }] }); if (r === 's') return c.save(); return r === 'd'; };
    win.beforeClose = c.confirmLose;
    return c;
  }
  const tbBtn = (a, icon, title, extra = '') => `<button class="ibtn" data-a="${a}" title="${title}" ${extra}>${gl(icon)}</button>`;
  const sep = '<span class="tsep" style="height:22px"></span>';
  // keep focus/selection when tapping toolbar buttons
  const noFocusSteal = (root) => root.querySelectorAll('button').forEach((b) => b.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' || OS.isTouch()) e.preventDefault(); }));
  const colorBtn = (a, icon, title, val) => `<label class="ibtn of-color" title="${title}">${gl(icon)}<i data-sw="${a}" style="background:${val}"></i><input type="color" data-a="${a}" value="${val}"></label>`;
  function printHtml(html) { const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f); f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close(); setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} setTimeout(() => f.remove(), 2000); }, 400); }
  const sanitize = (html) => { const d = new DOMParser().parseFromString(html, 'text/html'); d.querySelectorAll('script,iframe,object,embed,link,meta,style[data-x]').forEach((x) => x.remove()); d.querySelectorAll('*').forEach((el) => [...el.attributes].forEach((a) => { if (/^on/i.test(a.name) || (/^(href|src)$/i.test(a.name) && /^\s*javascript:/i.test(a.value))) el.removeAttribute(a.name); })); return d.body.innerHTML; };

  /* =========================== WRITER =========================== */
  const WR_TEMPLATES = {
    Blank: '<p><br></p>',
    Letter: () => `<p style="text-align:right">${esc(OS.settings.fullname)}<br>123 Cloud Street<br>Cirrus City</p><p style="text-align:right">${new Date().toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}</p><p>Dear Recipient,</p><p>I am writing to you regarding… Replace this text with the body of your letter. Keep paragraphs short and to the point.</p><p>Thank you for your time and consideration.</p><p>Kind regards,</p><p><b>${esc(OS.settings.fullname)}</b></p>`,
    Resume: () => `<h1 style="text-align:center">${esc(OS.settings.fullname)}</h1><p style="text-align:center">email@example.com · +00 123 456 789 · Cirrus City</p><hr><h2>Profile</h2><p>A short summary of who you are, what you do best and what you are looking for.</p><h2>Experience</h2><h3>Job Title — Company</h3><p><i>2022 – present</i></p><ul><li>Key achievement with a measurable result</li><li>Another responsibility or accomplishment</li></ul><h2>Education</h2><p><b>Degree</b>, University — 2021</p><h2>Skills</h2><ul><li>Skill one</li><li>Skill two</li><li>Skill three</li></ul>`,
    Report: () => `<h1>Report Title</h1><p><i>Prepared by ${esc(OS.settings.fullname)} · ${new Date().toLocaleDateString()}</i></p><h2>1. Summary</h2><p>Summarize the purpose and key findings of this report.</p><h2>2. Background</h2><p>Describe the context.</p><h2>3. Findings</h2><table class="wr-table"><tbody><tr><th>Metric</th><th>Value</th><th>Change</th></tr><tr><td>Users</td><td>1,240</td><td>+12%</td></tr><tr><td>Revenue</td><td>$8,400</td><td>+5%</td></tr></tbody></table><h2>4. Recommendations</h2><ol><li>First recommendation</li><li>Second recommendation</li></ol>`,
    'Meeting notes': () => `<h1>Meeting Notes</h1><p><b>Date:</b> ${new Date().toLocaleDateString()}<br><b>Attendees:</b> </p><h2>Agenda</h2><ol><li>Topic one</li><li>Topic two</li></ol><h2>Notes</h2><p><br></p><h2>Action items</h2><ul><li>☐ Task — owner — due date</li></ul>`,
  };
  const FONTS = [['Default', ''], ['Sans (Inter)', 'Inter, system-ui, sans-serif'], ['Serif (Georgia)', 'Georgia, serif'], ['Times', '"Times New Roman", Times, serif'], ['Arial', 'Arial, Helvetica, sans-serif'], ['Verdana', 'Verdana, sans-serif'], ['Courier', '"Courier New", monospace'], ['Mono', '"JetBrains Mono", monospace'], ['Comic', '"Comic Sans MS", "Comic Neue", cursive']];
  const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];
  const STYLES = [['p', 'Normal'], ['h1', 'Heading 1'], ['h2', 'Heading 2'], ['h3', 'Heading 3'], ['blockquote', 'Quote'], ['pre', 'Code']];
  const WR_CSS = `font-family:Georgia,serif;font-size:12pt;line-height:1.5;color:#1a1a1a`;

  OS.registerApp({
    id: 'writer', name: 'Writer', icon: 'filetext', color: ['#4a8dff', '#2456d6'], cat: 'Office', w: 1000, h: 700, desc: 'Cumulus Writer — word processor', keywords: 'word document doc docx odt office libreoffice writer text',
    launch(win, args) {
      win.body.innerHTML = `
        <div class="toolbar of-tb">
          ${tbBtn('menu', 'menu', 'File')}${tbBtn('save', 'save', 'Save (Ctrl+S)')}${tbBtn('undo', 'undo', 'Undo')}${tbBtn('redo', 'redo', 'Redo')}${sep}
          <select class="inp of-sel" data-s="style" title="Paragraph style">${STYLES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
          <select class="inp of-sel hide-m" data-s="font" title="Font">${FONTS.map(([l, v]) => `<option value='${v}'>${l}</option>`).join('')}</select>
          <select class="inp of-sel" data-s="size" title="Font size" style="width:64px">${SIZES.map((s) => `<option ${s === 12 ? 'selected' : ''}>${s}</option>`).join('')}</select>${sep}
          ${tbBtn('bold', 'bold', 'Bold (Ctrl+B)')}${tbBtn('italic', 'italic', 'Italic (Ctrl+I)')}${tbBtn('underline', 'underline', 'Underline (Ctrl+U)')}${tbBtn('strikeThrough', 'strike', 'Strikethrough')}
          ${colorBtn('foreColor', 'type', 'Text color', '#e5484d')}${colorBtn('hiliteColor', 'highlight', 'Highlight', '#fff176')}${sep}
          ${tbBtn('justifyLeft', 'alignl', 'Align left')}${tbBtn('justifyCenter', 'alignc', 'Center')}${tbBtn('justifyRight', 'alignr', 'Align right')}${tbBtn('justifyFull', 'alignj', 'Justify')}${sep}
          ${tbBtn('insertUnorderedList', 'listul', 'Bullet list')}${tbBtn('insertOrderedList', 'listol', 'Numbered list')}${tbBtn('outdent', 'outdent', 'Decrease indent')}${tbBtn('indent', 'indent', 'Increase indent')}${sep}
          ${tbBtn('link', 'link', 'Insert link')}${tbBtn('image', 'image', 'Insert image')}${tbBtn('table', 'table', 'Insert table')}${tbBtn('insert', 'plus', 'Insert…')}${tbBtn('removeFormat', 'clearfmt', 'Clear formatting')}${sep}
          ${tbBtn('find', 'search', 'Find & replace (Ctrl+F)')}
        </div>
        <div class="toolbar of-find" hidden><input class="inp" placeholder="Find" style="flex:1;min-width:90px"><input class="inp" placeholder="Replace with" style="flex:1;min-width:90px"><button class="btn sm" data-f="next">Next</button><button class="btn sm" data-f="rep">Replace</button><button class="btn sm" data-f="all">All</button><button class="ibtn" data-f="x">${gl('x')}</button></div>
        <div class="wr-wrap scroll"><div class="wr-page" contenteditable="true" spellcheck="true" style="${WR_CSS}"></div></div>
        <div class="statusbar"><span data-st></span><span class="spacer"></span><button class="ibtn" data-a="zoomout" style="width:26px;height:26px">${gl('minus')}</button><span data-zoom style="min-width:40px;text-align:center">100%</span><button class="ibtn" data-a="zoomin" style="width:26px;height:26px">${gl('plus')}</button></div>`;
      const $ = (s) => win.body.querySelector(s), page = $('.wr-page'), wrap = $('.wr-wrap');
      let saved = null, zoom = OS.isMobile() ? 1 : OS.store.get('wr-zoom', 1);
      const doc = docController(win, {
        appName: 'Writer', defaultName: 'Untitled Document', saveExt: 'cdoc', filter: (n) => /\.(cdoc|docx?|odt|html?|txt|md|rtf)$/i.test(n),
        serialize: () => '<!-- cumulus-writer 1 -->\n' + page.innerHTML,
        deserialize: (c, p) => {
          const e = OS.ext(p);
          if (['docx', 'odt'].includes(e) || (OS.isDataUrl(c) && e !== 'cdoc')) throw new Error(`.${e} files in binary format can't be opened. Writer opens .cdoc, .doc (HTML), .html, .txt and .md files.`);
          if (e === 'txt' || e === 'md' || e === 'rtf') page.innerHTML = c.split(/\n/).map((l) => (e === 'md' && /^#{1,3} /.test(l) ? `<h${l.match(/^#+/)[0].length}>${esc(l.replace(/^#+ /, ''))}</h${l.match(/^#+/)[0].length}>` : `<p>${esc(l) || '<br>'}</p>`)).join('');
          else page.innerHTML = sanitize(/<body[^>]*>([\s\S]*)<\/body>/i.exec(c)?.[1] ?? c.replace(/^<!--[^>]*-->\n?/, ''));
          page.querySelectorAll('img').forEach((i) => (i.style.maxWidth = '100%'));
          updStatus();
        },
      });
      const restore = () => { page.focus({ preventScroll: true }); if (saved) { const s = getSelection(); s.removeAllRanges(); s.addRange(saved); } };
      const onSel = () => { const s = getSelection(); if (s.rangeCount && page.contains(s.anchorNode)) { saved = s.getRangeAt(0).cloneRange(); updState(); } };
      document.addEventListener('selectionchange', onSel); win.onClose(() => document.removeEventListener('selectionchange', onSel));
      const changed = () => { doc.touch(); updStatusSoon(); };
      const exec = (cmd, val = null) => { restore(); document.execCommand('styleWithCSS', false, ['foreColor', 'hiliteColor', 'fontName'].includes(cmd)); document.execCommand(cmd, false, val); changed(); updState(); };
      function updState() {
        ['bold', 'italic', 'underline', 'strikeThrough', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull', 'insertUnorderedList', 'insertOrderedList'].forEach((c) => { const b = win.body.querySelector(`[data-a=${c}]`); if (b) b.classList.toggle('on', document.queryCommandState(c)); });
        const blk = (document.queryCommandValue('formatBlock') || 'p').toLowerCase().replace(/[<>]/g, ''); const st = $('[data-s=style]'); st.value = STYLES.some((x) => x[0] === blk) ? blk : 'p';
        const n = saved && (saved.startContainer.nodeType === 1 ? saved.startContainer : saved.startContainer.parentElement); if (n && page.contains(n)) { const px = parseFloat(getComputedStyle(n).fontSize); const pt = Math.round(px * 0.75); const sz = $('[data-s=size]'); if (SIZES.includes(pt)) sz.value = pt; }
      }
      let stT = null; const updStatusSoon = () => { clearTimeout(stT); stT = setTimeout(updStatus, 250); };
      function updStatus() { const t = page.innerText || ''; const words = t.split(/\s+/).filter(Boolean).length; const ph = page.offsetWidth * 1.414; const pages = Math.max(1, Math.ceil(page.scrollHeight / ph)); $('[data-st]').textContent = `Page ${pages > 1 ? '1–' + pages : 1} · ${words} word${words === 1 ? '' : 's'} · ${t.replace(/\n/g, '').length} characters`; }
      const applyZoom = () => { page.style.zoom = zoom; $('[data-zoom]').textContent = Math.round(zoom * 100) + '%'; };
      page.addEventListener('input', changed);
      page.addEventListener('keyup', updState); page.addEventListener('mouseup', updState);
      page.addEventListener('keydown', (e) => {
        const c = e.ctrlKey || e.metaKey;
        if (e.key === 'Tab') { e.preventDefault(); const li = saved && (saved.startContainer.parentElement || saved.startContainer).closest && (saved.startContainer.nodeType === 1 ? saved.startContainer : saved.startContainer.parentElement).closest('li'); if (li) exec(e.shiftKey ? 'outdent' : 'indent'); else if (!e.shiftKey) exec('insertText', '    '); }
        else if (c && e.key === 's') { e.preventDefault(); doc.save(e.shiftKey); }
        else if (c && e.key === 'o') { e.preventDefault(); doc.open(); }
        else if (c && e.key === 'p') { e.preventDefault(); print(); }
        else if (c && e.key === 'f') { e.preventDefault(); toggleFind(); }
        else if (c && e.key === 'k') { e.preventDefault(); link(); }
        else if (c && (e.key === 'b' || e.key === 'i' || e.key === 'u')) setTimeout(() => { changed(); updState(); });
      });
      page.addEventListener('click', (e) => { const a = e.target.closest('a'); if (a && (e.ctrlKey || e.metaKey)) OS.wm.open('browser', { url: a.href }); });
      page.addEventListener('paste', (e) => { const h = e.clipboardData.getData('text/html'); if (h) { e.preventDefault(); exec('insertHTML', sanitize(h)); } });
      // toolbar
      const simple = ['bold', 'italic', 'underline', 'strikeThrough', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull', 'insertUnorderedList', 'insertOrderedList', 'outdent', 'indent', 'removeFormat', 'undo', 'redo'];
      simple.forEach((c) => (win.body.querySelector(`[data-a=${c}]`).onclick = () => exec(c)));
      noFocusSteal($('.of-tb'));
      win.body.querySelectorAll('input[type=color][data-a]').forEach((i) => { i.addEventListener('pointerdown', () => onSel()); i.oninput = () => { win.body.querySelector(`[data-sw=${i.dataset.a}]`).style.background = i.value; }; i.onchange = () => exec(i.dataset.a, i.value); });
      $('[data-s=style]').onchange = (e) => exec('formatBlock', e.target.value);
      $('[data-s=font]').onchange = (e) => { if (e.target.value) exec('fontName', e.target.value); };
      $('[data-s=size]').onchange = (e) => { restore(); document.execCommand('styleWithCSS', false, false); document.execCommand('fontSize', false, '7'); page.querySelectorAll('font[size="7"]').forEach((f) => { const s = document.createElement('span'); s.style.fontSize = e.target.value + 'pt'; s.innerHTML = f.innerHTML; f.replaceWith(s); }); changed(); };
      async function link() { onSel(); const u = await OS.prompt('Insert link', 'Web address:', 'https://'); if (u && u !== 'https://') { if (saved && saved.collapsed) exec('insertHTML', `<a href="${esc(u)}">${esc(u)}</a>`); else exec('createLink', u); } }
      $('[data-a=link]').onclick = link;
      const insertImg = (src) => exec('insertHTML', `<img src="${src}" style="max-width:100%;width:60%">`);
      $('[data-a=image]').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left, r.bottom + 4, [
        { label: 'From Pictures…', icon: 'image', action: async () => { const p = await OS.pickFile({ mode: 'open', path: OS.home() + '/Pictures', filter: (n) => OS.ftype(n) === 'image' }); if (p) insertImg(OS.toDataUrl(OS.fs.read(p), p)); } },
        { label: 'From device…', icon: 'upload', action: () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = () => { const f = i.files[0]; if (!f) return; const img = new Image(); img.onload = () => { const cv = document.createElement('canvas'); const sc = Math.min(1, 1200 / img.width); cv.width = img.width * sc; cv.height = img.height * sc; cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); insertImg(cv.toDataURL('image/jpeg', 0.85)); }; img.src = URL.createObjectURL(f); }; i.click(); } },
      ]); };
      $('[data-a=table]').onclick = () => { onSel(); const p = OS.dialog({ title: 'Insert table', html: '<div class="row"><label class="col" style="flex:1;gap:4px">Rows<input class="inp" type="number" min="1" max="50" value="3" data-f="r"></label><label class="col" style="flex:1;gap:4px">Columns<input class="inp" type="number" min="1" max="12" value="3" data-f="c"></label></div><label class="row small"><input type="checkbox" checked data-f="h"> Header row</label>', buttons: [{ label: 'Cancel', value: null }, { label: 'Insert', value: 'ok', primary: true }] }); const d = OS._dlg.el; const R = d.querySelector('[data-f=r]'), Cc = d.querySelector('[data-f=c]'), Hh = d.querySelector('[data-f=h]'); p.then((v) => { if (v !== 'ok') return; const r = OS.clamp(+R.value || 3, 1, 50), c = OS.clamp(+Cc.value || 3, 1, 12); let h = '<table class="wr-table"><tbody>'; for (let i = 0; i < r; i++) { h += '<tr>' + Array(c).fill(i === 0 && Hh.checked ? '<th><br></th>' : '<td><br></td>').join('') + '</tr>'; } exec('insertHTML', h + '</tbody></table><p><br></p>'); }); };
      $('[data-a=insert]').onclick = (e) => { onSel(); const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left, r.bottom + 4, [
        { label: 'Horizontal line', icon: 'hr', action: () => exec('insertHorizontalRule') },
        { label: 'Page break', icon: 'filetext', action: () => exec('insertHTML', '<hr class="wr-pb"><p><br></p>') },
        { label: 'Date', icon: 'calendar', action: () => exec('insertText', new Date().toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })) },
        { label: 'Time', icon: 'clock', action: () => exec('insertText', OS.fmtTime()) },
        { label: 'Checkbox ☐', icon: 'check', action: () => exec('insertText', '☐ ') },
        { label: 'Special character…', icon: 'type', action: async () => { const chars = '© ® ™ € £ ¥ § ¶ † • … – — « » ° ± × ÷ ½ ¼ ¾ → ← ↑ ↓ ★ ☆ ♥ ✓ ✗ α β γ δ π Σ Ω ∞ ≈ ≠ ≤ ≥'.split(' '); const pr = OS.dialog({ title: 'Special characters', html: `<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px">${chars.map((c) => `<button class="btn" data-ch="${c}" style="padding:6px;min-height:36px">${c}</button>`).join('')}</div>`, buttons: [{ label: 'Close', value: null }] }); OS._dlg.el.querySelectorAll('[data-ch]').forEach((b) => (b.onclick = () => { OS._dlg.done(b.dataset.ch); })); const ch = await pr; if (ch) exec('insertText', ch); } },
      ]); };
      // find & replace
      const fb = $('.of-find'), [fi, ri] = fb.querySelectorAll('input');
      const toggleFind = () => { fb.hidden = !fb.hidden; if (!fb.hidden) { fi.value = saved && !saved.collapsed ? saved.toString() : fi.value; fi.focus(); fi.select(); } };
      $('[data-a=find]').onclick = toggleFind;
      function findNext(fromStart) {
        const q = fi.value.toLowerCase(); if (!q) return false;
        const w = document.createTreeWalker(page, NodeFilter.SHOW_TEXT); const nodes = []; let text = '', n;
        while ((n = w.nextNode())) { nodes.push([n, text.length]); text += n.data; }
        let start = 0; if (!fromStart && saved) { const hit = nodes.find(([x]) => x === saved.endContainer); if (hit) start = hit[1] + saved.endOffset; }
        let idx = text.toLowerCase().indexOf(q, start); if (idx < 0) idx = text.toLowerCase().indexOf(q); if (idx < 0) { fi.classList.add('shake'); setTimeout(() => fi.classList.remove('shake'), 400); return false; }
        const loc = (off, end) => { for (let i = nodes.length - 1; i >= 0; i--) if (nodes[i][1] < off || (nodes[i][1] === off && !end) || (end && nodes[i][1] < off)) return [nodes[i][0], off - nodes[i][1]]; return [nodes[0][0], 0]; };
        const [sn, so] = loc(idx, false), [en, eo] = loc(idx + q.length, true);
        const r = document.createRange(); r.setStart(sn, so); r.setEnd(en, eo); const s = getSelection(); s.removeAllRanges(); s.addRange(r); saved = r.cloneRange();
        const rect = r.getBoundingClientRect(), wr = wrap.getBoundingClientRect(); if (rect.top < wr.top || rect.bottom > wr.bottom) wrap.scrollTop += rect.top - wr.top - wr.height / 3;
        return true;
      }
      fb.querySelector('[data-f=next]').onclick = () => findNext();
      fi.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); findNext(); } if (e.key === 'Escape') fb.hidden = true; };
      fb.querySelector('[data-f=rep]').onclick = () => { if (saved && saved.toString().toLowerCase() === fi.value.toLowerCase()) exec('insertText', ri.value); findNext(); };
      fb.querySelector('[data-f=all]').onclick = () => { let n = 0; if (!fi.value) return; saved = null; while (n < 1000 && findNext(n === 0)) { if (saved.toString().toLowerCase() !== fi.value.toLowerCase()) break; exec('insertText', ri.value); n++; if (ri.value.toLowerCase().includes(fi.value.toLowerCase())) break; } OS.notify('Replace all', `${n} replacement${n === 1 ? '' : 's'}`, { app: 'writer' }); };
      fb.querySelector('[data-f=x]').onclick = () => (fb.hidden = true);
      // table / image context menu
      page.addEventListener('contextmenu', (e) => {
        const cell = e.target.closest('td,th'), img = e.target.closest('img'); if (!cell && !img) return;
        e.preventDefault();
        if (img) return OS.menu(e.clientX, e.clientY, [...[25, 50, 75, 100].map((p) => ({ label: `Width ${p}%`, icon: 'image', action: () => { img.style.width = p + '%'; changed(); } })), '-', { label: 'Align left', icon: 'alignl', action: () => { img.style.cssFloat = 'left'; img.style.margin = '4px 14px 8px 0'; img.style.display = ''; changed(); } }, { label: 'Center', icon: 'alignc', action: () => { img.style.cssFloat = ''; img.style.display = 'block'; img.style.margin = '8px auto'; changed(); } }, { label: 'Align right', icon: 'alignr', action: () => { img.style.cssFloat = 'right'; img.style.margin = '4px 0 8px 14px'; img.style.display = ''; changed(); } }, '-', { label: 'Delete image', icon: 'trash', danger: true, action: () => { img.remove(); changed(); } }]);
        const tr = cell.parentElement, table = cell.closest('table'), ci = [...tr.children].indexOf(cell);
        const mk = (tag) => { const c = document.createElement(tag); c.innerHTML = '<br>'; return c; };
        OS.menu(e.clientX, e.clientY, [
          { label: 'Insert row above', icon: 'arrowup', action: () => { const n = tr.cloneNode(true); n.querySelectorAll('td,th').forEach((c) => (c.innerHTML = '<br>')); tr.before(n); changed(); } },
          { label: 'Insert row below', icon: 'arrowdown', action: () => { const n = document.createElement('tr'); [...tr.children].forEach(() => n.appendChild(mk('td'))); tr.after(n); changed(); } },
          { label: 'Insert column left', icon: 'left', action: () => { table.querySelectorAll('tr').forEach((r) => r.children[ci]?.before(mk(r.children[ci].tagName.toLowerCase()))); changed(); } },
          { label: 'Insert column right', icon: 'right', action: () => { table.querySelectorAll('tr').forEach((r) => r.children[ci]?.after(mk(r.children[ci].tagName.toLowerCase()))); changed(); } },
          '-', { label: 'Delete row', icon: 'minus', danger: true, action: () => { if (table.querySelectorAll('tr').length > 1) tr.remove(); else table.remove(); changed(); } },
          { label: 'Delete column', icon: 'minus', danger: true, action: () => { const rows = table.querySelectorAll('tr'); if (tr.children.length > 1) rows.forEach((r) => r.children[ci]?.remove()); else table.remove(); changed(); } },
          { label: 'Delete table', icon: 'trash', danger: true, action: () => { table.remove(); changed(); } },
        ]);
      });
      // file menu
      const exportHtml = () => `<!doctype html><html><head><meta charset="utf-8"><title>${esc(doc.path ? OS.fs.basename(doc.path) : 'Document')}</title><style>body{${WR_CSS};max-width:760px;margin:40px auto;padding:0 24px}img{max-width:100%}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:6px 8px}th{background:#f0f0f0}hr.wr-pb{page-break-after:always;border:0}blockquote{border-left:4px solid #ccc;margin-left:0;padding-left:16px;color:#555}pre{background:#f4f4f4;padding:10px;border-radius:6px}@media print{body{margin:0}}</style></head><body>${page.innerHTML}</body></html>`;
      const print = () => printHtml(exportHtml());
      const baseName = () => (doc.path ? OS.fs.basename(doc.path).replace(/\.[^.]+$/, '') : 'Untitled Document');
      const newDoc = async (tpl = 'Blank') => { if (!(await doc.confirmLose())) return; const t = WR_TEMPLATES[tpl]; page.innerHTML = typeof t === 'function' ? t() : t; doc.path = null; doc.dirty = false; doc.title(); updStatus(); page.focus(); };
      $('[data-a=menu]').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left, r.bottom + 4, [
        { label: 'New', icon: 'plus', key: 'Ctrl+N', action: () => newDoc() },
        { label: 'New from template…', icon: 'filetext', action: () => { const r2 = e.currentTarget.getBoundingClientRect(); OS.menu(r2.left + 20, r2.bottom + 30, Object.keys(WR_TEMPLATES).map((t) => ({ label: t, icon: 'filetext', action: () => newDoc(t) }))); } },
        { label: 'Open…', icon: 'folder', key: 'Ctrl+O', action: () => doc.open() },
        { label: 'Save', icon: 'save', key: 'Ctrl+S', action: () => doc.save() },
        { label: 'Save As…', icon: 'save', key: 'Ctrl+Shift+S', action: () => doc.save(true) },
        '-',
        { label: 'Export as HTML…', icon: 'globe', action: async () => { const p = await OS.pickFile({ mode: 'save', path: OS.home() + '/Documents', name: baseName() + '.html' }); if (p) { OS.fs.write(p, exportHtml()); OS.notify('Exported', OS.fs.pretty(p), { app: 'writer' }); } } },
        { label: 'Export as plain text…', icon: 'filetext', action: async () => { const p = await OS.pickFile({ mode: 'save', path: OS.home() + '/Documents', name: baseName() + '.txt' }); if (p) { OS.fs.write(p, page.innerText); OS.notify('Exported', OS.fs.pretty(p), { app: 'writer' }); } } },
        { label: 'Download as Word (.doc)', icon: 'download', action: () => OS.downloadReal(baseName() + '.doc', 'data:application/msword;charset=utf-8,' + encodeURIComponent('﻿' + exportHtml().replace('<html>', '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">'))) },
        { label: 'Download as HTML', icon: 'download', action: () => OS.downloadReal(baseName() + '.html', exportHtml()) },
        { label: 'Print / Save as PDF…', icon: 'printer', key: 'Ctrl+P', action: print },
        '-',
        { label: 'Word count', icon: 'info', action: () => { const t = page.innerText; OS.alert('Word count', `Words: ${t.split(/\s+/).filter(Boolean).length}\nCharacters: ${t.replace(/\n/g, '').length}\nCharacters (no spaces): ${t.replace(/\s/g, '').length}\nParagraphs: ${page.querySelectorAll('p,h1,h2,h3,li,blockquote,pre').length}`); } },
      ]); };
      $('[data-a=save]').onclick = () => doc.save();
      $('[data-a=zoomin]').onclick = () => { zoom = Math.min(2.5, +(zoom + 0.1).toFixed(2)); OS.store.set('wr-zoom', zoom); applyZoom(); };
      $('[data-a=zoomout]').onclick = () => { zoom = Math.max(0.4, +(zoom - 0.1).toFixed(2)); OS.store.set('wr-zoom', zoom); applyZoom(); };
      win.onArgs = async (a) => { if (a.path) { if (await doc.confirmLose()) doc.load(a.path); } else if (a.template) newDoc(a.template); };
      if (args.path) doc.load(args.path); else { const t = WR_TEMPLATES[args.template || 'Blank']; page.innerHTML = typeof t === 'function' ? t() : t; doc.title(); }
      applyZoom(); updStatus(); if (!OS.isTouch()) setTimeout(() => page.focus(), 60);
    },
  });

  /* =========================== SHEETS =========================== */
  const colName = (c) => { let s = ''; c++; while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; };
  const colIndex = (s) => { let n = 0; for (const ch of s.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };
  const parseRef = (ref) => { const m = /^\$?([A-Za-z]{1,2})\$?(\d+)$/.exec(ref); return m ? { c: colIndex(m[1]), r: +m[2] - 1 } : null; };
  const key = (r, c) => colName(c) + (r + 1);
  const newSheet = (name) => ({ name, cells: {}, rows: 100, cols: 26, colW: {} });
  const flat = (a) => a.reduce((o, x) => o.concat(Array.isArray(x) ? flat(x) : [x]), []);
  const nums = (a) => flat(a).filter((x) => typeof x === 'number' && isFinite(x));
  const ERR = (e) => { throw new Error(e); };
  const crit = (c) => { if (typeof c === 'number') return (v) => v === c; const m = /^(<=|>=|<>|=|<|>)?(.*)$/.exec(String(c)); const op = m[1] || '=', raw = m[2], n = parseFloat(raw), isN = raw !== '' && !isNaN(n); return (v) => { const x = isN && typeof v === 'number' ? v : String(v).toLowerCase(), y = isN && typeof v === 'number' ? n : raw.toLowerCase(); return op === '=' ? x == y : op === '<>' ? x != y : op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y; }; };
  const FN = {
    SUM: (...a) => nums(a).reduce((x, y) => x + y, 0), AVERAGE: (...a) => { const n = nums(a); return n.length ? n.reduce((x, y) => x + y, 0) / n.length : ERR('#DIV/0!'); },
    MIN: (...a) => { const n = nums(a); return n.length ? Math.min(...n) : 0; }, MAX: (...a) => { const n = nums(a); return n.length ? Math.max(...n) : 0; },
    COUNT: (...a) => nums(a).length, COUNTA: (...a) => flat(a).filter((x) => x !== '' && x != null).length, COUNTBLANK: (...a) => flat(a).filter((x) => x === '' || x == null).length,
    MEDIAN: (...a) => { const n = nums(a).sort((x, y) => x - y); if (!n.length) return 0; const m = Math.floor(n.length / 2); return n.length % 2 ? n[m] : (n[m - 1] + n[m]) / 2; },
    PRODUCT: (...a) => nums(a).reduce((x, y) => x * y, 1), ROUND: (x, n = 0) => Math.round(x * 10 ** n) / 10 ** n, ROUNDUP: (x, n = 0) => Math.ceil(x * 10 ** n) / 10 ** n, ROUNDDOWN: (x, n = 0) => Math.floor(x * 10 ** n) / 10 ** n,
    INT: Math.floor, ABS: Math.abs, SQRT: (x) => (x < 0 ? ERR('#NUM!') : Math.sqrt(x)), POWER: Math.pow, MOD: (a, b) => (b === 0 ? ERR('#DIV/0!') : ((a % b) + b) % b), PI: () => Math.PI, EXP: Math.exp, LN: Math.log, LOG10: Math.log10, LOG: (x, b = 10) => Math.log(x) / Math.log(b),
    RAND: () => Math.random(), RANDBETWEEN: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    IF: (c, a = true, b = false) => (c ? a : b), AND: (...a) => flat(a).every(Boolean), OR: (...a) => flat(a).some(Boolean), NOT: (x) => !x,
    CONCAT: (...a) => flat(a).join(''), CONCATENATE: (...a) => flat(a).join(''), LEN: (s) => String(s).length, UPPER: (s) => String(s).toUpperCase(), LOWER: (s) => String(s).toLowerCase(), PROPER: (s) => String(s).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    LEFT: (s, n = 1) => String(s).slice(0, n), RIGHT: (s, n = 1) => String(s).slice(-n), MID: (s, a, n) => String(s).substr(a - 1, n), TRIM: (s) => String(s).trim().replace(/\s+/g, ' '),
    NOW: () => new Date().toLocaleString(), TODAY: () => new Date().toLocaleDateString(), YEAR: (d) => new Date(d).getFullYear(),
    SUMIF: (r, c, s) => { const f = crit(c); const src = flat(r), sum = s ? flat(s) : src; return src.reduce((a, v, i) => a + (f(v) && typeof sum[i] === 'number' ? sum[i] : 0), 0); },
    COUNTIF: (r, c) => { const f = crit(c); return flat(r).filter((v) => v !== '' && f(v)).length; },
    AVERAGEIF: (r, c) => { const f = crit(c); const n = flat(r).filter((v) => typeof v === 'number' && f(v)); return n.length ? n.reduce((a, b) => a + b, 0) / n.length : ERR('#DIV/0!'); },
    VLOOKUP: (v, range, col, approx = false) => { const rows = range.rows || 1, cols = range.cols || range.length; for (let i = 0; i < rows; i++) { const k = range[i * cols]; if (approx ? k <= v : String(k).toLowerCase() === String(v).toLowerCase()) { if (!approx) return range[i * cols + col - 1]; } } ERR('#N/A'); },
    INDEX: (range, r, c = 1) => { const cols = range.cols || 1; const v = range[(r - 1) * cols + (c - 1)]; return v === undefined ? ERR('#REF!') : v; },
    IFERROR: (v, alt) => v, ISBLANK: (v) => v === '' || v == null, ISNUMBER: (v) => typeof v === 'number',
  };
  FN.AVG = FN.AVERAGE;
  const compiled = {};
  function compile(src) {
    if (compiled[src]) return compiled[src];
    const re = /\s+|"(?:[^"]|"")*"|(?:(?:[A-Za-z_][\w]*|'[^']+')!)?\$?[A-Za-z]{1,2}\$?\d+(?::\$?[A-Za-z]{1,2}\$?\d+)?(?![\w(])|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?%?|[A-Za-z_][A-Za-z0-9_.]*\s*\(|TRUE\b|FALSE\b|<>|<=|>=|[-+*/^&=<>(),;]/giy;
    let js = '', i = 0, m;
    while (i < src.length) {
      re.lastIndex = i; m = re.exec(src); if (!m || m.index !== i) throw new Error('#ERROR!');
      const t = m[0]; i += t.length;
      if (/^\s+$/.test(t)) js += ' ';
      else if (t[0] === '"') js += JSON.stringify(t.slice(1, -1).replace(/""/g, '"'));
      else if (/^(TRUE|FALSE)$/i.test(t)) js += t.toLowerCase();
      else if (/\($/.test(t)) { const n = t.replace(/\s*\($/, '').toUpperCase(); if (!FN[n]) throw new Error('#NAME?'); js += `F.${n}(`; }
      else if (/^[\d.]/.test(t)) js += t.endsWith('%') ? `(${t.slice(0, -1)}/100)` : t;
      else if (/[A-Za-z]/.test(t) && /\d/.test(t)) { const bang = t.lastIndexOf('!'); const sh = bang >= 0 ? JSON.stringify(t.slice(0, bang).replace(/^'|'$/g, '')) : 'null'; const ref = (bang >= 0 ? t.slice(bang + 1) : t).replace(/\$/g, '').toUpperCase(); if (ref.includes(':')) { const [a, b] = ref.split(':'); js += `R(${JSON.stringify(a)},${JSON.stringify(b)},${sh})`; } else js += `V(${JSON.stringify(ref)},${sh})`; }
      else if (t === '^') js += '**'; else if (t === '&') js += '+""+'; else if (t === '=') js += '=='; else if (t === '<>') js += '!='; else if (t === ';') js += ',';
      else if (/^[A-Za-z_]/.test(t)) throw new Error('#NAME?');
      else js += t;
    }
    let fn; try { fn = new Function('V', 'R', 'F', `"use strict";return (${js});`); } catch (e) { throw new Error('#ERROR!'); }
    compiled[src] = fn; return fn;
  }
  function evaluator(book) {
    const cache = new Map(), visiting = new Set();
    const sheetBy = (n, cur) => (n == null ? cur : book.sheets.find((s) => s.name.toLowerCase() === n.toLowerCase()) || ERR('#REF!'));
    function val(sh, k) {
      const id = sh.name + '!' + k; if (cache.has(id)) { const v = cache.get(id); if (v instanceof Error) throw v; return v; }
      const cell = sh.cells[k]; const raw = cell ? cell.v : '';
      let v;
      if (raw == null || raw === '') v = '';
      else if (typeof raw === 'string' && raw[0] === '=' && raw.length > 1) {
        if (visiting.has(id)) { const e = new Error('#CIRC!'); cache.set(id, e); throw e; }
        visiting.add(id);
        try {
          const f = compile(raw.slice(1));
          const V = (r, s) => { const t = sheetBy(s, sh); const p = parseRef(r); if (!p || p.r >= t.rows + 1000) ERR('#REF!'); const x = val(t, r); return x === '' ? 0 : x; };
          const R = (a, b, s) => { const t = sheetBy(s, sh); const p = parseRef(a), q = parseRef(b); if (!p || !q) ERR('#REF!'); const out = []; const r0 = Math.min(p.r, q.r), r1 = Math.max(p.r, q.r), c0 = Math.min(p.c, q.c), c1 = Math.max(p.c, q.c); for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push(val(t, key(r, c))); out.rows = r1 - r0 + 1; out.cols = c1 - c0 + 1; return out; };
          v = f(V, R, FN);
          if (Array.isArray(v)) v = v[0] ?? '';
          if (typeof v === 'number' && !isFinite(v)) ERR('#DIV/0!');
          if (v === undefined || v === null) v = 0;
        } catch (e) { const err = new Error(/^#/.test(e.message) ? e.message : '#ERROR!'); visiting.delete(id); cache.set(id, err); throw err; }
        visiting.delete(id);
      } else { const n = Number(String(raw).replace(/,/g, '')); v = typeof raw === 'number' ? raw : String(raw).trim() !== '' && !isNaN(n) && /^[\s\d.,+-eE]+$/.test(String(raw)) ? n : /^(true|false)$/i.test(raw) ? /^t/i.test(raw) : raw; }
      cache.set(id, v); return v;
    }
    return (sh, k) => { try { return val(sh, k); } catch (e) { return { err: e.message }; } };
  }
  function fmtVal(v, s = {}) {
    if (v && v.err) return v.err;
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (typeof v === 'number') {
      const f = s.fmt || 'gen', d = s.dec;
      if (f === 'num') return v.toLocaleString(undefined, { minimumFractionDigits: d ?? 2, maximumFractionDigits: d ?? 2 });
      if (f === 'int') return Math.round(v).toLocaleString();
      if (f === 'usd') return v.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: d ?? 2, maximumFractionDigits: d ?? 2 });
      if (f === 'eur') return v.toLocaleString(undefined, { style: 'currency', currency: 'EUR', minimumFractionDigits: d ?? 2, maximumFractionDigits: d ?? 2 });
      if (f === 'pct') return (v * 100).toFixed(d ?? 1) + '%';
      if (f === 'sci') return v.toExponential(d ?? 2);
      if (d != null) return v.toFixed(d);
      return Number.isInteger(v) ? String(v) : String(+v.toPrecision(10));
    }
    return String(v ?? '');
  }
  function shiftFormula(f, dr, dc) {
    return f.replace(/"(?:[^"]|"")*"|(?<![A-Za-z_$!])(\$?)([A-Za-z]{1,2})(\$?)(\d+)(?![\w(])/g, (m, ac, col, ar, row) => { if (m[0] === '"') return m; const c = ac ? colIndex(col) : colIndex(col) + dc, r = ar ? +row : +row + dr; if (c < 0 || r < 1) return '#REF!'; return `${ac}${colName(c)}${ar}${r}`; });
  }
  const parseCSV = (t, delim) => { delim = delim || (t.split('\n')[0].split('\t').length > t.split('\n')[0].split(',').length ? '\t' : t.split('\n')[0].split(';').length > t.split('\n')[0].split(',').length ? ';' : ','); const rows = []; let row = [], cur = '', q = false; for (let i = 0; i < t.length; i++) { const ch = t[i]; if (q) { if (ch === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; } else if (ch === '"') q = true; else if (ch === delim) { row.push(cur); cur = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += ch; } if (cur || row.length) { row.push(cur); rows.push(row); } return rows; };
  const toCSV = (rows, d = ',') => rows.map((r) => r.map((v) => { v = String(v ?? ''); return /[",\n;\t]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(d)).join('\n') + '\n';
  office.FN = FN;

  OS.registerApp({
    id: 'sheets', name: 'Sheets', icon: 'table', color: ['#3fdc77', '#138a4e'], cat: 'Office', w: 1040, h: 680, desc: 'Cumulus Sheets — spreadsheet', keywords: 'excel spreadsheet calc csv xlsx ods office libreoffice table formula',
    launch(win, args) {
      let book = { sheets: [newSheet('Sheet1')], active: 0 }, sh = book.sheets[0], cur = { r: 0, c: 0 }, anchor = { r: 0, c: 0 }, sel = { r1: 0, c1: 0, r2: 0, c2: 0 }, editing = null, undo = [], redo = [], ev = evaluator(book), clip = null, tds = [], marked = [], dragSel = false;
      win.body.innerHTML = `
        <div class="toolbar of-tb">
          ${tbBtn('menu', 'menu', 'File')}${tbBtn('save', 'save', 'Save (Ctrl+S)')}${tbBtn('undo', 'undo', 'Undo (Ctrl+Z)')}${tbBtn('redo', 'redo', 'Redo (Ctrl+Y)')}${sep}
          ${tbBtn('b', 'bold', 'Bold')}${tbBtn('i', 'italic', 'Italic')}${tbBtn('u', 'underline', 'Underline')}
          ${colorBtn('fg', 'type', 'Text color', '#e5484d')}${colorBtn('bg', 'fill', 'Fill color', '#fff3b0')}${sep}
          ${tbBtn('al-left', 'alignl', 'Align left')}${tbBtn('al-center', 'alignc', 'Center')}${tbBtn('al-right', 'alignr', 'Align right')}${sep}
          <select class="inp of-sel" data-s="fmt" title="Number format" style="width:108px"><option value="gen">General</option><option value="num">Number 0.00</option><option value="int">Integer</option><option value="usd">Currency $</option><option value="eur">Currency €</option><option value="pct">Percent</option><option value="sci">Scientific</option><option value="text">Text</option></select>
          ${tbBtn('dec-', 'minus', 'Fewer decimals')}${tbBtn('dec+', 'plus', 'More decimals')}${sep}
          ${tbBtn('sum', 'sigma', 'AutoSum')}${tbBtn('fx', 'code', 'Functions')}${tbBtn('sortaz', 'sortaz', 'Sort ascending')}${tbBtn('sortza', 'sortza', 'Sort descending')}${tbBtn('rows', 'rows', 'Rows & columns')}${tbBtn('chart', 'chart', 'Chart')}${tbBtn('clear', 'eraser', 'Clear cells')}
        </div>
        <div class="sh-fbar"><input class="inp sh-name" spellcheck="false"><span class="sh-fx">${gl('code')}</span><input class="inp sh-formula" spellcheck="false" autocapitalize="off" autocorrect="off" placeholder="Enter a value or =formula"></div>
        <div class="sh-grid" tabindex="0"><table class="sh-t"></table><input class="sh-edit" spellcheck="false" autocapitalize="off" autocorrect="off" hidden></div>
        <div class="sh-tabs"><button class="ibtn" data-a="addsheet" title="Add sheet">${gl('plus')}</button><div class="sh-tablist"></div><span class="spacer"></span><span class="sh-stat small muted"></span></div>`;
      const $ = (s) => win.body.querySelector(s), grid = $('.sh-grid'), table = $('.sh-t'), ed = $('.sh-edit'), fbar = $('.sh-formula'), nameBox = $('.sh-name');
      const doc = docController(win, {
        appName: 'Sheets', defaultName: 'Untitled Spreadsheet', saveExt: 'csht', filter: (n) => /\.(csht|csv|tsv)$/i.test(n),
        serialize: () => JSON.stringify({ v: 1, app: 'cumulus-sheets', sheets: book.sheets, active: book.active }),
        deserialize: (c, p) => {
          const e = OS.ext(p);
          if (e === 'csv' || e === 'tsv') { const s = newSheet(OS.fs.basename(p).replace(/\.\w+$/, '').slice(0, 30) || 'Sheet1'); parseCSV(c, e === 'tsv' ? '\t' : null).forEach((row, r) => row.forEach((v, cc) => { if (v !== '') s.cells[key(r, cc)] = { v }; })); s.rows = Math.max(100, Object.keys(s.cells).reduce((a, k) => Math.max(a, parseRef(k).r + 20), 0)); s.cols = Math.max(26, Object.keys(s.cells).reduce((a, k) => Math.max(a, parseRef(k).c + 2), 0)); book = { sheets: [s], active: 0 }; }
          else if (OS.isDataUrl(c) || ['xlsx', 'ods'].includes(e)) throw new Error('Binary spreadsheets (.xlsx/.ods) cannot be opened. Export them as CSV first.');
          else { const d = JSON.parse(c); if (!d.sheets) throw new Error('Not a Cumulus Sheets file'); book = { sheets: d.sheets.map((s) => Object.assign(newSheet(s.name), s)), active: d.active || 0 }; }
          sh = book.sheets[book.active] || book.sheets[0]; undo = []; redo = []; cur = { r: 0, c: 0 }; selectCell(0, 0); build(); renderTabs();
        },
      });
      const isCsvPath = () => doc.path && /\.(csv|tsv)$/i.test(doc.path);
      const snapshot = () => { undo.push(JSON.stringify({ i: book.active, s: book.sheets })); if (undo.length > 60) undo.shift(); redo = []; };
      const restoreSnap = (j) => { const d = JSON.parse(j); book.sheets = d.s.map((s) => Object.assign(newSheet(s.name), s)); book.active = Math.min(d.i, book.sheets.length - 1); sh = book.sheets[book.active]; build(); renderTabs(); doc.touch(); };
      const changed = () => { doc.touch(); refresh(); };
      function build() {
        const w = (c) => sh.colW[c] || 96;
        let h = `<colgroup><col style="width:44px">${Array.from({ length: sh.cols }, (_, c) => `<col style="width:${w(c)}px">`).join('')}</colgroup><thead><tr><th class="corner"></th>${Array.from({ length: sh.cols }, (_, c) => `<th data-c="${c}">${colName(c)}<i class="sh-rz" data-rz="${c}"></i></th>`).join('')}</tr></thead><tbody>`;
        for (let r = 0; r < sh.rows; r++) { h += `<tr><th data-r="${r}">${r + 1}</th>`; for (let c = 0; c < sh.cols; c++) h += `<td data-r="${r}" data-c="${c}"></td>`; h += '</tr>'; }
        table.innerHTML = h + '</tbody>';
        tds = []; table.querySelectorAll('tbody tr').forEach((tr, r) => { tds[r] = [...tr.querySelectorAll('td')]; });
        table.style.width = 44 + Array.from({ length: sh.cols }, (_, c) => w(c)).reduce((a, b) => a + b, 0) + 'px';
        marked = []; refresh(true); paintSel();
      }
      let shown = new Set();
      function refresh() {
        ev = evaluator(book);
        const now = new Set(Object.keys(sh.cells));
        shown.forEach((k) => { if (!now.has(k)) { const p = parseRef(k); const td = tds[p.r]?.[p.c]; if (td) { td.textContent = ''; td.removeAttribute('style'); td.className = ''; } } });
        now.forEach((k) => {
          const p = parseRef(k); const td = tds[p.r]?.[p.c]; if (!td) return; const cell = sh.cells[k]; const s = cell.s || {};
          const v = s.fmt === 'text' ? cell.v : ev(sh, k); td.textContent = fmtVal(v, s);
          const isNum = typeof v === 'number'; td.className = (v && v.err ? 'err ' : '') + (td.classList.contains('sel') ? 'sel ' : '') + (td.classList.contains('cur') ? 'cur' : '');
          td.style.cssText = `${s.b ? 'font-weight:700;' : ''}${s.i ? 'font-style:italic;' : ''}${s.u ? 'text-decoration:underline;' : ''}${s.fg ? `color:${s.fg};` : ''}${s.bg ? `background:${s.bg};` : ''}text-align:${s.al || (isNum || typeof v === 'boolean' ? 'right' : v && v.err ? 'center' : 'left')}`;
        });
        shown = now; updFormulaBar(); updStatus();
      }
      const inSel = (r, c) => r >= sel.r1 && r <= sel.r2 && c >= sel.c1 && c <= sel.c2;
      function paintSel() {
        marked.forEach((td) => td.classList.remove('sel', 'cur')); marked = [];
        for (let r = sel.r1; r <= Math.min(sel.r2, sh.rows - 1); r++) for (let c = sel.c1; c <= Math.min(sel.c2, sh.cols - 1); c++) { const td = tds[r][c]; td.classList.add('sel'); marked.push(td); }
        const ct = tds[cur.r]?.[cur.c]; if (ct) { ct.classList.add('cur'); marked.push(ct); }
        table.querySelectorAll('thead th.hl, tbody th.hl').forEach((x) => x.classList.remove('hl'));
        for (let c = sel.c1; c <= sel.c2; c++) table.querySelector(`thead th[data-c="${c}"]`)?.classList.add('hl');
        for (let r = sel.r1; r <= Math.min(sel.r2, sh.rows - 1); r++) table.querySelector(`tbody th[data-r="${r}"]`)?.classList.add('hl');
        nameBox.value = sel.r1 === sel.r2 && sel.c1 === sel.c2 ? key(cur.r, cur.c) : `${key(sel.r1, sel.c1)}:${key(sel.r2, sel.c2)}`;
        updFormulaBar(); updStatus(); updToolbarState();
      }
      function updFormulaBar() { if (document.activeElement === fbar) return; const cell = sh.cells[key(cur.r, cur.c)]; fbar.value = cell ? String(cell.v) : ''; }
      function updStatus() { let n = 0, cnt = 0, sum = 0; if ((sel.r2 - sel.r1 + 1) * (sel.c2 - sel.c1 + 1) > 1) { for (let r = sel.r1; r <= sel.r2; r++) for (let c = sel.c1; c <= sel.c2; c++) { const k = key(r, c); if (!sh.cells[k]) continue; cnt++; const v = ev(sh, k); if (typeof v === 'number') { n++; sum += v; } } $('.sh-stat').textContent = n ? `Sum: ${fmtVal(sum)}  ·  Average: ${fmtVal(sum / n)}  ·  Count: ${cnt}` : `Count: ${cnt}`; } else $('.sh-stat').textContent = ''; }
      function updToolbarState() { const s = (sh.cells[key(cur.r, cur.c)] || {}).s || {}; ['b', 'i', 'u'].forEach((k) => $(`[data-a=${k}]`).classList.toggle('on', !!s[k])); ['left', 'center', 'right'].forEach((a) => $(`[data-a=al-${a}]`).classList.toggle('on', s.al === a)); $('[data-s=fmt]').value = s.fmt || 'gen'; }
      function ensureVisible(r, c) { const td = tds[r]?.[c]; if (!td) return; const gr = grid.getBoundingClientRect(), tr = td.getBoundingClientRect(); const hh = 28, hw = 44; if (tr.left < gr.left + hw) grid.scrollLeft -= gr.left + hw - tr.left; else if (tr.right > gr.right) grid.scrollLeft += tr.right - gr.right + 2; if (tr.top < gr.top + hh) grid.scrollTop -= gr.top + hh - tr.top; else if (tr.bottom > gr.bottom) grid.scrollTop += tr.bottom - gr.bottom + 2; }
      function selectCell(r, c, extend) {
        r = OS.clamp(r, 0, sh.rows - 1); c = OS.clamp(c, 0, sh.cols - 1);
        if (!extend) anchor = { r, c }; cur = { r, c };
        sel = { r1: Math.min(anchor.r, r), r2: Math.max(anchor.r, r), c1: Math.min(anchor.c, c), c2: Math.max(anchor.c, c) };
        paintSel(); ensureVisible(r, c);
      }
      const setCell = (r, c, v) => { const k = key(r, c); const cell = sh.cells[k] || {}; if (v === '' || v == null) { if (cell.s) { cell.v = ''; sh.cells[k] = cell; } else delete sh.cells[k]; } else { cell.v = v; sh.cells[k] = cell; } if (r >= sh.rows - 2) { sh.rows += 50; build(); } };
      // editing
      function startEdit(initial, viaBar) {
        if (editing) return; const k = key(cur.r, cur.c); const td = tds[cur.r][cur.c]; const raw = sh.cells[k] ? String(sh.cells[k].v) : '';
        editing = { r: cur.r, c: cur.c, orig: raw, bar: !!viaBar };
        if (viaBar) return;
        ed.hidden = false; ed.style.left = td.offsetLeft + 'px'; ed.style.top = td.offsetTop + 'px'; ed.style.minWidth = td.offsetWidth + 'px'; ed.style.height = td.offsetHeight + 'px';
        ed.value = initial != null ? initial : raw; fbar.value = ed.value; ed.focus({ preventScroll: true }); const n = ed.value.length; ed.setSelectionRange(n, n);
      }
      function commit(move) {
        if (!editing) return; const e = editing; const v = e.bar ? fbar.value : ed.value; editing = null; ed.hidden = true;
        if (v !== e.orig) { snapshot(); setCell(e.r, e.c, v); changed(); }
        grid.focus({ preventScroll: true });
        if (move === 'down') selectCell(e.r + 1, e.c); else if (move === 'right') selectCell(e.r, e.c + 1); else if (move === 'up') selectCell(e.r - 1, e.c); else if (move === 'left') selectCell(e.r, e.c - 1); else paintSel();
      }
      function cancelEdit() { if (!editing) return; editing = null; ed.hidden = true; updFormulaBar(); grid.focus({ preventScroll: true }); }
      const edKeys = (e, inp) => {
        if (['Enter', 'Tab', 'Escape', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); commit(e.shiftKey ? 'up' : 'down'); }
        else if (e.key === 'Tab') { e.preventDefault(); commit(e.shiftKey ? 'left' : 'right'); }
        else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
        else if (!e.ctrlKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && inp === ed && !inp.value.startsWith('=')) { e.preventDefault(); commit(e.key === 'ArrowUp' ? 'up' : 'down'); }
      };
      ed.addEventListener('keydown', (e) => edKeys(e, ed)); ed.addEventListener('input', () => (fbar.value = ed.value));
      ed.addEventListener('blur', () => { const e0 = editing; setTimeout(() => { if (editing && editing === e0 && !editing.bar && document.activeElement !== fbar && document.activeElement !== ed && !refPicking) commit(); }, 120); });
      fbar.addEventListener('focus', () => { if (!editing) startEdit(null, true); else if (!editing.bar) { editing.bar = true; ed.hidden = true; } });
      fbar.addEventListener('keydown', (e) => edKeys(e, fbar));
      fbar.addEventListener('blur', () => { const e0 = editing; setTimeout(() => { if (editing && editing === e0 && editing.bar && document.activeElement !== fbar && !refPicking) commit(); }, 150); });
      nameBox.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); const [a, b] = nameBox.value.toUpperCase().split(':'); const p = parseRef(a), q = b ? parseRef(b) : null; if (p) { selectCell(p.r, p.c); if (q) selectCell(q.r, q.c, true); grid.focus(); } } });
      // pointer interaction
      let refPicking = false, lastTap = { t: 0, r: -1, c: -1 };
      grid.addEventListener('pointerdown', (e) => {
        const td = e.target.closest('td'), th = e.target.closest('th'), rz = e.target.closest('.sh-rz');
        if (rz) { e.preventDefault(); const c = +rz.dataset.rz, x0 = e.clientX, w0 = sh.colW[c] || 96; rz.setPointerCapture(e.pointerId); const mv = (ev2) => { sh.colW[c] = Math.max(30, w0 + ev2.clientX - x0); table.querySelectorAll('col')[c + 1].style.width = sh.colW[c] + 'px'; table.style.width = 44 + Array.from({ length: sh.cols }, (_, i) => sh.colW[i] || 96).reduce((a, b) => a + b, 0) + 'px'; }; const up = () => { rz.removeEventListener('pointermove', mv); rz.removeEventListener('pointerup', up); doc.touch(); }; rz.addEventListener('pointermove', mv); rz.addEventListener('pointerup', up); return; }
        if (td) {
          const r = +td.dataset.r, c = +td.dataset.c;
          const editVal = editing ? (editing.bar ? fbar.value : ed.value) : '';
          if (editing && /^=/.test(editVal) && /[(=+\-*/,:;^&<>]$/.test(editVal.trim()) && !(editing.r === r && editing.c === c)) {
            e.preventDefault(); refPicking = true; const inp = editing.bar ? fbar : ed; inp.value += key(r, c); fbar.value = inp.value; if (!editing.bar) ed.value = inp.value; setTimeout(() => { refPicking = false; inp.focus(); }, 50); return;
          }
          if (editing) commit();
          if (e.pointerType === 'mouse') { e.preventDefault(); grid.focus({ preventScroll: true }); dragSel = true; selectCell(r, c, e.shiftKey); }
          else { const now = Date.now(); if (cur.r === r && cur.c === c && sel.r1 === sel.r2 && sel.c1 === sel.c2 && now - lastTap.t < 3000) { lastTap.t = now; td._tapEdit = true; } else lastTap = { t: now, r, c }; }
          return;
        }
        if (th) {
          if (editing) commit();
          if (th.classList.contains('corner')) { anchor = { r: 0, c: 0 }; cur = { r: 0, c: 0 }; sel = { r1: 0, c1: 0, r2: sh.rows - 1, c2: sh.cols - 1 }; paintSel(); return; }
          if (th.dataset.c != null) { const c = +th.dataset.c; anchor = { r: 0, c: e.shiftKey ? anchor.c : c }; cur = { r: 0, c }; sel = { r1: 0, r2: sh.rows - 1, c1: Math.min(anchor.c, c), c2: Math.max(anchor.c, c) }; paintSel(); }
          else if (th.dataset.r != null) { const r = +th.dataset.r; anchor = { r: e.shiftKey ? anchor.r : r, c: 0 }; cur = { r, c: 0 }; sel = { r1: Math.min(anchor.r, r), r2: Math.max(anchor.r, r), c1: 0, c2: sh.cols - 1 }; paintSel(); }
        }
      });
      grid.addEventListener('pointerover', (e) => { if (!dragSel) return; const td = e.target.closest('td'); if (td) selectCell(+td.dataset.r, +td.dataset.c, true); });
      document.addEventListener('pointerup', () => (dragSel = false));
      grid.addEventListener('click', (e) => { const td = e.target.closest('td'); if (!td || e.pointerType === 'mouse' || editing) return; const r = +td.dataset.r, c = +td.dataset.c; if (td._tapEdit) { td._tapEdit = false; startEdit(); } else { selectCell(r, c); } });
      grid.addEventListener('dblclick', (e) => { const td = e.target.closest('td'); if (td) { selectCell(+td.dataset.r, +td.dataset.c); startEdit(); } });
      OS.onContext(grid, (e, x, y) => { const td = e.target.closest('td'); if (td && !inSel(+td.dataset.r, +td.dataset.c)) selectCell(+td.dataset.r, +td.dataset.c); cellMenu(x, y); });
      // keyboard
      grid.addEventListener('keydown', (e) => {
        if (editing) return; const c = e.ctrlKey || e.metaKey;
        const mv = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
        if (mv) { e.preventDefault(); if (c) { let r = cur.r, cc = cur.c; while (r + mv[0] >= 0 && r + mv[0] < sh.rows && cc + mv[1] >= 0 && cc + mv[1] < sh.cols && sh.cells[key(r + mv[0], cc + mv[1])]) { r += mv[0]; cc += mv[1]; } if (r === cur.r && cc === cur.c) { r = OS.clamp(r + mv[0] * 1000, 0, sh.rows - 1); cc = OS.clamp(cc + mv[1] * 1000, 0, sh.cols - 1); } selectCell(r, cc, e.shiftKey); } else selectCell(cur.r + mv[0], cur.c + mv[1], e.shiftKey); return; }
        if (e.key === 'Enter') { e.preventDefault(); selectCell(cur.r + (e.shiftKey ? -1 : 1), cur.c); return; }
        if (e.key === 'Tab') { e.preventDefault(); selectCell(cur.r, cur.c + (e.shiftKey ? -1 : 1)); return; }
        if (e.key === 'Home') { e.preventDefault(); selectCell(c ? 0 : cur.r, 0, e.shiftKey); return; }
        if (e.key === 'PageDown' || e.key === 'PageUp') { e.preventDefault(); selectCell(cur.r + (e.key === 'PageDown' ? 20 : -20), cur.c, e.shiftKey); return; }
        if (e.key === 'F2') { e.preventDefault(); startEdit(); return; }
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); clearSel(); return; }
        if (c && e.key === 'z') { e.preventDefault(); doUndo(); return; } if (c && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); doRedo(); return; }
        if (c && e.key === 's') { e.preventDefault(); doc.save(e.shiftKey); return; } if (c && e.key === 'o') { e.preventDefault(); doc.open(); return; }
        if (c && e.key === 'b') { e.preventDefault(); toggleStyle('b'); return; } if (c && e.key === 'i') { e.preventDefault(); toggleStyle('i'); return; } if (c && e.key === 'u') { e.preventDefault(); toggleStyle('u'); return; }
        if (c && e.key === 'a') { e.preventDefault(); anchor = { r: 0, c: 0 }; cur = { r: 0, c: 0 }; sel = { r1: 0, c1: 0, r2: sh.rows - 1, c2: sh.cols - 1 }; paintSel(); return; }
        if (c && e.key === 'd') { e.preventDefault(); fillDown(); return; }
        if (e.key === '=' && e.altKey) { e.preventDefault(); autoSum(); return; }
        if (!c && !e.altKey && e.key.length === 1) { e.preventDefault(); startEdit(e.key); }
      });
      // clipboard (events work without permission prompts)
      const selTSV = () => { const rows = []; for (let r = sel.r1; r <= sel.r2; r++) { const row = []; for (let c = sel.c1; c <= sel.c2; c++) { const k = key(r, c); row.push(sh.cells[k] ? fmtVal(ev(sh, k), {}) : ''); } rows.push(row.join('\t')); } return rows.join('\n'); };
      const copySel = (cut) => { const rows = []; for (let r = sel.r1; r <= Math.min(sel.r2, sel.r1 + 500); r++) { const row = []; for (let c = sel.c1; c <= sel.c2; c++) { const cell = sh.cells[key(r, c)]; row.push(cell ? JSON.parse(JSON.stringify(cell)) : null); } rows.push(row); } clip = { rows, r: sel.r1, c: sel.c1, tsv: selTSV(), cut, sheet: sh }; return clip.tsv; };
      const pasteAt = (text) => {
        snapshot();
        if (clip && text === clip.tsv) { clip.rows.forEach((row, i) => row.forEach((cell, j) => { const r = cur.r + i, c = cur.c + j; if (c >= sh.cols) return; const k = key(r, c); if (!cell) { delete sh.cells[k]; return; } const n = JSON.parse(JSON.stringify(cell)); if (typeof n.v === 'string' && n.v[0] === '=' && !clip.cut) n.v = '=' + shiftFormula(n.v.slice(1), cur.r - clip.r, cur.c - clip.c); sh.cells[k] = n; })); if (clip.cut) { clip.rows.forEach((row, i) => row.forEach((cell, j) => { const r = clip.r + i, c = clip.c + j; if (r >= cur.r && r < cur.r + clip.rows.length && c >= cur.c && c < cur.c + row.length && clip.sheet === sh) return; delete clip.sheet.cells[key(r, c)]; })); clip = null; } sel = { r1: cur.r, c1: cur.c, r2: cur.r + (clip ? clip.rows.length - 1 : 0), c2: cur.c }; }
        else { const rows = text.includes('\t') || !text.includes(',') ? text.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((l) => l.split('\t')) : parseCSV(text); rows.forEach((row, i) => row.forEach((v, j) => { if (cur.c + j < sh.cols) setCell(cur.r + i, cur.c + j, v); })); }
        changed(); paintSel();
      };
      grid.addEventListener('copy', (e) => { if (editing) return; e.preventDefault(); e.clipboardData.setData('text/plain', copySel(false)); });
      grid.addEventListener('cut', (e) => { if (editing) return; e.preventDefault(); e.clipboardData.setData('text/plain', copySel(true)); });
      grid.addEventListener('paste', (e) => { if (editing) return; e.preventDefault(); pasteAt(e.clipboardData.getData('text/plain')); });
      const menuCopy = async (cut) => { const t = copySel(cut); try { await navigator.clipboard.writeText(t); } catch (e) {} };
      const menuPaste = async () => { let t = clip ? clip.tsv : ''; try { t = (await navigator.clipboard.readText()) || t; } catch (e) {} if (t) pasteAt(t); };
      // operations
      const eachSel = (fn) => { for (let r = sel.r1; r <= Math.min(sel.r2, sh.rows - 1); r++) for (let c = sel.c1; c <= Math.min(sel.c2, sh.cols - 1); c++) fn(r, c, key(r, c)); };
      const styleSel = (fn) => { snapshot(); eachSel((r, c, k) => { const cell = sh.cells[k] || (sh.cells[k] = { v: '' }); cell.s = cell.s || {}; fn(cell.s, cell); if (!Object.keys(cell.s).length) delete cell.s; if (cell.v === '' && !cell.s) delete sh.cells[k]; }); changed(); updToolbarState(); };
      const toggleStyle = (p) => { const on = !((sh.cells[key(cur.r, cur.c)] || {}).s || {})[p]; styleSel((s) => { if (on) s[p] = 1; else delete s[p]; }); };
      const clearSel = () => { snapshot(); eachSel((r, c, k) => delete sh.cells[k]); changed(); };
      const doUndo = () => { if (!undo.length) return; redo.push(JSON.stringify({ i: book.active, s: book.sheets })); restoreSnap(undo.pop()); };
      const doRedo = () => { if (!redo.length) return; undo.push(JSON.stringify({ i: book.active, s: book.sheets })); restoreSnap(redo.pop()); };
      function fillDown() { if (sel.r1 === sel.r2) return; snapshot(); for (let c = sel.c1; c <= sel.c2; c++) { const src = sh.cells[key(sel.r1, c)]; for (let r = sel.r1 + 1; r <= sel.r2; r++) { if (!src) { delete sh.cells[key(r, c)]; continue; } const n = JSON.parse(JSON.stringify(src)); if (typeof n.v === 'string' && n.v[0] === '=') n.v = '=' + shiftFormula(n.v.slice(1), r - sel.r1, 0); sh.cells[key(r, c)] = n; } } changed(); }
      function autoSum() {
        if (sel.r1 === sel.r2 && sel.c1 === sel.c2) { let r = cur.r - 1; while (r >= 0 && typeof ev(sh, key(r, cur.c)) === 'number') r--; if (r === cur.r - 1) { let c = cur.c - 1; while (c >= 0 && typeof ev(sh, key(cur.r, c)) === 'number') c--; if (c < cur.c - 1) { snapshot(); setCell(cur.r, cur.c, `=SUM(${key(cur.r, c + 1)}:${key(cur.r, cur.c - 1)})`); changed(); return; } startEdit('=SUM('); return; } snapshot(); setCell(cur.r, cur.c, `=SUM(${key(r + 1, cur.c)}:${key(cur.r - 1, cur.c)})`); changed(); return; }
        snapshot(); const rr = sel.r2 + 1; for (let c = sel.c1; c <= sel.c2; c++) setCell(rr, c, `=SUM(${key(sel.r1, c)}:${key(sel.r2, c)})`); changed();
      }
      function dataRegion() { let maxR = -1; for (const k of Object.keys(sh.cells)) { const p = parseRef(k); if (p.c >= sel.c1 && p.c <= sel.c2 && sh.cells[k].v !== '') maxR = Math.max(maxR, p.r); } return maxR; }
      function sortSel(desc) {
        let r1 = sel.r1, r2 = sel.r2, c1 = sel.c1, c2 = sel.c2;
        if (r1 === r2) { // whole data region around the column
          r1 = 0; r2 = -1; for (const k of Object.keys(sh.cells)) { const p = parseRef(k); r2 = Math.max(r2, p.r); } c1 = 0; c2 = sh.cols - 1;
          const h = ev(sh, key(0, cur.c)); const below = ev(sh, key(1, cur.c)); if (typeof h === 'string' && h && (typeof below === 'number' || typeof below === 'string')) r1 = 1;
        }
        if (r2 <= r1) return; snapshot();
        const rows = []; for (let r = r1; r <= r2; r++) { const row = []; for (let c = c1; c <= c2; c++) row.push(sh.cells[key(r, c)] || null); rows.push({ row, v: ev(sh, key(r, cur.c)) }); }
        rows.sort((a, b) => { const x = a.v, y = b.v; if (x === '' && y !== '') return 1; if (y === '' && x !== '') return -1; const res = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true }); return desc ? -res : res; });
        rows.forEach((o, i) => o.row.forEach((cell, j) => { const k = key(r1 + i, c1 + j); if (cell) sh.cells[k] = cell; else delete sh.cells[k]; }));
        changed();
      }
      function shiftCells(axis, at, n) { // insert (n>0) or delete (n<0) rows/cols, adjusting same-sheet formulas
        snapshot(); const out = {};
        for (const [k, cell] of Object.entries(sh.cells)) { const p = parseRef(k); const v = axis === 'r' ? p.r : p.c; if (n < 0 && v >= at && v < at - n) continue; const nv = v >= at ? v + n : v; out[axis === 'r' ? key(nv, p.c) : key(p.r, nv)] = cell; }
        for (const cell of Object.values(out)) if (typeof cell.v === 'string' && cell.v[0] === '=') cell.v = '=' + cell.v.slice(1).replace(/"(?:[^"]|"")*"|(?<![A-Za-z_$!])(\$?)([A-Za-z]{1,2})(\$?)(\d+)(?![\w(])/g, (m, ac, col, ar, row) => { if (m[0] === '"') return m; let c = colIndex(col), r = +row - 1; const v = axis === 'r' ? r : c; if (n < 0 && v >= at && v < at - n) return '#REF!'; if (v >= at) { if (axis === 'r') r += n; else c += n; } return `${ac}${colName(c)}${ar}${r + 1}`; });
        sh.cells = out; if (axis === 'r') sh.rows = Math.max(20, sh.rows + n); else sh.cols = Math.max(1, Math.min(78, sh.cols + n));
        build(); changed();
      }
      function chart() {
        let r1 = sel.r1, r2 = sel.r2, c1 = sel.c1, c2 = sel.c2;
        if (r1 === r2 && c1 === c2) { r1 = 0; c1 = 0; r2 = -1; c2 = -1; for (const k of Object.keys(sh.cells)) { const p = parseRef(k); r2 = Math.max(r2, p.r); c2 = Math.max(c2, p.c); } }
        r2 = Math.min(r2, r1 + 60); if (r2 < r1) return OS.alert('No data', 'Select the cells you want to chart (labels in the first column, values next to them).');
        const get = (r, c) => ev(sh, key(r, c));
        const hasHeader = typeof get(r1, c2) === 'string' && get(r1, c2) !== '' || (c1 === c2 ? false : typeof get(r1, c1 + 1) === 'string');
        const labelCol = typeof get(hasHeader ? r1 + 1 : r1, c1) === 'string' && c2 > c1;
        const rs = hasHeader ? r1 + 1 : r1, cs = labelCol ? c1 + 1 : c1;
        const labels = [], series = [];
        for (let r = rs; r <= r2; r++) labels.push(labelCol ? String(get(r, c1)) : String(r - rs + 1));
        for (let c = cs; c <= c2; c++) series.push({ name: hasHeader ? String(get(r1, c)) : colName(c), data: labels.map((_, i) => { const v = get(rs + i, c); return typeof v === 'number' ? v : 0; }) });
        if (!series.length || !labels.length) return OS.alert('No numbers', 'The selection does not contain numeric values.');
        let type = 'bar';
        const p = OS.dialog({ title: 'Chart', html: `<div class="seg" style="align-self:flex-start"><button data-t="bar" class="on">Bars</button><button data-t="line">Line</button><button data-t="pie">Pie</button></div><canvas style="width:100%;aspect-ratio:16/10;background:#fff;border-radius:10px"></canvas>`, buttons: [{ label: 'Close', value: null }, { label: 'Save to Pictures', value: 'save', primary: true }] });
        const d = OS._dlg.el; d.style.width = 'min(640px,100%)'; const cv = d.querySelector('canvas');
        const PAL = ['#4a7dff', '#ff6b6b', '#3fdc77', '#f7c948', '#b06cff', '#1fc8b0', '#ff9f43', '#ff5ca8'];
        const draw = () => {
          const W = (cv.width = 960), H = (cv.height = 600), g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.font = '20px system-ui'; g.fillStyle = '#222'; g.textAlign = 'center'; g.fillText(sh.name, W / 2, 34);
          if (type === 'pie') { const s = series[0], tot = s.data.reduce((a, b) => a + Math.max(0, b), 0) || 1; let a0 = -Math.PI / 2; const cx = W * 0.38, cy = H / 2 + 20, rad = 220; s.data.forEach((v, i) => { const a1 = a0 + Math.max(0, v) / tot * Math.PI * 2; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, rad, a0, a1); g.closePath(); g.fillStyle = PAL[i % PAL.length]; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); a0 = a1; g.fillRect(W * 0.7, 90 + i * 32, 18, 18); g.fillStyle = '#333'; g.textAlign = 'left'; g.font = '17px system-ui'; g.fillText(`${labels[i]} — ${(v / tot * 100).toFixed(1)}%`, W * 0.7 + 28, 105 + i * 32); }); return; }
          const all = series.flatMap((s) => s.data); const max = Math.max(0, ...all), min = Math.min(0, ...all); const L = 80, R = 30, T = 70, B = 70, pw = W - L - R, ph = H - T - B; const y = (v) => T + ph - (v - min) / (max - min || 1) * ph;
          g.strokeStyle = '#ddd'; g.lineWidth = 1; g.fillStyle = '#666'; g.font = '15px system-ui'; g.textAlign = 'right';
          for (let i = 0; i <= 5; i++) { const v = min + (max - min) * i / 5; const yy = y(v); g.beginPath(); g.moveTo(L, yy); g.lineTo(W - R, yy); g.stroke(); g.fillText(+v.toPrecision(4), L - 10, yy + 5); }
          const n = labels.length, gw = pw / n; g.textAlign = 'center';
          labels.forEach((l, i) => g.fillText(l.slice(0, 12), L + gw * i + gw / 2, H - B + 24));
          series.forEach((s, si) => { g.fillStyle = g.strokeStyle = PAL[si % PAL.length];
            if (type === 'bar') { const bw = gw * 0.7 / series.length; s.data.forEach((v, i) => { const x = L + gw * i + gw * 0.15 + bw * si; g.fillRect(x, Math.min(y(v), y(0)), bw - 2, Math.abs(y(v) - y(0))); }); }
            else { g.lineWidth = 3; g.beginPath(); s.data.forEach((v, i) => { const x = L + gw * i + gw / 2; i ? g.lineTo(x, y(v)) : g.moveTo(x, y(v)); }); g.stroke(); s.data.forEach((v, i) => { g.beginPath(); g.arc(L + gw * i + gw / 2, y(v), 5, 0, 7); g.fill(); }); }
            g.fillRect(L + si * 170, 44, 16, 16); g.fillStyle = '#333'; g.textAlign = 'left'; g.fillText(s.name.slice(0, 18), L + si * 170 + 22, 57); g.textAlign = 'center'; });
        };
        d.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { type = b.dataset.t; d.querySelectorAll('[data-t]').forEach((x) => x.classList.toggle('on', x === b)); draw(); }));
        draw();
        p.then((v) => { if (v === 'save') { OS.fs.mkdir(OS.home() + '/Pictures', { p: true }); const pth = OS.fs.uniqueName(OS.home() + '/Pictures', `${sh.name} chart.png`); OS.fs.write(pth, cv.toDataURL('image/png')); OS.notify('Chart saved', OS.fs.pretty(pth), { app: 'sheets', onclick: () => OS.wm.open('viewer', { path: pth }) }); } });
      }
      function cellMenu(x, y) {
        OS.menu(x, y, [
          { label: 'Cut', icon: 'scissors', key: 'Ctrl+X', action: () => menuCopy(true) }, { label: 'Copy', icon: 'copy', key: 'Ctrl+C', action: () => menuCopy(false) }, { label: 'Paste', icon: 'clipboard', key: 'Ctrl+V', action: menuPaste },
          { label: 'Edit cell', icon: 'edit', key: 'F2', action: () => startEdit() }, { label: 'Clear contents', icon: 'eraser', key: 'Del', action: clearSel }, '-',
          { label: 'Insert row above', icon: 'arrowup', action: () => shiftCells('r', sel.r1, 1) }, { label: 'Insert row below', icon: 'arrowdown', action: () => shiftCells('r', sel.r2 + 1, 1) },
          { label: 'Insert column left', icon: 'left', action: () => shiftCells('c', sel.c1, 1) }, { label: 'Insert column right', icon: 'right', action: () => shiftCells('c', sel.c2 + 1, 1) },
          { label: 'Delete row(s)', icon: 'minus', danger: true, action: () => shiftCells('r', sel.r1, -(sel.r2 - sel.r1 + 1)) }, { label: 'Delete column(s)', icon: 'minus', danger: true, action: () => shiftCells('c', sel.c1, -(Math.min(sel.c2, sh.cols - 1) - sel.c1 + 1)) }, '-',
          { label: 'Fill down', icon: 'arrowdown', key: 'Ctrl+D', disabled: sel.r1 === sel.r2, action: fillDown }, { label: 'Sort A → Z', icon: 'sortaz', action: () => sortSel(false) }, { label: 'Sort Z → A', icon: 'sortza', action: () => sortSel(true) }, { label: 'Chart…', icon: 'chart', action: chart },
        ]);
      }
      // tabs
      function renderTabs() {
        const host = $('.sh-tablist'); host.innerHTML = '';
        book.sheets.forEach((s, i) => { const b = OS.el(`<button class="sh-tab ${i === book.active ? 'on' : ''}">${esc(s.name)}</button>`); b.onclick = () => { if (editing) commit(); book.active = i; sh = s; cur = { r: 0, c: 0 }; anchor = { ...cur }; sel = { r1: 0, c1: 0, r2: 0, c2: 0 }; build(); renderTabs(); };
          const menu = (x, y) => OS.menu(x, y - 120, [{ label: 'Rename…', icon: 'edit', action: async () => { const n = await OS.prompt('Rename sheet', '', s.name); if (n && n.trim()) { snapshot(); s.name = n.trim().slice(0, 31).replace(/[!']/g, ''); renderTabs(); changed(); } } }, { label: 'Duplicate', icon: 'copy', action: () => { snapshot(); const d = JSON.parse(JSON.stringify(s)); d.name = s.name + ' (2)'; book.sheets.splice(i + 1, 0, d); renderTabs(); doc.touch(); } }, { label: 'Delete', icon: 'trash', danger: true, disabled: book.sheets.length < 2, action: async () => { if (await OS.confirm(`Delete “${s.name}”?`, '', 'Delete', true)) { snapshot(); book.sheets.splice(i, 1); book.active = Math.max(0, i - 1); sh = book.sheets[book.active]; build(); renderTabs(); changed(); } } }]);
          b.ondblclick = (e) => menu(e.clientX, e.clientY); OS.onContext(b, (e, x, y) => menu(x, y)); host.appendChild(b); });
      }
      $('[data-a=addsheet]').onclick = () => { snapshot(); let n = book.sheets.length + 1; while (book.sheets.some((s) => s.name === 'Sheet' + n)) n++; book.sheets.push(newSheet('Sheet' + n)); book.active = book.sheets.length - 1; sh = book.sheets[book.active]; build(); renderTabs(); doc.touch(); };
      // toolbar
      noFocusSteal($('.of-tb'));
      const A = (n, f) => ($(`[data-a="${n}"]`).onclick = f);
      A('save', () => doc.save()); A('undo', doUndo); A('redo', doRedo);
      A('b', () => toggleStyle('b')); A('i', () => toggleStyle('i')); A('u', () => toggleStyle('u'));
      ['left', 'center', 'right'].forEach((a) => A('al-' + a, () => { const on = ((sh.cells[key(cur.r, cur.c)] || {}).s || {}).al === a; styleSel((s) => { if (on) delete s.al; else s.al = a; }); }));
      win.body.querySelectorAll('input[type=color][data-a]').forEach((i) => { i.oninput = () => (win.body.querySelector(`[data-sw=${i.dataset.a}]`).style.background = i.value); i.onchange = () => styleSel((s) => (s[i.dataset.a] = i.value)); });
      $('[data-s=fmt]').onchange = (e) => { styleSel((s) => { if (e.target.value === 'gen') delete s.fmt; else s.fmt = e.target.value; }); grid.focus(); };
      A('dec-', () => styleSel((s, cell) => { const v = ev(sh, key(cur.r, cur.c)); const cd = s.dec ?? (typeof v === 'number' ? (String(v).split('.')[1] || '').length : 2); s.dec = Math.max(0, cd - 1); void cell; }));
      A('dec+', () => styleSel((s) => { const v = ev(sh, key(cur.r, cur.c)); const cd = s.dec ?? (typeof v === 'number' ? (String(v).split('.')[1] || '').length : 2); s.dec = Math.min(10, cd + 1); }));
      A('sum', autoSum); A('sortaz', () => sortSel(false)); A('sortza', () => sortSel(true)); A('chart', chart); A('clear', clearSel);
      A('fx', (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left, r.bottom + 4, ['SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT', 'IF', 'ROUND', 'SUMIF', 'COUNTIF', 'VLOOKUP', 'CONCAT', 'TODAY'].map((f) => ({ label: f, action: () => { if (editing && editing.bar) fbar.value += f + '('; else { const range = sel.r1 !== sel.r2 || sel.c1 !== sel.c2 ? `${key(sel.r1, sel.c1)}:${key(sel.r2, sel.c2)}` : ''; if (range) { selectCell(sel.r2 + 1, sel.c1); } startEdit(`=${f}(${range}${range ? ')' : ''}`); } } }))); });
      A('rows', (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left, r.bottom + 4, [{ label: 'Insert row above', icon: 'arrowup', action: () => shiftCells('r', sel.r1, 1) }, { label: 'Insert row below', icon: 'arrowdown', action: () => shiftCells('r', sel.r2 + 1, 1) }, { label: 'Insert column left', icon: 'left', action: () => shiftCells('c', sel.c1, 1) }, { label: 'Insert column right', icon: 'right', action: () => shiftCells('c', sel.c2 + 1, 1) }, '-', { label: 'Delete row(s)', icon: 'minus', danger: true, action: () => shiftCells('r', sel.r1, -(Math.min(sel.r2, sh.rows - 1) - sel.r1 + 1)) }, { label: 'Delete column(s)', icon: 'minus', danger: true, action: () => shiftCells('c', sel.c1, -(Math.min(sel.c2, sh.cols - 1) - sel.c1 + 1)) }]); });
      const baseName = () => (doc.path ? OS.fs.basename(doc.path).replace(/\.[^.]+$/, '') : 'Untitled Spreadsheet');
      const sheetRows = (s) => { let mr = -1, mc = -1; for (const k of Object.keys(s.cells)) { const p = parseRef(k); mr = Math.max(mr, p.r); mc = Math.max(mc, p.c); } const e2 = evaluator(book); return Array.from({ length: mr + 1 }, (_, r) => Array.from({ length: mc + 1 }, (_, c) => { const k = key(r, c); if (!s.cells[k]) return ''; const v = e2(s, k); return v && v.err ? v.err : typeof v === 'number' ? v : fmtVal(v, {}); })); };
      const tableHtml = (s) => `<h2>${esc(s.name)}</h2><table>${sheetRows(s).map((r) => `<tr>${r.map((v) => `<td style="text-align:${typeof v === 'number' ? 'right' : 'left'}">${esc(v)}</td>`).join('')}</tr>`).join('')}</table>`;
      A('menu', (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left, r.bottom + 4, [
        { label: 'New', icon: 'plus', action: async () => { if (!(await doc.confirmLose())) return; book = { sheets: [newSheet('Sheet1')], active: 0 }; sh = book.sheets[0]; undo = []; doc.path = null; doc.dirty = false; doc.title(); build(); renderTabs(); selectCell(0, 0); } },
        { label: 'Open…', icon: 'folder', key: 'Ctrl+O', action: () => doc.open() },
        { label: 'Save', icon: 'save', key: 'Ctrl+S', action: () => (isCsvPath() ? OS.fs.write(doc.path, toCSV(sheetRows(sh), doc.path.endsWith('.tsv') ? '\t' : ',')) || ((doc.dirty = false), doc.title()) : doc.save()) },
        { label: 'Save As…', icon: 'save', action: () => doc.save(true) }, '-',
        { label: 'Export sheet as CSV…', icon: 'filetext', action: async () => { const p = await OS.pickFile({ mode: 'save', path: OS.home() + '/Documents', name: baseName() + '.csv' }); if (p) { OS.fs.write(p, toCSV(sheetRows(sh))); OS.notify('Exported', OS.fs.pretty(p), { app: 'sheets' }); } } },
        { label: 'Download as CSV', icon: 'download', action: () => OS.downloadReal(baseName() + '.csv', 'data:text/csv;charset=utf-8,' + encodeURIComponent(toCSV(sheetRows(sh)))) },
        { label: 'Download as Excel-compatible (.xls)', icon: 'download', action: () => OS.downloadReal(baseName() + '.xls', 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(`﻿<html><head><meta charset="utf-8"></head><body>${book.sheets.map(tableHtml).join('')}</body></html>`)) },
        { label: 'Print / Save as PDF…', icon: 'printer', action: () => printHtml(`<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:system-ui;font-size:11px}table{border-collapse:collapse}td{border:1px solid #bbb;padding:3px 6px}</style></head><body>${book.sheets.map(tableHtml).join('')}</body></html>`) },
      ]); });
      OS.wm.keys(win, (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's' && document.activeElement !== grid) { e.preventDefault(); doc.save(); } });
      win.onArgs = async (a) => { if (a.path && (await doc.confirmLose())) doc.load(a.path); };
      build(); renderTabs(); selectCell(0, 0);
      if (args.path) doc.load(args.path); else doc.title();
      if (!OS.isTouch()) setTimeout(() => grid.focus({ preventScroll: true }), 60);
    },
  });

  /* =========================== SLIDES =========================== */
  const THEMES = {
    Cumulus: { bg: '#ffffff', title: '#1d2b64', text: '#3a3f4b', accent: '#4a7dff', font: 'Inter, system-ui, sans-serif', deco: 'bar' },
    Midnight: { bg: 'linear-gradient(135deg,#0f1226,#2a1f5c)', title: '#ffffff', text: '#d8dcf0', accent: '#8b9cff', font: 'Inter, system-ui, sans-serif', deco: 'glow' },
    Sunset: { bg: 'linear-gradient(135deg,#ff7e5f,#feb47b)', title: '#ffffff', text: '#fff8f0', accent: '#5a1e3c', font: 'Inter, system-ui, sans-serif' },
    Forest: { bg: 'linear-gradient(160deg,#0e2a1d,#2f6b45)', title: '#eaffef', text: '#cfe9d6', accent: '#7ee787', font: 'Georgia, serif' },
    Paper: { bg: '#f6f1e7', title: '#3b2f2f', text: '#4a4040', accent: '#c0392b', font: 'Georgia, serif', deco: 'line' },
    Ocean: { bg: 'linear-gradient(160deg,#03203c,#1fb5c9)', title: '#ffffff', text: '#e0f7fa', accent: '#ffd36b', font: 'Inter, system-ui, sans-serif' },
    Mono: { bg: '#111111', title: '#ffffff', text: '#bbbbbb', accent: '#ff5ca8', font: '"JetBrains Mono", monospace' },
  };
  const SW = 960, SH = 540;
  const uid = () => Math.random().toString(36).slice(2, 9);
  const LAYOUTS = {
    'Title': () => [{ t: 'text', role: 'title', x: 80, y: 170, w: 800, h: 110, html: 'Click to add title', fs: 56, b: 1, align: 'center' }, { t: 'text', role: 'sub', x: 120, y: 300, w: 720, h: 70, html: 'Click to add subtitle', fs: 26, align: 'center' }],
    'Title and content': () => [{ t: 'text', role: 'title', x: 60, y: 36, w: 840, h: 80, html: 'Slide title', fs: 40, b: 1 }, { t: 'text', role: 'body', x: 60, y: 140, w: 840, h: 350, html: '<ul><li>First point</li><li>Second point</li><li>Third point</li></ul>', fs: 26 }],
    'Section': () => [{ t: 'text', role: 'title', x: 80, y: 200, w: 800, h: 100, html: 'Section title', fs: 52, b: 1, align: 'center' }],
    'Two columns': () => [{ t: 'text', role: 'title', x: 60, y: 36, w: 840, h: 80, html: 'Comparison', fs: 40, b: 1 }, { t: 'text', role: 'body', x: 60, y: 140, w: 405, h: 350, html: '<ul><li>Left point</li><li>Another point</li></ul>', fs: 24 }, { t: 'text', role: 'body', x: 495, y: 140, w: 405, h: 350, html: '<ul><li>Right point</li><li>Another point</li></ul>', fs: 24 }],
    'Blank': () => [],
  };
  const mkSlide = (layout = 'Title and content') => ({ id: uid(), layout, bg: null, notes: '', els: LAYOUTS[layout]().map((e) => Object.assign({ id: uid() }, e)) });
  const SHAPES = {
    rect: () => '<rect x="0" y="0" width="100" height="100"/>', round: () => '<rect x="0" y="0" width="100" height="100" rx="14" ry="14"/>', ellipse: () => '<ellipse cx="50" cy="50" rx="50" ry="50"/>',
    triangle: () => '<polygon points="50,0 100,100 0,100"/>', arrow: () => '<polygon points="0,30 60,30 60,0 100,50 60,100 60,70 0,70"/>', star: () => '<polygon points="50,0 61,35 98,35 68,57 79,92 50,70 21,92 32,57 2,35 39,35"/>',
    line: () => '<line x1="0" y1="50" x2="100" y2="50" stroke-width="6" vector-effect="non-scaling-stroke"/>', speech: () => '<path d="M5 5h90v65H45l-20 25v-25H5z"/>',
  };
  function renderSlide(slide, theme, host, opts = {}) {
    const th = THEMES[theme] || THEMES.Cumulus;
    host.style.background = slide.bg || th.bg; host.style.fontFamily = th.font; host.style.color = th.text;
    let h = '';
    if (th.deco === 'bar') h += `<div style="position:absolute;left:0;top:0;width:100%;height:10px;background:${th.accent}"></div>`;
    if (th.deco === 'line') h += `<div style="position:absolute;left:60px;right:60px;bottom:40px;height:2px;background:${th.accent};opacity:.5"></div>`;
    if (th.deco === 'glow') h += `<div style="position:absolute;right:-120px;top:-120px;width:420px;height:420px;border-radius:50%;background:radial-gradient(${th.accent}55,transparent 70%)"></div>`;
    slide.els.forEach((e) => {
      const st = `left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px;`;
      if (e.t === 'text') { const col = e.color || (e.role === 'title' ? th.title : th.text); h += `<div class="sl-el sl-text" data-id="${e.id}" style="${st}color:${col};font-size:${e.fs || 24}px;text-align:${e.align || 'left'};font-weight:${e.b ? 700 : 400};font-style:${e.i ? 'italic' : 'normal'};text-decoration:${e.u ? 'underline' : 'none'};${e.font ? `font-family:${e.font};` : ''}"><div class="sl-txt">${e.html || ''}</div></div>`; }
      else if (e.t === 'image') h += `<div class="sl-el" data-id="${e.id}" style="${st}"><img src="${e.src}" draggable="false" style="width:100%;height:100%;object-fit:${e.fit || 'contain'};border-radius:${e.radius || 0}px"></div>`;
      else if (e.t === 'shape') { const fill = e.fill || th.accent; h += `<div class="sl-el" data-id="${e.id}" style="${st}"><svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:100%;overflow:visible" fill="${e.shape === 'line' ? 'none' : fill}" stroke="${e.shape === 'line' ? fill : e.stroke || 'none'}" stroke-width="${e.shape === 'line' ? 6 : 2}">${(SHAPES[e.shape] || SHAPES.rect)()}</svg></div>`; }
    });
    host.innerHTML = h;
    if (opts.num) host.insertAdjacentHTML('beforeend', `<div style="position:absolute;right:24px;bottom:14px;font-size:14px;opacity:.6">${opts.num}</div>`);
  }
  office.renderSlide = renderSlide;
  function slideshowHtml(d, title) {
    const slides = d.slides.map((s, i) => { const div = document.createElement('div'); div.className = 's'; div.style.cssText = 'position:absolute;inset:0'; renderSlide(s, d.theme, div, { num: i + 1 }); return `<section style="background:${div.style.background};font-family:${div.style.fontFamily};color:${div.style.color}">${div.innerHTML}</section>`; }).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>html,body{margin:0;height:100%;background:#000;overflow:hidden;font-family:system-ui}#st{position:absolute;width:${SW}px;height:${SH}px;left:50%;top:50%;transform-origin:center}section{position:absolute;inset:0;opacity:0;transition:opacity .4s;overflow:hidden}section.on{opacity:1}.sl-el{position:absolute}.sl-txt{width:100%;height:100%;overflow:hidden;line-height:1.25}.sl-txt ul,.sl-txt ol{margin:0;padding-left:1.2em}.sl-txt li{margin:.3em 0}.sl-txt p{margin:0}@media print{body{background:#fff}#st{position:static;transform:none!important}section{position:relative;opacity:1;page-break-after:always;width:${SW}px;height:${SH}px}}</style></head><body><div id="st">${slides}</div><script>var s=document.querySelectorAll('section'),i=0;function g(n){i=Math.max(0,Math.min(s.length-1,n));s.forEach(function(x,j){x.classList.toggle('on',j===i)})}function f(){var k=Math.min(innerWidth/${SW},innerHeight/${SH});document.getElementById('st').style.transform='translate(-50%,-50%) scale('+k+')'}addEventListener('resize',f);f();g(0);addEventListener('keydown',function(e){if(['ArrowRight',' ','PageDown','Enter'].indexOf(e.key)>=0)g(i+1);if(['ArrowLeft','PageUp','Backspace'].indexOf(e.key)>=0)g(i-1)});addEventListener('click',function(e){g(e.clientX>innerWidth/3?i+1:i-1)})<\/script></body></html>`;
  }
  OS.registerApp({
    id: 'slides', name: 'Slides', icon: 'present', color: ['#ff9f43', '#e5592b'], cat: 'Office', w: 1100, h: 700, desc: 'Cumulus Slides — presentations', keywords: 'powerpoint impress presentation slideshow pptx odp office libreoffice deck',
    launch(win, args) {
      let d = { v: 1, app: 'cumulus-slides', theme: 'Cumulus', slides: [mkSlide('Title'), mkSlide()] }, cur = 0, selId = null, editId = null, scale = 1, undo = [], redo = [], elClip = null;
      win.body.innerHTML = `
        <div class="toolbar of-tb">
          ${tbBtn('menu', 'menu', 'File')}${tbBtn('save', 'save', 'Save')}${tbBtn('undo', 'undo', 'Undo')}${tbBtn('redo', 'redo', 'Redo')}${sep}
          ${tbBtn('newslide', 'plus', 'New slide')}${tbBtn('text', 'textbox', 'Text box')}${tbBtn('image', 'image', 'Image')}${tbBtn('shape', 'shape', 'Shape')}${sep}
          ${tbBtn('fs-', 'zoomout', 'Smaller text')}${tbBtn('fs+', 'zoomin', 'Bigger text')}${tbBtn('b', 'bold', 'Bold')}${tbBtn('i', 'italic', 'Italic')}${tbBtn('u', 'underline', 'Underline')}${colorBtn('color', 'type', 'Color', '#e5484d')}
          ${tbBtn('al-left', 'alignl', 'Left')}${tbBtn('al-center', 'alignc', 'Center')}${tbBtn('al-right', 'alignr', 'Right')}${tbBtn('list', 'listul', 'Bullets')}${sep}
          ${tbBtn('front', 'arrowup', 'Bring forward')}${tbBtn('back', 'arrowdown', 'Send backward')}${tbBtn('del', 'trash', 'Delete')}${sep}
          ${tbBtn('theme', 'palette', 'Theme & background')}<button class="btn sm primary" data-a="present">${gl('play')}<span class="hide-m">Present</span></button>
        </div>
        <div class="sl-main"><div class="sl-thumbs"></div><div class="sl-center"><div class="sl-stagewrap"><div class="sl-stage"></div></div><textarea class="sl-notes" placeholder="Speaker notes…"></textarea></div></div>
        <div class="statusbar"><span data-st></span><span class="spacer"></span><span class="small" data-hint></span></div>`;
      const $ = (s) => win.body.querySelector(s), stage = $('.sl-stage'), sw = $('.sl-stagewrap'), thumbs = $('.sl-thumbs'), notes = $('.sl-notes');
      const doc = docController(win, {
        appName: 'Slides', defaultName: 'Untitled Presentation', saveExt: 'cslide', filter: (n) => /\.cslide$/i.test(n),
        serialize: () => { commitEdit(); return JSON.stringify(d); },
        deserialize: (c, p) => { if (OS.isDataUrl(c) || /\.(pptx|odp)$/i.test(p)) throw new Error('PowerPoint and ODP files cannot be opened. Cumulus Slides uses .cslide files.'); const x = JSON.parse(c); if (!x.slides) throw new Error('Not a Cumulus Slides file'); d = x; d.theme = THEMES[d.theme] ? d.theme : 'Cumulus'; cur = 0; selId = editId = null; undo = []; redo = []; renderAll(); },
      });
      const slide = () => d.slides[cur];
      const elOf = (id) => slide().els.find((e) => e.id === id);
      const snapshot = () => { undo.push(JSON.stringify(d)); if (undo.length > 80) undo.shift(); redo = []; };
      const changed = () => { doc.touch(); thumbsSoon(); };
      let thT = null; const thumbsSoon = () => { clearTimeout(thT); thT = setTimeout(renderThumbs, 300); };
      function fit() { const box = $('.sl-center').getBoundingClientRect(); const avW = box.width - 24, avH = box.height - (notes.offsetHeight || 0) - 24; scale = Math.max(0.15, Math.min(avW / SW, avH / SH)); stage.style.transform = `scale(${scale})`; sw.style.width = SW * scale + 'px'; sw.style.height = SH * scale + 'px'; stage.style.setProperty('--hs', 1 / scale); }
      function renderStage() {
        renderSlide(slide(), d.theme, stage);
        stage.querySelectorAll('.sl-el').forEach((el) => { if (el.dataset.id === selId) select(el.dataset.id, true); });
        notes.value = slide().notes || ''; $('[data-st]').textContent = `Slide ${cur + 1} of ${d.slides.length} · ${d.theme}`;
      }
      function renderThumbs() {
        thumbs.innerHTML = '';
        d.slides.forEach((s, i) => {
          const t = OS.el(`<div class="sl-thumb ${i === cur ? 'on' : ''}" draggable="true"><span>${i + 1}</span><div class="sl-tbox"><div class="sl-mini"></div></div></div>`);
          const mini = t.querySelector('.sl-mini'); renderSlide(s, d.theme, mini);
          t.onclick = () => { commitEdit(); cur = i; selId = null; renderStage(); renderThumbs(); };
          OS.onContext(t, (e, x, y) => OS.menu(x, y, [{ label: 'New slide after', icon: 'plus', action: () => addSlide(i) }, { label: 'Duplicate', icon: 'copy', action: () => { snapshot(); const c = JSON.parse(JSON.stringify(s)); c.id = uid(); c.els.forEach((e2) => (e2.id = uid())); d.slides.splice(i + 1, 0, c); cur = i + 1; renderAll(); changed(); } }, { label: 'Move up', icon: 'arrowup', disabled: i === 0, action: () => moveSlide(i, -1) }, { label: 'Move down', icon: 'arrowdown', disabled: i === d.slides.length - 1, action: () => moveSlide(i, 1) }, '-', { label: 'Delete slide', icon: 'trash', danger: true, disabled: d.slides.length < 2, action: () => { snapshot(); d.slides.splice(i, 1); cur = Math.min(cur, d.slides.length - 1); renderAll(); changed(); } }]));
          t.ondragstart = (e) => e.dataTransfer.setData('text/slide', String(i)); t.ondragover = (e) => e.preventDefault(); t.ondrop = (e) => { e.preventDefault(); const from = +e.dataTransfer.getData('text/slide'); if (isNaN(from) || from === i) return; snapshot(); const [m] = d.slides.splice(from, 1); d.slides.splice(i, 0, m); cur = i; renderAll(); changed(); };
          thumbs.appendChild(t);
        });
        const add = OS.el(`<button class="sl-add" title="New slide">${gl('plus')}</button>`); add.onclick = () => addSlide(cur); thumbs.appendChild(add);
        requestAnimationFrame(() => thumbs.querySelectorAll('.sl-tbox').forEach((b) => (b.firstElementChild.style.transform = `scale(${b.clientWidth / SW})`)));
        thumbs.querySelector('.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
      const renderAll = () => { renderStage(); renderThumbs(); };
      const moveSlide = (i, dir) => { snapshot(); const [m] = d.slides.splice(i, 1); d.slides.splice(i + dir, 0, m); cur = i + dir; renderAll(); changed(); };
      function addSlide(after) { const r = thumbs.getBoundingClientRect(); OS.menu(r.left + 20, Math.min(r.top + 60, innerHeight - 260), Object.keys(LAYOUTS).map((l) => ({ label: l, icon: 'present', action: () => { commitEdit(); snapshot(); d.slides.splice(after + 1, 0, mkSlide(l)); cur = after + 1; selId = null; renderAll(); changed(); } }))); }
      // selection & editing
      function select(id, keepEdit) {
        stage.querySelectorAll('.sl-sel').forEach((x) => x.classList.remove('sl-sel')); stage.querySelectorAll('.sl-h').forEach((x) => x.remove());
        if (!keepEdit && editId && editId !== id) commitEdit();
        selId = id; const el = id && stage.querySelector(`[data-id="${id}"]`); if (!el) { selId = null; updTb(); return; }
        el.classList.add('sl-sel'); ['nw', 'ne', 'sw', 'se', 'e', 'w', 'n', 's'].forEach((h) => { const hd = document.createElement('i'); hd.className = 'sl-h sl-h-' + h; hd.dataset.h = h; el.appendChild(hd); });
        updTb();
      }
      function startEdit(id) { const e = elOf(id); if (!e || e.t !== 'text') return; editId = id; const el = stage.querySelector(`[data-id="${id}"]`); const tx = el.querySelector('.sl-txt'); el.classList.add('sl-editing'); tx.contentEditable = 'true'; tx.focus(); const placeholder = /^(Click to add|Slide title|Section title|Comparison)/.test(tx.innerText.trim()); const r = document.createRange(); if (placeholder) r.selectNodeContents(tx); else { r.selectNodeContents(tx); r.collapse(false); } const s = getSelection(); s.removeAllRanges(); s.addRange(r); snapshot(); }
      function commitEdit() { if (!editId) return; const el = stage.querySelector(`[data-id="${editId}"]`); const e = elOf(editId); if (el && e) { const tx = el.querySelector('.sl-txt'); e.html = sanitize(tx.innerHTML); tx.contentEditable = 'false'; el.classList.remove('sl-editing'); changed(); } editId = null; }
      function updTb() { const e = selId && elOf(selId); ['b', 'i', 'u'].forEach((k) => $(`[data-a=${k}]`).classList.toggle('on', !!(e && e[k]))); ['left', 'center', 'right'].forEach((a) => $(`[data-a=al-${a}]`).classList.toggle('on', !!(e && (e.align || 'left') === a && e.t === 'text'))); $('[data-hint]').textContent = e ? (e.t === 'text' ? (editId ? 'Editing text' : 'Tap again or double-click to edit text') : e.t) + ` · ${Math.round(e.w)}×${Math.round(e.h)}` : ''; }
      // pointer: move / resize
      stage.addEventListener('pointerdown', (e) => {
        const el = e.target.closest('.sl-el');
        if (!el) { commitEdit(); select(null); return; }
        const id = el.dataset.id, obj = elOf(id); const h = e.target.dataset.h;
        if (editId === id && !h) return; // let text editing work
        e.preventDefault(); const wasSel = selId === id; select(id);
        const sx = e.clientX, sy = e.clientY, o = { x: obj.x, y: obj.y, w: obj.w, h: obj.h }; let moved = false; let snapped = false;
        el.setPointerCapture(e.pointerId);
        const mv = (ev2) => {
          const dx = (ev2.clientX - sx) / scale, dy = (ev2.clientY - sy) / scale; if (!moved && Math.hypot(dx, dy) * scale < 4) return; if (!moved) { moved = true; snapshot(); }
          if (h) { if (h.includes('e')) obj.w = Math.max(20, o.w + dx); if (h.includes('s')) obj.h = Math.max(16, o.h + dy); if (h.includes('w')) { obj.w = Math.max(20, o.w - dx); obj.x = o.x + o.w - obj.w; } if (h.includes('n')) { obj.h = Math.max(16, o.h - dy); obj.y = o.y + o.h - obj.h; } if (ev2.shiftKey && obj.t === 'image') obj.h = obj.w * (o.h / o.w); }
          else { obj.x = Math.round(o.x + dx); obj.y = Math.round(o.y + dy); const cxm = obj.x + obj.w / 2, cym = obj.y + obj.h / 2; snapped = false; if (Math.abs(cxm - SW / 2) < 8) { obj.x = SW / 2 - obj.w / 2; snapped = true; } if (Math.abs(cym - SH / 2) < 8) { obj.y = SH / 2 - obj.h / 2; snapped = true; } }
          Object.assign(el.style, { left: obj.x + 'px', top: obj.y + 'px', width: obj.w + 'px', height: obj.h + 'px' }); stage.classList.toggle('sl-snap', snapped); updTb();
        };
        const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); stage.classList.remove('sl-snap'); if (moved) changed(); else if (wasSel && obj.t === 'text' && !h) startEdit(id); };
        el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
      });
      stage.addEventListener('dblclick', (e) => { const el = e.target.closest('.sl-el'); if (el && elOf(el.dataset.id)?.t === 'text' && editId !== el.dataset.id) startEdit(el.dataset.id); });
      stage.addEventListener('input', () => doc.touch());
      OS.onContext(sw, (e, x, y) => {
        const el = e.target.closest('.sl-el'); if (el) select(el.dataset.id); const obj = selId && elOf(selId);
        if (!obj) return OS.menu(x, y, [{ label: 'Add text box', icon: 'textbox', action: addText }, { label: 'Add image…', icon: 'image', action: addImageFromFiles }, { label: 'Paste', icon: 'clipboard', disabled: !elClip, action: pasteEl }, '-', { label: 'Slide background…', icon: 'palette', action: themeMenu }]);
        OS.menu(x, y, [obj.t === 'text' && { label: 'Edit text', icon: 'edit', action: () => startEdit(obj.id) }, { label: 'Copy', icon: 'copy', action: () => (elClip = JSON.parse(JSON.stringify(obj))) }, { label: 'Duplicate', icon: 'squares', action: dupEl }, '-', { label: 'Bring to front', icon: 'arrowup', action: () => zMove(1e9) }, { label: 'Bring forward', icon: 'arrowup', action: () => zMove(1) }, { label: 'Send backward', icon: 'arrowdown', action: () => zMove(-1) }, { label: 'Send to back', icon: 'arrowdown', action: () => zMove(-1e9) }, '-', { label: 'Center on slide', icon: 'alignc', action: () => { snapshot(); obj.x = (SW - obj.w) / 2; obj.y = (SH - obj.h) / 2; renderStage(); changed(); } }, { label: 'Delete', icon: 'trash', danger: true, action: delEl }]);
      });
      // element operations
      const addEl = (o) => { commitEdit(); snapshot(); o.id = uid(); slide().els.push(o); renderStage(); select(o.id); changed(); return o; };
      const addText = () => { const o = addEl({ t: 'text', x: 280, y: 220, w: 400, h: 80, html: 'New text', fs: 28 }); setTimeout(() => startEdit(o.id), 30); };
      const addImage = (src) => { const img = new Image(); img.onload = () => { let w = img.naturalWidth || 400, h = img.naturalHeight || 300; const k = Math.min(1, 480 / w, 340 / h); w *= k; h *= k; addEl({ t: 'image', src, x: (SW - w) / 2, y: (SH - h) / 2, w, h }); }; img.src = src; };
      const addImageFromFiles = async () => { const p = await OS.pickFile({ mode: 'open', path: OS.home() + '/Pictures', filter: (n) => OS.ftype(n) === 'image' }); if (p) addImage(OS.toDataUrl(OS.fs.read(p), p)); };
      const delEl = () => { if (!selId) return; commitEdit(); snapshot(); slide().els = slide().els.filter((e) => e.id !== selId); selId = null; renderStage(); changed(); };
      const dupEl = () => { const o = selId && elOf(selId); if (!o) return; const c = JSON.parse(JSON.stringify(o)); c.x += 20; c.y += 20; addEl(c); };
      const pasteEl = () => { if (!elClip) return; const c = JSON.parse(JSON.stringify(elClip)); c.x += 20; c.y += 20; addEl(c); };
      const zMove = (n) => { const els = slide().els, i = els.findIndex((e) => e.id === selId); if (i < 0) return; snapshot(); const [o] = els.splice(i, 1); els.splice(OS.clamp(i + n, 0, els.length), 0, o); renderStage(); changed(); };
      const setProp = (fn) => { const o = selId && elOf(selId); if (!o) return; if (!editId) snapshot(); fn(o); const keep = editId; if (keep) { const el = stage.querySelector(`[data-id="${keep}"]`); const th = THEMES[d.theme]; Object.assign(el.style, { fontSize: (o.fs || 24) + 'px', textAlign: o.align || 'left', color: o.color || (o.role === 'title' ? th.title : th.text) }); } else renderStage(); changed(); updTb(); };
      const textCmd = (cmd, prop) => { if (editId) { document.execCommand(cmd); doc.touch(); } else setProp((o) => { if (o.t === 'text') o[prop] = o[prop] ? 0 : 1; }); };
      // toolbar
      noFocusSteal($('.of-tb'));
      const A = (n, f) => ($(`[data-a="${n}"]`).onclick = f);
      A('save', () => doc.save()); A('newslide', () => addSlide(cur)); A('text', addText); A('del', delEl);
      A('undo', () => { if (!undo.length) return; commitEdit(); redo.push(JSON.stringify(d)); d = JSON.parse(undo.pop()); cur = Math.min(cur, d.slides.length - 1); renderAll(); doc.touch(); });
      A('redo', () => { if (!redo.length) return; undo.push(JSON.stringify(d)); d = JSON.parse(redo.pop()); cur = Math.min(cur, d.slides.length - 1); renderAll(); doc.touch(); });
      A('image', (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left, r.bottom + 4, [{ label: 'From Pictures…', icon: 'image', action: addImageFromFiles }, { label: 'From device…', icon: 'upload', action: () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = () => { const f = i.files[0]; if (!f) return; const img = new Image(); img.onload = () => { const cv = document.createElement('canvas'); const k = Math.min(1, 1280 / img.width); cv.width = img.width * k; cv.height = img.height * k; cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); addImage(cv.toDataURL('image/jpeg', 0.85)); }; img.src = URL.createObjectURL(f); }; i.click(); } }]); });
      A('shape', (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left, r.bottom + 4, Object.keys(SHAPES).map((s) => ({ label: s[0].toUpperCase() + s.slice(1), icon: s === 'ellipse' ? 'circle' : s === 'line' ? 'line' : 'shape', action: () => addEl({ t: 'shape', shape: s, x: 380, y: s === 'line' ? 260 : 190, w: 200, h: s === 'line' ? 20 : 160 }) }))); });
      A('fs+', () => setProp((o) => { if (o.t === 'text') o.fs = Math.min(160, Math.round((o.fs || 24) * 1.15)); }));
      A('fs-', () => setProp((o) => { if (o.t === 'text') o.fs = Math.max(8, Math.round((o.fs || 24) / 1.15)); }));
      A('b', () => textCmd('bold', 'b')); A('i', () => textCmd('italic', 'i')); A('u', () => textCmd('underline', 'u'));
      ['left', 'center', 'right'].forEach((a) => A('al-' + a, () => setProp((o) => (o.align = a))));
      A('list', () => { if (editId) { document.execCommand('insertUnorderedList'); doc.touch(); } else setProp((o) => { if (o.t !== 'text') return; o.html = /<li>/.test(o.html) ? o.html.replace(/<\/li>/g, '<br>').replace(/<\/?(ul|ol|li)>/g, '') : '<ul>' + o.html.split(/<br\s*\/?>|\n/).filter((x) => x.trim()).map((x) => `<li>${x}</li>`).join('') + '</ul>'; }); });
      A('front', () => zMove(1)); A('back', () => zMove(-1));
      const ci = $('input[type=color][data-a=color]'); ci.oninput = () => ($('[data-sw=color]').style.background = ci.value);
      ci.onchange = () => { if (editId) { document.execCommand('styleWithCSS', false, true); document.execCommand('foreColor', false, ci.value); doc.touch(); } else setProp((o) => { if (o.t === 'shape') o.fill = ci.value; else o.color = ci.value; }); };
      function themeMenu() {
        const p = OS.dialog({ title: 'Theme & background', html: `<div class="sl-themes">${Object.keys(THEMES).map((t) => `<button class="sl-themebtn ${d.theme === t ? 'on' : ''}" data-t="${t}"><div style="background:${THEMES[t].bg};color:${THEMES[t].title};font-family:${THEMES[t].font}"><b>Aa</b><i style="background:${THEMES[t].accent}"></i></div><span>${t}</span></button>`).join('')}</div><div class="row small" style="flex-wrap:wrap">This slide's background: <input type="color" data-bg value="#ffffff"><button class="btn sm" data-reset>Use theme</button></div>`, buttons: [{ label: 'Done', value: true, primary: true }] });
        const dl = OS._dlg.el; dl.style.width = 'min(560px,100%)';
        dl.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { snapshot(); d.theme = b.dataset.t; dl.querySelectorAll('[data-t]').forEach((x) => x.classList.toggle('on', x === b)); renderAll(); changed(); }));
        dl.querySelector('[data-bg]').onchange = (e) => { snapshot(); slide().bg = e.target.value; renderAll(); changed(); };
        dl.querySelector('[data-reset]').onclick = () => { snapshot(); slide().bg = null; renderAll(); changed(); };
        void p;
      }
      A('theme', themeMenu);
      notes.addEventListener('input', () => { slide().notes = notes.value; doc.touch(); });
      // presentation mode
      function present(from = cur) {
        commitEdit(); let i = from;
        const ov = OS.el(`<div class="sl-present"><div class="sl-pstage"></div><div class="sl-pbar"><button class="ibtn" data-p="prev">${gl('left')}</button><span data-n></span><button class="ibtn" data-p="next">${gl('right')}</button><button class="ibtn" data-p="x">${gl('x')}</button></div></div>`);
        document.body.appendChild(ov); const ps = ov.querySelector('.sl-pstage');
        const fitP = () => { const k = Math.min(innerWidth / SW, innerHeight / SH); ps.style.transform = `translate(-50%,-50%) scale(${k})`; };
        const show = () => { ps.style.opacity = 0; setTimeout(() => { renderSlide(d.slides[i], d.theme, ps); ps.style.opacity = 1; }, 120); ov.querySelector('[data-n]').textContent = `${i + 1} / ${d.slides.length}`; };
        const go = (n) => { if (n >= d.slides.length) return end(); i = OS.clamp(n, 0, d.slides.length - 1); show(); };
        const end = () => { removeEventListener('resize', fitP); document.removeEventListener('keydown', key, true); if (document.fullscreenElement === ov) document.exitFullscreen?.().catch(() => {}); ov.remove(); };
        const key = (e) => { if (['ArrowRight', ' ', 'PageDown', 'Enter', 'n'].includes(e.key)) { e.preventDefault(); go(i + 1); } else if (['ArrowLeft', 'PageUp', 'Backspace', 'p'].includes(e.key)) { e.preventDefault(); go(i - 1); } else if (e.key === 'Escape') { e.preventDefault(); end(); } else if (e.key === 'Home') go(0); else if (e.key === 'End') go(d.slides.length - 1); };
        document.addEventListener('keydown', key, true); addEventListener('resize', fitP);
        let sx = null; ov.addEventListener('pointerdown', (e) => { if (e.target.closest('.sl-pbar')) return; sx = e.clientX; });
        ov.addEventListener('pointerup', (e) => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); else go(e.clientX > innerWidth / 3 ? i + 1 : i - 1); });
        ov.querySelector('[data-p=prev]').onclick = () => go(i - 1); ov.querySelector('[data-p=next]').onclick = () => go(i + 1); ov.querySelector('[data-p=x]').onclick = end;
        ov.requestFullscreen?.().catch(() => {}); ov.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && ov.isConnected) {} });
        fitP(); show();
      }
      A('present', () => present(cur));
      const baseName = () => (doc.path ? OS.fs.basename(doc.path).replace(/\.[^.]+$/, '') : 'Untitled Presentation');
      A('menu', (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left, r.bottom + 4, [
        { label: 'New presentation', icon: 'plus', action: async () => { if (!(await doc.confirmLose())) return; d = { v: 1, app: 'cumulus-slides', theme: 'Cumulus', slides: [mkSlide('Title')] }; cur = 0; doc.path = null; doc.dirty = false; doc.title(); renderAll(); } },
        { label: 'Open…', icon: 'folder', action: () => doc.open() }, { label: 'Save', icon: 'save', key: 'Ctrl+S', action: () => doc.save() }, { label: 'Save As…', icon: 'save', action: () => doc.save(true) }, '-',
        { label: 'Present from start', icon: 'play', key: 'F5', action: () => present(0) }, { label: 'Present from this slide', icon: 'play', key: 'Shift+F5', action: () => present(cur) }, '-',
        { label: 'Export slideshow as HTML…', icon: 'globe', action: async () => { const p = await OS.pickFile({ mode: 'save', path: OS.home() + '/Documents', name: baseName() + '.html' }); if (p) { OS.fs.write(p, slideshowHtml(d, baseName())); OS.notify('Exported', OS.fs.pretty(p), { app: 'slides', onclick: () => OS.wm.open('browser', { url: 'file://' + p }) }); } } },
        { label: 'Download slideshow (.html)', icon: 'download', action: () => OS.downloadReal(baseName() + '.html', slideshowHtml(d, baseName())) },
        { label: 'Print / Save as PDF…', icon: 'printer', action: () => printHtml(slideshowHtml(d, baseName()).replace('<script>', '<script>window.onload=function(){};').replace('</style>', '@page{size:960px 540px;margin:0}</style>')) },
      ]); });
      OS.wm.keys(win, (e) => {
        if (e.target.closest && (e.target.closest('.sl-txt[contenteditable=true]') || e.target === notes || e.target.tagName === 'INPUT')) { if (e.key === 'Escape' && editId) { const id = editId; commitEdit(); select(id); } return; }
        const c = e.ctrlKey || e.metaKey; const o = selId && elOf(selId);
        if ((e.key === 'Delete' || e.key === 'Backspace') && o) { e.preventDefault(); delEl(); }
        else if (e.key === 'F5') { e.preventDefault(); present(e.shiftKey ? cur : 0); }
        else if (c && e.key === 's') { e.preventDefault(); doc.save(); }
        else if (c && e.key === 'z') { e.preventDefault(); $('[data-a=undo]').click(); } else if (c && e.key === 'y') { e.preventDefault(); $('[data-a=redo]').click(); }
        else if (c && e.key === 'd' && o) { e.preventDefault(); dupEl(); } else if (c && e.key === 'c' && o) elClip = JSON.parse(JSON.stringify(o)); else if (c && e.key === 'v' && elClip) { e.preventDefault(); pasteEl(); }
        else if (c && e.key === 'm') { e.preventDefault(); addSlide(cur); }
        else if (o && e.key.startsWith('Arrow')) { e.preventDefault(); snapshot(); const st = e.shiftKey ? 10 : 1; if (e.key === 'ArrowLeft') o.x -= st; if (e.key === 'ArrowRight') o.x += st; if (e.key === 'ArrowUp') o.y -= st; if (e.key === 'ArrowDown') o.y += st; renderStage(); changed(); }
        else if (!o && (e.key === 'PageDown' || e.key === 'ArrowDown') && cur < d.slides.length - 1) { cur++; renderAll(); } else if (!o && (e.key === 'PageUp' || e.key === 'ArrowUp') && cur > 0) { cur--; renderAll(); }
        else if (e.key === 'Enter' && o && o.t === 'text') { e.preventDefault(); startEdit(o.id); }
        else if (e.key === 'Escape') select(null);
      });
      const ro = new ResizeObserver(fit); ro.observe($('.sl-center')); win.onClose(() => ro.disconnect());
      win.onArgs = async (a) => { if (a.path && (await doc.confirmLose())) doc.load(a.path); };
      if (args.path) doc.load(args.path); else { renderAll(); doc.title(); }
      fit();
    },
  });

  /* =========================== START CENTER =========================== */
  OS.registerApp({
    id: 'office', name: 'Cumulus Office', icon: 'briefcase', color: ['#8b5cff', '#5b2bd4'], cat: 'Office', w: 900, h: 620, single: true, desc: 'Office suite start center', keywords: 'office libreoffice suite documents writer sheets slides start center',
    launch(win) {
      const render = () => {
        const recent = OS.fs.find(OS.home(), (n, nd, p) => nd.t === 'f' && /\.(cdoc|csht|cslide)$/i.test(n) && !p.includes('/.local/share/Trash'), 300).map((p) => ({ p, s: OS.fs.stat(p) })).sort((a, b) => b.s.mtime - a.s.mtime).slice(0, 16);
        const appFor = (p) => (/\.cdoc$/i.test(p) ? 'writer' : /\.csht$/i.test(p) ? 'sheets' : 'slides');
        win.body.innerHTML = `<div class="scroll"><div class="oc">
          <div class="oc-hero">${OS.appIcon('office', 56)}<div><h2>Cumulus Office</h2><p>Create documents, spreadsheets and presentations. Files save to your Documents folder.</p></div></div>
          <div class="sm-title">Create</div>
          <div class="oc-new">${[['writer', 'Document', 'Letters, reports, résumés'], ['sheets', 'Spreadsheet', 'Budgets, lists, calculations'], ['slides', 'Presentation', 'Slideshows with themes']].map(([a, t, s]) => `<button class="oc-tile" data-new="${a}">${OS.appIcon(a, 48)}<div><b>${t}</b><small>${s}</small></div></button>`).join('')}</div>
          <div class="sm-title">Templates</div>
          <div class="oc-tpl">${Object.keys(WR_TEMPLATES).filter((t) => t !== 'Blank').map((t) => `<button class="oc-tpl-b" data-tpl="${t}"><div class="oc-paper"><i></i><i></i><i></i><i></i></div><span>${t}</span></button>`).join('')}</div>
          <div class="row"><div class="sm-title" style="flex:1">Recent documents</div><button class="btn sm" data-a="open">${gl('folder')}Open file…</button></div>
          <div class="oc-recent">${recent.length ? recent.map(({ p, s }) => `<button class="sm-row" data-open="${esc(p)}" data-app="${appFor(p)}">${OS.appIcon(appFor(p), 34)}<div style="flex:1;min-width:0"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(OS.fs.basename(p))}</b><small>${esc(OS.fs.pretty(OS.fs.dirname(p)))} · ${OS.fmtDate(s.mtime)}</small></div></button>`).join('') : '<div class="muted small pad">No documents yet — create one above.</div>'}</div>
        </div></div>`;
        win.body.querySelectorAll('[data-new]').forEach((b) => (b.onclick = () => OS.wm.open(b.dataset.new)));
        win.body.querySelectorAll('[data-tpl]').forEach((b) => (b.onclick = () => OS.wm.open('writer', { template: b.dataset.tpl })));
        win.body.querySelectorAll('[data-open]').forEach((b) => { b.onclick = () => OS.wm.open(b.dataset.app, { path: b.dataset.open }); OS.onContext(b, (e, x, y) => OS.menu(x, y, [{ label: 'Open', icon: 'external', action: () => b.click() }, { label: 'Show in Files', icon: 'folder', action: () => OS.wm.open('files', { path: OS.fs.dirname(b.dataset.open) }) }, { label: 'Move to Trash', icon: 'trash', danger: true, action: () => OS.fs.trash(b.dataset.open) }])); });
        win.body.querySelector('[data-a=open]').onclick = async () => { const p = await OS.pickFile({ mode: 'open', path: OS.home() + '/Documents', filter: (n) => /\.(cdoc|csht|cslide|csv|tsv|doc|txt|html|md)$/i.test(n) }); if (p) OS.desktop.openPath(p); };
      };
      let t = null; const off = OS.on('fs', () => { clearTimeout(t); t = setTimeout(render, 300); }); win.onClose(off);
      render();
    },
  });

  /* =========================== sample documents =========================== */
  office.ensureSamples = () => {
    if (OS.store.get('office-samples')) return; OS.store.set('office-samples', 1);
    const dir = OS.home() + '/Documents'; try { OS.fs.mkdir(dir, { p: true }); } catch (e) { return; }
    const put = (n, c) => { const p = OS.fs.join(dir, n); if (!OS.fs.exists(p)) OS.fs.write(p, c); };
    put('Welcome to Cumulus Office.cdoc', `<!-- cumulus-writer 1 -->\n<h1>Welcome to Cumulus Office</h1><p>Cumulus Office is a complete office suite for Cirrus Linux. It includes:</p><ul><li><b>Writer</b> — a word processor with styles, fonts, colors, lists, tables, images, find &amp; replace and export to Word, HTML and PDF.</li><li><b>Sheets</b> — a spreadsheet with formulas like <code>=SUM(B2:B6)</code>, number formats, sorting, charts and CSV import/export.</li><li><b>Slides</b> — a presentation editor with themes, text, shapes, images and a full-screen slideshow.</li></ul><h2>Try it</h2><p>Select some text and use the toolbar to make it <b>bold</b>, <i>italic</i>, <span style="color:#e5484d">colorful</span> or <span style="background-color:#fff176">highlighted</span>. Right-click (or long-press) a table to add rows and columns:</p><table class="wr-table"><tbody><tr><th>App</th><th>File type</th><th>Opens</th></tr><tr><td>Writer</td><td>.cdoc</td><td>.cdoc .doc .html .txt .md</td></tr><tr><td>Sheets</td><td>.csht</td><td>.csht .csv .tsv</td></tr><tr><td>Slides</td><td>.cslide</td><td>.cslide</td></tr></tbody></table><p>Have fun! ✨</p>`);
    const cells = {}; const set = (k, v, s) => (cells[k] = s ? { v, s } : { v });
    set('A1', 'Monthly Budget', { b: 1 }); set('A3', 'Category', { b: 1, bg: '#dbe7ff' }); set('B3', 'Budget', { b: 1, bg: '#dbe7ff', al: 'right' }); set('C3', 'Spent', { b: 1, bg: '#dbe7ff', al: 'right' }); set('D3', 'Left', { b: 1, bg: '#dbe7ff', al: 'right' });
    [['Rent', 900, 900], ['Groceries', 350, 296.4], ['Transport', 120, 84], ['Internet', 40, 40], ['Fun', 150, 172.5], ['Savings', 300, 300]].forEach(([c, b, s], i) => { const r = i + 4; set('A' + r, c); set('B' + r, String(b), { fmt: 'usd' }); set('C' + r, String(s), { fmt: 'usd' }); set('D' + r, `=B${r}-C${r}`, { fmt: 'usd' }); });
    set('A10', 'Total', { b: 1 }); set('B10', '=SUM(B4:B9)', { b: 1, fmt: 'usd' }); set('C10', '=SUM(C4:C9)', { b: 1, fmt: 'usd' }); set('D10', '=B10-C10', { b: 1, fmt: 'usd' });
    set('A12', 'Spent of budget'); set('B12', '=C10/B10', { fmt: 'pct' }); set('A13', 'Over budget items'); set('B13', '=COUNTIF(D4:D9,"<0")'); set('A14', 'Status'); set('B14', '=IF(D10>=0,"On track 👍","Over budget")');
    put('Budget.csht', JSON.stringify({ v: 1, app: 'cumulus-sheets', sheets: [Object.assign(newSheet('Budget'), { cells, colW: { 0: 150 } })], active: 0 }));
    const s1 = mkSlide('Title'); s1.els[0].html = 'Cirrus Linux'; s1.els[1].html = 'A complete desktop in your browser';
    const s2 = mkSlide(); s2.els[0].html = 'What you get'; s2.els[1].html = '<ul><li>A real terminal with apt, nano, vim and top</li><li>Files, Browser, Settings and many apps</li><li>Games and the Cumulus Office suite</li><li>Works on phones, tablets and desktops</li></ul>';
    const s3 = mkSlide('Section'); s3.els[0].html = 'Thank you!'; s3.els.push({ id: uid(), t: 'shape', shape: 'star', x: 430, y: 330, w: 100, h: 100 });
    put('Cirrus Tour.cslide', JSON.stringify({ v: 1, app: 'cumulus-slides', theme: 'Midnight', slides: [s1, s2, s3] }));
    OS.emit('fs', dir);
  };
})();
