import { useCallback, useEffect, useState } from 'react';

import { getBundledAuthor } from '@/lib/authors';
import {
  fetchArticleById,
  fetchArticleSummaries,
  getBundledArticle,
  getBundledSummaries,
  groupArticlesByCategory,
} from '@/lib/articles';
import { devWarn } from '@/lib/log';
import type { Article, ArticleSection } from '@/types/article';

export function useAuthorArticles(authorId: string | undefined) {
  const [sections, setSections] = useState<ArticleSection[]>([]);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!authorId) {
      setSections([]);
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      const result = await fetchArticleSummaries(authorId);
      setSections(groupArticlesByCategory(authorId, result.articles));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load articles';
      if (!message.includes('canceled') && !message.includes('Canceled')) {
        devWarn('[read:useAuthorArticles]', authorId, err);
        setError(message);
        setSections(groupArticlesByCategory(authorId, getBundledSummaries(authorId)));
      }
    } finally {
      setRefreshing(false);
    }
  }, [authorId]);

  useEffect(() => {
    if (!authorId) {
      setSections([]);
      setRefreshing(false);
      return;
    }

    setSections(groupArticlesByCategory(authorId, getBundledSummaries(authorId)));
    load();
  }, [authorId, load]);

  const author = authorId ? getBundledAuthor(authorId) : undefined;

  return { author, sections, refreshing, error, refresh: load };
}

export function useArticle(articleId: string | undefined) {
  const [article, setArticle] = useState<Article | null>(() =>
    articleId ? getBundledArticle(articleId) : null,
  );
  const [loading, setLoading] = useState(() =>
    articleId ? getBundledArticle(articleId) === null : false,
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!articleId) {
      setArticle(null);
      setLoading(false);
      setError(null);
      return;
    }

    const bundled = getBundledArticle(articleId);
    if (bundled) {
      setArticle(bundled);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const result = await fetchArticleById(articleId);
      if (result) {
        setArticle(result);
        setError(null);
      } else if (!bundled) {
        setError('Article not found');
        setArticle(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load article';
      if (message.includes('canceled') || message.includes('Canceled')) {
        return;
      }
      devWarn('[read:useArticle]', articleId, err);
      if (!bundled) {
        setError(message);
        setArticle(null);
      }
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    load();
  }, [load]);

  return { article, loading, error, retry: load };
}