// ship.js — player and enemy ships: movement, wind, broadsides, AI, sinking.

import { img } from '../core/assets.js';
import { forwardVec, turnToward, headingOf, wrapAngle, clamp, rand, dist } from '../core/math.js';
import { CANNON_TYPES } from '../data/config.js';

export class Ship {
  constructor(def, team) {
    this.def = def; this.team = team;           // 'player' | 'enemy'
    this.x = 0; this.y = 0; this.angle = 0;
    this.speed = 0; this.vx = 0; this.vy = 0;
    this.scale = def.scale;
    this.radius = def.radius;
    this.maxSpeed = def.speed; this.turn = def.turn;
    this.cannons = def.cannons; this.reload = def.reload;
    this.baseDamage = def.damage;
    this.maxHp = def.hp; this.hp = def.hp;
    this.maxSailHp = def.hp * 0.6; this.sailHp = this.maxSailHp;
    this.reloadL = 0; this.reloadR = 0;
    this.desiredAngle = 0; this.throttle = 0;
    this.sinking = false; this.sinkT = 0; this.dead = false;
    this.wakeT = 0;
    this.hurtFlash = 0;
    // multipliers (player upgrades)
    this.dmgMult = 1; this.reloadMult = 1;
    // auto-repair (player only; enemies keep these at 0)
    this.sinceHit = 999; this.regenOut = 0; this.regenIn = 0; this.regenDelay = 3;
    this.sprite = def.sprite;
    // AI
    this.aiTimer = rand(0, 1); this.aiSide = Math.random() < 0.5 ? 1 : -1;
    this.wanderAngle = Math.random() * 6.28;
    this.ammo = CANNON_TYPES.round;
  }

  get hullLen() { const im = img(this.sprite); return (im ? im.height : 100) * this.scale; }
  get damage() { return this.baseDamage * this.dmgMult; }

  // ---- AI ----
  think(dt, env) {
    const p = env.player;
    if (!p || p.dead) { this.wander(dt); return; }
    const dx = p.x - this.x, dy = p.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const def = this.def;
    const range = def.range || 360;

    if (this.hp < this.maxHp * 0.22 && d < range * 1.4) {
      // flee: point away from player
      this.desiredAngle = headingOf(-dx, -dy);
      this.throttle = 1;
      return;
    }
    if (d > range * 2.4) {
      // approach directly
      this.desiredAngle = headingOf(dx, dy);
      this.throttle = 1;
    } else {
      // orbit to present a broadside at ~range
      const tang = { x: -dy / d * this.aiSide, y: dx / d * this.aiSide };
      const radial = { x: dx / d, y: dy / d };
      const err = (d - range) / range; // >0 too far, <0 too close
      const mix = clamp(err, -0.9, 0.9);
      const gx = tang.x + radial.x * mix;
      const gy = tang.y + radial.y * mix;
      this.desiredAngle = headingOf(gx, gy);
      this.throttle = 0.85;
      // occasionally flip orbit direction
      this.aiTimer -= dt;
      if (this.aiTimer <= 0) { this.aiTimer = rand(3, 6); if (Math.random() < 0.35) this.aiSide *= -1; }
      // fire if a side lines up with the player and in range
      if (d < range * 1.15) {
        const fwd = forwardVec(this.angle);
        const nR = { x: -fwd.y, y: fwd.x }, nL = { x: fwd.y, y: -fwd.x };
        const toP = { x: dx / d, y: dy / d };
        if (nR.x * toP.x + nR.y * toP.y > 0.86) this.fireSide(1, env);
        else if (nL.x * toP.x + nL.y * toP.y > 0.86) this.fireSide(-1, env);
      }
    }
  }

  wander(dt) {
    this.wanderAngle += rand(-1, 1) * dt;
    this.desiredAngle = this.wanderAngle;
    this.throttle = 0.4;
  }

