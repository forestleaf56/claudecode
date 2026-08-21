# Weekly App — Claude Code Cloud Session Routine Plan

This document describes the automated "Weekly App" builder that runs as a set of
Claude Code **cloud-session Routines**. It builds a new mobile-friendly HTML game
or app every week and delivers it every Friday — autonomously, with no manual
action required.

_Last updated: 2026-07-24._

---

## What it does

Every week, on a schedule, the routine:
1. **Plans** a new, ambitious, mobile-friendly HTML game/app (different each week).
2. **Builds** it in small daily increments.
3. **Delivers** a downloadable zip + guide every Friday, and publishes the finished
   app to GitHub.

Each app must be:
- **Varied in kind** — rotate widely across ALL game genres (arcade, puzzle, word,
  trivia, card, board, rhythm, strategy, idle, platformer, simulation, memory,
  typing, …) AND all app types (utilities, creative/drawing/music makers,
  generators, calculators, trackers, timers, visualizers, learning tools, toys, …).
  Not just canvas arcade/puzzle games; each week deliberately picks a category
  different from recent archived weeks so the collection stays diverse.
- **Mobile-first / responsive** (designed for phones).
- **Self-contained** as a single `index.html` when no backend is needed — OR, if it
  uses **Supabase** or the **Gemini free API**, structured for **Vercel**:
  `index.html` plus an `api/` folder containing `app.js`.
- **Planned before coding** (a `PLAN.md` is written first).
- **Production-ready front end** — a **game** gets an atmospheric title screen + menu;
  an **app** gets a proper logo + menu. Aim for a published-indie look: real in-code
  background art (procedural/canvas/SVG/gradient), display typography, a cohesive
  palette, and styled primary/secondary buttons — **never plain rectangles** — plus a
  real menu/pause overlay. Designed in on Monday and pushed toward that bar by the
  Thursday finalize and the daily **14:00 polish passes**.
- **Good graphics + real content** — better visuals (animation, particles, shadows,
  transitions, nicer shapes/sprites) and enough depth (more levels/words/modes) that
  it never feels thin. This is what the 14:00 afternoon passes are for.

---

## Schedule (Europe/Stockholm)

Two runs per weekday: a **morning increment** and a **14:00 second pass** in a fresh
usage window (the ~5-hour window from the morning run has rolled off by 14:00, so the
afternoon run has budget for production-quality polish).

| Day | Local time | Cron (UTC) | Job |
|-----|-----------|------------|-----|
| Monday    | 09:07 | `7 7 * * 1`   | Plan the week's app + scaffold a minimal `index.html` |
| Monday    | 14:12 | `12 12 * * 1` | Polish/content pass — production-ready title/menu, graphics, content |
| Tuesday   | 09:11 | `11 7 * * 2`  | Build the next single checklist item |
| Tuesday   | 14:16 | `16 12 * * 2` | Polish/content pass |
| Wednesday | 09:09 | `9 7 * * 3`   | Build the next single checklist item |
| Wednesday | 14:14 | `14 12 * * 3` | Polish/content pass |
| Thursday  | 09:13 | `13 7 * * 4`  | Finish one item + production-ready front end |
| Thursday  | 14:18 | `18 12 * * 4` | Final polish/content pass (ship-ready for Friday) |
| Friday    | 08:00 | `0 6 * * 5`   | Package, publish, archive, and deliver |
| Friday    | 14:00 | `0 12 * * 5`  | **Delivery second attempt** — finish delivery if the 08:00 run didn't (idempotent: no-op if already delivered) |

_Cron is stored in UTC (currently CEST, UTC+2). When Sweden switches to winter time
(CET, UTC+1) the local times shift −1h until the crons are bumped +1h._

Each **morning** run is kept **small** (one chunk → commit + push → stop) so it lands
well within its usage window. The **14:00** run uses a fresh window to (1) **catch up**
first — if the morning run hit the usage limit and its increment didn't finish, the
afternoon completes it — then (2) invest the rest of the budget in production quality
(title/menu, graphics, content). On **Friday** the 14:00 run instead retries the
delivery if the 08:00 run was cut short (idempotent — no-op if already delivered).

---

## How it runs (mechanism)

