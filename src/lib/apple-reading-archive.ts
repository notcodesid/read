import * as SecureStore from 'expo-secure-store';

import { loadBookmarks, saveBookmarks } from '@/lib/bookmarks-storage';
import { loadAllHighlights, saveHighlights } from '@/lib/highlights-storage';
import {
  loadReadingPreferences,
  loadReadingStats,
  saveReadingPreferences,
  saveReadingStats,
} from '@/lib/reading-preferences-storage';
import { loadReadingProgress, saveReadingProgress } from '@/lib/reading-progress-storage';
import { devLog } from '@/lib/log';
import type { BookmarkStore } from '@/types/bookmark';
import type { Highlight } from '@/types/highlight';
import type { ReadingPreferences, ReadingStats } from '@/types/reading-preferences';
import type { ReadingProgressStore } from '@/types/reading-progress';

const LOG = '[read:apple-archive]';
const GUEST_ARCHIVE_KEY = 'readGuestReadingSnapshot';

export type ReadingSnapshotPayload = {
  progress: ReadingProgressStore;
  bookmarks: BookmarkStore;
  highlights: Record<string, Highlight[]>;
  preferences: ReadingPreferences;
  stats: ReadingStats;
};

function appleArchiveKey(appleUserId: string): string {
  return `readAppleReading${appleUserId}`;
}

async function readArchive(key: string): Promise<ReadingSnapshotPayload | null> {
  try {
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as ReadingSnapshotPayload;
  } catch {
    return null;
  }
}

async function writeArchive(key: string, snapshot: ReadingSnapshotPayload): Promise<void> {
  await SecureStore.setItemAsync(key, JSON.stringify(snapshot));
}

export async function loadLocalReadingSnapshot(): Promise<ReadingSnapshotPayload> {
  const [progress, bookmarks, highlights, preferences, stats] = await Promise.all([
    loadReadingProgress(),
    loadBookmarks(),
    loadAllHighlights(),
    loadReadingPreferences(),
    loadReadingStats(),
  ]);

  return { progress, bookmarks, highlights, preferences, stats };
}

export async function applyLocalReadingSnapshot(snapshot: ReadingSnapshotPayload): Promise<void> {
  await Promise.all([
    saveReadingProgress(snapshot.progress),
    saveBookmarks(snapshot.bookmarks),
    ...Object.entries(snapshot.highlights).map(([articleId, items]) =>
      saveHighlights(articleId, items),
    ),
    saveReadingPreferences(snapshot.preferences),
    saveReadingStats(snapshot.stats),
  ]);
}

/** Sign in: stash guest library, restore this Apple ID's on-device archive. */
export async function activateAppleUserLibrary(appleUserId: string): Promise<void> {
  const active = await loadLocalReadingSnapshot();
  await writeArchive(GUEST_ARCHIVE_KEY, active);

  const saved = await readArchive(appleArchiveKey(appleUserId));
  if (saved) {
    await applyLocalReadingSnapshot(saved);
    devLog(LOG, 'restored apple user library', appleUserId);
    return;
  }

  await writeArchive(appleArchiveKey(appleUserId), active);
  devLog(LOG, 'initialized apple user library from guest', appleUserId);
}

/** Sign out: save Apple library, bring back guest library. */
export async function deactivateAppleUserLibrary(appleUserId: string): Promise<void> {
  const active = await loadLocalReadingSnapshot();
  await writeArchive(appleArchiveKey(appleUserId), active);

  const guest = await readArchive(GUEST_ARCHIVE_KEY);
  if (guest) {
    await applyLocalReadingSnapshot(guest);
    devLog(LOG, 'restored guest library');
    return;
  }

  devLog(LOG, 'no guest archive to restore');
}