import { buildThemeKey } from '@/lib/theme-key';
import type { BookmarkStore } from '@/types/bookmark';
import type { ForYouItem, RecommendationReason } from '@/types/recommendation';
import type { ReadingProgressStore } from '@/types/reading-progress';

type ArticleCandidate = {
  id: string;
  title: string;
  authorId: string;
  category?: string;
};

type ScoredCandidate = ArticleCandidate & {
  score: number;
  reason: RecommendationReason;
  reasonLabel: string;
};

const COMPLETED_CATEGORY_WEIGHT = 4;
const COMPLETED_AUTHOR_WEIGHT = 4;
const RECENT_CATEGORY_WEIGHT = 3;
const RECENT_AUTHOR_WEIGHT = 3;
const BOOKMARK_CATEGORY_WEIGHT = 2;
const BOOKMARK_AUTHOR_WEIGHT = 2;
const OPENED_CATEGORY_WEIGHT = 1;
const OPENED_AUTHOR_WEIGHT = 1;
const THEME_BOOST = 10;
const RECENT_TOPIC_BOOST = 5;
const RECENT_OPEN_PENALTY = 6;
const DISCOVER_BASE = 1;

function addScore(map: Map<string, number>, key: string | undefined, amount: number) {
  if (!key || amount <= 0) {
    return;
  }
  map.set(key, (map.get(key) ?? 0) + amount);
}

export function buildForYouRecommendations(
  candidates: ArticleCandidate[],
  authorNameById: Map<string, string>,
  progress: ReadingProgressStore,
  bookmarks: BookmarkStore,
  limit = 8,
): ForYouItem[] {
  const categoryScores = new Map<string, number>();
  const authorScores = new Map<string, number>();
  const partialThemes = new Map<
    string,
    { category: string; authorId: string; completed: number; total: number }
  >();

  const candidateById = new Map(candidates.map((item) => [item.id, item]));

  for (const item of candidates) {
    if (progress.articles[item.id]) {
      addScore(categoryScores, item.category, COMPLETED_CATEGORY_WEIGHT);
      addScore(authorScores, item.authorId, COMPLETED_AUTHOR_WEIGHT);
    }
  }

  for (const [articleId] of Object.entries(progress.recentOpens)) {
    const item = candidateById.get(articleId);
    if (!item) {
      continue;
    }
    addScore(categoryScores, item.category, RECENT_CATEGORY_WEIGHT);
    addScore(authorScores, item.authorId, RECENT_AUTHOR_WEIGHT);
  }

  for (const articleId of Object.keys(bookmarks.bookmarks)) {
    const item = candidateById.get(articleId);
    if (!item) {
      continue;
    }
    addScore(categoryScores, item.category, BOOKMARK_CATEGORY_WEIGHT);
    addScore(authorScores, item.authorId, BOOKMARK_AUTHOR_WEIGHT);
  }

  for (const articleId of Object.keys(progress.scrollPositions)) {
    if (progress.articles[articleId]) {
      continue;
    }
    const item = candidateById.get(articleId);
    if (!item) {
      continue;
    }
    addScore(categoryScores, item.category, OPENED_CATEGORY_WEIGHT);
    addScore(authorScores, item.authorId, OPENED_AUTHOR_WEIGHT);
  }

  const themesByKey = new Map<string, ArticleCandidate[]>();
  for (const item of candidates) {
    if (!item.category) {
      continue;
    }
    const key = buildThemeKey(item.authorId, item.category);
    const group = themesByKey.get(key) ?? [];
    group.push(item);
    themesByKey.set(key, group);
  }

  for (const [themeKey, group] of themesByKey) {
    const completed = group.filter((item) => progress.articles[item.id]).length;
    const total = group.length;
    if (completed > 0 && completed < total) {
      const sample = group[0];
      partialThemes.set(themeKey, {
        category: sample.category!,
        authorId: sample.authorId,
        completed,
        total,
      });
    }
  }

  const recentSorted = Object.entries(progress.recentOpens).sort(
    (a, b) => new Date(b[1].openedAt).getTime() - new Date(a[1].openedAt).getTime(),
  );
  const recentOpenIds = new Set(recentSorted.slice(0, 5).map(([id]) => id));
  const mostRecent = recentSorted[0] ? candidateById.get(recentSorted[0][0]) : undefined;
  const recentAuthorId = mostRecent?.authorId;
  const recentCategory = mostRecent?.category;

  const hasAffinity =
    categoryScores.size > 0 || authorScores.size > 0 || partialThemes.size > 0;

  if (!hasAffinity) {
    return buildColdStartRecommendations(candidates, progress, authorNameById, limit);
  }

  const scored: ScoredCandidate[] = [];

  for (const item of candidates) {
    if (progress.articles[item.id]) {
      continue;
    }

    if (recentOpenIds.has(item.id) && hasAffinity) {
      continue;
    }

    let score = 0;
    let reason: RecommendationReason = 'discover';
    let reasonLabel = item.category ? `Explore ${item.category}` : 'Discover something new';

    const categoryScore = item.category ? (categoryScores.get(item.category) ?? 0) : 0;
    const authorScore = authorScores.get(item.authorId) ?? 0;

    if (item.category) {
      const themeKey = buildThemeKey(item.authorId, item.category);
      const theme = partialThemes.get(themeKey);
      if (theme) {
        score += THEME_BOOST + categoryScore + authorScore;
        reason = 'theme';
        reasonLabel = `Finish ${theme.category} (${theme.completed}/${theme.total})`;
      }
    }

    if (reason !== 'theme') {
      score += categoryScore + authorScore;

      if (hasAffinity) {
        if (authorScore >= categoryScore && authorScore > 0) {
          reason = 'author';
          const authorName = authorNameById.get(item.authorId) ?? item.authorId;
          reasonLabel = `More from ${authorName}`;
        } else if (categoryScore > 0 && item.category) {
          reason = 'category';
          reasonLabel = `Because you read ${item.category}`;
        }
      }

      if (item.authorId === recentAuthorId) {
        score += RECENT_TOPIC_BOOST;
      }
      if (item.category && item.category === recentCategory) {
        score += RECENT_TOPIC_BOOST - 1;
      }
    }

    if (recentOpenIds.has(item.id)) {
      score -= RECENT_OPEN_PENALTY;
    }

    if (score <= 0) {
      continue;
    }

    scored.push({
      ...item,
      score: Math.max(score, DISCOVER_BASE),
      reason,
      reasonLabel,
    });
  }

  if (scored.length === 0) {
    return buildColdStartRecommendations(candidates, progress, authorNameById, limit);
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.title.localeCompare(b.title);
  });

  const picked: ScoredCandidate[] = [];

  for (const item of scored) {
    if (picked.length >= limit) {
      break;
    }

    const authorCount = picked.filter((p) => p.authorId === item.authorId).length;
    if (authorCount >= 3) {
      continue;
    }

    if (item.category) {
      const categoryCount = picked.filter((p) => p.category === item.category).length;
      if (categoryCount >= 4) {
        continue;
      }
    }

    picked.push(item);
  }

  if (picked.length < Math.min(limit, 4)) {
    for (const item of scored) {
      if (picked.length >= limit) {
        break;
      }
      if (picked.some((p) => p.id === item.id)) {
        continue;
      }
      picked.push(item);
    }
  }

  return picked.map((item) => toForYouItem(item, authorNameById));
}

