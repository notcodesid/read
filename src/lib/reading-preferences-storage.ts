import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_READING_PREFERENCES,
  DEFAULT_READING_STATS,
  type ReadingPreferences,
  type ReadingStats,
} from '@/types/reading-preferences';

const PREFS_KEY = '@read/reading-preferences/v1';
const STATS_KEY = '@read/reading-stats/v1';

export async function loadReadingPreferences(): Promise<ReadingPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) {
      return { ...DEFAULT_READING_PREFERENCES };
    }

    const parsed = JSON.parse(raw) as Partial<ReadingPreferences>;
    return { ...DEFAULT_READING_PREFERENCES, ...parsed };
  } catch {
    return { ...DEFAULT_READING_PREFERENCES };
  }
}

export async function saveReadingPreferences(prefs: ReadingPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function loadReadingStats(): Promise<ReadingStats> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) {
      return { ...DEFAULT_READING_STATS };
    }

    const parsed = JSON.parse(raw) as Partial<ReadingStats>;
    return {
      wpmSamples: Array.isArray(parsed.wpmSamples)
        ? parsed.wpmSamples.filter((n) => typeof n === 'number' && n > 0)
        : [],
      totalWordsRead: typeof parsed.totalWordsRead === 'number' ? parsed.totalWordsRead : 0,
    };
  } catch {
    return { ...DEFAULT_READING_STATS };
  }
}

export async function saveReadingStats(stats: ReadingStats): Promise<void> {
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
}