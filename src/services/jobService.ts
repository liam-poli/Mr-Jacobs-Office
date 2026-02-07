import { supabase } from './supabase';
import { useJobStore } from '../stores/jobStore';
import { useJacobsStore } from '../stores/jacobsStore';
import { useGameStore } from '../stores/gameStore';
import type { Job, ReviewResult } from '../types/job';
import type { JacobsEvent, JacobsMood } from '../types/jacobs';
import type { SessionEndType } from '../types/game';

// ─── Constants ──────────────────────────────────────────────────────

const FIRST_PHASE_DELAY = 5_000; // ms before first job assignment
const REVIEW_SPEECH_DURATION = 8_000; // ms to show review speech before next phase

// ─── Job Templates ──────────────────────────────────────────────────

interface CatalogObject {
  id: string;
  name: string;
  tags: string[];
}

const TITLE_TEMPLATES: Record<string, string[]> = {
  ELECTRONIC: [
    'REBOOT {name}',
    'RUN DIAGNOSTICS ON {name}',
    'RECALIBRATE {name}',
    'CHECK {name}',
    'DEBUG {name}',
  ],
  ORGANIC: [
    'WATER {name}',
    'TEND TO {name}',
    'CHECK ON {name}',
    'CARE FOR {name}',
  ],
  METALLIC: [
    'CLEAN {name}',
    'REORGANIZE {name}',
    'FIX {name}',
    'MAINTAIN {name}',
    'POLISH {name}',
  ],
  GENERIC: [
    'INSPECT {name}',
    'DEAL WITH {name}',
    'SORT OUT {name}',
    'ATTEND TO {name}',
    'SERVICE {name}',
  ],
};

const DESC_TEMPLATES = [
  'THE {name} REQUIRES YOUR IMMEDIATE ATTENTION. DO IT. NOW.',
  '{name} ISN\'T GOING TO FIX ITSELF. GET TO WORK.',
  'I\'VE NOTICED THE {name} NEEDS WORK. HANDLE IT. IMMEDIATELY.',
  'THE {name} IS IN AN UNACCEPTABLE STATE. RECTIFY THIS.',
  'YOUR TASK: THE {name}. FAILURE IS NOT AN OPTION.',
  'REPORTS INDICATE THE {name} NEEDS SERVICING. THAT MEANS YOU.',
  'THE {name} HAS BEEN FLAGGED. ADDRESS IT BEFORE I LOSE PATIENCE.',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTitlePool(tags: string[]): string[] {
  const upper = tags.map((t) => t.toUpperCase());
  if (upper.includes('ELECTRONIC')) return TITLE_TEMPLATES.ELECTRONIC;
  if (upper.includes('ORGANIC')) return TITLE_TEMPLATES.ORGANIC;
  if (upper.includes('METALLIC') || upper.includes('HEAVY')) return TITLE_TEMPLATES.METALLIC;
  return TITLE_TEMPLATES.GENERIC;
}

function generateJob(obj: CatalogObject): Job {
  const titleTemplate = pick(getTitlePool(obj.tags));
  const descTemplate = pick(DESC_TEMPLATES);
  const name = obj.name.toUpperCase();

  return {
    id: obj.id,
    title: titleTemplate.replace('{name}', name),
    description: descTemplate.replace('{name}', name),
    objectHints: [obj.name],
  };
}

// ─── Module State ───────────────────────────────────────────────────

let tickIntervalId: ReturnType<typeof setInterval> | null = null;
let startTimeoutId: ReturnType<typeof setTimeout> | null = null;
let recentObjectIds: string[] = []; // track last 2 to avoid repeats
let objectCatalog: CatalogObject[] = [];

// ─── Object Catalog ─────────────────────────────────────────────────

async function ensureObjectCatalog(): Promise<void> {
  if (objectCatalog.length > 0) return;

  const { data, error } = await supabase
    .from('objects')
    .select('id, name, tags');

  if (error || !data) {
    console.warn('Failed to fetch object catalog for jobs:', error);
    return;
  }

  // Filter out doors — they're structural, not task-worthy
  objectCatalog = (data as CatalogObject[]).filter(
    (obj) => !obj.name.toLowerCase().includes('door'),
  );
}

// ─── Job Selection ──────────────────────────────────────────────────

function pickRandomJob(): Job {
  // Filter out recently used objects
  const candidates = objectCatalog.filter((o) => !recentObjectIds.includes(o.id));
  const pool = candidates.length > 0 ? candidates : objectCatalog;
  const obj = pick(pool);

  // Track recent (keep last 2)
  recentObjectIds.push(obj.id);
  if (recentObjectIds.length > 2) recentObjectIds.shift();

  return generateJob(obj);
}

// ─── Phase Lifecycle ────────────────────────────────────────────────

function assignNewJob(): void {
  if (objectCatalog.length === 0) {
    console.warn('No objects in catalog — cannot assign job');
    return;
  }
  const job = pickRandomJob();
  useJobStore.getState().startPhase(job);
  useJacobsStore.getState().setSpeech(job.description, 'NEW ASSIGNMENT');
}

const SESSION_END_TIME = 540.5; // DEBUG: 9:00:30 AM = 30s real time (normally 550.5 for 10m30s)

function tickPhaseTimer(): void {
  const store = useJobStore.getState();
  if (store.phaseStatus !== 'WORKING') return;

  // Check if session already ended
  if (useGameStore.getState().sessionStatus !== 'PLAYING') return;

  store.tickTimer();

  // Check for session time limit
  if (store.gameTimeMinutes >= SESSION_END_TIME) {
    useGameStore.getState().endSession(
      'TIME_UP',
      'THE OFFICE IS NOW CLOSED. YOUR SHIFT IS OVER. PERFORMANCE: INADEQUATE. REPORT BACK TOMORROW.',
    );
    return;
  }

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
    const jobState = useJobStore.getState();
    const sessionStats = {
      game_time_minutes: jobState.gameTimeMinutes,
      bucks: useGameStore.getState().bucks,
      phases_completed: jobState.phaseNumber,
    };
    const { data, error } = await supabase.functions.invoke('jacobs-review', {
      body: { events, job, current_mood: mood, world_state: objectStates, session_stats: sessionStats },
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
  useJacobsStore.getState().setSpeech(result.speech, 'PERFORMANCE REVIEW');
  useGameStore.getState().addBucks(result.score);

  // Check for AI-driven game end
  const gameEnd = (result as ReviewResult & { game_end?: string }).game_end;
  if (gameEnd && gameEnd !== 'NONE') {
    useGameStore.getState().endSession(gameEnd as SessionEndType, result.speech);
    return;
  }

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

  // Clean start: fetch object catalog, then assign first job
  startTimeoutId = setTimeout(async () => {
    await ensureObjectCatalog();
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
