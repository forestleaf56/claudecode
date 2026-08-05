# Weekly App — Week of 2026-08-03

## Concept: **Skyline**

A one-tap tower-stacking arcade game. A glowing building slab slides back and
forth across the top of the screen; **tap to drop it** onto the tower below. Any
part hanging past the slab beneath gets sliced off and falls away, so each slab
is as wide as your timing is good. Stack as high as you can — the camera rises
with your tower and a neon city skyline builds beneath you. Miss completely and
it's game over.

One thumb, instantly understandable, endlessly replayable. A different genre from
the archive so far (Orbit Weaver = space arcade, Untangle = puzzle).

## Front end (required polished shell)
- **Name / wordmark:** "SKYLINE", tall condensed neon letters.
- **Title screen:** animated wordmark over a parallax city silhouette + drifting
  stars; tagline "how high can you build?".
- **Menu:** PLAY · HOW TO PLAY · best-height readout. Clean, thumb-sized buttons.
- **Palette:** deep night-blue → indigo background, cyan/magenta neon slabs,
  warm window lights on stacked floors.

## Tech choices
- Single self-contained `index.html` — HTML + CSS + JS + Canvas 2D. No backend.
- No Supabase / no Gemini API → **no `api/` folder**, no Vercel serverless setup.
  Deploy = open the file or drop it on any static host.
- Best height saved via `localStorage`.
- Mobile-first: full-viewport responsive canvas, devicePixelRatio scaling,
  tap/click input, no scrolling.

## File structure
```
weekly-apps/current/
  index.html   <- the whole game
  PLAN.md      <- this file
```

## Build checklist (Mon–Thu, small daily increments)
- [ ] Mon: concept + plan; minimal `index.html` skeleton (title wordmark, responsive
      DPR canvas, boot/resize). No gameplay yet.
- [x] Tue: core mechanic — sliding slab, tap to drop, overhang slicing (off-cuts
      fall away), tower grows, eased upward camera scroll, game over on a full miss;
      per-floor color gradient. Verified in browser, no JS errors.
- [x] Wed: scoring + perfect-drop combo (near-exact alignment keeps full width,
      builds combo, bonus points + ring flash), per-floor lit windows, best height &
      best score saved (localStorage), tumbling-debris collapse on game over.
      Verified in browser (fixed an undefined-var bug), no JS errors.
- [ ] Thu: **title screen + menu** (PLAY / HOW TO PLAY / best) with the SKYLINE
      wordmark, plus sound (WebAudio) + haptics and general polish; mobile test.

## Status notes
- Mon 2026-08-03: plan + skeleton only, per the small-increment routine.
- Polished front end (title screen + menu) is an explicit checklist item (Thu),
  per the standing requirement.
- No API keys or env vars required — Friday readme will just need play instructions.
