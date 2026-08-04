#!/usr/bin/env python3
"""Build index.html for The Information Superhighway Gazette.

Design goal: keep the per-run work TINY and reliable. The heavy, unchanging
page (all the CSS, the 90s chrome, the mobile layout) lives here as a template.
Each day the routine only has to produce a small `content.json`; this script
renders it into a single self-contained index.html.

The Archive (archive.html) holds every past FRONT-PAGE article. It is built to
scale to thousands of entries without ever bogging the browser down:

    [ N articles in archive.json ]           <- lightweight JSON, fetched once
              |
              v  virtual scroll / DOM recycling
    [ only ~15 cards ever exist in the DOM ]  <- fixed row height windowing
              |
              v
    [ smooth 60fps scroll on any phone ]

Usage:
    python3 blog/build.py            # build index.html + archive.html (+ data)
    python3 blog/build.py --archive  # move the CURRENT content.json's top
                                     # article into archive.json (do this BEFORE
                                     # overwriting content.json with a new issue)
    python3 blog/build.py --check    # print index.html to stdout, write nothing
"""
import json, sys, html, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT = ROOT / "blog" / "content.json"
OUT = ROOT / "index.html"
# Archive: source of truth lives in blog/, served copies land at the repo root
# next to archive.html so the page can fetch them.
ARCHIVE_SRC = ROOT / "blog" / "archive.json"
ARCHIVE_JSON = ROOT / "archive.json"       # fetched by archive.html
ARCHIVE_JS = ROOT / "archive-data.js"      # file:// fallback (sets window.ARCHIVE)
ARCHIVE_HTML = ROOT / "archive.html"

def esc(s):
    return html.escape(str(s), quote=False)

def load_archive():
    if ARCHIVE_SRC.exists():
        try:
            return json.loads(ARCHIVE_SRC.read_text(encoding="utf-8"))
        except Exception:
            return []
    return []

