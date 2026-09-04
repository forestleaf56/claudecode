EMBERDELVE — a torch-lit pocket roguelike
Week of 2026-09-04

================================================================
WHAT IT IS
================================================================
Emberdelve is a compact turn-based roguelike dungeon crawler for your
phone. You descend a procedurally generated dungeon one floor at a time by
lantern-light. Every floor is built fresh, enemies and loot get tougher and
richer the deeper you go, and death is permanent — so the goal is simply to
reach a deeper floor than you ever have before. Everything is drawn in code:
no images, no downloads, no accounts.

================================================================
HOW TO RUN
================================================================
Just open index.html in any modern browser (desktop or mobile). It is a
single self-contained file — no server, no build step, no install.
- On a phone: open the file (or host it anywhere static) and add to home
  screen for a full-screen feel.
- Nothing to configure. No API keys, no environment variables, no backend.

================================================================
CONTROLS
================================================================
- MOVE: tap a tile next to you, use the on-screen d-pad, or use the arrow
  keys / WASD.
- ATTACK: move into an enemy to strike it.
- WAIT a turn: tap the "wait" button, or press Space or "." (period).
- Everything is TURN-BASED — the dungeon only acts when you do, so take your
  time and plan each step.
- PAUSE: the ☰ button (top-right) shows your build and lets you resume,
  read How-to, or abandon the run.

================================================================
HOW TO PLAY
================================================================
1. Press DESCEND on the title screen to begin. Your deepest floor so far is
   shown there once you've made a run.
2. Explore by torchlight — you only see what your lantern reaches; explored
   ground stays dimly remembered.
3. Pick things up by stepping on them:
     ◈ gold        - spend it at the trader
     ❤ potion      - heals you
     † weapon      - 6 tiers; better weapons replace weaker ones
     ◘ armor       - 5 tiers; reduces incoming damage
     ≈ flame scroll- instantly scorches every enemy in your torchlight
     ◆ whetstone   - PERMANENT +1 attack for the rest of the run
4. Touch a glowing ✦ shrine for a one-time boon (full heal, +2 max HP, or a
   gold cache). Beware hidden spike traps.
5. A wandering trader appears between some floors — spend gold on healing,
   upgrades, or the next tier of gear before you press on.
6. Every 5th floor a WARDEN (Ω) guards the stairs — a tougher boss with a
   real reward for felling it.
7. Take the ▼ stairs to descend. Deeper = deadlier, but better loot.
8. When you die, your deepest floor and best gold are saved. Then do it all
   again and try to go further.

================================================================
FEATURES
================================================================
- Endless procedurally generated dungeons — no two runs alike, no fixed end.
- Turn-based tactical movement with torch-radius fog of war and line-of-sight.
- 5 enemy types (rat, bat, goblin, skeleton, brute) with chase AI, scaling in
  number and strength with depth; a Warden boss every 5 floors.
- Deep loot & progression: 6 weapon tiers, 5 armor tiers, flame scrolls,
  permanent whetstone attack upgrades, potions, gold.
- Shrines (one-time boons), hidden spike traps, and a between-floors trader
  that gives gold a purpose.
- Permadeath high-score chase: your deepest floor and best gold persist and
  greet you on the title screen.
- Atmospheric presentation: animated torch-lit title screen, smooth
  step-tween movement, ember motes, flickering light, attack lunge, and
  screen-shake on impacts.
- Everything saves automatically to your browser's localStorage.

================================================================
TECH
================================================================
- Single self-contained index.html: HTML + CSS + JavaScript + Canvas 2D.
- No backend, no Supabase, no Gemini API — so NO API keys, NO env vars, and
  NO api/ folder / Vercel serverless setup are needed.
- Mobile-first, full-viewport responsive canvas, touch to play, no scrolling.
- Saves to localStorage under 'emberdelve_best' and 'emberdelve_gold'.

Descend by lantern-light. See how deep you can go.
