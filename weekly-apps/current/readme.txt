MIRRORBLOOM — a kaleidoscopic generative art studio
Week of 2026-09-11

================================================================
WHAT IT IS
================================================================
Mirrorbloom is a pocket creative toy for making symmetric, glowing art. You
paint with radial mirror symmetry — every stroke is reflected across the
sectors, so a single finger-drag blooms into a mandala. A Bloom button seeds
a whole procedural composition with one tap, a Daily bloom gives everyone the
same date-seeded piece each day, and a Living mode slowly spins your art into
a mesmerizing kaleidoscope. Save pieces to a gallery, export PNGs, and share
compact seed codes that reproduce any bloom exactly. Everything is drawn in
code — no images, no accounts, no downloads.

================================================================
HOW TO RUN
================================================================
Just open index.html in any modern browser (desktop or mobile). It is a
single self-contained file — no server, no build step, no install.
- On a phone: open the file (or host it anywhere static) and add to home
  screen for a full-screen feel.
- Nothing to configure. No API keys, no environment variables, no backend.

================================================================
HOW TO USE
================================================================
1. Press CREATE on the title screen.
2. DRAG on the canvas to paint. Every stroke is mirrored across the sectors
   into a symmetric bloom; faint guide spokes fade in to show the structure.
3. Use the toolbar (scrolls sideways on small screens):
     symmetry  - tap to cycle sectors (6 / 8 / 12 / 16 / 24)
     mirror    - toggle kaleidoscope reflection on/off
     palette   - cycle 10 curated colour palettes
     brush     - cycle brush size (fine / medium / bold)
     kind      - cycle brush kind (line / dots / ribbon)
     ❋ bloom   - generate a random procedural piece
     📅 daily  - the same date-seeded piece for everyone today
     🌀 living - auto-rotate the piece into a live kaleidoscope
                 (tap the canvas or the button to stop)
     ↶ undo    - remove the last stroke or bloom
     🗑 clear  - start over
     🔗 code   - copy this bloom's share code, or paste one to reproduce it
     💾 save   - keep the current piece in your gallery
     ⤓ export  - download the canvas as a PNG
   Use ☰ (top-left) to return to the title.

================================================================
SHARE CODES
================================================================
Every generated bloom has a short code (e.g. 3k7f9.2.4.1.0). Open 🔗 code to
copy yours, or paste a friend's and press Grow to recreate the exact same
piece — same seed, symmetry, palette, mirror and brush. Great for sharing a
favourite bloom or comparing today's Daily.

================================================================
FEATURES
================================================================
- Radial mirror-symmetry painting with an optional kaleidoscope reflection.
- 5 symmetry counts, 10 palettes, 3 brush kinds, adjustable brush size —
  an effectively endless combination space, so it never runs dry.
- One-tap Bloom generator + a deterministic Daily bloom (a reason to return).
- Living auto-rotate mode for a mesmerizing spinning kaleidoscope.
- A saved gallery (tap to reload a piece, delete with the ✕) and PNG export.
- Shareable, reproducible seed codes.
- Iridescent additive glow, a fading symmetry guide, and an animated title.
- Everything saves automatically to your browser's localStorage.

================================================================
TECH
================================================================
- Single self-contained index.html: HTML + CSS + JavaScript + Canvas 2D.
- No backend, no Supabase, no Gemini API — so NO API keys, NO env vars, and
  NO api/ folder / Vercel serverless setup are needed.
- Mobile-first, full-viewport responsive canvas, touch to paint, no scrolling.
- Gallery saved to localStorage under 'mirrorbloom_gallery'.

Paint with symmetry. Make light bloom.
