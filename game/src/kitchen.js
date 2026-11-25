// Sizzle & Serve — the kitchen: what happens when the chef uses a station.
// One function per station kind; interact() picks the nearest station in
// reach and runs its rule. Nothing here draws anything.

import {
  BURN_SECONDS,
  CHOPS_NEEDED,
  GRILL_SECONDS,
  INGREDIENTS,
  STATIONS,
} from './config.js';
import {
  addPopup,
  canPlate,
  findMatchingOrder,
  itemLabel,
  makeItem,
  serveOrder,
} from './state.js';
import { sfx } from './audio.js';

function nearestStation(player) {
  let best = null;
  let bestDistance = Infinity;
  for (const station of Object.values(STATIONS)) {
    const cx = station.x + station.w / 2;
    const cy = station.y + station.h / 2;
    const dx = player.x - cx;
    const dy = player.y - cy;
    // Distance to the station's edge, so big stations are easy to reach.
    const edgeX = Math.max(Math.abs(dx) - station.w / 2, 0);
    const edgeY = Math.max(Math.abs(dy) - station.h / 2, 0);
    const distance = Math.hypot(edgeX, edgeY);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = station;
    }
  }
  return { station: best, distance: bestDistance };
}

function handsEmpty(player) {
  return player.hands === null;
}

function carryingPlate(player) {
  return player.hands !== null && player.hands.kind === 'plate';
}

function carryingItem(player) {
  return player.hands !== null && player.hands.kind === 'item';
}

// The grill cooks on its own clock; call every frame while playing.
export function updateGrill(state, dt) {
  if (!state.grill) return;
  state.grill.seconds += dt;
  if (state.grill.seconds >= GRILL_SECONDS && !state.grill.cooked) {
    state.grill.cooked = true;
    state.grill.item.state = 'grilled';
    sfx.grilled();
    addPopup(state, 1030, 240, 'Grilled!', '#ffc93c');
  }
  if (state.grill.seconds >= BURN_SECONDS && !state.grill.burnt) {
    state.grill.burnt = true;
    state.grill.item.state = 'burnt';
    addPopup(state, 1030, 240, 'Burnt!', '#e8483f');
  }
}

export function interact(state) {
  const player = state.player;
  const { station, distance } = nearestStation(player);
  if (!station || distance > 64) {
    return 'too-far';
  }
  switch (station.kind) {
    case 'crate': return useCrate(state, station);
    case 'board': return useBoard(state, station);
    case 'grill': return useGrill(state, station);
    case 'plates': return usePlates(state, station);
    case 'trash': return useTrash(state, station);
    case 'serve': return useServe(state, station);
    default: return 'nothing';
  }
}

function useCrate(state, station) {
  const player = state.player;
  const itemId = station.item;
  if (handsEmpty(player)) {
    player.hands = { kind: 'item', item: makeItem(itemId, 'raw') };
    sfx.pickup();
    return 'picked-up';
  }
  if (carryingPlate(player)) {
    const plate = player.hands;
    const fresh = makeItem(itemId, 'raw');
    if (!canPlate(fresh)) {
      sfx.wrong();
      addPopup(state, player.x, player.y - 44, 'Needs prep first!', '#e8483f');
      return 'needs-prep';
    }
    if (plate.items.some((held) => held.id === itemId)) {
      sfx.wrong();
      addPopup(state, player.x, player.y - 44, 'Already on the plate!', '#e8483f');
      return 'duplicate';
    }
    plate.items.push(fresh);
    sfx.place();
    return 'plated';
  }
  sfx.wrong();
  return 'hands-full';
}

function useBoard(state) {
  const player = state.player;
  if (!state.board) {
    if (carryingItem(player) && INGREDIENTS[player.hands.item.id].needs === 'chop') {
      state.board = { item: player.hands.item, chops: 0 };
      player.hands = null;
      sfx.place();
      return 'placed-board';
    }
    sfx.wrong();
    return 'nothing-to-chop';
  }
  if (state.board.chops < CHOPS_NEEDED) {
    state.board.chops += 1;
    sfx.chop();
    if (state.board.chops >= CHOPS_NEEDED) {
      state.board.item.state = 'chopped';
      sfx.chopped();
      addPopup(state, 820, 240, 'Chopped!', '#7dc24a');
    }
    return 'chopping';
  }
  if (carryingPlate(player)) {
    const plate = player.hands;
    if (plate.items.some((held) => held.id === state.board.item.id)) {
      sfx.wrong();
      addPopup(state, player.x, player.y - 44, 'Already on the plate!', '#e8483f');
      return 'duplicate';
    }
    plate.items.push(state.board.item);
    state.board = null;
    sfx.place();
    return 'plated';
  }
  if (handsEmpty(player)) {
    player.hands = { kind: 'item', item: state.board.item };
    state.board = null;
    sfx.pickup();
    return 'picked-chopped';
  }
  sfx.wrong();
  return 'hands-full';
}

