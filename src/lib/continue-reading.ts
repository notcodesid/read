import { getBundledSummaries } from '@/lib/articles';
import { getBundledAuthors } from '@/lib/authors';
import {
  buildContinueReadingItems,
  continueReadingSubtitle,
  hasResumePosition,
  SCROLL_RESUME_THRESHOLD,
} from '@/lib/continue-reading-core';
import { loadReadingProgress, saveReadingProgress } from '@/lib/reading-progress-storage';
import type { ContinueReadingItem } from '@/types/continue-reading';

export {
  buildContinueReadingItems,
  continueReadingSubtitle,
  hasResumePosition,
  SCROLL_RESUME_THRESHOLD,
};

export async function touchArticleVisit(articleId: string): Promise<void> {
  const store = await loadReadingProgress();
  const existing = store.scrollPositions[articleId];
  const openedAt = new Date().toISOString();

  await saveReadingProgress({
    ...store,
    scrollPositions: {
      ...store.scrollPositions,
      [articleId]: {
        offsetY: existing?.offsetY ?? 0,
        updatedAt: openedAt,
      },
    },
    recentOpens: {
      ...store.recentOpens,
      [articleId]: { openedAt },
    },
  });
}

function bundledContinueReadingMaps() {
  const summaries = getBundledSummaries();
  const summaryById = new Map(
    summaries.map((item) => [
      item.id,
      { title: item.title, authorId: item.authorId, category: item.category },
    ]),
  );
  const authorNameById = new Map(getBundledAuthors().map((author) => [author.id, author.name]));
  return { summaryById, authorNameById };
}

export async function loadContinueReadingItems(limit = 12): Promise<ContinueReadingItem[]> {
  const store = await loadReadingProgress();
  const { summaryById, authorNameById } = bundledContinueReadingMaps();
  return buildContinueReadingItems(store, summaryById, authorNameById, limit);
}