import type { JacobsMood } from '../types/jacobs';

export const MOOD_SEVERITY: Record<JacobsMood, number> = {
  PLEASED: 1, PROUD: 1, IMPRESSED: 1, GENEROUS: 1, AMUSED: 1,
  NEUTRAL: 2, BORED: 2,
  SUSPICIOUS: 3, SMUG: 3,
  DISAPPOINTED: 4, SAD: 4, PARANOID: 4, FURIOUS: 4,
  UNHINGED: 5, MANIC: 5, GLITCHING: 5,
};

export const ALL_MOODS: JacobsMood[] = [
  'PLEASED', 'PROUD', 'IMPRESSED', 'GENEROUS', 'AMUSED',
  'NEUTRAL', 'BORED',
  'SUSPICIOUS', 'SMUG',
  'DISAPPOINTED', 'SAD', 'PARANOID', 'FURIOUS',
  'UNHINGED', 'MANIC', 'GLITCHING',
];

export function getMoodColor(mood: JacobsMood): string {
  const sev = MOOD_SEVERITY[mood];
  if (sev >= 4) return 'var(--color-hud-danger)';
  if (sev === 3) return 'var(--color-hud-warning)';
  return 'var(--color-hud-accent)';
}
