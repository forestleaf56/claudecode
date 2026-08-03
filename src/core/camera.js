// camera.js — follows a target, handles world<->screen transform and shake.

import { clamp } from './math.js';

export class Camera {
  constructor() {
    this.x = 0; this.y = 0;      // world point at screen centre
    this.zoom = 1;
    this.dpr = 1;                // device pixel ratio baked into transforms
    this.shakeT = 0; this.shakeMag = 0;
    this.ox = 0; this.oy = 0;    // current shake offset
    this.reduceMotion = false;
  }

  follow(tx, ty, dt, lead = 0) {
    // Smooth follow
    const k = 1 - Math.pow(0.001, dt);
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;
  }

  shake(mag) {
    if (this.reduceMotion) return;
    this.shakeMag = Math.max(this.shakeMag, mag);
    this.shakeT = Math.max(this.shakeT, 0.35);
  }

  update(dt) {
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      const m = this.shakeMag * (this.shakeT > 0 ? this.shakeT / 0.35 : 0);
      this.ox = (Math.random() * 2 - 1) * m;
      this.oy = (Math.random() * 2 - 1) * m;
      if (this.shakeT <= 0) { this.ox = this.oy = 0; this.shakeMag = 0; }
    }
  }

  // Screen space in CSS pixels (DPR baked in). For HUD / water fill.
  applyScreen(ctx) {
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  // World space (CSS px units), DPR baked in. w,h in CSS px.
  apply(ctx, w, h) {
    const z = this.zoom * this.dpr;
    ctx.setTransform(z, 0, 0, z,
      this.dpr * (w / 2 - (this.x + this.ox) * this.zoom),
      this.dpr * (h / 2 - (this.y + this.oy) * this.zoom));
  }

  screenToWorld(sx, sy, w, h) {
    return {
      x: (sx - w / 2) / this.zoom + this.x + this.ox,
      y: (sy - h / 2) / this.zoom + this.y + this.oy,
    };
  }
}
