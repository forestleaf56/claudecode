======================================================================
  UNTANGLE  —  a minimalist planarity puzzle
  Weekly App · week of 2026-07-27
======================================================================

WHAT IT IS
----------
Untangle is a calm, one-finger puzzle game. The screen shows a web of
glowing nodes connected by lines — and the lines cross each other in a
tangled mess. Your job: drag the nodes around until NO two lines cross.
Clear the web and a new, harder one appears. Every puzzle is guaranteed
solvable.

It's a single self-contained HTML file. No install, no account, no
internet connection required after loading.


HOW TO PLAY
-----------
1. Open the game (see "RUN IT" below) and tap TAP TO PLAY.
2. You'll see amber nodes joined by lines. Lines that currently cross
   another line are shown in RED; lines that are clear are VIOLET.
3. DRAG any node (touch or mouse) to move it.
4. Rearrange the nodes until every line is violet — i.e. zero crossings.
5. When the web is fully untangled it flashes green ("UNTANGLED!") and the
   next, larger level begins.

GOAL
----
- Reduce the crossing count (shown top-right) to zero on each level.
- Get as far as you can — each level adds more nodes and lines.
- Your best level reached is saved on your device.

CONTROLS
--------
- Touch: drag a node with your finger.
- Desktop: click and drag a node with the mouse.
That's it — one gesture.

FEATURES
--------
- One-finger, mobile-first play (portrait, full screen).
- Procedurally generated levels using a line-arrangement method, so every
  level is always solvable and you never run out of puzzles.
- Live crossing detection: crossing lines highlight red in real time.
- Level counter, move counter, and a saved "best level" (localStorage).
- Solve animation with a green pulse + rising chord, plus sound and haptic
  vibration on supported phones.
- Warm amber-on-dark neon look.


RUN IT
------
Option A - on your phone or computer, no tools:
  Just open index.html in any modern browser (Chrome, Safari, Firefox,
  Edge). Double-click it, or drag it into a browser tab. Done.

Option B - add it to your phone home screen (feels like an app):
  Open index.html in your mobile browser, then use the browser's
  "Add to Home Screen" option. It runs full-screen and offline.

Option C - host it online (optional):
  Upload index.html to any static host (GitHub Pages, Netlify, Vercel,
  or any web server) and open the URL.


TECH / DEPLOY NOTES
-------------------
- 100% client-side: a single index.html with inline CSS and JavaScript
  using the Canvas 2D API.
- It does NOT use Supabase or the Gemini API, so there are NO API keys,
  NO environment variables, and NO server / api folder to configure.
- Because there is no backend, no special Vercel setup is required — if you
  host it, it's just a static file.

Untangle the web. Beat your best level. :)
======================================================================
