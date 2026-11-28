/* Cirrus Linux — Browser: tabs, history, bookmarks, Cirrus Search, and three ways to show a page:
   direct (iframe), compatible (fetched through a CORS proxy and rendered sandboxed) and reader (text-only). */
(function () {
  'use strict';
  const esc = OS.esc, gl = OS.glyph;
  const DEFAULT_BM = [
    { t: 'Wikipedia', u: 'https://en.m.wikipedia.org/wiki/Main_Page', i: 'book' }, { t: 'YouTube', u: 'https://www.youtube.com', i: 'play' }, { t: 'Hacker News', u: 'https://news.ycombinator.com', i: 'code' },
    { t: 'Maps', u: 'https://www.openstreetmap.org/export/embed.html?bbox=-10,35,30,60&layer=mapnik', i: 'map' }, { t: 'Archive', u: 'https://archive.org', i: 'hdd' }, { t: 'Help', u: 'about:help', i: 'info' },
  ];
  const TILES = [['Wikipedia', 'https://en.m.wikipedia.org/wiki/Main_Page', '#636466', 'W'], ['YouTube', 'https://www.youtube.com', '#ff0033', '▶'], ['GitHub', 'https://github.com', '#24292f', 'GH'], ['Reddit', 'https://old.reddit.com', '#ff4500', 'r/'], ['Hacker News', 'https://news.ycombinator.com', '#ff6600', 'Y'], ['BBC News', 'https://www.bbc.com/news', '#bb1919', 'B'], ['Stack Overflow', 'https://stackoverflow.com', '#f48024', 'SO'], ['MDN', 'https://developer.mozilla.org', '#1b1b1b', 'M'], ['NASA', 'https://www.nasa.gov', '#0b3d91', 'N'], ['Maps', 'https://www.openstreetmap.org/export/embed.html?bbox=-10,35,30,60&layer=mapnik', '#7ebc6f', '⌖'], ['Archive', 'https://archive.org', '#333', 'IA'], ['Weather', 'https://wttr.in/?format=4', '#2bb3ff', '☀'], ['Example', 'https://example.com', '#6c8cff', 'E'], ['Wiktionary', 'https://en.m.wiktionary.org', '#444', 'Wt'], ['XKCD', 'https://xkcd.com', '#96a8c8', 'xk'], ['Project Gutenberg', 'https://www.gutenberg.org', '#2c4f7c', 'PG']];
  // sites that allow being shown inside a frame
  const FRAMEABLE = /(^|\.)(wikipedia\.org|wiktionary\.org|wikimedia\.org|wikibooks\.org|wikiquote\.org|wikivoyage\.org|openstreetmap\.org|archive\.org|example\.(com|org|net)|youtube-nocookie\.com|player\.vimeo\.com|open\.spotify\.com|bandcamp\.com|codepen\.io|jsfiddle\.net|wttr\.in|xkcd\.com|neal\.fun|gutenberg\.org|openlibrary\.org|duckduckgo\.com|w3\.org|lite\.cnn\.com|text\.npr\.org)$/i;
  const MEDIA = /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif|mp4|webm|ogv|mov|mp3|ogg|wav|flac|m4a|pdf)(\?.*)?$/i;
  const PROXIES = [(u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`, (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`, (u) => `https://thingproxy.freeboard.io/fetch/${u}`];
  const MODES = { auto: ['Auto', 'sparkle'], direct: ['Direct', 'globe'], compat: ['Compatible', 'shield'], reader: ['Reader', 'book'] };
  const histGet = () => OS.store.get('br-history', []);
  const histAdd = (url, title) => { if (!/^https?:|^about:search/.test(url)) return; const h = histGet().filter((x) => x.u !== url); h.unshift({ u: url, t: title || url, at: Date.now() }); OS.store.set('br-history', h.slice(0, 400)); };
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };

  /* --------- URL rewriting for well-known sites -> embeddable versions --------- */
  function rewrite(u) {
    let m;
    if ((m = /^https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:.*&)?v=([\w-]{6,})/.exec(u)) || (m = /^https?:\/\/youtu\.be\/([\w-]{6,})/.exec(u)) || (m = /^https?:\/\/(?:www\.)?youtube\.com\/shorts\/([\w-]{6,})/.exec(u))) return `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0`;
    if ((m = /^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/.exec(u))) return `https://player.vimeo.com/video/${m[1]}?autoplay=1`;
    if ((m = /^https?:\/\/open\.spotify\.com\/(track|album|playlist|artist|episode|show)\/(\w+)/.exec(u))) return `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
    if ((m = /^https?:\/\/(?:www\.)?google\.[a-z.]+\/maps\/(?:place|search)\/([^/@?]+)/.exec(u)) || (m = /^https?:\/\/maps\.google\.[a-z.]+\/?\?q=([^&]+)/.exec(u))) return `https://maps.google.com/maps?q=${m[1]}&output=embed`;
    if ((m = /^https?:\/\/(?:www\.)?openstreetmap\.org\/(?:#map=|\?.*?#map=)(\d+)\/([-\d.]+)\/([-\d.]+)/.exec(u))) { const z = +m[1], la = +m[2], lo = +m[3], d = 180 / Math.pow(2, z); return `https://www.openstreetmap.org/export/embed.html?bbox=${lo - d},${la - d / 2},${lo + d},${la + d / 2}&layer=mapnik&marker=${la},${lo}`; }
    if (/^https?:\/\/(www\.)?reddit\.com/.test(u)) return u.replace(/\/\/(www\.)?reddit\.com/, '//old.reddit.com');
    if ((m = /^https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(.*)$/.exec(u))) return `https://nitter.net/${m[1]}`;
    if (/^https?:\/\/en\.wikipedia\.org\//.test(u)) return u.replace('//en.wikipedia.org', '//en.m.wikipedia.org');
    return u;
  }

  /* --------- fetch through proxies --------- */
  async function fetchVia(url) {
    const order = OS.store.get('br-proxy', 0); const idx = [order, ...PROXIES.keys()].filter((v, i, a) => a.indexOf(v) === i);
    let lastErr;
    for (const i of idx) {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 14000);
      try { const r = await fetch(PROXIES[i](url), { signal: ctl.signal }); clearTimeout(to); if (!r.ok) throw new Error('HTTP ' + r.status); const ct = r.headers.get('content-type') || ''; const text = await r.text(); if (!text || text.length < 30) throw new Error('empty response'); OS.store.set('br-proxy', i); return { text, ct }; }
      catch (e) { clearTimeout(to); lastErr = e; }
    }
    throw lastErr || new Error('unreachable');
  }
  const INJECT = (base) => `<base href="${esc(base)}" target="_self"><meta name="referrer" content="no-referrer"><script>(function(){var B=${JSON.stringify(base)};function go(u,nt){parent.postMessage({cirrusNav:u,newTab:!!nt},'*')}
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href');if(!h||h.charAt(0)==='#'||/^javascript:/i.test(h))return;e.preventDefault();go(a.href,e.ctrlKey||e.metaKey||e.button===1)},true);
document.addEventListener('submit',function(e){var f=e.target;var m=(f.method||'get').toLowerCase();if(m!=='get')return;e.preventDefault();var u=new URL(f.getAttribute('action')||B,B);new FormData(f).forEach(function(v,k){if(typeof v==='string')u.searchParams.append(k,v)});go(u.href)},true);
window.open=function(u){if(u)go(new URL(u,B).href,true);return null};try{document.title&&parent.postMessage({cirrusTitle:document.title},'*')}catch(e){}})();<\/script>`;
  function prepare(html, url) {
    html = html.replace(/<meta[^>]+http-equiv=["']?(content-security-policy|x-frame-options|refresh)["']?[^>]*>/gi, '').replace(/<base[^>]*>/gi, '').replace(/\s(integrity|nonce)=["'][^"']*["']/gi, '');
    const inj = INJECT(url);
    if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => m + inj);
    if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (m) => m + '<head>' + inj + '</head>');
    return '<!doctype html><head>' + inj + '</head>' + html;
  }

  /* --------- internal pages --------- */
  function pageBase(extra = '') {
    const accent = OS.settings.accent; const dark = document.documentElement.dataset.theme === 'dark';
    return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{--a:${accent};--bg:${dark ? '#16181d' : '#f6f7fb'};--fg:${dark ? '#e9ebf1' : '#1a1c22'};--card:${dark ? '#22252d' : '#fff'};--mut:${dark ? '#9fa5b3' : '#5a606e'};--bd:${dark ? '#333845' : '#e3e5ea'}}*{box-sizing:border-box}body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:var(--bg);color:var(--fg);line-height:1.5}a{color:var(--a);text-decoration:none}a:hover{text-decoration:underline}.wrap{max-width:780px;margin:0 auto;padding:24px 18px}.card{background:var(--card);border-radius:16px;padding:16px 18px;box-shadow:0 2px 10px rgba(0,0,0,.08);margin:12px 0;border:1px solid var(--bd)}code{background:${dark ? '#0d0f14' : '#eef'};padding:2px 6px;border-radius:6px}.mut{color:var(--mut)}form.s{display:flex;background:var(--card);border-radius:999px;box-shadow:0 6px 24px rgba(0,0,0,.12);overflow:hidden;border:1px solid var(--bd)}form.s input{flex:1;border:0;outline:0;background:transparent;color:var(--fg);font-size:17px;padding:14px 20px;min-width:0}form.s button{border:0;background:var(--a);color:#fff;padding:0 22px;font-size:15px;cursor:pointer}${extra}</style><script>document.addEventListener('click',function(e){var a=e.target.closest('a[href],[data-nav]');if(!a)return;var h=a.getAttribute('data-nav')||a.getAttribute('href');if(!h||h.charAt(0)==='#')return;e.preventDefault();parent.postMessage({cirrusNav:h,newTab:e.ctrlKey||e.metaKey},'*')});document.addEventListener('submit',function(e){var f=e.target;if(!f.classList.contains('s'))return;e.preventDefault();parent.postMessage({cirrusNav:f.q.value},'*')});<\/script>`;
  }
  function homePage() {
    const h = new Date().getHours(); const greet = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const recent = histGet().slice(0, 5);
    return `<!doctype html><html><head>${pageBase(`body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 20% 15%,${OS.settings.accent}33,transparent 40%),radial-gradient(circle at 85% 85%,#b06cff33,transparent 40%),var(--bg)}.box{width:min(680px,94vw);text-align:center;padding:24px 0}h1{font-size:clamp(28px,6vw,44px);margin:0 0 4px}.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:12px;margin-top:28px}.tile{display:flex;flex-direction:column;align-items:center;gap:7px;padding:12px 4px;border-radius:14px;color:var(--fg);font-size:12.5px}.tile:hover{background:var(--card);text-decoration:none}.tile i{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;color:#fff;font-style:normal;font-weight:800;font-size:16px;box-shadow:0 4px 14px rgba(0,0,0,.15)}.rec{margin-top:22px;text-align:left}.rec a{display:block;padding:6px 10px;border-radius:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--fg)}.rec a:hover{background:var(--card)}`)}</head><body><div class="box"><h1>${greet} ☁️</h1><p class="mut">Search the web or type an address</p><form class="s"><input name="q" placeholder="Search with Cirrus Search…" autofocus autocomplete="off"><button>Search</button></form>
    <div class="tiles">${TILES.map(([t, u, c, l]) => `<a class="tile" href="${esc(u)}"><i style="background:${c}">${esc(l)}</i>${esc(t)}</a>`).join('')}</div>
    ${recent.length ? `<div class="rec"><div class="mut" style="font-size:13px;margin:0 10px 4px">Recently visited</div>${recent.map((r) => `<a href="${esc(r.u)}">🕘 ${esc(r.t)}</a>`).join('')}</div>` : ''}</div></body></html>`;
  }
  function helpPage() {
    return `<!doctype html><html><head>${pageBase()}</head><body><div class="wrap"><h1>Cirrus Browser</h1>
    <div class="card"><b>How pages are shown</b><p>Many websites refuse to appear inside another app. Cirrus works around that with three display modes — pick one with the <b>mode button</b> left of the address bar:</p><ul><li><b>Auto</b> (recommended) — uses the best mode for each site, and falls back automatically.</li><li><b>Direct</b> — the real site in a frame. Fully interactive, but blocked by many big sites.</li><li><b>Compatible</b> — Cirrus fetches the page through a relay and shows it safely. Works for most sites; complex web apps may lose some features (logins, video players).</li><li><b>Reader</b> — clean, text-only version of any article. Great for news and blogs.</li></ul><p>YouTube, Vimeo and Spotify links open in their embeddable players automatically. If a page still won't work, use <b>Open in real browser</b>.</p></div>
    <div class="card"><b>Search</b><p>Typing words in the address bar uses <b>Cirrus Search</b>: web results, Wikipedia and instant answers (try <a href="about:search?q=12*7%2B3">12*7+3</a> or <a href="about:search?q=Ada Lovelace">Ada Lovelace</a>). Change the engine in Settings → Apps.</p></div>
    <div class="card"><b>Local files</b><p>Open HTML pages and images from your home folder: <a href="file://~/Documents/page.html">file://~/Documents/page.html</a></p></div>
    <div class="card"><b>Shortcuts</b><p><code>Ctrl+T</code> new tab · <code>Ctrl+W</code> close tab · <code>Ctrl+L</code> address bar · <code>Ctrl+H</code> history · <code>Ctrl+D</code> bookmark · <code>Ctrl+R</code>/<code>F5</code> reload · <code>Alt+←/→</code> back/forward</p><p><a href="about:history">History</a> · <a href="about:bookmarks">Bookmarks</a></p></div></div></body></html>`;
  }
  function listPage(title, items, empty) {
    return `<!doctype html><html><head>${pageBase('.it{display:flex;gap:10px;align-items:center;padding:9px 6px;border-bottom:1px solid var(--bd)}.it a{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.it small{color:var(--mut);flex:none}')}</head><body><div class="wrap"><h1>${title}</h1><div class="card">${items.length ? items.map((x) => `<div class="it"><a href="${esc(x.u)}">${esc(x.t)}</a><small>${esc(x.s || '')}</small></div>`).join('') : `<p class="mut">${empty}</p>`}</div></div></body></html>`;
  }
  async function searchPage(q) {
    const results = [], extras = []; let answer = '';
    try { const v = OS.calc(q.replace(/^=/, '')); if (typeof v === 'number' && isFinite(v) && /[\d)]\s*[-+*/^%]|\b(sqrt|sin|cos|log|pi)\b/.test(q)) answer = `<div class="card ans"><div class="mut">${esc(q)} =</div><div style="font-size:30px;font-weight:700">${esc(String(+v.toPrecision(12)))}</div></div>`; } catch (e) {}
    const jobs = [
      (async () => { const r = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=5&format=json&origin=*`); const j = await r.json(); (j.query?.search || []).forEach((s) => extras.push({ t: s.title + ' — Wikipedia', u: `https://en.m.wikipedia.org/wiki/${encodeURIComponent(s.title.replace(/ /g, '_'))}`, d: s.snippet.replace(/<[^>]+>/g, '') })); })(),
      (async () => { const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/ /g, '_'))}?redirect=true`); if (!r.ok) return; const j = await r.json(); if (j.type === 'standard' && j.extract && !answer) answer = `<div class="card ans">${j.thumbnail ? `<img src="${esc(j.thumbnail.source)}" style="float:right;max-width:110px;border-radius:10px;margin:0 0 8px 12px">` : ''}<b style="font-size:20px">${esc(j.title)}</b><div class="mut">${esc(j.description || '')}</div><p>${esc(j.extract)}</p><a href="${esc(j.content_urls?.mobile?.page || '')}">Read on Wikipedia →</a></div>`; })(),
      (async () => { const { text } = await fetchVia(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`); const d = new DOMParser().parseFromString(text, 'text/html'); d.querySelectorAll('.result').forEach((el) => { const a = el.querySelector('a.result__a'); if (!a || el.classList.contains('result--ad')) return; let u = a.getAttribute('href') || ''; const m = /[?&]uddg=([^&]+)/.exec(u); if (m) u = decodeURIComponent(m[1]); if (u.startsWith('//')) u = 'https:' + u; if (!/^https?:/.test(u)) return; results.push({ t: a.textContent.trim(), u, d: (el.querySelector('.result__snippet') || {}).textContent || '' }); }); })(),
    ];
    await Promise.allSettled(jobs.map((j) => Promise.race([j, new Promise((r) => setTimeout(r, 15000))])));
    const all = results.slice(0, 12).concat(extras.filter((e) => !results.some((r) => r.u.replace('en.m.', 'en.') === e.u.replace('en.m.', 'en.'))));
    const ext = [['Google', 'https://www.google.com/search?q='], ['DuckDuckGo', 'https://duckduckgo.com/?q='], ['Bing', 'https://www.bing.com/search?q=']];
    return `<!doctype html><html><head>${pageBase('.r{margin:18px 0}.r .h{font-size:12.5px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.r a.t{font-size:18px;font-weight:600;display:block}.r p{margin:3px 0 0;font-size:14px;color:var(--mut)}.top{display:flex;gap:10px 12px;align-items:center;margin-bottom:6px;flex-wrap:wrap}.top b{font-size:20px;white-space:nowrap}.top form{min-width:240px}.ans p{margin:8px 0}')}</head><body><div class="wrap"><div class="top"><b>☁️ Cirrus Search</b><form class="s" style="flex:1"><input name="q" value="${esc(q)}" autocomplete="off"><button>Go</button></form></div>
    ${answer}${all.length ? all.map((r) => `<div class="r"><div class="h">${esc(host(r.u))}</div><a class="t" href="${esc(r.u)}">${esc(r.t)}</a><p>${esc(r.d)}</p></div>`).join('') : `<div class="card"><b>No results could be fetched.</b><p class="mut">You may be offline, or the search relays are busy. Try again, or search externally:</p></div>`}
    <p class="mut" style="font-size:13px">Search elsewhere: ${ext.map(([n, u]) => `<a href="#" data-ext="${esc(u + encodeURIComponent(q))}">${n} ↗</a>`).join(' · ')}</p></div><script>document.querySelectorAll('[data-ext]').forEach(function(a){a.onclick=function(e){e.preventDefault();e.stopPropagation();parent.postMessage({cirrusExternal:a.getAttribute('data-ext')},'*')}})<\/script></body></html>`;
  }
  function readerPage(md, url) {
    let title = host(url); const tm = /^Title:\s*(.+)$/m.exec(md); if (tm) title = tm[1];
    const body = md.replace(/^(Title|URL Source|Published Time|Markdown Content|Warning):.*$/gm, '').replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, '%%IMG%%$2%%').trim();
    let html = OS.renderMarkdown(body).replace(/%%IMG%%(.+?)%%/g, (m, src) => `<img src="${esc(src)}" alt="">`).replace(/<a href="#" data-link="([^"]+)">/g, (m, u) => `<a href="${esc(new URL(u.replace(/&amp;/g, '&'), url).href)}">`);
    return { title, html: `<!doctype html><html><head><base href="${esc(url)}">${pageBase('.rd{max-width:720px;margin:0 auto;padding:22px 20px 60px;font-size:17px;line-height:1.7}.rd img{max-width:100%;border-radius:10px;height:auto}.rd h1{line-height:1.2}.rd pre{overflow:auto;background:rgba(127,127,127,.12);padding:10px;border-radius:8px}.rd table{border-collapse:collapse;display:block;overflow:auto}.rd td,.rd th{border:1px solid var(--bd);padding:4px 8px}.badge{font-size:12px;color:var(--mut);border:1px solid var(--bd);border-radius:999px;padding:3px 10px;display:inline-block;margin-bottom:10px}')}</head><body><article class="rd"><span class="badge">📖 Reader view · ${esc(host(url))}</span><h1>${esc(title)}</h1>${html}</article></body></html>` };
  }
  function errorPage(url, msg) {
    return `<!doctype html><html><head>${pageBase('.c{text-align:center;padding:60px 20px}.c button{margin:4px;padding:10px 16px;border-radius:10px;border:1px solid var(--bd);background:var(--card);color:var(--fg);font-size:14px;cursor:pointer}.c button.p{background:var(--a);color:#fff;border:0}')}</head><body><div class="c"><div style="font-size:54px">🌩️</div><h2>This page couldn’t be loaded</h2><p class="mut">${esc(host(url) || url)} · ${esc(msg)}</p><div><button class="p" onclick="parent.postMessage({cirrusRetry:'compat'},'*')">Try again</button><button onclick="parent.postMessage({cirrusRetry:'reader'},'*')">Reader view</button><button onclick="parent.postMessage({cirrusRetry:'direct'},'*')">Direct mode</button><button onclick="parent.postMessage({cirrusExternal:${esc(JSON.stringify(url))}},'*')">Open in real browser ↗</button></div></div></body></html>`;
  }

  OS.registerApp({
    id: 'browser', name: 'Browser', icon: 'globe', color: ['#4facfe', '#7b5cff'], cat: 'Internet', w: 1040, h: 700, desc: 'Browse the web', keywords: 'web internet firefox chrome search www',
    launch(win, args) {
      if (!OS.settings.bookmarks) { OS.settings.bookmarks = DEFAULT_BM; OS.saveSettings(); }
      const tabs = []; let active = null; const siteMode = OS.store.get('br-site-mode', {});
      win.body.innerHTML = `<div class="br-tabs"></div>
        <div class="toolbar br-tb"><button class="ibtn" data-a="back" title="Back (Alt+←)">${gl('left')}</button><button class="ibtn" data-a="fwd" title="Forward (Alt+→)">${gl('right')}</button><button class="ibtn" data-a="reload" title="Reload (F5)">${gl('refresh')}</button><button class="ibtn hide-m" data-a="home" title="Home">${gl('home')}</button>
        <form class="br-url"><button type="button" class="br-mode" data-a="mode" title="Display mode"></button><input spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="Search or enter address"><div class="br-sug" hidden></div></form>
        <button class="ibtn hide-m" data-a="star" title="Bookmark (Ctrl+D)">${gl('star')}</button><button class="ibtn" data-a="menu">${gl('dots')}</button></div>
        <div class="br-bm"></div><div class="br-view"><div class="br-progress"></div></div>`;
      const $ = (s) => win.body.querySelector(s); const view = $('.br-view'), urlIn = $('.br-url input'), prog = $('.br-progress'), sug = $('.br-sug');
      const renderBm = () => { const hostEl = $('.br-bm'); hostEl.innerHTML = ''; (OS.settings.bookmarks || []).forEach((b) => { const el = OS.el(`<button>${gl(b.i || 'globe')}${esc(b.t)}</button>`); el.onclick = () => nav(b.u); OS.onContext(el, (e, x, y) => OS.menu(x, y, [{ label: 'Open in new tab', icon: 'plus', action: () => newTab(b.u) }, { label: 'Rename', icon: 'edit', action: async () => { const n = await OS.prompt('Rename bookmark', '', b.t); if (n) { b.t = n; OS.set('bookmarks', OS.settings.bookmarks); renderBm(); } } }, { label: 'Remove bookmark', icon: 'trash', danger: true, action: () => { OS.set('bookmarks', OS.settings.bookmarks.filter((x) => x !== b)); renderBm(); updBar(); } }])); hostEl.appendChild(el); }); };
      const engine = () => OS.settings.searchEngine || 'cirrus';
      const toUrl = (q) => {
        q = (q || '').trim(); if (!q) return 'about:home';
        if (/^(about|file):/.test(q)) return q.startsWith('file://~') ? 'file://' + OS.home() + q.slice(8) : q;
        if (q.startsWith('~/') || q.startsWith('/')) return 'file://' + OS.fs.norm(q);
        if (/^https?:\/\//i.test(q)) return q;
        if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/.test(q) && !/\s/.test(q) && /\.[a-z]{2,}(:\d+)?(\/|$)/i.test(q)) return 'https://' + q;
        if (/^localhost(:\d+)?/.test(q)) return 'http://' + q;
        const e = engine();
        if (e === 'cirrus') return 'about:search?q=' + encodeURIComponent(q);
        return ({ wikipedia: 'https://en.m.wikipedia.org/w/index.php?search=', duckduckgo: 'https://html.duckduckgo.com/html/?q=', bing: 'https://www.bing.com/search?q=', google: 'https://www.google.com/search?igu=1&q=' }[e] || 'about:search?q=') + encodeURIComponent(q);
      };
      function makeFrame(t, kind) {
        if (t.frame && t.kind === kind) return t.frame;
        const f = document.createElement('iframe');
        // pages fetched through the relay get an opaque origin so they can never touch the desktop
        f.setAttribute('sandbox', kind === 'trusted' ? 'allow-scripts allow-forms allow-popups allow-same-origin allow-modals' : kind === 'remote' ? 'allow-scripts allow-forms allow-popups allow-same-origin allow-modals allow-popups-to-escape-sandbox allow-presentation' : 'allow-scripts allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox');
        f.setAttribute('allow', 'fullscreen; autoplay; encrypted-media; picture-in-picture; geolocation; clipboard-write');
        f.setAttribute('referrerpolicy', 'no-referrer'); f.setAttribute('allowfullscreen', '');
        f.onload = () => { prog.style.width = '100%'; setTimeout(() => (prog.style.opacity = 0), 300); try { const d = f.contentDocument; if (d && d.title && t.kind === 'trusted') { t.title = d.title; renderTabs(); } } catch (e) {} };
        if (t.frame) t.frame.replaceWith(f); else view.appendChild(f);
        f.style.display = t === active ? '' : 'none'; t.frame = f; t.kind = kind; return f;
      }
      function newTab(u, bg) {
        const t = { id: OS.uid(), hist: [], hi: -1, title: 'New Tab', frame: null, kind: null, mode: 'auto', shown: '' };
        tabs.push(t); if (!bg || !active) select(t); load(t, toUrl(u || OS.settings.homepage), true); if (bg) renderTabs();
        return t;
      }
      function select(t) { active = t; tabs.forEach((x) => x.frame && (x.frame.style.display = x === t ? '' : 'none')); renderTabs(); updBar(); }
      function closeTab(t) { const i = tabs.indexOf(t); t.frame && t.frame.remove(); tabs.splice(i, 1); if (!tabs.length) return win.close(); if (active === t) select(tabs[Math.max(0, i - 1)]); else renderTabs(); }
      function renderTabs() {
        const h = $('.br-tabs'); h.innerHTML = '';
        tabs.forEach((t) => { const fav = /^https?:/.test(t.url || '') ? `<img src="https://icons.duckduckgo.com/ip3/${esc(host(t.url))}.ico" alt="" onerror="this.replaceWith(document.createTextNode(''))">` : gl(t.url && t.url.startsWith('file:') ? 'file' : t.url && t.url.startsWith('about:search') ? 'search' : 'globe'); const el = OS.el(`<div class="br-tab ${t === active ? 'on' : ''}" title="${esc(t.title)}">${t.loading ? '<span class="br-spin"></span>' : fav}<span>${esc(t.title)}</span><button class="ibtn">${gl('x')}</button></div>`); el.onclick = () => select(t); el.querySelector('.ibtn').onclick = (e) => { e.stopPropagation(); closeTab(t); }; el.onauxclick = (e) => { if (e.button === 1) closeTab(t); }; h.appendChild(el); });
        const add = OS.el(`<button class="ibtn" title="New tab (Ctrl+T)">${gl('plus')}</button>`); add.onclick = () => newTab(); h.appendChild(add);
        if (active) win.setTitle(active.title + ' — Browser');
      }
      const modeOf = (t) => (t.mode !== 'auto' ? t.mode : siteMode[host(t.url)] || 'auto');
      function updBar() {
        if (!active) return; if (document.activeElement !== urlIn) urlIn.value = active.url && active.url !== 'about:home' ? (active.url.startsWith('about:search?q=') ? decodeURIComponent(active.url.slice(15)) : active.url) : '';
        $('[data-a=back]').disabled = active.hi <= 0; $('[data-a=fwd]').disabled = active.hi >= active.hist.length - 1;
        const web = /^https?:/.test(active.url || ''); const m = modeOf(active); const shown = active.shown || m;
        const mb = $('[data-a=mode]'); mb.hidden = !web; mb.innerHTML = `${gl(active.url?.startsWith('https') ? 'lock' : 'info')}<span>${esc(MODES[shown] ? MODES[shown][0] : 'Auto')}</span>`; mb.className = 'br-mode m-' + shown;
        const bm = (OS.settings.bookmarks || []).some((b) => b.u === active.url); $('[data-a=star]').classList.toggle('on', bm);
      }
      const setProg = (p) => { prog.style.opacity = 1; prog.style.width = p + '%'; };
      async function load(t, url, push) {
        if (push) { t.hist = t.hist.slice(0, t.hi + 1); t.hist.push(url); t.hi = t.hist.length - 1; }
        t.url = url; t.shown = ''; t.loading = true; const token = (t.token = Math.random()); setProg(20); renderTabs(); updBar();
        const done = (title) => { if (t.token !== token) return; t.loading = false; if (title) t.title = title; setProg(100); setTimeout(() => (prog.style.opacity = 0), 300); renderTabs(); updBar(); histAdd(t.url, t.title); };
        const srcdoc = (kind, html, title) => { if (t.token !== token) return; const f = makeFrame(t, kind); f.removeAttribute('src'); f.srcdoc = html; done(title); };
        if (url === 'about:home' || url === 'about:newtab') return srcdoc('trusted', homePage(), 'New Tab');
        if (url === 'about:help') return srcdoc('trusted', helpPage(), 'Browser Help');
        if (url === 'about:history') return srcdoc('trusted', listPage('History', histGet().map((h) => ({ t: h.t, u: h.u, s: new Date(h.at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) })), 'No history yet.'), 'History');
        if (url === 'about:bookmarks') return srcdoc('trusted', listPage('Bookmarks', (OS.settings.bookmarks || []).map((b) => ({ t: b.t, u: b.u, s: host(b.u) })), 'No bookmarks.'), 'Bookmarks');
        if (url === 'about:blank') return srcdoc('trusted', '<!doctype html><body></body>', 'Blank');
        if (url.startsWith('about:search')) { const q = decodeURIComponent((url.split('q=')[1] || '').replace(/\+/g, ' ')); t.title = q + ' — Search'; srcdoc('trusted', `<!doctype html><html><head>${pageBase()}</head><body><div class="wrap"><p class="mut">Searching for “${esc(q)}”…</p></div></body></html>`); t.loading = true; renderTabs(); const html = await searchPage(q); return srcdoc('trusted', html, q + ' — Search'); }
        if (url.startsWith('about:')) return srcdoc('trusted', listPage('Page not found', [{ t: 'Home', u: 'about:home' }, { t: 'Help', u: 'about:help' }, { t: 'History', u: 'about:history' }], ''), 'Not found');
        if (url.startsWith('file://')) {
          const p = decodeURIComponent(url.slice(7));
          try { const c = OS.fs.read(p); const ty = OS.ftype(p); const html = ty === 'html' ? c : ty === 'image' || OS.isDataUrl(c) ? `<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#222"><${ty === 'pdf' ? 'embed type="application/pdf" style="width:100vw;height:100vh"' : 'img style="max-width:100%"'} src="${esc(OS.toDataUrl(c, p))}"></body>` : `<pre style="white-space:pre-wrap;font-family:monospace;padding:16px">${esc(c)}</pre>`; return srcdoc('sandbox', html, OS.fs.basename(p)); }
          catch (e) { return srcdoc('trusted', errorPage(url, 'File not found'), 'Not found'); }
        }
        if (!navigator.onLine) return srcdoc('trusted', `<!doctype html><html><head>${pageBase()}</head><body><div class="wrap" style="text-align:center;padding-top:80px"><div style="font-size:48px">⚡</div><h2>No internet</h2><p class="mut">Check your connection and try again.</p></div></body></html>`, 'No internet');
        const real = rewrite(url); let mode = modeOf(t); if (real !== url) { t.url = url = real; mode = 'direct'; }
        t.title = host(url);
        const direct = () => { const f = makeFrame(t, 'remote'); f.removeAttribute('srcdoc'); f.src = url; t.shown = 'direct'; setTimeout(() => done(t.title), 1200); };
        if (MEDIA.test(url)) { const ext = OS.ext(url.split('?')[0]); const tag = /mp4|webm|ogv|mov/.test(ext) ? `<video src="${esc(url)}" controls autoplay style="max-width:100%;max-height:100vh"></video>` : /mp3|ogg|wav|flac|m4a/.test(ext) ? `<audio src="${esc(url)}" controls autoplay></audio>` : ext === 'pdf' ? `<iframe src="${esc(url)}" style="border:0;width:100vw;height:100vh"></iframe>` : `<img src="${esc(url)}" style="max-width:100%;max-height:100vh">`; return srcdoc('sandbox', `<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#111">${tag}</body>`, url.split('/').pop()); }
        if (mode === 'direct' || (mode === 'auto' && FRAMEABLE.test(host(url)))) return direct();
        const reader = async () => { setProg(70); const ctl = new AbortController(); setTimeout(() => ctl.abort(), 20000); const r = await fetch('https://r.jina.ai/' + url, { signal: ctl.signal, headers: { 'X-Return-Format': 'markdown' } }); if (!r.ok) throw new Error('reader HTTP ' + r.status); const md = await r.text(); const p = readerPage(md, url); t.shown = 'reader'; srcdoc('sandbox', p.html, p.title); };
        if (mode === 'reader') { try { await reader(); } catch (e) { srcdoc('trusted', errorPage(url, e.message), 'Error'); } return; }
        // compatible (and auto for everything else)
        try {
          setProg(45); const { text, ct } = await fetchVia(url);
          if (t.token !== token) return;
          if (ct && !/html|xml|text\/plain/.test(ct) && !/^\s*</.test(text)) throw new Error('not a web page');
          const isHtml = /<(html|head|body|div|p)\b/i.test(text.slice(0, 5000));
          const title = isHtml ? ((/<title[^>]*>([^<]*)<\/title>/i.exec(text) || [])[1] || host(url)).replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').trim() : host(url);
          // heavy JS apps render nothing without their scripts: fall back to reader in auto mode
          const visible = text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          if (mode === 'auto' && isHtml && visible.length < 200) { try { return await reader(); } catch (e) {} }
          t.shown = 'compat'; srcdoc('sandbox', isHtml ? prepare(text, url) : `<pre style="white-space:pre-wrap;font-family:monospace;padding:16px">${esc(text)}</pre>`, title);
        } catch (e) {
          if (t.token !== token) return;
          if (mode === 'auto') { try { return await reader(); } catch (e2) {} }
          srcdoc('trusted', errorPage(url, e.message), 'Problem loading page');
        }
      }
      const nav = (q, nt) => (nt ? newTab(q, true) : load(active, toUrl(q), true));
      const onMsg = (e) => {
        const t = tabs.find((x) => x.frame && x.frame.contentWindow === e.source); if (!t || !e.data) return;
        if (typeof e.data.cirrusNav === 'string') { const u = e.data.cirrusNav; if (e.data.newTab) newTab(u, true); else { select(t); nav(u); } }
        if (typeof e.data.cirrusTitle === 'string' && e.data.cirrusTitle.trim()) { t.title = e.data.cirrusTitle.trim().slice(0, 120); renderTabs(); }
        if (typeof e.data.cirrusExternal === 'string' && /^https?:/.test(e.data.cirrusExternal)) window.open(e.data.cirrusExternal, '_blank', 'noopener');
        if (typeof e.data.cirrusRetry === 'string' && MODES[e.data.cirrusRetry]) { t.mode = e.data.cirrusRetry; load(t, t.url); }
      };
      window.addEventListener('message', onMsg); win.onClose(() => window.removeEventListener('message', onMsg));
      /* address bar with suggestions */
      let sugI = -1, sugItems = [];
      const showSug = () => {
        const q = urlIn.value.trim().toLowerCase(); if (!q) { sug.hidden = true; return; }
        const pool = [...(OS.settings.bookmarks || []).map((b) => ({ t: b.t, u: b.u, i: 'star' })), ...histGet().map((h) => ({ t: h.t, u: h.u, i: 'clock' })), ...TILES.map(([t2, u]) => ({ t: t2, u, i: 'globe' }))];
        const seen = new Set(); sugItems = [{ t: `Search “${urlIn.value.trim()}”`, u: urlIn.value.trim(), i: 'search' }].concat(pool.filter((x) => (x.t.toLowerCase().includes(q) || x.u.toLowerCase().includes(q)) && !seen.has(x.u) && seen.add(x.u)).slice(0, 7));
        sugI = -1; sug.innerHTML = sugItems.map((x, i) => `<div data-i="${i}">${gl(x.i)}<span>${esc(x.t)}</span>${x.i !== 'search' ? `<small>${esc(host(x.u) || x.u)}</small>` : ''}</div>`).join(''); sug.hidden = false;
        sug.querySelectorAll('[data-i]').forEach((d) => (d.onpointerdown = (e) => { e.preventDefault(); const it = sugItems[+d.dataset.i]; sug.hidden = true; nav(it.u); urlIn.blur(); }));
      };
      urlIn.oninput = showSug; urlIn.onblur = () => setTimeout(() => (sug.hidden = true), 150);
      urlIn.onkeydown = (e) => { if (sug.hidden || !sugItems.length) return; if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sugI = (sugI + (e.key === 'ArrowDown' ? 1 : -1) + sugItems.length) % sugItems.length; sug.querySelectorAll('[data-i]').forEach((d, i) => d.classList.toggle('on', i === sugI)); } else if (e.key === 'Escape') sug.hidden = true; };
      $('.br-url').onsubmit = (e) => { e.preventDefault(); const it = sugI >= 0 && !sug.hidden ? sugItems[sugI].u : urlIn.value; sug.hidden = true; nav(it); urlIn.blur(); };
      urlIn.onfocus = () => setTimeout(() => urlIn.select(), 0);
      const back = () => { if (active.hi > 0) load(active, active.hist[--active.hi]); }, fwd = () => { if (active.hi < active.hist.length - 1) load(active, active.hist[++active.hi]); };
      $('[data-a=back]').onclick = back; $('[data-a=fwd]').onclick = fwd;
      $('[data-a=reload]').onclick = () => load(active, active.url);
      $('[data-a=home]').onclick = () => nav(OS.settings.homepage);
      $('[data-a=mode]').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); const h = host(active.url); OS.menu(r.left, r.bottom + 4, [
        ...Object.entries(MODES).map(([k, [label, icon]]) => ({ label: `${label}${k === 'auto' ? ' (recommended)' : ''}${modeOf(active) === k ? '  ✓' : ''}`, icon, action: () => { active.mode = k; load(active, active.url); } })),
        '-', { label: siteMode[h] ? `Forget mode for ${h}` : `Always use current mode for ${h}`, icon: 'pin', action: () => { if (siteMode[h]) delete siteMode[h]; else siteMode[h] = active.shown || modeOf(active); OS.store.set('br-site-mode', siteMode); updBar(); } },
        { label: 'Open in real browser', icon: 'external', action: () => window.open(active.url, '_blank', 'noopener') },
      ]); };
      const bookmark = async () => {
        const bms = OS.settings.bookmarks || []; const ex = bms.find((b) => b.u === active.url);
        if (ex) OS.set('bookmarks', bms.filter((b) => b !== ex)); else { const n = await OS.prompt('Add bookmark', 'Name:', active.title); if (n) OS.set('bookmarks', [...bms, { t: n, u: active.url, i: 'star' }]); }
        renderBm(); updBar();
      };
      $('[data-a=star]').onclick = bookmark;
      $('[data-a=menu]').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left - 220, r.bottom + 4, [
        { label: 'New tab', icon: 'plus', key: 'Ctrl+T', action: () => newTab() },
        { label: (OS.settings.bookmarks || []).some((b) => b.u === active.url) ? 'Remove bookmark' : 'Bookmark this page', icon: 'star', key: 'Ctrl+D', action: bookmark },
        { label: 'History', icon: 'clock', key: 'Ctrl+H', action: () => newTab('about:history') }, { label: 'Bookmarks', icon: 'star', action: () => newTab('about:bookmarks') },
        '-', { label: 'Reader view', icon: 'book', disabled: !/^https?:/.test(active.url), action: () => { active.mode = 'reader'; load(active, active.url); } },
        { label: 'Open in real browser', icon: 'external', disabled: !/^https?:/.test(active.url), action: () => window.open(active.url, '_blank', 'noopener') },
        { label: 'Copy link', icon: 'copy', action: () => navigator.clipboard?.writeText(active.url) },
        { label: 'Open local file…', icon: 'folder', action: async () => { const p = await OS.pickFile({ mode: 'open', path: OS.home() + '/Documents' }); if (p) nav('file://' + p); } },
        { label: 'Save page to Downloads', icon: 'download', disabled: !/^https?:/.test(active.url), action: async () => { try { const { text } = await fetchVia(active.url); const p = OS.fs.uniqueName(OS.home() + '/Downloads', (active.title || 'page').replace(/[\/\\:*?"<>|]/g, '-').slice(0, 60) + '.html'); OS.fs.write(p, text); OS.notify('Page saved', OS.fs.pretty(p), { app: 'browser', onclick: () => OS.desktop.openPath(p) }); } catch (err) { OS.notify('Save failed', err.message, { app: 'browser' }); } } },
        '-', { label: 'Clear history', icon: 'trash', action: () => { OS.store.set('br-history', []); OS.notify('History cleared', '', { app: 'browser' }); } },
        { label: 'Search engine: ' + engine(), icon: 'search', action: () => OS.wm.open('settings', { page: 'apps' }) },
        { label: 'Help', icon: 'info', action: () => newTab('about:help') },
      ]); };
      OS.wm.keys(win, (e) => {
        const c = e.ctrlKey || e.metaKey; const k = e.key.toLowerCase();
        if (c && k === 't') { e.preventDefault(); newTab(); } else if (c && k === 'w') { e.preventDefault(); closeTab(active); } else if (c && k === 'l') { e.preventDefault(); urlIn.focus(); } else if (e.key === 'F5' || (c && k === 'r')) { e.preventDefault(); load(active, active.url); }
        else if (c && k === 'd') { e.preventDefault(); bookmark(); } else if (c && k === 'h') { e.preventDefault(); newTab('about:history'); } else if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); back(); } else if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); fwd(); }
        else if (c && e.key === 'Tab') { e.preventDefault(); const i = tabs.indexOf(active); select(tabs[(i + (e.shiftKey ? -1 : 1) + tabs.length) % tabs.length]); }
      });
      win.onArgs = (a) => newTab(a.url || (a.path && 'file://' + a.path));
      renderBm(); newTab(args.url || (args.path ? 'file://' + args.path : undefined));
    },
  });
  if (!OS.store.get('br-v2')) { OS.store.set('br-v2', 1); OS.settings.searchEngine = 'cirrus'; OS.saveSettings(); }
  OS.browser = { rewrite, fetchVia, FRAMEABLE };
})();
