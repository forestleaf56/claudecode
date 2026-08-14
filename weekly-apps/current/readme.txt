======================================================================
  THUMP  —  a pocket drum machine
  Weekly App · week of 2026-08-10
======================================================================

WHAT IT IS
----------
Thump is a tiny drum machine you play with your thumbs. It's a step
sequencer: a grid where each row is a drum sound and each column is one of
16 steps in a looping bar. Tap pads to switch beats on and off, press Play,
and Thump loops your groove with a moving playhead. All the drum sounds are
synthesized live in the browser — there are no audio files at all.

It's a single self-contained HTML file. No install, no account, no
internet connection required after loading.


HOW TO USE
----------
1. Open it (see "RUN IT" below).
2. You'll see four rows — KICK, SNR (snare), HAT, CLAP — each with 16 pads.
3. TAP a pad to turn that drum on for that step (tap again to turn it off).
4. Press PLAY. A highlight sweeps across the columns in time; every lit pad
   fires its sound as the playhead passes.
5. Drag the TEMPO slider to speed up or slow down (60–180 BPM).

TOOLBAR
-------
- PLAY / STOP  — start and stop the loop.
- TEMPO        — slider + BPM readout.
- CLEAR        — empty the whole grid to start fresh.
- RANDOM       — generate a musical beat instantly (great for inspiration).
- SAVE         — store the current pattern in a slot.
- LOAD         — recall your saved pattern.
- Your working beat also AUTO-SAVES, so it's still there next time you open it.

FEATURES
--------
- One-thumb, mobile-first step sequencer (portrait, full screen).
- Four synthesized voices (kick, snare, hi-hat, clap) — no samples.
- 16-step loop with an accurate WebAudio scheduler and moving playhead.
- Adjustable tempo, Clear, and one-tap Random beat generator.
- Save/Load a pattern, plus automatic save of your current work (localStorage).
- Color-coded pads, playhead hit-flashes, and a clean studio look.


RUN IT
------
Option A - on your phone or computer, no tools:
  Just open index.html in any modern browser (Chrome, Safari, Firefox,
  Edge). Double-click it, or drag it into a browser tab. Tap once to allow
  sound if your browser asks, then press Play.

Option B - add it to your phone home screen (feels like an app):
  Open index.html in your mobile browser, then use the browser's
  "Add to Home Screen" option. It runs full-screen and offline.

Option C - host it online (optional):
  Upload index.html to any static host (GitHub Pages, Netlify, Vercel,
  or any web server) and open the URL.

Note: browsers only start audio after you interact with the page, so the
first Play tap is what "unlocks" the sound — this is normal.


TECH / DEPLOY NOTES
-------------------
- 100% client-side: a single index.html with inline CSS and JavaScript.
  Sound is generated with the Web Audio API (oscillators + filtered noise).
- It does NOT use Supabase or the Gemini API, so there are NO API keys,
  NO environment variables, and NO server / api folder to configure.
- Because there is no backend, no special Vercel setup is required — if you
  host it, it's just a static file.

Make a beat. Tap Random if you're stuck. :)
======================================================================
