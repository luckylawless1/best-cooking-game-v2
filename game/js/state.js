// state.js — the shift itself: tickets, the plate, the cookers, score and combo.
// One job: hold the rules and the numbers. It draws nothing and hears nothing.

import {
  SHIFT_SECONDS, RUSH_AT_SECONDS_LEFT, RECIPES, COOK, PATIENCE_BASE,
  PATIENCE_MIN, PATIENCE_STEP, SPAWN_EVERY, SPAWN_RUSH, MAX_TICKETS,
  SCORE, CUSTOMERS,
} from './config.js';

export function makeRng(seed) {
  let s = seed >>> 0 || 1;
  return function rng() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function createShift(seed = 1) {
  const rng = makeRng(seed);
  return {
    phase: 'title', // title | playing | paused | over
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    score: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    mistakes: 0,
    burned: 0,
    tickets: [],
    plate: [],          // burger stack, bottom bun first
    plateFries: false, // side of fries on the plate
    grill: null,        // { t } seconds on the grill
    grillReady: false,
    egg: null,
    eggReady: false,
    fryer: null,
    fryerReady: false,
    chopping: null,     // { veggie, clicks }
    spawnTimer: 0,
    ticketCount: 0,
    rng,
    flash: null,        // { text, sub, color, until }
    particles: [],
    muted: false,
    rushAnnounced: false,
    lastTickSecond: -1,
  };
}

export function isRush(state) {
  return state.timeLeft <= RUSH_AT_SECONDS_LEFT && state.phase === 'playing';
}

export function shiftProgress(state) {
  return Math.min(1, state.elapsed / SHIFT_SECONDS);
}

function pickRecipe(rng, ticketCount) {
  // Early tickets are easy; the full menu unlocks as the shift goes on.
  const pool = ticketCount < 2 ? RECIPES.slice(0, 3)
    : ticketCount < 5 ? RECIPES.slice(0, 5)
    : RECIPES;
  return pool[Math.floor(rng() * pool.length)];
}

export function spawnTicket(state) {
  if (state.tickets.length >= MAX_TICKETS) return null;
  const recipe = pickRecipe(state.rng, state.ticketCount);
  const patience = Math.max(
    PATIENCE_MIN,
    PATIENCE_BASE - state.ticketCount * PATIENCE_STEP,
  );
  const customer = CUSTOMERS[state.ticketCount % CUSTOMERS.length];
  const ticket = {
    id: state.ticketCount + 1,
    recipe,
    wantsFries: state.ticketCount >= 3 && state.rng() < 0.45,
    patience,
    patienceMax: patience,
    customer,
    born: state.elapsed,
  };
  state.ticketCount += 1;
  state.tickets.push(ticket);
  return ticket;
}

export function startShift(state) {
  state.phase = 'playing';
  state.timeLeft = SHIFT_SECONDS;
  state.elapsed = 0;
  state.score = 0;
  state.served = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.mistakes = 0;
  state.burned = 0;
  state.tickets = [];
  state.plate = [];
  state.plateFries = false;
  state.grill = null;
  state.grillReady = false;
  state.egg = null;
  state.eggReady = false;
  state.fryer = null;
  state.fryerReady = false;
  state.chopping = null;
  state.spawnTimer = 0;
  state.ticketCount = 0;
  state.flash = null;
  state.particles = [];
  state.rushAnnounced = false;
  spawnTicket(state);
}

export function plateMatchesTicket(plate, plateFries, ticket) {
  if (plate.length !== ticket.recipe.stack.length) return false;
  for (let i = 0; i < plate.length; i++) {
    if (plate[i] !== ticket.recipe.stack[i]) return false;
  }
  if (ticket.wantsFries && !plateFries) return false;
  return true;
}

export function findServableTicket(state) {
  return state.tickets.find((t) => plateMatchesTicket(state.plate, state.plateFries, t));
}

// Serve the plate to the first ticket it matches. Returns the served ticket or null.
export function servePlate(state) {
  const ticket = findServableTicket(state);
  if (!ticket) {
    state.combo = 0;
    state.mistakes += 1;
    return null;
  }
  const patienceLeft = Math.max(0, ticket.patience / ticket.patienceMax);
  const patienceBonus = Math.round(SCORE.patienceBonusMax * patienceLeft);
  const comboBonus = state.combo * SCORE.comboStep;
  let points = ticket.recipe.price + patienceBonus + comboBonus;
  if (ticket.wantsFries && state.plateFries) points += SCORE.friesBonus;
  if (isRush(state)) points *= 2;
  state.score += points;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.tickets = state.tickets.filter((t) => t !== ticket);
  state.plate = [];
  state.plateFries = false;
  state.flash = {
    text: `+${points}`,
    sub: `${ticket.recipe.name} served to ${ticket.customer.name}` +
      (state.combo > 1 ? `  ·  COMBO x${state.combo}` : ''),
    color: '#7ec850',
    until: state.elapsed + 1.4,
  };
  return { ticket, points };
}

export function clearPlate(state) {
  state.plate = [];
  state.plateFries = false;
  state.chopping = null;
}

// One simulation step (dt seconds). Returns a list of sound events to play.
export function tickShift(state, dt) {
  const sounds = [];
  if (state.phase !== 'playing') return sounds;
  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);

  if (!state.rushAnnounced && isRush(state)) {
    state.rushAnnounced = true;
    sounds.push('rush');
    state.flash = {
      text: 'RUSH HOUR!',
      sub: 'Double points for the last 30 seconds',
      color: '#ff9d2e',
      until: state.elapsed + 2,
    };
  }

  const whole = Math.ceil(state.timeLeft);
  if (whole <= 10 && whole !== state.lastTickSecond) {
    state.lastTickSecond = whole;
    sounds.push('tick');
  }

  // Tickets arrive on a timer.
  state.spawnTimer += dt;
  const every = isRush(state) ? SPAWN_RUSH : SPAWN_EVERY;
  if (state.spawnTimer >= every) {
    state.spawnTimer = 0;
    spawnTicket(state);
  }

  // Patience drains; a ticket that runs out walks away angry.
  for (const t of [...state.tickets]) {
    t.patience -= dt;
    if (t.patience <= 0) {
      state.tickets = state.tickets.filter((x) => x !== t);
      state.combo = 0;
      state.mistakes += 1;
      state.flash = {
        text: `${t.customer.name} walked out!`,
        sub: 'Ticket expired — combo lost',
        color: '#e84a3a',
        until: state.elapsed + 1.6,
      };
      sounds.push('error');
    }
  }

  // Grill: patty cooks, then burns.
  if (state.grill) {
    state.grill.t += dt;
    if (!state.grillReady && state.grill.t >= COOK.pattyReady) {
      state.grillReady = true;
      sounds.push('ready');
    }
    if (state.grill.t >= COOK.pattyBurn) {
      state.grill = null;
      state.grillReady = false;
      state.burned += 1;
      state.combo = 0;
      sounds.push('burn');
      state.flash = {
        text: 'Patty burned!',
        sub: 'Grill cleared — watch the timer',
        color: '#e84a3a',
        until: state.elapsed + 1.6,
      };
    }
  }

  // Egg pan: same rhythm, faster.
  if (state.egg) {
    state.egg.t += dt;
    if (!state.eggReady && state.egg.t >= COOK.eggReady) {
      state.eggReady = true;
      sounds.push('ready');
    }
    if (state.egg.t >= COOK.eggBurn) {
      state.egg = null;
      state.eggReady = false;
      state.burned += 1;
      state.combo = 0;
      sounds.push('burn');
      state.flash = {
        text: 'Egg burned!',
        sub: 'Pan cleared — watch the timer',
        color: '#e84a3a',
        until: state.elapsed + 1.6,
      };
    }
  }

  // Fryer: fries cook slow, burn slow.
  if (state.fryer) {
    state.fryer.t += dt;
    if (!state.fryerReady && state.fryer.t >= COOK.friesReady) {
      state.fryerReady = true;
      sounds.push('ready');
    }
    if (state.fryer.t >= COOK.friesBurn) {
      state.fryer = null;
      state.fryerReady = false;
      state.burned += 1;
      state.combo = 0;
      sounds.push('burn');
      state.flash = {
        text: 'Fries burned!',
        sub: 'Fryer cleared — watch the timer',
        color: '#e84a3a',
        until: state.elapsed + 1.6,
      };
    }
  }

  // Particles drift and fade.
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);

  if (state.timeLeft <= 0) {
    state.phase = 'over';
    sounds.push('end');
  }
  return sounds;
}

// Smoke puffs above a cooker, called every frame while something cooks.
export function puffSmoke(state, x, y, count = 1) {
  for (let i = 0; i < count; i++) {
    state.particles.push({
      x: x + (state.rng() - 0.5) * 40,
      y,
      vx: (state.rng() - 0.5) * 12,
      vy: -28 - state.rng() * 18,
      r: 5 + state.rng() * 7,
      life: 0.9 + state.rng() * 0.5,
      maxLife: 1.4,
      kind: 'smoke',
    });
  }
}

export function burstStars(state, x, y) {
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    state.particles.push({
      x, y,
      vx: Math.cos(a) * 90,
      vy: Math.sin(a) * 90 - 40,
      r: 3 + state.rng() * 3,
      life: 0.7,
      maxLife: 0.7,
      kind: 'star',
    });
  }
}
