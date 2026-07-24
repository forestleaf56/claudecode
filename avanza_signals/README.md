# Avanza beslutsstöd (semi-automatiserat)

Screening av svenska + globala aktier och fonder (hela Avanza-utbudet). Rankar
**köp-/sälj-/bevaka-kandidater** och levererar en stilren `index.html` in i
Claude-konversationen. **Inga order läggs automatiskt** — du utför affären själv
i Avanza-appen eller Infront Active Trader. Beslutsunderlag, inte rådgivning.

## Filer

| Fil | Roll |
| --- | --- |
| `watchlist.json` | Instrumenten som screenas (aktier + fonder, `type: fond`) |
| `config.json` | Signaltrösklar (analytiker-uppsida, dagsfall, RSI-nivåer m.m.) |
| `analyze.py` | Läser marknadsdata, genererar signaler, skriver `signals.json` + `PUSH:`-rad |
| `make_html.py` | Bygger `index.html` (topp-kort, färgkodad ranking) från `signals.json` |
| `market_data.example.json` | Referens/exempel på datastrukturen |
| `signals.json`, `market_data.json`, `index.html` | Genereras vid varje körning (git-ignorerade) |

## Kör manuellt

```bash
python3 avanza_signals/analyze.py     # skriver signals.json + PUSH-rad
python3 avanza_signals/make_html.py   # skriver index.html
```

## Datakälla

All data hämtas via **WebSearch** (Claude-harnessens sök-backend) och skrivs till
`market_data.json`. Miljöns egress-policy blockerar direkta kurskällor, så
WebSearch är den enda externa vägen — det är en tillåten kapabilitet, inte ett
kringgående. Sökdata kan vara **fördröjd/ungefärlig**; verifiera alltid i
Avanza/Infront före affär. Saknade värden lämnas som `–` (aldrig gissade). Om
ingen data finns för en aktie används en tydligt märkt **syntetisk** fallback
enbart för att kunna testa pipelinen offline (får aldrig handlas på).

## Rankingmetod (enhetlig, geografineutral)

- **Aktier:** rankas på uppsida till analytikernas **konsensus-snitt**
  (`analyst_target_avg`), samma mått för alla. Inte Morningstar fair value, inte
  bearish lågpunkt.
- **Fonder:** rankas på **faktisk 1-årsavkastning** (`one_year_pct`).
  Morningstar-stjärnor visas men påverkar inte rankingen (kategori-relativa).
- Sortering: starkast köprekommendation först; högrisk (`risk_high`) tonas ned
  och läggs sist. Topp-korten väljer tydligaste köp/sälj för aktier resp. fonder
  ur hela universumet.

## Nyckelfält i `market_data.json`

Aktier: `last`, `currency`, `analyst_target_avg`, `analyst_target_low/high`,
`analyst_rating`, `pe`, `div_yield_pct`, `month_change_pct`, `year_change_pct`,
`support`, `resistance`, `rating_signal`, `rating_note`, `risk_high`.

Fonder (`type: fond`): `category`, `market` ("Sverige" = Sverige-fokuserad),
`one_year_pct`, `fee_pct`, `risk_1_7`, `morningstar_stars`, `rating_signal`,
`rating_note`, `risk_high`.

## Routines (schemalagda körningar)

Två Routines kör på börsdagar in i konversationen: hämtar färsk data via
WebSearch, skriver `market_data.json`, kör `analyze.py` + `make_html.py` och
skickar `index.html` via `SendUserFile`.

| Routine | Cron (UTC) | Svensk tid (sommar) |
| --- | --- | --- |
| Före öppning | `30 6 * * 1-5` | 08:30 |
| Efter stängning | `45 15 * * 1-5` | 17:45 |

- Hantera schema/pausa i claude.ai (Routines) eller via `update_trigger` /
  `delete_trigger`.
- **DST:** cron är fast UTC. `45 15` = 17:45 sommartid (CEST); vintertid blir det
  16:45.

## Skyddsräcken

- Inga order-verktyg exponeras; skriptet lägger aldrig order.
- Human-in-the-loop: allt är beslutsunderlag, exekvering sker manuellt.
- Saknade värden märks `–`; syntetisk data märks tydligt och får ej handlas på.
