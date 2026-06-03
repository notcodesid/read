import bundledAuthors from '@/data/authors.json';
import { fetchWithTimeout, getSupabaseConfig } from '@/lib/supabase';
import type { Author } from '@/types/author';

import bundledSummaries from '@/data/article-summaries.json';

type AuthorRow = {
  id: string;
  name: string;
  tagline: string | null;
  site_url: string | null;
  sort_order: number;
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
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return getBundledAuthors();
  }

  try {
    const authorsEndpoint = `${url}/rest/v1/authors?select=id,name,tagline,site_url,sort_order&order=sort_order.asc`;
    const countsEndpoint = `${url}/rest/v1/articles?select=author_id`;

    const headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    };

    const [authorsRes, countsRes] = await Promise.all([
      fetchWithTimeout(authorsEndpoint, { signal, headers }),
      fetchWithTimeout(countsEndpoint, { signal, headers }),
    ]);

    if (!authorsRes.ok || !countsRes.ok) {
      throw new Error('Authors fetch failed');
    }

    const authorRows = (await authorsRes.json()) as AuthorRow[];
    const countRows = (await countsRes.json()) as SummaryRow[];
    const counts = new Map<string, number>();

    for (const row of countRows) {
      if (!row.author_id) continue;
      counts.set(row.author_id, (counts.get(row.author_id) ?? 0) + 1);
    }

    return authorRows
      .map((row) => mapAuthor(row, counts.get(row.id) ?? 0))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return getBundledAuthors();
  }
}

export function getBundledAuthor(id: string): Author | undefined {
  return getBundledAuthors().find((author) => author.id === id);
}