import { supabase } from './supabase';
import { useJobStore } from '../stores/jobStore';
import { useJacobsStore } from '../stores/jacobsStore';
import { useGameStore } from '../stores/gameStore';
import type { Job, ReviewResult } from '../types/job';
import type { JacobsEvent, JacobsMood } from '../types/jacobs';

// ─── Constants ──────────────────────────────────────────────────────

const FIRST_PHASE_DELAY = 5_000; // ms before first job assignment
const REVIEW_SPEECH_DURATION = 8_000; // ms to show review speech before next phase

// ─── Job Pool ───────────────────────────────────────────────────────

const JOB_POOL: Job[] = [
  {
    id: 'sort-files',
    title: 'SORT FILES',
    description:
      'I NEED THOSE FILES SORTED. USE THE FILING CABINET. EFFICIENCY IS MANDATORY.',
    objectHints: ['Filing Cabinet'],
  },
  {
    id: 'fix-coffee',
    title: 'FIX COFFEE MACHINE',
    description:
      'THE COFFEE MACHINE IS DOWN AGAIN. FIX IT OR FACE CONSEQUENCES.',
    objectHints: ['Coffee Machine'],
  },
  {
    id: 'water-plant',
    title: 'WATER THE PLANT',
    description:
      'THE OFFICE PLANT IS A VALUED EMPLOYEE. KEEP IT ALIVE. THAT IS YOUR JOB.',
    objectHints: ['Plant'],
  },
  {
    id: 'clean-desk',
    title: 'CLEAN YOUR DESK',
    description:
      'YOUR WORKSPACE IS A DISGRACE. INTERACT WITH THE DESK. MAKE IT PRESENTABLE.',
    objectHints: ['Desk'],
  },
  {
    id: 'check-terminal',
    title: 'SYSTEM CHECK',
    description:
      'RUN A DIAGNOSTIC ON THE TERMINAL. THE NETWORK HAS BEEN ACTING UP.',
    objectHints: ['Terminal', "Jacobs' Screen"],
  },
];

// ─── Module State ───────────────────────────────────────────────────

let tickIntervalId: ReturnType<typeof setInterval> | null = null;
let startTimeoutId: ReturnType<typeof setTimeout> | null = null;
let lastJobId: string | null = null;

// ─── Job Selection ──────────────────────────────────────────────────

function pickRandomJob(): Job {
  const candidates = JOB_POOL.filter((j) => j.id !== lastJobId);
  const pool = candidates.length > 0 ? candidates : JOB_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Phase Lifecycle ────────────────────────────────────────────────

function assignNewJob(): void {
  const job = pickRandomJob();
  lastJobId = job.id;

  useJobStore.getState().startPhase(job);
  useJacobsStore.getState().setSpeech(job.description);
}

function tickPhaseTimer(): void {
  const store = useJobStore.getState();
  if (store.phaseStatus !== 'WORKING') return;

  store.tickTimer();

  // Check after tick
  if (store.phaseTimeRemaining <= 1) {
    triggerReview();
  }
}

// ─── Review ─────────────────────────────────────────────────────────

const FALLBACK_REVIEW: ReviewResult = {
  speech: 'REVIEW INCONCLUSIVE. PARTIAL CREDIT.',
  score: 2,
  mood: 'NEUTRAL',
};

async function callJacobsReview(
  events: JacobsEvent[],
  job: Job,
  mood: JacobsMood,
  objectStates: Record<string, { tags: string[]; states: string[] }>,
): Promise<ReviewResult> {
  try {
    const { data, error } = await supabase.functions.invoke('jacobs-review', {
      body: { events, job, current_mood: mood, world_state: objectStates },
    });
    if (error || !data) {
      console.warn('jacobs-review error:', error);
      return { ...FALLBACK_REVIEW, mood };
    }
    return data as ReviewResult;
  } catch (err) {
    console.warn('jacobs-review call failed:', err);
    return { ...FALLBACK_REVIEW, mood };
  }
}

async function triggerReview(): Promise<void> {
  const jobStore = useJobStore.getState();
  if (jobStore.reviewInProgress) return;

  jobStore.endPhase();
  jobStore.setReviewInProgress(true);

  const events = [...jobStore.phaseEvents];
  const job = jobStore.currentJob;
  const mood = useJacobsStore.getState().mood;
  const objectStates = useGameStore.getState().objectStates;

  if (!job) {
    jobStore.setReviewInProgress(false);
    assignNewJob();
    return;
  }

  const result = await callJacobsReview(events, job, mood, objectStates);

  // Apply review results
  useJacobsStore.getState().setMood(result.mood as JacobsMood);
  useJacobsStore.getState().setSpeech(result.speech);
  useGameStore.getState().addBucks(result.score);

  // Wait for the review speech to display, then start next phase
  setTimeout(() => {
    useJobStore.getState().setReviewInProgress(false);
    assignNewJob();
  }, REVIEW_SPEECH_DURATION);
}

// ─── Lifecycle (called from OfficeScene) ────────────────────────────

export function startJobCycle(): void {
  // If a phase is already in progress (e.g., room transition), resume ticking
  const store = useJobStore.getState();
  if (store.phaseStatus === 'WORKING') {
    if (!tickIntervalId) {
      tickIntervalId = setInterval(tickPhaseTimer, 1_000);
    }
    return;
  }

  // Clean start: wait a few seconds then assign first job
  startTimeoutId = setTimeout(() => {
    assignNewJob();
    startTimeoutId = null;
  }, FIRST_PHASE_DELAY);

  if (tickIntervalId) clearInterval(tickIntervalId);
  tickIntervalId = setInterval(tickPhaseTimer, 1_000);
}

export function stopJobCycle(): void {
  if (tickIntervalId) {
    clearInterval(tickIntervalId);
    tickIntervalId = null;
  }
  if (startTimeoutId) {
    clearTimeout(startTimeoutId);
    startTimeoutId = null;
  }
}
