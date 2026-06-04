import { getBundledSummaries } from '@/lib/articles';
import { getBundledAuthors } from '@/lib/authors';
import { buildReadLaterItems, isArticleBookmarked } from '@/lib/bookmarks-core';
import { loadBookmarks, saveBookmarks } from '@/lib/bookmarks-storage';
import { loadReadingProgress } from '@/lib/reading-progress-storage';
import type { BookmarkStore, ReadLaterItem } from '@/types/bookmark';

function bundledReadLaterMaps() {
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

export async function loadReadLaterItems(limit = 12): Promise<ReadLaterItem[]> {
  const [bookmarkStore, progress] = await Promise.all([loadBookmarks(), loadReadingProgress()]);
  const { summaryById, authorNameById } = bundledReadLaterMaps();
  return buildReadLaterItems(
    bookmarkStore,
    progress.articles,
    summaryById,
    authorNameById,
    limit,
  );
}

export async function getBookmarkState(articleId: string): Promise<boolean> {
  const store = await loadBookmarks();
  return isArticleBookmarked(store, articleId);
}

export async function toggleArticleBookmark(articleId: string): Promise<boolean> {
  const store = await loadBookmarks();

  if (store.bookmarks[articleId]) {
    const { [articleId]: _removed, ...bookmarks } = store.bookmarks;
    await saveBookmarks({ bookmarks });
    return false;
  }

  await saveBookmarks({
    bookmarks: {
      ...store.bookmarks,
      [articleId]: { savedAt: new Date().toISOString() },
    },
  });
  return true;
}

export function bookmarkedArticleIds(store: BookmarkStore): string[] {
  return Object.keys(store.bookmarks);
}