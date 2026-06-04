import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@read/daily-pick/v1';

export type StoredDailyPick = {
  dateKey: string;
  articleId: string;
};

export async function loadStoredDailyPick(): Promise<StoredDailyPick | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<StoredDailyPick>;
    if (typeof parsed.dateKey === 'string' && typeof parsed.articleId === 'string') {
      return { dateKey: parsed.dateKey, articleId: parsed.articleId };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveStoredDailyPick(pick: StoredDailyPick): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pick));
}