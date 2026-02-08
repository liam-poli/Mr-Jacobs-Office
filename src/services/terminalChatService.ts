import { supabase } from './supabase';
import { useJacobsStore } from '../stores/jacobsStore';
import { useJobStore } from '../stores/jobStore';
import { useGameStore } from '../stores/gameStore';
import type { JacobsMood } from '../types/jacobs';
import type { SessionEndType } from '../types/game';

export interface ChatMessage {
  role: 'player' | 'jacobs';
  text: string;
}

interface JacobsChatResponse {
  reply: string;
  mood: JacobsMood;
}

const FALLBACK: JacobsChatResponse = {
  reply: 'THE TERMINAL APPEARS TO BE EXPERIENCING TECHNICAL DIFFICULTIES.',
  mood: 'NEUTRAL',
};

export async function sendTerminalMessage(
  message: string,
  history: ChatMessage[],
  currentMood: JacobsMood,
): Promise<JacobsChatResponse> {
  try {
    // Gather recent events so Jacobs knows what the player has been doing
    const jobState = useJobStore.getState();
    const recentEvents = jobState.phaseEvents.slice(-15).map((e) => ({
      type: e.type,
      details: e.details,
    }));
    const currentJob = jobState.currentJob
      ? { title: jobState.currentJob.title, description: jobState.currentJob.description }
      : null;

    const sessionStats = {
      game_time_minutes: jobState.gameTimeMinutes,
      bucks: useGameStore.getState().bucks,
      phases_completed: jobState.phaseNumber,
      review_scores: jobState.reviewScores,
    };
    const { data, error } = await supabase.functions.invoke('jacobs-chat', {
      body: {
        message,
        history: history.slice(-10),
        current_mood: currentMood,
        recent_events: recentEvents,
        current_job: currentJob,
        session_stats: sessionStats,
      },
    });

    if (error || !data) {
      console.warn('jacobs-chat error:', error);
      return { ...FALLBACK, mood: currentMood };
    }

    const response = data as JacobsChatResponse;

    // Update mood in Jacobs store
    useJacobsStore.getState().setMood(response.mood);

    // Log the chat exchange as an event for the Jacobs reaction loop + job phase
    const chatEvent = {
      type: 'TERMINAL_CHAT' as const,
      timestamp: Date.now(),
      player: 'PLAYER 1',
      details: {
        playerMessage: message,
        jacobsReply: response.reply,
        resultMood: response.mood,
      },
    };
    useJacobsStore.getState().logEvent(chatEvent);
    useJobStore.getState().logPhaseEvent(chatEvent);

    // Check for AI-driven game end
    const gameEnd = (data as { game_end?: string }).game_end;
    if (gameEnd && gameEnd !== 'NONE') {
      useGameStore.getState().endSession(gameEnd as SessionEndType, response.reply);
    }

    return response;
  } catch (err) {
    console.warn('jacobs-chat call failed:', err);
    return { ...FALLBACK, mood: currentMood };
  }
}
