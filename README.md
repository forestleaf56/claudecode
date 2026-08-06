# 🏴‍☠️ Plunder Seas

A one-thumb, mobile-friendly **top-down naval combat roguelite**. Sail an
endless procedural archipelago, fight enemy ships with broadside cannons,
loot gold, upgrade your ship at the Quartermaster, and push deeper into
increasingly dangerous waters until the **Leviathan** rises.

Built with vanilla JavaScript + HTML5 Canvas — **no build step, no
dependencies** — and the [Kenney Pirate Pack](https://kenney.nl) (CC0) art.

![Plunder Seas](assets/icon-512.png)

## Play

It's a static site. Serve the folder over HTTP and open it:

```bash
# any static server works; ES modules require http(s), not file://
python3 -m http.server 8000
# then visit http://localhost:8000
```

On a phone, add it to your home screen — it's an installable **PWA** and
plays **offline** after the first load.

### Controls
- **Left thumb** — drag anywhere on the left half to steer & throttle (a
  floating joystick appears). Push toward where you want to sail.
- **Right thumb** — tap the right half (or the 💥 button) to fire the
  broadside facing the nearest enemy.
- **Mind the wind** — the compass (top-right) shows it. Sailing with the
  wind is faster; damaged sails slow you down.
- **Desktop** — WASD/arrows to steer, click or Space to fire, Esc to pause.

Your hull also **auto-repairs** — a trickle in combat, faster once you've
gone a few seconds without being hit — so disengaging to heal is a valid
tactic. Carpenters upgrades and the Ship's Surgeon perk make it faster.

### The loop
1. **Sink ships** → they drop gold, the occasional cargo barrel, and
   sometimes a **repair barrel** that patches your hull.
2. **Spend gold** at the ⚓ Quartermaster (pause or anchor button) on hull,
   sails, cannons, crew, auto-repair, plunder bonus, one-shot repairs, and
   ammo types.
3. **Retire** to bank a share of your gold as **doubloons**, or go down
   fighting — either way doubloons persist.
4. **Doubloons** unlock ship classes (Frigate, Galleon, Man-o'-War),
   permanent perks, and ammo (Chain, Grape, splash **Mortar**) in the
   **Shipyard**.

### Content
- **4 ship classes**, **4 ammo types**, **10+ upgrade paths**.
- **7 enemy archetypes** (Scout, Raider, Interceptor, Gunship, Bruiser,
  Skull Raker, Ironclad) that unlock as you sail into deeper zones.
- **Recurring, escalating bosses** — the Leviathan, the Dreadnought, and the
  Gilded Terror cycle and grow stronger every encounter, so a run can go as
  long as your hull holds.

## Project structure

```
index.html              entry + PWA meta
manifest.webmanifest    installable app metadata
sw.js                   offline service worker
assets/                 Kenney Pirate Pack art (CC0) + generated icons
src/
  main.js               bootstrap, game loop, state machine, input dispatch
  core/                 math, rng, assets, audio (Web Audio synth), input, camera
  world/                procedural islands, tiles, wind
  entities/             ships (player+AI), projectiles, effects, pickups
  game/                 orchestration: spawns, zones, boss, combat, economy
  ui/                    ui toolkit, HUD, menus
  data/config.js        all gameplay tuning in one place
  save/save.js          localStorage meta-progression
GAME_PLAN.md            the design & build plan this was built from
```

All sound is **synthesized at runtime** via the Web Audio API — there are
no audio files.

## Deploy

The game is a static site with **no build step**, so it deploys anywhere
that serves files.

### Vercel (recommended)
1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Other**. Leave **Build Command** and **Output
   Directory** empty — the root is served as-is.
3. Deploy.

Or from the CLI:
```bash
npm i -g vercel
vercel        # preview
vercel --prod # production
```
`vercel.json` sets the correct `manifest.webmanifest` content type and the
service-worker headers so the PWA installs and runs offline.

### GitHub Pages
In **Settings → Pages** choose *Deploy from a branch* and select the branch
with the `/ (root)` folder.

## Credits & license

- **Art:** Kenney "Pirate Pack" — [kenney.nl](https://kenney.nl) — CC0. See
  `assets/KENNEY_LICENSE.txt`.
- **Code:** this repository.
