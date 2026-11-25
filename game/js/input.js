// input.js — mouse and keyboard, translated into shift actions.
// One job: decide what a click or a key means, then call state.js / sounds.

import { STATIONS, VEGGIES, PLATE, COOK } from './config.js';
import {
  startShift, servePlate, clearPlate, burstStars,
} from './state.js';

function inside(x, y, box) {
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}

export function stationAt(state, x, y) {
  for (const veg of VEGGIES) {
    if (inside(x, y, veg)) return veg.id;
  }
  for (const st of STATIONS) {
    if (inside(x, y, st)) return st.id;
  }
  if (inside(x, y, PLATE)) return 'plate';
  return null;
}

export function hoverAt(state, x, y) {
  state.hoverStation = stationAt(state, x, y);
}

// Every station action. Returns a sound name (or null) for the caller to play.
export function activateStation(state, id) {
  if (state.phase !== 'playing') return null;

  if (id === 'bun' || id === 'cheese' || id === 'sauce') {
    state.plate.push(id);
    return 'place';
  }

  if (id === 'grill') {
    if (state.grill && state.grillReady) {
      state.plate.push('patty');
      state.grill = null;
      state.grillReady = false;
      return 'place';
    }
    if (!state.grill) {
      state.grill = { t: 0 };
      return 'fry';
    }
    return null; // still cooking — nothing to do yet
  }

  if (id === 'egg') {
    if (state.egg && state.eggReady) {
      state.plate.push('egg');
      state.egg = null;
      state.eggReady = false;
      return 'place';
    }
    if (!state.egg) {
      state.egg = { t: 0 };
      return 'fry';
    }
    return null;
  }

  if (id === 'fryer') {
    if (state.fryer && state.fryerReady) {
      state.plateFries = true;
      state.fryer = null;
      state.fryerReady = false;
      return 'place';
    }
    if (!state.fryer) {
      state.fryer = { t: 0 };
      return 'fry';
    }
    return null;
  }

  if (id === 'lettuce' || id === 'tomato') {
    if (!state.chopping || state.chopping.veggie !== id) {
      state.chopping = { veggie: id, clicks: 0 };
      return 'place';
    }
    return null;
  }

  if (id === 'board') {
    if (!state.chopping) return null;
    state.chopping.clicks += 1;
    if (state.chopping.clicks >= COOK.chopClicks) {
      state.plate.push(state.chopping.veggie);
      state.chopping = null;
      return 'chop';
    }
    return 'chop';
  }

  if (id === 'plate') {
    return tryServe(state);
  }
  return null;
}

export function tryServe(state) {
  const result = servePlate(state);
  if (result) {
    burstStars(state, PLATE.x + PLATE.w / 2, PLATE.y + 20);
    return 'serve';
  }
  return 'error';
}

export function handleKey(state, key, sound) {
  const k = key.toLowerCase();
  if (k === 'm') {
    const muted = sound.toggleMute();
    state.muted = muted;
    return null;
  }
  if (state.phase === 'title' && (k === 'enter' || k === ' ')) {
    startShift(state);
    return 'pop';
  }
  if (state.phase === 'over' && k === 'r') {
    startShift(state);
    return 'pop';
  }
  if (state.phase === 'playing' && k === 'p') {
    state.phase = 'paused';
    return null;
  }
  if (state.phase === 'paused' && k === 'p') {
    state.phase = 'playing';
    return null;
  }
  if (state.phase !== 'playing') return null;
  if (k === 'r') {
    startShift(state);
    return 'pop';
  }
  if (k === ' ') return tryServe(state);
  if (k === 'backspace') {
    clearPlate(state);
    return 'pop';
  }
  const byKey = {
    1: 'bun', 2: 'grill', 3: 'lettuce', 4: 'tomato',
    5: 'cheese', 6: 'sauce', 7: 'egg', 8: 'fryer',
  };
  if (byKey[k]) return activateStation(state, byKey[k]);
  return null;
}
