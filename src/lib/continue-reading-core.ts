import type { ContinueReadingItem } from '@/types/continue-reading';
import type { ReadingProgressStore } from '@/types/reading-progress';

export const SCROLL_RESUME_THRESHOLD = 80;

export function hasResumePosition(offsetY: number): boolean {
  return offsetY >= SCROLL_RESUME_THRESHOLD;
}

export function continueReadingSubtitle(offsetY: number): string {
  if (offsetY >= SCROLL_RESUME_THRESHOLD) {
    return 'Pick up where you left off';
  }
  return 'Continue reading';
}

type ContinueReadingSource = {
  title: string;
  authorId: string;
  category?: string;
};

export function buildContinueReadingItems(
  store: ReadingProgressStore,
  summaryById: Map<string, ContinueReadingSource>,
  authorNameById: Map<string, string>,
  limit = 12,
): ContinueReadingItem[] {
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