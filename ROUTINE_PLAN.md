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
- **Mobile-first / responsive** (designed for phones).
- **Self-contained** as a single `index.html` when no backend is needed — OR, if it
  uses **Supabase** or the **Gemini free API**, structured for **Vercel**:
  `index.html` plus an `api/` folder containing `app.js`.
- **Planned before coding** (a `PLAN.md` is written first).

---

## Schedule (Europe/Stockholm)

| Day | Local time | Cron (UTC) | Job |
|-----|-----------|------------|-----|
| Monday    | 09:07 | `7 7 * * 1`  | Plan the week's app + scaffold a minimal `index.html` |
| Tuesday   | 09:11 | `11 7 * * 2` | Build the next single checklist item |
| Wednesday | 09:09 | `9 7 * * 3`  | Build the next single checklist item |
| Thursday  | 09:13 | `13 7 * * 4` | Finish one item + polish/bugfix pass |
| Friday    | 08:00 | `0 6 * * 5`  | Package, publish, archive, and deliver |

_Cron is stored in UTC (currently CEST, UTC+2). When Sweden switches to winter time
(CET, UTC+1) the local times shift −1h until the crons are bumped +1h._

Each run is deliberately kept **small** (~15–30 min of focused work): do one chunk,
commit + push, then stop. Small scope keeps every run well under the plan's usage
window so work reliably lands.

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

| Day | Trigger ID |
|-----|-----------|
| Monday    | `trig_01SEpKr5xnNWTFmCNZyzmVgD` |
| Tuesday   | `trig_015MWD4tQziLCN68BfJVftMS` |
| Wednesday | `trig_01SyyotuCngCkSfcd2wKTmAP` |
| Thursday  | `trig_015AGY4ysEX8hvt4r6tb2YZa` |
| Friday    | `trig_018HpFmzPWKVErNYsrVtvu65` |

---

## Notes & caveats

- **Plan:** runs on Pro. Keeping each run small is what keeps it within the usage
  window; if runs ever start getting truncated, a higher tier removes that ceiling.
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
