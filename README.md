# Hamnljus · Harbor Light

A cozy, story-driven 2D platformer RPG set in the sleepy Swedish harbor village of Saltvik. Everything is in a single file: open `index.html` in any modern browser.

- **Story:** You inherit Grandma Ingrid's farm. Restore the harbor bit by bit and relight the old lighthouse (21-step main quest plus 26 side quests).
- **Activities:** farming (20 crops, 4 seasons, greenhouse), fishing (38 species incl. legendaries, reel minigame), foraging, mining, tree chopping, cooking (28 dishes), crafting, artisan machines, animals.
- **World:** 8 areas (farm, harbor, forest, beach, cliffs, cave, Lighthouse Isle, greenhouse), day/night cycle, weather, 4 seasonal festivals.
- **People:** 12 villagers with schedules, friendship hearts, gift tastes and rewards.
- **Long-term goals:** 9 harbor projects, museum, 30 hidden golden shells, daily requests, 22 achievements, tool upgrades.
- **Languages:** Svenska and English (switch on the title screen or in Settings).
- **Controls:** keyboard, touch (on-screen D-pad and buttons) and gamepad. Gamepad: A jump / back, B use & talk / confirm, Y menu, LB/RB cycle items. Keyboard: E confirm, Space back. Touch: ✋ confirm, ⤒ back. Fullscreen is on by default (entered on your first tap/click; toggle in Settings).
- **Saving:** autosaves to browser storage every 30 seconds, when you sleep, and when the tab is hidden; "Save & exit" in the menu returns to the title screen. Saves can be exported/imported as text in Settings.

---

# Cirrus Linux (`linux-os/`)

A mobile-friendly Linux-style desktop that runs entirely in the browser. Open `linux-os/index.html` (no build step, works offline except for web features), or use the single-file bundle `linux-os/cirrus-linux.html`.

- **Desktop:** boot screen, lock screen with optional password, wallpaper, desktop icons, panel with pinned and running apps, app menu with search and categories, quick settings, notifications, calendar popup, window overview, context menus (long-press on touch).
- **Windows:** drag, resize, snap to edges, maximize, minimize. On phones, windows open full-screen.
- **File system:** persistent (stored in localStorage), with Trash, import from and download to the real device, and drag-and-drop.
- **Terminal:** bash-like shell with pipes, redirects, `&&`/`||`, variables, `$(...)`, globs, scripts, tab completion and history, plus 140+ commands. Full-screen terminal programs run inside the terminal: `nano`, `vi`/`vim`/`vimtutor`, `less`/`more`, `man`, `top`, `htop`, `watch` and `alsamixer`, with on-screen keys (sticky Ctrl, arrows, program shortcuts) on touch devices. `sudo apt install` installs real packages (cowsay, figlet, sl, cmatrix, lolcat, htop, tree, nodejs, python3, git, jq…), and `curl`, `wget` and `ping` make real network requests.
- **Apps:** Files, Terminal, Browser (tabs, bookmarks, local HTML), Text Editor, Settings (themes, accent colors, wallpapers, users, storage, backup), Software center, Calculator, Image Viewer, System Monitor, Calendar, Clock, Music (synthesized tracks), Paint, Weather (live), Notes, plus installable Camera and Piano.
- **Cumulus Office (installed by default):** Writer (rich text, styles, tables, images, find & replace, export to .doc/HTML/PDF), Sheets (formulas with 50+ functions, formatting, sorting, charts, multiple sheets, CSV import/export) and Slides (themes, text, shapes, images, slideshow mode, HTML export), plus a start center with templates and recent documents.
- **Games:** Snake, Mines, Merge, Block Drop, Memory, Tic-Tac-Toe, plus installable Sudoku, Pong, Bricks and Typing Test.
