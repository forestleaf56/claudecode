# Avanza beslutsstöd (semi-automatiserat)

Hämtar svensk kursdata för en bevakningslista, beräknar enkla indikatorer och
genererar **köp-/säljkandidater** som skickas som push-notis. **Inga order läggs
automatiskt** — du utför affären själv i Avanza-appen eller Infront Active Trader.

## Filer

| Fil | Roll |
| --- | --- |
| `analyze.py` | Hämtar kurser, beräknar SMA/RSI/drawdown, genererar signaler, skriver `PUSH:`-rad + `signals.json` |
| `watchlist.json` | Dina instrument (Yahoo-tickers idag; Avanza orderbookId senare) |
| `config.json` | Signaltrösklar (RSI-nivåer, SMA-perioder, drawdown, historiklängd) |
| `signals.json` | Genereras vid varje körning — senaste utfall i maskinläsbar form |

## Kör manuellt

```bash
python3 avanza_signals/analyze.py
```

Sista raden börjar med `PUSH:` och är den som routinen skickar som notis.

## Datakälla och nätpolicy

Datakällan väljs i prioritetsordning av `analyze.py`:

1. **`market_data.json` (riktig data via WebSearch)** — primär källa idag.
   Miljöns egress-policy blockerar direkta kurskällor (Yahoo/Stooq/Avanza → 403),
   men harness-verktyget **WebSearch** når en allowlistad sök-backend och
   returnerar riktiga siffror (pris, dags-/vecko-/månadsförändring, glidande
   medelvärden, analytikers riktkurser). Routinerna samlar in detta varje körning
   och skriver `market_data.json`. Detta är **inte** ett kringgående av egress —
   det är en tillåten kapabilitet. Notera att sökdata kan vara **fördröjd/ungefärlig**;
   den är alltid beslutsunderlag att verifiera i Avanza/Infront.
2. **Yahoo Finance-serie** — `fetch_history()` beräknar SMA20/50, RSI14 och
   drawdown från en riktig daglig serie. Ligger vilande tills egress öppnas eller
   en Avanza-MCP kopplas in.
3. **Syntetisk fallback** — deterministisk, märkt `[SYNTET]`, får **aldrig**
   användas för riktiga affärer. Finns bara så pipelinen kan verifieras offline.

`market_data.json`-schema (alla fält utom nyckeln valfria; utelämna det du inte
hittar — gissa aldrig):

```json
{
  "as_of": "YYYY-MM-DD",
  "source": "websearch",
  "instruments": {
    "ERIC-B.ST": {
      "last": 91.5, "day_change_pct": -1.59, "week_change_pct": -5.96,
      "month_change_pct": -18.27, "sma_fast": 0, "sma_slow": 0,
      "support": 0, "resistance": 0,
      "analyst_target_low": 120, "analyst_target_high": 128,
      "analyst_rating": "text", "pe": 12.18, "div_yield_pct": 0
    }
  }
}
```

För **ännu** bättre data (realtid + dina faktiska positioner): öppna egress för en
kurskälla i miljöns nätpolicy (styrs när miljön skapas — se
https://code.claude.com/docs/en/claude-code-on-the-web), eller koppla in Avanza-MCP
(nedan).

## Byta till Avanza-MCP (riktig data + positioner)

1. Distribuera/skaffa en Avanza-MCP-server (extern hosting — den kan inte ligga i
   denna efemära molndator). Se `../.mcp.json.example`.
2. `claude mcp add --transport http avanza https://din-server/mcp`, verifiera med
   `/mcp` att den är **connected** och att verktygen syns.
3. I `analyze.py`: byt `fetch_history()` mot ett anrop till Avanza-MCP:s
   kursverktyg, och lägg ev. till ett steg som läser dina positioner för
   position-medveten analys.

## Routines (schemalagda körningar)

Två Routines kör på börsdagar i en färsk session som hämtar denna branch, samlar
in färsk data via WebSearch, skriver `market_data.json`, kör `analyze.py` och
pushar `PUSH:`-raden. Inbyggd push-notis är påslagen som backstop.

| Routine | Cron (UTC) | Svensk tid (sommar) |
| --- | --- | --- |
| Före öppning | `30 6 * * 1-5` | 08:30 |
| Efter stängning | `45 15 * * 1-5` | 17:45 |

- Ändra schema/pausa: hantera Routinen i claude.ai (Routines) eller via
  `update_trigger`/`delete_trigger`.
- **DST-varning:** cron är i UTC och fast. `45 15` = 17:45 under sommartid
  (CEST); på vintern (CET) blir det 16:45. Justera vid tidsomställning om exakt
  klockslag spelar roll.
- **Connector-varning:** routine-sessioner skapade via API:t saknar MCP-connector-
  verktyg. När du kopplat in Avanza-MCP och vill att routinen ska använda den:
  skapa/återskapa Routinen från claude.ai Routines-UI:t (eller från en session som
  håller connectorn) så att `mcp__avanza__*`-verktygen följer med.

## Skyddsräcken

- Read-only: inga order-verktyg exponeras; skriptet lägger aldrig order.
- Human-in-the-loop: notisen är beslutsunderlag, exekvering sker manuellt.
- Syntetisk data märks tydligt och notisen säger "exekvera ej".
- Kör i torrläge (bara notiser) några dagar innan du litar på signalerna.
