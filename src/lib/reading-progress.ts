import { buildThemeKey } from '@/lib/theme-key';
import { loadReadingProgress, saveReadingProgress } from '@/lib/reading-progress-storage';
import type { ReadingProgressStore, ThemeProgress } from '@/types/reading-progress';

export type MarkArticleCompleteResult = {
  alreadyCompleted: boolean;
  themeJustCompleted: boolean;
  themeKey?: string;
  themeName?: string;
};

export function isArticleCompleted(
  store: ReadingProgressStore,
  articleId: string,
): boolean {
  return Boolean(store.articles[articleId]);
}

export function isThemeCompleted(store: ReadingProgressStore, themeKey: string): boolean {
  return Boolean(store.themes[themeKey]);
}

export function getThemeProgress(
  store: ReadingProgressStore,
  authorId: string,
  category: string,
  articleIds: string[],
): ThemeProgress {
  const key = buildThemeKey(authorId, category);
  const completed = articleIds.filter((id) => store.articles[id]).length;
  const total = articleIds.length;

  return {
    themeKey: key,
    completed,
    total,
    isComplete: isThemeCompleted(store, key) || (total > 0 && completed >= total),
  };
}

function maybeCompleteTheme(
  store: ReadingProgressStore,
  authorId: string,
  category: string,
  articleIdsInTheme: string[],
): { store: ReadingProgressStore; themeJustCompleted: boolean; themeKey: string } {
  const key = buildThemeKey(authorId, category);
  if (articleIdsInTheme.length === 0 || isThemeCompleted(store, key)) {
    return { store, themeJustCompleted: false, themeKey: key };
  }

  const allDone = articleIdsInTheme.every((id) => store.articles[id]);
  if (!allDone) {
    return { store, themeJustCompleted: false, themeKey: key };
  }

  return {
    store: {
      ...store,
      themes: {
        ...store.themes,
        [key]: { completedAt: new Date().toISOString() },
      },
    },
    themeJustCompleted: true,
    themeKey: key,
  };
}

export async function markArticleCompleted(
  articleId: string,
  authorId: string,
  category: string | undefined,
  articleIdsInTheme: string[],
): Promise<MarkArticleCompleteResult> {
  let store = await loadReadingProgress();

  if (store.articles[articleId]) {
    const themeKey = category ? buildThemeKey(authorId, category) : undefined;
    return {
      alreadyCompleted: true,
      themeJustCompleted: false,
      themeKey,
      themeName: category,
    };
  }

  store = {
    ...store,
    articles: {
      ...store.articles,
      [articleId]: { completedAt: new Date().toISOString() },
    },
  };

  let themeJustCompleted = false;
  let themeKey: string | undefined;
  const themeName = category;

  if (category) {
    const themeResult = maybeCompleteTheme(store, authorId, category, articleIdsInTheme);
    store = themeResult.store;
    themeJustCompleted = themeResult.themeJustCompleted;
    themeKey = themeResult.themeKey;
  }

  await saveReadingProgress(store);

  return {
    alreadyCompleted: false,
    themeJustCompleted,
    themeKey,
    themeName,
  };
}