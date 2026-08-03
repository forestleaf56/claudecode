// screens.js — menus: title, shipyard, settings, pause, quartermaster, game over.
// Each returns an array of clickable buttons: {x,y,w,h,action,...}.

import { THEME, panel, button, text, textShadow, pointIn } from './ui.js';
import { SHIP_CLASSES, CANNON_TYPES, UPGRADES, TREASURY } from '../data/config.js';
import * as Audio from '../core/audio.js';

function overlay(ctx, w, h, a = 0.5) {
  ctx.fillStyle = `rgba(10,20,30,${a})`;
  ctx.fillRect(0, 0, w, h);
}

function panelBox(ctx, w, h, pw, ph) {
  const x = (w - pw) / 2, y = (h - ph) / 2;
  panel(ctx, x, y, pw, ph);
  return { x, y, pw, ph };
}

// ---------- TITLE ----------
export function title(ctx, w, h, save) {
  overlay(ctx, w, h, 0.35);
  const cx = w / 2;
  // auto-fit the title to the viewport width
  let ts = Math.min(48, w * 0.12);
  ctx.font = `bold ${ts}px system-ui, sans-serif`;
  const maxW = w * 0.9;
  const tw = ctx.measureText('🏴‍☠️ PLUNDER SEAS').width;
  if (tw > maxW) ts *= maxW / tw;
  textShadow(ctx, '🏴‍☠️ PLUNDER SEAS', cx, h * 0.24, ts, THEME.gold, 'center', 'bold');
  textShadow(ctx, 'a naval combat roguelite', cx, h * 0.24 + 30, 16, THEME.cream, 'center');
  textShadow(ctx, `Doubloons: ${save.doubloons}   •   Best: ${save.bestScore}`, cx, h * 0.24 + 58, 14, '#cfe4f5', 'center');

  const bw = Math.min(300, w * 0.7), bh = 56, gap = 16;
  let y = h * 0.44;
  const mk = (label, action, sub) => { const b = { x: cx - bw / 2, y, w: bw, h: bh, action }; button(ctx, b, label, { sub, active: action === 'play' }); y += bh + gap; return b; };
  const bs = [
    mk('⚔  SET SAIL', 'play', `Command your ${SHIP_CLASSES[save.chosenShip].name}`),
    mk('⚓  SHIPYARD', 'shipyard', 'Spend doubloons • pick ship'),
    mk('⚙  SETTINGS', 'settings'),
  ];
  textShadow(ctx, 'Art: Kenney.nl (CC0)  •  Left thumb steers, right taps fire', cx, h - 20, 11, '#bcd0e0', 'center');
  return bs;
}

// ---------- SHIPYARD (treasury) ----------
export function shipyard(ctx, w, h, save) {
  overlay(ctx, w, h, 0.55);
  const pw = Math.min(w - 24, 460), ph = Math.min(h - 24, 620);
  const box = panelBox(ctx, w, h, pw, ph);
  const cx = w / 2;
  textShadow(ctx, 'SHIPYARD', cx, box.y + 40, 28, THEME.gold, 'center', 'bold');
  textShadow(ctx, `Doubloons: ${save.doubloons}`, cx, box.y + 66, 16, THEME.cream, 'center');
  const buttons = [];
  let y = box.y + 88;
  const bw = pw - 48, x = box.x + 24;

  text(ctx, 'CHOOSE SHIP', x, y, 13, THEME.gold, 'left', 'bold'); y += 10;
  for (const [id, s] of Object.entries(SHIP_CLASSES)) {
    const owned = save.ships[id];
    const active = save.chosenShip === id;
    const b = { x, y, w: bw, h: 46, action: owned ? 'chooseShip' : 'buyShip', id };
    const label = owned ? s.name : `${s.name}  🔒`;
    const sub = owned ? (active ? '✓ selected' : s.desc) : `Unlock: ${TREASURY[id] ? TREASURY[id].cost : s.cost} doubloons`;
    button(ctx, b, label, { sub, active, disabled: !owned && save.doubloons < (TREASURY[id] ? TREASURY[id].cost : 99999) });
    buttons.push(b); y += 52;
  }

  y += 6; text(ctx, 'UNLOCKS', x, y, 13, THEME.gold, 'left', 'bold'); y += 10;
  const perks = ['startHull', 'startCannon', 'chain', 'grape'];
  const colW = (bw - 12) / 2;
  perks.forEach((id, i) => {
    const t = TREASURY[id];
    const owned = (t.kind === 'stat' && save.perks[t.id]) || (t.kind === 'ammo' && save.ammo[t.id]);
    const bx = x + (i % 2) * (colW + 12);
    const by = y + Math.floor(i / 2) * 58;
    const b = { x: bx, y: by, w: colW, h: 50, action: owned ? null : 'buyPerk', id };
    button(ctx, b, t.name, { sub: owned ? '✓ owned' : `${t.cost}`, active: owned, disabled: !owned && save.doubloons < t.cost });
    if (!owned) buttons.push(b);
  });
  y += 2 * 58 + 8;

  const back = { x: cx - 80, y: box.y + ph - 58, w: 160, h: 44, action: 'back' };
  button(ctx, back, '‹ BACK'); buttons.push(back);
  return buttons;
}

