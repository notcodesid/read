import bundledGroups from '@/data/author-groups.json';
import bundledTopics from '@/data/blog-topics.json';
import bundledSummaries from '@/data/article-summaries.json';
import { markSyncFailure, shouldSyncFromNetwork } from '@/lib/connectivity';
import { getSupabaseConfig, supabase } from '@/lib/supabase';
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
  if (!(await shouldSyncFromNetwork())) {
    return getBundledAuthorGroups();
  }

  const { url, key } = getSupabaseConfig();
  if (!url || !key) return getBundledAuthorGroups();

  try {
    const query = supabase
      .from('author_groups')
      .select('id,name,description,sort_order')
      .order('sort_order', { ascending: true });

    if (signal) {
      query.abortSignal(signal);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data as AuthorGroupRow[]).map(mapAuthorGroup);
  } catch {
    markSyncFailure();
    return getBundledAuthorGroups();
  }
}

export async function fetchBlogTopics(signal?: AbortSignal): Promise<BlogTopic[]> {
  if (!(await shouldSyncFromNetwork())) {
    return getBundledBlogTopics();
  }

  const { url, key } = getSupabaseConfig();
  if (!url || !key) return getBundledBlogTopics();

  try {
    const topicsQuery = supabase
      .from('blog_topics')
      .select('id,name,description,sort_order')
      .order('sort_order', { ascending: true });
    const countsQuery = supabase.from('articles').select('blog_topic_id');

    if (signal) {
      topicsQuery.abortSignal(signal);
      countsQuery.abortSignal(signal);
    }

    const [{ data: topicRows, error: topicsError }, { data: countRows, error: countsError }] =
      await Promise.all([topicsQuery, countsQuery]);

    if (topicsError) {
      throw topicsError;
    }
    if (countsError) {
      throw countsError;
    }

    const counts = new Map<string, number>();
    for (const row of (countRows ?? []) as { blog_topic_id: string | null }[]) {
      if (!row.blog_topic_id) continue;
      counts.set(row.blog_topic_id, (counts.get(row.blog_topic_id) ?? 0) + 1);
    }

    return (topicRows as BlogTopicRow[])
      .map((row) => mapBlogTopic(row, counts.get(row.id) ?? 0))
      .filter((topic) => topic.articleCount > 0)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    markSyncFailure();
    return getBundledBlogTopics();
  }
}

export function getBundledBlogTopic(id: string): BlogTopic | undefined {
  return getBundledBlogTopics().find((topic) => topic.id === id);
}