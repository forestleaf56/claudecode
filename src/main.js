// main.js — bootstrap, canvas/DPR, game loop, state machine, input dispatch.

import * as Assets from './core/assets.js';
import * as Input from './core/input.js';
import * as Audio from './core/audio.js';
import * as Save from './save/save.js';
import { World } from './world/world.js';
import { Game } from './game/game.js';
import { drawHud } from './ui/hud.js';
import * as Screens from './ui/screens.js';
import { pointIn } from './ui/ui.js';
import { TREASURY, SHIP_CLASSES } from './data/config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const save = Save.load();

let W = 0, H = 0, DPR = 1;
let state = 'loading';
let loadFrac = 0;
let buttons = [];          // hit-test targets for taps
let settingsFromPlay = false;
let returnTo = 'title';

const game = new Game();
const menuWorld = new World();
if (typeof window !== 'undefined') window.__game = game; // dev/testing hook

// ---- Resize / DPR ----
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  game.cam.dpr = DPR;
  // zoom: show more world on bigger screens, keep ships readable on phones
  game.cam.zoom = Math.max(0.62, Math.min(1.05, Math.min(W, H) / 720));
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);

// ---- Apply persisted settings ----
function applySettings() {
  Audio.setMuted(save.settings.muted);
  Input.setLeftHanded(save.settings.leftHanded);
  game.cam.reduceMotion = save.settings.reduceMotion;
}

// ---- Boot ----
async function boot() {
  resize();
  Input.attach(canvas);
  applySettings();
  await Assets.loadAll((f) => { loadFrac = f; });
  state = 'title';
}

// ---- Input dispatch ----
function findButton(x, y) {
  for (let i = buttons.length - 1; i >= 0; i--) if (pointIn(buttons[i], x, y)) return buttons[i];
  return null;
}

function handleTaps() {
  const taps = Input.consumeTaps();
  for (const t of taps) {
    const b = findButton(t.x, t.y);
    if (b && b.action) { Audio.ensureStarted(); if (b.action !== 'fire') Audio.ui(); doAction(b); }
    else if (state === 'play') { Audio.ensureStarted(); game.fire(); }
  }
  // keyboard shortcuts
  if (state === 'play') {
    if (Input.keyFireEdge()) game.fire();
    if (Input.keyDown('escape')) { state = 'pause'; Input.setGameplayMode(false); }
  } else if (Input.keyDown('escape') && (state === 'pause' || state === 'shop')) {
    state = 'play'; Input.setGameplayMode(true);
  }
}

function startRun() {
  Audio.ensureStarted();
  applySettings();
  game.start(save.chosenShip, 'round');
  state = 'play';
  Input.setGameplayMode(true);
}

function doAction(b) {
  switch (b.action) {
    case 'play': startRun(); break;
    case 'shipyard': returnTo = state; state = 'shipyard'; break;
    case 'settings': settingsFromPlay = (state === 'pause'); returnTo = state; state = 'settings'; break;
    case 'back':
      state = returnTo;
      if (state === 'pause') Input.setGameplayMode(false);
      break;
    case 'resume': state = 'play'; Input.setGameplayMode(true); break;
    case 'pause': state = 'pause'; Input.setGameplayMode(false); break;
    case 'shop': state = 'shop'; Input.setGameplayMode(false); break;
    case 'retire': game.retire(); state = 'gameover'; Input.setGameplayMode(false); break;
    case 'title': state = 'title'; Input.setGameplayMode(false); break;
    case 'fire': game.fire(); break;
    case 'mute':
      save.settings.muted = !save.settings.muted; Audio.setMuted(save.settings.muted); Save.save(); break;
    case 'buy': game.buyUpgrade(b.id); break;
    case 'ammo': game.setAmmo(b.id); break;
    case 'chooseShip': save.chosenShip = b.id; Save.save(); break;
    case 'buyShip': buyTreasury(b.id, true); break;
    case 'buyPerk': buyTreasury(b.id, false); break;
    case 'toggle': toggleSetting(b.key); break;
  }
}

function buyTreasury(id, isShip) {
  const t = TREASURY[id] || (SHIP_CLASSES[id] ? { cost: SHIP_CLASSES[id].cost, kind: 'ship', id } : null);
  if (!t) return;
  if (save.doubloons < t.cost) return;
  save.doubloons -= t.cost;
  if (t.kind === 'ship') { save.ships[t.id] = true; save.chosenShip = t.id; }
  else if (t.kind === 'stat') save.perks[t.id] = true;
  else if (t.kind === 'ammo') save.ammo[t.id] = true;
  Audio.upgrade();
  Save.save();
}

function toggleSetting(key) {
  if (key === 'muted') { save.settings.muted = !save.settings.muted; Audio.setMuted(save.settings.muted); }
  else { save.settings[key] = !save.settings[key]; }
  if (key === 'leftHanded') Input.setLeftHanded(save.settings.leftHanded);
  if (key === 'reduceMotion') { game.cam.reduceMotion = save.settings.reduceMotion; game.effects.reduceMotion = save.settings.reduceMotion; }
  Save.save();
}

// ---- Loop ----
let last = performance.now();
let acc = 0;
const STEP = 1 / 60;

function frame(now) {
  let dt = (now - last) / 1000; last = now;
  if (dt > 0.1) dt = 0.1;
  requestAnimationFrame(frame);

  handleTaps();

  if (state === 'play') {
    game.setSteer(Input.steer());
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) { game.update(STEP); acc -= STEP; steps++; }
    if (game.state === 'dead') { state = 'gameover'; Input.setGameplayMode(false); }
  } else {
    menuWorld.update(dt);
    game.cam.update(dt);
  }

  render(dt);
}

function showsGame() {
  return ['play', 'pause', 'shop', 'gameover'].includes(state) || (state === 'settings' && settingsFromPlay);
}

function render(dt) {
  // clear
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (state === 'loading') { game.cam.applyScreen(ctx); Screens.loading(ctx, W, H, loadFrac); return; }

  if (showsGame()) {
    game.draw(ctx, W, H); // leaves screen-space transform
    // HUD visuals always while a run exists
    if (game.player) { const hb = drawHud(ctx, game, W, H, save); if (state === 'play') buttons = hb; }
  } else {
    // menu water backdrop
    menuWorld.drawWater(ctx, game.cam, W, H);
    game.cam.applyScreen(ctx);
  }

  switch (state) {
    case 'title': buttons = Screens.title(ctx, W, H, save); break;
    case 'shipyard': buttons = Screens.shipyard(ctx, W, H, save); break;
    case 'settings': buttons = Screens.settings(ctx, W, H, save); break;
    case 'pause': buttons = Screens.pause(ctx, W, H, save); break;
    case 'shop': buttons = Screens.shop(ctx, W, H, game, save); break;
    case 'gameover': buttons = Screens.gameover(ctx, W, H, game, save); break;
    // 'play' keeps HUD buttons set above
  }
}

boot();
requestAnimationFrame(frame);
