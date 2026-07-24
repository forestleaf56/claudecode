#!/usr/bin/env python3
"""Beslutsstod for svensk trading - semi-automatiserat.

Hamtar daglig kursdata for en bevakningslista, beraknar enkla indikatorer
(SMA, RSI, drawdown fran 6-manaderstopp) och genererar KOP-/SALJ-kandidater.

VIKTIGT:
  * Inga order laggs. Utfallet ar KANDIDATER/BESLUTSUNDERLAG.
  * Datakalla ar publik (Yahoo Finance) i denna demo. Nar en Avanza-MCP-server
    kopplas in byts fetch_history() mot MCP-verktygen och positioner kan lasas.
  * Om natet blockerar kallan (t.ex. restriktiv egress-policy) anvands en
    deterministisk SYNTETISK fallback sa att pipelinen kan verifieras. Sadana
    rader markeras tydligt med [SYNTET] och far ALDRIG anvandas for riktiga affarer.

Utskrift:
  * En laslig rapport pa stderr/stdout.
  * En kompakt rad som borjar med "PUSH: " avsedd for push-notisen.
  * signals.json skrivs bredvid skriptet.
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


def load_json(name: str) -> dict:
    with open(os.path.join(HERE, name), "r", encoding="utf-8") as fh:
        return json.load(fh)


def fetch_history(ticker: str, rng: str) -> list[float] | None:
    """Hamta dagliga stangningskurser fran Yahoo Finance. None vid fel."""
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
        f"?range={rng}&interval=1d"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.load(resp)
        result = data["chart"]["result"][0]
        closes = result["indicators"]["quote"][0]["close"]
        return [c for c in closes if c is not None]
    except (urllib.error.URLError, KeyError, IndexError, ValueError, TypeError) as exc:
        print(f"  ! kunde inte hamta {ticker}: {exc}", file=sys.stderr)
        return None


def synthetic_history(ticker: str, n: int = 130) -> list[float]:
    """Deterministisk pseudo-serie (seedad pa ticker) for offline-verifiering."""
    seed = sum(ord(c) for c in ticker)
    base = 80 + seed % 120
    out = []
    for i in range(n):
        # deterministiskt "brus": lang sving + snabb dag-till-dag-oscillation
        swing = math.sin((i + seed) / 12.0) * (base * 0.06)
        jitter = math.sin((i + seed) * 1.7) * (base * 0.015)
        drift = (i - n / 2) * (base * 0.0006) * (1 if seed % 2 == 0 else -1)
        price = base + swing + jitter + drift
        out.append(round(price, 2))
    return out


def sma(values: list[float], period: int) -> float | None:
    if len(values) < period:
        return None
    return sum(values[-period:]) / period


def rsi(values: list[float], period: int) -> float | None:
    if len(values) < period + 1:
        return None
    gains, losses = 0.0, 0.0
    for i in range(-period, 0):
        delta = values[i] - values[i - 1]
        if delta >= 0:
            gains += delta
        else:
            losses -= delta
    avg_gain = gains / period
    avg_loss = losses / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


def analyze_one(name: str, ticker: str, closes: list[float], synthetic: bool,
                cfg: dict) -> dict:
    last = closes[-1]
    prev = closes[-2] if len(closes) > 1 else last
    day_change = (last / prev - 1.0) * 100.0 if prev else 0.0
    high = max(closes)
    drawdown = (last / high - 1.0) * 100.0 if high else 0.0
    s_fast = sma(closes, cfg["sma_fast"])
    s_slow = sma(closes, cfg["sma_slow"])
    r = rsi(closes, cfg["rsi_period"])

    signals = []
    if r is not None and r <= cfg["rsi_oversold"]:
        signals.append(("KOP", f"RSI {r:.0f} <= {cfg['rsi_oversold']} (oversald)"))
    if r is not None and r >= cfg["rsi_overbought"]:
        signals.append(("SALJ", f"RSI {r:.0f} >= {cfg['rsi_overbought']} (overkopt)"))
    if drawdown <= -cfg["drawdown_from_high_pct"]:
        signals.append(("VARNING", f"{drawdown:.0f}% fran 6mn-topp"))
    if s_fast is not None and s_slow is not None:
        if s_fast > s_slow and closes[-2] and sma(closes[:-1], cfg["sma_fast"]) is not None \
                and sma(closes[:-1], cfg["sma_fast"]) <= sma(closes[:-1], cfg["sma_slow"]):
            signals.append(("KOP", "SMA20 korsade upp over SMA50"))
        if s_fast < s_slow and sma(closes[:-1], cfg["sma_fast"]) is not None \
                and sma(closes[:-1], cfg["sma_fast"]) >= sma(closes[:-1], cfg["sma_slow"]):
            signals.append(("SALJ", "SMA20 korsade ner under SMA50"))

    return {
        "name": name,
        "ticker": ticker,
        "synthetic": synthetic,
        "last": round(last, 2),
        "day_change_pct": round(day_change, 2),
        "rsi": round(r, 1) if r is not None else None,
        "sma_fast": round(s_fast, 2) if s_fast is not None else None,
        "sma_slow": round(s_slow, 2) if s_slow is not None else None,
        "drawdown_from_high_pct": round(drawdown, 2),
        "signals": [{"side": s, "reason": why} for s, why in signals],
    }


def main() -> int:
    cfg = load_json("config.json")
    watch = load_json("watchlist.json")["instruments"]

    results = []
    any_synthetic = False
    for inst in watch:
        ticker, name = inst["ticker"], inst["name"]
        closes = fetch_history(ticker, cfg["history_range"])
        synthetic = False
        if closes is None or len(closes) < cfg["sma_slow"] + 1:
            if not cfg.get("allow_synthetic_fallback", False):
                print(f"  hoppar over {ticker}: ingen data", file=sys.stderr)
                continue
            closes = synthetic_history(ticker)
            synthetic = True
            any_synthetic = True
        results.append(analyze_one(name, ticker, closes, synthetic, cfg))

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    flagged = [r for r in results if r["signals"]]

    # Laslig rapport
    tag = " [SYNTET-DATA]" if any_synthetic else ""
    print(f"\n=== Beslutsstod {now}{tag} ===")
    for r in results:
        mark = " [SYNTET]" if r["synthetic"] else ""
        sig = "; ".join(f"{s['side']}: {s['reason']}" for s in r["signals"]) or "-"
        print(f"  {r['name']:<22} {r['last']:>8}  dag {r['day_change_pct']:+5.1f}%  "
              f"RSI {str(r['rsi']):>5}  {sig}{mark}")

    # Kompakt push-rad
    if flagged:
        parts = []
        for r in flagged[:6]:
            sides = "/".join(sorted({s["side"] for s in r["signals"]}))
            parts.append(f"{r['name']} ({sides})")
        push = f"PUSH: {len(flagged)} signal(er): " + ", ".join(parts)
        if any_synthetic:
            push += " [SYNTET-DATA, exekvera ej]"
        else:
            push += " - forslag, exekvera manuellt i Avanza/Infront"
    else:
        push = "PUSH: Inga signaler idag"
    print(push)

    out = {
        "generated_at": now,
        "synthetic_data": any_synthetic,
        "results": results,
        "flagged": flagged,
        "push_line": push[len("PUSH: "):],
    }
    with open(os.path.join(HERE, "signals.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
