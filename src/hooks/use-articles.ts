import { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchArticleById,
  fetchArticleSummaries,
  groupArticlesByCategory,
  type ArticlesLoadSource,
} from '@/lib/articles';
import type { Article, ArticleSection } from '@/types/article';

const LOG = '[read:useArticles]';

export function useArticles() {
  const [sections, setSections] = useState<ArticleSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<ArticlesLoadSource | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    const controller = new AbortController();

    console.log(LOG, 'load start', { id });
    setLoading(true);
    setError(null);

    try {
      const result = await fetchArticleSummaries(controller.signal);

      if (id !== requestId.current) {
        console.log(LOG, 'load stale, ignoring', { id });
        return;
      }

      setSections(groupArticlesByCategory(result.articles));
      setSource(result.source);
      console.log(LOG, 'load success', {
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
        console.log(LOG, 'load canceled', { id });
        return;
      }

      console.error(LOG, 'load failed', err);
      setError(message);
      setSections([]);
      setSource(null);
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        console.log(LOG, 'load end', { id });
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { sections, loading, error, source, refresh: load };
}

export function useArticle(articleId: string | undefined) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!articleId) {
      setArticle(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchArticleById(articleId, controller.signal);
        if (!cancelled) {
          setArticle(result);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Failed to load article';
        if (message.includes('canceled') || message.includes('Canceled')) {
          return;
        }
        console.error(LOG, 'article load failed', articleId, err);
        setError(message);
        setArticle(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [articleId]);

  return { article, loading, error };
}