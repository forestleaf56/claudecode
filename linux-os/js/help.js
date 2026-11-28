/* Cirrus Linux — Help & Guides: markdown documents in ~/Documents/Help and a Help Center viewer */
(function () {
  'use strict';
  const esc = OS.esc, gl = OS.glyph;
  const DOCS = {
    '00 Welcome.md': `# Welcome to Cirrus Linux

Cirrus Linux is a complete desktop operating system that runs inside your web browser — on a computer, tablet or phone. Everything you create is saved on this device.

## Start here
- [Getting started](01 Getting Started.md) — the desktop, app menu and windows
- [Files and folders](02 Files and Folders.md) — organize, import and back up your files
- [Terminal basics](03 Terminal Basics.md) — the command line, step by step
- [Installing software](04 Installing Software.md) — the Software store and \`apt\`
- [Keyboard shortcuts](05 Keyboard Shortcuts.md) — work faster
- [Phones and tablets](06 Phones and Tablets.md) — touch gestures and tips

## Apps
- [Cumulo, the assistant](07 Cumulo Assistant.md)
- [Cumulus Office](08 Cumulus Office.md) — Writer, Sheets and Slides
- [Nimbus Code](09 Nimbus Code.md) — the code editor
- [Terminal programs](10 Terminal Programs.md) — nano, vim, top, less, man
- [Starlight planetarium](11 Starlight.md)
- [BeatForge music studio](12 BeatForge.md)
- [Sprout block programming](13 Sprout.md)
- [Games](14 Games.md)

## Make it yours
- [Personalization](15 Personalization.md) — themes, wallpapers, widgets and fun effects
- [Settings tour](16 Settings Tour.md)

## When something goes wrong
- [Storage and backups](17 Storage and Backups.md)
- [Troubleshooting and FAQ](18 Troubleshooting and FAQ.md)

> Tip: ask **Cumulo** anything, for example “how do I change the wallpaper?” — it reads these guides too.
`,
    '01 Getting Started.md': `# Getting started

## The desktop
- The **panel** runs along the bottom (or top) of the screen. It holds the **app menu button** (the cloud logo), pinned apps, running windows, the system tray and the clock.
- **Desktop icons** show your Home folder, the Trash and everything in \`~/Desktop\`.
- **Right-click** (or **long-press** on touch screens) anywhere for a context menu.

## Opening apps
1. Click the **cloud logo** in the panel, or press **Alt+Space**.
2. Type a few letters of the app's name and press **Enter**, or pick a category such as *Games* or *Office*.
3. Right-click an app to **pin it to the panel** or **add it to the desktop**.

The search box does more than find apps: it searches your files, calculates sums (\`12*7\`), runs terminal commands and can ask Cumulo a question.

## Working with windows
| Action | How |
|---|---|
| Move | Drag the title bar |
| Resize | Drag any edge or corner |
| Maximize | Double-click the title bar, or drag it to the top edge |
| Snap left/right | Drag a window to the left or right edge |
| Minimize | The – button, or click its panel icon |
| Close | The × button or **Alt+F4** |
| See all windows | The overview button next to the app menu |

On phones every window opens full-screen; switch between them with the overview button in the panel.

## The system tray
Click the network/volume/battery icons for **quick settings**: dark style, night light, do-not-disturb, fullscreen, screenshot, volume and brightness. Notifications are listed there too. Click the **clock** for a calendar.

## Locking and power
Open the app menu and use the buttons at the bottom right to **lock**, **log out**, **restart** or **shut down**.

## Your account
The first time Cirrus starts it asks for your **name, user name, password and computer name**. Your home folder becomes \`/home/<user name>\`, and your password is needed every time you log in or unlock, and for \`sudo\`. Change any of it in *Settings → Users* (changing the user name renames your home folder and updates every file that pointed to it).

## Starting up
Cirrus boots like a real PC: firmware check, boot menu (counts down from 5), kernel and service messages, then the splash screen. Press **Esc**, **Space** or tap to skip ahead. Choose *Boot log*, *Splash* or *Quick* in *Settings → Personalize*.
`,
    '02 Files and Folders.md': `# Files and folders

Open **Files** from the panel or the app menu. Your home folder (\`~\`) contains *Desktop, Documents, Downloads, Music, Pictures* and *Videos*.

## Everyday tasks
- **Open** a file: double-click it (single tap on touch screens). Cirrus picks the right app automatically.
- **New folder / new document**: right-click an empty area, or use the ⋮ menu.
- **Rename**: select and press **F2**, or right-click → *Rename*.
- **Copy, cut, paste**: **Ctrl+C**, **Ctrl+X**, **Ctrl+V** — or the right-click menu.
- **Move**: drag files onto a folder, a sidebar place or the path bar.
- **Delete**: press **Delete** to move to the Trash. **Shift+Delete** deletes permanently.
- **Search**: click the magnifier or press **Ctrl+F**.
- **Hidden files**: press **Ctrl+H**.

## Getting files in and out
- **Import**: drag files from your real computer onto the Files window or the desktop, or use *Import from device…*.
- **Download to your device**: right-click a file → *Download to device*.

## The Trash
Deleted items go to the Trash. Open it from the desktop or the Files sidebar to **restore** items or **empty** it.

## Which app opens what
| File type | Opens in |
|---|---|
| .txt .md .log | Text Editor |
| .js .py .html .css .json .sh … | Nimbus Code |
| .png .jpg .svg .gif | Image Viewer |
| .mp3 .wav .ogg | Music |
| .cdoc / .csht / .cslide | Writer / Sheets / Slides |
| .csv | Sheets |
| .beat | BeatForge |
| .sprout | Sprout |

Right-click → *Open with…* to choose a different app.
`,
    '03 Terminal Basics.md': `# Terminal basics

The **Terminal** gives you a bash-style command line. Open it from the panel or press **Ctrl+Alt+T**.

## Your first commands
\`\`\`
pwd              # where am I?
ls               # list files
ls -la           # list everything with details
cd Documents     # go into a folder
cd ..            # go up one level
cd ~             # go home
cat notes.md     # show a file
mkdir projects   # make a folder
touch hello.txt  # make an empty file
cp a.txt b.txt   # copy
mv b.txt c.txt   # rename / move
rm c.txt         # delete
\`\`\`

## Getting help
- \`help\` lists every command by category.
- \`man ls\` opens the manual page for a command (press **q** to quit).
- \`apropos editor\` searches manual descriptions.

## Power features
- **Pipes**: \`ls -l | sort -k5 -n | tail -3\`
- **Redirection**: \`echo hello > file.txt\`, \`>> \` appends.
- **Chaining**: \`mkdir demo && cd demo\`, \`;\` runs commands one after another.
- **Variables**: \`name=Cirrus; echo "Hi $name"\`
- **Substitution**: \`echo "Today is $(date)"\` and arithmetic \`echo $((6*7))\`
- **Wildcards**: \`ls *.txt\`
- **History**: press **↑/↓**, or run \`history\`. **Tab** completes commands and file names.
- **Scripts**: \`sh ~/Documents/hello.sh\`

## Keys
| Key | Does |
|---|---|
| Tab | Complete |
| ↑ / ↓ | Command history |
| Ctrl+C | Stop the running command |
| Ctrl+L | Clear the screen |
| Ctrl+D | Close the terminal |

On touch screens a row of extra keys (Tab, Ctrl, arrows, Esc, |, / …) appears above the keyboard. **Ctrl** is *sticky*: tap it, then tap a letter.

## Networking
\`curl\`, \`wget\` and \`ping\` make real requests from your browser. Some websites block this (CORS); try \`curl https://api.github.com/zen\`.
`,
    '04 Installing Software.md': `# Installing software

## The Software store
Open **Software** to browse apps, games and command-line tools by category. Tap **Install** — it takes a few seconds — then find the app in the app menu. *Installed* shows what you have and *Updates* lets you update everything.

## apt in the terminal
\`\`\`
sudo apt update              # refresh package lists
apt search game              # find packages
apt show cowsay              # details
sudo apt install cowsay      # install
sudo apt remove cowsay       # remove
apt list --installed         # what's installed
sudo apt upgrade             # install updates
\`\`\`
Installing and removing needs \`sudo\`, which asks for your password.

If you type a command that isn't installed, the terminal tells you which package provides it.

## Fun things to try
| Package | Try |
|---|---|
| cowsay | \`cowsay Moo\` |
| figlet | \`figlet Cirrus\` |
| lolcat | \`fortune | lolcat\` |
| cmatrix | \`cmatrix\` |
| cbonsai | \`cbonsai\` |
| nyancat | \`nyancat\` |
| donut | \`donut\` |
| 2048-cli | \`2048\` |
| desktop-pet | \`pet\` |
| espeak | \`say Hello world\` |
| nodejs | \`node\` |
| python3 | \`python3\` |
`,
    '05 Keyboard Shortcuts.md': `# Keyboard shortcuts

## System
| Shortcut | Action |
|---|---|
| Alt+Space or Super | App menu |
| Ctrl+Alt+T | New terminal |
| Alt+F4 | Close window |
| Esc | Close menus |

## Files
| Shortcut | Action |
|---|---|
| Ctrl+C / X / V | Copy / cut / paste |
| Delete / Shift+Delete | Trash / delete permanently |
| F2 | Rename |
| Ctrl+A | Select all |
| Ctrl+H | Show hidden files |
| Ctrl+F | Search |
| Backspace | Parent folder |

## Text Editor, Writer and Nimbus Code
| Shortcut | Action |
|---|---|
| Ctrl+S | Save |
| Ctrl+O | Open |
| Ctrl+F | Find (and replace) |
| Ctrl+Z / Ctrl+Y | Undo / redo |
| Ctrl+B / I / U | Bold / italic / underline (Writer) |
| Ctrl+P | Quick open (Code) or print (Writer) |
| Ctrl+Shift+P | Command palette (Code) |
| Ctrl+/ | Toggle comment (Code) |
| Alt+↑/↓ | Move line (Code) |
| F5 | Run (Code) · Present (Slides) |
| Ctrl+\` | Terminal panel (Code) |

## Browser
| Shortcut | Action |
|---|---|
| Ctrl+T | New tab |
| Ctrl+W | Close tab |
| Ctrl+L | Address bar |
| F5 | Reload |
`,
    '06 Phones and Tablets.md': `# Phones and tablets

Cirrus switches to a touch-friendly layout on small screens automatically. You can force it on or off in *Settings → Desktop & Panel → Mobile layout*.

## Gestures
- **Tap** opens files and apps.
- **Long-press** acts like a right-click and opens context menus.
- **Swipe** works in games like Snake, Merge and Block Drop, and to flip pictures in the Image Viewer.
- **Pinch** to zoom in the Image Viewer and Starlight. **Double-tap** to zoom pictures.

## Windows
Apps open full-screen. Use the **overview** button (four squares, bottom right of the panel) to switch between open apps or close them.

## Fullscreen
Cirrus enters fullscreen when you log in. On iPhone, Safari doesn't allow this — use *Share → Add to Home Screen* instead.

## Typing in the terminal
Extra keys appear above the on-screen keyboard. **Ctrl** is sticky. Programs like nano and vim show their own buttons (Save, Exit, Undo…).

## Good to know
- Starlight can follow your phone: tap the 👁 button and point the phone at the sky.
- Games show on-screen controls when needed.
- Sprout has a *Code / Stage* switch at the top.
`,
    '07 Cumulo Assistant.md': `# Cumulo, the all-knowing assistant

Cumulo is a cheerful cloud oracle that lives in your desktop. Open it from the app menu or type a question in the app menu search and choose *Ask Cumulo*.

## Things you can say
**Control the computer**
- “open the terminal”, “launch chess”
- “install sudoku”, “uninstall pong”
- “dark mode”, “light mode”, “use the vampire theme”
- “set the accent color to pink”, “change the wallpaper”
- “turn on party mode”, “give me a pet”
- “volume 40”, “brightness 70”, “take a screenshot”, “lock the screen”
- “set a timer for 5 minutes”, “remind me in 10 minutes to stretch”
- “make a note: buy milk”, “find files named budget”
- “run command neofetch”

**Ask anything** — Cumulo researches Wikipedia, instant answers and the web, and picks the sentence that answers your question
- “how tall is the Eiffel Tower?”, “why is the sky blue?”, “who painted the Mona Lisa?”
- follow-ups: “when was it built?”, “how old was he?”, “tell me more”
- “define serendipity”, “synonyms for happy”, “rhymes with cat”
- “weather in Tokyo”, “what time is it in New York?”, “latest news”, “news about space”
- “translate good morning to Japanese”, “100 usd to eur”, “bitcoin price”

**Offline knowledge**
- capitals, currencies, languages and populations: “capital of Australia”, “what currency is used in Japan”
- elements and planets: “symbol for gold”, “how many moons does Saturn have”
- science: “speed of light”, “boiling point of water”, “age of the universe”

**Maths and dates**
- “what is 15% of 240?”, “sqrt(2)*10”, “solve 3x + 5 = 20”, “solve x^2 - 5x + 6 = 0”
- “is 97 prime?”, “factorize 360”, “255 in binary”, “MCMXC in numbers”, “30!”, “average of 3, 8, 10”
- “days until Christmas”, “what day was 1969-07-20?”, “is 2028 a leap year?”, “tip on 80 at 20%”
- “convert 10 km to miles”, “72 f to c”, “generate a password”

**About you and your computer**
- “call me Captain”, “remember that my locker is 42”, “what do you remember?”, “forget everything”
- “how much storage am I using?”, “battery”, “what's my IP?”, “how many apps do I have?”, “list files in Documents”
- “how do I install apps?” — answers from these guides

**Just for fun**
- jokes, fun facts, riddles, trivia, quotes
- “will I win the lottery?” (the Magic Cloud knows)
- “flip a coin”, “roll a die”, “rock paper scissors”
- “write a poem about the sea”, “tell me a story”
- “compliment me”, “roast me”

## Voice
Tap 🎤 to speak (in browsers that support speech recognition) and the speaker button to have Cumulo read its answers aloud.

## Privacy
Cumulo runs on your device, and what it remembers about you stays on this device. Only questions that need live data are sent to public services: knowledge questions (Wikipedia, DuckDuckGo), definitions and synonyms, weather (Open-Meteo), exchange rates, crypto prices, translation and news.
`,
    '08 Cumulus Office.md': `# Cumulus Office

Open **Cumulus Office** for the start center, or the apps directly.

## Writer — documents
- Pick a **style** (Heading 1, Quote, Code…), a **font** and **size** from the toolbar.
- Bold, italic, underline, colors, highlight, alignment, lists and indentation work on the selected text.
- **Insert** tables, images (from Pictures or your device), links, lines, page breaks, the date and special characters.
- Right-click a **table** to add or remove rows and columns; right-click an **image** to resize or align it.
- **Find & replace**: Ctrl+F.
- **File menu**: templates (letter, résumé, report, meeting notes), save as \`.cdoc\`, export to HTML/text, **download as Word (.doc)**, print or save as PDF.

## Sheets — spreadsheets
- Click a cell and type. Press **Enter** to go down, **Tab** to go right. Double-click (or tap a selected cell) to edit.
- Formulas start with \`=\`: \`=SUM(B2:B9)\`, \`=AVERAGE(C2:C9)\`, \`=IF(D10>0,"OK","Over")\`, \`=VLOOKUP(A2,F2:G9,2)\`. While typing a formula, click cells to insert references.
- 50+ functions: SUM, AVERAGE, MIN, MAX, COUNT, IF, AND, OR, ROUND, SUMIF, COUNTIF, VLOOKUP, CONCAT, LEFT, RIGHT, LEN, TODAY…
- **Σ AutoSum**, number formats (currency, percent…), sort, insert/delete rows and columns, fill down (Ctrl+D).
- **Charts**: select data and press the chart button (bar, line, pie); save the chart to Pictures.
- Multiple sheets with the tabs at the bottom. Opens and exports **CSV**.

## Slides — presentations
- Add slides with layouts (Title, Title and content, Section, Two columns, Blank).
- Add text boxes, images and shapes. Drag to move, drag the handles to resize. Tap a selected text box again to edit it.
- **Theme** button: 7 themes and per-slide backgrounds.
- **Present** (F5): tap or use arrow keys to advance, swipe on phones, Esc to exit.
- Export a stand-alone **HTML slideshow** or print to PDF.
`,
    '09 Nimbus Code.md': `# Nimbus Code

A code editor with syntax highlighting for 20+ languages: JavaScript, TypeScript, Python, HTML, CSS, JSON, Markdown, Shell, C, C++, Java, C#, Go, Rust, PHP, Ruby, Lua, Kotlin, Swift, SQL, YAML and TOML.

## Layout
- **Activity bar** (left): Explorer, Search, Run, Extensions, Settings.
- **Explorer**: your project folder (\`~/Projects/hello-world\` to start). Right-click for new file/folder, rename and delete. *Open folder* switches projects.
- **Editor**: tabs, line numbers, bracket matching, auto-indent, suggestions while typing.
- **Panel** (bottom): Problems, Output and a real **Terminal**.
- **Status bar**: cursor position, language (click to change) and theme.

## Running code
Press **F5** or the ▶ button:
| Language | What happens |
|---|---|
| Language | Command run in the terminal |
|---|---|
| JavaScript / TypeScript | \`node app.js\` / \`ts-node utils.ts\` (local) |
| Python | \`python3 main.py\` — real Python 3 (Pyodide) when online, mini-Python offline |
| Shell | \`bash script.sh\` |
| C / C++ | \`gcc hello.c -o hello && ./hello\` / \`g++ …\` |
| Java | \`java Main.java\` |
| C# | \`csc Program.cs && mono Program.exe\` |
| Go / Rust | \`go run main.go\` / \`rustc main.rs && ./main\` |
| Kotlin / Swift | \`kotlinc …\` / \`swift main.swift\` |
| PHP / Ruby / Lua / Perl | \`php\`, \`ruby\`, \`lua\`, \`perl\` |
| SQL | \`sqlite3 :memory: < query.sql\` |
| HTML / CSS / Markdown | Live preview beside the editor |
| JSON | Validated in the Output panel |

**Example programs:** 79 ready-to-run programs in 18 languages live in \`~/Projects/examples\` — open them from *Browse example programs…* on the welcome page, the Run panel, or the command palette (Ctrl+Shift+P → *Examples*).

Compiled languages are built by real compilers on an online build service. Without internet, a built-in "lite" runner handles simple programs (printing, variables, loops, functions). Programs that read input ask for it in the terminal first. You can use the same commands yourself in any terminal, or run any file with \`run <file>\`.

## Handy shortcuts
Ctrl+P quick open · Ctrl+Shift+P command palette · Ctrl+/ comment · Alt+↑/↓ move line · Shift+Alt+↓ duplicate line · Ctrl+D select next match · Ctrl+F find · Ctrl+G go to line · Ctrl+\` terminal · Ctrl+B sidebar.

## Themes
Nimbus Dark, Nimbus Light, Ember, Solar, Ocean and High Contrast — from the Extensions view or the palette icon in the status bar.
`,
    '10 Terminal Programs.md': `# Terminal programs

These programs take over the terminal window, just like on a real Linux system. On touch screens each one shows its own buttons.

## nano — friendly editor
\`nano notes.txt\` — type to edit. The bottom lines list shortcuts (^ means Ctrl).
- **Ctrl+S** save · **Ctrl+O** save as · **Ctrl+X** exit
- **Ctrl+W** search · **Ctrl+K / Ctrl+U** cut / paste a line · **Alt+U** undo

## vi / vim — modal editor
\`vi file.txt\`. Press **i** to type, **Esc** to stop typing.
- \`:w\` save · \`:q\` quit · \`:wq\` save and quit · \`:q!\` quit without saving
- \`dd\` delete line · \`yy\` copy line · \`p\` paste · \`u\` undo · \`/word\` search
- Run \`vimtutor\` for a 15-minute lesson (install full vim with \`sudo apt install vim\`).

## less / more — read long text
\`less file.txt\` or \`ls -la | less\`. Space/↓ to scroll, **/** to search, **q** to quit.

## man — manuals
\`man grep\` · \`man -k editor\` searches · press **h** for help, **q** to quit.

## top / htop — processes
\`top\`: **P** sort by CPU, **M** by memory, **k** kill, **q** quit.
\`htop\` (install it first): arrows to select, **F9** kill, **F6** sort, **F10** quit.

## Others
\`watch -n 1 date\` · \`alsamixer\` (volume) · \`tty-clock\` · \`cmatrix\` · \`2048\`
`,
    '11 Starlight.md': `# Starlight planetarium

Starlight shows the real night sky for any place and time.

## Looking around
- **Drag** to look around, **scroll** or **pinch** to zoom.
- **Tap** a star, planet or galaxy for details; tap the 📍 in the info card to center it.
- **Search** for stars, planets, constellations or objects like “Orion”, “Mars” or “Andromeda Galaxy”.

## Time and place
- The clock (bottom left) opens a date & time picker.
- Speed buttons rewind, pause, play in real time or fast-forward (1 min/s, 1 h/s). **Now** jumps back.
- The 📍 button sets your location (use GPS, type coordinates or pick a city).

## Layers (⚙ button)
Constellation lines and names, star names, planets, galaxies & nebulae, the Milky Way, meteors, atmosphere, ground and coordinate grids. Keyboard: **c** constellations, **a** atmosphere, **g** ground, **Space** pause.

## Sky view on phones
Tap 👁 and point your phone at the sky — Starlight follows the phone's compass and tilt.

## What's inside
About 175 bright stars with real positions, 34 constellations, 12 deep-sky objects, the Sun, the Moon with its phase and all planets computed from their orbits.
`,
    '12 BeatForge.md': `# BeatForge music studio

## Make a beat in one minute
1. Open BeatForge — a demo song is loaded.
2. Press ▶ (or **Space**).
3. In the **Channel rack**, tap squares to turn hits on and off. Right-click/long-press a square for a softer hit.
4. Change the **BPM**, add **swing**, try the **Tap** tempo button.

## Sounds
Open the 📁 **sample browser**: five packs (Classic Kit, 808, Lo-Fi, Synth, World) and 8 synths. Tap a name to preview, **+** to add it as a channel. Right-click a channel name to rename, change sample/synth, pitch or delete it.

## Melodies — Piano roll
Synth channels use the **Piano roll**: tap to add a note, drag right to make it longer (mouse), tap a note to delete it. Tap the keys on the left to hear notes.

## Songs
Make several **patterns** (the + next to the pattern menu). In the **Song** view, tap cells to place the selected pattern on the timeline, then switch the mode to **Song** and press play.

## Mixer
Volume, pan, reverb and tone per channel, mute (M) and solo (S), plus the master level meter.

## Saving and exporting
Menu → Save (\`.beat\` files in \`~/Music/BeatForge\`), **Download WAV**, or export to \`~/Music\` (short songs only — browser storage is small).
`,
    '13 Sprout.md': `# Sprout block programming

Sprout lets you make games and animations by snapping blocks together.

## Your first program
1. Choose the **Motion** category and drag **move 10 steps** into the workspace.
2. Choose **Events** and drag **when ▶ clicked** right above it so they snap together.
3. Press the green **▶** button. Your sprite moves!
4. Wrap it in **Control → forever** and add **if on edge, bounce**.

## Tips
- **Click a script** to run it. **Click a palette block** to try it.
- **Drop blocks on the palette** to delete them.
- Round blocks are **values** (numbers, text) — drop them into white slots. Pointy blocks are **true/false** for *if* and *wait until*.
- On touch screens, **press and hold** a palette block (or drag it sideways) to pick it up.
- **Variables → Make a variable** to keep score.
- **Pen** blocks draw on the stage: try *pen down*, *repeat 36 { move 10, turn 10 }*.
- Add sprites with **+ Sprite** and pick an emoji costume. Each sprite has its own scripts.
- Use **broadcast** to make sprites talk to each other.
- On phones, use *Code / Stage* to switch views. Arrow keys and Space are on-screen.

Projects are saved as \`.sprout\` files in \`~/Documents/Sprout\`.
`,
    '14 Games.md': `# Games

## Installed
Snake · Mines · Merge · Block Drop · Memory · Tic-Tac-Toe

## In the Software store
Solitaire · Chess · Space Rocks · Sky Hop · Four in a Row · Hangman · Sudoku · Pong · Bricks · Typing Test · Reaction Time · Dice & Coin

## Controls
- Keyboard: arrow keys, **Space** to act/pause.
- Touch: swipe (Snake, Merge, Block Drop), on-screen buttons (Snake, Block Drop, Space Rocks), tap (most others).
- Mines: right-click or long-press to flag, or turn on flag mode.
- Solitaire: tap a card to move it automatically; tap the deck to draw.
- Chess: tap a piece, then a highlighted square. Three difficulty levels.

High scores are saved on this device.

## In the terminal
\`2048\`, \`guess\` (bsd-games), \`sl\`, \`cmatrix\`, \`nyancat\`, \`donut\`.
`,
    '15 Personalization.md': `# Personalization

Open *Settings → Personalize*.

## Theme presets
13 complete looks — colors, accent, wallpaper, roundness and font: Polar Night, Vampire, Mocha, Neon City, Retro Wood, Solar Light, Sepia Paper, Deep Forest, Deep Ocean, Sakura, Classic 95, Frosted Glass and High Contrast. *Cirrus (default)* goes back to normal.

## Style
- **Font**: Inter, System, Rounded, Serif, Monospace, Pixel retro, Handwritten.
- **Corner roundness** and **window animation** (Zoom, Slide, Fade, Genie, None).
- **Panel style**: full-width bar or **floating dock**, with icons that grow under the pointer.
- **Panel blur** strength.

## Wallpapers
Still wallpapers live in *Settings → Appearance* (you can also use your own pictures). **Live wallpapers** — Starfield, Aurora, Bubbles, Digital Rain, Snowfall, Fireflies, Neon Waves, Lava Lamp, Confetti — are under *Personalize*.

## Screensaver
Choose when it starts and which animation to show. Optionally lock the screen afterwards.

## Desktop widgets
Clock, calendar, system monitor, sticky note, quote of the day, weather and a photo frame. Drag them anywhere; right-click to remove.

## Sounds
Sound themes: Classic, Soft chimes, Retro 8-bit, Bubbly pop, Glass or Silent. Startup style: boot log, splash or quick.

## Fun
- **Desktop pet** — Sprig follows your cursor, naps when you're away and loves to be petted.
- **Wobbly windows**, **party mode** (rainbow accent), **sparkle cursor trail**, **confetti** celebrations.

## Accessibility
*Settings → Accessibility*: color filters (grayscale, inverted, warm, color-blindness simulation…), large pointer, reduce motion, bigger text and spoken notifications.
`,
    '16 Settings Tour.md': `# Settings tour

| Page | What you'll find |
|---|---|
| Appearance | Light/dark/automatic style, accent color, wallpapers, transparency, animations |
| Personalize | Theme presets, fonts, live wallpapers, screensaver, widgets, sounds, fun effects |
| Desktop & Panel | Panel position, labels, desktop icons, icon size, mobile layout, pinned apps |
| Display | Brightness, night light, text size, fullscreen and fullscreen on login |
| Accessibility | Color filters, large pointer, reduce motion, spoken notifications |
| Sound | Volume, system sounds |
| Network | Connection status and a speed test |
| Notifications | Do not disturb |
| Users | Name, username, avatar color, password, lock screen |
| Apps | Search engine, browser home page, terminal colors, installed apps |
| Date & Time | 24-hour clock, seconds |
| Storage | Usage, backup export/import, factory reset |
| About | System information |

Many settings can also be changed from the terminal: \`gsettings list-keys\`, \`gsettings set org.cirrus.desktop theme light\`, \`wallpaper ocean\`, \`theme dark\`.
`,
    '17 Storage and Backups.md': `# Storage and backups

Cirrus stores your files and settings in your browser's local storage on **this device only**. Browsers allow roughly **5–10 MB**, so:
- Text documents, code and projects take very little space.
- Photos, music and long WAV exports take a lot. Keep big files on your real device and use *Download to device*.

## Check usage
*Settings → Storage* shows how much is used. In the terminal: \`df -h\` and \`du -sh ~\`.

## Back up
*Settings → Storage → Export backup* downloads one JSON file with all files and settings. **Import backup** restores it — on this or another device.

## Moving to another browser or device
Export a backup, open Cirrus on the other device and import it.

## Starting over
*Settings → Storage → Factory reset* erases everything. Export a backup first!

## Things that clear your data
Clearing browsing data, private/incognito windows and some phone browsers (for files opened from Downloads) may delete local storage. Use regular windows and back up now and then.
`,
    '19 Breeze Chat.md': `# Breeze Chat

Breeze lets you chat with other people on **the same network** — family on the home Wi-Fi, classmates, coworkers — with hand-drawn emojis and doodles.

## How people find each other
Open **Breeze Chat** on two or more devices (or browser tabs). Everyone on the same network lands in the **This network** room automatically and appears under *People here*.

- Devices on one network share the same public internet address, so Breeze uses it to put you in the same room through a public relay.
- Tabs on the **same device** talk to each other directly, even without internet.
- To chat with someone elsewhere, click **+** next to *Rooms* and both enter the same room name (add a password for a private room).

## Privacy
Every message is **end-to-end encrypted** before it leaves your device (AES-256). The relay only sees scrambled data. **Direct messages** — click a person — use a separate key that only the two of you share.
Breeze is still best for friendly chat, not secrets: anyone who knows a room's name and password, or who is on your network, can join that room.

## Emojis and doodles
- Click the smiley for **46 hand-drawn emojis**, or type codes like \`:rocket:\`, \`:heart:\`, \`:party:\`.
- Classic faces turn into emojis too: \`:)\` \`:D\` \`;)\` \`:(\` \`<3\` \`:P\` \`B)\`.
- A message with only one to three emojis is shown big.
- Click the **brush** to draw a doodle and send it. Click a received drawing to save it to *Pictures*.

## More
- **Nudge** (⚡) shakes the other person's window.
- Set your status to *Online*, *Away* or *Busy* (Busy turns off alerts).
- You'll see who is typing, and get a notification when Breeze isn't in front.
- Messages are kept on this device; *Clear history* (eraser) removes them.
`,
    '18 Troubleshooting and FAQ.md': `# Troubleshooting and FAQ

**A website doesn't look right in the Browser.**
Many sites refuse to be shown inside another app, so the Browser's **Auto** mode loads them through a relay (*Compatible* mode) or as a clean *Reader* view. Use the mode button at the left of the address bar to switch between Auto, Direct, Compatible and Reader, and pin a mode per site. YouTube, Vimeo and Spotify links open in their players. Sites that need a login work best with *Open in real browser* from the ⋮ menu.

**curl or wget says “blocked by CORS”.**
Browsers only allow requests to servers that permit it. Try \`curl https://api.github.com/zen\` or \`curl https://httpbin.org/json\`.

**There's no sound.**
Check the volume in quick settings and *Settings → Sound*. Phones need a tap on the screen before any sound can play. The Sound theme must not be *Silent*.

**“Command not found”.**
The terminal tells you which package to install, e.g. \`sudo apt install htop\`.

**I forgot my password.**
If you set a password hint, it appears after two wrong attempts. Otherwise there is no recovery: clear the site's data in your browser (this erases Cirrus and starts the account setup again) or import a backup.

**The screen is too small / too big.**
*Settings → Display → Text size*, or *Desktop & Panel → Mobile layout*.

**Fullscreen doesn't work on my iPhone.**
iPhone Safari doesn't allow web pages to go fullscreen. Use *Share → Add to Home Screen*.

**Storage is full.**
Empty the Trash, delete large pictures or music, or export a backup and reset. See [Storage and backups](17 Storage and Backups.md).

**An app is stuck.**
Close it with ×, or open *System Monitor* (or \`top\`) and end it.

**How do I see these guides again?**
Open **Help** from the app menu or the desktop, look in \`~/Documents/Help\`, or ask Cumulo “how do I …?”.
`,
  };
  OS.helpDocs = DOCS;
  const helpDir = () => OS.home() + '/Documents/Help';
  OS.ensureHelpDocs = (force) => {
    const d = helpDir(); try { OS.fs.mkdir(d, { p: true }); } catch (e) { return; }
    const upd = OS.store.get('help-ver', 1) < 3; if (upd) OS.store.set('help-ver', 3);
    let n = 0; Object.entries(DOCS).forEach(([name, c]) => { const p = OS.fs.join(d, name); if (force || upd || !OS.fs.exists(p)) { OS.fs.write(p, c); n++; } });
    const ds = OS.home() + '/Desktop/Help & Guides.desktop'; if (!OS.store.get('help-desk') && OS.fs.isDir(OS.home() + '/Desktop')) { OS.store.set('help-desk', 1); if (!OS.fs.exists(ds)) OS.fs.write(ds, '[Desktop Entry]\nType=Application\nName=Help & Guides\nExec=help\n'); }
    return n;
  };
  /* search the guides — used by Help Center and Cumulo */
  const STOP = new Set('how do i the a an to can you me my is are what does in on of for with it this that and or be use using get make change'.split(' '));
  OS.searchHelp = (q) => {
    const words = q.toLowerCase().replace(/[^\w\s-]/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
    if (!words.length) return [];
    const out = [];
    Object.entries(DOCS).forEach(([name, text]) => {
      const sections = text.split(/\n(?=## )/);
      sections.forEach((sec) => {
        const low = sec.toLowerCase(); let score = 0;
        words.forEach((w) => { const stem = w.replace(/(ing|ed|es|s)$/, ''); const m = low.split(stem).length - 1; if (m) score += 1 + Math.min(m, 4) * 0.3; if (name.toLowerCase().includes(stem)) score += 1.5; if (/^##? .*/.test(sec) && sec.split('\n')[0].toLowerCase().includes(stem)) score += 2; });
        if (score > 0 && sec.replace(/^#+ .*\n?/, '').trim().length > 30) out.push({ name, title: (sec.match(/^#+ (.*)/m) || [, name])[1], text: sec, score: score / Math.sqrt(1 + sec.length / 900) });
      });
    });
    return out.sort((a, b) => b.score - a.score).slice(0, 8);
  };
  /* small markdown renderer */
  function md(src) {
    const inline = (t) => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])\*([^*\s][^*]*?)\*/g, '$1<i>$2</i>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="#" data-link="$2">$1</a>');
    const lines = src.split('\n'); let h = '', i = 0;
    while (i < lines.length) {
      const l = lines[i];
      if (/^```/.test(l)) { let j = i + 1, code = []; while (j < lines.length && !/^```/.test(lines[j])) code.push(lines[j++]); h += `<pre><code>${esc(code.join('\n'))}</code></pre>`; i = j + 1; continue; }
      if (/^#{1,3} /.test(l)) { const n = l.match(/^#+/)[0].length; h += `<h${n}>${inline(l.slice(n + 1))}</h${n}>`; i++; continue; }
      if (/^\|/.test(l)) { const rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]); const cells = (r) => r.replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim()); const body = rows.filter((r) => !/^\|[\s:|-]+\|$/.test(r)); h += `<table><thead><tr>${cells(body[0]).map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.slice(1).map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`; continue; }
      if (/^\s*([-*]|\d+\.) /.test(l)) { const ord = /^\s*\d+\./.test(l); const items = []; while (i < lines.length && /^\s*([-*]|\d+\.) /.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.) /, '')); h += `<${ord ? 'ol' : 'ul'}>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</${ord ? 'ol' : 'ul'}>`; continue; }
      if (/^> /.test(l)) { h += `<blockquote>${inline(l.slice(2))}</blockquote>`; i++; continue; }
      if (!l.trim()) { i++; continue; }
      const para = []; while (i < lines.length && lines[i].trim() && !/^(#|```|\||>|\s*([-*]|\d+\.) )/.test(lines[i])) para.push(lines[i++]); h += `<p>${inline(para.join(' '))}</p>`;
    }
    return h;
  }
  OS.renderMarkdown = md;

  OS.registerApp({
    id: 'help', name: 'Help & Guides', icon: 'book', color: ['#26a69a', '#2962ff'], cat: 'System', w: 900, h: 640, single: true, desc: 'User guides and help', keywords: 'help guide manual documentation how tutorial faq',
    launch(win, args) {
      OS.ensureHelpDocs();
      let cur = args.doc || OS.store.get('help-last', '00 Welcome.md'), q = '';
      win.body.innerHTML = `<div class="split" style="position:relative"><div class="sidebar hp-side"><div class="sm-search" style="margin:2px 2px 10px;height:38px">${gl('search')}<input placeholder="Search guides" spellcheck="false"></div><div class="hp-list"></div><button class="btn sm" data-a="restore" style="margin:10px 6px;width:calc(100% - 12px)">${gl('refresh')}Restore guides</button></div><div class="scroll hp-main"><div class="toolbar hp-tb"><button class="ibtn side-toggle" data-a="side">${gl('menu')}</button><span class="grow"></span><button class="btn sm" data-a="ask">${gl('sparkle')}Ask Cumulo</button><button class="btn sm" data-a="edit">${gl('edit')}Open as text</button></div><article class="hp-doc"></article></div></div>`;
      const $ = (s) => win.body.querySelector(s), list = $('.hp-list'), docEl = $('.hp-doc'), main = $('.hp-main');
      const files = () => { const d = helpDir(); try { return OS.fs.ls(d).filter((f) => f.type === 'file' && /\.(md|txt)$/i.test(f.name)).map((f) => f.name); } catch (e) { return []; } };
      const title = (n) => n.replace(/^\d+\s*/, '').replace(/\.(md|txt)$/i, '');
      function renderList() {
        if (q) { const res = OS.searchHelp(q); list.innerHTML = res.length ? res.map((r) => `<button class="side-item hp-res" data-doc="${esc(r.name)}"><div style="min-width:0"><b>${esc(r.title)}</b><small>${esc(title(r.name))}</small></div></button>`).join('') : '<div class="muted small pad">No matching guides</div>'; }
        else list.innerHTML = files().map((n) => `<button class="side-item ${n === cur ? 'on' : ''}" data-doc="${esc(n)}">${gl(n.startsWith('00') ? 'home' : 'book')}<span>${esc(title(n))}</span></button>`).join('');
        list.querySelectorAll('[data-doc]').forEach((b) => (b.onclick = () => show(b.dataset.doc)));
      }
      function show(n) {
        let text; try { text = OS.fs.read(OS.fs.join(helpDir(), n)); } catch (e) { text = DOCS[n]; } if (text == null) { text = `# Not found\n\nThe guide “${n}” is missing. Press **Restore guides** to bring the original guides back.`; }
        cur = n; OS.store.set('help-last', n);
        docEl.innerHTML = /\.md$/i.test(n) ? md(text) : `<pre>${esc(text)}</pre>`;
        if (q) { const re = new RegExp(`(${q.split(/\s+/).filter((w) => w.length > 2).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi'); if (re.source !== '()') docEl.querySelectorAll('p,li,td').forEach((e) => { e.innerHTML = e.innerHTML.replace(/(<[^>]+>)|([^<]+)/g, (m, tag, txt) => (tag ? tag : txt.replace(re, '<mark>$1</mark>'))); }); }
        docEl.querySelectorAll('[data-link]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); const l = decodeURIComponent(a.dataset.link); if (/^https?:/.test(l)) OS.wm.open('browser', { url: l }); else show(l); }));
        main.scrollTop = 0; win.setTitle(title(n) + ' — Help'); renderList(); $('.hp-side').classList.remove('open');
      }
      $('.hp-side input').oninput = (e) => { q = e.target.value.trim(); renderList(); };
      $('[data-a=side]').onclick = () => $('.hp-side').classList.toggle('open');
      $('[data-a=edit]').onclick = () => OS.wm.open('editor', { path: OS.fs.join(helpDir(), cur) });
      $('[data-a=ask]').onclick = () => OS.wm.open('assistant');
      $('[data-a=restore]').onclick = () => { OS.ensureHelpDocs(true); OS.notify('Guides restored', 'All help guides are back in ~/Documents/Help', { app: 'help' }); show(cur); };
      const off = OS.on('fs', (d) => { if (d === helpDir()) renderList(); }); win.onClose(off);
      win.onArgs = (a) => { if (a.doc) show(a.doc); };
      show(cur);
    },
  });
})();
