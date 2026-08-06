// config.js — all gameplay tuning in one place.

export const WORLD = {
  tile: 64,
  waterColor: '#5fa9d1',
  waterDeep: '#4f97c0',
  waterShallow: '#8fcbe6',
};

// Player ship classes, unlocked via the treasury (meta).
export const SHIP_CLASSES = {
  sloop: {
    name: 'Sloop', sprite: 'ship_sloop', scale: 0.62,
    hp: 100, speed: 235, turn: 2.7, cannons: 2, reload: 1.05,
    damage: 14, radius: 22, cost: 0,
    desc: 'Nimble and quick. A fine first command.',
  },
  frigate: {
    name: 'Frigate', sprite: 'ship_frigate', scale: 0.78,
    hp: 165, speed: 205, turn: 2.1, cannons: 3, reload: 1.15,
    damage: 18, radius: 27, cost: 400,
    desc: 'Balanced hull with a heavier broadside.',
  },
  galleon: {
    name: 'Galleon', sprite: 'ship_galleon', scale: 0.95,
    hp: 260, speed: 175, turn: 1.6, cannons: 4, reload: 1.35,
    damage: 22, radius: 33, cost: 1100,
    desc: 'A floating fortress. Slow, but devastating.',
  },
};

// Cannon types (unlock/switch during a run or via treasury)
export const CANNON_TYPES = {
  round:  { name: 'Round Shot', speed: 620, life: 0.85, dmg: 1.0, sailDmg: 0.4, spread: 0.10, color: '#3a3a3a' },
  chain:  { name: 'Chain Shot', speed: 540, life: 0.8,  dmg: 0.6, sailDmg: 1.6, spread: 0.14, color: '#6b5a3a' },
  grape:  { name: 'Grapeshot', speed: 560, life: 0.5,  dmg: 0.55, sailDmg: 0.4, spread: 0.42, count: 3, color: '#555' },
};

// Enemy archetypes. tier gates when they appear.
export const ENEMIES = {
  scout: {
    name: 'Scout', sprite: 'dinghy2', scale: 1.3, tier: 0,
    hp: 24, speed: 250, turn: 3.2, cannons: 1, reload: 1.9, damage: 6,
    radius: 15, range: 300, gold: [4, 9], score: 10, aggression: 1.15,
  },
  raider: {
    name: 'Raider', sprite: 'ship_e_red', scale: 0.62, tier: 0,
    hp: 54, speed: 205, turn: 2.4, cannons: 2, reload: 1.8, damage: 9,
    radius: 22, range: 340, gold: [10, 20], score: 25, aggression: 1.0,
  },
  gunship: {
    name: 'Gunship', sprite: 'ship_e_green', scale: 0.7, tier: 1,
    hp: 100, speed: 190, turn: 2.0, cannons: 3, reload: 1.5, damage: 15,
    radius: 26, range: 380, gold: [18, 34], score: 45, aggression: 0.95,
  },
  bruiser: {
    name: 'Bruiser', sprite: 'ship_e_yellow', scale: 0.8, tier: 2,
    hp: 165, speed: 160, turn: 1.6, cannons: 4, reload: 1.7, damage: 20,
    radius: 30, range: 420, gold: [30, 55], score: 75, aggression: 0.85,
  },
  raker: {
    name: 'Skull Raker', sprite: 'ship_e_skull', scale: 0.72, tier: 2,
    hp: 130, speed: 220, turn: 2.6, cannons: 3, reload: 1.25, damage: 16,
    radius: 26, range: 380, gold: [28, 50], score: 70, aggression: 1.25,
  },
};

export const BOSS = {
  name: 'The Leviathan', sprite: 'ship_boss', scale: 1.7,
  hp: 900, speed: 130, turn: 1.15, cannons: 6, reload: 1.5, damage: 26,
  radius: 52, range: 560, gold: [400, 500], score: 1000, aggression: 0.8,
};

// In-run upgrade nodes bought from the Quartermaster with gold.
export const UPGRADES = {
  hull:   { name: 'Reinforce Hull', desc: '+22% max hull', icon: '🛡️', base: 60, growth: 1.55, max: 6 },
  sails:  { name: 'Trim Sails',     desc: '+8% speed & turn', icon: '⛵', base: 55, growth: 1.5, max: 6 },
  cannon: { name: 'Cast Cannons',   desc: '+18% cannon damage', icon: '💥', base: 65, growth: 1.55, max: 6 },
  reload: { name: 'Drill Crew',     desc: '+12% reload speed', icon: '🎯', base: 55, growth: 1.5, max: 6 },
  repair: { name: 'Repair Hull',    desc: 'Restore hull to full', icon: '🔧', base: 40, growth: 1.35, max: 99 },
};

// Meta treasury unlocks (persist between runs).
export const TREASURY = {
  frigate: { name: 'Commission Frigate', desc: 'Unlock the Frigate class', cost: 400, kind: 'ship', id: 'frigate' },
  galleon: { name: 'Commission Galleon', desc: 'Unlock the Galleon class', cost: 1100, kind: 'ship', id: 'galleon' },
  startHull: { name: 'Iron Keel', desc: '+20 starting hull, permanently', cost: 250, kind: 'stat', id: 'startHull' },
  startCannon: { name: 'Master Gunners', desc: '+15% damage, permanently', cost: 350, kind: 'stat', id: 'startCannon' },
  chain: { name: 'Chain Shot', desc: 'Unlock Chain Shot ammo', cost: 300, kind: 'ammo', id: 'chain' },
  grape: { name: 'Grapeshot', desc: 'Unlock Grapeshot ammo', cost: 300, kind: 'ammo', id: 'grape' },
};

export const RUN = {
  bankRate: 0.35,       // fraction of run gold converted to treasury on run end
  zoneRadius: 2600,     // world distance per difficulty zone
  killsToBoss: 24,      // kills before the boss can appear
  baseEnemies: 2,       // target enemies near player at zone 0 (gentle start)
  grace: 5,             // seconds at run start before enemies spawn
};
