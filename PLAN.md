# Plan: Avanza MCP + semi-automatiserat beslutsstöd för trading

Mål: koppla en **Avanza MCP-server** till Claude Code, låta Claude hämta
svensk marknadsdata, analysera dina positioner och generera köp-/säljsignaler,
och sedan **notifiera dig** – aldrig lägga order automatiskt. Du utför själva
affären manuellt i Avanza-appen eller i Infront Active Trader.

---

## Status (2026-07-24): pipeline + Routine + push är byggda

Implementerat och verifierat i molndatorn:

- **Analys-pipeline** i `avanza_signals/` (`analyze.py`, `watchlist.json`,
  `config.json`) — hämtar kurser, beräknar SMA/RSI/drawdown, genererar köp-/
  säljkandidater och en `PUSH:`-rad. Körd och verifierad.
- **Routine** `Avanza beslutsstod (borsdag, efter stangning)` — varje börsdag
  17:45 svensk tid (cron `45 15 * * 1-5`), färsk session som kör analysen och
  pushar. Inbyggd push påslagen. Avfyrad skarpt en gång för verifiering.
- **Push-notis** testad live (nådde telefonen).

**Kvarstår för riktig data** (en av två, ditt val):
1. Öppna miljöns egress-policy för kurskällan, eller
2. Koppla in en extern Avanza-MCP-server (`.mcp.json.example` finns).

Tills dess kör pipelinen på tydligt märkt **syntetisk** data så att allt rör sig.
Detaljer i `avanza_signals/README.md`.

---

## 0. Viktiga förbehåll (läs först)

Dessa punkter påverkar hela planen och bör bekräftas innan du sätter igång.

1. **`https://mcpmarket.com` är en katalog/marknadsplats – inte en MCP-endpoint.**
   Du kan inte peka `claude mcp add` mot den och få verktyg. Du behöver en
   faktisk server-URL som pratar MCP över HTTP eller SSE, t.ex.
   `https://din-avanza-mcp.example.com/mcp`. Den URL:en är antingen:
   - en server du själv distribuerar (rekommenderas – full kontroll), eller
   - en tredjeparts-hostad Avanza-MCP du hittat via mcpmarket och litar på.

2. **Avanza har inget officiellt publikt API.** All programmatisk åtkomst sker
   via inofficiella, reverse-engineerade endpoints (samma som appen använder).
   Det kräver inloggning med användarnamn/lösenord + TOTP/BankID och kan strida
   mot Avanzas användarvillkor. Läs villkoren och bedöm risken själv innan du
   automatiserar något mot ditt riktiga konto.

3. **Inga automatiska ordrar.** Planen är medvetet "human-in-the-loop": Claude
   får läsa och analysera, men order läggs alltid manuellt av dig. Det håller
   nere den finansiella och juridiska risken och är den enda inriktning den här
   planen stödjer.

4. **Detta är verktygsstöd, inte finansiell rådgivning.** Signaler Claude
   genererar är beslutsunderlag, inte rekommendationer att lita blint på.

---

## 1. Skaffa/distribuera en Avanza MCP-server

Välj ett av spåren:

**Spår A – egen server (rekommenderas):** distribuera en MCP-server som
exponerar Avanza-data. Den bör:
- autentisera mot Avanza med dina credentials + TOTP, lagrade som
  miljövariabler på servern (aldrig i klartext i repo eller i klienten),
- exponera verktyg av typen `get_positions`, `get_account_overview`,
  `search_instrument`, `get_market_data`, `get_orderbook`, `get_chart_data`,
- vara **read-only** (inga order-verktyg) i första versionen.

**Spår B – tredjepartsserver:** hittad via mcpmarket. Granska källkod och
var noga med var dina Avanza-credentials tar vägen. Föredra en du kan self-hosta.

---

## 2. Lägg till servern i Claude Code

Remote HTTP-server:

```bash
claude mcp add --transport http avanza https://din-avanza-mcp.example.com/mcp
```

Med autentiseringsheader (om servern kräver bearer-token):

