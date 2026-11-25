// Sizzle & Serve — staged scenes for the entry's screenshots.
// `?shot=start|play|serve|end` renders one frozen, deterministic frame of the
// real game so the screenshots show the kitchen at its best: the order board,
// ingredients on the counter, a dish mid-assembly, the timer, a plate ready
// to serve. These are the same draw calls the live game uses.

import { RECIPES } from './config.js';
import { createState, makeItem, spawnOrder } from './state.js';

function baseState() {
  const state = createState();
  state.screen = 'playing';
  state.timeLeft = 142;
  state.elapsed = 38;
  state.score = 86;
  state.coins = 86;
  state.served = 4;
  state.combo = 2;
  return state;
}

function withOrders(state, specs) {
  state.orders = specs.map(([recipeId, patience, maxPatience], i) => ({
    id: i + 1,
    recipeId,
    patience,
    maxPatience,
    bornAt: 0,
  }));
  void RECIPES;
}

// The title screen over a live kitchen: orders waiting, crates full.
export function stageStart() {
  const state = baseState();
  state.screen = 'title';
  withOrders(state, [
    ['classic', 52, 68],
    ['salad', 44, 68],
  ]);
  return state;
}

// The cover shot: mid-rush. The chef carries a plate with bun + grilled
// patty while a chopped tomato waits on the board and a patty sizzles.
export function stagePlay() {
  const state = baseState();
  state.timeLeft = 127;
  state.elapsed = 53;
  state.score = 132;
  state.coins = 132;
  state.served = 6;
  state.combo = 3;
  withOrders(state, [
    ['stack', 34, 72],
    ['classic', 47, 68],
    ['melt', 58, 68],
    ['salad', 22, 60],
  ]);
  state.player.x = 911;
  state.player.y = 300;
  state.player.facing = 'up';
  state.player.hands = {
    kind: 'plate',
    items: [makeItem('bun', 'raw'), makeItem('patty', 'grilled')],
  };
  state.board = { item: makeItem('tomato', 'chopped'), chops: 3 };
  state.grill = { item: makeItem('patty', 'grilled'), seconds: 6.5, cooked: true, burnt: false };
  state.popups = [
    { x: 640, y: 320, text: '+26 coins', color: '#ffc93c', life: 1.2 },
    { x: 820, y: 240, text: 'Chopped!', color: '#7dc24a', life: 1.0 },
  ];
  state.banner = { text: 'COMBO x3!', sub: 'The crowd is loving it', life: 1.2 };
  return state;
}

// A full Big Stack on a plate at the serving window, coins popping.
export function stageServe() {
  const state = baseState();
  state.timeLeft = 96;
  state.elapsed = 84;
  state.score = 214;
  state.coins = 214;
  state.served = 9;
  state.combo = 2;
  withOrders(state, [
    ['stack', 41, 72],
    ['melt', 55, 68],
  ]);
  state.player.x = 1150;
  state.player.y = 395;
  state.player.facing = 'right';
  state.player.hands = {
    kind: 'plate',
    items: [
      makeItem('bun', 'raw'),
      makeItem('patty', 'grilled'),
      makeItem('cheese', 'raw'),
      makeItem('tomato', 'chopped'),
      makeItem('lettuce', 'chopped'),
    ],
  };
  state.grill = { item: makeItem('patty', 'raw'), seconds: 3.2, cooked: false, burnt: false };
  state.popups = [
    { x: 1150, y: 272, text: '+42 coins', color: '#ffc93c', life: 1.2 },
  ];
  return state;
}

// The end-of-shift screen with a three-star result.
export function stageEnd() {
  const state = baseState();
  state.screen = 'over';
  state.timeLeft = 0;
  state.score = 486;
  state.coins = 486;
  state.served = 17;
  state.expired = 2;
  state.bestCombo = 4;
  withOrders(state, []);
  return state;
}

export function stageShot(name) {
  switch (name) {
    case 'start': return stageStart();
    case 'play': return stagePlay();
    case 'serve': return stageServe();
    case 'end': return stageEnd();
    default: return null;
  }
}

// Deterministic order spawn for staged scenes (unused by live play).
export function stageSpawnOrder(state) {
  spawnOrder(state);
}
