# Weekly App — Week of 2026-08-10

## Concept: **Thump** — a pocket drum machine

A creative music-maker **app** (not a game). Thump is a step sequencer: a grid
of pads where rows are drum sounds (kick, snare, hi-hat, clap…) and columns are
16 steps in a bar. Tap pads to switch steps on/off, hit play, and it loops your
beat with a moving playhead. Adjust the tempo, clear or randomize, and save your
pattern. All sounds are synthesized in the browser — no audio files needed.

Deliberately different from the archive so far (Orbit Weaver = space arcade,
Untangle = puzzle, Skyline = stacking arcade — all canvas games). This week is a
**creative/utility app** with an HTML/CSS interface and a real toolbar/menu.

## Front end (required polished shell)
- **Name / logo:** "THUMP" wordmark (heavy, punchy) with a small speaker/wave mark.
- **App shell:** a header with the logo, a **toolbar/menu** (Play/Stop · Tempo ·
  Clear · Random · Save/Load · Kit), and the step grid as the main surface.
- **Palette:** dark studio background, warm orange/amber accents for active pads,
  a bright playhead column.

## Tech choices
- Single self-contained `index.html` — HTML + CSS (grid layout) + JS + **WebAudio**
  (synthesized kick/snare/hat/clap; no samples). No backend.
- No Supabase / no Gemini API → **no `api/` folder**, no Vercel serverless setup.
  Deploy = open the file or drop it on any static host.
- Pattern + tempo saved via `localStorage`.
- Mobile-first: responsive CSS grid of pads sized for thumbs, no scrolling, works
  in portrait; audio unlocked on first tap.

## File structure
```
weekly-apps/current/
  index.html   <- the whole app
  PLAN.md      <- this file
```

## Build checklist (Mon–Thu, small daily increments)
- [x] Mon: concept + plan; minimal `index.html` app shell skeleton (THUMP logo +
      wave mark header, toolbar placeholder, grid surface placeholder, responsive
      HTML/CSS). Boots clean on mobile, no JS. No audio/logic yet.
- [ ] Tue: audio engine — WebAudio synths for kick/snare/hi-hat/clap and a
      step clock that plays through 16 steps at a set tempo; Play/Stop.
- [ ] Wed: the step grid UI — instrument rows × 16 columns, tap to toggle steps,
      moving playhead highlight, tempo control; wire grid to the engine.
- [ ] Thu: **logo + menu/toolbar** polish (Play/Stop, Tempo, Clear, Random,
      Save/Load), pattern persistence (localStorage), visual/sound polish; mobile test.

## Status notes
- Mon 2026-08-10: plan + skeleton only, per the small-increment routine.
- First app under the "all genres / app types" rule — a creative app, not a game.
- Polished front end (logo + toolbar/menu) is an explicit checklist item (Thu).
- No API keys or env vars required — Friday readme will just need usage instructions.
