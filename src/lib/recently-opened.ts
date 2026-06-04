import { getBundledSummaries } from '@/lib/articles';
import { getBundledAuthors } from '@/lib/authors';
import { buildRecentlyOpenedItems } from '@/lib/recently-opened-core';
import { loadReadingProgress } from '@/lib/reading-progress-storage';
import type { RecentlyOpenedItem } from '@/types/recently-opened';

function bundledRecentlyOpenedMaps() {
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

export async function loadRecentlyOpenedItems(limit = 10): Promise<RecentlyOpenedItem[]> {
  const store = await loadReadingProgress();
  const { summaryById, authorNameById } = bundledRecentlyOpenedMaps();
  return buildRecentlyOpenedItems(store, summaryById, authorNameById, limit);
}