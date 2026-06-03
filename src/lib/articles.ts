import bundledArticles from '@/data/articles.json';
import bundledSummaries from '@/data/article-summaries.json';
import { sortSectionsForAuthor } from '@/constants/author-categories';
import {
  loadArticleCache,
  loadArticleSummariesCache,
  saveArticleCache,
  saveArticleSummariesCache,
} from '@/lib/article-cache';
import { decodeHtml } from '@/lib/decode-html';
import { devLog, devWarn } from '@/lib/log';
import { fetchWithTimeout, getSupabaseConfig, supabase } from '@/lib/supabase';
import type { Article, ArticleSection, ArticleSummary } from '@/types/article';

const LOG = '[read:articles]';
const RETRY_ATTEMPTS = 2;

export type ArticlesLoadSource = 'network' | 'cache' | 'bundled';

export type ArticlesLoadResult = {
  articles: ArticleSummary[];
  source: ArticlesLoadSource;
};

type ArticleRow = {
  id: string;
  title: string;
  author_id: string;
  category: string | null;
  source: string | null;
  author: string | null;
  source_url: string | null;
  hero_image_url: string | null;
  paragraphs: string[];
  added_at: string;
};

type SummaryRow = {
  id: string;
  title: string;
  author_id: string;
  category: string | null;
};

function mapSummary(row: SummaryRow): ArticleSummary {
  return {
    id: row.id,
    title: decodeHtml(row.title),
    authorId: row.author_id,
    category: row.category ? decodeHtml(row.category) : undefined,
  };
}

function mapRow(row: ArticleRow): Article {
  return {
    id: row.id,
    title: decodeHtml(row.title),
    authorId: row.author_id,
    category: row.category ? decodeHtml(row.category) : undefined,
    source: row.source ? decodeHtml(row.source) : undefined,
    author: row.author ? decodeHtml(row.author) : undefined,
    sourceUrl: row.source_url ?? undefined,
    heroImageUrl: row.hero_image_url ?? undefined,
    paragraphs: row.paragraphs.map(decodeHtml),
    addedAt: row.added_at,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const bundledArticleById = new Map(
  (bundledArticles as ArticleRow[]).map((row) => [row.id, mapRow(row)]),
);

const bundledSummariesAll = (bundledSummaries as SummaryRow[]).map(mapSummary);

function loadBundledSummaries(authorId?: string): ArticleSummary[] {
  if (!authorId) {
    return bundledSummariesAll;
  }
  return bundledSummariesAll.filter((article) => article.authorId === authorId);
}

export function getBundledSummaries(authorId?: string): ArticleSummary[] {
  return loadBundledSummaries(authorId);
}

export function getBundledArticle(id: string): Article | null {
  return bundledArticleById.get(id) ?? null;
}

async function fetchSummariesViaRest(
  authorId?: string,
  signal?: AbortSignal,
): Promise<ArticleSummary[]> {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    throw new Error('Missing Supabase env vars');
  }

  let endpoint =
    `${url}/rest/v1/articles?select=id,title,author_id,category` +
    '&order=category.asc&order=title.asc';

  if (authorId) {
    endpoint += `&author_id=eq.${encodeURIComponent(authorId)}`;
  }

  devLog(LOG, 'REST fetch start', { authorId });
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
  devLog(LOG, 'REST fetch done', {
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
    `${url}/rest/v1/articles?select=id,title,author_id,category,source,author,source_url,hero_image_url,paragraphs,added_at` +
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

export async function fetchArticleSummaries(
  authorId?: string,
  signal?: AbortSignal,
): Promise<ArticlesLoadResult> {
  devLog(LOG, 'fetchArticleSummaries start', { authorId });

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    if (signal?.aborted) {
      throw new Error('Fetch canceled');
    }

    try {
      devLog(LOG, `network attempt ${attempt}/${RETRY_ATTEMPTS}`);
      const articles = await fetchSummariesViaRest(authorId, signal);
      if (!authorId) {
        await saveArticleSummariesCache(articles);
      }
      devLog(LOG, 'fetchArticleSummaries done (network)', { total: articles.length });
      return { articles, source: 'network' };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      devWarn(LOG, `attempt ${attempt} failed`, message);
      if (attempt < RETRY_ATTEMPTS) {
        await sleep(attempt * 1500);
      }
    }
  }

  if (!authorId) {
    const cached = await loadArticleSummariesCache();
    if (cached && cached.length > 0 && cached[0]?.authorId) {
      devLog(LOG, 'fetchArticleSummaries done (cache)', { total: cached.length });
      return { articles: cached, source: 'cache' };
    }
  }

  const bundled = loadBundledSummaries(authorId);
  devLog(LOG, 'fetchArticleSummaries done (bundled)', { total: bundled.length });
  return { articles: bundled, source: 'bundled' };
}

export function groupArticlesByCategory(
  authorId: string,
  articles: ArticleSummary[],
): ArticleSection[] {
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

  return sortSectionsForAuthor(authorId, sections);
}

export async function fetchArticleById(id: string, signal?: AbortSignal): Promise<Article | null> {
  devLog(LOG, 'fetchArticleById', id);

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    if (signal?.aborted) {
      throw new Error('Fetch canceled');
    }

    try {
      const started = Date.now();
      const article = await fetchArticleViaRest(id, signal);
      devLog(LOG, 'fetchArticleById result (REST)', {
        ms: Date.now() - started,
        id,
        found: Boolean(article),
      });
      if (article) {
        await saveArticleCache(article);
      }
      return article;
    } catch (err) {
      devWarn(LOG, `fetchArticleById attempt ${attempt} failed`, err);
      if (attempt < RETRY_ATTEMPTS) {
        await sleep(attempt * 1500);
      }
    }
  }

  try {
    const started = Date.now();
    const { data, error } = await supabase
      .from('articles')
      .select(
        'id, title, author_id, category, source, author, source_url, hero_image_url, paragraphs, added_at',
      )
      .eq('id', id)
      .maybeSingle();

    devLog(LOG, 'fetchArticleById result (client)', {
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
    devWarn(LOG, 'fetchArticleById client fallback failed', err);
  }

  const cached = await loadArticleCache(id);
  if (cached) {
    devLog(LOG, 'fetchArticleById done (cache)', id);
    return cached;
  }

  const bundled = getBundledArticle(id);
  if (bundled) {
    devLog(LOG, 'fetchArticleById done (bundled)', id);
    return bundled;
  }

  return null;
}