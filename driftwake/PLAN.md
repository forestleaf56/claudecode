# Driftwake: Implementation Plan

*Working title.* An original, slow-paced, first-person, open-world 3D survival game set on an endless ocean. You start on four planks of driftwood and end with a seagoing home, a map full of islands, and the answer to why the world flooded. It runs in the browser, phones first.

This plan covers what to build, how to build it, how much content to make, and the order to build it in. It sits next to the existing *Harbor Light* game in this repo and doesn't touch it.

---

## 1. Design pillars

1. **Calm before danger.** You get long quiet stretches of drifting, fishing and building. Threats arrive gradually, and the player can always see them coming.
2. **Everything is craftable from what you see.** Every resource you can see can also be collected, and every collected resource is used in some recipe.
3. **The raft is your character sheet.** Progress shows up on the raft itself: what it's built from, its size, its stations and its sail.
4. **Easy first, harder later.** The first 20 minutes can't be lost. Difficulty rises with player level and with distance from the starting waters (see §6).
5. **Phone first.** Every action works with one thumb on each side of the screen. Gamepad and keyboard are fully supported too.

---

## 2. Technology

| Concern | Choice | Why |
|---|---|---|
| Rendering | **Three.js** (pinned version) using WebGL2 | Mature PBR, a water shader, shadows and post-processing. Runs on mobile. |
| Language / build | Plain **ES modules** with JSDoc types, bundled by **Vite** | Code can be split into many files. `vite-plugin-singlefile` can still produce one `index.html`, the same way Harbor Light ships. |
| Physics | Custom lightweight code: a capsule character controller, buoyancy from sampled wave height, and simple AABB/sphere collisions | A full physics engine is too heavy for phones and isn't needed for a game this slow. |
| Audio | Web Audio API: procedural ambience (waves, wind, gulls) plus short CC0 sound effects | Small download and seamless loops. |
| Storage | IndexedDB for saves, with a localStorage fallback | Saves get large because of the raft grid, the world and the farms. |
| Hosting | Static files (GitHub Pages or similar), plus a PWA manifest and service worker | Can be installed to the home screen, works offline, and opens fullscreen. |

### "Photorealistic" on a phone: what is realistic to aim for

A browser game on a mid-range phone can't reach console photorealism. The plan targets **a convincing, grounded realistic look**:

- **PBR materials** built from CC0 texture sets (Poly Haven / ambientCG): wood, rope, sand, rock, metal and cloth, each with albedo, normal and roughness maps. Textures are compressed to **KTX2/Basis** so they stay small on mobile GPUs.
- **HDRI sky and image-based lighting** blended through a day/night cycle, with an analytic sun and moon.
- **Ocean shader:** a sum of Gerstner waves (the CPU uses the same function, so buoyancy matches what you see), plus a Fresnel term, a subsurface tint, foam on wave crests and where waves meet shore or hull, screen-space reflections on the High tier, and underwater fog and caustics.
- **Post-processing:** ACES tone mapping, bloom, and SSAO/fog on the High tier only.
- **Models:** low-to-mid poly geometry with good textures. Real-time global illumination and dense vegetation are out of scope.
- **Quality tiers** (Low / Medium / High / Auto) adjust resolution scale, shadow map size, draw distance, wave detail, post-processing and foliage density. **Auto** picks a tier from a short GPU benchmark on first launch and lowers it if the frame rate stays under 30.

Performance budget on a mid-range phone at Medium: **under 150 draw calls, under 300k visible triangles, under 250 MB of GPU memory, a steady 30 fps (60 on desktop), and an initial download under 25 MB.** Everything after the first area streams in.

---

## 3. Architecture

```
driftwake/
  index.html            # shell, title screen DOM, HUD DOM
  src/
    main.js             # boot, quality probe, asset preload, state machine
    core/               # loop, time, events, rng (seeded), input, audio, save
    render/             # renderer, sky, ocean, water-interaction, post, LOD, instancing
    world/              # chunk streaming, biomes, island generator, caves, weather
    player/             # controller, camera, swimming, vitals, hands/tool view-model
    raft/               # grid, building, structural integrity, buoyancy, sail/anchor/steering
    systems/            # inventory, crafting, fishing, farming, cooking, research, xp
    ai/                 # enemy FSMs, flocking fish, NPC schedules
    quests/             # quest engine, dialogue runner, journal
    ui/                 # menus, HUD, touch controls, radial menus, tooltips
  data/                 # ALL content as plain data, no logic
    items.js recipes.js blueprints.js enemies.js npcs.js quests.js dialogue/ biomes.js loot.js
  assets/               # ktx2 textures, glb models, ogg audio, hdr skies
```

**Key rules**

