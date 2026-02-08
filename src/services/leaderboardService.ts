import { supabase } from './supabase';

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  bucks: number;
  phases_survived: number;
  time_survived_minutes: number;
  end_type: string;
  jacobs_mood: string;
  created_at: string;
}

/** Insert a new leaderboard entry for a winning player. */
export async function submitScore(
  entry: Omit<LeaderboardEntry, 'id' | 'created_at'>,
): Promise<LeaderboardEntry | null> {
  const { data, error } = await supabase
    .from('leaderboard')
    .insert(entry)
    .select()
    .single();

  if (error) {
    console.error('Failed to submit leaderboard entry:', error);
    return null;
  }
  return data;
}

/** Fetch top N leaderboard entries, ranked by fastest escape time. */
export async function fetchLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('time_survived_minutes', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch leaderboard:', error);
    return [];
  }
  return data ?? [];
}
