import AsyncStorage from '@react-native-async-storage/async-storage';


import type { ReadingProgressStore } from '@/types/reading-progress';

const STORAGE_KEY = '@read/reading-progress/v1';

const EMPTY_STORE: ReadingProgressStore = {
  articles: {},
  themes: {},
  scrollPositions: {},
  recentOpens: {},
};

function migrateRecentOpens(store: ReadingProgressStore): ReadingProgressStore {
  const recentOpens = { ...(store.recentOpens ?? {}) };

  for (const [articleId, position] of Object.entries(store.scrollPositions)) {
    const existing = recentOpens[articleId];
    if (
      !existing ||
      new Date(position.updatedAt).getTime() > new Date(existing.openedAt).getTime()
    ) {
      recentOpens[articleId] = { openedAt: position.updatedAt };
    }
  }

  return { ...store, recentOpens };
}

function normalizeStore(parsed: Partial<ReadingProgressStore>): ReadingProgressStore {
  const store: ReadingProgressStore = {
    articles:
      parsed.articles && typeof parsed.articles === 'object' ? parsed.articles : {},
    themes: parsed.themes && typeof parsed.themes === 'object' ? parsed.themes : {},
    scrollPositions:
      parsed.scrollPositions && typeof parsed.scrollPositions === 'object'
        ? parsed.scrollPositions
        : {},
    recentOpens:
      parsed.recentOpens && typeof parsed.recentOpens === 'object' ? parsed.recentOpens : {},
  };

  return migrateRecentOpens(store);
}

export async function loadReadingProgress(): Promise<ReadingProgressStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...EMPTY_STORE };
    }

    const parsed = JSON.parse(raw) as Partial<ReadingProgressStore>;
    return normalizeStore(parsed);
  } catch {
    return { ...EMPTY_STORE };
  }
}

export async function saveReadingProgress(store: ReadingProgressStore): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrateRecentOpens(store)));
}