// math.js — vectors, angles, RNG, collision helpers

export const TAU = Math.PI * 2;

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];

export function len(x, y) { return Math.hypot(x, y); }
export function dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }
export function dist2(ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; }

// Wrap angle to (-PI, PI]
export function wrapAngle(a) {
  a %= TAU;
  if (a > Math.PI) a -= TAU;
  if (a <= -Math.PI) a += TAU;
  return a;
}

// Shortest signed difference from a -> b
export function angleDiff(a, b) { return wrapAngle(b - a); }

// Rotate `a` toward `target` by at most `maxStep` radians
export function turnToward(a, target, maxStep) {
  const d = angleDiff(a, target);
  if (Math.abs(d) <= maxStep) return target;
  return wrapAngle(a + Math.sign(d) * maxStep);
}

// Convert a heading where 0 = pointing UP (north) to a forward unit vector.
// Sprites in the pack face up, and canvas rotate(a) maps up -> (sin a, -cos a).
export function forwardVec(angle) { return { x: Math.sin(angle), y: -Math.cos(angle) }; }

// Heading (0 = up) for a given direction vector
export function headingOf(x, y) { return Math.atan2(x, -y); }

// Seeded PRNG (mulberry32) for reproducible runs
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Circle vs circle
export function circleHit(ax, ay, ar, bx, by, br) {
  const r = ar + br;
  return dist2(ax, ay, bx, by) <= r * r;
}
