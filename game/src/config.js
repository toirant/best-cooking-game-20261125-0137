// Sizzle & Serve: Lunchtime Rush — configuration.
// Every tunable number, recipe and station layout lives here so the rest of
// the game reads like a kitchen manual, not a pile of magic numbers.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;

export const SHIFT_SECONDS = 180;
export const RUSH_SECONDS = 30;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 4;

export const PLAYER_SPEED = 270;
export const PLAYER_RADIUS = 22;
export const INTERACT_RANGE = 52;

// Ingredient catalogue. `needs` says what a raw ingredient must go through
// before it may sit on a plate: chop it, grill it, or serve it as-is.
export const INGREDIENTS = {
  bun: { name: 'Bun', color: '#e8b06a', dark: '#b97f3a', needs: 'none' },
  patty: { name: 'Patty', color: '#8a5a33', dark: '#5d3a1e', needs: 'grill' },
  lettuce: { name: 'Lettuce', color: '#7dc24a', dark: '#4d8a26', needs: 'chop' },
  tomato: { name: 'Tomato', color: '#e8483f', dark: '#a92c25', needs: 'chop' },
  cheese: { name: 'Cheese', color: '#ffc93c', dark: '#d99a12', needs: 'none' },
};

// A recipe is the list of finished ingredients a plate must hold, in any order.
export const RECIPES = {
  salad: {
    name: 'Garden Salad',
    items: ['lettuce', 'tomato'],
    price: 18,
    color: '#7dc24a',
  },
  classic: {
    name: 'Classic Burger',
    items: ['bun', 'patty', 'lettuce'],
    price: 26,
    color: '#e8b06a',
  },
  melt: {
    name: 'Cheese Melt',
    items: ['bun', 'patty', 'cheese'],
    price: 28,
    color: '#ffc93c',
  },
  stack: {
    name: 'Big Stack',
    items: ['bun', 'patty', 'cheese', 'tomato', 'lettuce'],
    price: 42,
    color: '#e8483f',
  },
};

// The order in which new recipes unlock as the shift heats up.
export const RECIPE_LADDER = ['salad', 'classic', 'melt', 'stack'];

export const GRILL_SECONDS = 6;
export const BURN_SECONDS = 13;
export const CHOPS_NEEDED = 3;

// Station rectangles, in canvas pixels. The top wall holds the ingredient
// crates, the board and the grill; the bottom wall holds plates and trash;
// the serving window is on the right wall.
export const STATIONS = {
  crateBun: { kind: 'crate', item: 'bun', x: 56, y: 148, w: 132, h: 62, label: 'BUNS' },
  cratePatty: { kind: 'crate', item: 'patty', x: 208, y: 148, w: 132, h: 62, label: 'PATTIES' },
  crateLettuce: { kind: 'crate', item: 'lettuce', x: 360, y: 148, w: 132, h: 62, label: 'LETTUCE' },
  crateTomato: { kind: 'crate', item: 'tomato', x: 512, y: 148, w: 132, h: 62, label: 'TOMATO' },
  crateCheese: { kind: 'crate', item: 'cheese', x: 664, y: 148, w: 132, h: 62, label: 'CHEESE' },
  board: { kind: 'board', x: 836, y: 148, w: 150, h: 62, label: 'CHOP' },
  grill: { kind: 'grill', x: 1006, y: 148, w: 218, h: 62, label: 'GRILL' },
  plates: { kind: 'plates', x: 56, y: 596, w: 132, h: 62, label: 'PLATES' },
  trash: { kind: 'trash', x: 208, y: 596, w: 132, h: 62, label: 'TRASH' },
  serve: { kind: 'serve', x: 1208, y: 300, w: 56, h: 190, label: 'SERVE' },
};

// The central island counter: decorative, but it carries loose ingredients so
// the kitchen reads as a working one at a glance.
export const ISLAND = { x: 430, y: 372, w: 420, h: 66 };

// Colours for the kitchen itself.
export const PALETTE = {
  floorA: '#c98f5f',
  floorB: '#bd8252',
  wall: '#f2e3c6',
  wallTrim: '#8a5a33',
  counterTop: '#a06a3b',
  counterSide: '#7c4f28',
  steel: '#c9ced6',
  steelDark: '#9aa1ad',
  hud: '#2b1d12',
  cream: '#fff6e3',
  gold: '#ffc93c',
  red: '#e8483f',
  green: '#7dc24a',
};
