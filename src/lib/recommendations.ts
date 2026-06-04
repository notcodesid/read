import { getBundledSummaries } from '@/lib/articles';
import { getBundledAuthors } from '@/lib/authors';
import { loadBookmarks } from '@/lib/bookmarks-storage';
import { buildForYouRecommendations } from '@/lib/recommendations-core';
import { loadReadingProgress } from '@/lib/reading-progress-storage';
import type { ForYouItem } from '@/types/recommendation';

export async function loadForYouRecommendations(limit = 8): Promise<ForYouItem[]> {
  const summaries = getBundledSummaries();
  const candidates = summaries.map((item) => ({
    id: item.id,
    title: item.title,
    authorId: item.authorId,
    category: item.category,
  }));
  const authorNameById = new Map(getBundledAuthors().map((author) => [author.id, author.name]));

  const [progress, bookmarks] = await Promise.all([loadReadingProgress(), loadBookmarks()]);

  return buildForYouRecommendations(candidates, authorNameById, progress, bookmarks, limit);
}