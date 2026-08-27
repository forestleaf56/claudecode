# Weekly App — Week of 2026-08-24

## Concept: **Fathom** — a cozy pocket aquarium

An ambient aquarium **simulation / idle** game. You keep a living tank of
procedurally-drawn fish that drift and school with gentle flocking behaviour.
Tap to sprinkle food; fish dart to it and grow happier. Idle "pearls" accrue
over time (and from feeding) which you spend in a shop to unlock new fish
species and décor (plants, coral, shipwreck, bubbler). A slow day→night cycle
changes the light and brings out bioluminescent species at night.

A new genre for the collection — the archive so far is Orbit Weaver (arcade),
Untangle (puzzle), Skyline (stacking), Thump (music app), Fives (word game).
This is the first **simulation / cozy idle** app, and it's chosen because it can
look genuinely beautiful with pure in-code visuals (gradient depths, caustics,
light rays, particles) — a strong fit for the production-quality bar.

## Front end (required production-ready shell)
- **Name / logo:** "FATHOM" in an elegant serif display, with a subtle wave/depth
  motif; tagline "a pocket ocean".
- **Title screen:** a LIVE animated underwater scene behind the wordmark —
  layered depth gradient, drifting god-rays, rising bubbles, silhouette fish —
  with styled PLAY · HOW TO · COLLECTION buttons (gold/teal, never plain boxes).
- **In-tank menu:** a slim top bar (pearls, day/night) + a SHOP / MENU overlay.
- **Palette:** deep navy→teal water, warm sand, amber/gold UI, bioluminescent
  cyan & magenta accents.

## Tech choices
- Single self-contained `index.html` — HTML + CSS + JS + Canvas 2D. No backend.
- No Supabase / no Gemini API → **no `api/` folder**, no Vercel serverless setup.
- Tank state (fish owned, pearls, décor, day-time) saved in `localStorage`.
- All visuals generated in code (no external assets). Mobile-first, full-viewport
  responsive canvas, touch to feed, no scrolling.

## File structure
```
weekly-apps/current/
  index.html   <- the whole game
  PLAN.md      <- this file
```

## Build checklist (Mon–Thu increments + daily 14:00 polish passes)
- [x] Mon: concept + plan; production-ready animated TITLE SCREEN + menu — live
      underwater canvas (depth gradient, drifting god-rays, rising bubbles,
      silhouette fish), serif FATHOM wordmark, styled gold/teal buttons, How-to +
      Collection modals, and Dive-In → tank placeholder. Verified in browser, no JS errors.
- [x] Tue: the living tank — procedural fish (3 starter species incl. a glowing
      neon tetra) that swim with gentle wander + edge-avoidance and face their
      heading; sandy substrate with swaying weeds; reuses the animated water
      (gradient, god-rays, bubbles). Dive In → live tank + pearls top bar.
      Verified in browser, no JS errors.
- [x] Wed: interaction + economy — tap the water to drop food (pellets sink; fish
      seek + eat them), pearls accrue over time (with tank size) and +2 per bite; a
      ☰ menu → SHOP to buy any of the 5 species (adds a fish, deducts pearls, Buy
      greys out when unaffordable); pearls + owned fish persist in localStorage.
      Verified: feed/economy/shop/reload-persistence all work, no JS errors.
- [x] Thu: day↔night cycle (~90s) — the water lerps day↔night, god-rays fade after
      dark, a ☀/🌙 indicator in the top bar, and glowing species (neon tetra,
      lanternfish) bioluminesce at night. A real COLLECTION screen (species cards
      with in-tank counts; unowned dimmed), reachable from the title and the menu.
      Verified in browser (day + night + collection), no JS errors.
      (Ambient sound + extra species left for the 14:00 pass.)

## Friday readme notes
- Self-contained single index.html, Canvas 2D. NO Supabase / NO Gemini API → no API
  keys, no env vars, no api/ folder / Vercel setup. Runs by opening index.html.
- Fathom is a cozy pocket aquarium: tap the water to feed fish (earns pearls),
  pearls also accrue over time; open ☰ → Shop to buy species & décor; Collection
  catalogues your fish; a day/night cycle brings out glowing fish at night. Saves
  automatically to localStorage.
- [ ] Ongoing (14:00 passes): richer graphics (god-rays, caustics, particles),
      more species/décor/content, and title/menu refinement.

## Status notes
- Mon 2026-08-24: first week under the raised production-quality bar + twice-daily
  runs. Plan + a real animated title screen done in this catch-up/afternoon pass.
- No API keys or env vars required — Friday readme will just need play instructions.
