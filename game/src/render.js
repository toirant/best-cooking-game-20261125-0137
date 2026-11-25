// Sizzle & Serve — every pixel the player sees, drawn on one canvas.
// The kitchen is vector art: tiled floor, wood counters, a steel grill with
// animated flames, and food drawn as simple shapes that read at a glance.

import {
  BURN_SECONDS,
  CHOPS_NEEDED,
  GRILL_SECONDS,
  INGREDIENTS,
  ISLAND,
  PALETTE,
  RECIPES,
  STATIONS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from './config.js';
import { itemLabel } from './state.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- Food icons -----------------------------------------------------------

export function drawIngredient(ctx, id, x, y, size, state = 'raw') {
  const ing = INGREDIENTS[id];
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, 2, s, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.fillRect(-s, 2, s * 2, s * 0.32);
    ctx.fillStyle = '#fff6e3';
    ctx.beginPath();
    ctx.arc(-s * 0.4, -s * 0.35, 2, 0, Math.PI * 2);
    ctx.arc(s * 0.3, -s * 0.5, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'patty') {
    ctx.fillStyle = state === 'burnt' ? '#2b1d12' : ing.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = state === 'burnt' ? '#1a120a' : ing.dark;
    ctx.beginPath();
    ctx.ellipse(-s * 0.35, -1, s * 0.22, s * 0.16, 0, 0, Math.PI * 2);
    ctx.ellipse(s * 0.3, 1, s * 0.22, s * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'lettuce') {
    ctx.fillStyle = ing.color;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse((i - 1) * s * 0.5, (i % 2) * 3 - 2, s * 0.62, s * 0.5, (i - 1) * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, 0);
    ctx.quadraticCurveTo(0, s * 0.5, s * 0.7, 0);
    ctx.stroke();
  } else if (id === 'tomato') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.92, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.arc(0, -s * 0.55, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7dc24a';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.8, s * 0.55, s * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(-s * 0.35, -s * 0.3, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.6);
    ctx.lineTo(s, s * 0.6);
    ctx.lineTo(s, -s * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.arc(-s * 0.3, s * 0.2, 2.5, 0, Math.PI * 2);
    ctx.arc(s * 0.35, s * 0.05, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (state === 'chopped') {
    ctx.strokeStyle = 'rgba(43,29,18,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-s * 0.6, -s * 0.4);
    ctx.lineTo(s * 0.6, s * 0.4);
    ctx.moveTo(s * 0.6, -s * 0.4);
    ctx.lineTo(-s * 0.6, s * 0.4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, size, items) {
  const r = size / 2;
  ctx.fillStyle = '#f4f6f8';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.82, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9ced6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.72, r * 0.58, 0, 0, Math.PI * 2);
  ctx.stroke();
  items.forEach((item, i) => {
    const offset = (i - (items.length - 1) / 2) * size * 0.34;
    drawIngredient(ctx, item.id, x + offset, y - 2, size * 0.52, item.state);
  });
}

// --- Kitchen --------------------------------------------------------------

function drawFloor(ctx, time) {
  ctx.fillStyle = PALETTE.floorA;
  ctx.fillRect(0, 104, VIEW_WIDTH, VIEW_HEIGHT - 104);
  ctx.fillStyle = PALETTE.floorB;
  const tile = 64;
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 20; col++) {
      if ((row + col) % 2 === 0) ctx.fillRect(col * tile, 104 + row * tile, tile, tile);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(0, 104, VIEW_WIDTH, 6);
  void time;
}

function drawWall(ctx) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW_WIDTH, 104);
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fillRect(0, 98, VIEW_WIDTH, 6);
}

function drawStation(ctx, station, state, time) {
  const { x, y, w, h } = station;
  ctx.save();
  if (station.kind === 'crate') {
    ctx.fillStyle = PALETTE.counterSide;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    roundRect(ctx, x, y, w, h - 12, 8);
    ctx.fill();
    drawIngredient(ctx, station.item, x + 26, y + h / 2 - 4, 34);
    drawIngredient(ctx, station.item, x + 52, y + h / 2 - 4, 30);
    text(ctx, station.label, x + w - 8, y + h / 2 - 2, 12, '#fff6e3', 'right');
  } else if (station.kind === 'board') {
    ctx.fillStyle = PALETTE.counterSide;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = '#e8c99a';
    roundRect(ctx, x + 8, y + 6, w - 16, h - 18, 6);
    ctx.fill();
    if (state.board) {
      drawIngredient(ctx, state.board.item.id, x + w / 2 - 22, y + h / 2 - 4, 36, state.board.item.state);
      const progress = state.board.chops / CHOPS_NEEDED;
      ctx.fillStyle = 'rgba(43,29,18,0.25)';
      roundRect(ctx, x + 14, y + h - 14, w - 28, 6, 3);
      ctx.fill();
      ctx.fillStyle = '#7dc24a';
      roundRect(ctx, x + 14, y + h - 14, (w - 28) * progress, 6, 3);
      ctx.fill();
    } else {
      ctx.fillStyle = '#b98d54';
      ctx.beginPath();
      ctx.moveTo(x + w / 2 + 18, y + 14);
      ctx.lineTo(x + w / 2 + 34, y + 14);
      ctx.lineTo(x + w / 2 + 30, y + h - 16);
      ctx.lineTo(x + w / 2 + 14, y + h - 16);
      ctx.closePath();
      ctx.fill();
    }
    text(ctx, station.label, x + w / 2, y - 12, 12, '#fff6e3');
  } else if (station.kind === 'grill') {
    ctx.fillStyle = '#3a3f47';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.steelDark;
    roundRect(ctx, x + 6, y + 6, w - 12, h - 16, 5);
    ctx.fill();
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 6 + (i * (w - 12)) / 5, y + 8);
      ctx.lineTo(x + 6 + (i * (w - 12)) / 5, y + h - 12);
      ctx.stroke();
    }
    if (state.grill) {
      const flicker = Math.sin(time * 9) * 2;
      ctx.fillStyle = state.grill.burnt ? '#5a3a1a' : '#ff9d2e';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h - 8, 26 + flicker, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      drawIngredient(ctx, 'patty', x + w / 2, y + h / 2 - 4, 44, state.grill.item.state);
      const progress = Math.min(1, state.grill.seconds / GRILL_SECONDS);
      const burnProgress = Math.min(1, state.grill.seconds / BURN_SECONDS);
      ctx.fillStyle = 'rgba(43,29,18,0.3)';
      roundRect(ctx, x + 14, y + h - 14, w - 28, 6, 3);
      ctx.fill();
      ctx.fillStyle = state.grill.burnt ? '#e8483f' : state.grill.cooked ? '#7dc24a' : '#ffc93c';
      roundRect(ctx, x + 14, y + h - 14, (w - 28) * (state.grill.cooked ? burnProgress : progress), 6, 3);
      ctx.fill();
    }
    text(ctx, station.label, x + w / 2, y - 12, 12, '#fff6e3');
  } else if (station.kind === 'plates') {
    ctx.fillStyle = PALETTE.counterSide;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    roundRect(ctx, x, y, w, h - 12, 8);
    ctx.fill();
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = '#f4f6f8';
      ctx.beginPath();
      ctx.ellipse(x + 30 + i * 20, y + h / 2 - 4, 15, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9ced6';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    text(ctx, station.label, x + w - 8, y + h / 2 - 2, 12, '#fff6e3', 'right');
  } else if (station.kind === 'trash') {
    ctx.fillStyle = '#4a4f57';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = '#2f333a';
    roundRect(ctx, x + 10, y + 8, w - 20, h - 20, 6);
    ctx.fill();
    text(ctx, station.label, x + w / 2, y + h / 2, 13, '#fff6e3');
  } else if (station.kind === 'serve') {
    ctx.fillStyle = PALETTE.steel;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = '#e8483f';
    roundRect(ctx, x + 6, y + 6, w - 12, 34, 6);
    ctx.fill();
    text(ctx, 'SERVE', x + w / 2, y + 23, 13, '#fff6e3');
    ctx.fillStyle = '#8a5a33';
    ctx.font = '600 11px "Trebuchet MS", sans-serif';
    ctx.save();
    ctx.translate(x + w / 2, y + 110);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('WINDOW', 0, 0);
    ctx.restore();
    ctx.fillStyle = '#ffc93c';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h - 34);
    ctx.lineTo(x + w / 2 - 12, y + h - 12);
    ctx.lineTo(x + w / 2 + 12, y + h - 12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawIsland(ctx) {
  const { x, y, w, h } = ISLAND;
  ctx.fillStyle = PALETTE.counterSide;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  roundRect(ctx, x, y, w, h - 10, 10);
  ctx.fill();
  drawIngredient(ctx, 'tomato', x + 60, y + 26, 34);
  drawIngredient(ctx, 'lettuce', x + 130, y + 26, 34);
  drawIngredient(ctx, 'cheese', x + 200, y + 26, 34);
  drawIngredient(ctx, 'bun', x + 270, y + 26, 34);
  drawIngredient(ctx, 'tomato', x + 340, y + 26, 30);
  text(ctx, 'PREP COUNTER', x + w / 2, y + h + 16, 11, 'rgba(255,246,227,0.75)');
}

function drawChef(ctx, state, time) {
  const player = state.player;
  const bob = player.moving ? Math.sin(player.bob) * 2.5 : Math.sin(time * 2) * 1;
  const x = player.x;
  const y = player.y + bob;
  ctx.save();
  ctx.translate(x, y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Legs.
  ctx.fillStyle = '#3a3f47';
  ctx.fillRect(-11, 8, 8, 12);
  ctx.fillRect(3, 8, 8, 12);
  // Body: white apron over a teal shirt.
  ctx.fillStyle = '#2e8b8b';
  roundRect(ctx, -16, -12, 32, 24, 9);
  ctx.fill();
  ctx.fillStyle = '#fff6e3';
  roundRect(ctx, -11, -6, 22, 18, 6);
  ctx.fill();
  // Arms.
  ctx.fillStyle = '#2e8b8b';
  ctx.fillRect(-22, -8, 7, 14);
  ctx.fillRect(15, -8, 7, 14);
  // Head and toque.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -22, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff6e3';
  ctx.beginPath();
  ctx.arc(-6, -32, 7, 0, Math.PI * 2);
  ctx.arc(0, -35, 8, 0, Math.PI * 2);
  ctx.arc(6, -32, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-12, -32, 24, 5);
  // Eyes look the way the chef faces.
  const look = player.facing === 'left' ? -3 : player.facing === 'right' ? 3 : 0;
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath();
  ctx.arc(-4 + look, -22, 1.8, 0, Math.PI * 2);
  ctx.arc(4 + look, -22, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // What the chef carries, held up high so it reads.
  if (player.hands) {
    if (player.hands.kind === 'plate') {
      drawPlate(ctx, 0, -56, 50, player.hands.items);
    } else {
      drawIngredient(ctx, player.hands.item.id, 0, -50, 36, player.hands.item.state);
      text(ctx, itemLabel(player.hands.item), 0, -72, 11, '#fff6e3');
    }
  }
  ctx.restore();
}

function drawWalkTarget(ctx, state) {
  const target = state.player.walkTarget;
  if (!target) return;
  ctx.strokeStyle = 'rgba(255,201,60,0.8)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.arc(target.x, target.y, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

// --- HUD: order board, timer, score ----------------------------------------

function drawOrderTicket(ctx, order, x, y, w, h) {
  const recipe = RECIPES[order.recipeId];
  const urgency = order.patience / order.maxPatience;
  const bg = urgency < 0.3 ? '#fbe3e0' : '#fff6e3';
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = urgency < 0.3 ? '#e8483f' : '#d9c49a';
  ctx.lineWidth = urgency < 0.3 ? 2.5 : 1.5;
  ctx.stroke();
  text(ctx, recipe.name, x + 10, y + 15, 13, '#2b1d12', 'left');
  order.patience < 12 && Math.floor(order.patience * 2) % 2 === 0
    ? text(ctx, `${Math.ceil(order.patience)}s`, x + w - 10, y + 15, 13, '#e8483f', 'right')
    : text(ctx, `${Math.ceil(order.patience)}s`, x + w - 10, y + 15, 13, '#8a5a33', 'right');
  recipe.items.forEach((itemId, i) => {
    drawIngredient(ctx, itemId, x + 24 + i * 34, y + 44, 28);
  });
  ctx.fillStyle = 'rgba(43,29,18,0.2)';
  roundRect(ctx, x + 10, y + h - 12, w - 20, 6, 3);
  ctx.fill();
  ctx.fillStyle = urgency < 0.3 ? '#e8483f' : '#7dc24a';
  roundRect(ctx, x + 10, y + h - 12, (w - 20) * urgency, 6, 3);
  ctx.fill();
}

function drawHud(ctx, state) {
  // Order board: tickets across the top, newest on the right.
  const ticketW = 176;
  const ticketH = 76;
  const gap = 10;
  const totalW = state.orders.length * (ticketW + gap) - gap;
  let startX = (VIEW_WIDTH - totalW) / 2;
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch crowd is coming…', VIEW_WIDTH / 2, 52, 15, '#8a5a33');
  }
  state.orders.forEach((order) => {
    drawOrderTicket(ctx, order, startX, 12, ticketW, ticketH);
    startX += ticketW + gap;
  });

  // Shift timer, top right.
  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = Math.floor(state.timeLeft % 60);
  const timeText = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const rush = state.timeLeft <= 30;
  ctx.fillStyle = 'rgba(43,29,18,0.85)';
  roundRect(ctx, VIEW_WIDTH - 208, 12, 196, 40, 8);
  ctx.fill();
  text(ctx, rush ? 'RUSH!' : 'SHIFT', VIEW_WIDTH - 196, 32, 12, rush ? '#ff9d2e' : '#ffc93c', 'left');
  text(ctx, timeText, VIEW_WIDTH - 24, 32, 20, rush && Math.floor(state.timeLeft * 2) % 2 === 0 ? '#ff6b5e' : '#fff6e3', 'right');

  // Score and coins, top left.
  ctx.fillStyle = 'rgba(43,29,18,0.85)';
  roundRect(ctx, 12, 12, 196, 40, 8);
  ctx.fill();
  text(ctx, `★ ${state.score}`, 26, 32, 17, '#ffc93c', 'left');
  text(ctx, `● ${state.coins} coins`, 200, 32, 14, '#fff6e3', 'right');

  // Hearts.
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < state.hearts ? '#e8483f' : 'rgba(255,246,227,0.25)';
    ctx.beginPath();
    ctx.arc(28 + i * 26, 66, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, `Served ${state.served}`, 100, 66, 13, '#fff6e3', 'left');
  if (state.combo >= 2) {
    text(ctx, `COMBO x${state.combo}`, 200, 66, 13, '#ffc93c', 'left');
  }

  // Mute hint, bottom right.
  text(ctx, 'M mute  •  P pause  •  R restart', VIEW_WIDTH - 12, VIEW_HEIGHT - 12, 11, 'rgba(255,246,227,0.6)', 'right');
}

function drawPopups(ctx, state) {
  for (const popup of state.popups) {
    ctx.globalAlpha = Math.min(1, popup.life);
    text(ctx, popup.text, popup.x, popup.y, 18, popup.color);
    ctx.globalAlpha = 1;
  }
  if (state.banner) {
    ctx.globalAlpha = Math.min(1, state.banner.life);
    text(ctx, state.banner.text, VIEW_WIDTH / 2, 268, 34, '#ffc93c');
    text(ctx, state.banner.sub, VIEW_WIDTH / 2, 300, 16, '#fff6e3');
    ctx.globalAlpha = 1;
  }
}

function drawHint(ctx, hint) {
  if (!hint) return;
  const w = ctx.measureText(hint).width + 28;
  ctx.fillStyle = 'rgba(43,29,18,0.85)';
  roundRect(ctx, (VIEW_WIDTH - w) / 2, VIEW_HEIGHT - 44, w, 30, 8);
  ctx.fill();
  text(ctx, hint, VIEW_WIDTH / 2, VIEW_HEIGHT - 29, 14, '#fff6e3');
}

// --- Screens ----------------------------------------------------------------

function drawTitle(ctx, state, time) {
  ctx.fillStyle = 'rgba(43,29,18,0.55)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = '#fff6e3';
  roundRect(ctx, 290, 130, 700, 420, 18);
  ctx.fill();
  ctx.strokeStyle = '#e8b06a';
  ctx.lineWidth = 4;
  ctx.stroke();
  drawIngredient(ctx, 'bun', 400, 200, 64);
  drawIngredient(ctx, 'patty', 470, 200, 64, 'grilled');
  drawIngredient(ctx, 'tomato', 540, 200, 64);
  drawIngredient(ctx, 'lettuce', 610, 200, 64);
  drawIngredient(ctx, 'cheese', 680, 200, 64);
  text(ctx, 'SIZZLE & SERVE', 640, 258, 44, '#2b1d12');
  text(ctx, 'Lunchtime Rush', 640, 300, 22, '#e8483f');
  text(ctx, 'Run the kitchen. Chop, grill, plate, serve — before the tickets run out.', 640, 340, 16, '#5d3a1e');
  text(ctx, 'WASD / arrows to move  •  E or click to use a station', 640, 378, 15, '#2b1d12');
  text(ctx, 'Chop lettuce & tomato  •  Grill patties  •  Match the ticket, serve at the window', 640, 404, 15, '#2b1d12');
  text(ctx, '3-minute shift  •  combos pay extra  •  3 lost orders ends the rush', 640, 430, 15, '#2b1d12');
  const pulse = 0.65 + Math.sin(time * 4) * 0.35;
  ctx.globalAlpha = pulse;
  text(ctx, 'Press ENTER or click to start cooking', 640, 490, 19, '#e8483f');
  ctx.globalAlpha = 1;
  void state;
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(43,29,18,0.6)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = '#fff6e3';
  roundRect(ctx, 340, 140, 600, 400, 18);
  ctx.fill();
  ctx.strokeStyle = '#e8b06a';
  ctx.lineWidth = 4;
  ctx.stroke();
  const stars = state.score >= 400 ? 3 : state.score >= 250 ? 2 : state.score >= 120 ? 1 : 0;
  text(ctx, 'SHIFT OVER', 640, 190, 38, '#2b1d12');
  let starText = '';
  for (let i = 0; i < 3; i++) starText += i < stars ? '★' : '☆';
  text(ctx, starText, 640, 240, 40, '#ffc93c');
  text(ctx, `Score  ${state.score}      Coins  ${state.coins}`, 640, 300, 20, '#2b1d12');
  text(ctx, `Orders served  ${state.served}      Lost  ${state.expired}      Best combo  x${state.bestCombo}`, 640, 340, 16, '#5d3a1e');
  const verdict = stars === 3
    ? 'Head chef material. The crowd wants an encore.'
    : stars === 2
      ? 'A solid shift — the regulars are happy.'
      : stars === 1
        ? 'The kitchen survived. Barely.'
        : 'The tickets won this round. Run it back.';
  text(ctx, verdict, 640, 380, 16, '#e8483f');
  const pulse = 0.65 + Math.sin(Date.now() / 300) * 0.35;
  ctx.globalAlpha = pulse;
  text(ctx, 'Press R to cook again', 640, 470, 18, '#e8483f');
  ctx.globalAlpha = 1;
  void state;
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(43,29,18,0.55)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  text(ctx, 'PAUSED', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 10, 40, '#fff6e3');
  text(ctx, 'Press P to keep cooking', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 34, 16, '#ffc93c');
}

// --- Main render ------------------------------------------------------------

export function render(ctx, state, hint, time) {
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  drawWall(ctx);
  drawFloor(ctx, time);
  drawIsland(ctx);
  for (const station of Object.values(STATIONS)) drawStation(ctx, station, state, time);
  drawWalkTarget(ctx, state);
  drawChef(ctx, state, time);
  drawHud(ctx, state);
  drawPopups(ctx, state);
  if (state.screen === 'playing') drawHint(ctx, hint);
  if (state.screen === 'title') drawTitle(ctx, state, time);
  if (state.screen === 'over') drawGameOver(ctx, state);
  if (state.paused) drawPaused(ctx);
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(232,72,63,${state.flash * 0.25})`;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }
}