- The five Routines are **self-bound** to a persistent Claude Code session
  (`session_01873R7P1veLdw4if6UqqGzz`) in environment `env_01Qzo7s7sRRV9AnMmxvYp86B`.
- On each fire, the scheduled prompt is delivered into that session, which then does
  the work using its own tools (edit files, run/verify in a headless browser, commit,
  push).
- **Why self-bind, not fresh sessions:** the original design spawned a *fresh session
  per fire*, and in this environment those fresh sessions fired but never executed
  ("no output"), so nothing was ever committed. Binding the schedule to an existing,
  working session fixed it — verified by both a timed test and a real Friday run that
  fired autonomously into an idle session.

---

## Outputs

Work happens in the repo **`forestleaf56/claudecode`**, branch
**`claude/pro-plan-extended-session-yvniho`**:

- `weekly-apps/current/` — the app in progress this week (plus `PLAN.md`).
- `weekly-apps/archive/<YYYY-MM-DD>/` — every delivered week (app + `readme.txt` +
  `weekly-app-<date>.zip`).
- **Branch root** (`/index.html`, `/readme.txt`) — always holds the **latest**
  finished app, refreshed every Friday.

Published externally:
- **`forestleaf56/weeklyapp`** (`main`) — the latest finished app is published here
  every Friday, overwriting the previous week's.

Delivered to the user:
- Every Friday, the `weekly-app-<date>.zip` (app + `readme.txt` guide) is sent
  directly, with a short summary.

---

## Friday delivery steps

1. Write `readme.txt` (play/use guide; + Supabase/Gemini setup + Vercel deploy steps
   if the app uses them).
2. Build `weekly-app-<YYYY-MM-DD>.zip` (app files + `readme.txt`).
3. Refresh the **branch root** with this week's app (overwrite the previous one).
4. Commit; archive `weekly-apps/current/*` → `weekly-apps/archive/<date>/`; reset
   `weekly-apps/current/` to `.gitkeep`; commit and push.
5. Publish the app to **`forestleaf56/weeklyapp`** (overwrite, commit, push `main`).
6. Send the zip to the user with a one-line pitch + short summary.

---

## Routine reference (trigger IDs)

| Day | When | Trigger ID |
|-----|------|-----------|
| Monday    | 09:07 | `trig_01SEpKr5xnNWTFmCNZyzmVgD` |
| Monday    | 14:12 | `trig_01AA4eekByuqrkzJSKKzRTd3` |
| Tuesday   | 09:11 | `trig_015MWD4tQziLCN68BfJVftMS` |
| Tuesday   | 14:16 | `trig_01JoVT3LF51UYaMFrQDHtSqM` |
| Wednesday | 09:09 | `trig_01SyyotuCngCkSfcd2wKTmAP` |
| Wednesday | 14:14 | `trig_011vxuwyty3v2zU7EgrF6E8Q` |
| Thursday  | 09:13 | `trig_015AGY4ysEX8hvt4r6tb2YZa` |
| Thursday  | 14:18 | `trig_013hGiWxR4qwg6Q1S4UkJNFw` |
| Friday    | 08:00 | `trig_018HpFmzPWKVErNYsrVtvu65` |
| Friday    | 14:00 | `trig_01TYQ5Qhr7RCjkT43akGS2uU` (delivery retry) |

---

## Notes & caveats

- **Plan / usage:** runs on Pro. The morning run is kept small to land within its
  usage window; the 14:00 run deliberately uses a *fresh* window (~5h later) for
  heavier polish/content. This roughly doubles weekly usage — the trade for
  production-quality output. If a run is still truncated, its work is committed
  incrementally and the next scheduled run continues; a higher tier removes the
  ceiling entirely.
- **Model:** scheduled runs use the environment's default model; the model can't be
  set via the routine API (it's locked) — change it from the claude.ai Routines UI /
  environment settings if needed.
- **weeklyapp access:** publishing to `forestleaf56/weeklyapp` depends on that repo
  staying in the session's GitHub scope. If a container reset ever drops it, the
  Friday run finishes everything else and reports in its message that `weeklyapp`
  needs re-adding — it won't silently fail.

---

## History

- Week of **2026-07-20** — **Orbit Weaver**, a one-thumb neon space arcade game.
