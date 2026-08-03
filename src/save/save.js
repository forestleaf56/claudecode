// save.js — persistent meta progression + settings via localStorage.

const KEY = 'plunder_seas_v1';

const DEFAULT = {
  doubloons: 0,
  bestScore: 0,
  bestGold: 0,
  runs: 0,
  ships: { sloop: true, frigate: false, galleon: false },
  ammo: { round: true, chain: false, grape: false },
  perks: { startHull: false, startCannon: false },
  chosenShip: 'sloop',
  settings: { muted: false, leftHanded: false, reduceMotion: false, aimAssist: true },
};

let data = null;

export function load() {
  if (data) return data;
  try {
    const raw = localStorage.getItem(KEY);
    data = raw ? deepMerge(structuredCloneSafe(DEFAULT), JSON.parse(raw)) : structuredCloneSafe(DEFAULT);
  } catch (e) {
    data = structuredCloneSafe(DEFAULT);
  }
  return data;
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
}

export function get() { return load(); }

function structuredCloneSafe(o) { return JSON.parse(JSON.stringify(o)); }
function deepMerge(base, over) {
  for (const k in over) {
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k])) {
      base[k] = deepMerge(base[k] || {}, over[k]);
    } else base[k] = over[k];
  }
  return base;
}
