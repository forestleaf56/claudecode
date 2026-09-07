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
- [ ] Tue: the symmetry canvas — touch/drag to paint strokes mirrored across N
      sectors (kaleidoscope), adjustable symmetry count, brush size, a color, and a
      Clear button. Smooth, mobile-first drawing.
- [ ] Wed: palettes + Bloom generator — curated iridescent palettes, a brush/tool
      selector, and a **Bloom** button that seeds a full procedural symmetric
      composition from random curves/dots. Undo.
- [ ] Thu (production-ready front end): the GALLERY — Save the current piece to
      localStorage (thumbnail), reload/delete saved pieces; Export current canvas as
      a PNG; finalize the title screen + menu polish.
- [ ] LONGEVITY (Tue–Thu + 14:00 passes): guarantee endless use — infinite generative
      parameter space (symmetry × palette × brush × seed), a growing saved gallery,
      the Bloom randomizer, multiple tools/modes, and export/share. Add breadth
      (more palettes, brush kinds, animation/mirror modes) as budget allows.
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
  parameter space + a growing personal gallery. Today: plan + a minimal animated
  title-screen skeleton only.
