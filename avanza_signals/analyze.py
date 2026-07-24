#!/usr/bin/env python3
"""Beslutsstod for svensk trading - semi-automatiserat.

Normaliserar marknadsdata till en "snapshot" per instrument och genererar
KOP-/SALJ-/BEVAKA-signaler. Inga order laggs - utfallet ar BESLUTSUNDERLAG.

Datakalla, i prioritetsordning:
  1. market_data.json  - riktig data insamlad via WebSearch (harness-verktyg;
     enda externa vagen i denna miljo eftersom egress blockerar kurskallor).
  2. Yahoo Finance      - riktig daglig serie (fungerar nar egress oppnas eller
     via en framtida Avanza-MCP). Berakningar: SMA20/50, RSI14, drawdown.
  3. Syntetisk fallback - deterministisk, tydligt markt [SYNTET], far ALDRIG
     anvandas for riktiga affarer. Finns bara sa att pipelinen kan verifieras.

Utskrift:
  * Laslig rapport.
  * En rad som borjar med "PUSH:" - texten routinen skickar som notis.
  * signals.json bredvid skriptet.
"""
from __future__ import annotations

import json
import math
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))


def load_json(name: str, required: bool = True) -> dict | None:
    path = os.path.join(HERE, name)
    if not os.path.exists(path):
        if required:
            raise FileNotFoundError(path)
        return None
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


# ---------------------------------------------------------------- datakallor

def fetch_history(ticker: str, rng: str) -> list[float] | None:
    """Dagliga stangningskurser fran Yahoo Finance. None vid fel/blockering."""
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
        f"?range={rng}&interval=1d"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.load(resp)
        closes = data["chart"]["result"][0]["indicators"]["quote"][0]["close"]
        return [c for c in closes if c is not None]
    except (urllib.error.URLError, KeyError, IndexError, ValueError, TypeError) as exc:
        print(f"  ! Yahoo blockerad/fel for {ticker}: {exc}", file=sys.stderr)
        return None


def synthetic_history(ticker: str, n: int = 130) -> list[float]:
    seed = sum(ord(c) for c in ticker)
    base = 80 + seed % 120
    out = []
    for i in range(n):
        swing = math.sin((i + seed) / 12.0) * (base * 0.06)
        jitter = math.sin((i + seed) * 1.7) * (base * 0.015)
        drift = (i - n / 2) * (base * 0.0006) * (1 if seed % 2 == 0 else -1)
        out.append(round(base + swing + jitter + drift, 2))
    return out


# ---------------------------------------------------------------- indikatorer

def sma(values: list[float], period: int) -> float | None:
    return sum(values[-period:]) / period if len(values) >= period else None


def rsi(values: list[float], period: int) -> float | None:
    if len(values) < period + 1:
        return None
    gains = losses = 0.0
    for i in range(-period, 0):
        delta = values[i] - values[i - 1]
        gains += max(delta, 0.0)
        losses += max(-delta, 0.0)
    avg_gain, avg_loss = gains / period, losses / period
    if avg_loss == 0:
        return 100.0
    return 100.0 - (100.0 / (1.0 + avg_gain / avg_loss))


def snapshot_from_series(closes: list[float], cfg: dict) -> dict:
    """Bygg samma snapshot-falt fran en daglig serie."""
    last, prev = closes[-1], closes[-2] if len(closes) > 1 else closes[-1]
    high = max(closes)
    month = closes[-22] if len(closes) >= 22 else closes[0]
    week = closes[-6] if len(closes) >= 6 else closes[0]
    return {
        "last": round(last, 2),
        "day_change_pct": round((last / prev - 1) * 100, 2) if prev else None,
        "week_change_pct": round((last / week - 1) * 100, 2) if week else None,
        "month_change_pct": round((last / month - 1) * 100, 2) if month else None,
        "drawdown_from_high_pct": round((last / high - 1) * 100, 2) if high else None,
        "sma_fast": round(sma(closes, cfg["sma_fast"]), 2),
        "sma_slow": round(sma(closes, cfg["sma_slow"]), 2),
        "rsi": round(rsi(closes, cfg["rsi_period"]), 1),
    }


# ---------------------------------------------------------------- signaler

