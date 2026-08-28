FATHOM — a pocket ocean
Week of 2026-08-28

================================================================
WHAT IT IS
================================================================
Fathom is a cozy pocket aquarium — an ambient simulation / idle game.
You keep a small living tank of procedurally-drawn fish that drift and
school with gentle flocking behaviour. Tap the water to sprinkle food;
fish dart to it and earn you "pearls". Pearls also trickle in over time.
Spend them in the shop to unlock new fish species and décor. A slow
day-to-night cycle changes the light and brings glowing species to life
after dark. Everything is drawn in code — no images, no downloads, no
accounts.

================================================================
HOW TO RUN
================================================================
Just open index.html in any modern browser (desktop or mobile). It is a
single self-contained file — no server, no build step, no install.
- On a phone: open the file (or host it anywhere static) and add to home
  screen for a full-screen feel.
- Nothing to configure. No API keys, no environment variables, no backend.

================================================================
HOW TO PLAY
================================================================
1. TITLE SCREEN — press PLAY to dive in. HOW TO and COLLECTION are also
   reachable from here.
2. FEED — tap/click anywhere in the water. Food pellets sink; nearby fish
   swim over and eat them. Each bite gives you +2 pearls and a happy pop.
3. EARN — pearls also accrue slowly on their own; a bigger, busier tank
   earns a little faster.
4. SHOP — open the ☰ menu, then SHOP. Buy any of 7 fish species and 4
   décor pieces. The Buy button greys out when you can't afford it.
5. COLLECTION — see every species, how many you own, and which are still
   locked (dimmed).
6. DAY / NIGHT — the tank slowly cycles (~90s). After dark the god-rays
   fade and bioluminescent species (neon tetra, lanternfish) start to
   glow. Watch the ☀ / 🌙 indicator in the top bar.
7. SOUND — a soft ambient drone plays with gentle blips when you feed,
   when fish eat, and when you buy. Toggle it with the 🔈 / 🔇 button in
   the top bar.

================================================================
FEATURES
================================================================
- Live animated underwater title screen (depth gradient, drifting
  god-rays, rising bubbles, silhouette fish) with a serif FATHOM wordmark
  and styled gold/teal buttons.
- Procedural fish that wander, seek food, school (cohesion / alignment /
  separation) and avoid the tank edges, each facing its heading.
- 7 species (Guppy, Neon Tetra, Ember, Sunny, Angelfish, Koi, Lumen) and
  4 décor pieces (kelp, rock, coral, shipwreck).
- Tap-to-feed with sinking pellets, feeding ripples, and a pearl economy.
- A shop with per-item pricing and affordability, plus a Collection
  catalogue.
- A ~90-second day/night cycle with bioluminescence at night.
- Ambient WebAudio (drone pad + feed/eat/buy blips) with a mute toggle.
- Everything (pearls, fish owned, décor, sound setting) saves
  automatically to your browser's localStorage — close and come back and
  your tank is exactly as you left it.

================================================================
TECH
================================================================
- Single self-contained index.html: HTML + CSS + JavaScript + Canvas 2D.
- No backend, no Supabase, no Gemini API — so NO API keys, NO env vars,
  and NO api/ folder / Vercel serverless setup are needed.
- Mobile-first, full-viewport responsive canvas, touch to feed, no page
  scrolling.
- Saves to localStorage under the keys 'fathom_save' and 'fathom_sound'.

Enjoy your pocket ocean.
