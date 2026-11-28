/* Cirrus Linux — BeatForge music studio (pattern sequencer, piano roll, song mode, mixer, sample packs) */
(function () {
  'use strict';
  const esc = OS.esc, gl = OS.glyph;
  const SR = 44100;
  /* ======================= sample packs (synthesized) ======================= */
  const noiseBuf = (ctx, dur) => { const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; };
  const env = (ctx, node, t, a, peak, dcy, end = 0.0001) => { const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(end, t + a + dcy); node.connect(g); return g; };
  const tone = (ctx, out, type, f0, f1, dur, vol = 0.8, t = 0, a = 0.002) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6); env(ctx, o, t, a, vol, dur).connect(out); o.start(t); o.stop(t + dur + a + 0.05); return o; };
  const noise = (ctx, out, dur, vol, ftype, freq, q = 1, t = 0, a = 0.001) => { const s = ctx.createBufferSource(); s.buffer = noiseBuf(ctx, dur + 0.1); const f = ctx.createBiquadFilter(); f.type = ftype; f.frequency.value = freq; f.Q.value = q; s.connect(f); env(ctx, f, t, a, vol, dur).connect(out); s.start(t); return f; };
  const lp = (ctx, out, freq, q = 0.7) => { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq; f.Q.value = q; f.connect(out); return f; };
  const partials = (ctx, out, f, ratios, dur, vol) => ratios.forEach(([r, a, d]) => tone(ctx, out, 'sine', f * r, f * r, dur * d, vol * a));
  const chord = (ctx, out, type, notes, dur, vol, detune = 0) => notes.forEach((m) => { [-detune, detune].forEach((dt) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = 440 * 2 ** ((m - 69) / 12); o.detune.value = dt; env(ctx, o, 0, 0.005, vol / notes.length, dur).connect(out); o.start(0); o.stop(dur + 0.1); }); });
  const PACKS = {
    'Classic Kit': {
      Kick: [0.6, (c, o) => { tone(c, o, 'sine', 160, 45, 0.45, 1); tone(c, o, 'triangle', 900, 200, 0.02, 0.4); }],
      Snare: [0.35, (c, o) => { noise(c, o, 0.22, 0.6, 'highpass', 1500); tone(c, o, 'triangle', 220, 160, 0.1, 0.5); }],
      'Closed Hat': [0.12, (c, o) => noise(c, o, 0.05, 0.45, 'highpass', 7500)],
      'Open Hat': [0.5, (c, o) => noise(c, o, 0.38, 0.4, 'highpass', 7000)],
      Clap: [0.4, (c, o) => { [0, 0.012, 0.024].forEach((t) => noise(c, o, 0.03, 0.6, 'bandpass', 1200, 1.2, t)); noise(c, o, 0.25, 0.5, 'bandpass', 1100, 1, 0.036); }],
      'Low Tom': [0.5, (c, o) => tone(c, o, 'sine', 130, 80, 0.4, 0.9)],
      'High Tom': [0.4, (c, o) => tone(c, o, 'sine', 240, 160, 0.3, 0.8)],
      Rim: [0.1, (c, o) => { tone(c, o, 'square', 1700, 1700, 0.02, 0.3); noise(c, o, 0.02, 0.3, 'bandpass', 3000, 2); }],
      Crash: [1.8, (c, o) => noise(c, o, 1.6, 0.35, 'highpass', 4500)],
      Cowbell: [0.4, (c, o) => { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = 900; b.connect(o); tone(c, b, 'square', 540, 540, 0.3, 0.5); tone(c, b, 'square', 800, 800, 0.3, 0.5); }],
    },
    '808 Pack': {
      '808 Kick': [1.4, (c, o) => { tone(c, o, 'sine', 70, 42, 1.2, 1); tone(c, o, 'sine', 300, 60, 0.03, 0.5); }],
      '808 Snare': [0.35, (c, o) => { noise(c, o, 0.2, 0.5, 'highpass', 1800); tone(c, o, 'sine', 330, 330, 0.1, 0.4); tone(c, o, 'sine', 180, 180, 0.12, 0.4); }],
      '808 Hat': [0.12, (c, o) => { const h = c.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = 7000; h.connect(o); [205, 304, 369, 522, 540, 800].forEach((f) => tone(c, h, 'square', f * 2.5, f * 2.5, 0.06, 0.12)); }],
      '808 Clap': [0.4, (c, o) => { [0, 0.01, 0.02, 0.03].forEach((t) => noise(c, o, 0.02, 0.5, 'bandpass', 1000, 1, t)); noise(c, o, 0.3, 0.45, 'bandpass', 1000, 1, 0.04); }],
      '808 Cowbell': [0.5, (c, o) => { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = 800; b.connect(o); tone(c, b, 'square', 587, 587, 0.4, 0.5); tone(c, b, 'square', 845, 845, 0.4, 0.5); }],
      Conga: [0.3, (c, o) => tone(c, o, 'sine', 310, 220, 0.25, 0.8)],
      'Sub Bass': [1.0, (c, o) => tone(c, o, 'sine', 55, 55, 0.9, 0.9, 0, 0.01)],
    },
    'Lo-Fi Pack': {
      'Dusty Kick': [0.6, (c, o) => { const f = lp(c, o, 700); tone(c, f, 'sine', 140, 48, 0.45, 1); noise(c, f, 0.08, 0.2, 'lowpass', 2000); }],
      'Vinyl Snare': [0.4, (c, o) => { const f = lp(c, o, 3200); noise(c, f, 0.25, 0.6, 'bandpass', 1800, 0.8); tone(c, f, 'triangle', 190, 150, 0.12, 0.4); }],
      Shaker: [0.18, (c, o) => noise(c, o, 0.1, 0.35, 'bandpass', 6500, 2, 0, 0.03)],
      Rimshot: [0.12, (c, o) => { tone(c, o, 'triangle', 820, 820, 0.04, 0.5); noise(c, o, 0.03, 0.25, 'highpass', 2500); }],
      'Lo-Fi Keys': [1.6, (c, o) => chord(c, lp(c, o, 1800), 'triangle', [60, 64, 67, 71], 1.4, 0.7, 6)],
      Bell: [1.6, (c, o) => partials(c, o, 880, [[1, 0.6, 1], [2.76, 0.3, 0.6], [5.4, 0.15, 0.3]], 1.5, 1)],
      'Vinyl Crackle': [2.0, (c, o) => { for (let i = 0; i < 60; i++) noise(c, o, 0.004, 0.15 + Math.random() * 0.3, 'highpass', 2000, 1, Math.random() * 1.9); noise(c, o, 1.9, 0.03, 'lowpass', 900); }],
    },
    'Synth Pack': {
      Stab: [0.6, (c, o) => chord(c, lp(c, o, 2200), 'sawtooth', [60, 63, 67], 0.45, 0.8, 8)],
      Pluck: [0.5, (c, o) => { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(5000, 0); f.frequency.exponentialRampToValueAtTime(300, 0.3); f.connect(o); tone(c, f, 'sawtooth', 261.6, 261.6, 0.4, 0.7); }],
      Pad: [2.4, (c, o) => { const f = lp(c, o, 1400); [57, 60, 64].forEach((m) => [-10, 0, 10].forEach((d) => { const x = c.createOscillator(); x.type = 'sawtooth'; x.frequency.value = 440 * 2 ** ((m - 69) / 12); x.detune.value = d; const g = c.createGain(); g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(0.07, 0.6); g.gain.linearRampToValueAtTime(0, 2.3); x.connect(g).connect(f); x.start(0); x.stop(2.4); })); }],
      'Chip Blip': [0.25, (c, o) => [0, 0.05, 0.1].forEach((t, i) => tone(c, o, 'square', [523, 659, 784][i], [523, 659, 784][i], 0.05, 0.3, t))],
      Laser: [0.35, (c, o) => tone(c, o, 'square', 1600, 90, 0.3, 0.35)],
      Riser: [2.0, (c, o) => { const s = c.createBufferSource(); s.buffer = noiseBuf(c, 2); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3; f.frequency.setValueAtTime(300, 0); f.frequency.exponentialRampToValueAtTime(7000, 1.9); const g = c.createGain(); g.gain.setValueAtTime(0.01, 0); g.gain.exponentialRampToValueAtTime(0.6, 1.8); g.gain.linearRampToValueAtTime(0, 2); s.connect(f).connect(g).connect(o); s.start(0); }],
      'Bass Pluck': [0.6, (c, o) => { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 6; f.frequency.setValueAtTime(2500, 0); f.frequency.exponentialRampToValueAtTime(150, 0.35); f.connect(o); tone(c, f, 'sawtooth', 65.4, 65.4, 0.5, 0.8); }],
    },
    'World Pack': {
      Tabla: [0.4, (c, o) => { tone(c, o, 'sine', 380, 520, 0.3, 0.8); noise(c, o, 0.02, 0.3, 'bandpass', 3000, 2); }],
      'Conga High': [0.3, (c, o) => tone(c, o, 'sine', 420, 340, 0.22, 0.8)],
      'Conga Low': [0.35, (c, o) => tone(c, o, 'sine', 260, 200, 0.28, 0.8)],
      Clave: [0.1, (c, o) => tone(c, o, 'sine', 2500, 2500, 0.05, 0.6)],
      Woodblock: [0.12, (c, o) => { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = 1100; b.Q.value = 4; b.connect(o); tone(c, b, 'sine', 1050, 1000, 0.08, 1); }],
      'Steel Drum': [1.0, (c, o) => partials(c, o, 523, [[1, 0.6, 1], [2, 0.3, 0.7], [3.9, 0.15, 0.4]], 0.9, 1)],
      Marimba: [0.7, (c, o) => partials(c, o, 523, [[1, 0.7, 1], [4, 0.2, 0.3], [10, 0.05, 0.1]], 0.6, 1)],
      Kalimba: [1.1, (c, o) => partials(c, o, 659, [[1, 0.7, 1], [5.4, 0.25, 0.25]], 1.0, 1)],
    },
  };
  let bank = null, bankP = null;
  const loadBank = (onProgress) => bankP || (bankP = (async () => {
    bank = {}; const items = []; Object.entries(PACKS).forEach(([p, s]) => Object.entries(s).forEach(([n, [d, fn]]) => items.push([`${p}/${n}`, d, fn])));
    let i = 0; for (const [k, d, fn] of items) { const c = new OfflineAudioContext(1, Math.ceil(SR * d), SR); const o = c.createGain(); o.connect(c.destination); fn(c, o); bank[k] = await c.startRendering(); onProgress && onProgress(++i / items.length); }
    return bank;
  })());
  OS.beatforge = { PACKS, loadBank };
  /* ======================= synth presets ======================= */
  const PRESETS = {
    'Saw Lead': { osc: [['sawtooth', -8], ['sawtooth', 8]], cut: 3200, q: 2, a: 0.01, d: 0.2, s: 0.6, r: 0.2, vol: 0.35 },
    'Square Lead': { osc: [['square', 0]], cut: 2400, q: 1, a: 0.005, d: 0.1, s: 0.7, r: 0.15, vol: 0.28 },
    'Soft Bass': { osc: [['triangle', 0], ['sine', -1200]], cut: 700, q: 1, a: 0.005, d: 0.2, s: 0.8, r: 0.1, vol: 0.6 },
    'Acid Bass': { osc: [['sawtooth', 0]], cut: 400, q: 14, fenv: 2600, a: 0.003, d: 0.18, s: 0.5, r: 0.08, vol: 0.4 },
    'Supersaw Pad': { osc: [['sawtooth', -15], ['sawtooth', -6], ['sawtooth', 0], ['sawtooth', 6], ['sawtooth', 15]], cut: 1800, q: 1, a: 0.3, d: 0.4, s: 0.8, r: 0.8, vol: 0.14 },
    Pluck: { osc: [['sawtooth', 0], ['square', 5]], cut: 300, q: 4, fenv: 4500, a: 0.002, d: 0.25, s: 0, r: 0.2, vol: 0.3 },
    Bell: { osc: [['sine', 0], ['sine', 2170]], cut: 8000, q: 0.5, a: 0.002, d: 1.2, s: 0, r: 0.6, vol: 0.35 },
    Organ: { osc: [['sine', 0], ['sine', 1200], ['sine', 1902]], cut: 5000, q: 0.5, a: 0.01, d: 0.05, s: 0.9, r: 0.08, vol: 0.22 },
  };
  function playSynth(ctx, out, name, midi, t, dur, vel = 1) {
    const P = PRESETS[name] || PRESETS['Saw Lead']; const f = 440 * 2 ** ((midi - 69) / 12);
    const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.Q.value = P.q;
    if (P.fenv) { flt.frequency.setValueAtTime(P.cut, t); flt.frequency.linearRampToValueAtTime(P.cut + P.fenv * vel, t + 0.01); flt.frequency.exponentialRampToValueAtTime(P.cut, t + 0.01 + P.d * 1.5); } else flt.frequency.value = P.cut;
    const g = ctx.createGain(); const pk = P.vol * vel; const end = t + Math.max(dur, P.a + 0.01);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(pk, t + P.a); g.gain.setTargetAtTime(pk * P.s + 0.0001, t + P.a, P.d / 3); g.gain.setValueAtTime(pk * P.s + 0.0001, end); g.gain.setTargetAtTime(0.0001, end, P.r / 3);
    flt.connect(g).connect(out);
    P.osc.forEach(([type, det]) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det; o.connect(flt); o.start(t); o.stop(end + P.r * 2 + 0.05); });
  }
  const NOTE = (m) => ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][m % 12] + (Math.floor(m / 12) - 1);
  const COLORS = ['#ff6b6b', '#ff9f43', '#f7c948', '#3fdc77', '#1fc8b0', '#2bb3ff', '#6c8cff', '#b06cff', '#ff5ca8', '#8a93a6'];
  const uid = () => Math.random().toString(36).slice(2, 8);
  /* ======================= demo project ======================= */
  function demo() {
    const ch = (name, extra) => Object.assign({ id: uid(), name, vol: 0.8, pan: 0, mute: false, solo: false, pitch: 0, rev: 0.1, cut: 1 }, extra);
    const K = ch('Kick', { kind: 'sample', sample: 'Classic Kit/Kick', vol: 0.95 }), S = ch('Snare', { kind: 'sample', sample: 'Lo-Fi Pack/Vinyl Snare', rev: 0.25 }), H = ch('Hat', { kind: 'sample', sample: 'Classic Kit/Closed Hat', vol: 0.5, pan: 0.2 }), O = ch('Open Hat', { kind: 'sample', sample: 'Classic Kit/Open Hat', vol: 0.4, pan: -0.2 }), C = ch('Clap', { kind: 'sample', sample: 'Classic Kit/Clap', vol: 0.6, rev: 0.3 }), SH = ch('Shaker', { kind: 'sample', sample: 'Lo-Fi Pack/Shaker', vol: 0.45, pan: 0.35 });
    const B = ch('Bass', { kind: 'synth', preset: 'Soft Bass', vol: 0.85, rev: 0 }), P = ch('Keys', { kind: 'synth', preset: 'Supersaw Pad', vol: 0.55, rev: 0.4 }), L = ch('Lead', { kind: 'synth', preset: 'Pluck', vol: 0.6, rev: 0.35, pan: 0.1 });
    const st = (s) => s.split('').map((x) => (x === 'x' ? 1 : x === 'o' ? 0.6 : 0));
    const bassN = [[0, 33, 3], [4, 33, 2], [6, 45, 1], [8, 29, 3], [12, 31, 2], [14, 43, 1]].map(([s, n, l]) => ({ s, n, l }));
    const padN = [[0, 57, 8], [0, 60, 8], [0, 64, 8], [8, 53, 8], [8, 57, 8], [8, 60, 8]].map(([s, n, l]) => ({ s, n, l }));
    const leadN = [[0, 76, 2], [2, 74, 1], [3, 72, 1], [4, 69, 2], [7, 72, 1], [8, 74, 3], [11, 72, 1], [12, 69, 2], [14, 67, 2]].map(([s, n, l]) => ({ s, n, l }));
    const p1 = { name: 'Beat', len: 16, steps: { [K.id]: st('x-----x-x-----x-'), [S.id]: st('----x-------x---'), [H.id]: st('x-x-xoxox-x-xoxo'), [O.id]: st('-------x-------x'), [C.id]: st('------------x---'), [SH.id]: st('-o-o-o-o-o-o-o-o') }, notes: { [B.id]: bassN } };
    const p2 = JSON.parse(JSON.stringify(p1)); p2.name = 'Melody'; p2.notes[P.id] = padN; p2.notes[L.id] = leadN;
    const p3 = { name: 'Break', len: 16, steps: { [H.id]: st('x-x-x-x-x-x-x-x-'), [SH.id]: st('o-o-o-o-o-o-o-o-') }, notes: { [P.id]: padN } };
    return { v: 1, name: 'Sunset Groove', bpm: 96, swing: 0.15, master: 0.85, cur: 0, mode: 'pattern', channels: [K, S, H, O, C, SH, B, P, L], patterns: [p1, p2, p3], song: { lanes: 3, bars: 16, cells: [[2, 2, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 2, -1, -1, -1], Array(16).fill(-1), Array(16).fill(-1)] } };
  }
  const blank = () => ({ v: 1, name: 'Untitled Beat', bpm: 120, swing: 0, master: 0.85, cur: 0, mode: 'pattern', channels: [{ id: uid(), name: 'Kick', kind: 'sample', sample: 'Classic Kit/Kick', vol: 0.9, pan: 0, mute: false, solo: false, pitch: 0, rev: 0, cut: 1 }, { id: uid(), name: 'Snare', kind: 'sample', sample: 'Classic Kit/Snare', vol: 0.8, pan: 0, mute: false, solo: false, pitch: 0, rev: 0.1, cut: 1 }, { id: uid(), name: 'Hat', kind: 'sample', sample: 'Classic Kit/Closed Hat', vol: 0.5, pan: 0, mute: false, solo: false, pitch: 0, rev: 0, cut: 1 }, { id: uid(), name: 'Synth', kind: 'synth', preset: 'Saw Lead', vol: 0.6, pan: 0, mute: false, solo: false, pitch: 0, rev: 0.2, cut: 1 }], patterns: [{ name: 'Pattern 1', len: 16, steps: {}, notes: {} }], song: { lanes: 3, bars: 16, cells: [Array(16).fill(-1), Array(16).fill(-1), Array(16).fill(-1)] } });

  /* ======================= audio graph ======================= */
  function impulse(ctx, dur = 2.2) { const len = ctx.sampleRate * dur, b = ctx.createBuffer(2, len, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3; } return b; }
  function buildGraph(ctx, proj) {
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 4; comp.connect(ctx.destination);
    const master = ctx.createGain(); master.gain.value = proj.master; const an = ctx.createAnalyser ? ctx.createAnalyser() : null; master.connect(comp); if (an) { an.fftSize = 256; master.connect(an); }
    const rev = ctx.createConvolver(); rev.buffer = impulse(ctx); const revG = ctx.createGain(); revG.gain.value = 0.9; rev.connect(revG).connect(master);
    const buses = {};
    const anySolo = proj.channels.some((c) => c.solo);
    proj.channels.forEach((c) => {
      const inp = ctx.createGain(); const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 80 * Math.pow(250, c.cut ?? 1); const pan = ctx.createStereoPanner(); pan.pan.value = c.pan || 0; const vol = ctx.createGain(); vol.gain.value = c.mute || (anySolo && !c.solo) ? 0 : c.vol;
      const send = ctx.createGain(); send.gain.value = c.rev || 0; inp.connect(flt).connect(pan).connect(vol); vol.connect(master); vol.connect(send).connect(rev);
      buses[c.id] = { inp, flt, pan, vol, send };
    });
    return { master, buses, an, update(p) { const so = p.channels.some((c) => c.solo); master.gain.value = p.master; p.channels.forEach((c) => { const b = buses[c.id]; if (!b) return; b.vol.gain.value = c.mute || (so && !c.solo) ? 0 : c.vol; b.pan.pan.value = c.pan || 0; b.send.gain.value = c.rev || 0; b.flt.frequency.value = 80 * Math.pow(250, c.cut ?? 1); }); } };
  }
  function trigger(ctx, graph, ch, t, vel) { const b = bank && bank[ch.sample]; const bus = graph.buses[ch.id]; if (!b || !bus) return; const s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = 2 ** ((ch.pitch || 0) / 12); const g = ctx.createGain(); g.gain.value = vel; s.connect(g).connect(bus.inp); s.start(t); }
  function playStepAt(ctx, graph, proj, patIdxs, k, t, stepDur) {
    patIdxs.forEach(({ p, off }) => {
      const pat = proj.patterns[p]; if (!pat) return; const i = (off + k) % pat.len;
      proj.channels.forEach((ch) => {
        if (ch.kind === 'sample') { const v = pat.steps[ch.id]?.[i]; if (v) trigger(ctx, graph, ch, t, v); }
        else (pat.notes[ch.id] || []).forEach((n) => { if (n.s === i && graph.buses[ch.id]) playSynth(ctx, graph.buses[ch.id].inp, ch.preset, n.n + (ch.pitch || 0), t, n.l * stepDur * 0.98, n.v || 1); });
      });
    });
  }
  const songLen = (proj) => { let last = -1; proj.song.cells.forEach((lane) => lane.forEach((v, b) => { if (v >= 0) last = Math.max(last, b); })); return last + 1; };
  const patsForBar = (proj, bar) => proj.song.cells.map((lane) => lane[bar]).filter((v) => v >= 0).map((p) => ({ p, off: (bar - firstBarOf(proj, bar, p)) * 16 }));
  function firstBarOf(proj, bar, p) { let b = bar; while (b > 0 && proj.song.cells.some((l) => l[b - 1] === p)) b--; return b; }
  function encodeWav(buf) {
    const ch = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate; const data = new DataView(new ArrayBuffer(44 + len * ch * 2)); const w = (o, s) => [...s].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); data.setUint32(4, 36 + len * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, ch, true); data.setUint32(24, sr, true); data.setUint32(28, sr * ch * 2, true); data.setUint16(32, ch * 2, true); data.setUint16(34, 16, true); w(36, 'data'); data.setUint32(40, len * ch * 2, true);
    const chans = Array.from({ length: ch }, (_, i) => buf.getChannelData(i)); let o = 44; for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, chans[c][i])); data.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2; }
    return new Blob([data], { type: 'audio/wav' });
  }

  /* ======================= app ======================= */
  OS.registerApp({
    id: 'beatforge', name: 'BeatForge', icon: 'music', color: ['#ff6b3d', '#c2185b'], cat: 'Multimedia', w: 1100, h: 700, desc: 'Music studio', keywords: 'daw music beats drum machine sequencer piano roll fl studio fruity loops producer synth 808',
    launch(win, args) {
      const A = OS.audio(); let proj = demo(), path = null, dirty = false, view = 'rack', playing = false, graph = null, timer = null, nextT = 0, step = 0, bar = 0, uiQ = [], playStep = -1, playBar = -1, pianoCh = null, selCh = null, raf = 0, browserOpen = !OS.isMobile();
      win.body.innerHTML = `<div class="bf">
        <div class="bf-transport">
          <button class="ibtn" data-a="menu" title="Menu">${gl('menu')}</button>
          <button class="bf-play" data-a="play" title="Play (Space)">${gl('play')}</button><button class="ibtn" data-a="stop" title="Stop">${gl('square')}</button>
          <label class="bf-field"><small>BPM</small><input type="number" min="40" max="240" data-f="bpm"></label>
          <button class="btn sm hide-m" data-a="tap">Tap</button>
          <label class="bf-field hide-m"><small>Swing</small><input type="range" min="0" max="0.6" step="0.05" data-f="swing" style="width:70px"></label>
          <div class="seg bf-mode"><button data-m="pattern">Pattern</button><button data-m="song">Song</button></div>
          <select class="inp bf-pat" data-f="pat"></select><button class="ibtn" data-a="addpat" title="New pattern">${gl('plus')}</button><button class="ibtn hide-m" data-a="clonepat" title="Duplicate pattern">${gl('copy')}</button>
          <span class="spacer"></span><canvas class="bf-viz hide-m" width="160" height="34"></canvas>
          <label class="bf-field hide-m"><small>Master</small><input type="range" min="0" max="1" step="0.01" data-f="master" style="width:70px"></label>
        </div>
        <div class="bf-tabs"><button class="ibtn" data-a="browser" title="Sample browser">${gl('folder')}</button><div class="tabs" style="border:0;padding:0">${[['rack', 'Channel rack'], ['piano', 'Piano roll'], ['song', 'Song'], ['mixer', 'Mixer']].map(([v, l]) => `<button class="tab" data-v="${v}">${l}</button>`).join('')}</div><span class="spacer"></span><span class="small muted bf-pos"></span></div>
        <div class="bf-main"><div class="bf-browser"></div><div class="bf-view scroll"></div></div>
        <div class="bf-loading"><div class="spinner" style="border-color:rgba(255,255,255,.2);border-top-color:#ff6b3d"></div><div>Generating sample packs… <span data-l>0%</span></div></div>
      </div>`;
      const $ = (s) => win.body.querySelector(s), V = $('.bf-view'), BR = $('.bf-browser');
      const title = () => win.setTitle(`${dirty ? '• ' : ''}${proj.name} — BeatForge`);
      const touch = () => { if (!dirty) { dirty = true; title(); } };
      const stepDur = () => 60 / proj.bpm / 4;
      const pat = () => proj.patterns[proj.cur];
      const chColor = (i) => COLORS[i % COLORS.length];
      /* ---- playback ---- */
      function start() {
        A.resume(); if (playing) return; graph = buildGraph(A, proj); playing = true; step = 0; bar = 0; nextT = A.currentTime + 0.06; uiQ = [];
        timer = setInterval(sched, 25); sched(); $('[data-a=play]').innerHTML = gl('pause'); $('[data-a=play]').classList.add('on');
      }
      function stop() { playing = false; clearInterval(timer); timer = null; if (graph) { try { graph.master.gain.setTargetAtTime(0, A.currentTime, 0.02); } catch (e) {} const g0 = graph; setTimeout(() => g0.master.disconnect(), 300); } graph = null; playStep = playBar = -1; uiQ = []; $('[data-a=play]').innerHTML = gl('play'); $('[data-a=play]').classList.remove('on'); paintPlayhead(); }
      function sched() {
        const sd = stepDur();
        while (nextT < A.currentTime + 0.12) {
          const t = nextT + (step % 2 ? proj.swing * sd * 0.5 : 0);
          let pats; if (proj.mode === 'song') { const L = Math.max(1, songLen(proj)); if (bar >= L) bar = 0; pats = patsForBar(proj, bar); } else pats = [{ p: proj.cur, off: 0 }];
          playStepAt(A, graph, proj, pats, step, t, sd); uiQ.push([t, step, bar]);
          nextT += sd; step++;
          const len = proj.mode === 'song' ? 16 : pat().len; if (step >= len) { step = 0; bar++; }
        }
      }
      /* ---- views ---- */
      function renderTop() {
        $('[data-f=bpm]').value = proj.bpm; $('[data-f=swing]').value = proj.swing; $('[data-f=master]').value = proj.master;
        $('[data-f=pat]').innerHTML = proj.patterns.map((p, i) => `<option value="${i}" ${i === proj.cur ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
        win.body.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('on', b.dataset.m === proj.mode));
        win.body.querySelectorAll('[data-v]').forEach((b) => b.classList.toggle('on', b.dataset.v === view));
        $('.bf-browser').classList.toggle('open', browserOpen);
      }
      function render() { renderTop(); ({ rack: renderRack, piano: renderPiano, song: renderSong, mixer: renderMixer }[view])(); paintPlayhead(); }
      function renderBrowser() {
        BR.innerHTML = `<div class="bf-bhead">Sample packs</div>` + Object.entries(PACKS).map(([p, s]) => `<details ${p === 'Classic Kit' ? 'open' : ''}><summary>${gl('package')} ${esc(p)} <small>${Object.keys(s).length}</small></summary>${Object.keys(s).map((n) => `<div class="bf-sample" data-s="${esc(p + '/' + n)}"><button class="bf-sname" data-prev>${gl('play')} ${esc(n)}</button><button class="ibtn" data-add title="Add to rack">${gl('plus')}</button></div>`).join('')}</details>`).join('') +
          `<div class="bf-bhead">Synths</div>` + Object.keys(PRESETS).map((n) => `<div class="bf-sample" data-syn="${esc(n)}"><button class="bf-sname" data-prev>${gl('play')} ${esc(n)}</button><button class="ibtn" data-add title="Add to rack">${gl('plus')}</button></div>`).join('');
        BR.querySelectorAll('.bf-sample').forEach((r) => {
          r.querySelector('[data-prev]').onclick = () => { A.resume(); if (r.dataset.s) { const b = bank && bank[r.dataset.s]; if (!b) return; const s = A.createBufferSource(); s.buffer = b; s.connect(A.destination); s.start(); } else { const g = A.createGain(); g.gain.value = 0.8; g.connect(A.destination); [60, 64, 67].forEach((m, i) => playSynth(A, g, r.dataset.syn, m, A.currentTime + i * 0.12, 0.3)); } };
          r.querySelector('[data-add]').onclick = () => { const id = uid(); if (r.dataset.s) proj.channels.push({ id, name: r.dataset.s.split('/')[1], kind: 'sample', sample: r.dataset.s, vol: 0.8, pan: 0, mute: false, solo: false, pitch: 0, rev: 0.1, cut: 1 }); else proj.channels.push({ id, name: r.dataset.syn, kind: 'synth', preset: r.dataset.syn, vol: 0.6, pan: 0, mute: false, solo: false, pitch: 0, rev: 0.2, cut: 1 }); touch(); if (playing) { stop(); start(); } if (OS.isMobile()) browserOpen = false; render(); OS.notify('Channel added', r.dataset.s ? r.dataset.s.split('/')[1] : r.dataset.syn, { app: 'beatforge' }); };
        });
      }
      function chMenu(ch, x, y) {
        const i = proj.channels.indexOf(ch);
        OS.menu(x, y, [
          { label: 'Rename…', icon: 'edit', action: async () => { const n = await OS.prompt('Channel name', '', ch.name); if (n) { ch.name = n; touch(); render(); } } },
          ch.kind === 'synth' && { label: 'Open piano roll', icon: 'piano', action: () => { pianoCh = ch.id; view = 'piano'; render(); } },
          ch.kind === 'synth' && { label: 'Change synth…', icon: 'music', action: () => OS.menu(x + 20, y + 20, Object.keys(PRESETS).map((p) => ({ label: (ch.preset === p ? '✓ ' : '') + p, action: () => { ch.preset = p; touch(); render(); } }))) },
          ch.kind === 'sample' && { label: 'Change sample…', icon: 'music', action: () => OS.menu(x + 20, Math.max(10, y - 200), Object.entries(PACKS).flatMap(([p, s]) => Object.keys(s).map((n) => ({ label: (ch.sample === p + '/' + n ? '✓ ' : '') + `${n} (${p})`, action: () => { ch.sample = p + '/' + n; touch(); render(); } })))) },
          { label: `Pitch: ${ch.pitch > 0 ? '+' : ''}${ch.pitch || 0} st`, icon: 'sliders', action: async () => { const v = await OS.prompt('Pitch (semitones)', '-24 to +24', String(ch.pitch || 0)); if (v != null && !isNaN(+v)) { ch.pitch = OS.clamp(Math.round(+v), -24, 24); touch(); render(); } } },
          { label: 'Clear steps in this pattern', icon: 'eraser', action: () => { delete pat().steps[ch.id]; delete pat().notes[ch.id]; touch(); render(); } },
          { label: 'Move up', icon: 'arrowup', disabled: i === 0, action: () => { proj.channels.splice(i - 1, 0, proj.channels.splice(i, 1)[0]); touch(); render(); } },
          '-', { label: 'Delete channel', icon: 'trash', danger: true, action: () => { proj.channels.splice(i, 1); proj.patterns.forEach((p) => { delete p.steps[ch.id]; delete p.notes[ch.id]; }); if (playing) { stop(); start(); } touch(); render(); } },
        ]);
      }
      function renderRack() {
        const p = pat(); const n = p.len;
        V.innerHTML = `<div class="bf-rack">${proj.channels.map((ch, ci) => {
          const st = ch.kind === 'sample' ? (p.steps[ch.id] || []) : null; const notes = ch.kind === 'synth' ? (p.notes[ch.id] || []) : null;
          return `<div class="bf-row ${ch.mute ? 'muted' : ''}" data-ch="${ch.id}"><div class="bf-chead"><i style="background:${chColor(ci)}"></i><button class="bf-ms ${ch.mute ? 'on' : ''}" data-mute title="Mute">M</button><button class="bf-ms ${ch.solo ? 'on solo' : ''}" data-solo title="Solo">S</button><button class="bf-cname" data-name>${esc(ch.name)}<small>${ch.kind === 'synth' ? esc(ch.preset) : esc(ch.sample.split('/')[0])}</small></button></div>
            <div class="bf-steps" style="--n:${n}">${ch.kind === 'sample' ? Array.from({ length: n }, (_, i) => `<button class="bf-step ${st[i] ? (st[i] < 1 ? 'soft' : 'on') : ''} ${Math.floor(i / 4) % 2 ? 'alt' : ''}" data-i="${i}" style="--c:${chColor(ci)}"></button>`).join('') : `<button class="bf-roll" data-roll style="--c:${chColor(ci)}">${(() => { const lo = Math.min(...notes.map((x) => x.n), 60), hi = Math.max(...notes.map((x) => x.n), 72); return notes.map((x) => `<i style="left:${x.s / n * 100}%;width:${x.l / n * 100}%;top:${100 - (x.n - lo + 1) / (hi - lo + 2) * 100}%"></i>`).join(''); })()}<span>${notes.length ? '' : 'Tap to open piano roll'}</span></button>`}</div></div>`;
        }).join('')}</div><div class="bf-addrow"><button class="btn sm" data-a="addch">${gl('plus')}Add channel</button><div class="seg"><button data-len="16" class="${n === 16 ? 'on' : ''}">16 steps</button><button data-len="32" class="${n === 32 ? 'on' : ''}">32 steps</button></div><button class="btn sm" data-a="clearpat">${gl('eraser')}Clear pattern</button><span class="small muted hide-m">Tip: right-click or long-press a step for a soft hit.</span></div>`;
        V.querySelectorAll('.bf-row').forEach((row) => {
          const ch = proj.channels.find((c) => c.id === row.dataset.ch);
          row.querySelector('[data-mute]').onclick = () => { ch.mute = !ch.mute; graph && graph.update(proj); touch(); render(); };
          row.querySelector('[data-solo]').onclick = () => { ch.solo = !ch.solo; graph && graph.update(proj); touch(); render(); };
          const nm = row.querySelector('[data-name]'); nm.onclick = (e) => { if (ch.kind === 'synth') { pianoCh = ch.id; view = 'piano'; render(); } else { A.resume(); const g = buildGraph(A, proj); trigger(A, g, ch, A.currentTime, 1); setTimeout(() => g.master.disconnect(), 2500); } };
          OS.onContext(nm, (e, x, y) => chMenu(ch, x, y));
          row.querySelectorAll('.bf-step').forEach((b) => {
            const i = +b.dataset.i; const arr = () => (pat().steps[ch.id] = pat().steps[ch.id] || Array(pat().len).fill(0));
            b.onclick = () => { const a = arr(); a[i] = a[i] ? 0 : 1; b.className = `bf-step ${a[i] ? 'on' : ''} ${Math.floor(i / 4) % 2 ? 'alt' : ''}`; touch(); if (a[i] && !playing) { A.resume(); const g = buildGraph(A, proj); trigger(A, g, ch, A.currentTime, 1); setTimeout(() => g.master.disconnect(), 2000); } };
            OS.onContext(b, () => { const a = arr(); a[i] = a[i] === 0.6 ? 0 : 0.6; b.className = `bf-step ${a[i] ? 'soft' : ''} ${Math.floor(i / 4) % 2 ? 'alt' : ''}`; touch(); });
          });
          const roll = row.querySelector('[data-roll]'); if (roll) roll.onclick = () => { pianoCh = ch.id; view = 'piano'; render(); };
        });
        V.querySelector('[data-a=addch]').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left, r.top - 10, [{ label: 'Open sample browser', icon: 'folder', action: () => { browserOpen = true; render(); } }, '-', ...Object.keys(PRESETS).map((pr) => ({ label: 'Synth: ' + pr, icon: 'piano', action: () => { proj.channels.push({ id: uid(), name: pr, kind: 'synth', preset: pr, vol: 0.6, pan: 0, mute: false, solo: false, pitch: 0, rev: 0.2, cut: 1 }); touch(); if (playing) { stop(); start(); } render(); } }))]); };
        V.querySelectorAll('[data-len]').forEach((b) => (b.onclick = () => { const p2 = pat(); const L = +b.dataset.len; if (L > p2.len) { Object.values(p2.steps).forEach((a) => { a.length = p2.len; a.push(...a.slice(0, p2.len)); }); Object.keys(p2.notes).forEach((k) => (p2.notes[k] = [...p2.notes[k], ...p2.notes[k].map((x) => ({ ...x, s: x.s + p2.len }))])); } else { Object.values(p2.steps).forEach((a) => (a.length = L)); Object.keys(p2.notes).forEach((k) => (p2.notes[k] = p2.notes[k].filter((x) => x.s < L))); } p2.len = L; touch(); render(); }));
        V.querySelector('[data-a=clearpat]').onclick = async () => { if (await OS.confirm('Clear pattern?', `Remove all steps and notes from “${pat().name}”.`, 'Clear', true)) { pat().steps = {}; pat().notes = {}; touch(); render(); } };
      }
      function renderPiano() {
        const synths = proj.channels.filter((c) => c.kind === 'synth');
        if (!synths.length) { V.innerHTML = `<div class="empty">${gl('piano')}<div>Add a synth channel to write melodies</div><button class="btn" data-x>Add synth</button></div>`; V.querySelector('[data-x]').onclick = () => { proj.channels.push({ id: uid(), name: 'Saw Lead', kind: 'synth', preset: 'Saw Lead', vol: 0.6, pan: 0, mute: false, solo: false, pitch: 0, rev: 0.2, cut: 1 }); render(); }; return; }
        if (!synths.some((c) => c.id === pianoCh)) pianoCh = synths[0].id;
        const ch = proj.channels.find((c) => c.id === pianoCh), ci = proj.channels.indexOf(ch); const p = pat(), n = p.len; const notes = (p.notes[ch.id] = p.notes[ch.id] || []);
        const LO = 24, HI = 96; const rows = [];
        for (let m = HI; m >= LO; m--) rows.push(m);
        V.innerHTML = `<div class="bf-prhead"><select class="inp" data-pc>${synths.map((c) => `<option value="${c.id}" ${c.id === ch.id ? 'selected' : ''}>${esc(c.name)} (${esc(c.preset)})</option>`).join('')}</select><span class="small muted">Tap a cell to add a note, drag right to make it longer, tap a note to delete it.</span></div>
          <div class="bf-pr" style="--n:${n};--c:${chColor(ci)}"><div class="bf-keys">${rows.map((m) => `<button class="bf-key ${[1, 3, 6, 8, 10].includes(m % 12) ? 'blk' : ''}" data-k="${m}">${m % 12 === 0 ? NOTE(m) : ''}</button>`).join('')}</div><div class="bf-grid" data-grid>${rows.map((m) => `<div class="bf-prow ${[1, 3, 6, 8, 10].includes(m % 12) ? 'blk' : ''} ${m % 12 === 0 ? 'c' : ''}" data-m="${m}"></div>`).join('')}${notes.map((x, i) => `<i class="bf-note" data-ni="${i}" style="left:calc(${x.s} * var(--cw));width:calc(${x.l} * var(--cw) - 2px);top:calc(${HI - x.n} * var(--rh))"></i>`).join('')}<div class="bf-prhead-line"></div></div></div>`;
        V.querySelector('[data-pc]').onchange = (e) => { pianoCh = e.target.value; render(); };
        V.querySelectorAll('.bf-key').forEach((k) => k.addEventListener('pointerdown', () => { A.resume(); const g = A.createGain(); g.gain.value = ch.vol; g.connect(A.destination); playSynth(A, g, ch.preset, +k.dataset.k, A.currentTime, 0.35); }));
        const grid = V.querySelector('[data-grid]');
        grid.addEventListener('pointerdown', (e) => {
          const r = grid.getBoundingClientRect(); const cw = r.width / n, rh = parseFloat(getComputedStyle(grid).getPropertyValue('--rh')) || 18;
          const s = Math.floor((e.clientX - r.left) / cw), m = HI - Math.floor((e.clientY - r.top) / rh); if (s < 0 || s >= n || m < LO || m > HI) return;
          if (e.pointerType !== 'mouse') return; // touch: handled by click so the grid can scroll
          const ni = e.target.dataset.ni; if (ni != null) { notes.splice(+ni, 1); touch(); render(); return; }
          const note = { s, n: m, l: 1 }; notes.push(note); touch(); A.resume(); const g = A.createGain(); g.gain.value = ch.vol; g.connect(A.destination); playSynth(A, g, ch.preset, m, A.currentTime, 0.25);
          const el = OS.el(`<i class="bf-note" style="left:calc(${s} * var(--cw));width:calc(1 * var(--cw) - 2px);top:calc(${HI - m} * var(--rh))"></i>`); grid.appendChild(el);
          grid.setPointerCapture(e.pointerId);
          const mv = (ev) => { note.l = OS.clamp(Math.floor((ev.clientX - r.left) / cw) - s + 1, 1, n - s); el.style.width = `calc(${note.l} * var(--cw) - 2px)`; };
          const up = () => { grid.removeEventListener('pointermove', mv); grid.removeEventListener('pointerup', up); render(); };
          grid.addEventListener('pointermove', mv); grid.addEventListener('pointerup', up);
        });
        grid.addEventListener('click', (e) => { if (e.pointerType === 'mouse') return; const r = grid.getBoundingClientRect(); const cw = r.width / n, rh = parseFloat(getComputedStyle(grid).getPropertyValue('--rh')) || 18; const ni = e.target.dataset.ni; if (ni != null) { notes.splice(+ni, 1); touch(); render(); return; } const s = Math.floor((e.clientX - r.left) / cw), m = HI - Math.floor((e.clientY - r.top) / rh); if (s < 0 || s >= n || m < LO || m > HI) return; const ex = notes.find((x) => x.n === m && x.s + x.l === s); if (ex) ex.l++; else notes.push({ s, n: m, l: 1 }); touch(); A.resume(); const g = A.createGain(); g.gain.value = ch.vol; g.connect(A.destination); playSynth(A, g, ch.preset, m, A.currentTime, 0.25); render(); });
        const sc = V; requestAnimationFrame(() => { const top = notes.length ? (HI - Math.max(...notes.map((x) => x.n)) - 3) : HI - 72; sc.scrollTop = Math.max(0, top * 18); });
      }
      function renderSong() {
        const S = proj.song;
        V.innerHTML = `<div class="bf-songhead"><span class="small muted">Tap a cell to place the selected pattern (<b>${esc(pat().name)}</b>); tap again to remove. Switch to <b>Song</b> mode to play the arrangement.</span></div>
          <div class="bf-song" style="--bars:${S.bars}"><div></div>${Array.from({ length: S.bars }, (_, b) => `<div class="bf-barnum" data-b="${b}">${b + 1}</div>`).join('')}
          ${S.cells.map((lane, li) => `<div class="bf-lane">Track ${li + 1}</div>${lane.map((v, b) => `<button class="bf-cell ${v >= 0 ? 'on' : ''}" data-l="${li}" data-b="${b}" style="--c:${v >= 0 ? COLORS[v % COLORS.length] : 'transparent'}">${v >= 0 ? esc(proj.patterns[v]?.name || '?') : ''}</button>`).join('')}`).join('')}</div>
          <div class="bf-addrow"><button class="btn sm" data-a="addlane">${gl('plus')}Track</button><button class="btn sm" data-a="addbars">${gl('plus')}8 bars</button><button class="btn sm" data-a="clearsong">${gl('eraser')}Clear song</button></div>`;
        V.querySelectorAll('.bf-cell').forEach((c) => (c.onclick = () => { const l = +c.dataset.l, b = +c.dataset.b; S.cells[l][b] = S.cells[l][b] === proj.cur ? -1 : proj.cur; touch(); renderSong(); paintPlayhead(); }));
        V.querySelector('[data-a=addlane]').onclick = () => { S.cells.push(Array(S.bars).fill(-1)); S.lanes++; touch(); renderSong(); };
        V.querySelector('[data-a=addbars]').onclick = () => { S.bars += 8; S.cells.forEach((l) => l.push(...Array(8).fill(-1))); touch(); renderSong(); };
        V.querySelector('[data-a=clearsong]').onclick = () => { S.cells = S.cells.map((l) => l.map(() => -1)); touch(); renderSong(); };
      }
      function renderMixer() {
        const strip = (ch, ci) => `<div class="bf-strip" data-ch="${ch.id}"><i style="background:${chColor(ci)}"></i><b title="${esc(ch.name)}">${esc(ch.name)}</b><div class="bf-fader"><input type="range" min="0" max="1.2" step="0.01" value="${ch.vol}" data-p="vol" orient="vertical"></div><small>${Math.round(ch.vol * 100)}</small><label>Pan<input type="range" min="-1" max="1" step="0.05" value="${ch.pan}" data-p="pan"></label><label>Reverb<input type="range" min="0" max="1" step="0.02" value="${ch.rev}" data-p="rev"></label><label>Tone<input type="range" min="0.2" max="1" step="0.01" value="${ch.cut ?? 1}" data-p="cut"></label><div class="row" style="gap:4px"><button class="bf-ms ${ch.mute ? 'on' : ''}" data-mute>M</button><button class="bf-ms ${ch.solo ? 'on solo' : ''}" data-solo>S</button></div></div>`;
        V.innerHTML = `<div class="bf-mixer">${proj.channels.map(strip).join('')}<div class="bf-strip master"><i style="background:linear-gradient(90deg,#ff6b3d,#c2185b)"></i><b>Master</b><div class="bf-fader"><input type="range" min="0" max="1" step="0.01" value="${proj.master}" data-master orient="vertical"></div><small>${Math.round(proj.master * 100)}</small><canvas class="bf-meter" width="30" height="120"></canvas></div></div>`;
        V.querySelectorAll('.bf-strip[data-ch]').forEach((s) => { const ch = proj.channels.find((c) => c.id === s.dataset.ch);
          s.querySelectorAll('[data-p]').forEach((r) => (r.oninput = () => { ch[r.dataset.p] = +r.value; if (r.dataset.p === 'vol') s.querySelector('small').textContent = Math.round(ch.vol * 100); graph && graph.update(proj); touch(); }));
          s.querySelector('[data-mute]').onclick = () => { ch.mute = !ch.mute; graph && graph.update(proj); touch(); renderMixer(); };
          s.querySelector('[data-solo]').onclick = () => { ch.solo = !ch.solo; graph && graph.update(proj); touch(); renderMixer(); }; });
        V.querySelector('[data-master]').oninput = (e) => { proj.master = +e.target.value; $('[data-f=master]').value = proj.master; graph && graph.update(proj); touch(); V.querySelector('.master small').textContent = Math.round(proj.master * 100); };
      }
      function paintPlayhead() {
        V.querySelectorAll('.bf-step.ph').forEach((b) => b.classList.remove('ph'));
        V.querySelectorAll('.bf-cell.ph,.bf-barnum.ph').forEach((b) => b.classList.remove('ph'));
        if (playStep < 0) { $('.bf-pos').textContent = ''; const l = V.querySelector('.bf-prhead-line'); if (l) l.style.display = 'none'; return; }
        const p = pat(); const ps = proj.mode === 'song' ? (playBar * 16 + playStep) % p.len : playStep;
        if (view === 'rack' && (proj.mode === 'pattern' || patsForBar(proj, playBar).some((x) => x.p === proj.cur))) V.querySelectorAll(`.bf-step[data-i="${ps}"]`).forEach((b) => b.classList.add('ph'));
        if (view === 'song') V.querySelectorAll(`[data-b="${playBar}"]`).forEach((b) => b.classList.add('ph'));
        const l = V.querySelector('.bf-prhead-line'); if (l) { l.style.display = ''; l.style.left = `calc(${ps} * var(--cw))`; }
        $('.bf-pos').textContent = proj.mode === 'song' ? `Bar ${playBar + 1} · step ${playStep + 1}` : `Step ${playStep + 1}/${p.len}`;
      }
      const viz = $('.bf-viz'), vg = viz.getContext('2d');
      function frame() {
        raf = requestAnimationFrame(frame);
        while (uiQ.length && uiQ[0][0] <= A.currentTime) { const [, s, b] = uiQ.shift(); playStep = s; playBar = b; paintPlayhead(); }
        vg.clearRect(0, 0, 160, 34); if (graph && graph.an) { const d = new Uint8Array(graph.an.frequencyBinCount); graph.an.getByteFrequencyData(d); for (let i = 0; i < 32; i++) { const v = d[i * 2] / 255; vg.fillStyle = `hsl(${10 + i * 6},90%,60%)`; vg.fillRect(i * 5, 34 - v * 34, 4, v * 34); } const m = V.querySelector('.bf-meter'); if (m) { const mg = m.getContext('2d'); const lvl = d.slice(0, 40).reduce((a, x) => a + x, 0) / 40 / 255; mg.clearRect(0, 0, 30, 120); const gr = mg.createLinearGradient(0, 120, 0, 0); gr.addColorStop(0, '#3fdc77'); gr.addColorStop(0.7, '#f7c948'); gr.addColorStop(1, '#ff4d4d'); mg.fillStyle = gr; mg.fillRect(6, 120 - lvl * 160, 18, lvl * 160); } }
      }
      /* ---- transport wiring ---- */
      $('[data-a=play]').onclick = () => (playing ? stop() : start());
      $('[data-a=stop]').onclick = stop;
      $('[data-f=bpm]').onchange = (e) => { proj.bpm = OS.clamp(+e.target.value || 120, 40, 240); e.target.value = proj.bpm; touch(); };
      $('[data-f=swing]').oninput = (e) => { proj.swing = +e.target.value; touch(); };
      $('[data-f=master]').oninput = (e) => { proj.master = +e.target.value; graph && graph.update(proj); touch(); };
      $('[data-f=pat]').onchange = (e) => { proj.cur = +e.target.value; render(); };
      let taps = []; $('[data-a=tap]').onclick = () => { const n = performance.now(); taps = taps.filter((t) => n - t < 2500); taps.push(n); if (taps.length > 2) { const iv = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); proj.bpm = Math.round(OS.clamp(60000 / iv, 40, 240)); renderTop(); touch(); } };
      win.body.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { proj.mode = b.dataset.m; if (playing) { stop(); start(); } touch(); renderTop(); }));
      win.body.querySelectorAll('[data-v]').forEach((b) => (b.onclick = () => { view = b.dataset.v; render(); }));
      $('[data-a=browser]').onclick = () => { browserOpen = !browserOpen; renderTop(); };
      $('[data-a=addpat]').onclick = () => { proj.patterns.push({ name: `Pattern ${proj.patterns.length + 1}`, len: 16, steps: {}, notes: {} }); proj.cur = proj.patterns.length - 1; touch(); render(); };
      $('[data-a=clonepat]').onclick = () => { const c = JSON.parse(JSON.stringify(pat())); c.name += ' copy'; proj.patterns.splice(proj.cur + 1, 0, c); proj.cur++; touch(); render(); };
      OS.onContext($('[data-f=pat]'), (e, x, y) => OS.menu(x, y, [{ label: 'Rename pattern…', icon: 'edit', action: async () => { const n = await OS.prompt('Pattern name', '', pat().name); if (n) { pat().name = n; touch(); render(); } } }, { label: 'Delete pattern', icon: 'trash', danger: true, disabled: proj.patterns.length < 2, action: () => { const i = proj.cur; proj.patterns.splice(i, 1); proj.song.cells = proj.song.cells.map((l) => l.map((v) => (v === i ? -1 : v > i ? v - 1 : v))); proj.cur = Math.max(0, i - 1); touch(); render(); } }]));
      const dir = () => OS.home() + '/Music/BeatForge';
      const saveAs = async (as) => { let p = path; if (!p || as) { p = await OS.pickFile({ mode: 'save', path: dir(), name: proj.name + '.beat' }); if (!p) return false; if (!p.endsWith('.beat')) p += '.beat'; } try { OS.fs.mkdir(OS.fs.dirname(p), { p: true }); OS.fs.write(p, JSON.stringify(proj)); path = p; proj.name = OS.fs.basename(p).replace(/\.beat$/, ''); dirty = false; title(); return true; } catch (e) { OS.alert('Save failed', e.message); return false; } };
      const loadFile = (p) => { try { const d = JSON.parse(OS.fs.read(p)); if (!d.channels || !d.patterns) throw new Error('Not a BeatForge project'); stop(); proj = d; path = p; dirty = false; title(); render(); } catch (e) { OS.alert('Could not open', e.message); } };
      const confirmLose = async () => { if (!dirty) return true; const r = await OS.dialog({ title: 'Save project?', message: `Save changes to “${proj.name}”?`, buttons: [{ label: 'Cancel', value: 'c' }, { label: "Don't save", value: 'd', danger: true }, { label: 'Save', value: 's', primary: true }] }); return r === 's' ? saveAs() : r === 'd'; };
      win.beforeClose = confirmLose;
      async function exportWav(toFs) {
        await loadBank(); const sd = stepDur(); const song = proj.mode === 'song' && songLen(proj) > 0;
        const steps = song ? songLen(proj) * 16 : pat().len * 4; const dur = steps * sd + 2.5; const sr = toFs ? 22050 : 44100;
        const oc = new OfflineAudioContext(toFs ? 1 : 2, Math.ceil(sr * dur), sr); const gph = buildGraph(oc, proj);
        for (let i = 0; i < steps; i++) { const b = Math.floor(i / 16), k = song ? i % 16 : i % pat().len; const t = i * sd + (i % 2 ? proj.swing * sd * 0.5 : 0) + 0.02; playStepAt(oc, gph, proj, song ? patsForBar(proj, b) : [{ p: proj.cur, off: 0 }], k, t, sd); }
        OS.notify('Rendering…', `${song ? 'Song' : 'Pattern ×4'} · ${dur.toFixed(1)} s`, { app: 'beatforge' });
        const buf = await oc.startRendering(); const blob = encodeWav(buf);
        if (!toFs) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = proj.name + '.wav'; a.click(); return; }
        if (blob.size > 2.5e6) return OS.alert('Too large for browser storage', `The WAV file is ${OS.fmtSize(blob.size)}. Use "Download WAV" instead, or export a shorter pattern.`);
        const url = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
        const p = OS.fs.uniqueName(OS.home() + '/Music', proj.name + '.wav'); OS.fs.write(p, url); OS.notify('Exported', `${OS.fs.pretty(p)} — open it in Music`, { app: 'beatforge', onclick: () => OS.wm.open('music', { path: p }) });
      }
      $('[data-a=menu]').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left, r.bottom + 4, [
        { label: 'New project', icon: 'plus', action: async () => { if (await confirmLose()) { stop(); proj = blank(); path = null; dirty = false; title(); render(); } } },
        { label: 'Open…', icon: 'folder', action: async () => { if (!(await confirmLose())) return; OS.fs.mkdir(dir(), { p: true }); const p = await OS.pickFile({ mode: 'open', path: dir(), filter: (n) => n.endsWith('.beat') }); if (p) loadFile(p); } },
        { label: 'Save', icon: 'save', key: 'Ctrl+S', action: () => saveAs() }, { label: 'Save As…', icon: 'save', action: () => saveAs(true) }, '-',
        { label: 'Download WAV', icon: 'download', action: () => exportWav(false) }, { label: 'Export WAV to ~/Music', icon: 'music', action: () => exportWav(true) }, '-',
        { label: 'Load demo song', icon: 'star', action: async () => { if (await confirmLose()) { stop(); proj = demo(); path = null; dirty = false; title(); render(); } } },
        { label: 'Keyboard shortcuts', icon: 'keyboard', action: () => OS.alert('Shortcuts', 'Space — play / stop\n1–4 — Rack / Piano roll / Song / Mixer\nCtrl+S — save\nRight-click a step — soft hit\nRight-click a channel name — channel options') },
      ]); };
      OS.wm.keys(win, (e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; if (e.key === ' ') { e.preventDefault(); playing ? stop() : start(); } else if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveAs(); } else if (/^[1-4]$/.test(e.key)) { view = ['rack', 'piano', 'song', 'mixer'][+e.key - 1]; render(); } });
      win.onClose(() => { stop(); cancelAnimationFrame(raf); });
      win.onArgs = async (a) => { if (a.path && (await confirmLose())) loadFile(a.path); };
      title(); render(); raf = requestAnimationFrame(frame);
      loadBank((p) => { const l = win.body.querySelector('[data-l]'); if (l) l.textContent = Math.round(p * 100) + '%'; }).then(() => { win.body.querySelector('.bf-loading')?.remove(); renderBrowser(); });
      if (bank && Object.keys(bank).length) { win.body.querySelector('.bf-loading')?.remove(); renderBrowser(); }
      if (args.path) loadFile(args.path);
      // seed a demo file the first time
      if (!OS.store.get('bf-demo')) { OS.store.set('bf-demo', 1); try { OS.fs.mkdir(dir(), { p: true }); OS.fs.write(dir() + '/Sunset Groove.beat', JSON.stringify(demo())); } catch (e) {} }
    },
  });
})();
