#!/usr/bin/env python3
"""Genererar en mobilvänlig, självständig index.html från signals.json.

Kort-layout (ingen sidoscroll), synlig ljus/mörk-växlare, riktig svenska.
Topp-sektion med dagens tydligaste köp/sälj, nedtonade högrisk-kort och
separata sektioner för aktier och Avanza-fonder. Allt inline (ingen extern
data/CSS/JS). Beslutsunderlag, inte rådgivning.
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


def reason_for(r, side):
    for s in r["signals"]:
        if s["side"] == side:
            return s["reason"]
    return ""


def esc(x):
    return html.escape(str(x))


def chips_for(r):
    c = []
    if r.get("category"):
        c.append(f'<span class="chip cat">{esc(r["category"])}</span>')
    up = r.get("analyst_upside_pct")
    if up is not None:
        c.append(f'<span class="chip up">Uppsida +{up:g}%</span>')
    ms = r.get("morningstar_stars")
    if ms is not None:
        c.append(f'<span class="chip">{"★" * int(ms)}{"☆" * (5 - int(ms))} {ms:g}/5</span>')
    oy = r.get("one_year_pct")
    if oy is not None:
        c.append(f'<span class="chip {"up" if oy >= 0 else "down"}">1 år {oy:+g}%</span>')
    ccy = r.get("currency", "kr")
    tl, th = r.get("analyst_target_low"), r.get("analyst_target_high")
    if tl or th:
        tgt = f"{tl:g}–{th:g}" if (tl and th) else f"{(tl or th):g}"
        c.append(f'<span class="chip">Riktkurs {tgt} {ccy}</span>')
    if r.get("pe") is not None:
        c.append(f'<span class="chip">P/E {r["pe"]:g}</span>')
    if r.get("fee_pct") is not None:
        c.append(f'<span class="chip">Avgift {r["fee_pct"]:g}%</span>')
    if r.get("div_yield_pct") is not None:
        c.append(f'<span class="chip">Dir.avk {r["div_yield_pct"]:g}%</span>')
    if r.get("support") is not None and r.get("resistance") is not None:
        c.append(f'<span class="chip">Stöd {r["support"]:g} · Motstånd {r["resistance"]:g} {ccy}</span>')
    if r.get("risk_high"):
        c.append('<span class="chip risk">⚠️ Högrisk</span>')
    return "".join(c)


def card(r):
    pc = r["_p"]
    cls = "itemcard p-" + pc + (" risk" if r.get("risk_high") else "")
    last = r.get("last")
    price = ""
    if last is not None:
        p = f'{last:g} {r.get("currency", "kr")}' + ("*" if r.get("last_approx") else "")
        day = r.get("day_change_pct")
        if day is not None:
            p += f' <span class="{"up" if day >= 0 else "down"}">({day:+.1f}%)</span>'
        price = f'<div class="price">{p}</div>'
    sig = "".join(
        f'<li><span class="badge {s["side"]}">{SIDE_LABEL.get(s["side"], s["side"])}</span>'
        f'<span class="reason">{esc(s["reason"])}</span></li>'
        for s in r["signals"]
    ) or '<li><span class="reason muted">Ingen signal just nu</span></li>'
    rating = r.get("analyst_rating")
    note = r.get("note")
    extra = (f'<div class="rating">📊 {esc(rating)}</div>' if rating
             else (f'<div class="rating">ℹ️ {esc(note)}</div>' if note else ""))
    return f"""
      <article class="{cls}">
        <div class="top">
          <div class="id"><span class="dot {pc}"></span><strong>{esc(r['name'])}</strong></div>
          <span class="rec {pc}">{SIDE_LABEL.get(pc, '–')}</span>
        </div>
        {price}
        <div class="chips">{chips_for(r)}</div>
        <ul class="signals">{sig}</ul>
        {extra}
      </article>"""


def hero(r, side, kicker):
    if not r:
        return ""
    lbl = SIDE_LABEL[side]
    return f"""
      <div class="hero {side}">
        <div class="k">{kicker}</div>
        <div class="hn">{esc(r['name'])}<span class="hrec {side}">{lbl}</span></div>
        <div class="hr">{esc(reason_for(r, side))}</div>
      </div>"""


def main():
    with open(os.path.join(HERE, "signals.json"), encoding="utf-8") as fh:
        data = json.load(fh)

    results = data["results"]
    for r in results:
        r["_p"] = primary(r["signals"])
    # högrisk sorteras sist inom varje sektion (nedtonat)
    results.sort(key=lambda r: (bool(r.get("risk_high")), SIDE_ORDER[r["_p"]], r["name"]))

    stocks = [r for r in results if r.get("type") != "fond"]
    funds = [r for r in results if r.get("type") == "fond"]

    n_buy = sum(1 for r in results if any(s["side"] == "KOP" for s in r["signals"]))
    n_sell = sum(1 for r in results if any(s["side"] in ("SALJ", "VARNING") for s in r["signals"]))
    n_watch = sum(1 for r in results if r["_p"] == "BEVAKA")

    # Dagens tydligaste (separat för aktier och fonder)
    def buy_score(r):
        s = 0.0
        seen = False
        if r.get("analyst_upside_pct") is not None:
            s += r["analyst_upside_pct"]; seen = True
        if r.get("morningstar_stars") is not None:
            s += r["morningstar_stars"] * 18; seen = True
        if r.get("one_year_pct") is not None:
            s += max(r["one_year_pct"], 0) * 0.4; seen = True
        return s if seen else 10

    def sell_score(r):
        if r.get("last") and r.get("analyst_target_high"):
            return r["last"] - r["analyst_target_high"]
        if r.get("one_year_pct") is not None:
            return -r["one_year_pct"]
        return 0

    def best_buy_of(lst):
        b = [r for r in lst if any(s["side"] == "KOP" for s in r["signals"]) and not r.get("risk_high")]
        return max(b, key=buy_score) if b else None

    def best_sell_of(lst):
        s = [r for r in lst if any(x["side"] == "SALJ" for x in r["signals"])]
        return max(s, key=sell_score) if s else None

    sb, ss = best_buy_of(stocks), best_sell_of(stocks)
    fb, fs = best_buy_of(funds), best_sell_of(funds)

    gen = data.get("generated_at", datetime.now(timezone.utc).isoformat())
    try:
        gen_disp = datetime.fromisoformat(gen).strftime("%Y-%m-%d %H:%M UTC")
    except ValueError:
        gen_disp = gen
    src = "+".join(data.get("sources", [])) or "–"
    synthetic = data.get("synthetic_data", False)
    warn = '<div class="warn">⚠️ Syntetisk data – exekvera ej.</div>' if synthetic else ""

    heroes = (hero(sb, "KOP", "Tydligaste aktie-köp") + hero(ss, "SALJ", "Tydligaste aktie-sälj")
              + hero(fb, "KOP", "Tydligaste fond-köp") + hero(fs, "SALJ", "Tydligaste fond-sälj"))
    hero_html = f'<div class="heroes">{heroes}</div>' if any([sb, ss, fb, fs]) else ""

    stock_cards = "".join(card(r) for r in stocks)
    fund_cards = "".join(card(r) for r in funds)

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
  h2{{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);
    margin:22px 0 10px;}}
  .meta{{color:var(--muted);font-size:12.5px;}}
  .toggle{{flex:none;border:1px solid var(--line);background:var(--card);color:var(--ink);
    border-radius:999px;padding:8px 12px;font-size:13px;cursor:pointer;line-height:1;white-space:nowrap;}}
  .toggle:active{{transform:scale(.96);}}
  .warn{{margin:12px 0;padding:10px 12px;border-radius:10px;background:var(--sell-bg);
    color:var(--sell);font-weight:600;font-size:13px;}}
  .heroes{{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin:18px 0 6px;}}
  .hero{{border-radius:16px;padding:15px 16px;border:1px solid var(--line);}}
  .hero.KOP{{background:var(--buy-bg);border-color:var(--buy);}}
  .hero.SALJ{{background:var(--sell-bg);border-color:var(--sell);}}
  .hero .k{{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);}}
  .hero .hn{{font-size:19px;font-weight:750;margin:3px 0 5px;display:flex;align-items:center;gap:9px;flex-wrap:wrap;}}
  .hrec{{font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px;}}
  .hrec.KOP{{background:var(--buy);color:#fff;}} .hrec.SALJ{{background:var(--sell);color:#fff;}}
  .hero .hr{{font-size:13px;color:var(--ink);}}
  .tiles{{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0 4px;}}
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
  .itemcard.risk{{opacity:.45;filter:grayscale(.65);}}
  .itemcard.risk:hover,.itemcard.risk:active{{opacity:1;filter:none;}}
  .top{{display:flex;align-items:center;justify-content:space-between;gap:8px;}}
  .id{{display:flex;align-items:center;gap:7px;}}
  .dot{{width:9px;height:9px;border-radius:50%;background:var(--muted);flex:none;}}
  .dot.KOP{{background:var(--buy);}}.dot.SALJ,.dot.VARNING{{background:var(--sell);}}.dot.BEVAKA{{background:var(--watch);}}
  .rec{{font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px;flex:none;
    background:var(--chip);color:var(--muted);letter-spacing:.03em;}}
  .rec.KOP{{background:var(--buy-bg);color:var(--buy);}}
  .rec.SALJ,.rec.VARNING{{background:var(--sell-bg);color:var(--sell);}}
  .rec.BEVAKA{{background:var(--watch-bg);color:var(--watch);}}
  .price{{margin:9px 0 8px;font-size:18px;font-weight:650;font-variant-numeric:tabular-nums;}}
  .up{{color:var(--up);}}.down{{color:var(--down);}}
  .chips{{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 2px;}}
  .chip{{background:var(--chip);color:var(--ink);font-size:11.5px;padding:3px 8px;border-radius:8px;}}
  .chip.up{{color:var(--buy);font-weight:700;}} .chip.down{{color:var(--sell);font-weight:700;}}
  .chip.cat{{background:transparent;border:1px solid var(--line);color:var(--muted);}}
  .chip.risk{{background:var(--sell-bg);color:var(--sell);font-weight:700;}}
  ul.signals{{list-style:none;margin:8px 0 0;padding:0;}}
  ul.signals li{{display:flex;gap:7px;align-items:baseline;margin:5px 0;font-size:13px;}}
  .badge{{flex:none;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px;letter-spacing:.03em;}}
  .badge.KOP{{background:var(--buy-bg);color:var(--buy);}}
  .badge.SALJ,.badge.VARNING{{background:var(--sell-bg);color:var(--sell);}}
  .badge.BEVAKA{{background:var(--watch-bg);color:var(--watch);}}
  .reason{{color:var(--ink);}}.muted{{color:var(--muted);}}
  .rating{{margin-top:8px;font-size:12px;color:var(--muted);border-top:1px dashed var(--line);padding-top:7px;}}
  .legend{{margin:18px 0 0;font-size:12px;color:var(--muted);display:flex;flex-wrap:wrap;gap:12px;}}
  .legend b{{color:var(--ink);}}
  footer{{margin-top:14px;color:var(--muted);font-size:12px;}}
  footer p{{margin:4px 0;}}
  @media (max-width:420px){{ .tiles{{gap:8px;}} .tile{{padding:11px;}} .tile .n{{font-size:22px;}} h1{{font-size:19px;}} }}
</style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <div>
        <h1>Avanza beslutsstöd</h1>
        <div class="meta">Screening av aktier &amp; fonder – hela Avanza-utbudet (svenska &amp; globala) · {esc(gen_disp)} · källa: {esc(src)}</div>
      </div>
      <button class="toggle" id="tg" aria-label="Växla ljust/mörkt läge">🌙 Mörkt</button>
    </div>
    {warn}
    {hero_html}
    <div class="tiles">
      <div class="tile buy"><div class="n">{n_buy}</div><div class="l">Köp</div></div>
      <div class="tile sell"><div class="n">{n_sell}</div><div class="l">Sälj</div></div>
      <div class="tile watch"><div class="n">{n_watch}</div><div class="l">Bevaka</div></div>
    </div>
    <h2>Aktier – svenska &amp; globala ({len(stocks)})</h2>
    <div class="grid">{stock_cards}
    </div>
    <h2>Fonder – hela Avanza-utbudet ({len(funds)})</h2>
    <div class="grid">{fund_cards}
    </div>
    <div class="legend">
      <span><b style="color:var(--buy)">KÖP</b> uppsida/köpsignal</span>
      <span><b style="color:var(--sell)">SÄLJ</b> nedsida/säljsignal</span>
      <span><b style="color:var(--watch)">BEVAKA</b> följ – blandat/risk</span>
      <span>⚠️ = nedtonat, högrisk</span>
    </div>
    <footer>
      <p>Beslutsunderlag – <strong>inte finansiell rådgivning</strong>. Inga order läggs automatiskt; verifiera och exekvera själv i Avanza-appen eller Infront Active Trader.</p>
      <p>Data via publik websökning, kan vara fördröjd/ungefärlig. * = ungefärlig kurs. Aktiesignaler bygger på riktkurser, momentum och stöd/motstånd; fondsignaler på Morningstar-betyg, avkastning och avgift.</p>
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
