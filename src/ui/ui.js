// ui.js — canvas UI primitives with a wood/parchment pirate theme.

export const THEME = {
  panel: 'rgba(24,30,40,0.9)',
  panelBorder: '#f6bb42',
  wood: '#7a4a24',
  woodLite: '#9c6634',
  woodDark: '#5c3618',
  gold: '#f6bb42',
  cream: '#f5ecd6',
  green: '#8cc152',
  red: '#e9573f',
  blue: '#5b8fd6',
  ink: '#241a12',
};

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function panel(ctx, x, y, w, h, r = 14) {
  ctx.save();
  ctx.fillStyle = THEME.panel;
  roundRect(ctx, x, y, w, h, r); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = THEME.panelBorder;
  roundRect(ctx, x + 1.5, y + 1.5, w - 3, h - 3, r - 1); ctx.stroke();
  ctx.restore();
}

// Draw a button; returns the same rect object for hit-testing.
export function button(ctx, b, label, opts = {}) {
  const { disabled = false, active = false, sub = null, color = THEME.wood } = opts;
  ctx.save();
  roundRect(ctx, b.x, b.y, b.w, b.h, 11);
  const grad = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
  if (disabled) { grad.addColorStop(0, '#4a4a52'); grad.addColorStop(1, '#33333a'); }
  else if (active) { grad.addColorStop(0, THEME.gold); grad.addColorStop(1, '#d49a20'); }
  else { grad.addColorStop(0, THEME.woodLite); grad.addColorStop(1, THEME.woodDark); }
  ctx.fillStyle = grad; ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = disabled ? '#555' : (active ? '#fff2c0' : THEME.gold);
  roundRect(ctx, b.x + 1.25, b.y + 1.25, b.w - 2.5, b.h - 2.5, 10); ctx.stroke();

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const cy = sub ? b.y + b.h * 0.38 : b.y + b.h / 2;
  ctx.fillStyle = disabled ? '#999' : (active ? THEME.ink : THEME.cream);
  let fs = Math.round(b.h * (sub ? 0.3 : 0.36));
  ctx.font = `bold ${fs}px system-ui, sans-serif`;
  const maxW = b.w - 16;
  const lw = ctx.measureText(label).width;
  if (lw > maxW) { fs = Math.max(9, Math.floor(fs * maxW / lw)); ctx.font = `bold ${fs}px system-ui, sans-serif`; }
  ctx.fillText(label, b.x + b.w / 2, cy);
  if (sub) {
    ctx.font = `${Math.round(b.h * 0.22)}px system-ui, sans-serif`;
    ctx.fillStyle = disabled ? '#888' : (active ? '#3a2a10' : THEME.gold);
    ctx.fillText(sub, b.x + b.w / 2, b.y + b.h * 0.72);
  }
  ctx.restore();
  return b;
}

export function pointIn(b, x, y) {
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

export function text(ctx, str, x, y, size, color = THEME.cream, align = 'left', weight = '') {
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export function textShadow(ctx, str, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillText(str, x + 1.5, y + 1.5);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export function bar(ctx, x, y, w, h, frac, color, bg = 'rgba(0,0,0,0.5)') {
  ctx.fillStyle = bg; roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = color;
    roundRect(ctx, x, y, Math.max(h, w * Math.max(0, Math.min(1, frac))), h, h / 2); ctx.fill();
  }
}