  // ---- Firing ----
  // aimAt (optional): a {x,y} point the volley homes toward (aim assist).
  // Without it, cannons fire straight out the broadside (perpendicular).
  fireSide(side, env, aimAt = null) {
    const rem = side < 0 ? this.reloadL : this.reloadR;
    if (rem > 0 || this.sinking) return false;
    const fwd = forwardVec(this.angle);
    const nrm = side > 0 ? { x: -fwd.y, y: fwd.x } : { x: fwd.y, y: -fwd.x };
    const ammo = this.ammo || CANNON_TYPES.round;
    const len = this.hullLen;
    for (let i = 0; i < this.cannons; i++) {
      const frac = this.cannons === 1 ? 0 : (i / (this.cannons - 1) - 0.5);
      const off = frac * len * 0.55;
      const px = this.x + fwd.x * off + nrm.x * this.radius;
      const py = this.y + fwd.y * off + nrm.y * this.radius;
      // base direction: toward the aim point, else straight out the side
      let bdx = nrm.x, bdy = nrm.y;
      if (aimAt) {
        const ex = aimAt.x - px, ey = aimAt.y - py, el = Math.hypot(ex, ey) || 1;
        bdx = ex / el; bdy = ey / el;
      }
      const burst = ammo.count || 1;
      for (let b = 0; b < burst; b++) {
        const spr = rand(-1, 1) * ammo.spread;
        const ca = Math.cos(spr), sa = Math.sin(spr);
        const dx = bdx * ca - bdy * sa;
        const dy = bdx * sa + bdy * ca;
        const sp = ammo.speed * rand(0.92, 1.06);
        env.projectiles.spawn(px, py, dx * sp + this.vx * 12, dy * sp + this.vy * 12, {
          life: ammo.life, dmg: this.damage * ammo.dmg, sailDmg: this.damage * ammo.sailDmg,
          friendly: this.team === 'player',
          splash: ammo.splash || 0, splashDmg: this.damage * (ammo.splashDmg || 0),
        });
      }
      env.effects.muzzle(px, py);
    }
    if (side < 0) this.reloadL = this.reload / this.reloadMult;
    else this.reloadR = this.reload / this.reloadMult;
    env.audio.cannon();
    if (this.team === 'player') env.cam.shake(6);
    return true;
  }

  // Player helper: fire the side that best faces the target; aim the volley
  // at aimAt (when aim assist is on) so shots actually connect.
  fireBroadside(env, target, aimAt = null) {
    let side = 1;
    if (target) {
      const dx = target.x - this.x, dy = target.y - this.y;
      const fwd = forwardVec(this.angle);
      const nR = { x: -fwd.y, y: fwd.x };
      side = (nR.x * dx + nR.y * dy) >= 0 ? 1 : -1;
    }
    // if chosen side reloading but the other is ready, fire the other
    const rem = side < 0 ? this.reloadL : this.reloadR;
    const other = side < 0 ? this.reloadR : this.reloadL;
    if (rem > 0 && other <= 0) side = -side;
    return this.fireSide(side, env, aimAt);
  }

  // ---- Damage ----
  takeDamage(dmg, sailDmg, fromX, fromY, env) {
    if (this.sinking) return false;
    this.sailHp = Math.max(0, this.sailHp - sailDmg);
    this.hp -= dmg;
    this.hurtFlash = 0.12;
    this.sinceHit = 0;
    env.effects.splinters(this.x, this.y, this.x - fromX, this.y - fromY);
    env.audio.hit();
    if (this.hp <= 0) { this.startSink(env); return true; }
    return false;
  }

  startSink(env) {
    this.sinking = true; this.sinkT = 0;
    env.effects.explosion(this.x, this.y, this.scale * 1.6);
    env.effects.debris(this.x, this.y);
    env.audio.explosion();
    if (this.team === 'enemy') env.cam.shake(4);
  }

