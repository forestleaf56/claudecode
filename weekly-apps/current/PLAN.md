# Weekly App — Week of 2026-07-20

## Concept: **Orbit Weaver**

A one-thumb mobile arcade game. Your ship is caught in the gravity of a planet
and orbits it automatically. **Tap (or click) to reverse your orbit direction**
and slingshot between planets. Collect energy orbs, chain combos, and survive as
asteroids drift in. One control, endless run, escalating difficulty.

Chosen because it is genuinely mobile-first (single-thumb, no buttons), visually
striking (neon on dark), self-contained (no backend), and has real depth
(gravity, combos, difficulty ramp) — "ambitious" without needing a server.

## Tech choices
- Single self-contained `index.html` — HTML + CSS + JS + Canvas 2D. No backend.
- No Supabase / no Gemini API needed, so **no `api/` folder** and no Vercel
  serverless setup. Deploy = open the file or drop it on any static host.
- High score persisted with `localStorage`.
- Mobile-first: full-viewport responsive canvas, devicePixelRatio scaling,
  touch + mouse input, no scrolling, safe-area aware.

## File structure
```
weekly-apps/current/
  index.html   <- the whole game
  PLAN.md      <- this file
```

## Build checklist (Mon–Thu)
- [x] Mon: concept + plan; playable core loop — orbit a planet, tap to reverse,
      travel to next planet, score, game over, restart. Mobile canvas + touch.
- [x] Tue: energy orbs to collect, combo multiplier, particle/trail juice,
      HUD (score, best, combo).
- [x] Wed: asteroids/hazards, difficulty ramp, sound (WebAudio blips), screen
      shake, start & game-over screens.
- [ ] Thu: polish pass, tune balance, mobile testing, fix bugs; confirm it runs
      offline from a single file. Note any setup steps for the Friday readme.

## Status notes
- Bootstrapped manually on Tue 2026-07-21 after the scheduled Mon/Tue autonomous
  runs failed to push. Core loop + Tuesday items (orbs, combo, juice, HUD) are in.
- No API keys or env vars required — readme just needs play instructions.
