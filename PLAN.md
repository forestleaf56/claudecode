# Avanza beslutsstöd – semi-automatiserat

Ett verktyg som screenar svenska + globala aktier och fonder (hela
Avanza-utbudet), rankar köp-/sälj-/bevaka-kandidater och levererar en stilren
`index.html` in i Claude-konversationen på schema. **Inga order läggs
automatiskt** — du utför affären själv i Avanza-appen eller Infront Active
Trader. Beslutsunderlag, **inte** finansiell rådgivning.

## Så fungerar det

1. **Datainsamling via WebSearch.** Miljöns nätpolicy blockerar direkta
   kurskällor, så Claudes `WebSearch` (en tillåten kapabilitet) hämtar riktiga
   siffror och skriver `avanza_signals/market_data.json`. Sökdata kan vara
   fördröjd/ungefärlig; saknade värden lämnas som `–` (aldrig gissade).
2. **Analys.** `analyze.py` normaliserar datan och genererar signaler
   (KÖP/SÄLJ/BEVAKA) med motiveringar, inkl. en "rekyl-kandidat"-tagg för
   nedtryckta namn med uppsida.
3. **Rapport.** `make_html.py` bygger `index.html`: topp-kort (tydligaste
   köp/sälj för aktier resp. fonder) och en färgkodad, enhetlig ranking.
4. **Leverans.** Två Routines kör på börsdagar (08:30 och 17:45 svensk tid) och
   skickar `index.html` in i konversationen.

## Rankingmetod (enhetlig, geografineutral)

- **Aktier:** uppsida till analytikernas **konsensus-snitt** — samma mått för
  alla (inte Morningstar fair value, inte bearish lågpunkt).
- **Fonder:** faktisk **1-årsavkastning**. Morningstar-stjärnor visas men
  påverkar inte rankingen (kategori-relativa).
- Starkast köprekommendation först; högrisk tonas ned och läggs sist.

## Skyddsräcken

- Inga order-verktyg finns; skriptet lägger aldrig order.
- Human-in-the-loop: allt verifieras och exekveras manuellt av användaren.
- Saknade värden märks `–`; syntetisk fallback-data märks tydligt och får ej
  handlas på.

## Detaljer

Se `avanza_signals/README.md` för filer, fält, körkommandon och Routine-schema.
