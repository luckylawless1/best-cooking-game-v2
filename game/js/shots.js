// shots.js — deterministic demo states for the entry's screenshots.
// One job: put the shift into a photogenic state for ?shot=start|play|serve|end.
// These states are built with the same state functions the live game uses.

import { createShift, startShift, spawnTicket, burstStars } from './state.js';
import { RECIPES } from './config.js';

// A seeded shift, mid-lunch-rush: tickets up, a patty on the grill, an egg
// in the pan, fries in the fryer, and a burger half-built on the plate.
export function buildShotState(name, seed = 7) {
  const state = createShift(seed);
  if (name === 'start') {
    state.phase = 'title';
    return state;
  }
  startShift(state);
  if (name === 'end') {
    state.phase = 'over';
    state.score = 1240;
    state.served = 9;
    state.bestCombo = 4;
    state.combo = 0;
    state.burned = 1;
    state.mistakes = 2;
    state.elapsed = 120;
    state.timeLeft = 0;
    return state;
  }
  // play / serve: a busy mid-shift.
  state.elapsed = 64;
  state.timeLeft = 56;
  state.score = 486;
  state.served = 4;
  state.combo = 3;
  state.bestCombo = 3;
  // Three tickets with draining patience, faces showing three moods.
  state.tickets = [];
  const picks = [RECIPES[5], RECIPES[2], RECIPES[3]];
  const patience = [0.85, 0.5, 0.18];
  for (let i = 0; i < 3; i++) {
    const t = spawnTicket(state);
    t.recipe = picks[i];
    t.patience = t.patienceMax * patience[i];
    t.wantsFries = i === 1;
  }
  // Grill: patty READY, egg mid-fry, fries golden.
  state.grill = { t: 4.2 };
  state.grillReady = true;
  state.egg = { t: 2.0 };
  state.fryer = { t: 9.5 };
  state.fryerReady = true;
  state.chopping = { veggie: 'lettuce', clicks: 1 };
  if (name === 'serve') {
    // Plate matches the Garden ticket exactly, fries on the side: ready to serve.
    state.plate = ['bun', 'patty', 'lettuce', 'tomato', 'bun'];
    state.plateFries = true;
    state.flash = {
      text: 'READY TO SERVE!',
      sub: 'Garden + fries — press SPACE',
      color: '#7ec850',
      until: 9999,
    };
    burstStars(state, 640, 620);
  } else {
    // Mid-assembly: bottom bun, patty, lettuce on the plate so far.
    state.plate = ['bun', 'patty', 'lettuce'];
  }
  return state;
}