def evaluate(rec: dict, cfg: dict) -> list[dict]:
    sig: list[tuple[str, str]] = []
    g = rec.get

    r = g("rsi")
    if r is not None and r <= cfg["rsi_oversold"]:
        sig.append(("KOP", f"RSI {r:.0f} (översåld)"))
    if r is not None and r >= cfg["rsi_overbought"]:
        sig.append(("SALJ", f"RSI {r:.0f} (överköpt)"))

    m = g("month_change_pct")
    if m is not None and m <= -cfg["drawdown_from_high_pct"]:
        sig.append(("BEVAKA", f"månad {m:+.0f}% – kraftigt fall, granska"))
    dd = g("drawdown_from_high_pct")
    if dd is not None and dd <= -cfg["drawdown_from_high_pct"]:
        sig.append(("BEVAKA", f"{dd:+.0f}% från 6mån-topp"))

    d = g("day_change_pct")
    if d is not None and d <= -cfg["big_day_drop_pct"]:
        sig.append(("VARNING", f"dag {d:+.0f}% – stort fall"))

    up_direct = g("analyst_upside_pct")
    if up_direct is not None and up_direct >= cfg["analyst_upside_pct"]:
        sig.append(("KOP", f"analytiker-uppsida +{up_direct:.0f}%"))

    last, tl, th = g("last"), g("analyst_target_low"), g("analyst_target_high")
    rating = g("analyst_rating")
    if last and tl and last < tl:
        up = (tl / last - 1) * 100
        if up >= cfg["analyst_upside_pct"]:
            tstr = f"{tl:.0f}" + (f"-{th:.0f}" if th else "")
            sig.append(("KOP", f"analytiker {tstr} vs {last:.0f} (+{up:.0f}%)"
                               + (f" [{rating}]" if rating else "")))
    if last and th and last > th:
        dn = (1 - th / last) * 100
        if dn >= cfg["analyst_downside_pct"]:
            sig.append(("SALJ", f"kurs {last:.0f} över riktkurs {th:.0f} (-{dn:.0f}%)"
                               + (f" [{rating}]" if rating else "")))

    sf, ss = g("sma_fast"), g("sma_slow")
    if sf and ss:
        gap = (sf / ss - 1) * 100
        if gap >= cfg["sma_gap_pct"]:
            sig.append(("BEVAKA", f"SMA20 {sf:.0f} > SMA50 {ss:.0f} (positiv trend)"))
        elif -gap >= cfg["sma_gap_pct"]:
            sig.append(("BEVAKA", f"SMA20 {sf:.0f} < SMA50 {ss:.0f} (negativ trend)"))

    res, sup = g("resistance"), g("support")
    if last and res and last <= res and abs(last / res - 1) * 100 <= cfg["near_level_pct"]:
        sig.append(("BEVAKA", f"nära motstånd {res:.0f}"))
    if last and sup and last >= sup and abs(last / sup - 1) * 100 <= cfg["near_level_pct"]:
        sig.append(("BEVAKA", f"nära stöd {sup:.0f}"))

    rs = g("rating_signal")
    if rs in ("KOP", "SALJ", "BEVAKA"):
        sig.append((rs, g("rating_note") or "analytikersignal"))

    return [{"side": s, "reason": why} for s, why in sig]


# ---------------------------------------------------------------- main

def resolve_record(ticker: str, market: dict | None, cfg: dict) -> tuple[dict, str]:
    """Returnera (snapshot, kalla). Kalla: websearch | yahoo | synthetic."""
    if market and cfg.get("prefer_market_data_json", True):
        snap = market.get("instruments", {}).get(ticker)
        if snap:
            return dict(snap), "websearch"
    closes = fetch_history(ticker, cfg["history_range"])
    if closes and len(closes) >= cfg["sma_slow"] + 1:
        return snapshot_from_series(closes, cfg), "yahoo"
    if cfg.get("allow_synthetic_fallback", False):
        return snapshot_from_series(synthetic_history(ticker), cfg), "synthetic"
    return {}, "none"


def main() -> int:
    cfg = load_json("config.json")
    watch = load_json("watchlist.json")["instruments"]
    market = load_json("market_data.json", required=False)

    results, sources = [], set()
    for inst in watch:
        ticker, name = inst["ticker"], inst["name"]
        snap, source = resolve_record(ticker, market, cfg)
        if source == "none":
            print(f"  hoppar over {ticker}: ingen data", file=sys.stderr)
            continue
        sources.add(source)
        snap.update({"name": name, "ticker": ticker, "source": source,
                     "signals": evaluate(snap, cfg)})
        results.append(snap)

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    synthetic = "synthetic" in sources
    flagged = [r for r in results if r["signals"]]

    src_label = "+".join(sorted(sources)) or "ingen"
    tag = " [SYNTET-DATA]" if synthetic else ""
    print(f"\n=== Beslutsstod {now} | kalla: {src_label}{tag} ===")
    for r in results:
        price = f"{r['last']:>8}" if r.get("last") is not None else "     n/a"
        d = r.get("day_change_pct")
        dstr = f"{d:+5.1f}%" if d is not None else "   -  "
        sig = "; ".join(f"{s['side']}: {s['reason']}" for s in r["signals"]) or "-"
        mark = " [SYNTET]" if r["source"] == "synthetic" else ""
        print(f"  {r['name']:<20} {price}  dag {dstr}  {sig}{mark}")

    if flagged:
        parts = []
        for r in flagged[:6]:
            sides = "/".join(sorted({s["side"] for s in r["signals"]}))
            parts.append(f"{r['name']} ({sides})")
        push = f"PUSH: {len(flagged)} signal(er): " + ", ".join(parts)
        push += " [SYNTET, exekvera ej]" if synthetic else " - forslag, verifiera i Avanza/Infront"
    else:
        push = "PUSH: Inga signaler idag"
    print(push)

    out = {"generated_at": now, "sources": sorted(sources), "synthetic_data": synthetic,
           "results": results, "flagged": flagged, "push_line": push[len("PUSH: "):]}
    with open(os.path.join(HERE, "signals.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
