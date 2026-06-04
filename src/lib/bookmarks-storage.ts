import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BookmarkStore } from '@/types/bookmark';

const STORAGE_KEY = '@read/bookmarks/v1';

const EMPTY_STORE: BookmarkStore = {
  bookmarks: {},
};

export async function loadBookmarks(): Promise<BookmarkStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...EMPTY_STORE };
    }

    const parsed = JSON.parse(raw) as Partial<BookmarkStore>;
    return {
      bookmarks:
        parsed.bookmarks && typeof parsed.bookmarks === 'object' ? parsed.bookmarks : {},
    };
  } catch {
    return { ...EMPTY_STORE };
  }
}

export async function saveBookmarks(store: BookmarkStore): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}