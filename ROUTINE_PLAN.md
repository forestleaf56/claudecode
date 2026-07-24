# Routine-plan – Avanza beslutsstöd (Claude Code molnsession)

Beskriver hur det schemalagda beslutsstödet är uppsatt i Claude Code-molnet.
Semi-automatiserat: verktyget hämtar data, analyserar och levererar en rapport —
**inga order läggs**. Du exekverar själv i Avanza/Infront. Beslutsunderlag, inte
finansiell rådgivning.

## Session och miljö

- Kör i en Claude Code-molnsession (efemär container; repo klonas per session).
- Routinerna är **self-bind**: de fyrar in i den befintliga sessionen och
  återupptar konversationen (inte en ny session per körning). Överlever omstart;
  om sessionen avslutas helt måste de pekas om.
- Miljöns nätpolicy blockerar direkta kurskällor → all data hämtas via
  **WebSearch** (en tillåten kapabilitet), aldrig via API/MCP.

## Routines (schemalagda triggers)

| Routine | Cron (UTC) | Svensk tid (sommar) | Trigger-ID |
| --- | --- | --- | --- |
| Före öppning | `30 6 * * 1-5` | 08:30 | `trig_0177qBX3Sdyfe2LTCfuFj1p5` |
| Efter stängning | `45 15 * * 1-5` | 17:45 | `trig_011gArv9ez9Nd8m7RRbxgbhw` |

- Kör vardagar (mån–fre). **DST:** cron är fast UTC → tiderna gäller sommartid;
  vintertid blir de en timme tidigare (07:30 / 16:45).
- Hantera/pausa i claude.ai (Routines) eller via `update_trigger` /
  `delete_trigger`.

## Vad varje körning gör

1. **Hämta kod:** `git fetch` + `checkout` + `pull --ff-only` på kodgrenen
   `claude/avanza-mcp-trading-setup-0x0n8k`.
2. **Datainsamling:** WebSearch för varje instrument i `avanza_signals/watchlist.json`;
   skriver `avanza_signals/market_data.json`. Gissar aldrig siffror (saknat = `–`).
3. **Analys:** `python3 avanza_signals/analyze.py` → signaler (KÖP/SÄLJ/BEVAKA)
   + rekyl-tagg för nedtryckta namn med uppsida.
4. **Rapport:** `python3 avanza_signals/make_html.py` → `avanza_signals/index.html`
   (topp-kort + färgkodad, enhetlig ranking).
5. **Publicering:** `bash avanza_signals/publish_report.sh` — force-pushar samma
   single-commit (bara `index.html`) till **båda**:
   - `forestleaf56/claudecode` gren `avanza-report`
   - `forestleaf56/avanza` gren `main`
   Båda hålls på exakt 1 commit (skrivs över — ingen historik-anhopning).
6. **Leverans i chatten:** `SendUserFile` skickar `index.html` (renderad) in i
   konversationen.

## Rankingmetod (enhetlig, geografineutral)

- **Aktier:** uppsida till analytikernas **konsensus-snitt** (`analyst_target_avg`).
- **Fonder:** faktisk **1-årsavkastning**. Morningstar-stjärnor visas men
  påverkar inte rankingen.
- Starkast köprekommendation först; högrisk tonas ned och läggs sist. Topp-korten
  väljer tydligaste köp/sälj för aktier resp. fonder ur hela universumet.

## Skyddsräcken

- Inga order-verktyg finns; skriptet lägger aldrig order.
- Human-in-the-loop: allt verifieras och exekveras manuellt.
- Saknade värden märks `–`; syntetisk fallback-data märks tydligt och får ej
  handlas på.

Se `avanza_signals/README.md` för filer, fält och körkommandon.
