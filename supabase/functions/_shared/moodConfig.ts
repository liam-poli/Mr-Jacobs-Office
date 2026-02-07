export const VALID_MOODS = [
  "PLEASED", "PROUD", "IMPRESSED", "GENEROUS", "AMUSED",
  "NEUTRAL", "BORED",
  "SUSPICIOUS", "SMUG",
  "DISAPPOINTED", "SAD", "PARANOID", "FURIOUS",
  "UNHINGED", "MANIC", "GLITCHING",
];

export const MOOD_SEVERITY: Record<string, number> = {
  PLEASED: 1, PROUD: 1, IMPRESSED: 1, GENEROUS: 1, AMUSED: 1,
  NEUTRAL: 2, BORED: 2,
  SUSPICIOUS: 3, SMUG: 3,
  DISAPPOINTED: 4, SAD: 4, PARANOID: 4, FURIOUS: 4,
  UNHINGED: 5, MANIC: 5, GLITCHING: 5,
};

/** Validate mood transition: proposed mood must be within ±1 severity of current. */
export function validateMoodTransition(
  current: string,
  proposed: string,
): string {
  if (!VALID_MOODS.includes(proposed)) return current;
  const curSev = MOOD_SEVERITY[current] ?? 2;
  const newSev = MOOD_SEVERITY[proposed] ?? 2;
  if (Math.abs(curSev - newSev) <= 1) return proposed;
  return current;
}

export const MOOD_PROMPT_SECTION = `MOOD SYSTEM:
You have 16 moods grouped by severity (1-5). You may transition to any mood within ±1 severity of your current mood.
Level 1 (Positive): PLEASED, PROUD, IMPRESSED, GENEROUS, AMUSED
Level 2 (Neutral): NEUTRAL, BORED
Level 3 (Uneasy): SUSPICIOUS, SMUG
Level 4 (Hostile): DISAPPOINTED, SAD, PARANOID, FURIOUS
Level 5 (Chaotic): UNHINGED, MANIC, GLITCHING

Choose the mood that best fits your emotional reaction:
- Proud of the employee → PROUD. Amused by something funny → AMUSED. Impressed by skill → IMPRESSED. Feeling generous → GENEROUS.
- Bored by inaction → BORED. Suspicious of behavior → SUSPICIOUS. Smugly caught them → SMUG.
- Sad about state of affairs → SAD. Paranoid about conspiracies → PARANOID. Furiously angry → FURIOUS.
- Totally unhinged → UNHINGED. Hyperactive/manic → MANIC. System instability → GLITCHING.`;
