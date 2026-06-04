import type { RecentlyOpenedItem } from '@/types/recently-opened';
import type { ReadingProgressStore } from '@/types/reading-progress';

type RecentlyOpenedSource = {
  title: string;
  authorId: string;
  category?: string;
};

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatOpenedAgo(openedAt: string, nowMs = Date.now()): string {
  const openedMs = new Date(openedAt).getTime();
  if (Number.isNaN(openedMs)) {
    return 'Opened recently';
  }

  const delta = Math.max(0, nowMs - openedMs);
  if (delta < MINUTE_MS) {
    return 'Just now';
  }
  if (delta < HOUR_MS) {
    return `${Math.floor(delta / MINUTE_MS)}m ago`;
  }
  if (delta < DAY_MS) {
    return `${Math.floor(delta / HOUR_MS)}h ago`;
  }
  if (delta < 7 * DAY_MS) {
    return `${Math.floor(delta / DAY_MS)}d ago`;
  }

  return new Date(openedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function recentlyOpenedSubtitle(item: RecentlyOpenedItem): string {
  if (item.completed) {
    return 'Finished';
  }
  return formatOpenedAgo(item.openedAt);
}

export function buildRecentlyOpenedItems(
  store: ReadingProgressStore,
  summaryById: Map<string, RecentlyOpenedSource>,
  authorNameById: Map<string, string>,
  limit = 10,
): RecentlyOpenedItem[] {
  const items: RecentlyOpenedItem[] = [];

  for (const [articleId, visit] of Object.entries(store.recentOpens)) {
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
      openedAt: visit.openedAt,
      completed: Boolean(store.articles[articleId]),
    });
  }

  return items
    .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime())
    .slice(0, limit);
}