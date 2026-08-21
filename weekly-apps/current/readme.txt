======================================================================
  FIVES  —  a five-letter word guessing game
  Weekly App · week of 2026-08-17
======================================================================

WHAT IT IS
----------
Fives is a word game. There's a hidden five-letter word, and you have six
tries to guess it. After each guess, the letters are colored to tell you
how close you are — so every guess narrows it down. Find the word to win;
your streak and win-rate are tracked. A fresh random word each game.

It's a single self-contained HTML file. No install, no account, no
internet connection required after loading.


HOW TO PLAY
-----------
1. Open it (see "RUN IT" below) and tap PLAY.
2. Type any five-letter word and press ENTER.
3. The tiles flip to reveal colors:
     GREEN  — right letter, right spot.
     AMBER  — that letter is in the word, but a different spot.
     SLATE  — that letter is not in the word at all.
   The on-screen keyboard colors its keys the same way, so you can see
   which letters you've ruled in or out.
4. Use the clues to make your next guess. Solve it within six rows to win.
   If you run out of guesses, the answer is revealed.

CONTROLS
--------
- On-screen keyboard: tap letters, ENTER to submit, ⌫ to delete.
- Physical keyboard also works (great on a laptop).
- Header buttons: "?" opens How to Play, the grid icon opens Stats.

FEATURES
--------
- Mobile-first word game with a tap keyboard (portrait, full screen).
- Correct duplicate-letter coloring (the tricky part of these games).
- Tile-flip reveal animation, sound effects, and haptic feedback.
- Title screen + menu (Play / How to Play / Stats).
- Stats saved on your device: games played, win %, current & max streak,
  and a guess-distribution chart.
- Any five-letter guess is accepted; answers come from a curated word list.


RUN IT
------
Option A - on your phone or computer, no tools:
  Just open index.html in any modern browser (Chrome, Safari, Firefox,
  Edge). Double-click it, or drag it into a browser tab. Tap once to allow
  sound if your browser asks.

Option B - add it to your phone home screen (feels like an app):
  Open index.html in your mobile browser, then use the browser's
  "Add to Home Screen" option. It runs full-screen and offline.

Option C - host it online (optional):
  Upload index.html to any static host (GitHub Pages, Netlify, Vercel,
  or any web server) and open the URL.


TECH / DEPLOY NOTES
-------------------
- 100% client-side: a single index.html with inline CSS and JavaScript.
  Sound uses the Web Audio API; stats use localStorage.
- It does NOT use Supabase or the Gemini API, so there are NO API keys,
  NO environment variables, and NO server / api folder to configure.
- Because there is no backend, no special Vercel setup is required — if you
  host it, it's just a static file.

Guess the word. Keep your streak alive. :)
======================================================================
