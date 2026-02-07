import { useSettingsStore } from '../stores/settingsStore';

/**
 * Synthesized retro CRT terminal sounds using Web Audio API.
 * Keeps the 8-bit aesthetic consistent with the mumble service.
 */

let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function isMuted(): boolean {
  return !useSettingsStore.getState().soundEnabled;
}

/** CRT boot-up: rising frequency sweep with noise burst. */
export function playTerminalOpen(): void {
  if (isMuted()) return;
  const ac = getContext();
  const now = ac.currentTime;

  // Rising sweep
  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(80, now);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.25);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.3);

  // Static crackle (short noise burst)
  const bufferSize = ac.sampleRate * 0.12;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }
  const noise = ac.createBufferSource();
  noise.buffer = buffer;

  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(0.06, now + 0.05);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  // Bandpass filter to make it sound CRT-ish
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000;
  filter.Q.value = 0.8;

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ac.destination);
  noise.start(now + 0.05);
  noise.stop(now + 0.2);
}

/** CRT shutdown: falling frequency sweep. */
export function playTerminalClose(): void {
  if (isMuted()) return;
  const ac = getContext();
  const now = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}

/** Message sent: quick ascending double-beep. */
export function playTerminalSend(): void {
  if (isMuted()) return;
  const ac = getContext();
  const now = ac.currentTime;

  for (let i = 0; i < 2; i++) {
    const t = now + i * 0.08;
    const osc = ac.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440 + i * 220, t);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }
}

/** Reply received: descending tone before typewriter starts. */
export function playTerminalReceive(): void {
  if (isMuted()) return;
  const ac = getContext();
  const now = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(660, now);
  osc.frequency.exponentialRampToValueAtTime(330, now + 0.12);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.15);
}
