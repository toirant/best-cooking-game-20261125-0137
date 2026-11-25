// Sizzle & Serve — the chef: movement, collision with the kitchen's
// furniture, and click-to-walk. The chef never leaves the kitchen floor
// and never walks through a counter.

import { ISLAND, PLAYER_RADIUS, PLAYER_SPEED, STATIONS, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';

const FLOOR = { top: 226, bottom: 700, left: 14, right: 1266 };

function colliders() {
  const boxes = Object.values(STATIONS).map((station) => ({
    x: station.x - 4,
    y: station.y - 4,
    w: station.w + 8,
    h: station.h + 8,
  }));
  boxes.push({ x: ISLAND.x - 4, y: ISLAND.y - 4, w: ISLAND.w + 8, h: ISLAND.h + 8 });
  return boxes;
}

function blockedAt(x, y, boxes) {
  for (const box of boxes) {
    const nearestX = Math.max(box.x, Math.min(x, box.x + box.w));
    const nearestY = Math.max(box.y, Math.min(y, box.y + box.h));
    if (Math.hypot(x - nearestX, y - nearestY) < PLAYER_RADIUS) return true;
  }
  return false;
}

export function updatePlayer(state, input, dt) {
  const player = state.player;
  const boxes = colliders();
  let vx = 0;
  let vy = 0;
  player.arrived = false;

  const keys = input.moveVector();
  if (keys.x !== 0 || keys.y !== 0) {
    vx = keys.x;
    vy = keys.y;
    player.walkTarget = null;
    input.clearClickTarget();
  } else if (player.walkTarget) {
    const dx = player.walkTarget.x - player.x;
    const dy = player.walkTarget.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 10) {
      player.walkTarget = null;
      player.arrived = true;
    } else {
      vx = dx / distance;
      vy = dy / distance;
    }
  }

  if (vx !== 0 || vy !== 0) {
    player.moving = true;
    player.bob += dt * 14;
    if (Math.abs(vx) > Math.abs(vy)) player.facing = vx > 0 ? 'right' : 'left';
    else player.facing = vy > 0 ? 'down' : 'up';
  } else {
    player.moving = false;
  }

  const step = PLAYER_SPEED * dt;
  const nextX = player.x + vx * step;
  const nextY = player.y + vy * step;
  const clampedX = Math.max(FLOOR.left + PLAYER_RADIUS, Math.min(FLOOR.right - PLAYER_RADIUS, nextX));
  const clampedY = Math.max(FLOOR.top + PLAYER_RADIUS, Math.min(FLOOR.bottom - PLAYER_RADIUS, nextY));

  // Move axis by axis so the chef slides along counters instead of sticking.
  if (!blockedAt(clampedX, player.y, boxes)) player.x = clampedX;
  if (!blockedAt(player.x, clampedY, boxes)) player.y = clampedY;

  const click = input.takeClickTarget();
  if (click) {
    player.walkTarget = {
      x: Math.max(FLOOR.left + PLAYER_RADIUS, Math.min(FLOOR.right - PLAYER_RADIUS, click.x)),
      y: Math.max(FLOOR.top + PLAYER_RADIUS, Math.min(FLOOR.bottom - PLAYER_RADIUS, click.y)),
    };
  }
}
