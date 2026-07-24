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

Standardkällan är publik (Yahoo Finance, svenska tickers `*.ST`). **Denna miljös
egress-policy blockerar externa kurskällor (403)**, så skriptet faller
automatiskt tillbaka på en **deterministisk syntetisk serie** som märks
`[SYNTET]` — den bevisar att rörledningen fungerar men får **aldrig** användas för
riktiga affärer. För riktig data, välj ett:

1. **Öppna egress** för kurskällan i miljöns nätpolicy (styrs när miljön skapas —
   se https://code.claude.com/docs/en/claude-code-on-the-web), eller
2. **Koppla in Avanza-MCP** (nedan) och läs riktig marknadsdata + positioner.

## Byta till Avanza-MCP (riktig data + positioner)

1. Distribuera/skaffa en Avanza-MCP-server (extern hosting — den kan inte ligga i
   denna efemära molndator). Se `../.mcp.json.example`.
2. `claude mcp add --transport http avanza https://din-server/mcp`, verifiera med
   `/mcp` att den är **connected** och att verktygen syns.
3. I `analyze.py`: byt `fetch_history()` mot ett anrop till Avanza-MCP:s
   kursverktyg, och lägg ev. till ett steg som läser dina positioner för
   position-medveten analys.

## Routine (schemalagd körning)

En Routine kör detta varje börsdag **17:45 svensk tid** (cron `45 15 * * 1-5`,
UTC) i en färsk session som hämtar denna branch, kör `analyze.py` och pushar
`PUSH:`-raden. Inbyggd push-notis är påslagen som backstop.

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