- **Content is data.** Items, recipes, enemies, quests and dialogue are tables, so adding content never requires engine work. A small validator script (`npm run check-data`) catches broken item IDs, unreachable recipes and quests that can't be completed.
- **Seeded world.** Each 256 m ocean chunk is generated from `seed + chunk coords`. Saves store only what the player changed (looted, built, killed), not the generated world.
- **Fixed-step simulation** at 30 Hz, decoupled from rendering. Systems that are far away from the player update less often.
- **One input layer** maps keyboard/mouse, touch and gamepad to the same *actions* (§8).

---

## 4. Core systems

| System | Contents |
|---|---|
| **Survival vitals** | Health, Hunger, Thirst, Stamina, plus Warmth (from biome tier 3 on). Drain is slow and pauses in menus. On "Relaxed" difficulty, vitals stop at 10% instead of reaching zero. |
| **Raft building** | A 3D grid of foundations, floors, walls, pillars, stairs, roofs, windows, doors and railings. Each piece comes in 4 material tiers (Driftwood → Plank → Reinforced → Ironwood/Steel). A simple integrity check means pieces need support. Enemies attack the edge foundations. There's also a blueprint/ghost preview, rotate, snap, demolish (refunds 50%) and repair. |
| **Navigation** | Sail (turned toward the wind), anchor, a helm that steers once you've crafted it, then a late-game engine with fuel. Compass → map → sextant-style "position finder" → radio receiver that points to points of interest. |
| **Gathering** | A throwable hook for floating debris, nets, axes and pickaxes on islands, a shovel, sickle and knife. Diving underwater uses an oxygen meter. |
| **Crafting** | Hand crafting, then stations: Workbench, Smelter, Loom, Kiln, Anvil, Cooking pot, Grill, Water purifier, Research table, Alchemy bench, and Engine bench. Recipes unlock through **Research** (bring a sample to the research table) and through quests. |
| **Fishing** | A rod with bait. The minigame asks you to keep tension in the green zone. Fish depend on biome, time of day and weather. Also nets and traps, an aquarium, and legendary fish. |
| **Farming** | Planters (small, large, then irrigated) and seeds found on islands. Crops grow in real time measured in game days. Sprinklers, fertilizer (from compost), beehives and pollination, and later trees on the raft. Some animals can live on the raft: chicken, goat, and a mollusc tank. |
| **Cooking** | Grill → Cooking pot → Smoker → Oven. Recipes give larger vital restores and timed buffs (swim speed, cold resistance, XP gain). |
| **Combat** | Melee (spear, axe, cutlass, harpoon), ranged (bow, crossbow, harpoon gun, flare gun), throwables (spear, bomb), and shields. There's a stamina-based dodge, enemy tells shown before every attack, and aim assist on touch and gamepad. |
| **Experience and levels** | XP from almost everything: crafting, fishing, building, discovery, quests, combat. Levels go 1 to 50. Each level grants **1 skill point** for one of 6 skill trees: Survival, Builder, Angler, Farmer, Fighter, Explorer (about 8 nodes each). |
| **Upgrades** | Tool tiers (Scrap → Copper → Iron → Titanium → Abyssal), durability, and repair at the anvil. Raft upgrades: sail size, hull reinforcement, extra storage and plating against sharks. Backpack sizes go from 20 → 30 → 40 → 50 slots. |
| **Inventory** | Hotbar of 8 slots, a backpack, storage chests on the raft (linked by a "Raft Network" upgrade), stack sizes, sorting, quick-stack to nearby chests, and a trash slot. |
| **Day/night and weather** | A 20-minute day. Weather can be clear, overcast, rain (refills water collectors), fog, storm (big waves that knock things off the raft) or snow in the north. |
| **Journal** | Active and completed quests, a bestiary, a fish log, a recipe book, map markers, and lore notes. |

---

## 5. World

The ocean is effectively endless. Biomes form **rings of increasing difficulty** around the starting point, with some directional themes inside each ring.

| Ring / Biome | Level range | Features |
|---|---|---|
| 1. **Shallow Calm** | 1–8 | Warm water, plenty of debris, small sandy islets, a gentle **Reefling** shark that bites planks but not players until level 3 |
| 2. **Palm Reefs** | 6–16 | Larger jungle islands, the first caves, seagulls that steal crops, **Coralback** shark |
| 3. **Mangrove Maze** | 14–24 | Islands connected by roots, fog, crocodiles, a hermit-trader NPC settlement |
| 4. **Storm Belt** | 22–32 | Frequent storms, rocky volcanic islands, metal ore, **Thunderfin** pack sharks |
| 5. **Frost Reach** | 30–40 | Icebergs, cold mechanic, whale migrations, abandoned research station |
| 6. **The Sunken Deep** | 38–50 | Drowned city ruins, deep-sea dives, bioluminescence, abyssal creatures, the finale |

