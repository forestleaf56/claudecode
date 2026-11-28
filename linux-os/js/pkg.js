/* Cirrus Linux — package manager (shared by apt and the Software app) */
(function () {
  'use strict';
  // type: 'app' => GUI app (app id = key), 'cli' => terminal command(s), 'lib' => library/meta
  const R = {
    // core GUI (preinstalled)
    files: { v: '24.11.2', size: 2140, sec: 'System', desc: 'Browse and manage your files', type: 'app', core: 1 },
    terminal: { v: '24.11.1', size: 880, sec: 'System', desc: 'Command line terminal with bash-like shell', type: 'app', core: 1 },
    browser: { v: '132.0', size: 81200, sec: 'Internet', desc: 'Fast, private web browser with tabs', type: 'app' },
    editor: { v: '46.2', size: 1620, sec: 'Accessories', desc: 'Simple text and code editor', type: 'app' },
    settings: { v: '24.11.0', size: 3200, sec: 'System', desc: 'Configure appearance, users, sound and more', type: 'app', core: 1 },
    software: { v: '24.11.0', size: 2900, sec: 'System', desc: 'Find and install apps', type: 'app', core: 1 },
    calculator: { v: '46.1', size: 640, sec: 'Accessories', desc: 'Basic and scientific calculator', type: 'app' },
    viewer: { v: '46.0', size: 920, sec: 'Graphics', desc: 'View images and videos', type: 'app' },
    monitor: { v: '46.0', size: 1180, sec: 'System', desc: 'See processes, CPU, memory and storage', type: 'app' },
    calendar: { v: '46.1', size: 1440, sec: 'Office', desc: 'Calendar with events', type: 'app' },
    clock: { v: '46.0', size: 720, sec: 'Accessories', desc: 'World clock, stopwatch, timer and alarms', type: 'app' },
    music: { v: '3.2.0', size: 2410, sec: 'Multimedia', desc: 'Music player with built-in synth tracks', type: 'app' },
    paint: { v: '2.4.1', size: 1910, sec: 'Graphics', desc: 'Draw and paint pictures', type: 'app' },
    weather: { v: '46.0', size: 860, sec: 'Internet', desc: 'Live forecasts for any city', type: 'app' },
    notes: { v: '1.6.0', size: 540, sec: 'Office', desc: 'Sticky notes that save automatically', type: 'app' },
    trash: { v: '24.11', size: 40, sec: 'System', desc: 'Deleted files', type: 'app', core: 1 },
    snake: { v: '1.4', size: 210, sec: 'Games', desc: 'Eat, grow, and do not bite your tail', type: 'app' },
    mines: { v: '3.1', size: 260, sec: 'Games', desc: 'Clear the field without hitting a mine', type: 'app' },
    merge: { v: '1.2', size: 180, sec: 'Games', desc: 'Slide and merge tiles to reach 2048', type: 'app' },
    blocks: { v: '2.0', size: 320, sec: 'Games', desc: 'Stack falling blocks and clear lines', type: 'app' },
    memory: { v: '1.1', size: 150, sec: 'Games', desc: 'Flip cards and find all the pairs', type: 'app' },
    tictactoe: { v: '1.0', size: 90, sec: 'Games', desc: 'Classic X and O against the computer', type: 'app' },
    office: { v: '24.8.2', size: 1200, sec: 'Office', desc: 'Cumulus Office start center: create and open documents', type: 'app' },
    writer: { v: '24.8.2', size: 9800, sec: 'Office', desc: 'Cumulus Writer word processor: rich text, tables, images, export to Word/PDF', type: 'app' },
    sheets: { v: '24.8.2', size: 8700, sec: 'Office', desc: 'Cumulus Sheets spreadsheet: formulas, charts, CSV import/export', type: 'app' },
    slides: { v: '24.8.2', size: 7600, sec: 'Office', desc: 'Cumulus Slides presentations: themes, shapes, images, slideshow', type: 'app' },
    'cumulus-office': { v: '24.8.2', size: 300, sec: 'Office', desc: 'Cumulus Office suite (Writer, Sheets, Slides)', type: 'lib', deps: ['office', 'writer', 'sheets', 'slides'] },
    starlight: { v: '2.1.0', size: 4200, sec: 'Education', desc: 'Planetarium: real stars, planets, Moon and constellations for any place and time', type: 'app' },
    beatforge: { v: '1.4.0', size: 6400, sec: 'Multimedia', desc: 'Music studio: step sequencer, piano roll, song mode, mixer and 5 sample packs', type: 'app' },
    sprout: { v: '1.2.0', size: 3900, sec: 'Development', desc: 'Visual block programming: make games and animations by snapping blocks', type: 'app' },
    code: { v: '1.9.4', size: 9100, sec: 'Development', desc: 'Nimbus Code editor: syntax highlighting for 20+ languages, explorer, terminal, run & preview', type: 'app' },
    help: { v: '24.11', size: 300, sec: 'System', desc: 'Help & Guides: user guides, how-tos and FAQ', type: 'app', core: 1 },
    assistant: { v: '1.0.0', size: 1200, sec: 'Accessories', desc: 'Cumulo, the all-knowing AI assistant', type: 'app' },
    // optional GUI
    solitaire: { v: '1.0', size: 260, sec: 'Games', desc: 'Klondike solitaire card game', type: 'app' },
    chess: { v: '1.1', size: 420, sec: 'Games', desc: 'Chess against the computer or a friend', type: 'app' },
    rocks: { v: '1.0', size: 210, sec: 'Games', desc: 'Space Rocks: blast asteroids in a retro vector shooter', type: 'app' },
    skyhop: { v: '1.0', size: 150, sec: 'Games', desc: 'Sky Hop: tap to fly between the pipes', type: 'app' },
    fourrow: { v: '1.0', size: 140, sec: 'Games', desc: 'Four in a Row: drop discs and connect four', type: 'app' },
    hangman: { v: '1.0', size: 120, sec: 'Games', desc: 'Guess the hidden word letter by letter', type: 'app' },
    life: { v: '1.0', size: 110, sec: 'Education', desc: "Conway's Game of Life cellular automaton", type: 'app' },
    fractal: { v: '1.0', size: 140, sec: 'Graphics', desc: 'Explore the Mandelbrot and Julia fractals', type: 'app' },
    pixelart: { v: '1.0', size: 230, sec: 'Graphics', desc: 'Draw pixel art sprites and export PNG', type: 'app' },
    pomodoro: { v: '1.0', size: 90, sec: 'Office', desc: 'Focus timer with work and break sessions', type: 'app' },
    units: { v: '1.0', size: 120, sec: 'Accessories', desc: 'Convert length, weight, temperature, speed and more', type: 'app' },
    fireworks: { v: '1.0', size: 80, sec: 'Graphics', desc: 'Tap the sky to launch fireworks', type: 'app' },
    maps: { v: '1.0', size: 160, sec: 'Internet', desc: 'World map with place search (OpenStreetMap)', type: 'app' },
    passgen: { v: '1.0', size: 60, sec: 'Accessories', desc: 'Generate strong passwords and passphrases', type: 'app' },
    dice: { v: '1.0', size: 70, sec: 'Games', desc: 'Roll dice and flip coins', type: 'app' },
    morse: { v: '1.0', size: 70, sec: 'Education', desc: 'Translate text to Morse code and hear it', type: 'app' },
    kaleido: { v: '1.0', size: 90, sec: 'Graphics', desc: 'Draw symmetrical kaleidoscope art', type: 'app' },
    reaction: { v: '1.0', size: 50, sec: 'Games', desc: 'Test your reaction time', type: 'app' },
    sudoku: { v: '3.0', size: 410, sec: 'Games', desc: 'Number puzzles with three difficulty levels', type: 'app' },
    pong: { v: '1.0', size: 120, sec: 'Games', desc: 'Paddle duel against a CPU opponent', type: 'app' },
    bricks: { v: '1.3', size: 240, sec: 'Games', desc: 'Break all the bricks with your ball', type: 'app' },
    piano: { v: '1.0', size: 380, sec: 'Multimedia', desc: 'Playable synth piano with keyboard and touch', type: 'app' },
    camera: { v: '46.0', size: 760, sec: 'Multimedia', desc: 'Take photos with your device camera', type: 'app' },
    typing: { v: '1.0', size: 130, sec: 'Games', desc: 'Test how fast you can type', type: 'app' },
    // CLI
    coreutils: { v: '9.4', size: 7100, sec: 'System', desc: 'GNU core utilities (ls, cat, cp, mv...)', type: 'lib', core: 1 },
    bash: { v: '5.2.21', size: 1800, sec: 'System', desc: 'GNU Bourne Again SHell', type: 'lib', core: 1 },
    apt: { v: '2.7.14', size: 4200, sec: 'System', desc: 'Commandline package manager', type: 'lib', core: 1 },
    'cirrus-desktop': { v: '24.11', size: 52000, sec: 'System', desc: 'The Cirrus desktop environment', type: 'lib', core: 1 },
    nano: { v: '7.2', size: 880, sec: 'Editors', desc: 'Small, friendly terminal text editor', type: 'cli', cmds: ['nano', 'pico'] },
    procps: { v: '4.0.4', size: 1400, sec: 'System', desc: 'Process utilities: top, ps, free, kill, watch, uptime', type: 'cli', core: 1, cmds: ['top', 'ps', 'free', 'kill', 'killall', 'pkill', 'watch', 'uptime'] },
    less: { v: '590', size: 380, sec: 'Utilities', desc: 'Terminal pager (less, more)', type: 'cli', core: 1, cmds: ['less', 'more', 'most'] },
    'man-db': { v: '2.12.0', size: 2600, sec: 'Documentation', desc: 'Manual page viewer (man, apropos, whatis)', type: 'cli', core: 1, cmds: ['man', 'apropos', 'whatis', 'info'] },
    'vim-tiny': { v: '9.1', size: 1700, sec: 'Editors', desc: 'Vi IMproved, compact version (vi)', type: 'cli', cmds: ['vi'] },
    'alsa-utils': { v: '1.2.9', size: 2300, sec: 'Multimedia', desc: 'Sound utilities including the alsamixer volume TUI', type: 'cli', cmds: ['alsamixer', 'amixer'] },
    curl: { v: '8.5.0', size: 520, sec: 'Network', desc: 'Command line tool for transferring data with URLs', type: 'cli', cmds: ['curl'] },
    wget: { v: '1.21.4', size: 980, sec: 'Network', desc: 'Retrieves files from the web', type: 'cli', cmds: ['wget'] },
    neofetch: { v: '7.1.0', size: 340, sec: 'Utilities', desc: 'Shows system information with a logo', type: 'cli', cmds: ['neofetch'] },
    'iputils-ping': { v: '20240117', size: 120, sec: 'Network', desc: 'Tools to test the reachability of network hosts', type: 'cli', cmds: ['ping'] },
    cowsay: { v: '3.03', size: 93, sec: 'Games', desc: 'Configurable talking cow', type: 'cli', cmds: ['cowsay', 'cowthink'] },
    figlet: { v: '2.2.5', size: 610, sec: 'Utilities', desc: 'Make large letters out of ordinary text', type: 'cli', cmds: ['figlet'] },
    fortune: { v: '1.99.1', size: 1800, sec: 'Games', desc: 'Provides fortune cookies on demand', type: 'cli', cmds: ['fortune'] },
    sl: { v: '5.02', size: 60, sec: 'Games', desc: 'Corrects you if you type sl by mistake', type: 'cli', cmds: ['sl'] },
    cmatrix: { v: '2.0', size: 75, sec: 'Utilities', desc: 'Shows a scrolling digital rain like in the movies', type: 'cli', cmds: ['cmatrix'] },
    lolcat: { v: '100.0', size: 42, sec: 'Utilities', desc: 'Rainbow coloring for text', type: 'cli', cmds: ['lolcat'] },
    htop: { v: '3.3.0', size: 380, sec: 'Utilities', desc: 'Interactive process viewer', type: 'cli', cmds: ['htop'] },
    tree: { v: '2.1.1', size: 110, sec: 'Utilities', desc: 'Displays an indented directory tree', type: 'cli', cmds: ['tree'] },
    nodejs: { v: '20.11.1', size: 38000, sec: 'Development', desc: 'JavaScript runtime (node command)', type: 'cli', cmds: ['node', 'nodejs'] },
    python3: { v: '3.12.3', size: 21000, sec: 'Development', desc: 'Python interpreter (tiny subset: print, math, loops)', type: 'cli', cmds: ['python3', 'python'] },
    git: { v: '2.43.0', size: 18000, sec: 'Development', desc: 'Fast, scalable, distributed revision control (basic local repo)', type: 'cli', cmds: ['git'] },
    bc: { v: '1.07.1', size: 230, sec: 'Utilities', desc: 'Arbitrary precision calculator language', type: 'cli', cmds: ['bc'] },
    toilet: { v: '0.3', size: 120, sec: 'Utilities', desc: 'Display large colourful characters', type: 'cli', cmds: ['toilet'] },
    'bsd-games': { v: '2.17', size: 1200, sec: 'Games', desc: 'Collection of classic text games (guess number, banner, rot13)', type: 'cli', cmds: ['guess', 'banner', 'rot13', 'factor'] },
    asciiquarium: { v: '1.1', size: 80, sec: 'Games', desc: 'Enjoy the mysteries of the sea from your terminal', type: 'cli', cmds: ['asciiquarium'] },
    vim: { v: '9.1', size: 3900, sec: 'Editors', desc: 'Vi IMproved, full version (vim, vimtutor)', type: 'cli', cmds: ['vim', 'vi', 'vimtutor', 'view'] },
    cbonsai: { v: '1.3.1', size: 60, sec: 'Games', desc: 'Grow a bonsai tree in your terminal', type: 'cli', cmds: ['cbonsai'] },
    'pipes-sh': { v: '1.3.0', size: 30, sec: 'Games', desc: 'Animated pipes screensaver for the terminal', type: 'cli', cmds: ['pipes', 'pipes.sh'] },
    nyancat: { v: '1.5.2', size: 40, sec: 'Games', desc: 'Rainbow cat flying through your terminal', type: 'cli', cmds: ['nyancat'] },
    hollywood: { v: '1.21', size: 90, sec: 'Games', desc: 'Fill your terminal with movie-style hacker screens', type: 'cli', cmds: ['hollywood'] },
    rig: { v: '1.11', size: 40, sec: 'Utilities', desc: 'Random identity generator', type: 'cli', cmds: ['rig'] },
    '2048-cli': { v: '0.9.1', size: 30, sec: 'Games', desc: 'Play 2048 in the terminal', type: 'cli', cmds: ['2048'] },
    'tty-clock': { v: '2.3', size: 30, sec: 'Utilities', desc: 'Big digital clock in the terminal', type: 'cli', cmds: ['tty-clock'] },
    espeak: { v: '1.52', size: 900, sec: 'Multimedia', desc: 'Text to speech (espeak, say)', type: 'cli', cmds: ['espeak', 'say', 'spd-say'] },
    donut: { v: '1.0', size: 10, sec: 'Games', desc: 'Spinning 3D ASCII donut', type: 'cli', cmds: ['donut'] },
    boxes: { v: '2.2.1', size: 120, sec: 'Utilities', desc: 'Draw ASCII art boxes around text', type: 'cli', cmds: ['boxes'] },
    'desktop-pet': { v: '1.0', size: 50, sec: 'Games', desc: 'A little creature that lives on your desktop (pet)', type: 'cli', cmds: ['pet'] },
    wttr: { v: '1.0', size: 10, sec: 'Network', desc: 'Weather report in the terminal (wttr.in)', type: 'cli', cmds: ['wttr'] },
    jq: { v: '1.7.1', size: 160, sec: 'Utilities', desc: 'Lightweight command-line JSON processor', type: 'cli', cmds: ['jq'] },
  };
  const DEFAULT = ['coreutils', 'bash', 'apt', 'cirrus-desktop', 'files', 'terminal', 'browser', 'editor', 'settings', 'software', 'calculator', 'viewer', 'monitor', 'calendar', 'clock', 'music', 'paint', 'weather', 'notes', 'trash', 'snake', 'mines', 'merge', 'blocks', 'memory', 'tictactoe', 'nano', 'curl', 'wget', 'neofetch', 'iputils-ping', 'bc', 'procps', 'less', 'man-db', 'vim-tiny', 'alsa-utils', 'office', 'writer', 'sheets', 'slides', 'cumulus-office', 'starlight', 'beatforge', 'sprout', 'code', 'help', 'assistant'];
  const MIGRATIONS = { 2: ['procps', 'less', 'man-db', 'vim-tiny', 'alsa-utils', 'office', 'writer', 'sheets', 'slides', 'cumulus-office'], 3: ['starlight', 'beatforge', 'sprout', 'code'], 4: ['help', 'assistant'] };
  const PKGV = 4;

  const pkg = (OS.pkg = { repo: R });
  const list = () => {
    if (!Array.isArray(OS.settings.installed)) { OS.settings.installed = DEFAULT.slice(); OS.settings.pkgVersion = PKGV; OS.saveSettings(); }
    const v = OS.settings.pkgVersion || 1;
    if (v < PKGV) { Object.keys(MIGRATIONS).filter((k) => +k > v).forEach((k) => MIGRATIONS[k].forEach((n) => { if (!OS.settings.installed.includes(n)) OS.settings.installed.push(n); })); OS.settings.pkgVersion = PKGV; OS.saveSettings(); OS.emit('pkg-migrated', v); }
    return OS.settings.installed;
  };
  pkg.installed = () => list().slice();
  pkg.isInstalled = (n) => list().includes(n);
  pkg.appAvailable = (id) => !R[id] || R[id].type !== 'app' || pkg.isInstalled(id);
  pkg.cmdAvailable = (cmd) => { let prov = null; for (const n in R) if (R[n].cmds && R[n].cmds.includes(cmd)) { if (pkg.isInstalled(n)) return true; prov = prov || n; } return prov || true; };
  pkg.pkgForCmd = (cmd) => Object.keys(R).find((n) => R[n].cmds && R[n].cmds.includes(cmd));
  pkg.search = (q) => { q = q.toLowerCase(); return Object.keys(R).filter((n) => n.includes(q) || R[n].desc.toLowerCase().includes(q) || (OS.apps[n] && OS.apps[n].name.toLowerCase().includes(q))); };
  pkg.label = (n) => (OS.apps[n] ? OS.apps[n].name : n);
  pkg.kb = (n) => R[n].size;

  pkg.install = async (n, onProgress = () => {}) => {
    if (!R[n]) throw new Error(`Unable to locate package ${n}`);
    if (pkg.isInstalled(n)) return false;
    const total = R[n].size; const steps = OS.clamp(Math.round(Math.log2(total + 2) * 2), 6, 30);
    for (let i = 1; i <= steps; i++) { await OS.sleep(40 + Math.random() * 90); onProgress(i / steps, 'download'); }
    onProgress(1, 'unpack'); await OS.sleep(200);
    list().push(n); (R[n].deps || []).forEach((d) => { if (!list().includes(d)) list().push(d); }); OS.saveSettings();
    try { OS.fs.append('/var/log/apt/history.log', `\nStart-Date: ${new Date().toISOString()}\nCommandline: apt install ${n}\nInstall: ${n}:amd64 (${R[n].v})\nEnd-Date: ${new Date().toISOString()}\n`); } catch (e) {}
    OS.emit('pkg', n, true); return true;
  };
  pkg.remove = async (n) => {
    if (!R[n]) throw new Error(`Unable to locate package ${n}`);
    if (R[n].core) throw new Error(`${n} is an essential package and cannot be removed`);
    if (!pkg.isInstalled(n)) return false;
    await OS.sleep(300);
    OS.settings.installed = list().filter((x) => x !== n); OS.saveSettings();
    if (R[n].type === 'app') { OS.wm.byApp(n).forEach((w) => OS.wm.close(w)); OS.settings.pinned = OS.settings.pinned.filter((x) => x !== n); OS.saveSettings(); }
    OS.emit('pkg', n, false); return true;
  };
  // fake updates for a realistic "apt upgrade"
  pkg.upgradable = () => { const st = OS.store.get('apt-upgraded', 0); if (Date.now() - st < 6 * 3600e3) return []; return ['browser', 'cirrus-desktop', 'coreutils', 'curl', 'terminal'].filter((n) => pkg.isInstalled(n)); };
  pkg.markUpgraded = () => OS.store.set('apt-upgraded', Date.now());
})();
