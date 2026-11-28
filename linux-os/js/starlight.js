/* Cirrus Linux — Starlight planetarium */
(function () {
  'use strict';
  const esc = OS.esc, gl = OS.glyph;
  const D = Math.PI / 180;
  const STARS_RAW = `Sirius 6:45:09 -16:43 -1.46 w|Canopus 6:23:57 -52:41 -0.74 w|Rigil_Kentaurus 14:39:36 -60:50 -0.27 y|Arcturus 14:15:40 +19:11 -0.05 o|Vega 18:36:56 +38:47 0.03 w|Capella 5:16:41 +46:00 0.08 y|Rigel 5:14:32 -8:12 0.13 b|Procyon 7:39:18 +5:14 0.34 w|Achernar 1:37:43 -57:14 0.46 b|Betelgeuse 5:55:10 +7:24 0.5 r|Hadar 14:03:49 -60:22 0.61 b|Altair 19:50:47 +8:52 0.76 w|Acrux 12:26:36 -63:06 0.77 b|Aldebaran 4:35:55 +16:31 0.86 o|Antares 16:29:24 -26:26 0.96 r|Spica 13:25:12 -11:10 0.97 b|Pollux 7:45:19 +28:02 1.14 o|Fomalhaut 22:57:39 -29:37 1.16 w|Deneb 20:41:26 +45:17 1.25 w|Mimosa 12:47:43 -59:41 1.25 b|Regulus 10:08:22 +11:58 1.35 b|Adhara 6:58:38 -28:58 1.5 b|Castor 7:34:36 +31:53 1.58 w|Shaula 17:33:36 -37:06 1.62 b|Gacrux 12:31:10 -57:07 1.63 r|Bellatrix 5:25:08 +6:21 1.64 b|Elnath 5:26:18 +28:36 1.65 b|Miaplacidus 9:13:12 -69:43 1.67 w|Alnilam 5:36:13 -1:12 1.69 b|Alnair 22:08:14 -46:58 1.73 b|Alnitak 5:40:46 -1:57 1.77 b|Alioth 12:54:02 +55:58 1.77 w|Dubhe 11:03:44 +61:45 1.79 o|Mirfak 3:24:19 +49:52 1.79 y|Wezen 7:08:23 -26:24 1.83 y|Sargas 17:37:19 -43:00 1.86 y|Kaus_Australis 18:24:10 -34:23 1.85 b|Avior 8:22:31 -59:31 1.86 o|Alkaid 13:47:32 +49:19 1.86 b|Menkalinan 5:59:32 +44:57 1.9 w|Atria 16:48:40 -69:02 1.91 o|Alhena 6:37:43 +16:24 1.93 w|Peacock 20:25:39 -56:44 1.94 b|Polaris 2:31:49 +89:16 1.98 y|Mirzam 6:22:42 -17:57 1.98 b|Alphard 9:27:35 -8:40 1.98 o|Hamal 2:07:10 +23:28 2.0 o|Algieba 10:19:58 +19:51 2.08 o|Diphda 0:43:35 -17:59 2.04 o|Nunki 18:55:16 -26:18 2.05 b|Menkent 14:06:41 -36:22 2.06 o|Alpheratz 0:08:23 +29:05 2.06 b|Mirach 1:09:44 +35:37 2.05 r|Saiph 5:47:45 -9:40 2.07 b|Kochab 14:50:42 +74:09 2.08 o|Rasalhague 17:34:56 +12:34 2.08 w|Algol 3:08:10 +40:57 2.1 b|Almach 2:03:54 +42:20 2.1 o|Denebola 11:49:04 +14:34 2.14 w|Tiaki 22:42:40 -46:53 2.07 r|Gamma_Velorum 8:09:32 -47:20 1.83 b|Alsephina 8:44:42 -54:43 1.96 w|Naos 8:03:35 -40:00 2.25 b|Gamma_Cas 0:56:42 +60:43 2.2 b|Aspidiske 9:17:05 -59:16 2.25 w|Suhail 9:08:00 -43:26 2.21 o|Alphecca 15:34:41 +26:43 2.23 w|Mizar 13:23:56 +54:56 2.23 w|Sadr 20:22:14 +40:15 2.23 y|Schedar 0:40:30 +56:32 2.24 o|Eltanin 17:56:36 +51:29 2.23 o|Mintaka 5:32:00 -0:18 2.23 b|Caph 0:09:11 +59:09 2.28 w|Dschubba 16:00:20 -22:37 2.29 b|Larawag 16:50:10 -34:18 2.29 o|Merak 11:01:50 +56:23 2.37 w|Izar 14:44:59 +27:04 2.37 o|Enif 21:44:11 +9:53 2.39 o|Kappa_Sco 17:42:29 -39:02 2.39 b|Phecda 11:53:50 +53:42 2.44 w|Megrez 12:15:26 +57:02 3.31 w|Scheat 23:03:46 +28:05 2.42 r|Sabik 17:10:23 -15:43 2.43 w|Alderamin 21:18:35 +62:35 2.45 w|Aludra 7:24:06 -29:18 2.45 b|Markab 23:04:46 +15:12 2.48 b|Algenib 0:13:14 +15:11 2.83 b|Aljanah 20:46:13 +33:58 2.48 o|Menkar 3:02:17 +4:05 2.54 r|Han 16:37:10 -10:34 2.56 b|Zosma 11:14:06 +20:31 2.56 w|Arneb 5:32:44 -17:49 2.58 w|Gienah 12:15:48 -17:33 2.59 b|Ascella 19:02:37 -29:53 2.6 w|Zubeneschamali 15:17:00 -9:23 2.61 b|Acrab 16:05:26 -19:48 2.62 b|Mahasim 5:59:43 +37:13 2.62 w|Unukalhai 15:44:16 +6:26 2.63 o|Sheratan 1:54:38 +20:48 2.64 w|Phact 5:39:39 -34:04 2.65 b|Kraz 12:34:23 -23:24 2.65 y|Muphrid 13:54:41 +18:24 2.68 y|Ruchbah 1:25:49 +60:14 2.68 w|Hassaleh 4:56:60 +33:10 2.69 o|Lesath 17:30:46 -37:18 2.7 b|Kaus_Media 18:20:60 -29:50 2.7 o|Tarazed 19:46:15 +10:37 2.72 o|Porrima 12:41:40 -1:27 2.74 w|Zubenelgenubi 14:50:53 -16:02 2.75 w|Cebalrai 17:43:28 +4:34 2.77 o|Kornephoros 16:30:13 +21:29 2.77 y|Cursa 5:07:51 -5:05 2.79 w|Rastaban 17:30:26 +52:18 2.79 y|Delta_Crucis 12:15:09 -58:45 2.79 b|Kaus_Borealis 18:27:58 -25:25 2.81 o|Tau_Sco 16:35:53 -28:13 2.82 b|Nihal 5:28:15 -20:46 2.84 y|Vindemiatrix 13:02:11 +10:57 2.85 y|Zeta_Persei 3:54:08 +31:53 2.85 b|Deneb_Algedi 21:47:02 -16:08 2.87 w|Delta_Cygni 19:44:58 +45:08 2.87 b|Alcyone 3:47:29 +24:06 2.87 b|Tejat 6:22:58 +22:31 2.88 r|Epsilon_Persei 3:57:51 +40:01 2.89 b|Pi_Sco 15:58:51 -26:07 2.89 b|Gomeisa 7:27:09 +8:17 2.89 b|Sigma_Sco 16:21:11 -25:36 2.9 b|Sadalsuud 21:31:34 -5:34 2.9 y|Cor_Caroli 12:56:02 +38:19 2.9 w|Gamma_Persei 3:04:48 +53:30 2.93 y|Sadalmelik 22:05:47 -0:19 2.95 y|Algorab 12:29:52 -16:31 2.95 w|Ras_Elased 9:45:51 +23:46 2.98 o|Iota_Sco 17:47:35 -40:08 2.99 w|Alnasl 18:05:48 -30:25 2.99 o|Pherkad 15:20:44 +71:50 3.0 w|Mu_Sco 16:51:52 -38:03 3.0 b|Minkar 12:10:07 -22:37 3.0 o|Tianguan 5:37:39 +21:09 3.0 b|Delta_Persei 3:42:55 +47:47 3.01 b|Yed_Prior 16:14:21 -3:42 3.03 r|Seginus 14:32:05 +38:18 3.04 w|Albireo 19:30:43 +27:58 3.05 o|Mebsuta 6:43:56 +25:08 3.06 y|Dabih 20:21:01 -14:47 3.08 y|Phi_Sgr 18:45:39 -26:59 3.17 b|Pi_Her 17:15:03 +36:49 3.16 o|Alfirk 21:28:39 +70:34 3.23 b|Errai 23:39:21 +77:38 3.21 o|Sulafat 18:58:57 +32:41 3.24 b|Tau_Sgr 19:06:56 -27:40 3.32 o|Eta_Sco 17:12:09 -43:14 3.33 w|Chertan 11:14:14 +15:26 3.33 w|Meissa 5:35:08 +9:56 3.33 b|Rasalgethi 17:14:39 +14:23 3.35 r|Segin 1:54:24 +63:40 3.37 b|Heze 13:34:42 -0:36 3.37 w|Adhafera 10:16:41 +23:25 3.43 w|Eta_Leonis 10:07:20 +16:46 3.49 w|Eta_Her 16:42:54 +38:55 3.48 y|Nekkar 15:01:57 +40:23 3.5 y|Sheliak 18:50:05 +33:22 3.52 b|Wasat 7:20:07 +21:59 3.53 w|Ain 4:28:37 +19:11 3.53 o|Zeta_Her 16:41:17 +31:36 2.81 y|Algedi 20:18:03 -12:33 3.57 y|Zavijava 11:50:42 +1:46 3.6 w|Zeta_Sco 16:54:35 -42:22 3.6 o|Thuban 14:04:23 +64:23 3.65 w|Gamma_Tauri 4:19:48 +15:38 3.65 o|Alshain 19:55:19 +6:24 3.71 y|Epsilon_Her 17:00:17 +30:56 3.92 w|Epsilon_UMi 16:45:58 +82:02 4.2 y|Zeta_UMi 15:44:04 +77:48 4.3 w|Yildun 17:32:13 +86:35 4.35 w|Eta_UMi 16:17:30 +75:45 4.95 w|Zeta_Lyrae 18:44:46 +37:36 4.3 w|Delta_Lyrae 18:54:30 +36:54 4.3 r`;
  const COLORS = { b: '#a9c8ff', w: '#f4f6ff', y: '#fff1c4', o: '#ffd39a', r: '#ffab84' };
  const STARS = STARS_RAW.split('|').map((l) => { const [n, ra, dec, mag, c] = l.split(' '); const [h, m, s] = ra.split(':').map(Number); const neg = dec[0] === '-'; const [dd, dm] = dec.replace(/^[+-]/, '').split(':').map(Number); return { name: n.replace(/_/g, ' '), ra: (h + m / 60 + s / 3600) * 15, dec: (neg ? -1 : 1) * (dd + dm / 60), mag: +mag, col: COLORS[c], type: 'Star' }; });
  const byName = Object.fromEntries(STARS.map((s) => [s.name, s]));
  const CONST = {
    Orion: [['Meissa', 'Betelgeuse'], ['Meissa', 'Bellatrix'], ['Betelgeuse', 'Alnitak', 'Saiph'], ['Bellatrix', 'Mintaka', 'Rigel'], ['Mintaka', 'Alnilam', 'Alnitak']],
    'Ursa Major': [['Alkaid', 'Mizar', 'Alioth', 'Megrez', 'Dubhe', 'Merak', 'Phecda', 'Megrez']],
    'Ursa Minor': [['Polaris', 'Yildun', 'Epsilon UMi', 'Zeta UMi', 'Kochab', 'Pherkad', 'Eta UMi', 'Zeta UMi']],
    Cassiopeia: [['Caph', 'Schedar', 'Gamma Cas', 'Ruchbah', 'Segin']],
    Cygnus: [['Deneb', 'Sadr', 'Albireo'], ['Aljanah', 'Sadr', 'Delta Cygni']],
    Lyra: [['Vega', 'Zeta Lyrae', 'Sheliak', 'Sulafat', 'Delta Lyrae', 'Zeta Lyrae']],
    Aquila: [['Tarazed', 'Altair', 'Alshain']],
    Leo: [['Regulus', 'Eta Leonis', 'Algieba', 'Adhafera', 'Ras Elased'], ['Algieba', 'Zosma', 'Denebola', 'Chertan', 'Regulus'], ['Zosma', 'Chertan']],
    Gemini: [['Castor', 'Mebsuta', 'Tejat'], ['Pollux', 'Wasat', 'Alhena'], ['Castor', 'Pollux']],
    Taurus: [['Aldebaran', 'Ain', 'Elnath'], ['Aldebaran', 'Gamma Tauri'], ['Aldebaran', 'Tianguan']],
    'Canis Major': [['Mirzam', 'Sirius', 'Wezen', 'Aludra'], ['Wezen', 'Adhara']],
    'Canis Minor': [['Procyon', 'Gomeisa']],
    Scorpius: [['Acrab', 'Dschubba', 'Pi Sco'], ['Dschubba', 'Sigma Sco', 'Antares', 'Tau Sco', 'Larawag', 'Mu Sco', 'Zeta Sco', 'Eta Sco', 'Sargas', 'Iota Sco', 'Kappa Sco', 'Shaula', 'Lesath']],
    Sagittarius: [['Alnasl', 'Kaus Media', 'Kaus Australis', 'Alnasl'], ['Kaus Media', 'Kaus Borealis', 'Phi Sgr', 'Kaus Media'], ['Phi Sgr', 'Nunki', 'Tau Sgr', 'Ascella', 'Phi Sgr'], ['Ascella', 'Kaus Australis']],
    Crux: [['Acrux', 'Gacrux'], ['Mimosa', 'Delta Crucis']],
    Centaurus: [['Rigil Kentaurus', 'Hadar', 'Menkent']],
    Pegasus: [['Markab', 'Scheat', 'Alpheratz', 'Algenib', 'Markab'], ['Markab', 'Enif']],
    Andromeda: [['Alpheratz', 'Mirach', 'Almach']],
    Perseus: [['Gamma Persei', 'Mirfak', 'Delta Persei', 'Epsilon Persei', 'Zeta Persei'], ['Mirfak', 'Algol']],
    Auriga: [['Capella', 'Menkalinan', 'Mahasim', 'Elnath', 'Hassaleh', 'Capella']],
    'Boötes': [['Arcturus', 'Izar', 'Nekkar', 'Seginus', 'Arcturus'], ['Arcturus', 'Muphrid']],
    Hercules: [['Zeta Her', 'Eta Her', 'Pi Her', 'Epsilon Her', 'Zeta Her'], ['Zeta Her', 'Kornephoros', 'Rasalgethi']],
    Virgo: [['Vindemiatrix', 'Porrima', 'Spica'], ['Porrima', 'Zavijava'], ['Spica', 'Heze']],
    Corvus: [['Gienah', 'Algorab', 'Kraz', 'Minkar', 'Gienah']],
    Ophiuchus: [['Rasalhague', 'Cebalrai'], ['Yed Prior', 'Han', 'Sabik']],
    Libra: [['Zubenelgenubi', 'Zubeneschamali']],
    Capricornus: [['Algedi', 'Dabih', 'Deneb Algedi']],
    Aquarius: [['Sadalmelik', 'Sadalsuud']],
    Lepus: [['Arneb', 'Nihal']],
    Draco: [['Eltanin', 'Rastaban'], ['Thuban', 'Rastaban']],
    Cepheus: [['Alderamin', 'Alfirk', 'Errai']],
    Aries: [['Hamal', 'Sheratan']],
    Grus: [['Alnair', 'Tiaki']],
    Vela: [['Gamma Velorum', 'Alsephina', 'Suhail', 'Gamma Velorum']],
  };
  const DSO = [['Andromeda Galaxy (M31)', 10.68, 41.27, 3.4, 'Galaxy'], ['Orion Nebula (M42)', 83.82, -5.39, 4, 'Nebula'], ['Pleiades (M45)', 56.75, 24.12, 1.6, 'Open cluster'], ['Beehive Cluster (M44)', 130.1, 19.98, 3.7, 'Open cluster'], ['Hercules Cluster (M13)', 250.42, 36.46, 5.8, 'Globular cluster'], ['Large Magellanic Cloud', 80.89, -69.76, 0.9, 'Galaxy'], ['Small Magellanic Cloud', 13.19, -72.83, 2.7, 'Galaxy'], ['Lagoon Nebula (M8)', 270.9, -24.38, 6, 'Nebula'], ['Ring Nebula (M57)', 283.4, 33.03, 8.8, 'Planetary nebula'], ['Whirlpool Galaxy (M51)', 202.47, 47.2, 8.4, 'Galaxy'], ['Omega Centauri', 201.7, -47.48, 3.9, 'Globular cluster'], ['Dumbbell Nebula (M27)', 299.9, 22.72, 7.5, 'Planetary nebula']].map(([name, ra, dec, mag, type]) => ({ name, ra, dec, mag, type }));
  // planets: J2000 elements and rates per century (Standish)
  const EL = {
    Mercury: [0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593, 0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081],
    Venus: [0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255, 0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418],
    Earth: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0, 0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0],
    Mars: [1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891, 0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343],
    Jupiter: [5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909, -0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106],
    Saturn: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448, -0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794],
    Uranus: [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503, -0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589],
    Neptune: [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574, 0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664],
  };
  const PCOL = { Mercury: '#c9b8a6', Venus: '#fff3c2', Mars: '#ff8a5c', Jupiter: '#f5d6a8', Saturn: '#f0d58a', Uranus: '#a8e6f0', Neptune: '#7a9cff' };
  const PMAG = { Mercury: 0, Venus: -4.2, Mars: 0.5, Jupiter: -2.3, Saturn: 0.7, Uranus: 5.7, Neptune: 7.8 };
  function helio(n, T) {
    const e0 = EL[n]; const a = e0[0] + e0[6] * T, e = e0[1] + e0[7] * T, I = (e0[2] + e0[8] * T) * D, L = e0[3] + e0[9] * T, w = e0[4] + e0[10] * T, O = (e0[5] + e0[11] * T) * D;
    let M = ((L - w) % 360 + 540) % 360 - 180; M *= D; let E = M + e * Math.sin(M); for (let i = 0; i < 6; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E); const om = (w * D) - O;
    const co = Math.cos(om), so = Math.sin(om), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(I), sI = Math.sin(I);
    return [(co * cO - so * sO * cI) * xp + (-so * cO - co * sO * cI) * yp, (co * sO + so * cO * cI) * xp + (-so * sO + co * cO * cI) * yp, so * sI * xp + co * sI * yp];
  }
  const eclToEq = (x, y, z, T) => { const ob = (23.43928 - 0.013 * T) * D; return [x, y * Math.cos(ob) - z * Math.sin(ob), y * Math.sin(ob) + z * Math.cos(ob)]; };
  const vecToRaDec = ([x, y, z]) => { const r = Math.hypot(x, y, z); return { ra: ((Math.atan2(y, x) / D) + 360) % 360, dec: Math.asin(z / r) / D, dist: r }; };
  function bodies(jd) {
    const T = (jd - 2451545) / 36525; const earth = helio('Earth', T); const out = [];
    const sunG = [-earth[0], -earth[1], -earth[2]]; const sun = vecToRaDec(eclToEq(...sunG, T)); out.push(Object.assign({ name: 'Sun', type: 'Star', mag: -26.7, col: '#fff6d0', size: 10 }, sun));
    Object.keys(PCOL).forEach((n) => { const p = helio(n, T); const g = [p[0] - earth[0], p[1] - earth[1], p[2] - earth[2]]; out.push(Object.assign({ name: n, type: 'Planet', mag: PMAG[n], col: PCOL[n], size: n === 'Jupiter' || n === 'Saturn' ? 4.2 : n === 'Venus' ? 4.6 : 3.2 }, vecToRaDec(eclToEq(...g, T)))); });
    // Moon (low precision)
    const s = (x) => Math.sin(x * D);
    const lam = 218.32 + 481267.881 * T + 6.29 * s(135 + 477198.87 * T) - 1.27 * s(259.3 - 413335.36 * T) + 0.66 * s(235.7 + 890534.22 * T) + 0.21 * s(269.9 + 954397.74 * T) - 0.19 * s(357.5 + 35999.05 * T) - 0.11 * s(186.5 + 966404.03 * T);
    const bet = 5.13 * s(93.3 + 483202.02 * T) + 0.28 * s(228.2 + 960400.89 * T) - 0.28 * s(318.3 + 6003.15 * T) - 0.17 * s(217.6 - 407332.21 * T);
    const mv = [Math.cos(bet * D) * Math.cos(lam * D), Math.cos(bet * D) * Math.sin(lam * D), Math.sin(bet * D)];
    const sunLon = Math.atan2(sunG[1], sunG[0]) / D; const elong = Math.acos(Math.cos(bet * D) * Math.cos((lam - sunLon) * D)) / D;
    const phaseK = (1 - Math.cos(elong * D)) / 2; const waxing = ((lam - sunLon) % 360 + 360) % 360 < 180;
    out.push(Object.assign({ name: 'Moon', type: 'Moon', mag: -12.7, col: '#f2f2e8', size: 9, phase: phaseK, waxing, elong, dist: 0.00257 }, vecToRaDec(eclToEq(...mv, T)), { dist: 0.00257 }));
    return out;
  }
  const jdOf = (ms) => ms / 86400000 + 2440587.5;
  const PHASE_NAMES = (k, wax) => (k < 0.03 ? 'New Moon' : k > 0.97 ? 'Full Moon' : k < 0.47 ? (wax ? 'Waxing Crescent' : 'Waning Crescent') : k < 0.53 ? (wax ? 'First Quarter' : 'Last Quarter') : wax ? 'Waxing Gibbous' : 'Waning Gibbous');
  const CITIES = [['Stockholm', 59.33, 18.07], ['London', 51.51, -0.13], ['New York', 40.71, -74.01], ['Los Angeles', 34.05, -118.24], ['Reykjavík', 64.15, -21.94], ['Tokyo', 35.68, 139.69], ['Sydney', -33.87, 151.21], ['Cape Town', -33.92, 18.42], ['Rio de Janeiro', -22.91, -43.17], ['Mumbai', 19.08, 72.88], ['Singapore', 1.35, 103.82], ['Nairobi', -1.29, 36.82], ['Santiago', -33.45, -70.67], ['North Pole', 90, 0], ['Equator (0°, 0°)', 0, 0]];

  OS.registerApp({
    id: 'starlight', name: 'Starlight', icon: 'star', color: ['#1d2b64', '#6c4bd6'], cat: 'Education', w: 1000, h: 680, desc: 'Planetarium', keywords: 'stars planets astronomy sky planetarium stellarium night moon constellations telescope',
    launch(win) {
      const saved = OS.store.get('sl-state', {});
      const wx = OS.store.get('wx-loc');
      let loc = saved.loc || (wx ? { name: wx.name, lat: wx.lat, lon: wx.lon } : { name: 'Stockholm', lat: 59.33, lon: 18.07 });
      let az = saved.az ?? 180, alt = saved.alt ?? 25, fov = saved.fov ?? 90, simT = Date.now(), speed = 1, sel = null, ar = false;
      const L = Object.assign({ lines: true, cnames: true, snames: true, planets: true, dso: true, milky: true, grid: false, atmo: true, ground: true, meteors: true, eqgrid: false }, saved.layers || {});
      win.body.innerHTML = `<div class="sky-wrap"><canvas class="sky"></canvas>
        <div class="sky-top"><form class="sky-search">${gl('search')}<input placeholder="Find star, planet…" spellcheck="false" autocomplete="off"></form><button class="ibtn sky-b" data-a="layers" title="Layers">${gl('sliders')}</button><button class="ibtn sky-b" data-a="loc" title="Location">${gl('location')}</button><button class="ibtn sky-b" data-a="ar" title="Point your phone at the sky">${gl('eye')}</button></div>
        <div class="sky-bottom"><button class="sky-time" data-a="time"></button><div class="sky-speed"><button class="ibtn sky-b" data-s="-3600" title="Rewind fast">${gl('prev')}</button><button class="ibtn sky-b" data-s="-1" title="Reverse">${gl('left')}</button><button class="ibtn sky-b" data-s="0" title="Pause">${gl('pause')}</button><button class="ibtn sky-b" data-s="1" title="Real time">${gl('play')}</button><button class="ibtn sky-b" data-s="60" title="1 min/s">${gl('right')}</button><button class="ibtn sky-b" data-s="3600" title="1 hour/s">${gl('next')}</button><button class="btn sm sky-now" data-a="now">Now</button></div></div>
        <div class="sky-info" hidden></div><div class="sky-dir"></div></div>`;
      const $ = (s) => win.body.querySelector(s), cv = $('.sky'), g = cv.getContext('2d'), info = $('.sky-info');
      let W = 0, H = 0, dpr = 1, raf = 0, last = performance.now(), projected = [], meteors = [];
      const save = () => OS.store.set('sl-state', { loc, az, alt, fov, layers: L });
      const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; };
      // coordinate transforms
      let lst = 0;
      const toHor = (ra, dec) => { const H0 = (lst - ra) * D, d = dec * D, p = loc.lat * D; const sa = Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H0); const a = Math.asin(OS.clamp(sa, -1, 1)); const zz = Math.atan2(-Math.sin(H0) * Math.cos(d), Math.cos(p) * Math.sin(d) - Math.sin(p) * Math.cos(d) * Math.cos(H0)); return { alt: a / D, az: ((zz / D) + 360) % 360 }; };
      let cam = null;
      const setCam = () => { const z0 = az * D, a0 = alt * D; cam = { f: [Math.cos(a0) * Math.sin(z0), Math.cos(a0) * Math.cos(z0), Math.sin(a0)], r: [Math.cos(z0), -Math.sin(z0), 0], u: [-Math.sin(a0) * Math.sin(z0), -Math.sin(a0) * Math.cos(z0), Math.cos(a0)], k: Math.min(W, H) / 2 / Math.tan(fov * D / 4) }; };
      const proj = (hAlt, hAz) => { const a = hAlt * D, z = hAz * D; const v = [Math.cos(a) * Math.sin(z), Math.cos(a) * Math.cos(z), Math.sin(a)]; const X = v[0] * cam.r[0] + v[1] * cam.r[1], Y = v[0] * cam.u[0] + v[1] * cam.u[1] + v[2] * cam.u[2], Z = v[0] * cam.f[0] + v[1] * cam.f[1] + v[2] * cam.f[2]; if (Z < -0.6) return null; const s = cam.k / (1 + Z); return [W / 2 + X * s, H / 2 - Y * s]; };
      const unproj = (sx, sy) => { const X = (sx - W / 2) / cam.k, Y = -(sy - H / 2) / cam.k; const r2 = X * X + Y * Y; const Z = (1 - r2) / (1 + r2); const s = 1 + Z; const x = X * s, y = Y * s; const v = [x * cam.r[0] + y * cam.u[0] + Z * cam.f[0], x * cam.r[1] + y * cam.u[1] + Z * cam.f[1], y * cam.u[2] + Z * cam.f[2]]; return { alt: Math.asin(OS.clamp(v[2], -1, 1)) / D, az: ((Math.atan2(v[0], v[1]) / D) + 360) % 360 }; };
      const magR = (m) => Math.max(0.55, (3.6 - m * 0.62)) * Math.max(0.8, Math.min(2.2, 60 / fov) ** 0.35);
      function draw() {
        const jd = jdOf(simT); lst = ((280.46061837 + 360.98564736629 * (jd - 2451545) + loc.lon) % 360 + 360) % 360;
        setCam(); projected = [];
        const bod = bodies(jd); const sun = bod[0]; const sunH = toHor(sun.ra, sun.dec);
        const night = L.atmo ? OS.clamp((-sunH.alt - 0) / 14, 0, 1) : 1; // 1 = full night
        // sky gradient
        const day = 1 - night; const zen = mix([6, 8, 20], [52, 120, 210], day), hor = mix([18, 24, 52], [160, 205, 240], day);
        const tw = sunH.alt > -14 && sunH.alt < 4 && L.atmo ? 1 - Math.abs(sunH.alt + 5) / 9 : 0;
        const hp = proj(0, az) || [W / 2, H]; const gr = g.createLinearGradient(0, 0, 0, Math.max(H * 0.3, hp[1]));
        gr.addColorStop(0, `rgb(${zen})`); gr.addColorStop(1, tw > 0 ? `rgb(${mix(hor, [255, 140, 90], tw * 0.7 * (Math.cos((az - sunH.az) * D) * 0.5 + 0.5))})` : `rgb(${hor})`);
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = gr; g.fillRect(0, 0, W, H);
        const starAlpha = L.atmo ? OS.clamp(night * 1.15, 0, 1) : 1;
        // milky way
        if (L.milky && starAlpha > 0.05) {
          g.globalCompositeOperation = 'lighter';
          for (let l = 0; l < 360; l += 2.5) for (let b = -12; b <= 12; b += 4) {
            const ll = l * D, bb = b * D, l0 = 33 * D, dG = 27.4 * D;
            const sd = Math.cos(bb) * Math.cos(dG) * Math.sin(ll - l0) + Math.sin(bb) * Math.sin(dG); const dec = Math.asin(sd) / D;
            const ra = ((Math.atan2(Math.cos(bb) * Math.cos(ll - l0), Math.sin(bb) * Math.cos(dG) - Math.cos(bb) * Math.sin(dG) * Math.sin(ll - l0)) / D + 192.25) + 360) % 360;
            const h = toHor(ra, dec); if (h.alt < -5 && L.ground) continue; const p = proj(h.alt, h.az); if (!p) continue;
            const core = 1 + 1.2 * Math.exp(-(((l + 180) % 360 - 180) ** 2) / 1800); const rr = cam.k * 0.06 * core;
            const rg = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], rr); const a = 0.05 * starAlpha * core * (1 - Math.abs(b) / 14);
            rg.addColorStop(0, `rgba(190,200,255,${a})`); rg.addColorStop(1, 'rgba(190,200,255,0)'); g.fillStyle = rg; g.fillRect(p[0] - rr, p[1] - rr, rr * 2, rr * 2);
          }
          g.globalCompositeOperation = 'source-over';
        }
        // grid
        if (L.grid) { g.strokeStyle = 'rgba(120,200,140,.25)'; g.lineWidth = 1; for (let a = -60; a <= 80; a += 20) poly(Array.from({ length: 73 }, (_, i) => proj(a, i * 5))); for (let z = 0; z < 360; z += 30) poly(Array.from({ length: 19 }, (_, i) => proj(-90 + i * 10, z))); }
        if (L.eqgrid) { g.strokeStyle = 'rgba(120,160,255,.25)'; for (let d = -60; d <= 80; d += 20) poly(Array.from({ length: 73 }, (_, i) => { const h = toHor(i * 5, d); return proj(h.alt, h.az); })); for (let r = 0; r < 360; r += 30) poly(Array.from({ length: 19 }, (_, i) => { const h = toHor(r, -90 + i * 10); return proj(h.alt, h.az); })); }
        // constellation lines
        const starsH = STARS.map((s) => { const h = toHor(s.ra, s.dec); return Object.assign({}, s, h, { p: proj(h.alt, h.az) }); }); const SH = Object.fromEntries(starsH.map((s) => [s.name, s]));
        if (L.lines && starAlpha > 0.05) { g.strokeStyle = `rgba(110,150,255,${0.45 * starAlpha})`; g.lineWidth = 1.2; Object.values(CONST).forEach((chains) => chains.forEach((c) => { g.beginPath(); let pen = false; c.forEach((n) => { const s = SH[n]; if (!s || !s.p || (L.ground && s.alt < -2)) { pen = false; return; } pen ? g.lineTo(...s.p) : g.moveTo(...s.p); pen = true; }); g.stroke(); })); }
        if (L.cnames && starAlpha > 0.05) { g.fillStyle = `rgba(140,170,255,${0.7 * starAlpha})`; g.font = `${fov < 60 ? 14 : 12}px Inter, system-ui`; g.textAlign = 'center'; Object.entries(CONST).forEach(([n, chains]) => { const pts = [...new Set(chains.flat())].map((x) => SH[x]).filter((s) => s && s.p && (!L.ground || s.alt > 0)); if (pts.length < 2) return; const cx = pts.reduce((a, s) => a + s.p[0], 0) / pts.length, cy = pts.reduce((a, s) => a + s.p[1], 0) / pts.length; g.fillText(n.toUpperCase(), cx, cy + 18); }); }
        // DSO
        if (L.dso && starAlpha > 0.1) DSO.forEach((o) => { const h = toHor(o.ra, o.dec); if (L.ground && h.alt < 0) return; const p = proj(h.alt, h.az); if (!p) return; const r = Math.max(3, cam.k * (o.type === 'Galaxy' && o.mag < 3 ? 0.03 : 0.008)); g.strokeStyle = `rgba(255,180,220,${0.7 * starAlpha})`; g.beginPath(); g.ellipse(p[0], p[1], r * 1.6, r, 0.5, 0, 7); g.stroke(); projected.push({ o: Object.assign({}, o, h), p, r: Math.max(10, r * 1.6) }); if (fov < 100) { g.fillStyle = `rgba(255,180,220,${0.75 * starAlpha})`; g.font = '11px Inter, system-ui'; g.textAlign = 'left'; g.fillText(o.name.replace(/ \(.*/, ''), p[0] + r * 1.6 + 3, p[1] + 3); } });
        // stars
        const limit = 2.6 + (180 - fov) / 30;
        starsH.forEach((s) => { if (!s.p || (L.ground && s.alt < -1)) return; let a = starAlpha; if (L.atmo && s.alt < 10) a *= 0.6 + s.alt / 25; if (a <= 0.02) return; const r = magR(s.mag); const [x, y] = s.p; if (x < -10 || y < -10 || x > W + 10 || y > H + 10) return;
          if (s.mag < 1.5) { const rg = g.createRadialGradient(x, y, 0, x, y, r * 4); rg.addColorStop(0, hexA(s.col, 0.35 * a)); rg.addColorStop(1, hexA(s.col, 0)); g.fillStyle = rg; g.fillRect(x - r * 4, y - r * 4, r * 8, r * 8); }
          g.fillStyle = hexA(s.col, a); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); projected.push({ o: s, p: s.p, r: Math.max(12, r * 3) });
          if (L.snames && (s.mag < limit - 1.4) && a > 0.3) { g.fillStyle = `rgba(230,236,255,${0.75 * a})`; g.font = '11.5px Inter, system-ui'; g.textAlign = 'left'; g.fillText(s.name, x + r + 4, y - r - 2); } });
        // planets, moon, sun
        bod.forEach((b) => {
          const h = toHor(b.ra, b.dec); if (L.ground && h.alt < -1) return; const p = proj(h.alt, h.az); if (!p) return; const [x, y] = p;
          if (b.type === 'Planet' && !L.planets) return;
          const angSize = b.name === 'Sun' || b.name === 'Moon' ? 0.53 : 0; let r = angSize ? Math.max(b.size, cam.k * Math.tan(angSize * D / 4) * 2) : b.size * Math.max(1, 40 / fov) ** 0.3;
          if (b.name === 'Sun') { const rg = g.createRadialGradient(x, y, r * 0.5, x, y, r * 6); rg.addColorStop(0, 'rgba(255,240,190,.9)'); rg.addColorStop(1, 'rgba(255,220,150,0)'); g.fillStyle = rg; g.fillRect(x - r * 6, y - r * 6, r * 12, r * 12); g.fillStyle = '#fff8e0'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
          else if (b.name === 'Moon') drawMoon(x, y, r, b, bod[0]);
          else { const a = Math.max(starAlpha, b.mag < -1 ? 0.9 : starAlpha); if (a < 0.05) return; g.fillStyle = hexA(b.col, a); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); if (b.name === 'Saturn') { g.strokeStyle = hexA(b.col, a * 0.8); g.lineWidth = 1.3; g.beginPath(); g.ellipse(x, y, r * 2.1, r * 0.7, -0.4, 0, 7); g.stroke(); } }
          if (b.type !== 'Star' || b.name === 'Sun') { g.fillStyle = b.name === 'Sun' ? '#ffe9a8' : b.name === 'Moon' ? '#eee' : '#ffd88a'; g.font = '600 12px Inter, system-ui'; g.textAlign = 'left'; g.fillText(b.name, x + r + 5, y + 4); }
          projected.push({ o: Object.assign({}, b, h), p, r: Math.max(14, r + 6), prio: 1 });
        });
        // meteors
        if (L.meteors && night > 0.7) { if (Math.random() < 0.004 * Math.max(1, Math.abs(speed) > 1 ? 1 : 1)) meteors.push({ x: Math.random() * W, y: Math.random() * H * 0.5, vx: (Math.random() - 0.5) * 14, vy: 4 + Math.random() * 6, life: 1 }); meteors = meteors.filter((m) => { m.x += m.vx; m.y += m.vy; m.life -= 0.04; const gr2 = g.createLinearGradient(m.x, m.y, m.x - m.vx * 6, m.y - m.vy * 6); gr2.addColorStop(0, `rgba(255,255,255,${m.life})`); gr2.addColorStop(1, 'rgba(255,255,255,0)'); g.strokeStyle = gr2; g.lineWidth = 2; g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(m.x - m.vx * 6, m.y - m.vy * 6); g.stroke(); return m.life > 0; }); }
        // ground
        if (L.ground) {
          const pts = []; for (let i = -180; i <= 180; i += 3) { const p = proj(0, az + i); if (p) pts.push(p); }
          if (pts.length > 1) { const gg = g.createLinearGradient(0, Math.min(...pts.map((p) => p[1])), 0, H); const gc = mix([14, 22, 16], [58, 92, 52], day); gg.addColorStop(0, `rgb(${gc})`); gg.addColorStop(1, `rgb(${mix(gc, [0, 0, 0], 0.5)})`); g.fillStyle = gg; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); pts.forEach((p, i) => { const hill = Math.sin(i * 0.7) * 3 + Math.sin(i * 0.23) * 6; g.lineTo(p[0], p[1] - Math.max(0, hill) * (cam.k / 400)); }); g.lineTo(W + 50, H + 50); g.lineTo(-50, H + 50); g.closePath(); g.fill(); }
          if (alt < -5) { g.fillStyle = `rgb(${mix([14, 22, 16], [58, 92, 52], day)})`; g.fillRect(0, 0, W, H); }
          g.font = '700 15px Inter, system-ui'; g.textAlign = 'center'; [['N', 0], ['NE', 45], ['E', 90], ['SE', 135], ['S', 180], ['SW', 225], ['W', 270], ['NW', 315]].forEach(([n, a]) => { const p = proj(0, a); if (p && p[0] > 0 && p[0] < W) { g.fillStyle = n.length === 1 ? '#ff7a59' : 'rgba(255,170,140,.7)'; g.fillText(n, p[0], p[1] + 20); } });
        }
        // selection ring
        if (sel) { const h = sel.ra != null ? toHor(sel.ra, sel.dec) : null; const p = h && proj(h.alt, h.az); if (p) { g.strokeStyle = '#7ee787'; g.lineWidth = 2; g.beginPath(); g.arc(p[0], p[1], 14, 0, 7); g.stroke(); } if (h) updInfo(Object.assign({}, sel, h, sel.type === 'Moon' || sel.type === 'Planet' || sel.name === 'Sun' ? bod.find((b) => b.name === sel.name) : {})); }
        // HUD
        const d = new Date(simT); $('.sky-time').innerHTML = `<b>${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: speed === 1 ? undefined : '2-digit', hour12: !OS.settings.clock24 })}</b><span>${d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · ${esc(loc.name)}</span>`;
        $('.sky-dir').textContent = `Az ${az.toFixed(0)}° · Alt ${alt.toFixed(0)}° · FOV ${fov.toFixed(0)}°${speed !== 1 ? ` · ${speed === 0 ? 'paused' : (speed > 0 ? '' : '−') + fmtSpeed(Math.abs(speed))}` : ''}`;
      }
      const fmtSpeed = (s) => (s >= 3600 ? s / 3600 + ' h/s' : s >= 60 ? s / 60 + ' min/s' : s + '×');
      function poly(pts) { g.beginPath(); let pen = false; pts.forEach((p) => { if (!p) { pen = false; return; } pen ? g.lineTo(...p) : g.moveTo(...p); pen = true; }); g.stroke(); }
      function mix(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
      function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
      function drawMoon(x, y, r, m, sun) {
        const hs = toHor(sun.ra, sun.dec), hm = toHor(m.ra, m.dec); const ps = proj(hs.alt, hs.az); let ang;
        if (ps) ang = Math.atan2(ps[1] - y, ps[0] - x); else { const p2 = proj(hm.alt + (hs.alt - hm.alt) * 0.05, hm.az + (((hs.az - hm.az + 540) % 360) - 180) * 0.05); ang = p2 ? Math.atan2(p2[1] - y, p2[0] - x) : 0; }
        g.save(); g.translate(x, y); g.rotate(ang);
        const rg = g.createRadialGradient(0, 0, r, 0, 0, r * 3); rg.addColorStop(0, 'rgba(240,240,220,.25)'); rg.addColorStop(1, 'rgba(240,240,220,0)'); g.fillStyle = rg; g.fillRect(-r * 3, -r * 3, r * 6, r * 6);
        g.fillStyle = '#2c2f38'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
        const k = m.phase; g.fillStyle = '#f2f1e6'; g.beginPath(); g.arc(0, 0, r, -Math.PI / 2, Math.PI / 2); // lit half toward the sun (+x)
        const ex = r * Math.abs(1 - 2 * k); g.ellipse(0, 0, ex, r, 0, Math.PI / 2, -Math.PI / 2, k < 0.5); g.fill();
        g.fillStyle = 'rgba(0,0,0,.08)'; [[-0.3, -0.2, 0.22], [0.25, 0.3, 0.16], [0.1, -0.45, 0.12]].forEach(([a, b, c]) => { g.beginPath(); g.arc(a * r, b * r, c * r, 0, 7); g.fill(); });
        g.restore();
      }
      function updInfo(o) {
        info.hidden = false; const raH = o.ra / 15; const fmtRA = `${Math.floor(raH)}h ${String(Math.floor(raH % 1 * 60)).padStart(2, '0')}m`; const fmtDec = `${o.dec >= 0 ? '+' : '−'}${Math.abs(o.dec).toFixed(1)}°`;
        const extra = o.type === 'Moon' ? `<div>${PHASE_NAMES(o.phase, o.waxing)} · ${Math.round(o.phase * 100)}% lit</div>` : o.type === 'Planet' ? `<div>Distance ${o.dist.toFixed(2)} AU (${(o.dist * 8.317).toFixed(1)} light-min)</div>` : o.name === 'Sun' ? `<div>Distance ${o.dist ? o.dist.toFixed(4) : '1.0'} AU</div>` : '';
        const vis = o.alt > 0 ? `<span style="color:#7ee787">Above horizon</span>` : `<span style="color:#ff8a8a">Below horizon</span>`;
        info.innerHTML = `<div class="row"><b style="flex:1;font-size:16px">${esc(o.name)}</b><button class="ibtn" data-i="center" title="Center">${gl('location')}</button><button class="ibtn" data-i="x">${gl('x')}</button></div><div class="muted small">${esc(o.type)}${o.mag != null ? ` · magnitude ${o.mag}` : ''}</div>${extra}<div class="small">Alt ${o.alt.toFixed(1)}° · Az ${o.az.toFixed(1)}° · ${vis}</div><div class="small muted">RA ${fmtRA} · Dec ${fmtDec}</div>`;
        info.querySelector('[data-i=x]').onclick = () => { sel = null; info.hidden = true; };
        info.querySelector('[data-i=center]').onclick = () => { const h = toHor(sel.ra, sel.dec); animateTo(h.az, h.alt, Math.min(fov, 60)); };
      }
      let anim = null; const animateTo = (taz, talt, tfov) => { const s = { az, alt, fov }, t0 = performance.now(); const daz = ((taz - az + 540) % 360) - 180; anim = (t) => { const k = Math.min(1, (t - t0) / 700), e = 1 - (1 - k) ** 3; az = (s.az + daz * e + 360) % 360; alt = s.alt + (talt - s.alt) * e; fov = s.fov + (tfov - s.fov) * e; if (k >= 1) anim = null; }; };
      function frame(t) { raf = requestAnimationFrame(frame); const dt = Math.min(200, t - last); last = t; simT += dt * speed; if (anim) anim(t); if (W !== cv.clientWidth || H !== cv.clientHeight) size(); draw(); }
      // input
      const ptrs = new Map(); let pinch = null, downAt = null, moved = false;
      cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); downAt = [e.clientX, e.clientY]; moved = false; anim = null; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), f: fov }; } });
      cv.addEventListener('pointermove', (e) => { if (!ptrs.has(e.pointerId)) return; const prev = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
        if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; fov = OS.clamp(pinch.f * pinch.d / Math.hypot(a[0] - b[0], a[1] - b[1]), 4, 200); moved = true; return; }
        if (Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) moved = true; if (ar) return;
        const k = fov / Math.min(W, H) * 1.0; az = (az - (e.clientX - prev[0]) * k + 360) % 360; alt = OS.clamp(alt + (e.clientY - prev[1]) * k, -89.9, 89.9); });
      const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!moved && downAt && ptrs.size === 0) pick(e); if (ptrs.size === 0) { downAt = null; save(); } };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      cv.addEventListener('wheel', (e) => { e.preventDefault(); fov = OS.clamp(fov * (e.deltaY > 0 ? 1.12 : 0.89), 4, 200); save(); }, { passive: false });
      function pick(e) { const r = cv.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top; let best = null, bd = 1e9; projected.forEach((it) => { const d = Math.hypot(it.p[0] - x, it.p[1] - y) - (it.prio ? 6 : 0); if (d < it.r && d < bd) { bd = d; best = it.o; } }); if (best) { sel = best; OS.sound('click'); } else { sel = null; info.hidden = true; } }
      OS.wm.keys(win, (e) => { if (e.target.tagName === 'INPUT') return; const st = fov / 20; if (e.key === 'ArrowLeft') az = (az - st + 360) % 360; else if (e.key === 'ArrowRight') az = (az + st) % 360; else if (e.key === 'ArrowUp') alt = Math.min(89.9, alt + st); else if (e.key === 'ArrowDown') alt = Math.max(-89.9, alt - st); else if (e.key === '+' || e.key === '=') fov = Math.max(4, fov * 0.85); else if (e.key === '-') fov = Math.min(200, fov * 1.18); else if (e.key === ' ') { e.preventDefault(); speed = speed ? 0 : 1; } else if (e.key === 'c') L.lines = !L.lines; else if (e.key === 'a') L.atmo = !L.atmo; else if (e.key === 'g') L.ground = !L.ground; else return; e.preventDefault(); save(); });
      // search
      const allObjects = () => [...STARS, ...DSO, ...bodies(jdOf(simT)), ...Object.keys(CONST).map((n) => { const pts = [...new Set(CONST[n].flat())].map((x) => byName[x]).filter(Boolean); return { name: n, type: 'Constellation', ra: pts[0].ra, dec: pts.reduce((a, s) => a + s.dec, 0) / pts.length }; })];
      $('.sky-search').onsubmit = (e) => { e.preventDefault(); const q = $('.sky-search input').value.trim().toLowerCase(); if (!q) return; const o = allObjects().find((x) => x.name.toLowerCase() === q) || allObjects().find((x) => x.name.toLowerCase().startsWith(q)) || allObjects().find((x) => x.name.toLowerCase().includes(q)); if (!o) { OS.notify('Not found', `No object named “${q}”`, { app: 'starlight' }); return; } sel = o; const h = toHor(o.ra, o.dec); animateTo(h.az, h.alt, o.type === 'Constellation' ? 70 : Math.min(fov, 50)); $('.sky-search input').blur(); if (h.alt < 0) OS.notify(o.name, 'is below the horizon right now. Turn off the ground layer to see it.', { app: 'starlight' }); };
      $('.sky-search input').addEventListener('input', (e) => { const dl = win.body.querySelector('datalist') || win.body.appendChild(OS.el('<datalist id="sky-dl-' + win.id + '"></datalist>')); e.target.setAttribute('list', dl.id); const q = e.target.value.toLowerCase(); dl.innerHTML = q ? allObjects().filter((x) => x.name.toLowerCase().includes(q)).slice(0, 8).map((x) => `<option value="${esc(x.name)}">`).join('') : ''; });
      // controls
      win.body.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => { speed = +b.dataset.s; win.body.querySelectorAll('[data-s]').forEach((x) => x.classList.toggle('on', x === b)); }));
      $('[data-a=now]').onclick = () => { simT = Date.now(); speed = 1; win.body.querySelectorAll('[data-s]').forEach((x) => x.classList.toggle('on', x.dataset.s === '1')); };
      $('[data-a=time]').onclick = () => { const d = new Date(simT); const pad = (n) => String(n).padStart(2, '0'); const v = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; const p = OS.dialog({ title: 'Date & time', html: `<input class="inp" type="datetime-local" value="${v}" data-f="dt"><div class="row" style="flex-wrap:wrap;gap:6px">${[['−1 day', -864e5], ['−1 h', -36e5], ['+1 h', 36e5], ['+1 day', 864e5], ['+1 month', 2592e6], ['+1 year', 31557600000]].map(([l, ms]) => `<button class="btn sm" data-ms="${ms}">${l}</button>`).join('')}</div>`, buttons: [{ label: 'Cancel', value: null }, { label: 'Set', value: 'ok', primary: true }] }); const dl = OS._dlg.el; const inp = dl.querySelector('[data-f=dt]'); dl.querySelectorAll('[data-ms]').forEach((b) => (b.onclick = () => { simT += +b.dataset.ms; OS._dlg.done(null); })); p.then((r) => { if (r === 'ok' && inp.value) simT = new Date(inp.value).getTime(); }); };
      $('[data-a=layers]').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); const it = (k, l) => ({ label: (L[k] ? '✓ ' : '   ') + l, action: () => { L[k] = !L[k]; save(); } }); OS.menu(r.left - 170, r.bottom + 4, [it('lines', 'Constellation lines'), it('cnames', 'Constellation names'), it('snames', 'Star names'), it('planets', 'Planets'), it('dso', 'Galaxies & nebulae'), it('milky', 'Milky Way'), it('meteors', 'Meteors'), '-', it('atmo', 'Atmosphere (daylight)'), it('ground', 'Ground'), it('grid', 'Alt/Az grid'), it('eqgrid', 'Equatorial grid')]); };
      $('[data-a=loc]').onclick = (e) => { const r = e.currentTarget.getBoundingClientRect(); OS.menu(r.left - 170, r.bottom + 4, [{ label: 'Use my location', icon: 'location', action: () => navigator.geolocation ? navigator.geolocation.getCurrentPosition((p) => { loc = { name: 'My location', lat: +p.coords.latitude.toFixed(2), lon: +p.coords.longitude.toFixed(2) }; save(); }, (er) => OS.alert('Location unavailable', er.message)) : OS.alert('Unavailable', 'Location is not supported.') }, { label: 'Enter coordinates…', icon: 'edit', action: async () => { const v = await OS.prompt('Coordinates', 'Latitude, longitude (e.g. 48.86, 2.35):', `${loc.lat}, ${loc.lon}`); if (!v) return; const [la, lo] = v.split(/[,\s]+/).map(Number); if (isNaN(la) || isNaN(lo)) return; loc = { name: `${la.toFixed(2)}°, ${lo.toFixed(2)}°`, lat: OS.clamp(la, -90, 90), lon: lo }; save(); } }, '-', ...CITIES.map(([n, la, lo]) => ({ label: n, action: () => { loc = { name: n, lat: la, lon: lo }; save(); } }))]); };
      // AR mode: device orientation
      const orient = (e) => { if (!ar || e.alpha == null) return; const beta = e.beta, gamma = e.gamma; const heading = e.webkitCompassHeading != null ? e.webkitCompassHeading : (360 - e.alpha); const so = (screen.orientation && screen.orientation.angle) || 0; az = (heading + so + 360) % 360; alt = OS.clamp(so === 0 ? beta - 90 : (so === 90 ? -gamma - 90 : gamma - 90), -89, 89); };
      $('[data-a=ar]').onclick = async () => {
        if (!ar) { try { if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) { const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') throw new Error('Permission denied'); } } catch (er) { return OS.alert('Sensor unavailable', er.message); } if (!('ondeviceorientation' in window)) return OS.alert('Sensor unavailable', 'This device has no orientation sensor. Try it on a phone or tablet!'); ar = true; window.addEventListener('deviceorientationabsolute', orient); window.addEventListener('deviceorientation', orient); OS.notify('Sky view', 'Point your device at the sky to find stars.', { app: 'starlight' }); }
        else { ar = false; window.removeEventListener('deviceorientationabsolute', orient); window.removeEventListener('deviceorientation', orient); }
        $('[data-a=ar]').classList.toggle('on', ar);
      };
      win.onClose(() => { cancelAnimationFrame(raf); save(); window.removeEventListener('deviceorientation', orient); window.removeEventListener('deviceorientationabsolute', orient); });
      win.body.querySelector('[data-s="1"]').classList.add('on');
      size(); raf = requestAnimationFrame(frame);
    },
  });
  OS.starlight = { STARS, CONST, bodies, jdOf };
})();
