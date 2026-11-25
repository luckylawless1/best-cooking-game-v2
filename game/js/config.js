// config.js — every tunable number and recipe of Sizzle & Serve v2.
// One job: the data the rest of the game reads, nothing else.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const SHIFT_SECONDS = 120;
export const RUSH_AT_SECONDS_LEFT = 30;

// Ingredient ids, in the order a burger is stacked on the plate.
export const INGREDIENTS = {
  bun:    { label: 'Bun',    key: '1', color: '#e8a94e', dark: '#b97a24' },
  patty:  { label: 'Patty',  key: '2', color: '#7a4a22', dark: '#4c2c12' },
  lettuce:{ label: 'Lettuce',key: '3', color: '#7ec850', dark: '#4a8a2a' },
  tomato: { label: 'Tomato', key: '4', color: '#e84a3a', dark: '#a82a1e' },
  cheese: { label: 'Cheese', key: '5', color: '#ffcf3d', dark: '#d99a00' },
  sauce:  { label: 'Sauce',  key: '6', color: '#f2e3c0', dark: '#c9a86a' },
  egg:    { label: 'Egg',    key: '7', color: '#fff3c4', dark: '#e8b93a' },
  fries:  { label: 'Fries',  key: '8', color: '#ffd94d', dark: '#d99a00' },
};

// Recipes: the burger stack, bottom bun first, top bun last.
// `fries` on a ticket means the customer also wants a side of fries.
export const RECIPES = [
  { id: 'classic',   name: 'Classic',       price: 100, stack: ['bun', 'patty', 'lettuce', 'bun'] },
  { id: 'cheese',    name: 'Cheese Melt',   price: 100, stack: ['bun', 'patty', 'cheese', 'bun'] },
  { id: 'garden',    name: 'Garden',        price: 110, stack: ['bun', 'patty', 'lettuce', 'tomato', 'bun'] },
  { id: 'sunrise',   name: 'Sunrise Stack', price: 130, stack: ['bun', 'patty', 'egg', 'cheese', 'bun'] },
  { id: 'double',    name: 'Double Trouble',price: 150, stack: ['bun', 'patty', 'patty', 'cheese', 'bun'] },
  { id: 'works',     name: 'The Works',     price: 170, stack: ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'sauce', 'bun'] },
];

// Station geometry (canvas coordinates) and what each station does.
export const STATIONS = [
  { id: 'bun',     kind: 'bin',    x: 40,  y: 470, w: 120, h: 110, label: 'BUN BIN' },
  { id: 'grill',   kind: 'grill',  x: 180, y: 470, w: 220, h: 110, label: 'GRILL' },
  { id: 'board',   kind: 'board',  x: 420, y: 470, w: 220, h: 110, label: 'CHOP BOARD' },
  { id: 'cheese',  kind: 'bin',    x: 660, y: 470, w: 120, h: 110, label: 'CHEESE' },
  { id: 'sauce',   kind: 'bin',    x: 800, y: 470, w: 120, h: 110, label: 'SAUCE' },
  { id: 'egg',     kind: 'pan',    x: 940, y: 470, w: 150, h: 110, label: 'EGG PAN' },
  { id: 'fryer',   kind: 'fryer',  x: 1110,y: 470, w: 130, h: 110, label: 'FRYER' },
];

// The two veggie pickers sit above the chopping board.
export const VEGGIES = [
  { id: 'lettuce', x: 420, y: 410, w: 105, h: 48 },
  { id: 'tomato',  x: 535, y: 410, w: 105, h: 48 },
];

export const PLATE = { x: 500, y: 600, w: 280, h: 96 };

// Cook times in seconds.
export const COOK = {
  pattyReady: 3.0, pattyBurn: 7.0,
  eggReady: 4.0,   eggBurn: 8.0,
  friesReady: 8.0, friesBurn: 13.0,
  chopClicks: 2,
};

// Patience (seconds) a fresh ticket grants; later tickets are less patient.
export const PATIENCE_BASE = 38;
export const PATIENCE_MIN = 24;
export const PATIENCE_STEP = 1.2;

// Ticket spawn pacing: first ticket at once, then one every ~9s, faster in Rush Hour.
export const SPAWN_EVERY = 9;
export const SPAWN_RUSH = 6.5;
export const MAX_TICKETS = 4;

export const SCORE = {
  friesBonus: 50,
  comboStep: 10,
  patienceBonusMax: 50,
};

// Customer faces: skin tones, hair colours and names the order board cycles through.
export const CUSTOMERS = [
  { name: 'Mia',   skin: '#f2c89b', hair: '#3a2317', style: 'bob' },
  { name: 'Ravi',  skin: '#c98d5a', hair: '#1c1410', style: 'short' },
  { name: 'Sofia', skin: '#f7d7b0', hair: '#e8b93a', style: 'long' },
  { name: 'Kenji', skin: '#f0c08f', hair: '#222222', style: 'spiky' },
  { name: 'Aisha', skin: '#a06a3f', hair: '#4a2c14', style: 'bun' },
  { name: 'Leo',   skin: '#eab98a', hair: '#7a4a22', style: 'curly' },
  { name: 'Nina',  skin: '#f5cfa5', hair: '#8a2a3a', style: 'bob' },
  { name: 'Omar',  skin: '#b57a48', hair: '#14100c', style: 'short' },
];
