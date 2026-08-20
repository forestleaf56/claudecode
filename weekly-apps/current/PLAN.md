# Weekly App — Week of 2026-08-17

## Concept: **Fives** — a five-letter word guessing game

A word game (Wordle-style). Guess the hidden five-letter word in six tries.
Each guess colors its letters: **green** = right letter, right spot; **amber**
= right letter, wrong spot; **slate** = not in the word. An on-screen keyboard
shows what you've learned. Win by finding the word; a streak and win-rate are
tracked. A fresh random word every game.

Deliberately a new genre for the collection: the archive so far is Orbit Weaver
(space arcade), Untangle (puzzle), Skyline (stacking arcade), and Thump (music
app) — this is the first **word game**.

## Front end (required polished shell)
- **Name / logo:** "FIVES" wordmark, five letter-tiles spelling it or a tile motif.
- **Title screen + menu:** PLAY · HOW TO PLAY · STATS. Clean, thumb-friendly.
- **Palette:** slate/charcoal background, emerald green for correct, warm amber
  for present, muted slate for absent — classic, high-contrast, readable.

## Tech choices
- Single self-contained `index.html` — HTML + CSS + JS. No backend.
- No Supabase / no Gemini API → **no `api/` folder**, no Vercel serverless setup.
  Deploy = open the file or drop it on any static host.
- A curated list of common 5-letter words embedded in the file (answers + allowed
  guesses); guesses validated against it. Stats (games, wins, streak) in `localStorage`.
- Mobile-first: responsive board + on-screen keyboard sized for thumbs, no scrolling.

## File structure
```
weekly-apps/current/
  index.html   <- the whole game
  PLAN.md      <- this file
```

## Build checklist (Mon–Thu, small daily increments)
- [x] Mon: concept + plan; minimal `index.html` skeleton — FIVES logo header + the
      empty 6×5 board, responsive HTML/CSS. Boots clean on mobile, no JS errors.
- [x] Tue: board (6×5 tiles) + QWERTY on-screen keyboard (with Enter/⌫); type/delete
      fills the current row, Enter validates length + against the embedded word list
      (~330 common words) and advances, with a shake + toast on invalid; random answer
      picked and kept for Wed. Physical keyboard also works. Verified, no JS errors.
- [x] Wed: guess evaluation — green/amber/slate coloring with correct two-pass
      duplicate-letter handling; keyboard key states (green>amber>slate, no downgrade);
      win detection (all green) + lose/answer reveal at row 6; input locks after.
      Loosened guess validation to accept any 5 letters (the curated list is small and
      only supplies answers) so common words like CRANE aren't rejected. Verified vs a
      reference evaluator, no JS errors.
- [x] Thu: **title screen + menu** (PLAY / HOW TO PLAY / STATS) with the FIVES logo,
      a how-to screen with examples, and a stats screen (played, win %, current & max
      streak, guess distribution) saved to localStorage. Tile-flip reveal animation,
      WebAudio sound (key tick / win chime / lose thud) + haptics; header ?/stats
      buttons. Verified across title→play→win→stats→new game + how-to, no JS errors.

## Friday readme notes
- Self-contained single index.html, HTML/CSS + a little WebAudio. NO Supabase / NO
  Gemini API. Therefore NO API keys, NO env vars, and NO api/ folder / Vercel setup.
  Runs by just opening index.html; host as a static file anywhere.
- How to play: guess the hidden 5-letter word in six tries; green = right spot,
  amber = wrong spot, slate = not in word. On-screen or physical keyboard. Stats and
  streak are saved locally. Answers come from a curated list; any 5-letter guess is
  accepted.

## Status notes
- Mon 2026-08-17: plan + skeleton only, per the small-increment routine.
- Polished front end (title screen + menu) is an explicit checklist item (Thu).
- No API keys or env vars required — Friday readme will just need play instructions.
