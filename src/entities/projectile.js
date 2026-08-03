// projectile.js — pooled cannonballs.

import { img } from '../core/assets.js';

export class Projectiles {
  constructor() { this.list = []; this.pool = []; }

  spawn(x, y, vx, vy, opts) {
    const p = this.pool.pop() || {};
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.life = opts.life; p.t = 0;
    p.dmg = opts.dmg; p.sailDmg = opts.sailDmg || 0;
    p.friendly = opts.friendly;
    p.radius = 5;
    p.dead = false;
    this.list.push(p);
    return p;
  }

  update(dt, world, effects) {
    for (const p of this.list) {
      p.t += dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t >= p.life) { p.dead = true; effects.splash(p.x, p.y); continue; }
      // hit land -> splash
      const s = world.sample(p.x, p.y);
      if (s.type === 'grass' || s.type === 'sand') { p.dead = true; effects.splash(p.x, p.y); }
    }
    // recycle
    const keep = [];
    for (const p of this.list) { if (p.dead) this.pool.push(p); else keep.push(p); }
    this.list = keep;
  }

  draw(ctx) {
    const im = img('cannonball');
    for (const p of this.list) {
      // slight shadow for readability over water
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#0a2a3a';
      ctx.beginPath(); ctx.arc(p.x + 2, p.y + 3, 5, 0, 6.28); ctx.fill();
      ctx.globalAlpha = 1;
      if (im) ctx.drawImage(im, p.x - im.width / 2, p.y - im.height / 2);
      else { ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 6.28); ctx.fill(); }
    }
  }
}
