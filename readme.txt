======================================================================
  ORBIT WEAVER  —  a one-thumb space arcade game
  Weekly App · week of 2026-07-20
======================================================================

WHAT IT IS
----------
Orbit Weaver is a mobile-first arcade game you play with a single finger.
Your ship is caught in a planet's gravity and orbits it automatically.
Tap to slingshot off toward the next planet — time it right and you fall
into that planet's pull. Collect glowing energy orbs, chain combos, dodge
asteroids, and see how far you can travel before you drift into the void.

It's a single self-contained HTML file. No install, no account, no
internet connection required after loading.


HOW TO PLAY
-----------
1. Open the game (see "RUN IT" below).
2. Tap anywhere to start.
3. Your ship circles the current planet. TAP ANYWHERE to release and fly
   off along the direction you're currently moving (the tangent).
4. Aim so your flight carries you into the NEXT planet's faint gravity
   ring — you'll be captured into orbit around it automatically.
5. Repeat: tap to release, get captured, tap again. Keep weaving forward.

GOAL
----
- Travel as far as possible. Your score climbs with distance.
- Each planet you catch adds to your COMBO (shown top-right) — the higher
  the combo, the more points every catch and orb are worth.
- Grab the bright ENERGY ORBS floating between planets for bonus points.

AVOID
-----
- Drifting off the top or bottom of the screen, or falling behind — that
  ends the run ("DRIFTED AWAY").
- The pink ASTEROIDS. Touching one ends the run instantly. They appear
  more often the longer you survive.

CONTROLS
--------
- Touch: tap anywhere on the screen.
- Desktop: click, or press SPACE / UP ARROW.
That's the whole control scheme — one button.

FEATURES
--------
- One-thumb gameplay, designed for phones (portrait, full screen).
- Gravity-capture flight model with a real skill curve.
- Energy orbs + escalating combo multiplier.
- Drifting asteroid hazards and a difficulty ramp that builds over time.
- Neon visuals, particle bursts, ship trail, and screen shake.
- Sound effects (WebAudio) and haptic vibration on supported phones.
- "NEW BEST" celebration and a best-score board saved on your device.
- Best score persists locally (localStorage) between sessions.


RUN IT
------
Option A — on your phone or computer, no tools:
  Just open index.html in any modern browser (Chrome, Safari, Firefox,
  Edge). Double-click it, or drag it into a browser tab. Done.

Option B — add it to your phone home screen (feels like an app):
  Open index.html in your mobile browser, then use the browser's
  "Add to Home Screen" option. It runs full-screen offline.

Option C — host it online (optional):
  Upload index.html to any static host (GitHub Pages, Netlify, Vercel,
  or any web server) and open the URL.


TECH / DEPLOY NOTES
-------------------
- This game is 100% client-side: a single index.html with inline CSS and
  JavaScript using the Canvas 2D API.
- It does NOT use Supabase or the Gemini API, so there are NO API keys,
  NO environment variables, and NO server/api folder to configure.
- Because there's no backend, no special Vercel setup is required — if you
  host it, it's just a static file.

Enjoy weaving through the orbits. Beat your best. :)
======================================================================
