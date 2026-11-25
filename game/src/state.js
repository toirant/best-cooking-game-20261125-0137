// Sizzle & Serve — game state: the shift, the orders, the score.
// Pure data and rules here; rendering and station logic live elsewhere.

import {
  INGREDIENTS,
  MAX_HEARTS,
  MAX_ORDERS,
  RECIPES,
  RECIPE_LADDER,
  SHIFT_SECONDS,
} from './config.js';

let nextOrderId = 1;

export function createState() {
  return {
    screen: 'title', // title | playing | over
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    score: 0,
    coins: 0,
    served: 0,
    expired: 0,
    hearts: MAX_HEARTS,
    combo: 0,
    bestCombo: 0,
    orders: [],
    spawnTimer: 2.5,
    player: {
      x: 640,
      y: 470,
      facing: 'down',
      moving: false,
      // hands: null | { kind: 'item', item } | { kind: 'plate', items: [] }
      hands: null,
      walkTarget: null,
      arrived: false,
      bob: 0,
    },
    board: null, // { item, chops } sitting on the chopping board
    grill: null, // { item, seconds, cooked, burnt } sitting on the grill
    popups: [], // floating score text: { x, y, text, color, life }
    banner: null, // big centre message: { text, sub, life }
    flash: 0, // red screen flash on a lost order
    muted: false,
    seed: 1,
  };
}

// Which recipes may appear yet: the ladder unlocks one more every 45 seconds.
export function unlockedRecipes(state) {
  const unlocks = 1 + Math.floor(state.elapsed / 45);
  return RECIPE_LADDER.slice(0, Math.min(unlocks, RECIPE_LADDER.length));
}

function patienceFor(state) {
  // Orders get less patient as the shift wears on.
  const base = 68 - Math.min(18, state.elapsed * 0.12);
  return base + Math.random() * 10;
}

export function spawnOrder(state) {
  const pool = unlockedRecipes(state);
  const recipeId = pool[Math.floor(Math.random() * pool.length)];
  const patience = patienceFor(state);
  state.orders.push({
    id: nextOrderId++,
    recipeId,
    patience,
    maxPatience: patience,
    bornAt: state.elapsed,
  });
}

export function updateOrders(state, dt) {
  state.spawnTimer -= dt;
  const rush = state.timeLeft <= 30;
  const interval = rush ? 8 : 12;
  if (state.spawnTimer <= 0 && state.orders.length < MAX_ORDERS) {
    spawnOrder(state);
    state.spawnTimer = interval + Math.random() * 4;
  }
  for (const order of state.orders) order.patience -= dt;
  const lost = state.orders.filter((order) => order.patience <= 0);
  if (lost.length > 0) {
    state.orders = state.orders.filter((order) => order.patience > 0);
    state.expired += lost.length;
    state.hearts = Math.max(0, state.hearts - lost.length);
    state.combo = 0;
    state.flash = 1;
  }
  return lost.length;
}

// A plate matches an order when it holds exactly the recipe's finished items.
export function plateMatchesOrder(plateItems, recipeId) {
  const wanted = [...RECIPES[recipeId].items].sort();
  const held = [...plateItems].sort();
  return wanted.length === held.length && wanted.every((item, i) => item === held[i]);
}

export function findMatchingOrder(state, plateItems) {
  // Serve the oldest matching order first.
  return state.orders.find((order) => plateMatchesOrder(plateItems, order.recipeId));
}

export function serveOrder(state, order, plateItems) {
  const recipe = RECIPES[order.recipeId];
  const patienceBonus = Math.round((order.patience / order.maxPatience) * 15);
  const comboMultiplier = 1 + Math.min(state.combo, 4) * 0.25;
  const earned = Math.round((recipe.price + patienceBonus) * comboMultiplier);
  state.score += earned;
  state.coins += earned;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.orders = state.orders.filter((o) => o.id !== order.id);
  return earned;
}

export function addPopup(state, x, y, text, color) {
  state.popups.push({ x, y, text, color, life: 1.4 });
}

export function updatePopups(state, dt) {
  for (const popup of state.popups) {
    popup.y -= 34 * dt;
    popup.life -= dt;
  }
  state.popups = state.popups.filter((popup) => popup.life > 0);
  if (state.banner) {
    state.banner.life -= dt;
    if (state.banner.life <= 0) state.banner = null;
  }
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 1.6);
}

// A finished ingredient is one that has had its required prep done.
export function isFinishedItem(item) {
  return item.state === 'ready';
}

// Build a finished item object from a raw ingredient id.
export function makeItem(id, prepState = 'raw') {
  return { id, state: prepState };
}

export function itemLabel(item) {
  const base = INGREDIENTS[item.id].name;
  if (item.state === 'chopped') return `Chopped ${base}`;
  if (item.state === 'grilled') return `Grilled ${base}`;
  if (item.state === 'burnt') return `Burnt ${base}`;
  return base;
}

// Can this held item go straight onto a plate?
export function canPlate(item) {
  const needs = INGREDIENTS[item.id].needs;
  if (needs === 'none') return item.state === 'raw';
  if (needs === 'chop') return item.state === 'chopped';
  if (needs === 'grill') return item.state === 'grilled';
  return false;
}

export function plateItemIds(plate) {
  return plate.items.map((item) => item.id);
}
