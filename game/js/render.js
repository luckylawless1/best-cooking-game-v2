// render.js — everything the player sees, drawn on one canvas.
// One job: paint the kitchen, the order board, the stations and the plate.
// It never changes the rules; it only reads the shift state.

import {
  CANVAS_W, CANVAS_H, STATIONS, VEGGIES, PLATE, INGREDIENTS,
  COOK, RUSH_AT_SECONDS_LEFT,
} from './config.js';
import { isRush, shiftProgress } from './state.js';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function patienceColor(frac) {
  if (frac > 0.5) return '#7ec850';
  if (frac > 0.25) return '#ffcf3d';
  return '#e84a3a';
}

function moodOf(frac) {
  if (frac > 0.6) return 'happy';
  if (frac > 0.3) return 'worried';
  return 'angry';
}

// A little customer face: skin, hair, eyes and a mouth that follows the mood.
export function drawCustomerFace(ctx, cx, cy, r, customer, mood) {
  // hair back
  ctx.fillStyle = customer.hair;
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.15, r * 1.02, Math.PI, 0);
  if (customer.style === 'long') {
    ctx.fillRect(cx - r, cy - r * 0.2, r * 0.35, r * 1.1);
    ctx.fillRect(cx + r * 0.65, cy - r * 0.2, r * 0.35, r * 1.1);
  }
  if (customer.style === 'bun') {
    ctx.beginPath(); ctx.arc(cx, cy - r * 1.05, r * 0.35, 0, Math.PI * 2); ctx.fill();
  }
  if (customer.style === 'spiky') {
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * r * 0.4 - r * 0.18, cy - r * 0.75);
      ctx.lineTo(cx + i * r * 0.4, cy - r * 1.25);
      ctx.lineTo(cx + i * r * 0.4 + r * 0.18, cy - r * 0.75);
      ctx.fill();
    }
  }
  // face
  ctx.fillStyle = customer.skin;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // hair front fringe
  ctx.fillStyle = customer.hair;
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.35, r * 0.95, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();
  // eyes
  const eyeY = cy - r * 0.05;
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(cx - r * 0.35, eyeY, r * 0.11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.35, eyeY, r * 0.11, 0, Math.PI * 2); ctx.fill();
  if (mood === 'angry') {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.55, eyeY - r * 0.3);
    ctx.lineTo(cx - r * 0.15, eyeY - r * 0.1);
    ctx.moveTo(cx + r * 0.55, eyeY - r * 0.3);
    ctx.lineTo(cx + r * 0.15, eyeY - r * 0.1);
    ctx.stroke();
  }
  // mouth
  ctx.strokeStyle = '#7a3a22';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (mood === 'happy') {
    ctx.arc(cx, cy + r * 0.25, r * 0.35, 0.15 * Math.PI, 0.85 * Math.PI);
  } else if (mood === 'worried') {
    ctx.arc(cx, cy + r * 0.75, r * 0.3, 1.15 * Math.PI, 1.85 * Math.PI);
  } else {
    ctx.moveTo(cx - r * 0.3, cy + r * 0.55);
    ctx.lineTo(cx + r * 0.3, cy + r * 0.55);
  }
  ctx.stroke();
}

function drawIngredientIcon(ctx, x, y, w, h, id) {
  const ing = INGREDIENTS[id];
  ctx.save();
  if (id === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.42, w * 0.42, h * 0.3, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(x + w * 0.12, y + h * 0.42, w * 0.76, h * 0.12);
    ctx.fillStyle = ing.dark;
    for (const sx of [0.3, 0.5, 0.7]) {
      ctx.beginPath(); ctx.arc(x + w * sx, y + h * 0.28, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = ing.color;
    roundRect(ctx, x + w * 0.08, y + h * 0.3, w * 0.84, h * 0.42, 6);
    ctx.fill();
    ctx.fillStyle = ing.dark;
    for (const sx of [0.25, 0.5, 0.75]) {
      ctx.beginPath(); ctx.arc(x + w * sx, y + h * 0.5, 2, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, y + h * 0.6);
    ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.1, x + w * 0.5, y + h * 0.55);
    ctx.quadraticCurveTo(x + w * 0.7, y + h * 0.1, x + w * 0.9, y + h * 0.6);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'tomato') {
    ctx.fillStyle = ing.color;
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w * 0.36, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffb3a3';
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w * 0.2, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, y + h * 0.75);
    ctx.lineTo(x + w * 0.9, y + h * 0.75);
    ctx.lineTo(x + w * 0.9, y + h * 0.3);
    ctx.lineTo(x + w * 0.5, y + h * 0.55);
    ctx.lineTo(x + w * 0.1, y + h * 0.3);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'sauce') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.15, y + h * 0.3);
    ctx.quadraticCurveTo(x + w * 0.35, y + h * 0.7, x + w * 0.5, y + h * 0.3);
    ctx.quadraticCurveTo(x + w * 0.65, y + h * 0.7, x + w * 0.85, y + h * 0.3);
    ctx.lineTo(x + w * 0.85, y + h * 0.65);
    ctx.lineTo(x + w * 0.15, y + h * 0.65);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'egg') {
    ctx.fillStyle = '#fffdf2';
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w * 0.38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffcf3d';
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w * 0.2, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'fries') {
    ctx.fillStyle = '#e84a3a';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.15, y + h * 0.35);
    ctx.lineTo(x + w * 0.85, y + h * 0.35);
    ctx.lineTo(x + w * 0.75, y + h * 0.9);
    ctx.lineTo(x + w * 0.25, y + h * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.color;
    for (const sx of [0.3, 0.5, 0.7]) {
      ctx.fillRect(x + w * sx - 3, y + h * 0.08, 6, h * 0.35);
    }
  }
  ctx.restore();
}

