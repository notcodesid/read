import { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchArticleById,
  fetchArticleSummaries,
  getBundledArticle,
  getBundledSummaries,
  groupArticlesByCategory,
  type ArticlesLoadSource,
} from '@/lib/articles';
import { devLog, devWarn } from '@/lib/log';
import type { Article, ArticleSection } from '@/types/article';

const LOG = '[read:useArticles]';

export function useArticles() {
  const [sections, setSections] = useState<ArticleSection[]>(() =>
    groupArticlesByCategory(getBundledSummaries()),
  );
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<ArticlesLoadSource | null>('bundled');
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    const controller = new AbortController();

    devLog(LOG, 'refresh start', { id });
    setRefreshing(true);
    setError(null);

    try {
      const result = await fetchArticleSummaries(controller.signal);

      if (id !== requestId.current) {
        devLog(LOG, 'refresh stale, ignoring', { id });
        return;
      }

      setSections(groupArticlesByCategory(result.articles));
      setSource(result.source);
      devLog(LOG, 'refresh success', {
        id,
        articles: result.articles.length,
        source: result.source,
      });
    } catch (err) {
      if (id !== requestId.current) {
        return;
      }

      const message = err instanceof Error ? err.message : 'Failed to load articles';
      if (message.includes('canceled') || message.includes('Canceled')) {
        devLog(LOG, 'refresh canceled', { id });
        return;
      }

      devWarn(LOG, 'refresh failed, keeping bundled list', err);
      setError(message);
    } finally {
      if (id === requestId.current) {
        setRefreshing(false);
        devLog(LOG, 'refresh end', { id });
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { sections, refreshing, error, source, refresh: load };
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
      devWarn(LOG, 'article load failed', articleId, err);
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