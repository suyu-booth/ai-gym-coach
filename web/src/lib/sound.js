/**
 * Audio chimes for timer completion.
 * Uses Web Audio API to synthesize tones — no external asset needed.
 *
 * iOS requires an audio context to be created/resumed inside a user gesture.
 * Call `unlockAudio()` on first interaction, then `playChime()` whenever needed.
 */

let _ctx = null;
let _muted = false;

export function setMuted(value) {
  _muted = !!value;
}

export function unlockAudio() {
  if (_ctx) return _ctx;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    _ctx = new Ctx();
    if (_ctx.state === "suspended") _ctx.resume();
    return _ctx;
  } catch {
    return null;
  }
}

function tone(ctx, freq, startOffset, duration, volume = 0.18) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** A two-note rising chime — gentle, warm, ~0.6s total. */
export function playChime() {
  if (_muted) return;
  const ctx = unlockAudio();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  // Major third: A5 → C#6
  tone(ctx, 880, 0, 0.45, 0.16);
  tone(ctx, 1108.73, 0.18, 0.55, 0.14);
}

/** A longer triple-tone "session done" chime, used for sauna end. */
export function playLongChime() {
  if (_muted) return;
  const ctx = unlockAudio();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  tone(ctx, 659.25, 0, 0.4, 0.16);   // E5
  tone(ctx, 783.99, 0.22, 0.4, 0.16); // G5
  tone(ctx, 1046.50, 0.44, 0.7, 0.18); // C6
}
