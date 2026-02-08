import type { JacobsEvent, JacobsMood } from './jacobs';

// ─── Phase Status ───────────────────────────────────────────────────
export type PhaseStatus = 'IDLE' | 'WORKING' | 'REVIEWING';

// ─── Job Definition ─────────────────────────────────────────────────
export interface Job {
  id: string;
  title: string;           // Short HUD text, e.g. "SORT FILES"
  description: string;     // Full speech Jacobs gives when assigning
  objectHints: string[];   // Object names relevant to this job (AI context)
}

// ─── Review Result ──────────────────────────────────────────────────
export interface ReviewResult {
  speech: string;
  score: number;           // Bucks awarded (0-10)
  mood: JacobsMood;
}

// ─── Store State ────────────────────────────────────────────────────
export interface JobState {
  // Phase tracking
  phaseNumber: number;
  phaseStatus: PhaseStatus;
  phaseTimeRemaining: number;

  // In-game clock (minutes since midnight, starts at 540 = 9:00 AM)
  gameTimeMinutes: number;

  // Current job
  currentJob: Job | null;

  // Phase event log (separate from Jacobs' regular eventLog)
  phaseEvents: JacobsEvent[];
  logPhaseEvent: (event: JacobsEvent) => void;
  clearPhaseEvents: () => void;

  // Review state
  reviewInProgress: boolean;
  setReviewInProgress: (inProgress: boolean) => void;
  reviewScores: number[];
  recordReviewScore: (score: number) => void;

  // Actions
  startPhase: (job: Job) => void;
  tickTimer: () => void;
  endPhase: () => void;
  setPhaseStatus: (status: PhaseStatus) => void;
}
