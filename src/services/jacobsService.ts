import { supabase } from './supabase';
import { useJacobsStore } from '../stores/jacobsStore';
import { useGameStore } from '../stores/gameStore';
import { useJobStore } from '../stores/jobStore';
import type { JacobsReaction, JacobsEvent, JacobsMood } from '../types/jacobs';
import type { SessionEndType } from '../types/game';

const EVENT_THRESHOLD = 5;
const TIME_THRESHOLD = 30_000;
const POLL_INTERVAL = 2_000;

let lastProcessTime = Date.now();
let checkIntervalId: ReturnType<typeof setInterval> | null = null;

const FALLBACK_REACTION: JacobsReaction = {
  speech: '...',
  mood: 'NEUTRAL',
  effects: [],
};

async function callJacobsReact(
  events: JacobsEvent[],
  mood: JacobsMood,
  objectStates: Record<string, { tags: string[]; states: string[] }>,
  currentJob: { title: string; description: string } | null,
): Promise<JacobsReaction> {
  try {
    const jobState = useJobStore.getState();
    const sessionStats = {
      game_time_minutes: jobState.gameTimeMinutes,
      bucks: useGameStore.getState().bucks,
      phases_completed: jobState.phaseNumber,
      review_scores: jobState.reviewScores,
    };
    const { data, error } = await supabase.functions.invoke('jacobs-react', {
      body: { events, current_mood: mood, world_state: objectStates, current_job: currentJob, session_stats: sessionStats },
    });
    if (error || !data) {
      console.warn('jacobs-react error:', error);
      return { ...FALLBACK_REACTION, mood };
    }
    return data as JacobsReaction;
  } catch (err) {
    console.warn('jacobs-react call failed:', err);
    return { ...FALLBACK_REACTION, mood };
  }
}

function applyEffects(reaction: JacobsReaction): void {
  const gameStore = useGameStore.getState();
  const nameMap = useJacobsStore.getState().objectNameMap;

  for (const effect of reaction.effects) {
    if (effect.type === 'CHANGE_STATE') {
      const id = nameMap[effect.targetName.toLowerCase()];
      if (id) {
        gameStore.updateObjectState(id, [effect.newState]);
      } else {
        console.warn('Jacobs effect: unknown object', effect.targetName);
      }
    }
  }
}

async function processEvents(): Promise<void> {
  const jacobsStore = useJacobsStore.getState();
  if (jacobsStore.isProcessing) return;
  if (jacobsStore.eventLog.length === 0) return;

  jacobsStore.setProcessing(true);
  const events = [...jacobsStore.eventLog];
  jacobsStore.clearEventLog();
  lastProcessTime = Date.now();

  const gameState = useGameStore.getState();
  const jobState = useJobStore.getState();
  const currentJob = jobState.currentJob
    ? { title: jobState.currentJob.title, description: jobState.currentJob.description }
    : null;
  const reaction = await callJacobsReact(
    events,
    jacobsStore.mood,
    gameState.objectStates,
    currentJob,
  );

  jacobsStore.setMood(reaction.mood as JacobsMood);

  if (reaction.speech && reaction.speech !== '...') {
    jacobsStore.setSpeech(reaction.speech);
  }

  applyEffects(reaction);

  // Check for AI-driven game end
  const gameEnd = (reaction as JacobsReaction & { game_end?: string }).game_end;
  if (gameEnd && gameEnd !== 'NONE') {
    useGameStore.getState().endSession(gameEnd as SessionEndType, reaction.speech);
  }

  jacobsStore.setProcessing(false);
}

function checkThreshold(): void {
  // Skip if session ended or during job review
  if (useGameStore.getState().sessionStatus !== 'PLAYING') return;
  if (useJobStore.getState().reviewInProgress) return;
  if (useJacobsStore.getState().speechTitle) return;

  const { eventLog } = useJacobsStore.getState();
  if (eventLog.length === 0) return;

  const countReached = eventLog.length >= EVENT_THRESHOLD;
  const timeReached = Date.now() - lastProcessTime >= TIME_THRESHOLD;

  if (countReached || timeReached) {
    processEvents();
  }
}

export function startJacobsLoop(): void {
  lastProcessTime = Date.now();
  if (checkIntervalId) clearInterval(checkIntervalId);
  checkIntervalId = setInterval(checkThreshold, POLL_INTERVAL);
}

export function stopJacobsLoop(): void {
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
  }
}
