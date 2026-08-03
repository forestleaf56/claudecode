// game.js — gameplay orchestration: spawns, zones, boss, combat, economy.

import { World } from '../world/world.js';
import { Camera } from '../core/camera.js';
import { Ship } from '../entities/ship.js';
import { Projectiles } from '../entities/projectile.js';
import { Pickups } from '../entities/pickup.js';
import { Effects } from '../entities/effects.js';
import { headingOf, dist, rand, randInt, clamp, pick } from '../core/math.js';
import {
  SHIP_CLASSES, ENEMIES, BOSS, CANNON_TYPES, UPGRADES, RUN,
} from '../data/config.js';
import * as Audio from '../core/audio.js';
import * as Save from '../save/save.js';

const ARCHETYPES = Object.keys(ENEMIES);

export class Game {
  constructor() {
    this.world = new World();
    this.cam = new Camera();
    this.projectiles = new Projectiles();
    this.pickups = new Pickups();
    this.effects = new Effects();
    this.state = 'idle';           // idle | playing | dead
    this.steer = { x: 0, y: 0, mag: 0 };
  }

  start(shipId, ammoId) {
    const s = Save.get();
    this.world = new World();
    this.projectiles = new Projectiles();
    this.pickups = new Pickups();
    this.effects = new Effects();
    this.effects.reduceMotion = s.settings.reduceMotion;
    this.cam.reduceMotion = s.settings.reduceMotion;

    const def = SHIP_CLASSES[shipId] || SHIP_CLASSES.sloop;
    const p = new Ship(def, 'player');
    // permanent perks
    if (s.perks.startHull) { p.maxHp += 20; }
    if (s.perks.startCannon) { p.dmgMult *= 1.15; }
    p.hp = p.maxHp;
    p.x = 0; p.y = 0; p.angle = 0;
    p.ammo = CANNON_TYPES[ammoId] && s.ammo[ammoId] ? CANNON_TYPES[ammoId] : CANNON_TYPES.round;
    this.player = p;

    // snapshot base stats for upgrade math
    this.base = { hp: p.maxHp, speed: p.maxSpeed, turn: p.turn, dmg: p.dmgMult };
    this.up = { hull: 0, sails: 0, cannon: 0, reload: 0 };

    this.enemies = [];
    this.boss = null;
    this.bossDefeated = false;
    this.gold = 0;
    this.cargo = 0;
    this.score = 0;
    this.kills = 0;
    this.time = 0;
    this.spawnTimer = 1.5;
    this.state = 'playing';
    this.zone = 0;

    this.cam.x = 0; this.cam.y = 0;
  }

  env() {
    return {
      world: this.world, player: this.player, projectiles: this.projectiles,
      effects: this.effects, cam: this.cam, audio: Audio,
    };
  }

