# 🏴‍☠️ Plunder Seas — Game Design & Build Plan

An ambitious, mobile-friendly, top-down **naval combat roguelite** built with the
Kenney Pirate Pack (CC0) assets. Sail an open archipelago, fight enemy ships with
broadside cannons, loot gold, upgrade your ship, and push deeper into increasingly
dangerous waters.

> Genre confirmed by the asset pack itself: the pack's own `Sample.png` shows
> top-down ships trading cannon fire around islands with explosions and wreckage.
> We lean into exactly that.

---

## 1. Vision & Pillars

**One-line pitch:** *A one-thumb pirate combat roguelite — every run is a raid deeper into the archipelago, every gold coin an upgrade, every sinking a lesson.*

Four design pillars, every feature must serve at least one:

1. **One-thumb playable.** Fully controllable with a single thumb on a phone; mouse/keyboard is a bonus, never a requirement.
2. **Readable at a glance.** Top-down, high-contrast, chunky sprites. You always know where you are, where the danger is, and where the loot is.
3. **Meaningful escalation.** A run gets harder and your ship gets stronger. Short sessions (3–8 min), high replayability.
4. **Juice.** Cannon smoke, screen shake, floating damage numbers, wave shimmer, wreck debris, satisfying booms. The assets are cheerful — the feel should be too.

---

## 2. Asset Inventory & Mapping

All assets are Kenney "Pirate Pack" (CC0 — free for commercial use, credit appreciated). Key measured dimensions (Default size):

| Asset group | Files | Size (px) | Used for |
|---|---|---|---|
| **Ships** (`ship (1..24).png`) | 24 pre-assembled top-down ships in 4 team colors (brown/blue/green/red/grey/yellow trims) | ~66×113 | Player + enemy ship bodies |
| **Dinghies** (`dinghySmall/Large 1..3`) | 6 | 16×26 … | Fast scout enemies, escape pods, wreck props |
| **Hulls** (`hullLarge/Small 1..4`) | 8 | 50×108 / small | Modular ship building (stretch) |
| **Sails** (`sailLarge 1..24`, `sailSmall 1..13`) | 37 | ~66×47 | Modular ship building; sail-damage states |
| **Cannon** (`cannon`, `cannonMobile`, `cannonLoose`) | 3 | 29×16 | Deck cannons / turret overlays |
| **Cannonball** (`cannonBall.png`) | 1 | 10×10 | Projectiles |
| **Crew** (`crew 1..6`) | 6 | 22×20 | Crew-count UI, boarding minigame (stretch) |
| **Flags** (`flag 1..6`) | 6 | 6×22 | Faction identity, mast flags |
| **Nest / pole / wood** | 3+4 | — | Ship detailing, floating debris on sink |
| **Tiles** (`tile_01..96`) | 96 | 64×64 | Water, beaches, grass, rocks, palms, docks, towers → island generation |
| **Effects** (`explosion1..3`, `fire1..2`) | 5 | ~74×75 | Muzzle flash, hit/explosion animation, burning-ship state |

**Missing from the pack (must be produced or synthesized):**
- **Audio** — none included. Plan: procedurally synthesize SFX with the **Web Audio API** (cannon boom, splash, creak, coin) and loop a lightweight ambient track. No binary audio needed for v1.
- **UI chrome** (buttons, health bars) — draw with Canvas primitives themed to match the wood/parchment palette.
- **Tile atlas mapping** — the 96 tiles are unlabeled; **Milestone 0** includes building a small tile-index reference (render all 96 to a labeled grid) so we know which index is water vs. beach-corner vs. palm, etc.

**Asset integration step:** copy `PNG/Default size/**` and `PNG/Retina/**` into `assets/` in the repo, preserving categories. Serve `@2` / Retina variants on high-DPI displays.

---

## 3. Core Gameplay Loop