function drawKitchenBackdrop(ctx, state) {
  // Wall tiles and floor.
  ctx.fillStyle = '#3d2c1e';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#57402c';
  for (let x = 0; x < CANVAS_W; x += 80) {
    for (let y = 0; y < 150; y += 40) {
      ctx.fillRect(x + 1, y + 1, 78, 38);
    }
  }
  ctx.fillStyle = '#2a1c11';
  ctx.fillRect(0, 150, CANVAS_W, 10);
  // Counter top.
  const grad = ctx.createLinearGradient(0, 380, 0, 470);
  grad.addColorStop(0, '#8a5a30');
  grad.addColorStop(1, '#6b4423');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 380, CANVAS_W, 90);
  ctx.fillStyle = '#a9743f';
  ctx.fillRect(0, 380, CANVAS_W, 6);
  // Floor below the counter.
  ctx.fillStyle = '#241811';
  ctx.fillRect(0, 600, CANVAS_W, CANVAS_H - 600);
  // Hanging sign, low on the wall so it clears the shift-progress bar.
  ctx.fillStyle = '#ffcf3d';
  roundRect(ctx, 470, 100, 340, 46, 10);
  ctx.fill();
  ctx.fillStyle = '#5a2c12';
  ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SIZZLE & SERVE', 640, 124);
  // Window with a street view, for a kitchen with a look of its own.
  ctx.fillStyle = '#7ec8e8';
  roundRect(ctx, 40, 20, 180, 110, 8);
  ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath(); ctx.arc(180, 55, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7ec850';
  ctx.fillRect(40, 105, 180, 25);
  ctx.fillStyle = '#3d2c1e';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.fillText('BURGER STALL · LUNCH RUSH', 130, 145);
}

