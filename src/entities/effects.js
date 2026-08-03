// effects.js — pooled particles, sprite explosions, floating text.

import { img } from '../core/assets.js';
import { rand, pick } from '../core/math.js';

export class Effects {
  constructor() {
    this.parts = [];   // generic particles
    this.booms = [];   // sprite explosions
    this.texts = [];   // floating labels
    this.reduceMotion = false;
  }

  _cap(arr, n) { if (arr.length > n) arr.splice(0, arr.length - n); }

  explosion(x, y, scale = 1) {
    this.booms.push({ x, y, scale, t: 0, dur: 0.42 });
    if (this.reduceMotion) return;
    for (let i = 0; i < 10; i++) {
      const a = rand(0, 6.28), sp = rand(30, 150);
      this.parts.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(0.3, 0.7), t: 0, r: rand(2, 5) * scale,
        col: pick(['#ffce54', '#fc6e51', '#e9573f', '#555']), grav: 0, fade: true,
      });
    }
    this._cap(this.parts, 400);
  }

  splinters(x, y, dx, dy) {
    if (this.reduceMotion) return;
    for (let i = 0; i < 5; i++) {
      const a = Math.atan2(dy, dx) + rand(-0.8, 0.8), sp = rand(40, 130);
      this.parts.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(0.25, 0.5), t: 0, r: rand(1.5, 3),
        col: pick(['#8a5a2b', '#a86b34', '#c98a4b']), grav: 0, fade: true,
      });
    }
    this._cap(this.parts, 400);
  }

  splash(x, y) {
    for (let i = 0; i < 5; i++) {
      const a = rand(-2.4, -0.7), sp = rand(30, 90);
      this.parts.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(0.25, 0.5), t: 0, r: rand(1.5, 3),
        col: '#dff2fb', grav: 260, fade: true,
      });
    }
    this._cap(this.parts, 400);
  }

  wake(x, y, r = 6) {
    if (this.reduceMotion) return;
    this.parts.push({ x, y, vx: 0, vy: 0, life: 0.9, t: 0, r, col: '#ffffff', grav: 0, fade: true, ring: true });
    this._cap(this.parts, 400);
  }

  muzzle(x, y) {
    this.parts.push({ x, y, vx: 0, vy: 0, life: 0.28, t: 0, r: 9, col: '#fff0c0', grav: 0, fade: true });
  }

  debris(x, y) {
    for (let i = 0; i < 8; i++) {
      const a = rand(0, 6.28), sp = rand(20, 80);
      this.parts.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(1.2, 2.2), t: 0, r: rand(2, 4),
        col: pick(['#8a5a2b', '#6d4622']), grav: 0, fade: true, spr: 'wood' + (1 + (i % 4)),
      });
    }
    this._cap(this.parts, 400);
  }

  floatText(x, y, text, col = '#fff') {
    this.texts.push({ x, y, text, col, t: 0, dur: 0.9 });
    this._cap(this.texts, 60);
  }

  update(dt) {
    for (const p of this.parts) {
      p.t += dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.grav) p.vy += p.grav * dt;
      p.vx *= 0.96; p.vy *= 0.96;
      if (p.ring) p.r += 40 * dt;
    }
    this.parts = this.parts.filter((p) => p.t < p.life);
    for (const b of this.booms) b.t += dt;
    this.booms = this.booms.filter((b) => b.t < b.dur);
    for (const t of this.texts) { t.t += dt; t.y -= 26 * dt; }
    this.texts = this.texts.filter((t) => t.t < t.dur);
  }

  draw(ctx) {
    // particles
    for (const p of this.parts) {
      const a = p.fade ? Math.max(0, 1 - p.t / p.life) : 1;
      ctx.globalAlpha = a;
      if (p.spr && img(p.spr)) {
        const im = img(p.spr);
        ctx.drawImage(im, p.x - im.width / 2, p.y - im.height / 2);
      } else if (p.ring) {
        ctx.strokeStyle = p.col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.stroke();
      } else {
        ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    // explosions (3-frame)
    for (const b of this.booms) {
      const frame = b.t < b.dur * 0.33 ? 'explosion1' : b.t < b.dur * 0.66 ? 'explosion2' : 'explosion3';
      const im = img(frame);
      if (im) {
        const s = b.scale;
        ctx.globalAlpha = Math.max(0, 1 - b.t / b.dur);
        ctx.drawImage(im, b.x - im.width * s / 2, b.y - im.height * s / 2, im.width * s, im.height * s);
      }
    }
    ctx.globalAlpha = 1;
    // floating text
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px system-ui, sans-serif';
    for (const t of this.texts) {
      const a = Math.max(0, 1 - t.t / t.dur);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#000'; ctx.fillText(t.text, t.x + 1, t.y + 1);
      ctx.fillStyle = t.col; ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
