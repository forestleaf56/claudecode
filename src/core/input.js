// input.js — unified touch / mouse / keyboard input.
// Left half of the screen is a floating steering stick during gameplay;
// right half taps fire the broadside. In menus, every tap is a UI tap.

const state = {
  gameplayMode: false,   // set true while sailing, false in menus
  leftHanded: false,     // swaps stick/fire halves
  keys: new Set(),
  pointers: new Map(),   // id -> {x,y,sx,sy,st,side}
  taps: [],              // queued pointerdown positions (screen px)
  stickId: null,
  stick: { x: 0, y: 0, mag: 0 },
  mouse: { x: 0, y: 0, down: false },
  dpr: 1,
};

const STICK_RADIUS = 70;

let canvas = null;

function pos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

// Which half is the steering stick? (respects handedness)
function isStickSide(x) {
  const half = canvas.clientWidth / 2;
  return state.leftHanded ? x > half : x < half;
}

function onDown(id, x, y) {
  if (state.gameplayMode && isStickSide(x)) {
    state.stickId = id;
    state.pointers.set(id, { x, y, sx: x, sy: y, st: performance.now(), side: 'stick' });
    updateStick(x, y);
  } else {
    state.pointers.set(id, { x, y, sx: x, sy: y, st: performance.now(), side: 'tap' });
    state.taps.push({ x, y });
  }
}

function onMove(id, x, y) {
  const p = state.pointers.get(id);
  if (!p) return;
  p.x = x; p.y = y;
  if (id === state.stickId) updateStick(x, y);
}

function onUp(id) {
  const p = state.pointers.get(id);
  if (!p) return;
  state.pointers.delete(id);
  if (id === state.stickId) { state.stickId = null; state.stick = { x: 0, y: 0, mag: 0 }; }
}

function updateStick(x, y) {
  const p = state.pointers.get(state.stickId);
  if (!p) return;
  let dx = x - p.sx, dy = y - p.sy;
  const d = Math.hypot(dx, dy) || 1;
  const mag = Math.min(1, d / STICK_RADIUS);
  state.stick = { x: (dx / d) * mag, y: (dy / d) * mag, mag };
}

export function attach(cv) {
  canvas = cv;
  // Pointer events cover touch + mouse + pen uniformly.
  cv.addEventListener('pointerdown', (e) => {
    cv.setPointerCapture?.(e.pointerId);
    const p = pos(e); onDown(e.pointerId, p.x, p.y);
    if (e.pointerType === 'mouse') state.mouse.down = true;
    e.preventDefault();
  }, { passive: false });
  cv.addEventListener('pointermove', (e) => {
    const p = pos(e); state.mouse.x = p.x; state.mouse.y = p.y; onMove(e.pointerId, p.x, p.y);
  });
  const up = (e) => { onUp(e.pointerId); if (e.pointerType === 'mouse') state.mouse.down = false; };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    state.keys.add(e.key.toLowerCase());
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => state.keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => state.keys.clear());
}

export function setGameplayMode(on) {
  state.gameplayMode = on;
  if (!on) { state.stickId = null; state.stick = { x: 0, y: 0, mag: 0 }; }
}
export function setLeftHanded(v) { state.leftHanded = v; }

// Steering vector: touch stick OR keyboard. Returns {x,y,mag}.
export function steer() {
  if (state.stick.mag > 0.05) return state.stick;
  let x = 0, y = 0;
  const k = state.keys;
  if (k.has('a') || k.has('arrowleft')) x -= 1;
  if (k.has('d') || k.has('arrowright')) x += 1;
  if (k.has('w') || k.has('arrowup')) y -= 1;
  if (k.has('s') || k.has('arrowdown')) y += 1;
  const d = Math.hypot(x, y);
  if (d === 0) return { x: 0, y: 0, mag: 0 };
  return { x: x / d, y: y / d, mag: 1 };
}

// Keyboard fire edge detection
let spaceWasDown = false;
export function keyFireEdge() {
  const down = state.keys.has(' ');
  const edge = down && !spaceWasDown;
  spaceWasDown = down;
  return edge;
}
export function keyDown(key) { return state.keys.has(key); }

// Consume queued taps (returns and clears). Screen coordinates.
export function consumeTaps() {
  const t = state.taps;
  state.taps = [];
  return t;
}

export function stickInfo() {
  if (state.stickId == null) return null;
  const p = state.pointers.get(state.stickId);
  if (!p) return null;
  return { ox: p.sx, oy: p.sy, x: p.x, y: p.y, radius: STICK_RADIUS };
}

export function mouse() { return state.mouse; }
