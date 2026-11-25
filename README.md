# best-cooking-game-v2

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/luckylawless1/best-cooking-game-v2/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/luckylawless1/best-cooking-game-v2/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Sizzle & Serve v2 — a burger-stall rush game, rebuilt and improved for the re-submit cycle. You run a burger stall for one 120-second lunch shift: tickets arrive on the order board, you grill patties, fry eggs, chop lettuce and tomato, stack burgers on the plate exactly as ordered, and serve before each customer's patience runs out. Combos grow with every clean serve, and the last 30 seconds are Rush Hour with double points.

## What is new in v2

- **Six recipes** — Classic, Cheese Melt, Garden, Sunrise Stack (new, with a fried egg), Double Trouble, The Works.
- **Fries side station** — the fryer cooks a golden side in 8 seconds; tickets that ask for fries pay +50.
- **Egg pan** — a second cooker with its own timing and burn risk.
- **Animated customers** — every ticket shows its customer's face, and the mood shifts from happy to worried to angry as patience drains; ticket borders go green → amber → red.
- **Grill smoke and sizzle** — smoke puffs rise off the cookers, the sizzle loops while anything cooks, and a READY / BURNING flag hangs above the grill.
- **Visible combo meter** — a flame bar under the shift progress bar; combos pay +10 per step.
- **Pause (P) and a tutorial start overlay** — the shift waits for you.
- **Shift-progress bar** — the whole lunch shift reads in a glance.
- **Sound polish** — distinct sizzle, chop, fry-drop, ready ding, serve chime, error buzz and Rush Hour horn, all synthesised live with WebAudio.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network — the game is plain static files under `game/`.

## How to play

- Click a station (or press 1–8): Bun, Grill, Lettuce, Tomato, Cheese, Sauce, Egg, Fries.
- Grill: click to start a patty, click again when it is READY — leave it too long and it burns. Egg pan and fryer work the same way, on their own timers.
- Chopping board: pick a veggie (3 or 4), then click the board twice to chop it onto the plate.
- Space serves the plate when it matches a ticket; Backspace clears it. P pauses, R restarts, M mutes.
- Score: recipe price per dish + a patience bonus + 10 per combo step, doubled in Rush Hour; +50 for fries when the ticket asks for them.

## Layout

- `main.ts` — the entry program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.
- `game/` — the playable game: `index.html`, `css/style.css`, and `js/` split by job (config, state, render, input, audio, shots).
- `screenshots/` — 4 real renders of the game's own code (title, mid-shift, serve, shift over).
- `vendor/makefun-game.ts` — the kit's dossier library, copied unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?ref=sv4ravjn&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
