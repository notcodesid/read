import bundledGroups from '@/data/author-groups.json';
import bundledTopics from '@/data/blog-topics.json';
import bundledSummaries from '@/data/article-summaries.json';
import { fetchWithTimeout, getSupabaseConfig } from '@/lib/supabase';
import type { AuthorGroup, BlogTopic } from '@/types/taxonomy';

type AuthorGroupRow = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
};

type BlogTopicRow = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
};

type SummaryRow = {
  id: string;
  title: string;
  author_id: string;
  category: string | null;
};

function mapAuthorGroup(row: AuthorGroupRow): AuthorGroup {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    sortOrder: row.sort_order,
  };
}

function mapBlogTopic(row: BlogTopicRow, articleCount: number): BlogTopic {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    sortOrder: row.sort_order,
    articleCount,
  };
}

function countArticlesByTopicFromSummaries(): Map<string, number> {
  const topicNameToId = new Map(
    (bundledTopics as BlogTopicRow[]).map((topic) => [topic.name, topic.id]),
  );
  const counts = new Map<string, number>();

  for (const row of bundledSummaries as SummaryRow[]) {
    if (!row.category) continue;
    const topicId = topicNameToId.get(row.category);
    if (!topicId) continue;
    counts.set(topicId, (counts.get(topicId) ?? 0) + 1);
  }

  return counts;
}

function previewTitlesByTopic(limit = 3): Map<string, string[]> {
  const topicNameToId = new Map(
    (bundledTopics as BlogTopicRow[]).map((topic) => [topic.name, topic.id]),
  );
  const previews = new Map<string, string[]>();

  for (const row of bundledSummaries as SummaryRow[]) {
    if (!row.category) continue;
    const topicId = topicNameToId.get(row.category);
    if (!topicId) continue;
    const list = previews.get(topicId) ?? [];
    if (list.length < limit) {
      list.push(row.title);
      previews.set(topicId, list);
    }
  }

  return previews;
}

export function getBundledAuthorGroups(): AuthorGroup[] {
  return (bundledGroups as AuthorGroupRow[])
    .map(mapAuthorGroup)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getBundledBlogTopics(): BlogTopic[] {
  const counts = countArticlesByTopicFromSummaries();
  return (bundledTopics as BlogTopicRow[])
    .map((row) => mapBlogTopic(row, counts.get(row.id) ?? 0))
    .filter((topic) => topic.articleCount > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getBundledBlogTopicPreviews(): Map<string, string[]> {
  return previewTitlesByTopic();
}

export function getBundledArticlesForTopic(topicId: string) {
  const topic = (bundledTopics as BlogTopicRow[]).find((row) => row.id === topicId);
  if (!topic) return [];

  return (bundledSummaries as SummaryRow[])
    .filter((row) => row.category === topic.name)
    .map((row) => ({
      id: row.id,
      title: row.title,
      authorId: row.author_id,
      category: row.category ?? undefined,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function fetchAuthorGroups(signal?: AbortSignal): Promise<AuthorGroup[]> {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return getBundledAuthorGroups();

  try {
    const endpoint =
      `${url}/rest/v1/author_groups?select=id,name,description,sort_order&order=sort_order.asc`;
    const res = await fetchWithTimeout(endpoint, {
      signal,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) throw new Error('author_groups fetch failed');
    const rows = (await res.json()) as AuthorGroupRow[];
    return rows.map(mapAuthorGroup);
  } catch {
    return getBundledAuthorGroups();
  }
}

export async function fetchBlogTopics(signal?: AbortSignal): Promise<BlogTopic[]> {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return getBundledBlogTopics();

  try {
    const [topicsRes, countsRes] = await Promise.all([
      fetchWithTimeout(
        `${url}/rest/v1/blog_topics?select=id,name,description,sort_order&order=sort_order.asc`,
        {
          signal,
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            Accept: 'application/json',
          },
        },
      ),
      fetchWithTimeout(`${url}/rest/v1/articles?select=blog_topic_id`, {
        signal,
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
        },
      }),
    ]);

    if (!topicsRes.ok || !countsRes.ok) throw new Error('blog_topics fetch failed');

    const topicRows = (await topicsRes.json()) as BlogTopicRow[];
    const countRows = (await countsRes.json()) as { blog_topic_id: string | null }[];
    const counts = new Map<string, number>();

    for (const row of countRows) {
      if (!row.blog_topic_id) continue;
      counts.set(row.blog_topic_id, (counts.get(row.blog_topic_id) ?? 0) + 1);
    }

    return topicRows
      .map((row) => mapBlogTopic(row, counts.get(row.id) ?? 0))
      .filter((topic) => topic.articleCount > 0)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return getBundledBlogTopics();
  }
}

export function getBundledBlogTopic(id: string): BlogTopic | undefined {
  return getBundledBlogTopics().find((topic) => topic.id === id);
}