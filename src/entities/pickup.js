// pickup.js — gold coins & cargo that magnet to the player.

import { img } from '../core/assets.js';
import { rand, dist } from '../core/math.js';

export class Pickups {
  constructor() { this.list = []; }

  spawnGold(x, y, value) {
    const n = Math.min(8, 2 + Math.floor(value / 8));
    const per = Math.max(1, Math.round(value / n));
    for (let i = 0; i < n; i++) {
      const a = rand(0, 6.28), sp = rand(20, 70);
      this.list.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        kind: 'gold', value: per, t: 0, life: 16, bob: rand(0, 6.28),
      });
    }
  }

  spawnCargo(x, y) {
    this.list.push({ x, y, vx: 0, vy: 0, kind: 'cargo', value: 0, t: 0, life: 22, bob: rand(0, 6.28) });
  }

  update(dt, player, onCollect) {
    for (const p of this.list) {
      p.t += dt; p.bob += dt * 4;
      p.vx *= 0.9; p.vy *= 0.9;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (player && !player.dead) {
        const d = dist(p.x, p.y, player.x, player.y);
        const magnet = p.kind === 'cargo' ? 70 : 150;
        if (d < magnet) {
          const k = (1 - d / magnet) * 520 * dt;
          p.x += (player.x - p.x) / (d || 1) * k;
          p.y += (player.y - p.y) / (d || 1) * k;
        }
        if (d < player.radius + 10) { p.collected = true; onCollect(p); }
      }
    }
    this.list = this.list.filter((p) => !p.collected && p.t < p.life);
  }

  draw(ctx) {
    for (const p of this.list) {
      const fade = p.t > p.life - 3 ? (p.life - p.t) / 3 : 1;
      ctx.globalAlpha = Math.max(0, fade);
      const yy = p.y + Math.sin(p.bob) * 2;
      if (p.kind === 'gold') {
        ctx.fillStyle = '#f6bb42';
        ctx.strokeStyle = '#d49a20'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, yy, 6, 0, 6.28); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff3c4';
        ctx.beginPath(); ctx.arc(p.x - 1.5, yy - 1.5, 2, 0, 6.28); ctx.fill();
      } else {
        const im = img('t_barrel');
        if (im) ctx.drawImage(im, p.x - 14, yy - 14, 28, 28);
        else { ctx.fillStyle = '#a86b34'; ctx.fillRect(p.x - 8, yy - 10, 16, 20); }
      }
    }
    ctx.globalAlpha = 1;
  }
}