**Points of interest (procedural placement, handcrafted templates):** about 12 island templates per biome with variations, **sea caves and underwater caves** (oxygen pockets, crystals, loot, cave-only fish), shipwrecks, floating platforms, lighthouses, radio towers, 6 **NPC outposts**, 6 **story landmarks** (one per biome), and messages in bottles.

**Caves** are separate interior scenes entered through a mouth on an island or the seabed. Each one is a small handcrafted layout with randomized loot, lit only by your torch or lantern. Each biome has its own cave enemies.

---

## 6. Difficulty and progression curve

- **Player level** controls which recipes and skill points you have.
- **Distance from the start** sets enemy level, how much loot there is, and how harsh the weather gets. Each biome ring shows a recommended level on the map.
- **Tutorial phase (about 20 minutes):** no hostile attacks, plenty of debris, and quests that teach one verb at a time: hook, craft, build, drink, fish, sail.
- **Enemy scaling:** HP and damage go up about 12% per biome ring. New enemy *behaviors* also appear: packs, ambushes, ranged attacks, armor that only some weapons can break.
- **Hunger and thirst** drain slightly faster in warmer and colder biomes. The Frost Reach adds Warmth.
- **Difficulty presets:** *Relaxed* (no raft damage, vitals don't kill), *Normal*, *Hard*, and *Permadeath* (a toggle).

---

## 7. Content targets ("a lot of content")

| Category | Target count |
|---|---|
| Items (resources, food, tools, gear, placeables) | **~280** |
| Crafting recipes | **~220** |
| Building pieces (×4 material tiers) | ~35 shapes → **~120 pieces** |
| Tools and weapons (with tiers) | **~45** |
| Armor and gear (flippers, oxygen tanks, lantern, backpacks) | **~25** |
| Fish species (8 legendaries among them) | **40** |
| Crops and plants | **24** |
| Cooking recipes | **35** |
| Enemies (sea, land, air, cave), 6 of them bosses | **26** |
| Passive animals | **14** |
| NPCs with names, schedules, shops and dialogue | **20** |
| Quests: main story | **30** steps across 6 chapters |
| Quests: side quests (handwritten) | **70** |
| Repeatable bounties and daily requests (templated) | **~40 templates** |
| Lore notes and bottle messages | **50** |
| Achievements | **40** |
| Skill tree nodes | **~48** |

**Story outline (original):** the world flooded after the *Tidewardens'* weather engines failed. Each biome landmark holds a fragment of an old network of beacons. Relighting all six leads the player into the Sunken Deep, where they choose whether to restore the engines (the sea recedes, so the land returns) or leave the sea as it is (the outposts flourish). There are two endings, and play can continue after either.

**NPC examples:** Marit the salvage trader, Odo the hermit cartographer, the Kessling twins (farmers), "Captain" Fen (a retired fisher who gives fishing quests), Dr. Halvard (the Frost Reach researcher), and Wren (a child stowaway who gives you a companion questline).

---

## 8. Controls

All three schemes map to the same actions: `move, look, jump, crouch/dive, sprint, primary, secondary, interact, hotbar±, build menu, inventory, map, pause`.

| Action | Touch | Gamepad | Keyboard / Mouse |
|---|---|---|---|
| Move / Look | Left virtual stick / drag on the right half of the screen | LS / RS | WASD / mouse (pointer lock) |
| Primary (use/attack) | Right button | RT | LMB |
| Secondary (aim/block/rotate) | Button | LT | RMB |
| Interact / pick up | Context button (appears only when something is in range) | A | E |
| Jump / swim up | Button | B | Space |
| Crouch / dive | Button | X | Ctrl / C |
| Hotbar | Tap slot / swipe | LB / RB | 1–8 / wheel |
| Build / craft radial | Hold hammer button | Y | Q / Tab |
| Map / Journal | Button / button | View / D-pad up | M / J |
| Pause | Button | Menu | Esc |

- Touch: adjustable sensitivity, left-handed mode, button size and opacity, and optional gyro aiming.
- Gamepad: uses the standard Gamepad API mapping, with dead-zone and sensitivity settings. Every menu can be navigated with focus rings, and button prompts switch automatically to whichever device you used last.
- Haptics: vibration on phones and gamepad rumble when hooking a fish and when taking damage.

---

## 9. Title screen, saving and fullscreen

- **Title screen:** a live 3D scene behind the logo (the raft drifting at sunset with slowly orbiting camera), with Continue / New Game / Load / Settings / Credits. While it shows, the quality tier is chosen in the background and the first chunk's assets preload.
- **New Game:** pick a save slot (3), difficulty and world seed, then a short intro cinematic that you can skip.
- **Fullscreen by default:** the game requests fullscreen on the first user gesture, since browsers require a gesture. It also locks landscape orientation where supported and shows a "rotate your device" overlay in portrait. As a PWA it uses `display: fullscreen`. There is a toggle in Settings.
- **Autosave every 30 seconds** to the active slot. It's skipped during combat and cutscenes and retried 5 seconds later. The game also saves when you sleep, when a quest completes, and when the page is hidden or closed (`visibilitychange`/`pagehide`). Saves are written to a second buffer and then swapped in, so a crash mid-write can't corrupt them. There's a small "saving…" indicator, and saves can be exported and imported as a file.
- **Save format:** versioned JSON compressed with a small deflate library. It includes migration functions between versions.

---

## 10. Build phases

Each phase ends with something playable that is committed and pushed.

| # | Phase | Deliverable / acceptance |
|---|---|---|
| 0 | **Foundation** | Vite project, quality-tier probe, render loop, input layer covering all 3 devices, fullscreen, save/load skeleton with the 30 s autosave, settings menu. *Acceptance:* walk around on a flat raft on a phone, tablet and desktop with a gamepad. |
| 1 | **Ocean and raft** | Gerstner ocean, sky with day/night, buoyant raft, swimming and diving, hook and debris, basic hand crafting, building foundations. *Acceptance:* the core loop is fun for 10 minutes. |
| 2 | **Survival loop** | Vitals, water purifier, grill, the first shark, repair, inventory/hotbar UI, the first 10 recipes, the tutorial quests. |
| 3 | **Title screen and onboarding** | 3D title screen, save slots, intro, difficulty presets. |
| 4 | **Islands and caves** | Chunk streaming, generating islands from templates, gathering tools, the first cave, sail/anchor/helm, the map. *(Biomes 1–2.)* |
| 5 | **Progression** | XP, levels, skill trees, research table, tool tiers, crafting stations. |
| 6 | **Fishing, farming and cooking** | All three systems with their first ~30% of content. |
| 7 | **NPCs and quests** | Quest engine, dialogue runner, journal, the first 2 outposts, story chapters 1–2, 20 side quests. |
| 8 | **Combat and enemies** | Weapons, enemy AI framework, 12 enemies, the first 2 bosses. |
| 9 | **Biomes 3–6** | Remaining biomes, weather extremes, Warmth, the engine and fuel, deep dives. |
| 10 | **Content fill** | Reach every count in §7: all quests, NPCs, items, fish, crops, lore and achievements. Run the data validator in CI. |
| 11 | **Polish** | Audio pass, VFX, balancing the difficulty curve against XP data from playtests, accessibility (subtitles, colorblind-safe UI, text size, hold/toggle options). |
| 12 | **Performance and release** | Profiling on low-end Android and iOS Safari, KTX2 everywhere, PWA, offline support, final README. |

Phases 0–3 make a vertical slice. After that, phases can partly overlap because content is data.

---

## 11. Testing

- A **data validator** catches dangling IDs, recipes nobody can reach, and quests that can't be completed. It runs on every commit.
- **Playwright smoke tests:** boot to the title screen, start a new game, craft an item, autosave fires after 30 s, reload restores the state, and a test with a gamepad stub.
- **Performance check:** an automated headless run records frame times on a fixed camera path, and the build fails if the budget regresses.
- Manual testing on a mid-range Android phone, an iPhone (Safari), a tablet, and a desktop with an Xbox/PlayStation controller.

---

## 12. Risks

| Risk | Mitigation |
|---|---|
| iOS Safari doesn't support the Fullscreen API on iPhone | Fall back to the PWA (Add to Home Screen gives true fullscreen) and a minimal-UI layout, and say so in the settings |
| GPU memory on older phones | KTX2 textures, aggressive LOD, the Low tier, streaming chunks in and out |
| Scope is very large | Content is data, and each phase is shippable on its own. Cut content counts before cutting systems. |
| Photorealistic assets are big | Limit unique materials and reuse them (trim sheets, decals). Assets are CC0 only, credited in Credits. |
| Too close to existing raft games | Original setting, story, creatures, names and UI. No borrowed names, characters, art or music. |

---

## 13. Open questions for you

1. **Name:** keep "Driftwake" or choose another?
2. **Packaging:** a Vite build that outputs a single `index.html` (like Harbor Light) plus an `assets/` folder, or should everything be inlined in one file? Fully inlining makes realistic textures impractical.
3. **Languages:** English only, or English plus Swedish like Harbor Light?
4. **Where it lives:** in `driftwake/` in this repo (current assumption), or in a repo of its own?
