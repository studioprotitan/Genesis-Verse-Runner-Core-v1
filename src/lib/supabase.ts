import { createClient } from '@supabase/supabase-js';
import { ScoreEntry } from '../types';

// Retrieve credentials from environment variables
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Safely initialize the client, fallback to null if credentials are not configured yet
export const supabaseClient = isConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

/**
 * Persist high scores using real Supabase if credentials exist, otherwise utilize local persistence.
 */
export async function saveHighScore(entry: ScoreEntry): Promise<{ success: boolean; error?: string; realDatabase: boolean }> {
  const timestamp = new Date().toISOString();
  const finalEntry = { ...entry, created_at: timestamp };

  if (isConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('abyssum_high_scores')
        .insert([finalEntry]);

      if (error) {
        console.error('Supabase save error, falling back locally:', error);
        saveLocalScore(finalEntry);
        return { success: true, error: error.message, realDatabase: false };
      }
      return { success: true, realDatabase: true };
    } catch (err: any) {
      console.error('Network/Client error saving score to Supabase, saving locally:', err);
      saveLocalScore(finalEntry);
      return { success: true, error: err.message || 'Network error', realDatabase: false };
    }
  } else {
    // Graceful fallback to client storage
    saveLocalScore(finalEntry);
    return { success: true, realDatabase: false };
  }
}

/**
 * Fetch high scores. Merges both live database scores and local entries, sorted high to low.
 */
export async function getHighScores(): Promise<{ data: ScoreEntry[]; realDatabase: boolean }> {
  let dbScores: ScoreEntry[] = [];
  let isRealDb = false;

  if (isConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('abyssum_high_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);

      if (!error && data) {
        dbScores = data as ScoreEntry[];
        isRealDb = true;
      } else if (error) {
        console.warn('Supabase fetch failed, retrieving local cache:', error.message);
      }
    } catch (e) {
      console.warn('Supabase fetch network error, using local scores:', e);
    }
  }

  // Load local backups & merge to ensure the user always sees their own offline performance
  const localScores = getLocalScores();
  
  // Merge, remove duplicates, and sort
  const combined = [...dbScores];
  for (const ls of localScores) {
    // Unique check
    const exists = combined.some(item => item.username === ls.username && item.score === ls.score);
    if (!exists) {
      combined.push(ls);
    }
  }

  combined.sort((a, b) => b.score - a.score);
  return { 
    data: combined.slice(0, 10), 
    realDatabase: isRealDb 
  };
}

// Private local storage helpers
function getLocalScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem('abyssum_local_highscores');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading local scores:', e);
  }
  
  // Fallback initial seeded values for sci-fi atmosphere
  return [
    { username: 'CST_Commander', score: 25000, distance: 3000, duration_seconds: 120, character_class: 'CST-ERT Trooper' },
    { username: 'ForgePilot_X', score: 18400, distance: 2200, duration_seconds: 94, character_class: 'Formula Pilot' },
    { username: 'AbyssuSiren', score: 12900, distance: 1600, duration_seconds: 70, character_class: 'Pulse Siren' },
  ];
}

function saveLocalScore(entry: ScoreEntry) {
  try {
    const currentList = getLocalScores();
    currentList.push(entry);
    currentList.sort((a, b) => b.score - a.score);
    localStorage.setItem('abyssum_local_highscores', JSON.stringify(currentList.slice(0, 50)));
  } catch (e) {
    console.error('Failed to write score to localStorage:', e);
  }
}

export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

export function getSupabaseCredentials() {
  return {
    url: SUPABASE_URL,
    configured: isConfigured
  };
}