function useGrill(state) {
  const player = state.player;
  if (!state.grill) {
    if (carryingItem(player) && player.hands.item.id === 'patty' && player.hands.item.state === 'raw') {
      state.grill = { item: player.hands.item, seconds: 0, cooked: false, burnt: false };
      player.hands = null;
      sfx.sizzle();
      return 'grilling';
    }
    sfx.wrong();
    return 'nothing-to-grill';
  }
  if (carryingPlate(player)) {
    if (!state.grill.cooked) {
      addPopup(state, 1030, 240, 'Still cooking…', '#fff6e3');
      return 'cooking';
    }
    if (state.grill.burnt) {
      sfx.wrong();
      addPopup(state, player.x, player.y - 44, 'Burnt! Trash it first.', '#e8483f');
      return 'burnt';
    }
    const plate = player.hands;
    if (plate.items.some((held) => held.id === 'patty')) {
      sfx.wrong();
      addPopup(state, player.x, player.y - 44, 'Already on the plate!', '#e8483f');
      return 'duplicate';
    }
    plate.items.push(state.grill.item);
    state.grill = null;
    sfx.place();
    return 'plated';
  }
  if (handsEmpty(player) && (state.grill.cooked || state.grill.burnt)) {
    player.hands = { kind: 'item', item: state.grill.item };
    state.grill = null;
    sfx.pickup();
    return 'picked-grill';
  }
  if (handsEmpty(player) && !state.grill.cooked) {
    addPopup(state, 1030, 240, 'Still cooking…', '#fff6e3');
    return 'cooking';
  }
  sfx.wrong();
  return 'hands-full';
}

function usePlates(state) {
  const player = state.player;
  if (handsEmpty(player)) {
    player.hands = { kind: 'plate', items: [] };
    sfx.pickup();
    return 'plate';
  }
  sfx.wrong();
  return 'hands-full';
}

function useTrash(state) {
  const player = state.player;
  if (handsEmpty(player)) return 'nothing';
  player.hands = null;
  sfx.place();
  return 'trashed';
}

function useServe(state) {
  const player = state.player;
  if (!carryingPlate(player)) {
    sfx.wrong();
    addPopup(state, player.x, player.y - 44, 'Bring a plate!', '#e8483f');
    return 'no-plate';
  }
  const plateItems = player.hands.items.map((item) => item.id);
  const order = findMatchingOrder(state, plateItems);
  if (!order) {
    sfx.wrong();
    addPopup(state, player.x, player.y - 44, 'No order wants this!', '#e8483f');
    return 'no-match';
  }
  const earned = serveOrder(state, order, plateItems);
  player.hands = null;
  sfx.serve();
  addPopup(state, 1150, 272, `+${earned} coins`, '#ffc93c');
  if (state.combo >= 2) {
    state.banner = { text: `COMBO x${state.combo}!`, sub: 'The crowd is loving it', life: 1.4 };
  }
  return 'served';
}

// Hint text for the station the chef is standing by.
export function stationHint(state) {
  const player = state.player;
  const { station, distance } = nearestStation(player);
  if (!station || distance > 64) return '';
  switch (station.kind) {
    case 'crate': return `E — take ${INGREDIENTS[station.item].name}`;
    case 'board':
      if (!state.board) return 'E — put lettuce / tomato here to chop';
      if (state.board.chops < CHOPS_NEEDED) return `E — chop! (${state.board.chops}/${CHOPS_NEEDED})`;
      if (carryingPlate(state.player)) return 'E — add the chopped food to the plate';
      return 'E — take the chopped food';
    case 'grill':
      if (!state.grill) return 'E — put a raw patty on the grill';
      if (!state.grill.cooked) return 'Grilling… wait for the ding';
      if (state.grill.burnt) return 'E — take it (burnt! trash it)';
      if (carryingPlate(state.player)) return 'E — add the grilled patty to the plate';
      return 'E — take the grilled patty';
    case 'plates': return 'E — take a plate';
    case 'trash': return 'E — throw away what you hold';
    case 'serve': return 'E — serve the plate';
    default: return '';
  }
}
