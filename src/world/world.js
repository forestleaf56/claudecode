// world.js — infinite procedural archipelago + animated water + wind.
// Islands are placed deterministically per grid cell so the world is
// effectively infinite without storing state.

import { img } from '../core/assets.js';
import { WORLD } from '../data/config.js';
import { mulberry32, forwardVec, clamp } from '../core/math.js';

const CELL = 1150;          // island placement grid
const TILE = WORLD.tile;

function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ 0x9e3779b9;
  h = (h ^ (h >>> 13)) * 1274126177;
  return (h ^ (h >>> 16)) >>> 0;
}

// Island params for a given cell, or null if that cell has no island.
function islandFor(cx, cy) {
  const seed = hash2(cx + 10007, cy + 20011);
  const rng = mulberry32(seed);
  if (rng() > 0.6) return null;
  const jx = (rng() - 0.5) * CELL * 0.55;
  const jy = (rng() - 0.5) * CELL * 0.55;
  const ix = cx * CELL + jx;
  const iy = cy * CELL + jy;
  const R = 230 + rng() * 380;
  // keep spawn area (near origin) clear of land
  if (Math.hypot(ix, iy) < 520) return null;
  return {
    x: ix, y: iy, R,
    a: rng() * 6.28, b: rng() * 6.28, c: rng() * 6.28,
    w1: 0.18 + rng() * 0.12, w2: 0.06 + rng() * 0.08,
    seed,
  };
}

function islandHeight(isl, x, y) {
  const dx = x - isl.x, dy = y - isl.y;
  const d = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);
  const wob = 1 + isl.w1 * Math.sin(ang * 3 + isl.a)
                + isl.w2 * Math.sin(ang * 5 + isl.b)
                + 0.05 * Math.sin(ang * 8 + isl.c);
  const edge = isl.R * wob;
  return 1 - d / edge; // 1 at centre, 0 at coast, <0 offshore
}

export class World {
  constructor() {
    this.time = 0;
    this.windAngle = Math.random() * 6.28;
    this.windTurn = 0.05;
    this.windStrength = 0.5;
    this._islCache = new Map();
  }

  islandsNear(x, y, pad = 1) {
    const cx = Math.round(x / CELL), cy = Math.round(y / CELL);
    const out = [];
    for (let gy = cy - pad; gy <= cy + pad; gy++)
      for (let gx = cx - pad; gx <= cx + pad; gx++) {
        const key = gx + ',' + gy;
        let isl = this._islCache.get(key);
        if (isl === undefined) { isl = islandFor(gx, gy); this._islCache.set(key, isl); }
        if (isl) out.push(isl);
      }
    return out;
  }

  // Terrain at a world point. Returns {h, type, isl}
  sample(x, y) {
    let best = -Infinity, bestIsl = null;
    for (const isl of this.islandsNear(x, y)) {
      const h = islandHeight(isl, x, y);
      if (h > best) { best = h; bestIsl = isl; }
    }
    let type = 'water';
    if (best > 0.4) type = 'grass';
    else if (best > 0.015) type = 'sand';
    else if (best > -0.12) type = 'shallow';
    return { h: best, type, isl: bestIsl };
  }

  isLand(x, y) { return this.sample(x, y).type === 'grass' || this.sample(x, y).type === 'sand'; }

  update(dt) {
    this.time += dt;
    this.windAngle += this.windTurn * dt;
    this.windStrength = 0.5 + 0.35 * Math.sin(this.time * 0.13);
  }

  windDir() { return forwardVec(this.windAngle); }

  // Speed multiplier for a ship heading, from tailwind (fast) to headwind (slow).
  windFactor(shipForward) {
    const w = this.windDir();
    const dot = shipForward.x * w.x + shipForward.y * w.y; // -1..1
    return 0.78 + 0.32 * (dot * this.windStrength + 0.5);
  }

  // ---- Rendering ----
  drawWater(ctx, cam, w, h) {
    // flat sea fill in screen space (CSS px, DPR baked in)
    cam.applyScreen(ctx);
    ctx.fillStyle = WORLD.waterColor;
    ctx.fillRect(0, 0, w, h);

    // moving wave streaks (cheap parallax) in screen space
    const t = this.time;
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    const spacing = 46;
    const off = (t * 22) % spacing;
    ctx.beginPath();
    for (let yy = -spacing; yy < h + spacing; yy += spacing) {
      const y0 = yy + off;
      for (let xx = -spacing; xx < w + spacing; xx += spacing) {
        const wob = Math.sin((xx + t * 30) * 0.02) * 4;
        ctx.moveTo(xx, y0 + wob);
        ctx.lineTo(xx + 18, y0 + wob + 6);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  drawLand(ctx, cam, w, h) {
    // world-space tile draw of land + decoration for the visible region
    const half = cam.zoom;
    const wx = cam.x, wy = cam.y;
    const viewW = w / cam.zoom, viewH = h / cam.zoom;
    const x0 = Math.floor((wx - viewW / 2) / TILE) - 1;
    const x1 = Math.ceil((wx + viewW / 2) / TILE) + 1;
    const y0 = Math.floor((wy - viewH / 2) / TILE) - 1;
    const y1 = Math.ceil((wy + viewH / 2) / TILE) + 1;

    const sand = img('t_sand'), grass = img('t_grass');
    const shallowColor = WORLD.waterShallow;

    // First pass: shallow water halo (drawn as translucent rects)
    ctx.save();
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const cxp = tx * TILE + TILE / 2, cyp = ty * TILE + TILE / 2;
        const s = this.sample(cxp, cyp);
        if (s.type === 'shallow') {
          ctx.fillStyle = shallowColor;
          ctx.globalAlpha = 0.55;
          ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        }
      }
    }
    ctx.globalAlpha = 1;

    // Second pass: sand then grass tiles + decorations
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const cxp = tx * TILE + TILE / 2, cyp = ty * TILE + TILE / 2;
        const s = this.sample(cxp, cyp);
        if (s.type === 'sand' || s.type === 'grass') {
          const t = (s.type === 'grass' && grass) ? grass : sand;
          if (t) ctx.drawImage(t, tx * TILE, ty * TILE, TILE, TILE);
          else { ctx.fillStyle = s.type === 'grass' ? '#57b04a' : '#efdba8'; ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE); }
        }
        if (s.type === 'grass') this.drawDecor(ctx, tx, ty, cxp, cyp);
      }
    }
    ctx.restore();
  }

  drawDecor(ctx, tx, ty, cxp, cyp) {
    const hsh = hash2(tx + 5000, ty + 7000);
    const r = (hsh % 1000) / 1000;
    if (r > 0.82) {
      // only place decor well inside grass (avoid coast fringes)
      const s = this.sample(cxp, cyp);
      if (s.h < 0.5) return;
      let sprite = null, sc = 0.55;
      const kind = hsh % 5;
      if (kind === 0) sprite = img('t_palm2'), sc = 0.7;
      else if (kind === 1) sprite = img('t_palm1'), sc = 0.7;
      else if (kind === 2) sprite = img('t_rock1');
      else if (kind === 3) sprite = img('t_rock2');
      else sprite = img('t_rockMoss');
      if (sprite) {
        const jx = ((hsh >> 3) % 20) - 10, jy = ((hsh >> 7) % 20) - 10;
        const dw = sprite.width * sc, dh = sprite.height * sc;
        ctx.drawImage(sprite, cxp + jx - dw / 2, cyp + jy - dh / 2, dw, dh);
      }
    }
  }
}
