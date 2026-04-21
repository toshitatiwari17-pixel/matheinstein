# MathEinstein

Formula-training abacus system (MVP v3) — built from `MathEinstein_PRD.pdf`.

## Features

- Interactive soroban abacus + trick-selection training
- Guided / Recall / Mixed practice modes
- Multi-step **Dictation** drill (audio-only)
- **Chained Practice** (audio multi-step inside sessions)
- Level system (L1 small friends → L2 big friends → L3 two-digit)
- Per-trick accuracy analytics + local tutor dashboard
- **Live Teacher ↔ Student sync** (multi-student rooms)
- **Gamification**: XP, levels, streak, coins, confetti, sound FX

## Run

```bash
npm install
npm start
# open http://localhost:8787
```

## Classroom mode

1. Teacher opens the app, picks Role = **Teacher**, Room = `CLASS-1`.
2. Each student opens the same URL (even on phones/tablets in same LAN or via tunnelling), picks Role = **Student**, enters same Room, types their name.
3. Teacher sees every student's live abacus grid.
4. Teacher can **Push Question** to all, **Nudge** (show trick) for one, or **Take control** to move beads.
5. Student apps lock to the **first teacher command** they receive in that room (active-teacher lock) to avoid conflicting instructions.
6. Teacher can use **Claim Class / Release Class**; students can use **Unlock Teacher** to switch control without rejoining.

## Architecture

- `index.html` — single-page app (Tailwind CDN + vanilla JS).
- `server.js` — Node HTTP + WebSocket relay (`ws`), multi-room broadcast.
- `package.json` — dependency manifest.

The client falls back to `BroadcastChannel` when no WebSocket is configured, so multi-tab testing on one machine still works.

## Not in MVP

Per PRD: advanced bead AI, full teacher sync (LMS), multi-level curriculum expansion, worksheet imports.
