#!/usr/bin/env python3
"""Genererar en stilren, sjalvstandig index.html fran signals.json.

Anvandning: python3 make_html.py  (laser avanza_signals/signals.json,
skriver avanza_signals/index.html). Ingen extern data/CSS/JS - allt inline.
Beslutsunderlag, inte radgivning.
"""
from __future__ import annotations
import html
import json
import os
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))

SIDE_ORDER = {"KOP": 0, "SALJ": 1, "BEVAKA": 2, "-": 3}
SIDE_LABEL = {"KOP": "KÖP", "SALJ": "SÄLJ", "BEVAKA": "BEVAKA"}


def primary_side(signals: list[dict]) -> str:
    sides = {s["side"] for s in signals}
    for s in ("KOP", "SALJ", "BEVAKA"):
        if s in sides:
            return s
    return "-"


def esc(x) -> str:
    return html.escape(str(x))


def main() -> int:
    with open(os.path.join(HERE, "signals.json"), encoding="utf-8") as fh:
        data = json.load(fh)

    results = data["results"]
    for r in results:
        r["_primary"] = primary_side(r["signals"])
    results.sort(key=lambda r: (SIDE_ORDER[r["_primary"]], r["name"]))

    n_buy = sum(1 for r in results if any(s["side"] == "KOP" for s in r["signals"]))
    n_sell = sum(1 for r in results if any(s["side"] == "SALJ" for s in r["signals"]))
    n_watch = sum(1 for r in results if r["_primary"] == "BEVAKA")

    gen = data.get("generated_at", datetime.now(timezone.utc).isoformat())
    try:
        gen_disp = datetime.fromisoformat(gen).strftime("%Y-%m-%d %H:%M UTC")
    except ValueError:
        gen_disp = gen
    src = "+".join(data.get("sources", [])) or "-"
    synthetic = data.get("synthetic_data", False)

    rows = []
    for r in results:
        badges = "".join(
            f'<span class="badge {s["side"]}">{SIDE_LABEL.get(s["side"], s["side"])}'
            f'</span> <span class="reason">{esc(s["reason"])}</span>'
            for s in r["signals"]
        ) or '<span class="reason muted">Ingen signal</span>'
        last = r.get("last")
        price = f'{last:g} kr' + (" *" if r.get("last_approx") else "") if last is not None else "–"
        day = r.get("day_change_pct")
        if day is None:
            daycell = '<span class="muted">–</span>'
        else:
            cls = "up" if day >= 0 else "down"
            daycell = f'<span class="{cls}">{day:+.1f}%</span>'
        pc = r['_primary'] if r['_primary'] in ("KOP", "SALJ", "BEVAKA") else "none"
        rows.append(f"""
      <tr class="p-{pc}">
        <td class="rec"><span class="dot {pc}"></span></td>
        <td class="name"><strong>{esc(r['name'])}</strong><span class="ticker">{esc(r['ticker'])}</span></td>
        <td class="num">{price}</td>
        <td class="num">{daycell}</td>
        <td class="sig">{badges}</td>
      </tr>""")

    note = ('<div class="warn">⚠ Syntetisk data – exekvera ej.</div>' if synthetic else "")

    doc = f"""<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Avanza beslutsstöd</title>
<style>
  :root {{
    --bg:#f6f7f9; --card:#ffffff; --ink:#1a1d21; --muted:#6b7280; --line:#e5e7eb;
    --buy:#15803d; --buy-bg:#dcfce7; --sell:#b91c1c; --sell-bg:#fee2e2;
    --watch:#b45309; --watch-bg:#fef3c7; --up:#15803d; --down:#b91c1c;
  }}
  @media (prefers-color-scheme: dark) {{
    :root {{
      --bg:#0f1216; --card:#171b21; --ink:#e6e8eb; --muted:#9aa3ad; --line:#262c34;
      --buy:#4ade80; --buy-bg:#0f2e1c; --sell:#f87171; --sell-bg:#331416;
      --watch:#fbbf24; --watch-bg:#332611; --up:#4ade80; --down:#f87171;
    }}
  }}
  :root[data-theme="dark"] {{
    --bg:#0f1216; --card:#171b21; --ink:#e6e8eb; --muted:#9aa3ad; --line:#262c34;
    --buy:#4ade80; --buy-bg:#0f2e1c; --sell:#f87171; --sell-bg:#331416;
    --watch:#fbbf24; --watch-bg:#332611; --up:#4ade80; --down:#f87171;
  }}
  :root[data-theme="light"] {{
    --bg:#f6f7f9; --card:#ffffff; --ink:#1a1d21; --muted:#6b7280; --line:#e5e7eb;
    --buy:#15803d; --buy-bg:#dcfce7; --sell:#b91c1c; --sell-bg:#fee2e2;
    --watch:#b45309; --watch-bg:#fef3c7; --up:#15803d; --down:#b91c1c;
  }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; background:var(--bg); color:var(--ink);
    font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }}
  .wrap {{ max-width:860px; margin:0 auto; padding:24px 16px 48px; }}
  header h1 {{ margin:0 0 4px; font-size:22px; letter-spacing:-.01em; }}
  header .meta {{ color:var(--muted); font-size:13px; }}
  .warn {{ margin:12px 0; padding:10px 12px; border-radius:10px;
    background:var(--sell-bg); color:var(--sell); font-weight:600; font-size:13px; }}
  .tiles {{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin:20px 0; }}
  .tile {{ background:var(--card); border:1px solid var(--line); border-radius:14px; padding:16px; }}
  .tile .n {{ font-size:30px; font-weight:700; line-height:1; }}
  .tile .l {{ font-size:12px; color:var(--muted); margin-top:6px; text-transform:uppercase; letter-spacing:.04em; }}
  .tile.buy .n {{ color:var(--buy); }} .tile.sell .n {{ color:var(--sell); }} .tile.watch .n {{ color:var(--watch); }}
  .card {{ background:var(--card); border:1px solid var(--line); border-radius:14px; overflow:hidden; }}
  .scroll {{ overflow-x:auto; }}
  table {{ width:100%; border-collapse:collapse; min-width:560px; }}
  th, td {{ text-align:left; padding:12px 10px; border-bottom:1px solid var(--line); vertical-align:top; }}
  th {{ font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); font-weight:600; }}
  tr:last-child td {{ border-bottom:none; }}
  td.rec {{ width:10px; padding-right:0; }}
  .dot {{ display:inline-block; width:10px; height:10px; border-radius:50%; margin-top:5px; }}
  .dot.KOP {{ background:var(--buy); }} .dot.SALJ {{ background:var(--sell); }}
  .dot.BEVAKA {{ background:var(--watch); }} .dot.none {{ background:var(--muted); opacity:.4; }}
  .name strong {{ display:block; }}
  .ticker {{ color:var(--muted); font-size:12px; }}
  td.num {{ white-space:nowrap; font-variant-numeric:tabular-nums; }}
  .up {{ color:var(--up); }} .down {{ color:var(--down); }}
  .sig {{ font-size:13px; }}
  .badge {{ display:inline-block; font-size:11px; font-weight:700; padding:2px 7px; border-radius:999px; margin:1px 2px 1px 0; }}
  .badge.KOP {{ background:var(--buy-bg); color:var(--buy); }}
  .badge.SALJ {{ background:var(--sell-bg); color:var(--sell); }}
  .badge.BEVAKA {{ background:var(--watch-bg); color:var(--watch); }}
  .reason {{ color:var(--ink); }}
  .muted {{ color:var(--muted); }}
  footer {{ margin-top:20px; color:var(--muted); font-size:12px; }}
  footer p {{ margin:4px 0; }}
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>Avanza beslutsstöd</h1>
      <div class="meta">Screening av svenska aktier · genererad {esc(gen_disp)} · källa: {esc(src)}</div>
    </header>
    {note}
    <div class="tiles">
      <div class="tile buy"><div class="n">{n_buy}</div><div class="l">Köp-kandidater</div></div>
      <div class="tile sell"><div class="n">{n_sell}</div><div class="l">Sälj-kandidater</div></div>
      <div class="tile watch"><div class="n">{n_watch}</div><div class="l">Bevaka</div></div>
    </div>
    <div class="card scroll">
      <table>
        <thead><tr><th></th><th>Aktie</th><th>Kurs</th><th>Dag</th><th>Signaler</th></tr></thead>
        <tbody>{''.join(rows)}
        </tbody>
      </table>
    </div>
    <footer>
      <p>Beslutsunderlag – <strong>inte finansiell rådgivning</strong>. Inga order läggs automatiskt; verifiera och exekvera själv i Avanza-appen eller Infront Active Trader.</p>
      <p>Data via publik websökning och kan vara fördröjd/ungefärlig. * = ungefärlig kurs.</p>
    </footer>
  </div>
</body>
</html>"""

    out = os.path.join(HERE, "index.html")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(doc)
    print(f"skrev {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
