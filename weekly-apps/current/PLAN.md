# Weekly App — Week of 2026-08-31

## Concept: **Emberdelve** — a torch-lit pocket roguelike

A compact **turn-based roguelike dungeon crawler** for the phone. You descend a
procedurally generated dungeon one floor at a time by lantern-light. Movement is
turn-based (enemies act only when you do), combat is bump-to-attack, and death is
permanent — but each run digs deeper, and your **deepest floor reached** is the
score to beat. Every floor is freshly generated, enemies and loot get tougher and
better as you descend, and you build a fragile run out of the potions, gold, and
gear you find.

**New genre for the collection.** The archive so far is Orbit Weaver (arcade),
Untangle (puzzle), Skyline (stacking arcade), Thump (music app), Fives (word game),
Fathom (cozy sim/idle). This is the first **roguelike / dungeon crawler** — and it's
the natural fit for the raised **longevity** bar: procedural generation + permadeath
+ escalating difficulty means the content never runs out.

## Why it's endlessly replayable (LONGEVITY)
- **Procedural dungeons** — every floor is generated fresh (rooms + corridors), so no
  two runs are alike and there is no fixed end.
- **Escalating difficulty & progression** — deeper floors spawn tougher, more numerous
  enemies and better loot; the descent is effectively infinite.
- **Permadeath + score chase** — a run ends in death; the meta-goal is beating your
  best depth (and gold), saved in localStorage. Always "one more run."
- **Build variety** — potions, gold, and tiered weapons/armor found each run make every
  descent play differently; multiple enemy types demand different tactics.
- **(Stretch) daily seed** — an optional fixed daily dungeon everyone could compare on.

## Front end (required production-ready shell)
- **Name / logo:** "EMBERDELVE" in a heavy engraved/blackletter-leaning display face,
  with a small lantern/flame glyph; tagline "descend by lantern-light".
- **Title screen:** a LIVE torch-lit scene behind the wordmark — dark dungeon stone
  with a flickering amber light pool, drifting embers/sparks rising, a faint rune
  glow — with styled DESCEND · HOW TO · SCORES buttons (amber/teal, never plain boxes).
- **In-run HUD:** a slim top bar (floor depth, HP hearts, gold) + a ☰ pause/menu overlay.
- **Palette:** deep charcoal-violet stone, warm ember amber/orange torchlight, teal
  magic/loot accents, blood-red danger.

## Tech choices
- Single self-contained `index.html` — HTML + CSS + JS + Canvas 2D grid. No backend.
- No Supabase / no Gemini API → **no `api/` folder**, no Vercel serverless setup.
- Best depth / gold / run stats saved in `localStorage`.
- Mobile-first: tap adjacent tile (or on-screen d-pad) to move/attack; torch-radius
  fog of war; full-viewport responsive canvas, no scrolling. All visuals in code.

## File structure
```
weekly-apps/current/
  index.html   <- the whole game
  PLAN.md      <- this file
```

## Build checklist (Mon–Thu increments + daily 14:00 polish passes)
- [ ] Mon: concept + plan; production-ready animated TITLE SCREEN + menu — live
      torch-lit dungeon canvas (dark stone, flickering amber light pool, rising
      embers, rune glow), engraved EMBERDELVE wordmark, styled amber/teal
      DESCEND / HOW TO / SCORES buttons, How-to + Scores modals, DESCEND → grid
      placeholder. Verify in browser, no JS errors. (Today: just plan + skeleton.)
- [ ] Tue: the dungeon + movement — procedural floor generation (rooms + corridors),
      a player @ that moves turn-by-turn (tap adjacent tile / d-pad), wall collision,
      stairs to descend to a freshly generated next floor, torch-radius fog of war.
- [ ] Wed: combat + enemies + economy — bump-to-attack, HP/hearts, 3–4 enemy types
      with simple chase AI that act on your turn, gold + potions to pick up, death →
      game over with run summary; HUD (floor, HP, gold).
- [ ] Thu (production-ready front end): tiered loot (weapons/armor that change damage/
      defense), more enemy variety by depth, a ☰ pause/menu overlay, and the polished
      title screen finalized. Best depth/gold persisted; SCORES screen.
- [ ] LONGEVITY (Tue–Thu + 14:00 passes): guarantee endless replayability — solid
      procedural generation, depth-scaled difficulty & loot, permadeath score chase,
      several enemy types + item tiers, and run stats. Add breadth (traps, a shrine/
      shop, a boss floor every N levels, more item types) as budget allows.
- [ ] GRAPHICS POLISH (14:00 passes): flickering torchlight, ember particles, tile
      shading/shadows, hit flashes, smooth step/attack tweens, damage numbers.

## Friday readme notes
- Self-contained single index.html, Canvas 2D. NO Supabase / NO Gemini API → no API
  keys, no env vars, no api/ folder / Vercel setup. Runs by opening index.html.
- (Fill in Friday: controls — tap adjacent tile or d-pad to move/attack, descend
  stairs to go deeper, permadeath, beat your best depth; enemies/loot scale with depth.)

## Status notes
- Mon 2026-08-31: first week under the added **longevity** requirement. Chose a
  roguelike specifically because procedural generation + permadeath give effectively
  infinite content. Today: plan + a minimal title-screen skeleton only.
