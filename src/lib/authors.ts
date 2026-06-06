import bundledAuthors from '@/data/authors.json';
import { markSyncFailure, shouldSyncFromNetwork } from '@/lib/connectivity';
import { getSupabaseConfig, supabase } from '@/lib/supabase';
import type { Author } from '@/types/author';

import bundledSummaries from '@/data/article-summaries.json';

type AuthorRow = {
  id: string;
  name: string;
  tagline: string | null;
  site_url: string | null;
  sort_order: number;
  author_group_id: string | null;
};

type SummaryRow = { author_id: string };

function mapAuthor(row: AuthorRow, articleCount: number): Author {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline ?? undefined,
    siteUrl: row.site_url ?? undefined,
    sortOrder: row.sort_order,
    articleCount,
    authorGroupId: row.author_group_id ?? undefined,
  };
}

function countByAuthorFromSummaries(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of bundledSummaries as SummaryRow[]) {
    if (!row.author_id) continue;
    counts.set(row.author_id, (counts.get(row.author_id) ?? 0) + 1);
  }
  return counts;
}

function loadBundledAuthors(): Author[] {
  const counts = countByAuthorFromSummaries();
  const rows = bundledAuthors as AuthorRow[];

  return rows
    .map((row) => mapAuthor(row, counts.get(row.id) ?? 0))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getBundledAuthors(): Author[] {
  return loadBundledAuthors();
}

export async function fetchAuthors(signal?: AbortSignal): Promise<Author[]> {
  if (!(await shouldSyncFromNetwork())) {
    return getBundledAuthors();
  }

  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return getBundledAuthors();
  }

  try {
    const authorsQuery = supabase
      .from('authors')
      .select('id,name,tagline,site_url,sort_order,author_group_id')
      .order('sort_order', { ascending: true });

    const countsQuery = supabase.from('articles').select('author_id');

    if (signal) {
      authorsQuery.abortSignal(signal);
      countsQuery.abortSignal(signal);
    }

    const [{ data: authorRows, error: authorsError }, { data: countRows, error: countsError }] =
      await Promise.all([authorsQuery, countsQuery]);

    if (authorsError) {
      throw authorsError;
    }
    if (countsError) {
      throw countsError;
    }

    const counts = new Map<string, number>();
    for (const row of (countRows ?? []) as SummaryRow[]) {
      if (!row.author_id) continue;
      counts.set(row.author_id, (counts.get(row.author_id) ?? 0) + 1);
    }

    return (authorRows as AuthorRow[])
      .map((row) => mapAuthor(row, counts.get(row.id) ?? 0))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    markSyncFailure();
    return getBundledAuthors();
  }
}

export function getBundledAuthor(id: string): Author | undefined {
  return getBundledAuthors().find((author) => author.id === id);
}