// ---------- SETTINGS ----------
export function settings(ctx, w, h, save) {
  overlay(ctx, w, h, 0.55);
  const pw = Math.min(w - 24, 420), ph = Math.min(h - 24, 460);
  const box = panelBox(ctx, w, h, pw, ph);
  const cx = w / 2;
  textShadow(ctx, 'SETTINGS', cx, box.y + 42, 28, THEME.gold, 'center', 'bold');
  const buttons = [];
  const bw = pw - 48, x = box.x + 24;
  let y = box.y + 74;
  const toggle = (label, key, val) => {
    const b = { x, y, w: bw, h: 50, action: 'toggle', key };
    button(ctx, b, label, { sub: val ? 'ON' : 'OFF', active: val });
    buttons.push(b); y += 60;
  };
  toggle('Sound', 'muted', !save.settings.muted);
  toggle('Left-handed layout', 'leftHanded', save.settings.leftHanded);
  toggle('Aim assist', 'aimAssist', save.settings.aimAssist);
  toggle('Reduced motion', 'reduceMotion', save.settings.reduceMotion);
  const back = { x: cx - 80, y: box.y + ph - 58, w: 160, h: 44, action: 'back' };
  button(ctx, back, '‹ BACK'); buttons.push(back);
  return buttons;
}

// ---------- PAUSE ----------
export function pause(ctx, w, h, save) {
  overlay(ctx, w, h, 0.5);
  const cx = w / 2;
  textShadow(ctx, 'PAUSED', cx, h * 0.34, 34, THEME.gold, 'center', 'bold');
  const bw = Math.min(280, w * 0.7), bh = 52, gap = 14;
  let y = h * 0.42;
  const mk = (label, action) => { const b = { x: cx - bw / 2, y, w: bw, h: bh, action }; button(ctx, b, label); y += bh + gap; return b; };
  return [
    mk('▶  RESUME', 'resume'),
    mk('⚓  QUARTERMASTER', 'shop'),
    mk('⚙  SETTINGS', 'settings'),
    mk('🏳  RETIRE (bank gold)', 'retire'),
  ];
}

