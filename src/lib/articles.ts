import bundledArticles from '@/data/articles.json';
import bundledSummaries from '@/data/article-summaries.json';
import { sortSectionsForAuthor } from '@/constants/author-categories';
import {
  loadArticleCache,
  loadArticleSummariesCache,
  saveArticleCache,
  saveArticleSummariesCache,
} from '@/lib/article-cache';
import { markSyncFailure, shouldSyncFromNetwork } from '@/lib/connectivity';
import { decodeHtml } from '@/lib/decode-html';
import { devLog, devWarn } from '@/lib/log';
import { getSupabaseConfig, supabase } from '@/lib/supabase';
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

export async function resolveArticleLocal(id: string): Promise<Article | null> {
  const bundled = getBundledArticle(id);
  if (bundled) {
    return bundled;
  }
  return loadArticleCache(id);
}

async function fetchSummariesViaClient(
  authorId?: string,
  signal?: AbortSignal,
): Promise<ArticleSummary[]> {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    throw new Error('Missing Supabase env vars');
  }

  devLog(LOG, 'client fetch start', { authorId });
  const started = Date.now();

  let query = supabase
    .from('articles')
    .select('id,title,author_id,category')
    .order('category', { ascending: true })
    .order('title', { ascending: true });

  if (authorId) {
    query = query.eq('author_id', authorId);
  }

  if (signal) {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;
  devLog(LOG, 'client fetch done', {
    ms: Date.now() - started,
    error: error?.message ?? null,
    rows: data?.length ?? 0,
  });

  if (error) {
    throw error;
  }

  return ((data ?? []) as SummaryRow[]).map(mapSummary);
}

async function fetchArticleViaClient(id: string, signal?: AbortSignal): Promise<Article | null> {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    throw new Error('Missing Supabase env vars');
  }

  let query = supabase
    .from('articles')
    .select(
      'id, title, author_id, category, source, author, source_url, hero_image_url, paragraphs, added_at',
    )
    .eq('id', id);

  if (signal) {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapRow(data as ArticleRow);
}

export async function fetchArticleSummaries(
  authorId?: string,
  signal?: AbortSignal,
): Promise<ArticlesLoadResult> {
  devLog(LOG, 'fetchArticleSummaries start', { authorId });

  const bundled = loadBundledSummaries(authorId);
  if (!(await shouldSyncFromNetwork())) {
    devLog(LOG, 'fetchArticleSummaries done (bundled, offline)', { total: bundled.length });
    return { articles: bundled, source: 'bundled' };
  }

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    if (signal?.aborted) {
      throw new Error('Fetch canceled');
    }

    try {
      devLog(LOG, `network attempt ${attempt}/${RETRY_ATTEMPTS}`);
      const articles = await fetchSummariesViaClient(authorId, signal);
      if (!authorId) {
        await saveArticleSummariesCache(articles);
      }
      devLog(LOG, 'fetchArticleSummaries done (network)', { total: articles.length });
      return { articles, source: 'network' };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      devWarn(LOG, `attempt ${attempt} failed`, message);
      markSyncFailure();
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

  const local = await resolveArticleLocal(id);
  if (!(await shouldSyncFromNetwork())) {
    devLog(LOG, 'fetchArticleById done (local, offline)', { id, found: Boolean(local) });
    return local;
  }

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    if (signal?.aborted) {
      throw new Error('Fetch canceled');
    }

    try {
      const started = Date.now();
      const article = await fetchArticleViaClient(id, signal);
      devLog(LOG, 'fetchArticleById result (client)', {
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
      markSyncFailure();
      if (attempt < RETRY_ATTEMPTS) {
        await sleep(attempt * 1500);
      }
    }
  }

  if (local) {
    devLog(LOG, 'fetchArticleById done (local fallback)', id);
    return local;
  }

  return null;
}