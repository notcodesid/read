import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchAuthors } from '@/lib/authors';
import { fetchAuthorGroups, fetchBlogTopics, getBundledBlogTopicPreviews } from '@/lib/taxonomy';
import type { Author } from '@/types/author';
import type {
  AuthorGroupSection,
  BlogTopicSection,
  HomeBrowseMode,
} from '@/types/taxonomy';

export function useHomeBrowse() {
  const [mode, setMode] = useState<HomeBrowseMode>('authors');
  const [authors, setAuthors] = useState<Author[]>([]);
  const [authorGroups, setAuthorGroups] = useState<Awaited<ReturnType<typeof fetchAuthorGroups>>>([]);
  const [blogTopics, setBlogTopics] = useState<Awaited<ReturnType<typeof fetchBlogTopics>>>([]);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const topicPreviews = useMemo(() => getBundledBlogTopicPreviews(), []);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const [authorList, groups, topics] = await Promise.all([
        fetchAuthors(),
        fetchAuthorGroups(),
        fetchBlogTopics(),
      ]);
      setAuthors(authorList);
      setAuthorGroups(groups);
      setBlogTopics(topics);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load library';
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const authorSections = useMemo((): AuthorGroupSection[] => {
    return authorGroups
      .map((group) => ({
        group,
        authors: authors
          .filter((author) => author.authorGroupId === group.id)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      .filter((section) => section.authors.length > 0);
  }, [authorGroups, authors]);

  const blogSections = useMemo((): BlogTopicSection[] => {
    return blogTopics.map((topic) => ({
      topic,
      previewTitles: topicPreviews.get(topic.id) ?? [],
    }));
  }, [blogTopics, topicPreviews]);

  const ungroupedAuthors = useMemo(
    () => authors.filter((author) => !author.authorGroupId),
    [authors],
  );

  return {
    mode,
    setMode,
    authorSections,
    blogSections,
    ungroupedAuthors,
    refreshing,
    error,
    refresh: load,
  };
}