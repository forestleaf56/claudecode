# Weekly App — Week of 2026-09-07

## Concept: **Mirrorbloom** — a kaleidoscopic generative art studio

A pocket **creative toy / art app**. You paint with **radial mirror symmetry** —
every stroke is reflected across N sectors, so a single finger-drag blooms into a
symmetric mandala. A **Bloom** button seeds a whole procedural composition from
randomized curves, dots and palettes, giving endless one-tap art. Tune the
symmetry, brush, and palette; save pieces to a **gallery**; and **export a PNG**.

**A deliberate change of kind.** The archive is almost all games — Orbit Weaver
(arcade), Untangle (puzzle), Skyline (stacking), Thump (music app), Fives (word),
Fathom (cozy sim), Emberdelve (roguelike). This week is a **creative APP/TOY** — a
different category — and a generative one, chosen because it fits the **longevity**
bar perfectly: the parameter space is effectively infinite and the user's own saved
gallery keeps growing.

## Why it's endlessly replayable (LONGEVITY)
- **No content ceiling** — it responds to arbitrary input (draw anything) and to an
  effectively infinite generative parameter space (symmetry × palette × brush × seed).
- **One-tap endless generation** — the **Bloom** randomizer produces a fresh procedural
  mandala every press; you can chase "just one more" forever.
- **A growing personal collection** — save creations to a **gallery** in localStorage;
  reload, iterate, or delete them. The library grows the more you use it.
- **Breadth of tools/modes** — multiple symmetry counts, curated palettes, brush
  sizes/kinds, mirror on/off, background themes — lots to explore and combine.
- **Export / share** — download any piece as a PNG to keep or send.

## Front end (required production-ready shell)
- **Name / logo:** "MIRRORBLOOM" in a clean geometric display face with a small
  radial/petal glyph; tagline "paint with symmetry".
- **Title screen:** a LIVE, slowly rotating generative mandala behind the wordmark
  (in-code symmetric particles/petals on a deep indigo field) with styled CREATE ·
  HOW TO · GALLERY buttons (iridescent teal/magenta/gold, never plain boxes).
- **Studio UI:** a full-screen canvas + a slim tool bar (symmetry, palette, brush,
  Bloom, Clear, Save, Export) and a MENU overlay.
- **Palette:** deep indigo/near-black ground; iridescent teal, magenta, gold and
  violet accents; near-white text.

## Tech choices
- Single self-contained `index.html` — HTML + CSS + JS + Canvas 2D. No backend.
- No Supabase / no Gemini API → **no `api/` folder**, no Vercel serverless setup.
- Gallery (saved pieces as thumbnails/among data) + last settings in `localStorage`.
- Export via canvas → PNG data URL download (works when index.html is opened locally).
- Mobile-first: touch to paint, full-viewport responsive canvas, no scrolling. All
  visuals generated in code (no external assets).

## File structure
```
weekly-apps/current/
  index.html   <- the whole app
  PLAN.md      <- this file
```

## Build checklist (Mon–Thu increments + daily 14:00 polish passes)
- [ ] Mon: concept + plan; production-ready animated TITLE SCREEN + menu — live
      rotating generative mandala behind a geometric MIRRORBLOOM wordmark, styled
      iridescent CREATE / HOW TO / GALLERY buttons, How-to + Gallery modals, and
      CREATE → studio placeholder. Verify in browser, no JS errors. (Today: plan +
      skeleton only.)
- [x] Tue (done early in Mon 14:00 pass): the symmetry canvas — drag to paint strokes
      mirrored across N sectors with optional kaleidoscope reflection; adjustable
      symmetry (6/8/12/16/24), brush size (fine/medium/bold), iridescent auto-cycling
      colour, additive glow, and a Clear button. Smooth, mobile-first pointer drawing.
- [x] Wed (done early in Mon 14:00 pass): palettes + Bloom generator — 6 curated
      palettes, mirror toggle, brush selector, and a **Bloom** button (seeded mulberry32
      RNG) that generates a full procedural symmetric composition every press. Undo +
      stroke/bloom history with repaint.
- [x] Thu (done early in Mon 14:00 pass): the GALLERY — Save the current canvas to
      localStorage (PNG thumbnail, capped at 12, newest first), a grid view with tap-to-
      reload and per-item delete; Export the canvas as a PNG download. Title screen +
      studio chrome (top bar + scrollable toolbar) in place.
- [ ] LONGEVITY (Tue–Thu + 14:00 passes): guarantee endless use — infinite generative
      parameter space (symmetry × palette × brush × seed), a growing saved gallery,
      the Bloom randomizer, multiple tools/modes, and export/share.
      Progress: [x] 3 brush kinds (Tue) — line, beaded dots, bold ribbon — selectable
      and also varied by Bloom, multiplying the look-space. Still possible: more
      palettes, an animation/auto-rotate mode.
- [ ] GRAPHICS POLISH (14:00 passes): glow/additive blending, smooth strokes, subtle
      background gradients/particles, nice transitions, tasteful UI.

## Friday readme notes
- Self-contained single index.html, Canvas 2D. NO Supabase / NO Gemini API → no API
  keys, no env vars, no api/ folder / Vercel setup. Runs by opening index.html.
- (Fill in Friday: controls — drag to paint with symmetry, pick symmetry/palette/brush,
  Bloom for instant art, Save to gallery, Export PNG; saves to localStorage.)

## Status notes
- Mon 2026-09-07: chose a creative APP/TOY for category variety (archive is mostly
  games) and because a generative art studio is inherently endless — infinite
  parameter space + a growing personal gallery. Mon morning: plan + title skeleton.
  Mon 14:00 pass: the fresh window had budget to build the WHOLE studio — symmetry
  drawing, 6 palettes, mirror, brushes, the Bloom generator, undo, gallery
  (save/reload/delete) and PNG export — so Mirrorbloom is already fully usable.
  Tue–Thu + 14:00 passes now go to graphics polish and breadth (more brush kinds,
  palettes, modes) rather than core.
- A read-only debug hook (`window.__mb`, only active with the `#dbg` URL hash) is used
  by the headless test harness; inert during normal use.