// ---------- QUARTERMASTER (in-run shop) ----------
export function shop(ctx, w, h, game, save) {
  overlay(ctx, w, h, 0.55);
  const pw = Math.min(w - 20, 480), ph = Math.min(h - 20, 600);
  const box = panelBox(ctx, w, h, pw, ph);
  const cx = w / 2;
  textShadow(ctx, 'QUARTERMASTER', cx, box.y + 40, 26, THEME.gold, 'center', 'bold');
  textShadow(ctx, `🪙 ${game.gold}`, cx, box.y + 64, 18, THEME.gold, 'center', 'bold');
  const buttons = [];
  const x = box.x + 22, bw = pw - 44;
  let y = box.y + 82;

  const grid = ['hull', 'sails', 'cannon', 'reload'];
  const colW = (bw - 12) / 2;
  grid.forEach((id, i) => {
    const u = UPGRADES[id];
    const lvl = game.up[id];
    const cost = game.upgradeCost(id);
    const maxed = lvl >= u.max;
    const bx = x + (i % 2) * (colW + 12);
    const by = y + Math.floor(i / 2) * 66;
    const b = { x: bx, y: by, w: colW, h: 58, action: 'buy', id };
    button(ctx, b, `${u.icon} ${u.name}`, {
      sub: maxed ? 'MAX' : `Lv${lvl} • ${cost}`,
      disabled: maxed || game.gold < cost,
    });
    buttons.push(b);
  });
  y += 2 * 66 + 6;

  const rc = game.upgradeCost('repair');
  const repairB = { x, y, w: bw, h: 50, action: 'buy', id: 'repair' };
  button(ctx, repairB, `🔧 Repair Hull`, { sub: `${rc}`, disabled: !game.canUpgrade('repair') });
  buttons.push(repairB); y += 60;

  text(ctx, 'AMMO', x, y, 13, THEME.gold, 'left', 'bold'); y += 10;
  const ammoIds = Object.keys(CANNON_TYPES);
  const aw = (bw - 2 * 8) / 3;
  ammoIds.forEach((id, i) => {
    const unlocked = save.ammo[id];
    const active = game.player.ammo === CANNON_TYPES[id];
    const b = { x: x + i * (aw + 8), y, w: aw, h: 46, action: unlocked ? 'ammo' : null, id };
    button(ctx, b, CANNON_TYPES[id].name, { active, disabled: !unlocked });
    if (unlocked) buttons.push(b);
  });
  y += 56;

  const close = { x: cx - 90, y: box.y + ph - 56, w: 180, h: 44, action: 'resume' };
  button(ctx, close, 'CLOSE', { active: true }); buttons.push(close);
  return buttons;
}

// ---------- GAME OVER ----------
export function gameover(ctx, w, h, game, save) {
  overlay(ctx, w, h, 0.6);
  const cx = w / 2;
  const won = game.reason === 'retired';
  textShadow(ctx, won ? '⚓ RETIRED TO PORT' : '☠  SHIP LOST', cx, h * 0.26, Math.min(34, w * 0.09), won ? THEME.green : THEME.red, 'center', 'bold');
  const pw = Math.min(w - 24, 400);
  const x = cx - pw / 2;
  let y = h * 0.34;
  const line = (l, v, col = THEME.cream) => { textShadow(ctx, l, x, y, 16, '#cfe4f5', 'left'); textShadow(ctx, `${v}`, x + pw, y, 16, col, 'right', 'bold'); y += 26; };
  line('Score', game.score, THEME.gold);
  line('Gold plundered', game.gold, THEME.gold);
  line('Ships sunk', game.kills);
  line('Deepest zone', game.zone + 1);
  if (game.bossDefeated) line('Leviathan', 'SLAIN', THEME.green);
  y += 6;
  line('Doubloons banked', `+${game.doubloonsEarned}`, THEME.gold);

  const bw = Math.min(280, w * 0.72), bh = 52, gap = 14;
  y += 20;
  const mk = (label, action, active) => { const b = { x: cx - bw / 2, y, w: bw, h: bh, action }; button(ctx, b, label, { active }); y += bh + gap; return b; };
  return [
    mk('⚔  SAIL AGAIN', 'play', true),
    mk('⚓  SHIPYARD', 'shipyard'),
    mk('🏠  TITLE', 'title'),
  ];
}

// ---------- LOADING ----------
export function loading(ctx, w, h, frac) {
  ctx.fillStyle = '#3d6a86'; ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  textShadow(ctx, '🏴‍☠️ PLUNDER SEAS', cx, cy - 20, Math.min(40, w * 0.1), THEME.gold, 'center', 'bold');
  const bw = Math.min(280, w * 0.6);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(cx - bw / 2, cy + 10, bw, 10);
  ctx.fillStyle = THEME.gold; ctx.fillRect(cx - bw / 2, cy + 10, bw * frac, 10);
  textShadow(ctx, 'Hoisting the colours…', cx, cy + 44, 13, THEME.cream, 'center');
}