```bash
claude mcp add --transport http avanza https://din-avanza-mcp.example.com/mcp \
  --header "Authorization: Bearer <TOKEN>"
```

SSE i stället för HTTP:

```bash
claude mcp add --transport sse avanza https://din-avanza-mcp.example.com/sse
```

Scope styr var konfigurationen sparas:
- `-s local` (default) – bara detta projekt, bara du
- `-s user` – alla dina projekt
- `-s project` – delas i repo via `.mcp.json` (lägg **aldrig** hemligheter här)

Projekt-scope motsvarar en `.mcp.json` i repo-roten:

```json
{
  "mcpServers": {
    "avanza": {
      "type": "http",
      "url": "https://din-avanza-mcp.example.com/mcp"
    }
  }
}
```

---

## 3. Verifiera att verktygen är aktiva

1. Kör `/mcp` i Claude Code-sessionen. Servern `avanza` ska visa status
   **connected**. Använder servern OAuth sköter du inloggningen här.
2. Lista verktygen (via `/mcp` eller genom att be Claude lista tillgängliga
   `avanza`-verktyg). Bekräfta att verktyg för svensk marknadsdata finns, t.ex.
   `search_instrument`, `get_market_data`, `get_positions`.
3. Rök-test: be Claude hämta en känd svensk aktie (t.ex. sök "Investor B" och
   hämta senaste kurs) och verifiera att data returneras.

---

## 4. Beslutsstöds-workflow (semi-automatiserat)

Flödet, steg för steg:

1. **Datainsamling** – Claude anropar `avanza`-verktygen för att hämta dina
   positioner, kontosaldo och aktuell marknadsdata för dina innehav + bevakningar.
2. **Analys** – Claude beräknar det du definierar: avkastning per position,
   allokering/koncentration, enkla tekniska signaler (t.ex. glidande medelvärde,
   RSI), avstånd till dina egna stop-/målnivåer.
3. **Signalgenerering** – regler du bestämmer i förväg, t.ex. "flagga om ett
   innehav faller > X % från topp" eller "flagga om RSI < 30". Utfallet blir en
   lista med **kandidater**, inte beslut.
4. **Notifiering** – Claude skickar en push-notis/sammanfattning till dig med
   signalen, motiveringen och underlaget. **Ingen order läggs.**
5. **Manuell exekvering** – du granskar och genomför själv affären i
   Avanza-appen eller Infront Active Trader.

### Körning på schema (valfritt)

För att göra det "semi-automatiserat" kan analysen köras återkommande:
- En **Routine/schemalagd trigger** kör analys-prompten t.ex. varje börsdag
  före öppning och efter stängning.
- Varje körning avslutas med en **push-notifiering** om (och bara om) en signal
  utlöstes, så du slipper brus.
- Skyddsräcke: notistexten säger alltid uttryckligen "förslag – exekvera
  manuellt", och inga order-verktyg finns exponerade.

---

## 5. Risker och skyddsräcken

| Risk | Skydd |
| --- | --- |
| Credentials läcker | Hemligheter bara som env-vars på servern; aldrig i repo/`.mcp.json` |
| Oavsiktlig order | Servern är read-only – inga order-verktyg finns |
| Avanza-villkor | Bekräfta villkor; håll frekvensen låg; egen risk |
| Dålig signal följs blint | Alltid human-in-the-loop; notis märks "beslutsunderlag" |
| Server nere / data-glapp | Rök-test + tydligt felmeddelande i notisen hellre än gissning |

---

## 6. Nästa steg (i den här ordningen)

1. Bestäm spår A eller B och skaffa en fungerande Avanza-MCP-URL.
2. `claude mcp add ... avanza ...` och `/mcp` för att verifiera connected.
3. Rök-test mot en svensk aktie.
4. Definiera dina signalregler (tröskelvärden, indikatorer, bevakningslista).
5. Bygg analys-prompten och testa den manuellt en gång.
6. Lägg analysen på schema med push-notifiering.
7. Kör i "torrläge" ett par dagar (bara notiser, inga affärer) innan du litar
   på signalerna.
