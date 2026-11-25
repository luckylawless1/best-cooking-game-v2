// main.js — the game loop and the wiring between state, input, sound and render.
// One job: boot the canvas, run the shift, and route every event to the right place.

import { CANVAS_W, CANVAS_H, SHIFT_SECONDS } from './config.js';
import {
  createShift, tickShift, puffSmoke, startShift,
} from './state.js';
import { SoundBoard } from './audio.js';
import { drawGame } from './render.js';
import { stationAt, hoverAt, activateStation, handleKey } from './input.js';
import { buildShotState } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1');

const sound = new SoundBoard();
let state = shotName ? buildShotState(shotName, seed) : createShift(seed);

// Debug handle the playtest uses: read-only state, plus the actions it drives.
window.SizzleServe = {
  state: () => state,
  sound: () => sound,
  start: () => { sound.ensure(); },
};

function playSound(name) {
  sound.ensure();
  switch (name) {
    case 'chop': sound.chop(); break;
    case 'pop': sound.pop(); break;
    case 'place': sound.place(); break;
    case 'fry': sound.fryDrop(); break;
    case 'ready': sound.readyDing(); break;
    case 'serve': sound.serveDing(); break;
    case 'error': sound.errorBuzz(); break;
    case 'tick': sound.tick(); break;
    case 'burn': sound.burnAlarm(); break;
    case 'rush': sound.rushHorn(); break;
    default: break;
  }
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (CANVAS_W / rect.width),
    y: (event.clientY - rect.top) * (CANVAS_H / rect.height),
  };
}

canvas.addEventListener('pointermove', (event) => {
  const p = canvasPoint(event);
  hoverAt(state, p.x, p.y);
});

canvas.addEventListener('pointerdown', (event) => {
  sound.ensure();
  const p = canvasPoint(event);
  if (state.phase === 'title') {
    startShift(state);
    playSound('pop');
    return;
  }
  if (state.phase === 'over') {
    return; // R restarts from here
  }
  const id = stationAt(state, p.x, p.y);
  if (id) playSound(activateStation(state, id));
});

window.addEventListener('keydown', (event) => {
  if ([' ', 'Backspace'].includes(event.key)) event.preventDefault();
  const name = handleKey(state, event.key, sound);
  if (name) playSound(name);
});

let last = performance.now();
let smokeTimer = 0;

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  if (state.phase === 'playing') {
    const sounds = tickShift(state, dt);
    for (const s of sounds) playSound(s);
    // Sizzle loop while anything cooks; smoke puffs above the cookers.
    const cooking = Boolean(state.grill || state.egg || state.fryer);
    if (cooking) sound.startSizzle();
    else sound.stopSizzle();
    smokeTimer += dt;
    if (smokeTimer > 0.12) {
      smokeTimer = 0;
      if (state.grill) puffSmoke(state, 290, 500);
      if (state.egg) puffSmoke(state, 1015, 500);
      if (state.fryer) puffSmoke(state, 1175, 500);
    }
  } else {
    sound.stopSizzle();
  }

  drawGame(ctx, state);
  requestAnimationFrame(frame);
}

drawGame(ctx, state);
requestAnimationFrame(frame);
