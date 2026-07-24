#!/usr/bin/env python3
"""Genererar en mobilvänlig, självständig index.html från signals.json.

Kort-layout (ingen sidoscroll), synlig ljus/mörk-växlare, riktig svenska och
mer info per aktie. Ingen extern data/CSS/JS – allt inline.
Beslutsunderlag, inte rådgivning.
"""
from __future__ import annotations
import html
import json
import os
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
SIDE_ORDER = {"KOP": 0, "SALJ": 1, "BEVAKA": 2, "VARNING": 2, "none": 3}
SIDE_LABEL = {"KOP": "KÖP", "SALJ": "SÄLJ", "BEVAKA": "BEVAKA", "VARNING": "VARNING"}


def primary(signals):
    sides = {s["side"] for s in signals}
    for s in ("KOP", "SALJ", "BEVAKA", "VARNING"):
        if s in sides:
            return s
    return "none"


def esc(x):
    return html.escape(str(x))


def main():
    with open(os.path.join(HERE, "signals.json"), encoding="utf-8") as fh:
        data = json.load(fh)

    results = data["results"]
    for r in results:
        r["_p"] = primary(r["signals"])
    results.sort(key=lambda r: (SIDE_ORDER[r["_p"]], r["name"]))

    n_buy = sum(1 for r in results if any(s["side"] == "KOP" for s in r["signals"]))
    n_sell = sum(1 for r in results if any(s["side"] in ("SALJ", "VARNING") for s in r["signals"]))
    n_watch = sum(1 for r in results if r["_p"] == "BEVAKA")

    gen = data.get("generated_at", datetime.now(timezone.utc).isoformat())
    try:
        gen_disp = datetime.fromisoformat(gen).strftime("%Y-%m-%d %H:%M UTC")
    except ValueError:
        gen_disp = gen
    src = "+".join(data.get("sources", [])) or "–"
    synthetic = data.get("synthetic_data", False)

    cards = []
    for r in results:
        pc = r["_p"]
        chips = []
        up = r.get("analyst_upside_pct")
        if up is not None:
            chips.append(f'<span class="chip up">Uppsida +{up:g}%</span>')
        tl, th = r.get("analyst_target_low"), r.get("analyst_target_high")
        if tl or th:
            tgt = f"{tl:g}–{th:g}" if (tl and th) else f"{(tl or th):g}"
            chips.append(f'<span class="chip">Riktkurs {tgt} kr</span>')
        if r.get("pe") is not None:
            chips.append(f'<span class="chip">P/E {r["pe"]:g}</span>')
        if r.get("div_yield_pct") is not None:
            chips.append(f'<span class="chip">Dir.avk {r["div_yield_pct"]:g}%</span>')
        if r.get("support") is not None and r.get("resistance") is not None:
            chips.append(f'<span class="chip">Stöd {r["support"]:g} · Motstånd {r["resistance"]:g} kr</span>')
        chip_html = "".join(chips)

        last = r.get("last")
        price = (f'{last:g} kr' + ("*" if r.get("last_approx") else "")) if last is not None else "kurs saknas"
        day = r.get("day_change_pct")
        if day is not None:
            price += f' <span class="{"up" if day >= 0 else "down"}">({day:+.1f}%)</span>'

        sig_items = "".join(
            f'<li><span class="badge {s["side"]}">{SIDE_LABEL.get(s["side"], s["side"])}</span>'
            f'<span class="reason">{esc(s["reason"])}</span></li>'
            for s in r["signals"]
        ) or '<li><span class="reason muted">Ingen signal just nu</span></li>'

        rating = r.get("analyst_rating")
        note = r.get("note")
        extra = (f'<div class="rating">📊 {esc(rating)}</div>' if rating
                 else (f'<div class="rating">ℹ️ {esc(note)}</div>' if note else ""))

        cards.append(f"""
      <article class="itemcard p-{pc}">
        <div class="top">
          <div class="id"><span class="dot {pc}"></span><strong>{esc(r['name'])}</strong>
            <span class="ticker">{esc(r['ticker'])}</span></div>
          <span class="rec {pc}">{SIDE_LABEL.get(pc, '–')}</span>
        </div>
        <div class="price">{price}</div>
        <div class="chips">{chip_html}</div>
        <ul class="signals">{sig_items}</ul>
        {extra}
      </article>""")

    warn = '<div class="warn">⚠️ Syntetisk data – exekvera ej.</div>' if synthetic else ""

    doc = f"""<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Avanza beslutsstöd</title>
<style>
  :root{{
    --bg:#f4f6f8;--card:#fff;--ink:#181b1f;--muted:#68707a;--line:#e6e9ee;--chip:#f0f2f5;
    --buy:#1f8a4c;--buy-bg:#e3f6ea;--sell:#c8322a;--sell-bg:#fce8e6;
    --watch:#b06a10;--watch-bg:#fdf1d9;--up:#1f8a4c;--down:#c8322a;
  }}
  :root[data-theme="dark"]{{
    --bg:#0e1116;--card:#161b22;--ink:#e7eaee;--muted:#98a1ad;--line:#232a33;--chip:#1e242c;
    --buy:#54d98c;--buy-bg:#0f2c1c;--sell:#f2837a;--sell-bg:#331616;
    --watch:#f0b24b;--watch-bg:#2f2410;--up:#54d98c;--down:#f2837a;
  }}
  @media (prefers-color-scheme:dark){{
    :root:not([data-theme="light"]){{
      --bg:#0e1116;--card:#161b22;--ink:#e7eaee;--muted:#98a1ad;--line:#232a33;--chip:#1e242c;
      --buy:#54d98c;--buy-bg:#0f2c1c;--sell:#f2837a;--sell-bg:#331616;
      --watch:#f0b24b;--watch-bg:#2f2410;--up:#54d98c;--down:#f2837a;
    }}
  }}
  *{{box-sizing:border-box;}}
  body{{margin:0;background:var(--bg);color:var(--ink);
    font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    -webkit-text-size-adjust:100%;}}
  .wrap{{max-width:900px;margin:0 auto;padding:20px 14px 44px;}}
  .head{{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}}
  h1{{margin:0 0 4px;font-size:21px;letter-spacing:-.01em;}}
  .meta{{color:var(--muted);font-size:12.5px;}}
  .toggle{{flex:none;border:1px solid var(--line);background:var(--card);color:var(--ink);
    border-radius:999px;padding:8px 12px;font-size:13px;cursor:pointer;line-height:1;white-space:nowrap;}}
  .toggle:active{{transform:scale(.96);}}
  .warn{{margin:12px 0;padding:10px 12px;border-radius:10px;background:var(--sell-bg);
    color:var(--sell);font-weight:600;font-size:13px;}}
  .tiles{{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0;}}
  .tile{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;text-align:center;}}
  .tile .n{{font-size:26px;font-weight:750;line-height:1;}}
  .tile .l{{font-size:11px;color:var(--muted);margin-top:5px;text-transform:uppercase;letter-spacing:.04em;}}
  .tile.buy .n{{color:var(--buy);}}.tile.sell .n{{color:var(--sell);}}.tile.watch .n{{color:var(--watch);}}
  .grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;}}
  .itemcard{{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--muted);
    border-radius:14px;padding:14px;overflow-wrap:anywhere;}}
  .itemcard.p-KOP{{border-left-color:var(--buy);}}
  .itemcard.p-SALJ,.itemcard.p-VARNING{{border-left-color:var(--sell);}}
  .itemcard.p-BEVAKA{{border-left-color:var(--watch);}}
  .top{{display:flex;align-items:center;justify-content:space-between;gap:8px;}}
  .id{{display:flex;align-items:center;gap:7px;flex-wrap:wrap;}}
  .dot{{width:9px;height:9px;border-radius:50%;background:var(--muted);flex:none;}}
  .dot.KOP{{background:var(--buy);}}.dot.SALJ,.dot.VARNING{{background:var(--sell);}}.dot.BEVAKA{{background:var(--watch);}}
  .ticker{{color:var(--muted);font-size:12px;}}
  .rec{{font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px;flex:none;
    background:var(--chip);color:var(--muted);letter-spacing:.03em;}}
  .rec.KOP{{background:var(--buy-bg);color:var(--buy);}}
  .rec.SALJ,.rec.VARNING{{background:var(--sell-bg);color:var(--sell);}}
  .rec.BEVAKA{{background:var(--watch-bg);color:var(--watch);}}
  .price{{margin:9px 0 8px;font-size:18px;font-weight:650;font-variant-numeric:tabular-nums;}}
  .up{{color:var(--up);}}.down{{color:var(--down);}}
  .chips{{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;}}
  .chip{{background:var(--chip);color:var(--ink);font-size:11.5px;padding:3px 8px;border-radius:8px;}}
  .chip.up{{color:var(--buy);font-weight:700;}}
  ul.signals{{list-style:none;margin:8px 0 0;padding:0;}}
  ul.signals li{{display:flex;gap:7px;align-items:baseline;margin:5px 0;font-size:13px;}}
  .badge{{flex:none;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px;letter-spacing:.03em;}}
  .badge.KOP{{background:var(--buy-bg);color:var(--buy);}}
  .badge.SALJ,.badge.VARNING{{background:var(--sell-bg);color:var(--sell);}}
  .badge.BEVAKA{{background:var(--watch-bg);color:var(--watch);}}
  .reason{{color:var(--ink);}}.muted{{color:var(--muted);}}
  .rating{{margin-top:8px;font-size:12px;color:var(--muted);border-top:1px dashed var(--line);padding-top:7px;}}
  .legend{{margin:16px 0 0;font-size:12px;color:var(--muted);display:flex;flex-wrap:wrap;gap:12px;}}
  .legend b{{color:var(--ink);}}
  footer{{margin-top:16px;color:var(--muted);font-size:12px;}}
  footer p{{margin:4px 0;}}
  @media (max-width:420px){{ .tiles{{gap:8px;}} .tile{{padding:11px;}} .tile .n{{font-size:22px;}} h1{{font-size:19px;}} }}
</style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <div>
        <h1>Avanza beslutsstöd</h1>
        <div class="meta">Screening av svenska aktier · {esc(gen_disp)} · källa: {esc(src)}</div>
      </div>
      <button class="toggle" id="tg" aria-label="Växla ljust/mörkt läge">🌙 Mörkt</button>
    </div>
    {warn}
    <div class="tiles">
      <div class="tile buy"><div class="n">{n_buy}</div><div class="l">Köp</div></div>
      <div class="tile sell"><div class="n">{n_sell}</div><div class="l">Sälj</div></div>
      <div class="tile watch"><div class="n">{n_watch}</div><div class="l">Bevaka</div></div>
    </div>
    <div class="grid">{''.join(cards)}
    </div>
    <div class="legend">
      <span><b style="color:var(--buy)">KÖP</b> uppsida/köpsignal</span>
      <span><b style="color:var(--sell)">SÄLJ</b> nedsida/säljsignal</span>
      <span><b style="color:var(--watch)">BEVAKA</b> följ – blandat/risk</span>
    </div>
    <footer>
      <p>Beslutsunderlag – <strong>inte finansiell rådgivning</strong>. Inga order läggs automatiskt; verifiera och exekvera själv i Avanza-appen eller Infront Active Trader.</p>
      <p>Data via publik websökning, kan vara fördröjd/ungefärlig. * = ungefärlig kurs. Signaler bygger på analytikers riktkurser, momentum (RSI, glidande medelvärden), avstånd till stöd/motstånd och kursfall.</p>
    </footer>
  </div>
  <script>
  (function(){{
    var root=document.documentElement,k="avz-theme",btn=document.getElementById("tg");
    function sysDark(){{return window.matchMedia&&window.matchMedia("(prefers-color-scheme:dark)").matches;}}
    function cur(){{var a=root.getAttribute("data-theme");return a?a:(sysDark()?"dark":"light");}}
    function paint(){{btn.textContent=cur()==="dark"?"☀️ Ljust":"🌙 Mörkt";}}
    try{{var s=localStorage.getItem(k);if(s)root.setAttribute("data-theme",s);}}catch(e){{}}
    btn.addEventListener("click",function(){{
      var n=cur()==="dark"?"light":"dark";root.setAttribute("data-theme",n);
      try{{localStorage.setItem(k,n);}}catch(e){{}}paint();
    }});
    paint();
  }})();
  </script>
</body>
</html>"""

    out = os.path.join(HERE, "index.html")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(doc)
    print(f"skrev {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
