import { supabase } from './supabase';
import { useJacobsStore } from '../stores/jacobsStore';
import type { JacobsMood } from '../types/jacobs';

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
    const { data, error } = await supabase.functions.invoke('jacobs-chat', {
      body: {
        message,
        history: history.slice(-10),
        current_mood: currentMood,
      },
    });

    if (error || !data) {
      console.warn('jacobs-chat error:', error);
      return { ...FALLBACK, mood: currentMood };
    }

    const response = data as JacobsChatResponse;

    // Update mood in Jacobs store
    useJacobsStore.getState().setMood(response.mood);

    // Log the chat exchange as an event for the Jacobs reaction loop
    useJacobsStore.getState().logEvent({
      type: 'TERMINAL_CHAT',
      timestamp: Date.now(),
      player: 'PLAYER 1',
      details: {
        playerMessage: message,
        jacobsReply: response.reply,
        resultMood: response.mood,
      },
    });

    return response;
  } catch (err) {
    console.warn('jacobs-chat call failed:', err);
    return { ...FALLBACK, mood: currentMood };
  }
}
