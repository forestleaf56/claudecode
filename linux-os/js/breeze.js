/* Cirrus Linux — Breeze: LAN chat with hand-drawn emojis.
   Devices on the same network share a public IP, so they meet in the same encrypted "network room" on a public
   MQTT-over-WebSocket relay. Tabs on the same device also talk directly (BroadcastChannel), even offline.
   All chat content is end-to-end encrypted (AES-GCM; direct messages use per-pair ECDH keys). */
(function () {
  'use strict';
  const esc = OS.esc, gl = OS.glyph;
  const te = new TextEncoder(), td = new TextDecoder();
  const b64 = (u8) => btoa(String.fromCharCode(...new Uint8Array(u8)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  const rid = () => hex(crypto.getRandomValues(new Uint8Array(8)));

  /* ===================== hand-drawn emojis ===================== */
  const INK = '#4a3200', S = `stroke="${INK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"`;
  const face = (inner, fill = '#ffd43b', extra = '') => `<svg viewBox="0 0 64 64">${extra}<path d="M32 4.5c15.5-.4 27.8 12 27.4 27.6-.3 15.3-12.3 27.6-27.6 27.4C16.6 59.3 4.3 47 4.6 31.6 4.9 16.7 17 4.9 32 4.5z" fill="${fill}" ${S}/><path d="M17 15c4-4 9-6 13-6" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55" fill="none"/>${inner}</svg>`;
  const eyes = `<path d="M22 22.5c2.3-.2 2.6 5.8.2 6-2.5.3-2.6-5.8-.2-6zM42 22.5c2.3-.2 2.6 5.8.2 6-2.5.3-2.6-5.8-.2-6z" fill="${INK}" ${S} stroke-width="2"/>`;
  const smileM = `<path d="M19 38c5 8.5 20.5 9 26-.5" fill="none" ${S}/>`;
  const cheeks = `<ellipse cx="15" cy="37" rx="4.5" ry="3" fill="#ff8a80" opacity=".6"/><ellipse cx="49" cy="37" rx="4.5" ry="3" fill="#ff8a80" opacity=".6"/>`;
  const heart = (x, y, s, c = '#ff4d6d') => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -3c-3-7-13-5-12 2 1 6 8 10 12 14 4-4 11-8 12-14 1-7-9-9-12-2z" fill="${c}" stroke="#7a0019" stroke-width="${2.4 / s}" stroke-linejoin="round"/>`;
  const obj = (inner) => `<svg viewBox="0 0 64 64">${inner}</svg>`;
  const EMOJI = {
    smile: face(eyes + smileM + cheeks),
    grin: face(eyes + `<path d="M17 35.5c9 3 21 3 30 0-1.5 11-27 12-30 0z" fill="#fff" ${S}/><path d="M18 40h28" ${S}/>`),
    laugh: face(`<path d="M16 26l6-4.5 6 4.5M36 26l6-4.5 6 4.5" fill="none" ${S}/><path d="M16 34c10 2 22 2 32 0-1 14-31 15-32 0z" fill="#8a2b0c" ${S}/><path d="M24 44c5-3 12-3 16 0" fill="#ff7b7b" stroke="none"/><path d="M7 30c-3 3-3 7 0 9M57 30c3 3 3 7 0 9" stroke="#4fc3f7" stroke-width="3.5" stroke-linecap="round" fill="none"/>`),
    wink: face(`<path d="M18 26c3-2.5 6.5-2.5 9 0" fill="none" ${S}/><path d="M42 22.5c2.3-.2 2.6 5.8.2 6-2.5.3-2.6-5.8-.2-6z" fill="${INK}" ${S} stroke-width="2"/>` + smileM + cheeks),
    love: face(heart(22, 25, 0.5) + heart(42, 25, 0.5) + smileM),
    kiss: face(eyes + `<path d="M30 37c4-1 5 3 1 4 4 1 3 5-1 4" fill="none" ${S}/>` + heart(48, 44, 0.32)),
    cool: face(`<path d="M10 22h44l-2 4c-1 7-9 9-13 5l-3-4h-4l-3 4c-4 4-12 2-13-5z" fill="#222" ${S} stroke-width="2.6"/><path d="M16 24l5 0" stroke="#fff" stroke-width="2" opacity=".7"/>` + `<path d="M22 41c5 4 13 4 20-2" fill="none" ${S}/>`),
    tongue: face(eyes + `<path d="M19 37h26" ${S}/><path d="M33 37c0 9 10 9 10 0" fill="#ff6f91" ${S}/>`),
    sad: face(`<path d="M17 21l8 3M47 21l-8 3" ${S}/>` + eyes + `<path d="M21 46c6-7 16-7 22 0" fill="none" ${S}/>`),
    cry: face(`<path d="M18 25c3 2.5 6.5 2.5 9 0M37 25c3 2.5 6.5 2.5 9 0" fill="none" ${S}/><path d="M22 29c-3 7-4 13-1 15 3 1 4-3 3-15zM42 29c3 7 4 13 1 15-3 1-4-3-3-15z" fill="#4fc3f7" stroke="#0277bd" stroke-width="2"/><path d="M23 46c5-6 13-6 18 0" fill="none" ${S}/>`),
    angry: face(`<path d="M15 19l11 6M49 19l-11 6" ${S}/>` + eyes + `<path d="M21 46c6-6 16-6 22 0" fill="none" ${S}/>`, '#ff7043'),
    shock: face(`<circle cx="22" cy="25" r="5" fill="#fff" ${S}/><circle cx="42" cy="25" r="5" fill="#fff" ${S}/><circle cx="22" cy="25.5" r="1.8" fill="${INK}"/><circle cx="42" cy="25.5" r="1.8" fill="${INK}"/><ellipse cx="32" cy="43" rx="6" ry="8" fill="#8a2b0c" ${S}/>`),
    sleepy: face(`<path d="M17 27c3 2.5 6.5 2.5 9 0M38 27c3 2.5 6.5 2.5 9 0" fill="none" ${S}/><path d="M26 42c4 2 8 2 12 0" fill="none" ${S}/>`, '#ffd43b', `<text x="44" y="16" font-size="15" font-weight="900" fill="#5c6bc0" font-family="Comic Sans MS,cursive">z</text><text x="52" y="9" font-size="10" font-weight="900" fill="#5c6bc0" font-family="Comic Sans MS,cursive">z</text>`),
    think: face(`<path d="M17 20l8-2M39 18l8 3" ${S}/>` + eyes + `<path d="M25 42l14-3" ${S}/><path d="M18 52c2-6 8-9 14-7 2 1 2 4-1 5l-5 1c3 0 4 3 1 4" fill="#ffd43b" ${S}/>`),
    nerd: face(`<circle cx="21" cy="26" r="7.5" fill="#fff" ${S}/><circle cx="43" cy="26" r="7.5" fill="#fff" ${S}/><path d="M28.5 26h7" ${S}/><circle cx="21" cy="26.5" r="2.4" fill="${INK}"/><circle cx="43" cy="26.5" r="2.4" fill="${INK}"/><path d="M22 41c6 5 14 5 20 0" fill="none" ${S}/><path d="M28 43.5h3v4h-3zM33 43.5h3v4h-3z" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`),
    sick: face(`<path d="M17 25c3 2 6.5 2 9 0M38 25c3 2 6.5 2 9 0" fill="none" ${S}/><path d="M16 38h32v9c0 3-3 5-6 5H22c-3 0-6-2-6-5z" fill="#e3f2fd" ${S}/><path d="M16 41l-8-4M48 41l8-4" ${S}/>`, '#aed581'),
    party: face(eyes + smileM + cheeks, '#ffd43b', `<path d="M38 8l14-6 2 16z" fill="#ab47bc" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="52" cy="2.5" r="3" fill="#ffca28"/><path d="M6 12l3 3M10 6l1 4M56 28l5-1M58 34l4 2" stroke="#ef5350" stroke-width="3" stroke-linecap="round"/>`),
    starstruck: face(`<path d="M22 18l2 5 5 .5-4 3.5 1.2 5-4.2-2.7-4.3 2.7 1.3-5-4-3.5 5-.5z" fill="#ffb300" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M42 18l2 5 5 .5-4 3.5 1.2 5-4.2-2.7-4.3 2.7 1.3-5-4-3.5 5-.5z" fill="#ffb300" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M17 37c9 3 21 3 30 0-2 11-28 11-30 0z" fill="#fff" ${S}/>`),
    meh: face(`<path d="M17 25h9M38 25h9" ${S}/><path d="M23 42c5-1 13 1 18-1" fill="none" ${S}/>`),
    scared: face(`<circle cx="22" cy="25" r="4.5" fill="#fff" ${S}/><circle cx="42" cy="25" r="4.5" fill="#fff" ${S}/><path d="M20 44l4-3 4 3 4-3 4 3 4-3 4 3" fill="none" ${S}/>`, '#b3e5fc'),
    devil: face(`<path d="M16 21l9 4M48 21l-9 4" ${S}/>` + eyes + `<path d="M19 38c5 8.5 20.5 9 26-.5" fill="none" ${S}/>`, '#9575cd', `<path d="M9 14c0-6 3-10 7-12-1 5 1 9 4 10zM55 14c0-6-3-10-7-12 1 5-1 9-4 10z" fill="#7e57c2" stroke="${INK}" stroke-width="2.4"/>`),
    angel: face(eyes + smileM + cheeks, '#ffd43b', `<ellipse cx="32" cy="6" rx="15" ry="4" fill="none" stroke="#ffca28" stroke-width="3.5"/>`),
    heart: obj(heart(32, 24, 1.85)),
    broken: obj(heart(32, 24, 1.85, '#e57373') + `<path d="M31 13l5 9-6 6 5 7-4 8" fill="none" stroke="#7a0019" stroke-width="3" stroke-linejoin="round"/>`),
    star: obj(`<path d="M32 5l7.5 16.5 18 2-13.5 12 4 17.5L32 44l-16 9 4-17.5-13.5-12 18-2z" fill="#ffca28" stroke="#8d5a00" stroke-width="3" stroke-linejoin="round"/><path d="M26 22l3-6" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`),
    fire: obj(`<path d="M32 4c4 10 18 16 17 33-1 13-9 22-17 22S14 51 14 39c0-9 5-13 8-18 1 6 3 9 6 9-3-9 0-19 4-26z" fill="#ff7043" stroke="#8d2a00" stroke-width="3" stroke-linejoin="round"/><path d="M32 30c2 7 9 9 8 17-1 5-4 8-8 8s-8-3-8-8c0-5 4-7 5-11 1 3 2 4 3 4z" fill="#ffd54f"/>`),
    thumbsup: obj(`<path d="M9 30h10v26H9z" fill="#90caf9" stroke="#0d47a1" stroke-width="3" stroke-linejoin="round"/><path d="M19 31c6-4 9-11 11-19 1-4 8-3 8 3 0 4-1 8-3 12h15c4 0 6 4 4 7 2 2 2 5-1 7 1 3 0 5-3 6 1 3-1 6-5 6H19z" fill="#ffcc80" stroke="#6d3a00" stroke-width="3" stroke-linejoin="round"/>`),
    thumbsdown: obj(`<g transform="rotate(180 32 32)"><path d="M9 30h10v26H9z" fill="#90caf9" stroke="#0d47a1" stroke-width="3" stroke-linejoin="round"/><path d="M19 31c6-4 9-11 11-19 1-4 8-3 8 3 0 4-1 8-3 12h15c4 0 6 4 4 7 2 2 2 5-1 7 1 3 0 5-3 6 1 3-1 6-5 6H19z" fill="#ffcc80" stroke="#6d3a00" stroke-width="3" stroke-linejoin="round"/></g>`),
    clap: obj(`<path d="M20 50c-8-8-10-18-6-24l9 8-6-13c2-3 6-3 8 0l7 10-3-12c2-3 6-2 7 1l6 18c3 9-1 17-9 19-5 1-10-2-13-7z" fill="#ffcc80" stroke="#6d3a00" stroke-width="3" stroke-linejoin="round"/><path d="M44 8l3-5M51 13l5-3M39 6l-1-5" stroke="#ffb300" stroke-width="3" stroke-linecap="round"/>`),
    wave: obj(`<path d="M22 56c-9-7-13-17-9-22l8 6-9-17c0-4 5-5 7-2l9 14-9-21c1-4 6-4 8-1l10 20-6-15c1-4 6-4 8-1l8 20 0-9c2-4 7-3 7 1 1 8 0 16-3 22-5 8-18 12-29 5z" fill="#ffcc80" stroke="#6d3a00" stroke-width="3" stroke-linejoin="round"/><path d="M6 12c2-4 5-6 9-6M4 20c1-3 3-5 5-6" stroke="#42a5f5" stroke-width="3" stroke-linecap="round" fill="none"/>`),
    coffee: obj(`<path d="M12 24h34l-3 28c0 4-3 6-7 6H22c-4 0-7-2-7-6z" fill="#fff" stroke="#4e342e" stroke-width="3" stroke-linejoin="round"/><path d="M45 29c8-1 11 4 8 9-2 4-6 5-10 5" fill="none" stroke="#4e342e" stroke-width="3"/><path d="M15 30h28" stroke="#6d4c41" stroke-width="5"/><path d="M22 18c-3-4 3-6 0-11M31 18c-3-4 3-6 0-11M40 18c-3-4 3-6 0-11" stroke="#90a4ae" stroke-width="2.6" stroke-linecap="round" fill="none"/>`),
    pizza: obj(`<path d="M8 14c16-8 32-8 48 0L32 60z" fill="#ffca28" stroke="#8d5a00" stroke-width="3" stroke-linejoin="round"/><path d="M8 14c16-8 32-8 48 0l-3 6c-14-6-28-6-42 0z" fill="#d7a35b" stroke="#8d5a00" stroke-width="3" stroke-linejoin="round"/><circle cx="25" cy="27" r="4" fill="#e53935"/><circle cx="38" cy="30" r="4" fill="#e53935"/><circle cx="32" cy="43" r="3.5" fill="#e53935"/>`),
    cake: obj(`<path d="M10 34h44v20H10z" fill="#f8bbd0" stroke="#6a1b4d" stroke-width="3" stroke-linejoin="round"/><path d="M10 38c4 5 7 5 11 0 4 5 7 5 11 0 4 5 7 5 11 0 4 5 7 5 11 0" fill="#fff" stroke="#6a1b4d" stroke-width="2.4"/><path d="M22 34V22M32 34V20M42 34V22" stroke="#4fc3f7" stroke-width="4"/><path d="M22 18c-2-3 0-5 0-7 1 2 3 4 0 7zM32 16c-2-3 0-5 0-7 1 2 3 4 0 7zM42 18c-2-3 0-5 0-7 1 2 3 4 0 7z" fill="#ff9800"/>`),
    cat: obj(`<path d="M10 8l12 12h20L54 8l2 26c0 14-11 24-24 24S8 48 8 34z" fill="#ffb74d" stroke="#5d3200" stroke-width="3" stroke-linejoin="round"/><path d="M22 31c2-2 4-2 6 0M36 31c2-2 4-2 6 0" stroke="#5d3200" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M29 38h6l-3 3z" fill="#e57373"/><path d="M32 41c-1 3-5 4-7 2M32 41c1 3 5 4 7 2M4 36l14 2M4 44l14-2M60 36l-14 2M60 44l-14-2" stroke="#5d3200" stroke-width="2" stroke-linecap="round" fill="none"/>`),
    dog: obj(`<path d="M16 20c0-6 6-10 16-10s16 4 16 10v18c0 12-7 20-16 20s-16-8-16-20z" fill="#d7ccc8" stroke="#4e342e" stroke-width="3"/><path d="M16 16c-9 0-12 16-6 24 4-2 6-10 6-14zM48 16c9 0 12 16 6 24-4-2-6-10-6-14z" fill="#8d6e63" stroke="#4e342e" stroke-width="3" stroke-linejoin="round"/><circle cx="25" cy="30" r="2.8" fill="#3e2723"/><circle cx="39" cy="30" r="2.8" fill="#3e2723"/><ellipse cx="32" cy="40" rx="5" ry="3.5" fill="#3e2723"/><path d="M32 44v4M27 49c3 3 7 3 10 0" stroke="#3e2723" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M30 52c0 5 4 5 4 0" fill="#ff6f91" stroke="#3e2723" stroke-width="2"/>`),
    ghost: obj(`<path d="M12 58V28C12 15 21 6 32 6s20 9 20 22v30l-6-5-7 5-7-5-7 5-7-5z" fill="#f5f5f5" stroke="#37474f" stroke-width="3" stroke-linejoin="round"/><ellipse cx="25" cy="27" rx="3.5" ry="5" fill="#37474f"/><ellipse cx="39" cy="27" rx="3.5" ry="5" fill="#37474f"/><ellipse cx="32" cy="39" rx="4" ry="5" fill="#37474f"/>`),
    rocket: obj(`<path d="M32 4c11 8 15 22 11 38H21C17 26 21 12 32 4z" fill="#eceff1" stroke="#37474f" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="22" r="5.5" fill="#4fc3f7" stroke="#37474f" stroke-width="3"/><path d="M21 34l-9 10 10 2M43 34l9 10-10 2" fill="#ef5350" stroke="#37474f" stroke-width="3" stroke-linejoin="round"/><path d="M25 44c0 8 3 13 7 17 4-4 7-9 7-17z" fill="#ff9800"/><path d="M29 44c0 5 1 8 3 10 2-2 3-5 3-10z" fill="#ffeb3b"/>`),
    music: obj(`<path d="M24 46V14l26-6v32" fill="none" stroke="#5e35b1" stroke-width="4" stroke-linejoin="round"/><ellipse cx="17" cy="47" rx="8" ry="6.5" fill="#7e57c2" stroke="#311b92" stroke-width="3"/><ellipse cx="43" cy="41" rx="8" ry="6.5" fill="#7e57c2" stroke="#311b92" stroke-width="3"/><path d="M24 20l26-6" stroke="#5e35b1" stroke-width="4"/>`),
    gift: obj(`<path d="M10 26h44v10H10zM14 36h36v22H14z" fill="#ef5350" stroke="#7f0000" stroke-width="3" stroke-linejoin="round"/><path d="M29 26h6v32h-6z" fill="#ffd54f" stroke="#7f0000" stroke-width="2.4"/><path d="M32 26c-6-12-18-10-14-2 2 3 8 3 14 2zM32 26c6-12 18-10 14-2-2 3-8 3-14 2z" fill="#ffd54f" stroke="#7f0000" stroke-width="2.6" stroke-linejoin="round"/>`),
    balloon: obj(`<path d="M32 4c10 0 17 8 17 18 0 11-9 20-17 20S15 33 15 22C15 12 22 4 32 4z" fill="#ec407a" stroke="#6a0036" stroke-width="3"/><path d="M29 42h6l-3 4zM32 46c-4 5 4 8 0 14" fill="none" stroke="#6a0036" stroke-width="2.4"/><path d="M23 14c2-3 5-5 8-5" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6" fill="none"/>`),
    rainbow: obj(`<path d="M4 50a28 28 0 0 1 56 0" fill="none" stroke="#ef5350" stroke-width="6"/><path d="M10 50a22 22 0 0 1 44 0" fill="none" stroke="#ffca28" stroke-width="6"/><path d="M16 50a16 16 0 0 1 32 0" fill="none" stroke="#66bb6a" stroke-width="6"/><path d="M22 50a10 10 0 0 1 20 0" fill="none" stroke="#42a5f5" stroke-width="6"/><path d="M2 52c0-6 9-8 12-3 4-2 8 1 7 5H4c-2 0-2-1-2-2zM43 52c0-6 9-8 12-3 4-2 8 1 7 5H45c-2 0-2-1-2-2z" fill="#fff" stroke="#607d8b" stroke-width="2.4"/>`),
    cloud: obj(`<path d="M16 48c-8 0-12-6-10-12 2-5 7-7 11-5 1-9 9-15 18-13 7 1 11 7 11 12 7-1 13 4 12 11-1 5-5 7-9 7z" fill="#fff" stroke="#546e7a" stroke-width="3" stroke-linejoin="round"/><path d="M24 36c1 3 5 3 6 0M36 36c1 3 5 3 6 0" stroke="#546e7a" stroke-width="2.6" fill="none" stroke-linecap="round"/>`),
    sun: obj(`<circle cx="32" cy="32" r="13" fill="#ffca28" stroke="#e65100" stroke-width="3"/><path d="M32 4v8M32 52v8M4 32h8M52 32h8M12 12l6 6M46 46l6 6M12 52l6-6M46 18l6-6" stroke="#ff9800" stroke-width="4" stroke-linecap="round"/><path d="M26 35c3 3 9 3 12 0" stroke="#e65100" stroke-width="2.6" fill="none" stroke-linecap="round"/>`),
    moon: obj(`<path d="M40 6C26 8 17 21 20 35s17 23 31 20c-4 4-10 6-17 6C19 61 6 48 7 32 8 17 22 5 40 6z" fill="#fff59d" stroke="#827717" stroke-width="3" stroke-linejoin="round"/><circle cx="18" cy="26" r="3" fill="#e6ee9c"/><circle cx="20" cy="44" r="2.4" fill="#e6ee9c"/><path d="M48 12l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#ffca28"/>`),
    flower: obj(`<g fill="#f48fb1" stroke="#880e4f" stroke-width="2.6">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="32" cy="17" rx="8" ry="11" transform="rotate(${a} 32 29)"/>`).join('')}</g><circle cx="32" cy="29" r="7" fill="#ffd54f" stroke="#880e4f" stroke-width="2.6"/><path d="M32 41v20M32 52c-6-6-12-4-14-2 5 3 10 3 14 2" fill="#81c784" stroke="#1b5e20" stroke-width="2.6"/>`),
    check: obj(`<circle cx="32" cy="32" r="27" fill="#66bb6a" stroke="#1b5e20" stroke-width="3"/><path d="M19 33l9 9 18-19" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`),
    cross: obj(`<circle cx="32" cy="32" r="27" fill="#ef5350" stroke="#7f0000" stroke-width="3"/><path d="M22 22l20 20M42 22L22 42" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`),
    hundred: obj(`<text x="32" y="40" text-anchor="middle" font-size="27" font-weight="900" fill="#e53935" font-family="Comic Sans MS,Chalkboard,cursive" font-style="italic">100</text><path d="M10 47c14 3 30 3 44-1M12 52c13 2 27 2 40-1" stroke="#e53935" stroke-width="3" stroke-linecap="round" fill="none"/>`),
    eyes: obj(`<ellipse cx="21" cy="32" rx="12" ry="16" fill="#fff" stroke="#37474f" stroke-width="3"/><ellipse cx="43" cy="32" rx="12" ry="16" fill="#fff" stroke="#37474f" stroke-width="3"/><circle cx="25" cy="34" r="5" fill="#37474f"/><circle cx="47" cy="34" r="5" fill="#37474f"/>`),
    poop: obj(`<path d="M14 54c-8 0-9-10-2-12-4-5 1-11 7-9-2-7 6-12 12-8 1-5 4-8 4-12 7 3 9 10 6 14 6 0 9 6 6 10 7 2 6 12-2 13z" fill="#8d6e63" stroke="#3e2723" stroke-width="3" stroke-linejoin="round"/><circle cx="26" cy="40" r="3" fill="#fff"/><circle cx="38" cy="40" r="3" fill="#fff"/><circle cx="26" cy="40.5" r="1.4" fill="#000"/><circle cx="38" cy="40.5" r="1.4" fill="#000"/><path d="M26 47c4 3 8 3 12 0" stroke="#3e2723" stroke-width="2.4" fill="none" stroke-linecap="round"/>`),
  };
  const ALIAS = { ':)': 'smile', ':-)': 'smile', ':D': 'grin', ':-D': 'grin', xD: 'laugh', XD: 'laugh', ';)': 'wink', ';-)': 'wink', ':(': 'sad', ':-(': 'sad', ":'(": 'cry', '<3': 'heart', '</3': 'broken', ':P': 'tongue', ':p': 'tongue', ':O': 'shock', ':o': 'shock', 'B)': 'cool', '>:(': 'angry', ':|': 'meh', '(y)': 'thumbsup', '(n)': 'thumbsdown', 'O:)': 'angel', '>:)': 'devil', ':*': 'kiss' };
  const emo = (n, cls = 'be') => (EMOJI[n] ? `<span class="${cls}" title=":${n}:">${EMOJI[n]}</span>` : `:${n}:`);
  OS.breezeEmoji = EMOJI;
  function renderText(text) {
    let h = esc(text);
    const aliasRe = new RegExp('(^|\\s)(' + Object.keys(ALIAS).sort((a, b) => b.length - a.length).map((k) => esc(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?=\\s|$)', 'g');
    h = h.replace(aliasRe, (m, pre, k) => pre + `:${ALIAS[Object.keys(ALIAS).find((x) => esc(x) === k)]}:`);
    h = h.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="#" data-url="$1">$1</a>');
    h = h.replace(/:([a-z0-9]+):/g, (m, n) => (EMOJI[n] ? emo(n) : m));
    h = h.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|\s)_(.+?)_(?=\s|$)/g, '$1<i>$2</i>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
    const onlyEmo = !text.replace(new RegExp(':(' + Object.keys(EMOJI).join('|') + '):|' + Object.keys(ALIAS).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g'), '').trim() && (text.match(/:[a-z0-9]+:|\S+/g) || []).length <= 3;
    return { html: h, big: onlyEmo };
  }

  /* ===================== tiny MQTT 3.1.1 client over WebSocket (QoS 0) ===================== */
  const BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/mqtt'];
  const str = (s) => { const b = te.encode(s); return [b.length >> 8, b.length & 255, ...b]; };
  const varint = (n) => { const o = []; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; o.push(d); } while (n > 0); return o; };
  const pkt = (h, body) => new Uint8Array([h, ...varint(body.length), ...body]);
  class Mqtt {
    constructor(url, cid) { this.url = url; this.cid = cid; this.subs = new Set(); this.pid = 1; this.buf = new Uint8Array(0); this.onmessage = null; this.onstate = null; this.closed = false; this.ok = false; }
    connect(timeout = 7000) {
      return new Promise((res, rej) => {
        let ws; try { ws = new WebSocket(this.url, ['mqtt']); } catch (e) { return rej(e); }
        this.ws = ws; ws.binaryType = 'arraybuffer'; const t = setTimeout(() => { try { ws.close(); } catch (e) {} rej(new Error('timeout')); }, timeout);
        ws.onopen = () => ws.send(pkt(0x10, [...str('MQTT'), 4, 0x02, 0, 60, ...str(this.cid)]));
        ws.onmessage = (e) => { const d = new Uint8Array(e.data); const nb = new Uint8Array(this.buf.length + d.length); nb.set(this.buf); nb.set(d, this.buf.length); this.buf = nb; this.parse((type, flags, body) => { if (type === 2) { clearTimeout(t); if (body[1] === 0) { this.ok = true; this.subs.forEach((s) => this._sub(s)); this.ping = setInterval(() => this.send(new Uint8Array([0xc0, 0])), 25000); res(); this.onstate && this.onstate(true); } else rej(new Error('refused ' + body[1])); } else if (type === 3) { const tl = (body[0] << 8) | body[1]; const topic = td.decode(body.slice(2, 2 + tl)); let o = 2 + tl; if ((flags >> 1) & 3) o += 2; this.onmessage && this.onmessage(topic, td.decode(body.slice(o))); } }); };
        ws.onerror = () => {}; ws.onclose = () => { clearTimeout(t); clearInterval(this.ping); const was = this.ok; this.ok = false; if (was) this.onstate && this.onstate(false); if (!was) rej(new Error('closed')); };
      });
    }
    parse(cb) { for (;;) { const b = this.buf; if (b.length < 2) return; let mul = 1, len = 0, i = 1, d; do { if (i >= b.length) return; d = b[i++]; len += (d & 127) * mul; mul *= 128; } while (d & 128); if (b.length < i + len) return; const body = b.slice(i, i + len); const h = b[0]; this.buf = b.slice(i + len); cb(h >> 4, h & 15, body); } }
    send(u8) { if (this.ws && this.ws.readyState === 1) this.ws.send(u8); }
    _sub(topic) { const id = this.pid++ & 0xffff || 1; this.send(pkt(0x82, [id >> 8, id & 255, ...str(topic), 0])); }
    subscribe(topic) { this.subs.add(topic); if (this.ok) this._sub(topic); }
    publish(topic, text) { this.send(pkt(0x30, [...str(topic), ...te.encode(text)])); }
    close() { this.closed = true; clearInterval(this.ping); try { this.send(new Uint8Array([0xe0, 0])); this.ws && this.ws.close(); } catch (e) {} }
  }

  /* ===================== identity & crypto ===================== */
  async function identity() {
    let id = OS.store.get('breeze-id');
    if (!id || !id.priv) { const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']); id = { id: rid(), priv: await crypto.subtle.exportKey('jwk', kp.privateKey), pub: await crypto.subtle.exportKey('jwk', kp.publicKey) }; OS.store.set('breeze-id', id); }
    id.privKey = await crypto.subtle.importKey('jwk', id.priv, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']);
    return id;
  }
  async function roomKeys(secret) {
    const topic = hex(await crypto.subtle.digest('SHA-256', te.encode('cirrus-breeze-topic|' + secret))).slice(0, 32);
    const base = await crypto.subtle.importKey('raw', te.encode(secret), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: te.encode('cirrus-breeze-v1'), iterations: 60000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    return { topic, key };
  }
  const seal = async (key, obj) => { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(JSON.stringify(obj))); return JSON.stringify({ v: 1, iv: b64(iv), ct: b64(ct) }); };
  const open = async (key, text) => { const j = JSON.parse(text); const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(j.iv) }, key, unb64(j.ct)); return JSON.parse(td.decode(pt)); };
  let ipP = null;
  const publicIP = () => (ipP = ipP || (async () => { const c = OS.store.get('breeze-ip'); try { const r = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' }); const j = await r.json(); OS.store.set('breeze-ip', j.ip); return j.ip; } catch (e) { ipP = null; return c || null; } })());

  /* ===================== a chat session for one room ===================== */
  class Session {
    constructor(room, me, ev) { this.room = room; this.me = me; this.ev = ev; this.peers = new Map(); this.seen = new Set(); this.dmKeys = new Map(); this.state = 'connecting'; }
    async start() {
      const secret = this.room.kind === 'net' ? 'net:' + ((await publicIP()) || 'offline-device') : 'room:' + this.room.name.trim().toLowerCase() + ':' + (this.room.pass || '');
      this.netKnown = this.room.kind !== 'net' || !secret.endsWith('offline-device');
      const { topic, key } = await roomKeys(secret); this.topic = 'cirrus-breeze/v1/' + topic; this.key = key;
      this.bc = new BroadcastChannel('cirrus-breeze-' + topic); this.bc.onmessage = (e) => this.recv(e.data.t, e.data.d);
      this.hello(); this.beat = setInterval(() => { this.presence('beat'); this.expire(); }, 15000);
      this.setState('local');
      if (this.netKnown) this.connectRelay(0);
    }
    async connectRelay(attempt) {
      if (this.stopped) return; const list = OS.store.get('breeze-broker') ? [OS.store.get('breeze-broker')] : BROKERS;
      for (let i = 0; i < list.length && !this.stopped; i++) {
        const url = list[(i + (OS.store.get('breeze-broker-i', 0) || 0)) % list.length];
        const m = new Mqtt(url, 'cirrus-' + this.me.id.slice(0, 10) + '-' + rid().slice(0, 4));
        m.subscribe(this.topic + '/all'); m.subscribe(this.topic + '/dm/' + this.me.id);
        m.onmessage = (topic, text) => this.recv(topic.endsWith('/all') ? 'all' : 'dm', text);
        try { await m.connect(); if (this.stopped) return m.close(); this.mqtt = m; this.relay = url; OS.store.set('breeze-broker-i', list.indexOf(url)); this.setState('relay'); this.hello();
          m.onstate = (up) => { if (!up && !this.stopped) { this.mqtt = null; this.setState('local'); setTimeout(() => this.connectRelay(attempt + 1), Math.min(30000, 2000 * (attempt + 1))); } };
          return;
        } catch (e) { m.close(); }
      }
      this.setState('local'); if (!this.stopped) this.retry = setTimeout(() => this.connectRelay(attempt + 1), Math.min(60000, 5000 * (attempt + 1)));
    }
    setState(s) { this.state = s; this.ev('state', s); }
    async post(obj, to) {
      obj.id = obj.id || rid(); obj.from = { id: this.me.id, name: OS.settings.fullname || OS.settings.username, color: OS.settings.avatar, status: OS.store.get('breeze-status', 'online') }; obj.ts = obj.ts || Date.now();
      this.seen.add(obj.id);
      let payload, chan = 'all';
      if (to) { const k = await this.dmKey(to); if (!k) throw new Error('No key for that person yet'); payload = JSON.stringify({ to, from: this.me.id, box: await seal(k, obj) }); chan = 'dm'; }
      else payload = await seal(this.key, obj);
      this.bc && this.bc.postMessage({ t: chan, d: payload });
      if (this.mqtt) this.mqtt.publish(this.topic + (to ? '/dm/' + to : '/all'), payload);
      return obj;
    }
    async dmKey(peerId) {
      if (this.dmKeys.has(peerId)) return this.dmKeys.get(peerId); const p = this.peers.get(peerId); if (!p || !p.pub) return null;
      const pub = await crypto.subtle.importKey('jwk', p.pub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
      const k = await crypto.subtle.deriveKey({ name: 'ECDH', public: pub }, this.me.privKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); this.dmKeys.set(peerId, k); return k;
    }
    presence(kind) { return this.post({ t: 'presence', kind, pub: this.me.pub }).catch(() => {}); }
    hello() { this.presence('hello'); }
    async recv(chan, text) {
      let o;
      try {
        if (chan === 'dm') { const env = JSON.parse(text); if (env.to !== this.me.id) return; if (!this.peers.has(env.from)) return; const k = await this.dmKey(env.from); o = await open(k, env.box); o.dm = env.from; if (o.from.id !== env.from) return; }
        else o = await open(this.key, text);
      } catch (e) { return; }
      if (!o || !o.id || !o.from || typeof o.from.id !== 'string' || o.from.id === this.me.id || this.seen.has(o.id)) return;
      this.seen.add(o.id); if (this.seen.size > 3000) this.seen = new Set([...this.seen].slice(-1500));
      const f = o.from; const name = String(f.name || 'Someone').slice(0, 40), color = /^#[0-9a-f]{6}$/i.test(f.color) ? f.color : '#8a93a6', status = ['online', 'away', 'busy'].includes(f.status) ? f.status : 'online';
      const known = this.peers.get(f.id);
      if (o.t === 'presence' && o.kind === 'bye') { if (known) { this.peers.delete(f.id); this.ev('peers'); this.ev('sys', `${name} left`); } return; }
      this.peers.set(f.id, { id: f.id, name, color, status, seen: Date.now(), pub: (o.t === 'presence' && o.pub && o.pub.kty === 'EC' ? o.pub : known && known.pub) || null });
      if (!known) { this.ev('peers'); if (o.t === 'presence') { this.ev('sys', `${name} joined`); this.presence('here'); } }
      else if (known.status !== status || known.name !== name) this.ev('peers');
      if (o.t === 'msg' && (typeof o.text === 'string' || typeof o.img === 'string')) { const img = typeof o.img === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(o.img) && o.img.length < 400000 ? o.img : null; this.ev('msg', { id: o.id, from: f.id, name, color, text: typeof o.text === 'string' ? o.text.slice(0, 4000) : '', img, ts: Math.min(Date.now(), +o.ts || Date.now()), dm: o.dm || null }); }
      else if (o.t === 'typing') this.ev('typing', { from: f.id, name, dm: o.dm || null });
      else if (o.t === 'nudge') this.ev('nudge', { name, dm: o.dm || null });
    }
    expire() { let ch = false; const now = Date.now(); this.peers.forEach((p, k) => { if (now - p.seen > 50000) { this.peers.delete(k); ch = true; } }); if (ch) this.ev('peers'); }
    stop() { this.stopped = true; clearInterval(this.beat); clearTimeout(this.retry); const bye = this.post({ t: 'presence', kind: 'bye' }).catch(() => {}); setTimeout(() => { this.mqtt && this.mqtt.close(); this.bc && this.bc.close(); }, 300); return bye; }
  }
  OS.breeze = { Mqtt, Session, roomKeys, renderText, BROKERS };

  /* ===================== app ===================== */
  OS.registerApp({
    id: 'breeze', name: 'Breeze Chat', icon: 'chat', color: ['#29b6f6', '#7c4dff'], cat: 'Internet', w: 900, h: 640, single: true, desc: 'Chat with people on your network', keywords: 'chat lan messenger message talk irc network emoji',
    launch(win) {
      const rooms = () => OS.store.get('breeze-rooms', [{ name: 'This network', kind: 'net' }, { name: 'Cirrus Lounge', pass: '' }]);
      let cur = OS.store.get('breeze-cur', 0), sess = null, me = null, view = null /* null = room, else peer id */, unread = {}, typingT = {}, lastTyping = 0;
      win.body.innerHTML = `<div class="bz split" style="position:relative"><aside class="sidebar bz-side"><div class="bz-me"></div><div class="bz-h">Rooms <button class="ibtn sm" data-a="addroom" title="Join or create a room">${gl('plus')}</button></div><div class="bz-rooms"></div><div class="bz-h">People here <span class="bz-count"></span></div><div class="bz-people"></div><div class="bz-foot small muted"></div></aside>
        <main class="bz-main"><header class="bz-top"><button class="ibtn side-toggle" data-a="side">${gl('menu')}</button><div class="bz-title"><b></b><small></small></div><span class="spacer"></span><button class="ibtn" data-a="nudge" title="Send a nudge">${gl('zap')}</button><button class="ibtn" data-a="clear" title="Clear history">${gl('eraser')}</button></header>
        <div class="bz-log scroll"></div><div class="bz-typing"></div>
        <div class="bz-emo" hidden></div>
        <form class="bz-comp"><button type="button" class="ibtn" data-a="emo" title="Emojis">${emo('smile', 'be-btn')}</button><button type="button" class="ibtn" data-a="doodle" title="Draw something">${gl('brush')}</button><textarea rows="1" placeholder="Message…" maxlength="4000"></textarea><button class="bz-send" title="Send">${gl('send')}</button></form></main></div>`;
      const $ = (s) => win.body.querySelector(s), log = $('.bz-log'), ta = $('.bz-comp textarea');
      const histKey = () => 'breeze-hist-' + (sess && sess.topic ? sess.topic.slice(-16) : 'x');
      let hist = [];
      const saveHist = () => OS.store.set(histKey(), hist.slice(-300));
      const fmtT = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !OS.settings.clock24 });
      function renderMe() { const st = OS.store.get('breeze-status', 'online'); $('.bz-me').innerHTML = `<span class="bz-av" style="background:${OS.settings.avatar}">${esc((OS.settings.fullname || OS.settings.username)[0].toUpperCase())}<i class="st ${st}"></i></span><div><b>${esc(OS.settings.fullname)}</b><select class="bz-st">${[['online', 'Online'], ['away', 'Away'], ['busy', 'Busy — no alerts']].map(([v, l]) => `<option value="${v}" ${v === st ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`; $('.bz-st').onchange = (e) => { OS.store.set('breeze-status', e.target.value); renderMe(); sess && sess.presence('beat'); }; }
      function renderRooms() { const rs = rooms(); $('.bz-rooms').innerHTML = rs.map((r, i) => `<button class="side-item ${i === cur && !view ? 'active' : ''}" data-r="${i}">${gl(r.kind === 'net' ? 'wifi' : r.pass ? 'lock' : 'chat')}<span>${esc(r.name)}</span>${unread['r' + i] ? `<em>${unread['r' + i]}</em>` : ''}</button>`).join(''); $('.bz-rooms').querySelectorAll('[data-r]').forEach((b) => { b.onclick = () => { if (+b.dataset.r !== cur) switchRoom(+b.dataset.r); else { view = null; render(); } closeSide(); }; OS.onContext(b, (e, x, y) => { const i = +b.dataset.r; if (rooms()[i].kind === 'net') return; OS.menu(x, y, [{ label: 'Leave room', icon: 'trash', danger: true, action: () => { const rs2 = rooms(); rs2.splice(i, 1); OS.store.set('breeze-rooms', rs2); if (cur >= rs2.length || cur === i) switchRoom(0); else renderRooms(); } }]); }); }); }
      function renderPeople() {
        const ps = sess ? [...sess.peers.values()].sort((a, b) => a.name.localeCompare(b.name)) : [];
        $('.bz-count').textContent = ps.length ? `(${ps.length})` : '';
        $('.bz-people').innerHTML = ps.length ? ps.map((p) => `<button class="side-item ${view === p.id ? 'active' : ''}" data-p="${esc(p.id)}"><span class="bz-av sm" style="background:${p.color}">${esc(p.name[0].toUpperCase())}<i class="st ${p.status}"></i></span><span>${esc(p.name)}</span>${unread[p.id] ? `<em>${unread[p.id]}</em>` : ''}</button>`).join('') : `<div class="small muted pad">Nobody else here yet. Open Breeze on another device on the same network (or another tab) and you’ll see each other.</div>`;
        $('.bz-people').querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => { view = b.dataset.p; unread[view] = 0; render(); closeSide(); }));
      }
      function renderState() {
        const s = sess ? sess.state : 'connecting'; const r = rooms()[cur] || {};
        const txt = s === 'relay' ? `${gl('lock')} Encrypted · connected via relay` : s === 'local' ? (sess && !sess.netKnown ? `${gl('info')} Offline — only tabs on this device` : `${gl('refresh')} Connecting to relay… (this device only for now)`) : `${gl('refresh')} Connecting…`;
        $('.bz-foot').innerHTML = `<span class="bz-conn ${s}">${txt}</span>`;
        const p = view && sess && sess.peers.get(view);
        $('.bz-title b').textContent = view ? (p ? p.name : 'Direct message') : r.name || '';
        $('.bz-title small').innerHTML = view ? (p ? `${gl('lock')} Private, end-to-end encrypted · ${p.status}` : 'This person went offline') : r.kind === 'net' ? `Everyone on your network · ${sess ? sess.peers.size + 1 : 1} online` : `${r.pass ? 'Password-protected room' : 'Open room — anyone who knows the name can join'} · ${sess ? sess.peers.size + 1 : 1} online`;
      }
      function bubble(m, prev) {
        const mine = m.from === 'me', grouped = prev && prev.from === m.from && m.ts - prev.ts < 120000 && !prev.sys;
        if (m.sys) return `<div class="bz-sys">${esc(m.text)} · ${fmtT(m.ts)}</div>`;
        const r = m.text ? renderText(m.text) : { html: '', big: false };
        return `<div class="bz-msg ${mine ? 'me' : ''} ${grouped ? 'grp' : ''}">${!mine ? `<span class="bz-av sm" style="background:${m.color};${grouped ? 'visibility:hidden' : ''}">${esc((m.name || '?')[0].toUpperCase())}</span>` : ''}<div class="bz-b ${r.big ? 'big' : ''}">${!mine && !grouped ? `<div class="bz-n" style="color:${m.color}">${esc(m.name)}</div>` : ''}${m.img ? `<img class="bz-img" src="${m.img}" alt="drawing">` : ''}${r.html ? `<div class="bz-tx">${r.html}</div>` : ''}<time>${fmtT(m.ts)}</time></div></div>`;
      }
      function render() {
        renderRooms(); renderPeople(); renderState();
        const list = hist.filter((m) => (view ? m.dm === view : !m.dm));
        log.innerHTML = list.length ? list.map((m, i) => bubble(m, list[i - 1])).join('') : `<div class="bz-empty">${emo('wave', 'be-big')}<b>${view ? 'Say hi privately!' : 'Say hello to your network!'}</b><p class="muted small">${view ? 'Direct messages are end-to-end encrypted.' : 'Messages are end-to-end encrypted. Only people in this room can read them.'}</p></div>`;
        log.querySelectorAll('[data-url]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); OS.wm.open('browser', { url: a.dataset.url }); }));
        log.querySelectorAll('.bz-img').forEach((im) => (im.onclick = () => { const p = OS.fs.uniqueName(OS.home() + '/Pictures', 'breeze-drawing.png'); OS.fs.write(p, im.src); OS.notify('Drawing saved', OS.fs.pretty(p), { app: 'breeze', onclick: () => OS.desktop.openPath(p) }); }));
        log.scrollTop = log.scrollHeight;
      }
      const add = (m) => { hist.push(m); saveHist(); };
      function onEvent(type, d) {
        if (type === 'state' || type === 'peers') { if (type === 'peers' && view && sess && !sess.peers.has(view)) {} renderPeople(); renderState(); return; }
        if (type === 'sys') { if (!view) { add({ sys: true, text: d, ts: Date.now() }); render(); } return; }
        if (type === 'typing') { const key = d.dm || 'room'; clearTimeout(typingT[key]); const show = (view ? d.dm === view : !d.dm); if (show) { $('.bz-typing').textContent = `${d.name} is typing…`; typingT[key] = setTimeout(() => ($('.bz-typing').textContent = ''), 4000); } return; }
        if (type === 'nudge') { win.el && win.el.classList.add('bz-shake'); setTimeout(() => win.el && win.el.classList.remove('bz-shake'), 700); OS.sound('notify'); add({ sys: true, text: `${d.name} sent you a nudge!`, ts: Date.now(), dm: d.dm || undefined }); render(); return; }
        if (type === 'msg') {
          add({ id: d.id, from: d.from, name: d.name, color: d.color, text: d.text, img: d.img, ts: d.ts, dm: d.dm || undefined });
          $('.bz-typing').textContent = '';
          const visible = OS.wm.active === win && (view ? d.dm === view : !d.dm);
          if (!visible) { const k = d.dm || 'r' + cur; unread[k] = (unread[k] || 0) + 1; }
          if (OS.store.get('breeze-status', 'online') !== 'busy' && (!visible || document.hidden)) { OS.notify(d.dm ? `${d.name} (private)` : `${d.name} · ${rooms()[cur].name}`, d.text ? d.text.replace(/:([a-z0-9]+):/g, '') .slice(0, 120) || '(emoji)' : '🎨 sent a drawing', { app: 'breeze', onclick: () => { OS.wm.open('breeze'); view = d.dm || null; render(); } }); }
          else if (visible) OS.sound('click');
          render();
        }
      }
      async function switchRoom(i) {
        if (sess) sess.stop(); cur = i; OS.store.set('breeze-cur', cur); view = null; unread['r' + i] = 0;
        const r = rooms()[cur] || rooms()[0]; sess = new Session(r, me, onEvent); render();
        await sess.start(); hist = OS.store.get(histKey(), []); render();
      }
      async function send(text, img) {
        if (!sess || (!text.trim() && !img)) return;
        if (view && !sess.peers.has(view)) return OS.alert('Offline', 'This person is not online right now.');
        try { const o = await sess.post({ t: 'msg', text: text.trim(), img: img || undefined }, view || undefined); add({ id: o.id, from: 'me', name: 'me', text: o.text, img: img || null, ts: o.ts, dm: view || undefined }); render(); } catch (e) { OS.alert('Could not send', e.message); }
      }
      // composer
      const fit = () => { ta.style.height = 'auto'; ta.style.height = Math.min(140, ta.scrollHeight) + 'px'; };
      ta.oninput = () => { fit(); if (sess && Date.now() - lastTyping > 3000 && ta.value.trim()) { lastTyping = Date.now(); sess.post({ t: 'typing' }, view || undefined).catch(() => {}); } };
      ta.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey && !OS.isTouch()) { e.preventDefault(); $('.bz-comp').requestSubmit(); } };
      $('.bz-comp').onsubmit = (e) => { e.preventDefault(); const v = ta.value; ta.value = ''; fit(); $('.bz-emo').hidden = true; send(v); if (!OS.isTouch()) ta.focus(); };
      const emoP = $('.bz-emo'); emoP.innerHTML = Object.keys(EMOJI).map((n) => `<button type="button" data-e="${n}" title=":${n}:">${EMOJI[n]}</button>`).join('');
      emoP.querySelectorAll('[data-e]').forEach((b) => (b.onclick = () => { const s = ta.selectionStart ?? ta.value.length; const ins = (s > 0 && !/\s$/.test(ta.value.slice(0, s)) ? ' ' : '') + `:${b.dataset.e}: `; ta.value = ta.value.slice(0, s) + ins + ta.value.slice(ta.selectionEnd ?? s); ta.focus(); ta.selectionStart = ta.selectionEnd = s + ins.length; fit(); }));
      $('[data-a=emo]').onclick = () => (emoP.hidden = !emoP.hidden);
      $('[data-a=doodle]').onclick = () => doodle((url) => send('', url));
      $('[data-a=nudge]').onclick = () => { if (!sess) return; sess.post({ t: 'nudge' }, view || undefined).catch(() => {}); add({ sys: true, text: 'You sent a nudge', ts: Date.now(), dm: view || undefined }); render(); };
      $('[data-a=clear]').onclick = async () => { if (await OS.confirm('Clear history?', 'Removes the messages saved on this device for this room.', 'Clear', true)) { hist = hist.filter((m) => (view ? m.dm !== view : !!m.dm)); saveHist(); render(); } };
      $('[data-a=addroom]').onclick = async () => {
        const r = await OS.dialog({ title: 'Join or create a room', message: 'Anyone who enters the same room name (and password) joins the same chat — on any network.', html: `<input class="inp" data-f="n" placeholder="Room name" maxlength="40" style="width:100%;margin:6px 0"><input class="inp" data-f="p" type="password" placeholder="Password (optional, for private rooms)" style="width:100%">`, buttons: [{ label: 'Cancel', value: null }, { label: 'Join', value: 'ok', primary: true }], read: (d) => ({ name: d.querySelector('[data-f=n]').value.trim().slice(0, 40), pass: d.querySelector('[data-f=p]').value }) });
        if (!r || !r.name) return;
        const rs = rooms(); let i = rs.findIndex((x) => x.kind !== 'net' && x.name.toLowerCase() === r.name.toLowerCase() && (x.pass || '') === r.pass);
        if (i < 0) { rs.push({ name: r.name, pass: r.pass }); OS.store.set('breeze-rooms', rs); i = rs.length - 1; }
        switchRoom(i);
      };
      const closeSide = () => $('.bz-side').classList.remove('open');
      $('[data-a=side]').onclick = () => $('.bz-side').classList.toggle('open');
      log.addEventListener('click', closeSide);
      const unload = () => sess && sess.stop(); window.addEventListener('pagehide', unload);
      win.onClose(() => { window.removeEventListener('pagehide', unload); sess && sess.stop(); });
      win.onFocus = () => { const k = view || 'r' + cur; if (unread[k]) { unread[k] = 0; renderRooms(); renderPeople(); } };
      renderMe();
      identity().then((id) => { me = id; switchRoom(Math.min(cur, rooms().length - 1)); });
    },
  });

  /* ===================== doodle pad ===================== */
  function doodle(done) {
    const ov = OS.el(`<div class="bz-dood-ov"><div class="bz-dood menu-surface pop-anim"><h3>Draw something</h3><canvas width="512" height="512"></canvas><div class="bz-dood-tools">${['#222222', '#ef5350', '#ff9800', '#ffd600', '#43a047', '#1e88e5', '#8e24aa', '#ec407a', '#8d6e63', '#ffffff'].map((c, i) => `<button class="sw ${i === 0 ? 'on' : ''}" data-c="${c}" style="background:${c}"></button>`).join('')}<span class="spacer"></span>${[4, 10, 22].map((s, i) => `<button class="sz ${i === 1 ? 'on' : ''}" data-s="${s}"><i style="width:${s / 1.6 + 3}px;height:${s / 1.6 + 3}px"></i></button>`).join('')}</div><div class="btns"><button class="btn" data-a="undo">Undo</button><button class="btn" data-a="clr">Clear</button><span class="spacer"></span><button class="btn" data-a="x">Cancel</button><button class="btn primary" data-a="ok">Send</button></div></div></div>`);
    document.body.appendChild(ov);
    const cv = ov.querySelector('canvas'), cx = cv.getContext('2d'); let color = '#222222', size = 10, drawing = false, last = null; const undo = [];
    const bg = () => { cx.fillStyle = '#fff'; cx.fillRect(0, 0, 512, 512); }; bg();
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 512, ((e.clientY - r.top) / r.height) * 512]; };
    cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); undo.push(cx.getImageData(0, 0, 512, 512)); if (undo.length > 20) undo.shift(); drawing = true; last = pos(e); cx.beginPath(); cx.fillStyle = color; cx.arc(last[0], last[1], size / 2, 0, 7); cx.fill(); };
    cv.onpointermove = (e) => { if (!drawing) return; const p = pos(e); cx.strokeStyle = color; cx.lineWidth = size; cx.lineCap = cx.lineJoin = 'round'; cx.beginPath(); cx.moveTo(last[0], last[1]); cx.lineTo(p[0], p[1]); cx.stroke(); last = p; };
    cv.onpointerup = cv.onpointercancel = () => (drawing = false);
    ov.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => { color = b.dataset.c; ov.querySelectorAll('[data-c]').forEach((x) => x.classList.toggle('on', x === b)); }));
    ov.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => { size = +b.dataset.s; ov.querySelectorAll('[data-s]').forEach((x) => x.classList.toggle('on', x === b)); }));
    ov.querySelector('[data-a=undo]').onclick = () => { const u = undo.pop(); if (u) cx.putImageData(u, 0, 0); };
    ov.querySelector('[data-a=clr]').onclick = () => { undo.push(cx.getImageData(0, 0, 512, 512)); bg(); };
    ov.querySelector('[data-a=x]').onclick = () => ov.remove();
    ov.querySelector('[data-a=ok]').onclick = () => { const s = document.createElement('canvas'); s.width = s.height = 256; s.getContext('2d').drawImage(cv, 0, 0, 256, 256); let url = s.toDataURL('image/webp', 0.8); if (!url.startsWith('data:image/webp')) url = s.toDataURL('image/png'); ov.remove(); done(url); };
  }
})();