function buildColdStartRecommendations(
  candidates: ArticleCandidate[],
  progress: ReadingProgressStore,
  authorNameById: Map<string, string>,
  limit: number,
): ForYouItem[] {
  const byCategory = new Map<string, ArticleCandidate[]>();

  for (const item of candidates) {
    if (progress.articles[item.id]) {
      continue;
    }
    const key = item.category ?? 'Uncategorized';
    const group = byCategory.get(key) ?? [];
    group.push(item);
    byCategory.set(key, group);
  }

  const coldStart: ScoredCandidate[] = [];
  for (const [category, group] of byCategory) {
    const pick = group[0];
    if (!pick) {
      continue;
    }
    coldStart.push({
      ...pick,
      score: DISCOVER_BASE,
      reason: 'discover',
      reasonLabel: category === 'Uncategorized' ? 'Start here' : `Explore ${category}`,
    });
    if (coldStart.length >= limit) {
      break;
    }
  }

  return coldStart.map((item) => toForYouItem(item, authorNameById));
}

function toForYouItem(item: ScoredCandidate, authorNameById: Map<string, string>): ForYouItem {
  return {
    articleId: item.id,
    title: item.title,
    authorId: item.authorId,
    authorName: authorNameById.get(item.authorId) ?? item.authorId,
    category: item.category,
    reason: item.reason,
    reasonLabel: item.reasonLabel,
  };
}