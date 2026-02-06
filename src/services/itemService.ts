import { supabase } from './supabase';

export interface ServerItem {
  id: string;
  name: string;
  tags: string[];
  sprite_url: string | null;
}

/** Fetch items from Supabase by their IDs. Returns empty array on failure. */
export async function fetchItemsByIds(ids: string[]): Promise<ServerItem[]> {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, tags, sprite_url')
    .in('id', ids);

  if (error || !data) {
    console.warn('Failed to fetch items from Supabase:', error);
    return [];
  }
  return data;
}
