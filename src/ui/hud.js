// hud.js — in-play heads-up display. Returns clickable button rects.

import { THEME, panel, button, bar, text, textShadow, roundRect } from './ui.js';
import { stickInfo } from '../core/input.js';
import * as Audio from '../core/audio.js';

export function drawHud(ctx, game, w, h, save) {
  const buttons = [];
  const M = 12;
  const p = game.player;

  // ---- Virtual joystick ----
  const si = stickInfo();
  if (si) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(si.ox, si.oy, si.radius, 0, 6.28); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    const dx = si.x - si.ox, dy = si.y - si.oy;
    const d = Math.hypot(dx, dy) || 1; const cl = Math.min(d, si.radius);
    ctx.beginPath(); ctx.arc(si.ox + dx / d * cl, si.oy + dy / d * cl, 26, 0, 6.28); ctx.fill();
    ctx.restore();
  }

  // ---- Health / sails ----
  const barW = Math.min(230, w * 0.44);
  bar(ctx, M, M, barW, 16, p.hp / p.maxHp, THEME.red);
  bar(ctx, M, M, barW, 16, p.hp / p.maxHp, p.hp / p.maxHp > 0.3 ? THEME.green : THEME.red, 'rgba(0,0,0,0.5)');
  textShadow(ctx, `⚓ ${Math.max(0, Math.ceil(p.hp))}/${p.maxHp}`, M + 8, M + 13, 12, THEME.cream);
  bar(ctx, M, M + 22, barW * 0.7, 8, p.sailHp / p.maxSailHp, THEME.blue);
  textShadow(ctx, 'SAILS', M + barW * 0.7 + 8, M + 30, 10, '#cfe4f5');

  // ---- Gold / score / zone ----
  textShadow(ctx, `🪙 ${game.gold}`, M, M + 52, 18, THEME.gold);
  if (game.cargo > 0) textShadow(ctx, `📦 ${game.cargo}`, M + 100, M + 52, 16, THEME.green);
  textShadow(ctx, `Score ${game.score}`, M, M + 74, 13, THEME.cream);
  textShadow(ctx, `Zone ${game.zone + 1}`, M, M + 92, 13, game.zone > 2 ? THEME.red : '#cfe4f5');

  // ---- Top-right buttons ----
  const bs = 42;
  let bx = w - M - bs;
  const shopB = { x: bx, y: M, w: bs, h: bs, action: 'shop' };
  bx -= bs + 8;
  const pauseB = { x: bx, y: M, w: bs, h: bs, action: 'pause' };
  bx -= bs + 8;
  const muteB = { x: bx, y: M, w: bs, h: bs, action: 'mute' };
  button(ctx, shopB, '⚓'); button(ctx, pauseB, '⏸'); button(ctx, muteB, Audio.isMuted() ? '🔇' : '🔊');
  buttons.push(shopB, pauseB, muteB);

  // ---- Wind compass ----
  const cx = w - M - 34, cy = M + bs + 34, cr = 28;
  ctx.save();
  ctx.fillStyle = 'rgba(24,30,40,0.7)'; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, 6.28); ctx.fill();
  ctx.strokeStyle = THEME.gold; ctx.lineWidth = 2; ctx.stroke();
  const wd = game.world.windDir();
  ctx.strokeStyle = '#cfe4f5'; ctx.fillStyle = '#cfe4f5';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - wd.x * cr * 0.7, cy - wd.y * cr * 0.7);
  ctx.lineTo(cx + wd.x * cr * 0.7, cy + wd.y * cr * 0.7); ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + wd.x * cr * 0.7, cy + wd.y * cr * 0.7, 4, 0, 6.28); ctx.fill();
  text(ctx, 'WIND', cx, cy + cr + 12, 9, THEME.gold, 'center', 'bold');
  ctx.restore();

  // ---- Minimap ----
  drawMinimap(ctx, game, w, h);

  // ---- Fire button (bottom-right) ----
  const fr = Math.min(58, w * 0.13);
  const fx = w - M - fr * 2, fy = h - M - fr * 2;
  const ready = p.reloadL <= 0 || p.reloadR <= 0;
  ctx.save();
  ctx.globalAlpha = ready ? 0.85 : 0.4;
  const g = ctx.createRadialGradient(fx + fr, fy + fr, 4, fx + fr, fy + fr, fr);
  g.addColorStop(0, ready ? '#ff8a5c' : '#8a5a4a'); g.addColorStop(1, ready ? '#e9573f' : '#5c3a30');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx + fr, fy + fr, fr, 0, 6.28); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = THEME.gold; ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(fr * 0.5)}px system-ui`; ctx.fillText('💥', fx + fr, fy + fr);
  ctx.restore();
  buttons.push({ x: fx, y: fy, w: fr * 2, h: fr * 2, action: 'fire' });

  // reload arcs around fire button
  drawReload(ctx, fx + fr, fy + fr, fr + 6, p);

  // ammo label
  text(ctx, p.ammo.name, fx + fr, fy - 8, 11, THEME.gold, 'center', 'bold');

  return buttons;
}

function drawReload(ctx, cx, cy, r, p) {
  const segs = [
    { rem: p.reloadL, base: p.reload / p.reloadMult, a0: Math.PI * 0.55, a1: Math.PI * 0.95 },
    { rem: p.reloadR, base: p.reload / p.reloadMult, a0: Math.PI * 1.05, a1: Math.PI * 1.45 },
  ];
  ctx.save(); ctx.lineWidth = 4;
  for (const s of segs) {
    const frac = s.base > 0 ? 1 - Math.max(0, s.rem) / s.base : 1;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(cx, cy, r, s.a0, s.a1); ctx.stroke();
    ctx.strokeStyle = frac >= 1 ? THEME.green : THEME.gold;
    ctx.beginPath(); ctx.arc(cx, cy, r, s.a0, s.a0 + (s.a1 - s.a0) * frac); ctx.stroke();
  }
  ctx.restore();
}

function drawMinimap(ctx, game, w, h) {
  const size = Math.min(120, w * 0.26);
  const x = 12, y = h - size - 12;
  const scale = size / 5200; // world units shown
  ctx.save();
  ctx.globalAlpha = 0.85;
  roundRect(ctx, x, y, size, size, 10);
  ctx.fillStyle = 'rgba(20,40,55,0.85)'; ctx.fill();
  ctx.strokeStyle = THEME.gold; ctx.lineWidth = 2; ctx.stroke();
  ctx.clip();
  const cx = x + size / 2, cy = y + size / 2;
  const px = game.player.x, py = game.player.y;
  // islands near
  ctx.fillStyle = '#5c8a3a';
  for (const isl of game.world.islandsNear(px, py, 3)) {
    const mx = cx + (isl.x - px) * scale, my = cy + (isl.y - py) * scale;
    ctx.beginPath(); ctx.arc(mx, my, Math.max(2, isl.R * scale), 0, 6.28); ctx.fill();
  }
  // enemies
  const all = game.boss ? game.enemies.concat(game.boss) : game.enemies;
  for (const e of all) {
    if (e.sinking) continue;
    const mx = cx + (e.x - px) * scale, my = cy + (e.y - py) * scale;
    ctx.fillStyle = e.isBoss ? '#ffce54' : '#e9573f';
    ctx.beginPath(); ctx.arc(mx, my, e.isBoss ? 4 : 2.5, 0, 6.28); ctx.fill();
  }
  // player
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 6.28); ctx.fill();
  ctx.restore();
}
