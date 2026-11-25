// Sizzle & Serve: Lunchtime Rush — bootstrap and game loop.
// Owns the frame clock, the screen flow (title → playing → over), the shift
// timer, and the wiring between input, kitchen rules and the renderer.

import { SHIFT_SECONDS, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { createInput } from './input.js';
import { interact, stationHint, updateGrill } from './kitchen.js';
import { updatePlayer } from './player.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { createState, updateOrders, updatePopups } from './state.js';
import { ensureAudio, sfx, startMusic, stopMusic, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');
const input = createInput(canvas);

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_WIDTH, window.innerHeight / VIEW_HEIGHT);
  canvas.width = VIEW_WIDTH;
  canvas.height = VIEW_HEIGHT;
  canvas.style.width = `${Math.floor(VIEW_WIDTH * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_HEIGHT * scale)}px`;
}

fitCanvas();
window.addEventListener('resize', fitCanvas);

// A staged screenshot (?shot=start|play|serve|end) renders one frozen frame
// of the real game and stops: no loop, no timers, no audio.
const shotName = new URLSearchParams(window.location.search).get('shot');
const staged = shotName ? stageShot(shotName) : null;
if (staged) {
  render(ctx, staged, '', 1.6);
  document.title = `Sizzle & Serve — ${shotName}`;
} else {
  runGame();
}

function runGame() {
  let state = createState();
  let lastTime = performance.now();
  let hint = '';

  function startShift() {
    state = createState();
    state.screen = 'playing';
    ensureAudio();
    sfx.start();
    startMusic();
    announce('Shift started. First orders are coming in.');
  }

  function endShift(reason) {
    state.screen = 'over';
    stopMusic();
    sfx.gameOver();
    announce(`Shift over. ${reason} Score ${state.score}, served ${state.served}.`);
  }

  function announce(message) {
    if (statusLine) statusLine.textContent = message;
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    const time = now / 1000;

    if (input.wasPressed('m')) state.muted = toggleMute();
    if (input.wasPressed('p') && state.screen === 'playing') state.paused = !state.paused;
    if (input.wasPressed('r') && state.screen !== 'title') startShift();

    if (state.screen === 'title') {
      if (input.isActionPressed() || input.takeClickTarget()) startShift();
    } else if (state.screen === 'playing' && !state.paused) {
      state.elapsed += dt;
      state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
      if (state.timeLeft <= 10.5 && state.timeLeft > 10) sfx.tick();

      updatePlayer(state, input, dt);

      // Click-to-walk: arriving at the clicked spot uses the station there.
      if (state.player.arrived) {
        const result = interact(state);
        if (result === 'served') announce(`Order served! Score ${state.score}, combo x${state.combo}.`);
      }

      updateGrill(state, dt);
      const lost = updateOrders(state, dt);
      if (lost > 0) {
        sfx.expire();
        announce(`An order ran out of patience. ${state.hearts} hearts left.`);
        if (state.hearts <= 0) endShift('The crowd walked out.');
      }
      updatePopups(state, dt);
      hint = stationHint(state);

      if (input.isActionPressed()) {
        const result = interact(state);
        if (result === 'served') announce(`Order served! Score ${state.score}, combo x${state.combo}.`);
      }

      if (state.timeLeft <= 0 && state.screen === 'playing') endShift('The lunch rush is done.');
    } else if (state.screen === 'over') {
      if (input.wasPressed('enter') || input.wasPressed(' ')) startShift();
    }

    render(ctx, state, hint, time);
    input.endFrame();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