  nearestEnemy() {
    let best = null, bd = Infinity;
    const all = this.boss ? this.enemies.concat(this.boss) : this.enemies;
    for (const e of all) {
      if (e.sinking) continue;
      const d = dist(e.x, e.y, this.player.x, this.player.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  fire() {
    if (this.state !== 'playing' || this.player.dead || this.player.sinking) return;
    const target = this.nearestEnemy();
    const s = Save.get();
    const aim = (s.settings.aimAssist && target) ? { x: target.x, y: target.y } : null;
    this.player.fireBroadside(this.env(), aim || target);
  }

  setSteer(vec) { this.steer = vec; }

  // ---- Update ----
  update(dt) {
    if (this.state !== 'playing') return;
    this.time += dt;
    this.world.update(dt);

    // player intent
    if (this.steer.mag > 0.06 && !this.player.sinking) {
      this.player.desiredAngle = headingOf(this.steer.x, this.steer.y);
      this.player.throttle = this.steer.mag;
    } else this.player.throttle = 0;

    const env = this.env();
    this.player.update(dt, env);

    this.zone = Math.floor(dist(0, 0, this.player.x, this.player.y) / RUN.zoneRadius);

    for (const e of this.enemies) e.update(dt, env);
    if (this.boss) this.boss.update(dt, env);

    this.projectiles.update(dt, this.world, this.effects);
    this.resolveHits(env);

    this.pickups.update(dt, this.player, (p) => this.collect(p));
    this.effects.update(dt);

    this.spawn(dt);
    this.separateEnemies();

    // camera
    const lead = 0.25;
    this.cam.follow(this.player.x + this.player.vx * 8, this.player.y + this.player.vy * 8, dt);
    this.cam.update(dt);

    // cleanup dead
    this.enemies = this.enemies.filter((e) => !e.dead);
    if (this.boss && this.boss.dead) { this.boss = null; }

    if (this.player.dead) this.endRun('sunk');
  }

  resolveHits(env) {
    for (const pr of this.projectiles.list) {
      if (pr.dead) continue;
      if (pr.friendly) {
        const targets = this.boss ? this.enemies.concat(this.boss) : this.enemies;
        for (const e of targets) {
          if (e.sinking) continue;
          if (dist(pr.x, pr.y, e.x, e.y) < e.radius + pr.radius) {
            pr.dead = true;
            const died = e.takeDamage(pr.dmg, pr.sailDmg, pr.x, pr.y, env);
            this.effects.floatText(e.x, e.y - e.radius, Math.round(pr.dmg), '#ffd66b');
            if (died) this.onEnemyKilled(e);
            break;
          }
        }
      } else {
        const p = this.player;
        if (!p.sinking && dist(pr.x, pr.y, p.x, p.y) < p.radius + pr.radius) {
          pr.dead = true;
          p.takeDamage(pr.dmg, pr.sailDmg, pr.x, pr.y, env);
          this.cam.shake(7);
        }
      }
    }
  }

  onEnemyKilled(e) {
    this.kills++;
    this.score += e.def.score || 20;
    const g = randInt(e.def.gold[0], e.def.gold[1]);
    this.pickups.spawnGold(e.x, e.y, g);
    if (Math.random() < 0.14) this.pickups.spawnCargo(e.x, e.y);
    if (e === this.boss) {
      this.bossDefeated = true;
      this.effects.floatText(this.player.x, this.player.y - 40, 'LEVIATHAN SLAIN!', '#ffce54');
    }
  }

  collect(p) {
    if (p.kind === 'gold') { this.gold += p.value; this.score += p.value; Audio.coin(); }
    else { this.cargo += 1; this.gold += 40; this.score += 60; Audio.coin(); this.effects.floatText(this.player.x, this.player.y - 30, '+Cargo', '#8cc152'); }
  }

  // Keep enemies from stacking on each other.
  separateEnemies() {
    const list = this.enemies;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        const d = dist(a.x, a.y, b.x, b.y);
        const min = a.radius + b.radius;
        if (d > 0 && d < min) {
          const push = (min - d) * 0.5;
          const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d;
          a.x -= nx * push; a.y -= ny * push;
          b.x += nx * push; b.y += ny * push;
        }
      }
    }
  }

  // ---- Spawning & difficulty ----
  spawn(dt) {
    // boss trigger
    if (!this.boss && !this.bossDefeated && this.kills >= RUN.killsToBoss) {
      this.spawnBoss();
    }
    this.spawnTimer -= dt;
    const target = Math.min(12, RUN.baseEnemies + this.zone * 1.5) + (this.boss ? 2 : 0);
    if (this.enemies.length < target && this.spawnTimer <= 0) {
      this.spawnTimer = clamp(1.4 - this.zone * 0.12, 0.5, 1.4);
      this.spawnEnemy();
    }
  }

  pickArchetype() {
    const opts = ARCHETYPES.filter((k) => ENEMIES[k].tier <= this.zone);
    // weight toward higher tiers as zone grows a bit
    return pick(opts.length ? opts : ['scout']);
  }

  spawnPoint() {
    for (let i = 0; i < 12; i++) {
      const a = rand(0, 6.28), d = rand(640, 980);
      const x = this.player.x + Math.cos(a) * d;
      const y = this.player.y + Math.sin(a) * d;
      const s = this.world.sample(x, y);
      if (s.type === 'water' || s.type === 'shallow') return { x, y };
    }
    return { x: this.player.x + 800, y: this.player.y };
  }

  zoneScale() { return 1 + this.zone * 0.18; }

  spawnEnemy() {
    const key = this.pickArchetype();
    const def = { ...ENEMIES[key] };
    const sc = this.zoneScale();
    const e = new Ship(def, 'enemy');
    e.maxHp = Math.round(def.hp * sc); e.hp = e.maxHp;
    e.baseDamage = def.damage * (1 + this.zone * 0.08);
    const pt = this.spawnPoint();
    e.x = pt.x; e.y = pt.y;
    e.angle = headingOf(this.player.x - e.x, this.player.y - e.y);
    e.aggression = def.aggression || 1;
    this.enemies.push(e);
  }

  spawnBoss() {
    const def = { ...BOSS };
    const b = new Ship(def, 'enemy');
    b.isBoss = true;
    const pt = this.spawnPoint();
    b.x = pt.x; b.y = pt.y;
    b.angle = headingOf(this.player.x - b.x, this.player.y - b.y);
    this.boss = b;
    this.effects.floatText(this.player.x, this.player.y - 50, 'A LEVIATHAN APPROACHES', '#e9573f');
    Audio.explosion();
  }

  // ---- Economy / upgrades ----
  upgradeCost(id) {
    const u = UPGRADES[id];
    const lvl = id === 'repair' ? 0 : this.up[id];
    return Math.round(u.base * Math.pow(u.growth, lvl));
  }

  canUpgrade(id) {
    const u = UPGRADES[id];
    if (id === 'repair') return this.player.hp < this.player.maxHp && this.gold >= this.upgradeCost(id);
    return this.up[id] < u.max && this.gold >= this.upgradeCost(id);
  }

  buyUpgrade(id) {
    if (!this.canUpgrade(id)) return false;
    this.gold -= this.upgradeCost(id);
    if (id === 'repair') { this.player.hp = this.player.maxHp; this.player.sailHp = this.player.maxSailHp; }
    else { this.up[id]++; this.applyUpgrades(); }
    Audio.upgrade();
    return true;
  }

  applyUpgrades() {
    const p = this.player, b = this.base, u = this.up;
    const ratio = clamp(p.hp / p.maxHp, 0, 1);
    p.maxHp = Math.round(b.hp * (1 + 0.22 * u.hull));
    p.hp = Math.round(p.maxHp * ratio);
    p.maxSailHp = p.maxHp * 0.6;
    p.maxSpeed = b.speed * (1 + 0.08 * u.sails);
    p.turn = b.turn * (1 + 0.06 * u.sails);
    p.dmgMult = b.dmg * Math.pow(1.18, u.cannon);
    p.reloadMult = Math.pow(1.12, u.reload);
  }

  setAmmo(id) {
    const s = Save.get();
    if (CANNON_TYPES[id] && s.ammo[id]) { this.player.ammo = CANNON_TYPES[id]; return true; }
    return false;
  }

  // ---- Run end ----
  endRun(reason) {
    if (this.state === 'dead') return;
    this.state = 'dead';
    this.reason = reason;
    const s = Save.get();
    const earned = Math.floor(this.gold * RUN.bankRate) + (this.bossDefeated ? 150 : 0);
    this.doubloonsEarned = earned;
    s.doubloons += earned;
    s.runs += 1;
    if (this.score > s.bestScore) s.bestScore = this.score;
    if (this.gold > s.bestGold) s.bestGold = this.gold;
    Save.save();
  }

  retire() {
    if (this.state === 'playing') this.endRun('retired');
  }

  // ---- Draw ----
  draw(ctx, w, h) {
    // water background (screen space)
    this.world.drawWater(ctx, this.cam, w, h);
    // world space
    this.cam.apply(ctx, w, h);
    this.world.drawLand(ctx, this.cam, w, h);
    this.pickups.draw(ctx);
    for (const e of this.enemies) e.draw(ctx);
    if (this.boss) this.boss.draw(ctx);
    if (this.player && !this.player.dead) this.player.draw(ctx);
    this.projectiles.draw(ctx);
    this.effects.draw(ctx);
    this.cam.applyScreen(ctx); // leave ctx in CSS-pixel screen space for HUD
  }
}
