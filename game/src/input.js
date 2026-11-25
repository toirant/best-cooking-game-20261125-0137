// Sizzle & Serve — keyboard and mouse input.
// Movement keys are polled every frame; action keys fire once per press.
// A mouse click sets a walk target and the chef auto-interacts on arrival.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let clickTarget = null;
  let clickConsumed = true;

  const MOVE_KEYS = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'];
  const ACTION_KEYS = ['e', ' ', 'enter'];

  function keyName(event) {
    return event.key.toLowerCase();
  }

  window.addEventListener('keydown', (event) => {
    const name = keyName(event);
    if (MOVE_KEYS.includes(name) || ACTION_KEYS.includes(name)) event.preventDefault();
    if (!event.repeat) {
      keys.add(name);
      pressed.add(name);
    }
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(keyName(event));
  });
  window.addEventListener('blur', () => {
    keys.clear();
    pressed.clear();
  });

  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    clickTarget = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
    clickConsumed = false;
  });

  return {
    // A unit movement vector from the keys currently held down.
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x !== 0 && y !== 0) {
        const inv = 1 / Math.SQRT2;
        x *= inv;
        y *= inv;
      }
      return { x, y };
    },

    // True once for the frame the key went down.
    wasPressed(name) {
      return pressed.has(name.toLowerCase());
    },

    isActionPressed() {
      return ACTION_KEYS.some((key) => pressed.has(key));
    },

    takeClickTarget() {
      if (clickTarget && !clickConsumed) {
        clickConsumed = true;
        return clickTarget;
      }
      return null;
    },

    clearClickTarget() {
      clickTarget = null;
      clickConsumed = true;
    },

    // Called at the end of each frame so one press never fires twice.
    endFrame() {
      pressed.clear();
    },
  };
}
