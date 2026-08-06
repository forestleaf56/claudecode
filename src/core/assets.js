// assets.js — image loading and named lookups for the Kenney Pirate Pack

const images = new Map();

function load(name, url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { images.set(name, img); resolve(img); };
    img.onerror = () => { console.warn('Failed to load', url); images.set(name, null); resolve(null); };
    img.src = url;
  });
}

export function img(name) { return images.get(name) || null; }

// Build the manifest of everything we actually use.
function manifest() {
  const list = [];
  const add = (name, url) => list.push([name, url]);

  // Ships used as player classes, enemies, boss, wrecks.
  // The pack numbers ships 1..24; 19..24 are the greyed-out "sunk" variants.
  const ships = {
    sloop: 5, frigate: 11, galleon: 17,     // player classes (blue trim)
    manowar: 13,                              // Man-o'-War class (white sails)
    e_red: 3, e_green: 4, e_yellow: 6,       // enemy factions
    e_skull: 8, e_skull2: 14,                // raiders
    boss: 2,                                  // flagship (scaled up)
    wreck1: 19, wreck2: 20, wreck3: 22,       // sunk hulks
  };
  for (const [k, n] of Object.entries(ships)) add('ship_' + k, `assets/ships/ship (${n}).png`);
  add('dinghy1', 'assets/ships/dinghySmall1.png');
  add('dinghy2', 'assets/ships/dinghyLarge1.png');

  // Parts
  add('cannonball', 'assets/parts/cannonBall.png');
  add('flag', 'assets/parts/flag (3).png');
  for (let i = 1; i <= 4; i++) add('wood' + i, `assets/parts/wood (${i}).png`);

  // Effects
  for (let i = 1; i <= 3; i++) add('explosion' + i, `assets/effects/explosion${i}.png`);
  for (let i = 1; i <= 2; i++) add('fire' + i, `assets/effects/fire${i}.png`);

  // Tiles we reference by index (see GAME_PLAN tile map)
  const tiles = {
    sand: 4, grass: 40, stone: 74,
    palm1: 70, palm2: 71, palm3: 72,
    rock1: 49, rock2: 50, rock3: 51, rockMoss: 65,
    fortCannon1: 31, fortCannon2: 32, cannonPad: 30,
    wreckTile1: 81, wreckTile2: 82, plank1: 83, plank2: 84, barrel: 76,
  };
  for (const [k, n] of Object.entries(tiles)) {
    add('t_' + k, `assets/tiles/tile_${String(n).padStart(2, '0')}.png`);
  }
  return list;
}

export async function loadAll(onProgress) {
  const list = manifest();
  let done = 0;
  await Promise.all(list.map(([name, url]) =>
    load(name, url).then(() => { done++; onProgress && onProgress(done / list.length); })
  ));
}
