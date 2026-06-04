import { formatOpenedAgo } from '@/lib/recently-opened-core';
import type { BookmarkStore, ReadLaterItem } from '@/types/bookmark';

type ReadLaterSource = {
  title: string;
  authorId: string;
  category?: string;
};

export function isArticleBookmarked(store: BookmarkStore, articleId: string): boolean {
  return Boolean(store.bookmarks[articleId]);
}

export function readLaterSubtitle(item: ReadLaterItem): string {
  if (item.completed) {
    return 'Read';
  }
  if (item.category) {
    return item.category;
  }
  return `Saved ${formatOpenedAgo(item.savedAt)}`;
}

export function buildReadLaterItems(
  store: BookmarkStore,
  completedArticleIds: Record<string, unknown>,
  summaryById: Map<string, ReadLaterSource>,
  authorNameById: Map<string, string>,
  limit = 12,
): ReadLaterItem[] {
  const items: ReadLaterItem[] = [];

  for (const [articleId, bookmark] of Object.entries(store.bookmarks)) {
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
      savedAt: bookmark.savedAt,
      completed: Boolean(completedArticleIds[articleId]),
    });
  }

  return items
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
    .slice(0, limit);
}