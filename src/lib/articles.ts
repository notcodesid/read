import bundledArticles from '@/data/articles.json';
import bundledSummaries from '@/data/article-summaries.json';
import { sortCategorySections } from '@/constants/categories';
import {
  loadArticleCache,
  loadArticleSummariesCache,
  saveArticleCache,
  saveArticleSummariesCache,
} from '@/lib/article-cache';
import { fetchWithTimeout, getSupabaseConfig, supabase } from '@/lib/supabase';
import type { Article, ArticleSection, ArticleSummary } from '@/types/article';

const LOG = '[read:articles]';
const RETRY_ATTEMPTS = 3;

export type ArticlesLoadSource = 'network' | 'cache' | 'bundled';

export type ArticlesLoadResult = {
  articles: ArticleSummary[];
  source: ArticlesLoadSource;
};

type ArticleRow = {
  id: string;
  title: string;
  category: string | null;
  source: string | null;
  author: string | null;
  source_url: string | null;
  paragraphs: string[];
  added_at: string;
};

type SummaryRow = {
  id: string;
  title: string;
  category: string | null;
};

function mapSummary(row: SummaryRow): ArticleSummary {
  return {
    id: row.id,
    title: row.title,
    category: row.category ?? undefined,
  };
}

function mapRow(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    category: row.category ?? undefined,
    source: row.source ?? undefined,
    author: row.author ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    paragraphs: row.paragraphs,
    addedAt: row.added_at,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const bundledArticleById = new Map(
  (bundledArticles as ArticleRow[]).map((row) => [row.id, mapRow(row)]),
);

function loadBundledSummaries(): ArticleSummary[] {
  const rows = bundledSummaries as SummaryRow[];
  console.log(LOG, 'using bundled summaries', rows.length);
  return rows.map(mapSummary);
}

function loadBundledArticle(id: string): Article | null {
  const article = bundledArticleById.get(id) ?? null;
  if (article) {
    console.log(LOG, 'using bundled article', id, { paragraphs: article.paragraphs.length });
  }
  return article;
}

async function fetchSummariesViaRest(signal?: AbortSignal): Promise<ArticleSummary[]> {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    throw new Error('Missing Supabase env vars');
  }

  const endpoint =
    `${url}/rest/v1/articles?select=id,title,category` +
    '&order=category.asc&order=title.asc';

  console.log(LOG, 'REST fetch start');
  const started = Date.now();

  const response = await fetchWithTimeout(endpoint, {
    signal,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
  });

  const text = await response.text();
  console.log(LOG, 'REST fetch done', {
    ms: Date.now() - started,
    status: response.status,
    bytes: text.length,
  });

  if (!response.ok) {
    throw new Error(`REST fetch failed: ${response.status} ${text.slice(0, 200)}`);
  }

  const rows = JSON.parse(text) as SummaryRow[];
  return rows.map(mapSummary);
}

async function fetchArticleViaRest(id: string, signal?: AbortSignal): Promise<Article | null> {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    throw new Error('Missing Supabase env vars');
  }

  const endpoint =
    `${url}/rest/v1/articles?select=id,title,category,source,author,source_url,paragraphs,added_at` +
    `&id=eq.${encodeURIComponent(id)}`;

  const response = await fetchWithTimeout(endpoint, {
    signal,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Article REST failed: ${response.status} ${text.slice(0, 200)}`);
  }

  const rows = JSON.parse(text) as ArticleRow[];
  if (!rows[0]) {
    return null;
  }

  return mapRow(rows[0]);
}

/** Tries network (with retries), then device cache, then bundled JSON. */
export async function fetchArticleSummaries(
  signal?: AbortSignal,
): Promise<ArticlesLoadResult> {
  console.log(LOG, 'fetchArticleSummaries start');

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    if (signal?.aborted) {
      throw new Error('Fetch canceled');
    }

    try {
      console.log(LOG, `network attempt ${attempt}/${RETRY_ATTEMPTS}`);
      const articles = await fetchSummariesViaRest(signal);
      await saveArticleSummariesCache(articles);
      console.log(LOG, 'fetchArticleSummaries done (network)', { total: articles.length });
      return { articles, source: 'network' };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(LOG, `attempt ${attempt} failed`, message);
      if (attempt < RETRY_ATTEMPTS) {
        await sleep(attempt * 1500);
      }
    }
  }

  const cached = await loadArticleSummariesCache();
  if (cached && cached.length > 0) {
    console.log(LOG, 'fetchArticleSummaries done (cache)', { total: cached.length });
    return { articles: cached, source: 'cache' };
  }

  const bundled = loadBundledSummaries();
  console.log(LOG, 'fetchArticleSummaries done (bundled)', { total: bundled.length });
  return { articles: bundled, source: 'bundled' };
}

export function groupArticlesByCategory(articles: ArticleSummary[]): ArticleSection[] {
  const map = new Map<string, ArticleSummary[]>();

  for (const article of articles) {
    const key = article.category ?? 'Uncategorized';
    const list = map.get(key) ?? [];
    list.push(article);
    map.set(key, list);
  }

  const sections = Array.from(map.entries()).map(([category, sectionArticles]) => ({
    category,
    articles: sectionArticles.sort((a, b) => a.title.localeCompare(b.title)),
  }));

  return sortCategorySections(sections);
}

export async function fetchArticleById(id: string, signal?: AbortSignal): Promise<Article | null> {
  console.log(LOG, 'fetchArticleById', id);

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    if (signal?.aborted) {
      throw new Error('Fetch canceled');
    }

    try {
      const started = Date.now();
      const article = await fetchArticleViaRest(id, signal);
      console.log(LOG, 'fetchArticleById result (REST)', {
        ms: Date.now() - started,
        id,
        found: Boolean(article),
      });
      if (article) {
        await saveArticleCache(article);
      }
      return article;
    } catch (err) {
      console.warn(LOG, `fetchArticleById attempt ${attempt} failed`, err);
      if (attempt < RETRY_ATTEMPTS) {
        await sleep(attempt * 1500);
      }
    }
  }

  try {
    const started = Date.now();
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, category, source, author, source_url, paragraphs, added_at')
      .eq('id', id)
      .maybeSingle();

    console.log(LOG, 'fetchArticleById result (client)', {
      ms: Date.now() - started,
      error: error?.message ?? null,
      found: Boolean(data),
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      const article = mapRow(data as ArticleRow);
      await saveArticleCache(article);
      return article;
    }
  } catch (err) {
    console.warn(LOG, 'fetchArticleById client fallback failed', err);
  }

  const cached = await loadArticleCache(id);
  if (cached) {
    console.log(LOG, 'fetchArticleById done (cache)', id);
    return cached;
  }

  const bundled = loadBundledArticle(id);
  if (bundled) {
    console.log(LOG, 'fetchArticleById done (bundled)', id);
    return bundled;
  }

  return null;
}