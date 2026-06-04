import { getBundledSummaries } from '@/lib/articles';
import { getBundledAuthors } from '@/lib/authors';
import { loadReadingProgress, saveReadingProgress } from '@/lib/reading-progress-storage';
import type { ContinueReadingItem } from '@/types/continue-reading';
import type { ReadingProgressStore } from '@/types/reading-progress';

export const SCROLL_RESUME_THRESHOLD = 80;

export async function touchArticleVisit(articleId: string): Promise<void> {
  const store = await loadReadingProgress();
  const existing = store.scrollPositions[articleId];

  await saveReadingProgress({
    ...store,
    scrollPositions: {
      ...store.scrollPositions,
      [articleId]: {
        offsetY: existing?.offsetY ?? 0,
        updatedAt: new Date().toISOString(),
      },
    },
  });
}

export function buildContinueReadingItems(
  store: ReadingProgressStore,
  limit = 12,
): ContinueReadingItem[] {
  const summaries = getBundledSummaries();
  const summaryById = new Map(summaries.map((item) => [item.id, item]));
  const authorNameById = new Map(getBundledAuthors().map((author) => [author.id, author.name]));

  const items: ContinueReadingItem[] = [];

  for (const [articleId, position] of Object.entries(store.scrollPositions)) {
    if (store.articles[articleId]) {
      continue;
    }

    const summary = summaryById.get(articleId);
    if (!summary) {
      continue;
    }

    items.push({
      articleId,
      title: summary.title,
      authorId: summary.authorId,
      authorName: authorNameById.get(summary.authorId) ?? summary.authorId,
      category: summary.category,
      offsetY: position.offsetY,
      updatedAt: position.updatedAt,
    });
  }

  return items
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}

export async function loadContinueReadingItems(limit = 12): Promise<ContinueReadingItem[]> {
  const store = await loadReadingProgress();
  return buildContinueReadingItems(store, limit);
}

export function continueReadingSubtitle(offsetY: number): string {
  if (offsetY >= SCROLL_RESUME_THRESHOLD) {
    return 'Pick up where you left off';
  }
  return 'Continue reading';
}