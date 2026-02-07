import { useSettingsStore } from '../stores/settingsStore';

/**
 * N64-style character mumble synthesizer.
 * Uses Web Audio API to generate short square-wave blips
 * at randomised pitches — like Banjo-Kazooie / Animal Crossing.
 */

const BASE_FREQ = 220;      // Hz — base pitch
const FREQ_RANGE = 160;     // Hz — random variation above base
const BLIP_DURATION = 0.06; // seconds per blip
const VOLUME = 0.12;

let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

/** Play a single mumble blip at a randomised pitch. */
export function playMumble(): void {
  if (!useSettingsStore.getState().soundEnabled) return;

  const ac = getContext();
  if (ac.state === 'suspended') ac.resume();

  const freq = BASE_FREQ + Math.random() * FREQ_RANGE;
  const now = ac.currentTime;

  const osc = ac.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, now);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(VOLUME, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + BLIP_DURATION);

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.start(now);
  osc.stop(now + BLIP_DURATION);
}