def archive_prev():
    """Prepend the current issue's TOP article to the archive (newest first).
    Idempotent: an issue already present is not added twice. Run this while
    content.json still holds the PREVIOUS issue (i.e. right after git reset,
    before writing the new day's content)."""
    content = json.loads(CONTENT.read_text(encoding="utf-8"))
    if not content.get("articles"):
        return
    issue = content.get("issue")
    arch = load_archive()
    if any(e.get("issue") == issue for e in arch):
        print(f"archive: issue {issue} already present — skipping")
        return
    entry = {
        "issue": issue,
        "date_short": content.get("date_short", ""),
        "date_human": content.get("date_human", ""),
        "article": content["articles"][0],
    }
    arch.insert(0, entry)
    ARCHIVE_SRC.write_text(json.dumps(arch, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"archive: added issue {issue} top article — {len(arch)} on file")

def render_articles(articles):
    out = []
    for a in articles:
        badge_cls = "badge blink" if a.get("blink") else "badge"
        paras = "\n        ".join(f"<p>{p}</p>" for p in a["paras"])
        # first paragraph gets the yellow lead-in tag if provided
        tag = a.get("tag")
        if tag and a["paras"]:
            first = f'<p><span class="tag">{esc(tag)}</span> {a["paras"][0]}</p>'
            rest = "\n        ".join(f"<p>{p}</p>" for p in a["paras"][1:])
            paras = first + ("\n        " + rest if rest else "")
        out.append(f'''      <div class="article">
        <span class="{badge_cls}">{esc(a.get("badge","NEW!"))}</span>
        <h2>{esc(a["title"])}</h2>
        <div class="dateline">{esc(a.get("dateline",""))}</div>
        {paras}
      </div>''')
    return "\n\n".join(out)

def render_ticker(items):
    return " &bull; ".join(esc(i) for i in items)

def render_horoscopes(hs):
    parts = []
    for h in hs:
        parts.append(f'<b>{esc(h["sign"])}</b> {esc(h["text"])}')
    return "<br><br>\n          ".join(parts)

def render_classifieds(items):
    return " &nbsp;•&nbsp;\n      ".join(
        f'<b>{esc(i["label"])}</b> {esc(i["text"])}' for i in items
    )

def build(content):
    tokens = {
        "{{ISSUE}}": esc(content.get("issue", "?")),
        "{{DATE_SHORT}}": esc(content.get("date_short", "")),
        "{{DATE_HUMAN}}": esc(content.get("date_human", "")),
        "{{CONSTRUCTION_TOP}}": esc(content.get("construction_top",
            "pardon our HTML — the webmaster is on a smoke break")),
        "{{TICKER}}": render_ticker(content["ticker"]),
        "{{ARTICLES}}": render_articles(content["articles"]),
        "{{HOROSCOPES}}": render_horoscopes(content["horoscopes"]),
        "{{TECH_TIP}}": esc(content["tech_tip"]),
        "{{GADGET}}": esc(content["gadget_watch"]),
        "{{CLASSIFIEDS}}": render_classifieds(content["classifieds"]),
        "{{ARCHIVE_COUNT}}": esc(len(load_archive())),
    }
    page = TEMPLATE
    for k, v in tokens.items():
        page = page.replace(k, v)
    return page

TEMPLATE = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Information Superhighway Gazette :: Your #1 Cyber-Zine!!!</title>
<!-- ============================================================= -->
<!-- WEEKLY-REFRESH: Generated by blog/build.py from blog/content.json -->
<!-- Single self-contained mobile-friendly file (no CDNs / no assets). -->
<!-- ============================================================= -->
<style>
  :root{
    --neon1:#ff00ff; --neon2:#00ffff; --neon3:#ffff00; --neon4:#00ff00;
    --hot:#ff2d95; --link:#0000ee; --vlink:#551a8b;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;overflow-x:hidden;}
  body{
    font-family:"Comic Sans MS","Chalkboard SE",Verdana,Geneva,sans-serif;
    color:#00ff66;
    background-color:#000033;
    background-image:
      radial-gradient(1px 1px at 20% 30%, #fff, transparent),
      radial-gradient(1px 1px at 70% 60%, #fff, transparent),
      radial-gradient(1px 1px at 40% 80%, #9df, transparent),
      radial-gradient(2px 2px at 85% 15%, #fff, transparent),
      radial-gradient(1px 1px at 10% 70%, #ff9, transparent),
      radial-gradient(1px 1px at 55% 25%, #fff, transparent),
      radial-gradient(1px 1px at 90% 90%, #9ff, transparent);
    background-size:300px 300px;
    line-height:1.5;
    word-wrap:break-word;
  }
  .wrap{max-width:900px;margin:0 auto;padding:8px;}
  .masthead{text-align:center;margin:6px 0;}
  .masthead h1{
    font-family:"Impact","Arial Black",sans-serif;
    font-size:clamp(1.6rem,7vw,3.4rem);
    margin:0;line-height:1.05;letter-spacing:1px;
    background:linear-gradient(90deg,#ff0000,#ff9900,#ffff00,#33ff00,#00ffff,#3300ff,#ff00ff);
    -webkit-background-clip:text;background-clip:text;
    -webkit-text-fill-color:transparent;color:#ff00ff;
    text-shadow:2px 2px 0 rgba(0,0,0,.4);transform:skewX(-6deg);
  }
  .masthead .sub{color:var(--neon3);font-weight:bold;font-size:clamp(.7rem,3vw,1rem);text-shadow:1px 1px 0 #000;}
  @keyframes blink{50%{opacity:0;}}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes slide{from{transform:translateX(0);}to{transform:translateX(-100%);}}
  .blink{animation:blink 1s steps(1) infinite;}
  .spin{display:inline-block;animation:spin 3s linear infinite;}
  .badge{display:inline-block;background:var(--hot);color:#fff;font-weight:bold;padding:1px 6px;border:2px outset #fff;border-radius:3px;font-size:.7rem;transform:rotate(-6deg);}
  .ticker{background:#000;border:3px ridge var(--neon2);overflow:hidden;white-space:nowrap;margin:8px 0;padding:4px 0;}
  .ticker span{display:inline-block;color:var(--neon3);font-weight:bold;padding-left:100%;animation:slide 55s linear infinite;animation-delay:5s;}
  hr.rainbow{height:6px;border:0;margin:14px 0;background:linear-gradient(90deg,#ff0000,#ff9900,#ffff00,#33ff00,#00ffff,#3300ff,#ff00ff);}
  .cols{display:flex;flex-wrap:wrap;gap:10px;}
  .main{flex:3 1 320px;min-width:0;}
  .side{flex:1 1 200px;min-width:0;}
  .article{background:rgba(0,0,40,.85);border:3px double var(--neon1);padding:10px;margin-bottom:14px;}
  .article h2{margin:0 0 4px;color:var(--neon2);font-size:clamp(1.1rem,4.5vw,1.6rem);text-shadow:1px 1px 0 #000, 0 0 6px var(--neon2);}
  .article .dateline{color:#ff9;font-size:.72rem;font-style:italic;margin-bottom:6px;}
  .article p{color:#d9ffe6;margin:.5em 0;}
  .article .tag{color:var(--neon3);font-weight:bold;}
  .box{background:rgba(20,0,40,.85);border:3px ridge var(--neon3);padding:8px;margin-bottom:14px;text-align:center;}
  .box h3{margin:.2em 0;color:var(--neon1);text-shadow:1px 1px 0 #000;}
  .counter{display:inline-block;background:#000;color:#0f0;font-family:"Courier New",monospace;font-weight:bold;padding:2px 6px;border:2px inset #0f0;letter-spacing:3px;font-size:1.1rem;}
  .construction{background:repeating-linear-gradient(45deg,#000 0 12px,#ffcc00 12px 24px);color:#fff;font-weight:bold;text-align:center;padding:4px;border:2px solid #000;margin:8px 0;font-size:.8rem;text-shadow:1px 1px 2px #000, 0 0 3px #000, 0 0 3px #000;}
  .construction span{background:#ffcc00;padding:0 4px;color:#000;text-shadow:none;}
  a{color:var(--link);}a:visited{color:var(--vlink);}
  .webring a{color:var(--neon2);font-weight:bold;text-decoration:none;}
  .guestbook textarea{width:100%;height:52px;font-family:monospace;}
  .guestbook button{font-family:inherit;font-weight:bold;background:silver;border:2px outset #fff;padding:3px 10px;cursor:pointer;}
  footer{text-align:center;color:#9df;font-size:.72rem;margin:16px 0;}
  .best-viewed{color:var(--neon4);font-weight:bold;}
  table{max-width:100%;}
  @media (max-width:520px){.article{border-width:2px;}.masthead h1{transform:none;}}
  @media (prefers-reduced-motion:reduce){.blink,.spin,.ticker span{animation:none !important;}.blink{opacity:1;}}
</style>
</head>
<body>
<div class="wrap">

  <div class="construction"><span>🚧 UNDER CONSTRUCTION 🚧</span> {{CONSTRUCTION_TOP}} <span>🚧</span></div>

  <div class="masthead">
    <h1>The Information Superhighway Gazette</h1>
    <div class="sub">✨ Your #1 CYBER-ZINE for Real News, Fake Takes &amp; 100% Free RAM ✨</div>
    <div class="sub" style="color:#0ff">📅 VOL. XCVI · ISSUE {{ISSUE}} · WEEK OF {{DATE_SHORT}}, 1996 2026</div>
  </div>

  <div class="ticker"><span>🔴 BREAKING &bull; {{TICKER}} &bull; scroll on, cyber-traveler 🔴</span></div>

  <div class="cols">
    <div class="main">

{{ARTICLES}}

    </div>

    <div class="side">
      <div class="box">
        <h3>👁️ VISITOR COUNT</h3>
        <span class="counter" id="hit">0000000</span>
        <div style="font-size:.7rem;color:#9df">you are visitor #<span id="hit2">0</span>!<br>tell your friends. tell your modem.</div>
      </div>
      <div class="box">
        <h3>🗞️ THE ARCHIVES</h3>
        <div style="font-size:.8rem;color:#dfffe6">Every past FRONT-PAGE scoop, newest first — <b>{{ARCHIVE_COUNT}}</b> back issues on file.</div>
        <p style="margin:.5em 0 .2em"><a href="./archive.html" style="color:var(--neon2);font-weight:bold;text-decoration:none;">📚 ENTER THE ARCHIVE &raquo;</a></p>
      </div>
      <div class="box">
        <h3>🔮 CYBER-HOROSCOPE</h3>
        <p style="font-size:.8rem;text-align:left;color:#ffd">
          {{HOROSCOPES}}
        </p>
      </div>
      <div class="box">
        <h3>💡 TECH TIP O' THE WEEK</h3>
        <p style="font-size:.82rem;color:#dfffe6">{{TECH_TIP}}</p>
      </div>
      <div class="box">
        <h3>📱 GADGET WATCH</h3>
        <p style="font-size:.82rem;color:#dfffe6">{{GADGET}}</p>
      </div>
      <div class="box webring">
        <h3>🌐 WEBRING</h3>
        <p style="font-size:.85rem">
          <a href="#" onclick="alert('You reached the edge of the webring! There is nothing out here but a 404 and the cold void of 1996.');return false;">&laquo; PREV</a> &nbsp;•&nbsp;
          <a href="#" onclick="alert('RANDOM site rolled... you got THIS site. What are the odds! (100%)');return false;">RANDOM</a> &nbsp;•&nbsp;
          <a href="#" onclick="alert('The NEXT site in the ring is under construction. So is this one. So is the whole internet, honestly.');return false;">NEXT &raquo;</a>
        </p>
        <p style="font-size:.7rem;color:#9df">member of the<br>UNDERGROUND CYBER-ZINE ring</p>
      </div>
    </div>
  </div>

  <hr class="rainbow">

  <div class="article">
    <h2>📰 CLASSIFIEDS &amp; PERSONALS</h2>
    <p style="font-size:.85rem;color:#dfffe6">
      {{CLASSIFIEDS}}
    </p>
  </div>

  <div class="construction"><span>🚧</span> this site is 100% powered by dial-up and spite <span class="spin">💾</span> <span>🚧</span></div>

  <div class="box guestbook">
    <h3>✍️ SIGN MY GUESTBOOK</h3>
    <textarea placeholder="be nice or be a robot, both welcome..."></textarea><br>
    <button type="button" onclick="alert('Thanks for signing!!! (this guestbook is powered by imagination and stores nothing)')">SUBMIT TO THE VOID</button>
  </div>

  <footer>
    <p class="best-viewed">Best viewed in Netscape Navigator 3.0 at 800×600 on a beige tower that could double as a space heater</p>
    <p>📅 <b>Last updated:</b> <span id="lastup">{{DATE_HUMAN}}</span> · refreshed every weekday by a robot who read the news so you don't have to</p>
    <p style="color:#ff9">⚠️ SATIRE — This is a parody. Headlines riff on real 2026 tech news; the jokes are ours, the reality is theirs. No electrons were harmed.</p>
    <p><span class="spin">🌐</span> © 1996–2026 The Information Superhighway Gazette · a Claude Code joint · <span class="blink">📧</span> webmaster@geocities.example</p>
  </footer>

</div>

<script>
  (function(){
    var base = 1337042, n;
    try{
      n = parseInt(localStorage.getItem('ishg_hits')||'0',10);
      n = n ? n + Math.floor(Math.random()*7)+1 : base + Math.floor(Math.random()*500);
      localStorage.setItem('ishg_hits', n);
    }catch(e){ n = base; }
    var s = String(n).padStart(7,'0');
    var el = document.getElementById('hit'); if(el) el.textContent = s;
    var el2 = document.getElementById('hit2'); if(el2) el2.textContent = n.toLocaleString();
  })();
</script>
</body>
</html>
'''

ARCHIVE_TEMPLATE = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Archives :: The Information Superhighway Gazette</title>
<!-- =================================================================== -->
<!-- Virtual-scrolled archive of every past front page.                  -->
<!-- Data is fetched once as lightweight JSON (archive.json); only the    -->
<!-- ~15 cards visible on screen ever exist in the DOM (fixed-height      -->
<!-- windowing + node recycling), so this stays smooth at thousands of    -->
<!-- entries. Generated by blog/build.py — do not hand-edit.              -->
<!-- =================================================================== -->
<style>
  :root{--neon1:#ff00ff;--neon2:#00ffff;--neon3:#ffff00;--neon4:#00ff00;--hot:#ff2d95;}
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;overflow-x:hidden;height:100%;}
  body{
    font-family:"Comic Sans MS","Chalkboard SE",Verdana,Geneva,sans-serif;
    color:#00ff66;background-color:#000033;
    background-image:
      radial-gradient(1px 1px at 20% 30%,#fff,transparent),
      radial-gradient(1px 1px at 70% 60%,#fff,transparent),
      radial-gradient(1px 1px at 40% 80%,#9df,transparent),
      radial-gradient(2px 2px at 85% 15%,#fff,transparent),
      radial-gradient(1px 1px at 55% 25%,#fff,transparent),
      radial-gradient(1px 1px at 90% 90%,#9ff,transparent);
    background-size:300px 300px;line-height:1.4;
  }
  .wrap{max-width:900px;margin:0 auto;padding:8px;}
  .masthead{text-align:center;margin:6px 0 2px;}
  .masthead h1{
    font-family:"Impact","Arial Black",sans-serif;font-size:clamp(1.4rem,6vw,2.8rem);
    margin:0;letter-spacing:1px;
    background:linear-gradient(90deg,#ff0000,#ff9900,#ffff00,#33ff00,#00ffff,#3300ff,#ff00ff);
    -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#ff00ff;
    text-shadow:2px 2px 0 rgba(0,0,0,.4);transform:skewX(-6deg);
  }
  .masthead .sub{color:var(--neon3);font-weight:bold;font-size:clamp(.7rem,3vw,1rem);text-shadow:1px 1px 0 #000;}
  .bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin:8px 0;}
  .bar a{color:var(--neon2);font-weight:bold;text-decoration:none;background:rgba(20,0,40,.85);
    border:2px outset var(--neon3);padding:4px 10px;}
  .count{color:#9df;font-size:.8rem;}
  hr.rainbow{height:6px;border:0;margin:8px 0;background:linear-gradient(90deg,#ff0000,#ff9900,#ffff00,#33ff00,#00ffff,#3300ff,#ff00ff);}
  #vp{position:relative;height:76vh;min-height:340px;overflow-y:auto;overflow-x:hidden;
    border:3px ridge var(--neon2);background:rgba(0,0,20,.5);}
  #sizer{position:relative;width:100%;}
  .acard{position:absolute;left:0;right:0;height:150px;overflow:hidden;
    background:rgba(0,0,40,.9);border:3px double var(--neon1);padding:8px 10px;}
  .acard .ah{color:var(--neon3);font-size:.72rem;font-weight:bold;}
  .acard .at{color:var(--neon2);font-weight:bold;font-size:clamp(.95rem,3.6vw,1.15rem);margin:2px 0 4px;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 0 5px var(--neon2);}
  .acard .ax{color:#d9ffe6;font-size:.8rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .acard .badge{display:inline-block;background:var(--hot);color:#fff;font-weight:bold;padding:0 5px;
    border:2px outset #fff;border-radius:3px;font-size:.62rem;transform:rotate(-5deg);margin-right:4px;}
  .acard .tag{color:var(--neon3);font-weight:bold;}
  #msg{color:#ff9;text-align:center;padding:20px;}
  footer{text-align:center;color:#9df;font-size:.72rem;margin:12px 0;}
  @media (max-width:520px){.acard{height:168px;}}
</style>
</head>
<body>
<div class="wrap">
  <div class="masthead">
    <h1>The Archives</h1>
    <div class="sub">🗄️ Every FRONT-PAGE scoop we ever ran, newest first 🗄️</div>
  </div>
  <div class="bar">
    <a href="./index.html">&laquo; BACK TO TODAY'S FRONT PAGE</a>
    <span class="count" id="count">loading the vault…</span>
  </div>
  <hr class="rainbow">
  <div id="vp"><div id="sizer"></div><div id="msg" style="display:none"></div></div>
  <footer>📼 Powered by pure vanilla JavaScript, virtual scrolling &amp; nostalgia · a Claude Code joint</footer>
</div>
<script>
(function(){
  // ---- fixed-height virtual scroller with DOM recycling -----------------
  // Row STRIDE must match .acard height (+gap). Only visible cards exist.
  var wide = window.matchMedia("(max-width:520px)").matches;
  var STRIDE = wide ? 180 : 162;   // px per row (card height + gap)
  var BUFFER = 4;                  // extra rows above/below the viewport
  var vp = document.getElementById('vp');
  var sizer = document.getElementById('sizer');
  var msg = document.getElementById('msg');
  var countEl = document.getElementById('count');
  var data = [];
  var pool = [];                  // recycled card nodes
  var ticking = false;

  function esc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  function makeCard(){
    var d = document.createElement('div');
    d.className = 'acard';
    d.style.transform = 'translateY(-9999px)';
    d._idx = -1;
    sizer.appendChild(d);
    return d;
  }

  function fill(el, item, idx){
    if(el._idx === idx) return;   // already showing this row — skip re-render
    el._idx = idx;
    var a = item.article || {};
    var first = (a.paras && a.paras[0]) ? a.paras[0] : '';
    el.innerHTML =
      '<div class="ah"><span class="badge">'+esc(a.badge||'NEWS')+'</span>ISSUE #'+esc(item.issue)+' · '+esc(item.date_short||item.date_human||'')+'</div>'+
      '<div class="at">'+esc(a.title||'')+'</div>'+
      '<div class="ax"><span class="tag">'+esc(a.tag||'')+'</span> '+esc(first)+'</div>';
  }

  function render(){
    ticking = false;
    var scrollTop = vp.scrollTop;
    var vpH = vp.clientHeight;
    var start = Math.max(0, Math.floor(scrollTop/STRIDE) - BUFFER);
    var count = Math.ceil(vpH/STRIDE) + BUFFER*2;
    var end = Math.min(data.length, start + count);
    var need = end - start;
    while(pool.length < need) pool.push(makeCard());
    for(var i=0;i<pool.length;i++){
      var el = pool[i];
      var idx = start + i;
      if(i < need && idx < data.length){
        fill(el, data[idx], idx);
        el.style.transform = 'translateY(' + (idx*STRIDE) + 'px)';
      } else {
        el._idx = -1;
        el.style.transform = 'translateY(-9999px)';
      }
    }
  }

  function onScroll(){
    if(!ticking){ ticking = true; requestAnimationFrame(render); }
  }

  function start(arr){
    data = Array.isArray(arr) ? arr : [];
    sizer.style.height = (data.length*STRIDE) + 'px';
    countEl.textContent = data.length.toLocaleString() + ' back issue' + (data.length===1?'':'s') + ' on file';
    if(!data.length){
      msg.style.display='block';
      msg.textContent = 'The vault is empty (for now). Check back after the next issue drops!';
      return;
    }
    vp.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', function(){
      var w = window.matchMedia("(max-width:520px)").matches;
      STRIDE = w ? 180 : 162;
      sizer.style.height = (data.length*STRIDE)+'px';
      render();
    });
    render();
  }

  function fail(){
    msg.style.display='block';
    msg.textContent = 'Could not load the archive. (When opened as a local file some browsers block data loading — view it on the live site.)';
    countEl.textContent = '';
  }

  // Primary: fetch the JSON. Fallback (file://): load archive-data.js which
  // sets window.ARCHIVE, so the page also works when opened directly.
  fetch('archive.json', {cache:'no-cache'})
    .then(function(r){ if(!r.ok) throw 0; return r.json(); })
    .then(start)
    .catch(function(){
      var s = document.createElement('script');
      s.src = 'archive-data.js';
      s.onload = function(){ start(window.ARCHIVE || []); };
      s.onerror = fail;
      document.head.appendChild(s);
    });
})();
</script>
</body>
</html>
'''

def write_archive_outputs():
    arch = load_archive()
    ARCHIVE_JSON.write_text(json.dumps(arch, ensure_ascii=False), encoding="utf-8")
    ARCHIVE_JS.write_text("window.ARCHIVE=" + json.dumps(arch, ensure_ascii=False) + ";", encoding="utf-8")
    ARCHIVE_HTML.write_text(ARCHIVE_TEMPLATE, encoding="utf-8")
    return len(arch)

def main():
    if "--archive" in sys.argv:
        archive_prev()
        return
    content = json.loads(CONTENT.read_text(encoding="utf-8"))
    page = build(content)
    if "--check" in sys.argv:
        sys.stdout.write(page)
        return
    OUT.write_text(page, encoding="utf-8")
    n = write_archive_outputs()
    print(f"Built {OUT} ({len(page)} bytes) — issue {content.get('issue')}, {content.get('date_human')}")
    print(f"Built {ARCHIVE_HTML.name} + archive.json/archive-data.js — {n} archived front pages")

if __name__ == "__main__":
    main()
