// Sizzle & Serve — tiny synthesised sound kit.
// No audio files: every blip, sizzle and ding is built from oscillators and
// filtered noise through the Web Audio API, so the game loads nothing.

let context = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

// A cheerful little bass-and-pluck loop: C major pentatonic walking bass with
// a sparse melody on top. Runs on a lookahead timer while the shift is live.
const BASS_LINE = [130.81, 130.81, 196.0, 164.81, 130.81, 196.0, 164.81, 146.83];
const MELODY = [523.25, 0, 659.25, 0, 783.99, 0, 659.25, 587.33, 523.25, 0, 0, 659.25, 0, 587.33, 0, 0];

export function ensureAudio() {
  if (!context) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
    } catch {
      context = null;
    }
  }
  if (context && context.state === 'suspended') void context.resume();
  return context;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freq, seconds, type, gainValue, when = 0) {
  if (!context || muted) return;
  const start = context.currentTime + when;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain).connect(context.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
}

function noiseBurst(seconds, filterFreq, gainValue) {
  if (!context || muted) return;
  const start = context.currentTime;
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = context.createGain();
  gain.gain.value = gainValue;
  source.connect(filter).connect(gain).connect(context.destination);
  source.start(start);
}

export const sfx = {
  pickup() { tone(520, 0.09, 'sine', 0.16); tone(780, 0.08, 'sine', 0.1, 0.04); },
  place() { tone(340, 0.08, 'triangle', 0.16); },
  chop() { noiseBurst(0.07, 1400, 0.5); tone(190, 0.06, 'square', 0.08); },
  chopped() { tone(660, 0.1, 'sine', 0.16); tone(880, 0.12, 'sine', 0.14, 0.07); },
  sizzle() { noiseBurst(0.5, 5200, 0.12); },
  grilled() { tone(587, 0.12, 'sine', 0.16); tone(880, 0.16, 'sine', 0.14, 0.08); },
  serve() {
    tone(523.25, 0.12, 'sine', 0.18);
    tone(659.25, 0.12, 'sine', 0.18, 0.09);
    tone(783.99, 0.22, 'sine', 0.2, 0.18);
  },
  wrong() { tone(160, 0.22, 'sawtooth', 0.12); tone(120, 0.28, 'sawtooth', 0.1, 0.1); },
  expire() { tone(220, 0.3, 'triangle', 0.14); tone(174, 0.4, 'triangle', 0.12, 0.16); },
  tick() { tone(980, 0.05, 'square', 0.06); },
  start() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.14, 'triangle', 0.16, i * 0.09));
  },
  gameOver() {
    [392, 329.63, 261.63, 196].forEach((f, i) => tone(f, 0.24, 'triangle', 0.16, i * 0.16));
  },
};

export function startMusic() {
  if (!context || musicTimer) return;
  musicTimer = setInterval(() => {
    if (muted || !context) return;
    const bass = BASS_LINE[musicStep % BASS_LINE.length];
    tone(bass, 0.22, 'triangle', 0.07);
    const note = MELODY[musicStep % MELODY.length];
    if (note) tone(note, 0.18, 'sine', 0.05);
    musicStep++;
  }, 240);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}
