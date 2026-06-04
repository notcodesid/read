import { useCallback, useEffect, useState } from 'react';

import {
  getThemeProgress,
  isArticleCompleted,
  isThemeCompleted,
  markArticleCompleted,
} from '@/lib/reading-progress';
import { loadReadingProgress } from '@/lib/reading-progress-storage';
import type { ReadingProgressStore } from '@/types/reading-progress';

const EMPTY_STORE: ReadingProgressStore = {
  articles: {},
  themes: {},
};

export function useReadingProgress() {
  const [store, setStore] = useState<ReadingProgressStore>(EMPTY_STORE);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const next = await loadReadingProgress();
    setStore(next);
    setReady(true);
    return next;
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadReadingProgress().then((next) => {
      if (!cancelled) {
        setStore(next);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const markComplete = useCallback(
    async (
      articleId: string,
      authorId: string,
      category: string | undefined,
      articleIdsInTheme: string[],
    ) => {
      const result = await markArticleCompleted(
        articleId,
        authorId,
        category,
        articleIdsInTheme,
      );
      await refresh();
      return result;
    },
    [refresh],
  );

  return {
    store,
    ready,
    refresh,
    isArticleCompleted: (articleId: string) => isArticleCompleted(store, articleId),
    isThemeCompleted: (themeKey: string) => isThemeCompleted(store, themeKey),
    getThemeProgress: (authorId: string, category: string, articleIds: string[]) =>
      getThemeProgress(store, authorId, category, articleIds),
    markComplete,
  };
}