  // ---- Update ----
  update(dt, env) {
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    if (this.sinking) {
      this.sinkT += dt;
      this.speed *= 0.96;
      this.x += this.vx; this.y += this.vy;
      this.vx *= 0.94; this.vy *= 0.94;
      if (this.sinkT > 1.1) this.dead = true;
      return;
    }
    if (this.team === 'enemy') this.think(dt, env);

    const turnRate = this.turn * (0.55 + 0.45 * this.throttle);
    this.angle = turnToward(this.angle, this.desiredAngle, turnRate * dt);
    const fwd = forwardVec(this.angle);
    const wf = env.world.windFactor(fwd);
    const sailF = 0.45 + 0.55 * (this.sailHp / this.maxSailHp);
    const targetSpeed = this.maxSpeed * this.throttle * wf * sailF;
    this.speed += (targetSpeed - this.speed) * (1 - Math.pow(0.02, dt));

    let nx = this.x + fwd.x * this.speed * dt;
    let ny = this.y + fwd.y * this.speed * dt;
    // land collision (look at bow)
    const bow = env.world.sample(this.x + fwd.x * this.radius * 1.3, this.y + fwd.y * this.radius * 1.3);
    if (bow.type === 'grass' || bow.type === 'sand') {
      this.speed *= 0.25;
      if (bow.isl) {
        const dx = this.x - bow.isl.x, dy = this.y - bow.isl.y, dl = Math.hypot(dx, dy) || 1;
        nx = this.x + dx / dl * 70 * dt; ny = this.y + dy / dl * 70 * dt;
      } else { nx = this.x; ny = this.y; }
    }
    this.vx = nx - this.x; this.vy = ny - this.y;
    this.x = nx; this.y = ny;

    // wake
    this.wakeT -= dt;
    if (this.speed > 40 && this.wakeT <= 0) {
      this.wakeT = 0.12;
      const back = -this.hullLen * 0.42;
      env.effects.wake(this.x + fwd.x * back, this.y + fwd.y * back, this.radius * 0.5);
    }

    this.reloadL -= dt; this.reloadR -= dt;
    // slow sail self-repair
    this.sailHp = Math.min(this.maxSailHp, this.sailHp + this.maxSailHp * 0.03 * dt);

    // hull auto-repair (player): trickle in combat, faster once unhit for a while
    this.sinceHit += dt;
    if (this.regenOut > 0 && this.hp < this.maxHp) {
      const rate = this.sinceHit >= this.regenDelay ? this.regenOut : this.regenIn;
      const before = this.hp;
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * rate * dt);
      // occasional green sparkle while actively repairing
      if (this.sinceHit >= this.regenDelay && this.hp > before && Math.random() < 0.25) {
        env.effects.heal(this.x, this.y, this.radius);
      }
    }
  }

  // ---- Draw ----
  draw(ctx) {
    const im = img(this.sprite);
    ctx.save();
    ctx.translate(this.x, this.y);
    // shadow
    ctx.globalAlpha = this.sinking ? Math.max(0, 0.3 - this.sinkT * 0.3) : 0.22;
    ctx.fillStyle = '#08304a';
    ctx.beginPath();
    ctx.ellipse(3, 5, this.radius * 1.05, this.radius * 0.8, 0, 0, 6.28);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Sprite art points bow-DOWN, but logical forward is up, so add PI.
    ctx.rotate(this.angle + Math.PI);
    if (this.sinking) {
      ctx.globalAlpha = Math.max(0, 1 - this.sinkT / 1.1);
      const s = this.scale * (1 - this.sinkT * 0.25);
      ctx.rotate(this.sinkT * 0.8);
      if (im) ctx.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s);
      ctx.restore();
      return;
    }
    if (im) {
      const w = im.width * this.scale, h = im.height * this.scale;
      ctx.drawImage(im, -w / 2, -h / 2, w, h);
      if (this.hurtFlash > 0) {
        ctx.globalAlpha = this.hurtFlash / 0.12 * 0.6;
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(im, -w / 2, -h / 2, w, h);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
    } else {
      ctx.fillStyle = this.team === 'player' ? '#5b8fd6' : '#c0554a';
      ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, 6.28); ctx.fill();
    }
    ctx.restore();

    // enemy health bar when hurt
    if (this.team === 'enemy' && this.hp < this.maxHp) {
      const w = Math.max(26, this.radius * 1.8);
      const x = this.x - w / 2, y = this.y - this.hullLen * 0.5 - 10;
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x - 1, y - 1, w + 2, 6);
      ctx.fillStyle = '#e9573f'; ctx.fillRect(x, y, w, 4);
      ctx.fillStyle = '#8cc152'; ctx.fillRect(x, y, w * clamp(this.hp / this.maxHp, 0, 1), 4);
    }
  }
}
