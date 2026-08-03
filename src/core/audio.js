// audio.js — procedurally synthesized SFX + ambient bed via Web Audio API.
// No binary audio assets; everything is generated at runtime.

let ctx = null;
let master = null, sfxBus = null, musicBus = null;
let started = false;
let muted = false;
let ambientNodes = null;

export function isMuted() { return muted; }

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.9;
}

// Must be called from a user gesture (mobile autoplay policy).
export function ensureStarted() {
  if (started) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination);
  sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
  musicBus = ctx.createGain(); musicBus.gain.value = 0.25; musicBus.connect(master);
  started = true;
  startAmbient();
}

function noiseBuffer(seconds) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function env(node, t0, a, peak, d) {
  const g = node.gain;
  g.cancelScheduledValues(t0);
  g.setValueAtTime(0.0001, t0);
  g.exponentialRampToValueAtTime(peak, t0 + a);
  g.exponentialRampToValueAtTime(0.0001, t0 + a + d);
}

// ---- SFX ----
export function cannon() {
  if (!started) return;
  const t = ctx.currentTime;
  // low thump
  const osc = ctx.createOscillator(); osc.type = 'sine';
  osc.frequency.setValueAtTime(160, t); osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);
  const og = ctx.createGain(); env(og, t, 0.005, 0.8, 0.28);
  osc.connect(og).connect(sfxBus); osc.start(t); osc.stop(t + 0.35);
  // noise burst
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(0.3);
  const bp = ctx.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.setValueAtTime(2200, t); bp.frequency.exponentialRampToValueAtTime(300, t + 0.2);
  const ng = ctx.createGain(); env(ng, t, 0.002, 0.5, 0.22);
  src.connect(bp).connect(ng).connect(sfxBus); src.start(t); src.stop(t + 0.3);
}

export function hit() {
  if (!started) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(0.18);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.7;
  const g = ctx.createGain(); env(g, t, 0.002, 0.5, 0.14);
  src.connect(bp).connect(g).connect(sfxBus); src.start(t); src.stop(t + 0.18);
}

export function splash() {
  if (!started) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(0.25);
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.setValueAtTime(300, t); hp.frequency.exponentialRampToValueAtTime(1400, t + 0.2);
  const g = ctx.createGain(); env(g, t, 0.003, 0.28, 0.2);
  src.connect(hp).connect(g).connect(sfxBus); src.start(t); src.stop(t + 0.25);
}

export function explosion() {
  if (!started) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(0.7);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(1800, t); lp.frequency.exponentialRampToValueAtTime(120, t + 0.5);
  const g = ctx.createGain(); env(g, t, 0.004, 0.9, 0.6);
  src.connect(lp).connect(g).connect(sfxBus); src.start(t); src.stop(t + 0.7);
  const osc = ctx.createOscillator(); osc.type = 'sine';
  osc.frequency.setValueAtTime(90, t); osc.frequency.exponentialRampToValueAtTime(30, t + 0.5);
  const og = ctx.createGain(); env(og, t, 0.005, 0.7, 0.55);
  osc.connect(og).connect(sfxBus); osc.start(t); osc.stop(t + 0.6);
}

export function coin() {
  if (!started) return;
  const t = ctx.currentTime;
  [0, 0.08].forEach((dt, i) => {
    const o = ctx.createOscillator(); o.type = 'square';
    o.frequency.value = i === 0 ? 880 : 1320;
    const g = ctx.createGain(); env(g, t + dt, 0.002, 0.18, 0.09);
    o.connect(g).connect(sfxBus); o.start(t + dt); o.stop(t + dt + 0.12);
  });
}

export function ui() {
  if (!started) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 520;
  const g = ctx.createGain(); env(g, t, 0.002, 0.2, 0.08);
  o.connect(g).connect(sfxBus); o.start(t); o.stop(t + 0.1);
}

export function upgrade() {
  if (!started) return;
  const t = ctx.currentTime;
  [523, 659, 784, 1046].forEach((f, i) => {
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    const g = ctx.createGain(); env(g, t + i * 0.06, 0.002, 0.16, 0.12);
    o.connect(g).connect(sfxBus); o.start(t + i * 0.06); o.stop(t + i * 0.06 + 0.16);
  });
}

// ---- Ambient sea bed ----
function startAmbient() {
  const t = ctx.currentTime;
  // filtered noise = wind/sea
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(3); src.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08;
  const lfoGain = ctx.createGain(); lfoGain.gain.value = 220;
  lfo.connect(lfoGain).connect(lp.frequency);
  const g = ctx.createGain(); g.gain.value = 0.5;
  src.connect(lp).connect(g).connect(musicBus);
  src.start(t); lfo.start(t);
  // slow chordal pad
  const pad = ctx.createGain(); pad.gain.value = 0.12; pad.connect(musicBus);
  [130.8, 196, 246.9].forEach((f) => {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const og = ctx.createGain(); og.gain.value = 0.33;
    const trem = ctx.createOscillator(); trem.frequency.value = 0.05 + Math.random() * 0.05;
    const tg = ctx.createGain(); tg.gain.value = 0.5; trem.connect(tg).connect(og.gain);
    o.connect(og).connect(pad); o.start(t); trem.start(t);
  });
  ambientNodes = { src, lfo };
}
