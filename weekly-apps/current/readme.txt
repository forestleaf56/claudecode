======================================================================
  SKYLINE  —  a one-tap tower-stacking arcade game
  Weekly App · week of 2026-08-03
======================================================================

WHAT IT IS
----------
Skyline is a one-tap arcade game about building the tallest neon city you
can. A glowing building slab slides back and forth across the top of the
screen; tap to drop it onto the tower. Any part that hangs past the slab
beneath gets sliced off and tumbles away — so each floor is only as wide
as your timing is good. The camera rises with your tower as a lit skyline
grows beneath you. Miss completely and it all topples.

It's a single self-contained HTML file. No install, no account, no
internet connection required after loading.


HOW TO PLAY
-----------
1. Open the game (see "RUN IT" below) and tap PLAY on the title screen.
   (HOW TO PLAY on the title screen also shows a quick refresher.)
2. A slab slides left-right at the top. TAP ANYWHERE to drop it onto the
   floor below.
3. Line it up: any overhang is sliced off and falls, making the next slab
   that much narrower — so precise drops keep your tower wide.
4. PERFECT DROP: line the slab up almost exactly with the floor below and
   it keeps its full width, rings out a chime, and builds your COMBO for
   bonus points.
5. Keep stacking. A full miss (no overlap) topples the tower — game over.

GOAL
----
- Build as HIGH as you can (the big number is your height).
- Score climbs with every floor, and perfect-drop combos multiply it.
- Your best height and best score are saved on your device.

CONTROLS
--------
- Touch: tap anywhere to drop.
- Desktop: click anywhere to drop.
One tap — that's the whole game.

FEATURES
--------
- One-tap, mobile-first play (portrait, full screen).
- Overhang slicing with tumbling off-cuts and a rising camera.
- Perfect-drop detection with a combo multiplier and ring flash.
- Neon cyan-to-magenta floors with lit windows; night-city title screen.
- Title screen + menu (PLAY / HOW TO PLAY), best height/score readout.
- Sound effects (WebAudio) and haptic vibration on supported phones.
- Collapse animation on game over; best height + score saved (localStorage).


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

Stack it high. Beat your best skyline. :)
======================================================================
