import { supabase } from './supabase';
import type { InteractionResult } from '../types/game';

interface InteractionParams {
  itemId: string | null;
  objectId: string;
  itemTags: string[];
  objectTags: string[];
  objectState: string | null;
  itemName: string;
  objectName: string;
}

const FALLBACK_RESULT: InteractionResult = {
  result_state: null,
  output_item: null,
  output_item_id: null,
  output_item_tags: null,
  description: "That doesn't seem to work.",
  cached: false,
};

/** Call the interact edge function. Returns a graceful fallback on any error. */
export async function resolveInteraction(
  params: InteractionParams,
): Promise<InteractionResult> {
  try {
    const { data, error } = await supabase.functions.invoke('interact', {
      body: {
        item_id: params.itemId,
        object_id: params.objectId,
        item_tags: params.itemTags,
        object_tags: params.objectTags,
        object_state: params.objectState,
        item_name: params.itemName,
        object_name: params.objectName,
      },
    });

    if (error || !data) {
      console.warn('interact edge function error:', error);
      return FALLBACK_RESULT;
    }

    return data as InteractionResult;
  } catch (err) {
    console.warn('interact call failed:', err);
    return FALLBACK_RESULT;
  }
}
