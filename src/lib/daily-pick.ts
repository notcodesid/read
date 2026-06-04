import { getBundledSummaries } from '@/lib/articles';
import { getBundledAuthors } from '@/lib/authors';
import { localDateKey, pickDailyArticleId } from '@/lib/daily-pick-core';
import { loadStoredDailyPick, saveStoredDailyPick } from '@/lib/daily-pick-storage';
import { loadReadingProgress } from '@/lib/reading-progress-storage';
import type { DailyPickItem } from '@/types/daily-reading';

export async function resolveDailyPick(preferredArticleIds: string[] = []): Promise<DailyPickItem | null> {
  const dateKey = localDateKey();
  const stored = await loadStoredDailyPick();

  const summaries = getBundledSummaries();
  const summaryById = new Map(summaries.map((item) => [item.id, item]));
  const authorNameById = new Map(getBundledAuthors().map((author) => [author.id, author.name]));
  const candidateIds = summaries.map((item) => item.id);

  const progress = await loadReadingProgress();
  const excluded = new Set(Object.keys(progress.articles));

  let articleId = stored?.dateKey === dateKey ? stored.articleId : undefined;

  if (!articleId || !summaryById.has(articleId) || excluded.has(articleId)) {
    articleId = pickDailyArticleId(candidateIds, dateKey, excluded, preferredArticleIds);
    if (articleId) {
      await saveStoredDailyPick({ dateKey, articleId });
    }
  }

  if (!articleId) {
    return null;
  }

  const summary = summaryById.get(articleId);
  if (!summary) {
    return null;
  }

  return {
    articleId,
    title: summary.title,
    authorId: summary.authorId,
    authorName: authorNameById.get(summary.authorId) ?? summary.authorId,
    category: summary.category,
    dateKey,
  };
}