function drawOrderBoard(ctx, state) {
  ctx.fillStyle = '#f5e6c8';
  roundRect(ctx, 20, 170, 1240, 200, 12);
  ctx.fill();
  ctx.fillStyle = '#5a2c12';
  ctx.font = 'bold 18px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('ORDER BOARD', 36, 196);
  ctx.font = '13px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#8a6a45';
  ctx.fillText('serve the plate exactly as ticketed — fries on the side when asked', 170, 196);

  if (state.tickets.length === 0) {
    ctx.fillStyle = '#8a6a45';
    ctx.font = 'italic 16px "Trebuchet MS", sans-serif';
    ctx.fillText('No orders yet — the lunch crowd is on its way…', 36, 280);
    return;
  }
  state.tickets.forEach((ticket, i) => {
    const x = 36 + i * 305;
    const y = 206;
    const w = 290;
    const h = 150;
    const frac = Math.max(0, ticket.patience / ticket.patienceMax);
    const color = patienceColor(frac);
    // Ticket card, coloured by urgency.
    ctx.fillStyle = '#fffdf2';
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    roundRect(ctx, x, y, w, h, 10);
    ctx.stroke();
    // Customer face + name.
    drawCustomerFace(ctx, x + 34, y + 38, 24, ticket.customer, moodOf(frac));
    ctx.fillStyle = '#3d2c1e';
    ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(ticket.customer.name, x + 66, y + 30);
    ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
    ctx.fillText(ticket.recipe.name, x + 66, y + 52);
    // Recipe stack, left to right.
    let ix = x + 12;
    const iy = y + 76;
    for (const ing of ticket.recipe.stack) {
      drawIngredientIcon(ctx, ix, iy, 30, 30, ing);
      ix += 32;
    }
    if (ticket.wantsFries) {
      drawIngredientIcon(ctx, ix + 4, iy, 30, 30, 'fries');
      ctx.fillStyle = '#e84a3a';
      ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
      ctx.fillText('+ FRIES', ix + 38, iy + 20);
    }
    // Patience bar.
    ctx.fillStyle = '#e8dcc0';
    roundRect(ctx, x + 12, y + 122, w - 24, 12, 6);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, x + 12, y + 122, (w - 24) * frac, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#3d2c1e';
    ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.ceil(ticket.patience)}s`, x + w - 12, y + 118);
    ctx.textAlign = 'left';
  });
}

function drawHud(ctx, state) {
  const rush = isRush(state);
  // Timer.
  const mm = Math.floor(state.timeLeft / 60);
  const ss = Math.floor(state.timeLeft % 60).toString().padStart(2, '0');
  ctx.fillStyle = rush ? '#e84a3a' : '#fffdf2';
  roundRect(ctx, 1020, 20, 220, 56, 10);
  ctx.fill();
  ctx.fillStyle = rush ? '#fff' : '#3d2c1e';
  ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${mm}:${ss}`, 1130, 49);
  if (rush) {
    ctx.fillStyle = '#ff9d2e';
    ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
    ctx.fillText('RUSH HOUR ×2', 1130, 88);
  }
  // Shift progress bar.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, 240, 24, 560, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#ffcf3d';
  roundRect(ctx, 240, 24, 560 * shiftProgress(state), 12, 6);
  ctx.fill();
  ctx.fillStyle = '#f5e6c8';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUNCH SHIFT', 520, 54);
  // Score + combo meter.
  ctx.fillStyle = '#fffdf2';
  roundRect(ctx, 1020, 96, 220, 56, 10);
  ctx.fill();
  ctx.fillStyle = '#3d2c1e';
  ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${state.score}`, 1034, 122);
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#8a6a45';
  ctx.fillText(`served ${state.served}`, 1034, 142);
  // Combo flame bar.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, 240, 66, 200, 14, 7);
  ctx.fill();
  const comboFrac = Math.min(1, state.combo / 5);
  ctx.fillStyle = state.combo > 0 ? '#ff7a2e' : '#5a4a38';
  roundRect(ctx, 240, 66, 200 * comboFrac, 14, 7);
  ctx.fill();
  ctx.fillStyle = '#f5e6c8';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(state.combo > 1 ? `COMBO ×${state.combo} 🔥` : 'COMBO — serve in a row to build it', 240, 96);
  ctx.textAlign = 'center';
}

function drawStation(ctx, station, state) {
  const { x, y, w, h } = station;
  const hover = state.hoverStation === station.id;
  ctx.fillStyle = hover ? '#a9743f' : '#7a5230';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = hover ? '#ffcf3d' : '#5a3a20';
  ctx.lineWidth = hover ? 4 : 2;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();
  ctx.fillStyle = '#f5e6c8';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (station.kind === 'grill') {
    // Grill grate.
    ctx.fillStyle = '#2a2a2a';
    roundRect(ctx, x + 10, y + 26, w - 20, h - 48, 6);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 10 + i * ((w - 20) / 5), y + 28);
      ctx.lineTo(x + 10 + i * ((w - 20) / 5), y + h - 24);
      ctx.stroke();
    }
    if (state.grill) {
      const frac = Math.min(1, state.grill.t / COOK.pattyReady);
      const burnFrac = state.grill.t / COOK.pattyBurn;
      ctx.fillStyle = state.grillReady ? '#ff9d2e' : '#7a4a22';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, 52, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      if (state.grillReady) {
        // Status flag above the grill so it never hides behind the patty.
        const label = burnFrac > 0.75 ? 'BURNING!' : 'READY — TAKE IT!';
        ctx.fillStyle = 'rgba(20,12,6,0.85)';
        roundRect(ctx, x + w / 2 - 78, y - 26, 156, 24, 8);
        ctx.fill();
        ctx.fillStyle = burnFrac > 0.75 ? '#ff6a5e' : '#ffcf3d';
        ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + w / 2, y - 13);
        ctx.textBaseline = 'alphabetic';
      }
      // Cook progress ring.
      ctx.strokeStyle = '#ffcf3d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, 62, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#d8c49a';
      ctx.font = '13px "Trebuchet MS", sans-serif';
      ctx.fillText('click to start a patty', x + w / 2, y + h / 2);
    }
    ctx.fillStyle = '#f5e6c8';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.fillText('GRILL  [2]', x + w / 2, y + h - 10);
  } else if (station.kind === 'board') {
    ctx.fillStyle = '#d8b98a';
    roundRect(ctx, x + 10, y + 14, w - 20, h - 36, 6);
    ctx.fill();
    if (state.chopping) {
      const veg = state.chopping.veggie;
      drawIngredientIcon(ctx, x + w / 2 - 25, y + 22, 50, 40, veg);
      ctx.fillStyle = '#3d2c1e';
      ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
      ctx.fillText(`chop ${state.chopping.clicks}/${COOK.chopClicks}`, x + w / 2, y + h - 32);
    } else {
      ctx.fillStyle = '#8a6a45';
      ctx.font = '13px "Trebuchet MS", sans-serif';
      ctx.fillText('pick a veggie above,', x + w / 2, y + h / 2 - 6);
      ctx.fillText('then chop twice', x + w / 2, y + h / 2 + 12);
    }
    ctx.fillStyle = '#f5e6c8';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.fillText('CHOP BOARD', x + w / 2, y + h - 10);
  } else if (station.kind === 'pan') {
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2 + 6, 58, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    if (state.egg) {
      drawIngredientIcon(ctx, x + w / 2 - 22, y + h / 2 - 12, 44, 36, 'egg');
      if (state.eggReady) {
        ctx.fillStyle = '#ffcf3d';
        ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
        ctx.fillText('READY!', x + w / 2, y + 16);
      }
    } else {
      ctx.fillStyle = '#d8c49a';
      ctx.font = '13px "Trebuchet MS", sans-serif';
      ctx.fillText('click to fry an egg', x + w / 2, y + h / 2 + 6);
    }
    ctx.fillStyle = '#f5e6c8';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.fillText('EGG PAN  [7]', x + w / 2, y + h - 10);
  } else if (station.kind === 'fryer') {
    ctx.fillStyle = '#2a2a2a';
    roundRect(ctx, x + 10, y + 22, w - 20, h - 44, 6);
    ctx.fill();
    ctx.fillStyle = '#e8b93a';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2 + 4, 42, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    if (state.fryer) {
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = '#ffd94d';
        ctx.fillRect(x + w / 2 - 24 + i * 13, y + h / 2 - 22, 7, 22);
      }
      if (state.fryerReady) {
        ctx.fillStyle = '#ffcf3d';
        ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
        ctx.fillText('GOLDEN!', x + w / 2, y + 14);
      }
    } else {
      ctx.fillStyle = '#d8c49a';
      ctx.font = '12px "Trebuchet MS", sans-serif';
      ctx.fillText('click for fries', x + w / 2, y + h / 2 + 6);
    }
    ctx.fillStyle = '#f5e6c8';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.fillText('FRYER  [8]', x + w / 2, y + h - 10);
  } else {
    // Ingredient bins: bun, cheese, sauce.
    const ing = INGREDIENTS[station.id];
    drawIngredientIcon(ctx, x + w / 2 - 26, y + 18, 52, 44, station.id);
    ctx.fillStyle = '#f5e6c8';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.fillText(`${station.label}  [${ing.key}]`, x + w / 2, y + h - 10);
  }
  ctx.textBaseline = 'alphabetic';
}

function drawVeggiePickers(ctx, state) {
  for (const veg of VEGGIES) {
    const active = state.chopping && state.chopping.veggie === veg.id;
    const hover = state.hoverStation === veg.id;
    ctx.fillStyle = active ? '#7ec850' : hover ? '#a9743f' : '#7a5230';
    roundRect(ctx, veg.x, veg.y, veg.w, veg.h, 8);
    ctx.fill();
    drawIngredientIcon(ctx, veg.x + 6, veg.y + 6, 30, 30, veg.id);
    ctx.fillStyle = '#f5e6c8';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${INGREDIENTS[veg.id].label} [${INGREDIENTS[veg.id].key}]`, veg.x + 40, veg.y + 24);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
  }
}