```
      ┌──────────────────────────────────────────────┐
      │                 A SINGLE RUN                  │
      └──────────────────────────────────────────────┘
  Set sail  →  Explore archipelago  →  Fight ships / raid forts
      ↑                                        │
      │                                   Loot gold + cargo
      │                                        │
   New run   ←  Sink / Retire to port  ←  Spend at port: upgrade
  (meta gold spent on unlocks)            hull / sails / cannons / crew
```

- **Moment-to-moment:** steer, position for a broadside, fire, dodge return fire, use the wind.
- **Per-encounter:** win a fight → collect floating gold/cargo → decide push deeper or bank it.
- **Per-run:** survive escalating zones, reach a boss (a Man-o'-War or an island fortress with tower cannons), then either die or retire.
- **Meta (roguelite):** banked gold buys permanent unlocks (new ship classes, starting upgrades, cannon types) between runs. Death is not punishing — it's a rerun with more options.

---

## 4. Controls (Mobile-First)

Designed thumb-first, with graceful desktop fallback.

**Touch (primary):**
- **Left thumb — steering:** a floating virtual joystick that appears wherever you first touch the left half. Push direction = desired heading; magnitude = throttle. The ship turns toward the vector (ships have turn inertia — no instant snapping).
- **Right thumb — combat:** tap the right half to **fire the broadside** that faces the nearest valid target (auto-selects port vs. starboard). Optional **drag-to-aim** for manual angle; release to fire.
- **Two-finger / dedicated button:** special ability (e.g., chain-shot, ram, repair) — cooldown-gated.

**Desktop (secondary):** WASD/arrows to steer, mouse to aim, click/space to fire. Same code path via a unified input abstraction.

**Accessibility & options:** left/right-handed swap, "tap-to-sail" alternative (tap a point, ship auto-navigates), aim-assist toggle, haptics (`navigator.vibrate`) on hits, reduced-motion mode (dampens screen shake/particles).

---

## 5. Technical Architecture

**Stack decision: vanilla JS + HTML5 Canvas 2D, ES modules, no build step.**

Rationale for an ambitious-but-shippable target:
- **Zero install / instant load** on any mobile browser — critical for a web game. No bundler, no framework tax.
- **Canvas 2D** is more than enough for hundreds of sprites at 60fps; we control the render loop and batching ourselves. (WebGL/Pixi is a documented stretch path if particle counts demand it.)
- **Deployable as a static site** (GitHub Pages) — the repo is already an HTML entry point.

```
index.html            ← entry, canvas, viewport meta, PWA manifest link
assets/               ← copied Kenney PNGs (+ @2 retina), sfx generated at runtime
src/
  main.js             ← bootstrap, game loop (fixed-step update + interpolated render)
  core/
    Loop.js           ← fixed timestep accumulator, requestAnimationFrame
    Input.js          ← unified touch/mouse/keyboard → intent (steer vec, fire, ability)
    Assets.js         ← image loader, DPI variant selection, tile atlas
    Audio.js          ← Web Audio SFX synth + ambient bus, master mute
    Camera.js         ← follow player, world↔screen transform, shake
    ecs.js            ← lightweight entity/component store (or plain object pools)
    math.js           ← vec2, angle lerp, collision (circle/segment)
    rng.js            ← seeded PRNG (mulberry32) for reproducible runs
  world/
    Generator.js      ← procedural archipelago (islands, spawn points, loot)
    Tilemap.js        ← chunked tile rendering + autotiling for beaches
    Wind.js           ← wind vector, affects sail speed & drift
  entities/
    Ship.js           ← hull/sail/cannon composition, health, AI hook
    Projectile.js     ← cannonballs, chain-shot
    Pickup.js         ← gold, cargo, repair barrels
    Effect.js         ← explosions, smoke, splash, wake, debris (pooled particles)
  systems/
    Movement.js  Combat.js  AI.js  Loot.js  Collision.js  Spawner.js
  ui/
    Hud.js            ← health, gold, minimap, ability cooldown, wind indicator
    Screens.js        ← title, port/upgrade, pause, game-over
    VirtualStick.js   ← the floating joystick + fire zone
  data/
    ships.js  upgrades.js  enemies.js  tiles.js   ← tuning data, hot-editable
  save/
    Save.js           ← localStorage meta-progression (gold, unlocks, settings)
```

**Engine notes**
- **Fixed-timestep simulation** (e.g., 60 Hz) with render interpolation → deterministic physics, seed-reproducible runs, stable on slow phones.
- **Object pooling** for projectiles/particles → no GC hitches mid-fight.
- **Chunked tilemap** rendered to offscreen canvases per chunk, only redrawn when dirty → cheap large worlds.
- **Responsive canvas**: CSS pixel size fills the viewport; internal resolution = CSS × `devicePixelRatio` (capped, e.g. ≤2) for crispness without melting low-end GPUs. Handle orientation change and safe-area insets.

---

## 6. Game Systems (Detail)

**Sailing & wind.** Ships have mass, turn rate, and forward thrust from sails. A global **wind vector** (slowly rotating) modifies speed: sailing with the wind is fast, into it is slow (no dead-stop, to keep mobile play forgiving). A HUD compass shows wind — using it well is the skill ceiling. Wake particles trail the hull; speed scales the wake.

**Combat.** Ships fire **broadsides** — a spread of cannonballs from port or starboard. Cannonballs are pooled projectiles with travel time (lead your target). Damage model: hull HP + optional **sail HP** (shooting sails slows the enemy — depth via the sail sprites). Hits spawn wood-splinter particles; a kill triggers explosion frames, a sinking tween (fade + rotate + debris/wood sprites), and gold/cargo drops. **Screen shake + haptic** on your hits landing and on taking damage.

**Enemy AI.** State machine: `Patrol → Notice → Engage → Reposition → Flee(when low)`. Engage AI steers to present its broadside while keeping range — creating the naval "circling duel" feel. Tiers: **scout dinghies** (fast, weak, swarm), **gunships** (standard), **heavies** (slow, big broadsides), **fort towers** (static, from the tower tiles), and a **boss Man-o'-War**. Ship color trims from the pack map cleanly to factions/tiers.

**Procedural world.** Seeded generator scatters islands (blob shapes stamped into the tilemap with autotiled beaches/grass, palms & rocks as décor), defines safe lanes and choke points, and places spawn zones + loot. Difficulty scales with distance from the start port (zones/rings). Minimap in the HUD.

**Loot & economy.** Sunk ships drop **gold** (auto-magnet within radius) and occasional **cargo** (worth more, but you carry it — risk/reward: bank it at port or lose it if you sink). Repair barrels heal. Gold spent two ways: *in-run* quick fixes at neutral ports, and *meta* permanent unlocks.

**Progression / upgrades.** Ship stats as data (`data/upgrades.js`): Hull (max HP), Sails (speed/turn), Cannons (damage/reload/spread), Crew (reload speed / repair rate), plus unlockable **ship classes** (sloop → frigate → galleon, using different `ship (n)` sprites and stat profiles). Meta unlocks: new starting ship, cannon types (chain-shot to shred sails, grapeshot short-range burst, mortar lob), passive perks.

**Save / meta.** `localStorage`: banked gold, unlocks, settings, best run. Everything else is per-run and seed-driven.

---

## 7. Content Plan (v1 scope)

- **1 world** = 3 escalating zones + 1 boss arena (island fortress or Man-o'-War).
- **~6 enemy archetypes** (2 scout, 2 gunship, 1 heavy, 1 boss) reusing ship sprites + stats.
- **3 player ship classes**, ~12 upgrade nodes, **3 cannon types**.
- **~8 min** to clear a full successful run; death-and-retry loop from second 1.

---

## 8. Audio (synthesized, no binaries)

Web Audio API graph: master → SFX bus + music bus, each with mute/volume in settings.
- **SFX:** cannon boom (filtered noise burst + low sine thump), splash, wood hit, coin pickup, sail tear, UI clicks — all generated in `Audio.js`.
- **Ambient:** gentle sea/wind loop (noise through a slow-modulated filter) + light musical bed. Keep it optional and mute-by-default-friendly (mobile autoplay policies: start audio on first user gesture).

---

## 9. Milestones (incremental, each independently playable/committable)

**M0 — Foundations & asset pipeline** *(setup)*
Copy assets into `assets/`. Build the labeled tile-index reference sheet (render all 96 tiles with indices) so we can name tiles. Set up `index.html`, responsive full-viewport canvas, game loop, asset loader, DPI handling. *Exit: a ship sprite renders centered on water at 60fps on a phone.*

**M1 — Sailing feels good** *(the core verb)*
Ship movement with inertia + turn rate, virtual joystick, camera follow, wake particles, wind vector + HUD compass, infinite water tiling. *Exit: sailing alone is fun.*

**M2 — Combat** 
Broadside firing, pooled cannonballs with travel time, one dummy enemy, hull HP, hit particles, explosion + sinking, screen shake, haptics. *Exit: you can sink a ship and it feels punchy.*

**M3 — Enemies & AI**
State-machine AI, 3–4 archetypes, spawner, difficulty by distance. *Exit: a real fight against multiple ships.*

**M4 — World generation**
Seeded archipelago, autotiled islands (beaches/grass/palms/rocks), collision with land, minimap, zones. *Exit: a world worth exploring.*

**M5 — Loot, economy & progression**
Gold/cargo drops + magnet, port screen, in-run + meta upgrades, ship classes, cannon types, `localStorage` save. *Exit: the roguelite loop closes.*

**M6 — Boss & win/lose flow**
Boss encounter, title/pause/game-over/retire screens, run summary. *Exit: a full run start-to-finish.*

**M7 — Juice, audio, polish & ship**
Web Audio SFX/ambient, settings (handedness, aim-assist, reduced motion, mute), PWA manifest + service worker (installable, offline), performance pass, playtest tuning, GitHub Pages deploy. *Exit: shippable v1.*

---

## 10. Stretch Goals (post-v1)

- **Modular ship builder** using hull + sail + cannon + flag sprites (real reason the pack ships parts separately) — cosmetic + stat customization.
- **Boarding minigame** using the crew sprites.
- **Fleet command** (recruit escort ships), day/night & storm weather, dynamic wind fronts.
- **Daily seed** leaderboard, ghost replays.
- **WebGL/Pixi renderer** swap behind the same asset/entity layer if particle budgets grow.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Mobile perf on low-end devices | Fixed-step sim, object pooling, chunked/dirty tile rendering, DPR cap, particle budget + reduced-motion mode |
| Touch controls feel imprecise | Floating joystick + aim-assist by default, tap-to-sail alternative, early + frequent on-device playtests |
| Scope creep ("ambitious") | Strict milestone gating; each M is independently playable and committable; stretch list is explicitly *later* |
| No audio/UI assets in pack | Synthesize SFX via Web Audio; draw UI with Canvas primitives themed to the art |
| 96 unlabeled tiles | M0 reference-sheet task to map indices before world gen |
| Autoplay/gesture & fullscreen quirks on iOS Safari | Init audio on first tap, handle safe-area insets & orientation, test on real iOS early |

---

## 12. Definition of Done (v1)

- Loads and runs at ~60fps on a mid-range phone browser, portrait **and** landscape.
- Fully playable one-thumb from title → run → death/retire → upgrade → new run.
- Procedural world, ≥6 enemy types, boss, 3 ship classes, upgrade economy, save.
- Synthesized audio, settings, installable PWA, deployed to a public URL.
- Kenney credited in-game and in `README`.

---

### Attribution
Art: **Kenney "Pirate Pack"** — [kenney.nl](https://kenney.nl) — CC0. Credit appreciated, not required; we'll credit anyway.