function drawPlate(ctx, state) {
  const { x, y, w, h } = PLATE;
  ctx.fillStyle = '#e8e0cc';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2 + 18, w / 2, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b8ac8c';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Burger stack, bottom bun first, drawn bottom-up.
  let sy = y + h - 18;
  for (const ing of state.plate) {
    drawIngredientIcon(ctx, x + w / 2 - 55, sy - 26, 110, 30, ing);
    sy -= 16;
  }
  if (state.plateFries) {
    drawIngredientIcon(ctx, x + w - 52, y + 6, 44, 40, 'fries');
  }
  const servable = state.plate.length > 0;
  ctx.fillStyle = servable ? '#7ec850' : '#8a6a45';
  roundRect(ctx, x, y + h + 4, w, 26, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(servable ? 'SPACE — SERVE!' : 'YOUR PLATE', x + w / 2, y + h + 22);
  ctx.textAlign = 'left';
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    const a = Math.max(0, p.life / p.maxLife);
    if (p.kind === 'smoke') {
      ctx.fillStyle = `rgba(220,220,220,${0.45 * a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1.6 - a * 0.6), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(255,207,61,${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawFlash(ctx, state) {
  if (!state.flash || state.elapsed > state.flash.until) return;
  ctx.save();
  // Dark pill behind the flash so it reads over the veggie pickers.
  ctx.fillStyle = 'rgba(20,12,6,0.78)';
  ctx.font = 'bold 44px "Trebuchet MS", sans-serif';
  const w = ctx.measureText(state.flash.text).width + 48;
  roundRect(ctx, CANVAS_W / 2 - w / 2, 396, w, 76, 12);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px "Trebuchet MS", sans-serif';
  ctx.fillStyle = state.flash.color;
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 6;
  ctx.strokeText(state.flash.text, CANVAS_W / 2, 430);
  ctx.fillText(state.flash.text, CANVAS_W / 2, 430);
  ctx.font = 'bold 18px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#fff';
  ctx.strokeText(state.flash.sub, CANVAS_W / 2, 458);
  ctx.fillText(state.flash.sub, CANVAS_W / 2, 458);
  ctx.restore();
}

function drawOverlay(ctx, title, lines, hint) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fffdf2';
  roundRect(ctx, 290, 130, 700, 460, 16);
  ctx.fill();
  ctx.fillStyle = '#3d2c1e';
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px "Trebuchet MS", sans-serif';
  ctx.fillText(title, CANVAS_W / 2, 210);
  ctx.font = '17px "Trebuchet MS", sans-serif';
  let y = 260;
  for (const line of lines) {
    ctx.fillText(line, CANVAS_W / 2, y);
    y += 30;
  }
  ctx.fillStyle = '#e84a3a';
  ctx.font = 'bold 18px "Trebuchet MS", sans-serif';
  ctx.fillText(hint, CANVAS_W / 2, 540);
  ctx.textAlign = 'left';
}

export function drawGame(ctx, state) {
  drawKitchenBackdrop(ctx, state);
  drawHud(ctx, state);
  drawOrderBoard(ctx, state);
  drawVeggiePickers(ctx, state);
  for (const station of STATIONS) drawStation(ctx, station, state);
  drawPlate(ctx, state);
  drawParticles(ctx, state);
  drawFlash(ctx, state);

  if (state.phase === 'title') {
    drawOverlay(ctx, 'SIZZLE & SERVE', [
      'You run a burger stall for one 120-second lunch shift.',
      'Tickets arrive on the order board — grill patties, chop veggies,',
      'stack each burger exactly as ordered, and serve before the',
      'customer\'s patience runs out. Fries on the side earn +50.',
      'Six recipes, combos that grow with every clean serve,',
      'and Rush Hour doubles everything in the last 30 seconds.',
    ], 'Click or press ENTER to start the shift');
  } else if (state.phase === 'paused') {
    drawOverlay(ctx, 'PAUSED', [
      'The grill is holding. Take a breath.',
      `Score so far: ${state.score}  ·  Served: ${state.served}  ·  Combo ×${state.combo}`,
    ], 'Press P to get back to the stall');
  } else if (state.phase === 'over') {
    const grade = state.score >= 1500 ? 'HEAD CHEF!' : state.score >= 900 ? 'SOUS CHEF' : state.score >= 400 ? 'LINE COOK' : 'STILL LEARNING';
    drawOverlay(ctx, 'SHIFT OVER', [
      `Final score: ${state.score}   ·   Burgers served: ${state.served}`,
      `Best combo: ×${state.bestCombo}   ·   Burned: ${state.burned}   ·   Walk-outs: ${state.mistakes}`,
      `Rank earned: ${grade}`,
    ], 'Press R to run another shift');
  }
}
