import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchAuthors } from '@/lib/authors';
import { fetchAuthorGroups } from '@/lib/taxonomy';
import type { Author } from '@/types/author';
import type { AuthorGroup, AuthorGroupSection } from '@/types/taxonomy';

export function useAuthorShelf() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [groups, setGroups] = useState<AuthorGroup[]>([]);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const [authorList, groupList] = await Promise.all([fetchAuthors(), fetchAuthorGroups()]);
      setAuthors(authorList);
      setGroups(groupList);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load authors';
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sections = useMemo((): AuthorGroupSection[] => {
    return groups.map((group) => ({
      group,
      authors: authors
        .filter((author) => author.authorGroupId === group.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }, [authors, groups]);

  const unassignedAuthors = useMemo(
    () =>
      authors
        .filter((author) => !author.authorGroupId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [authors],
  );

  return { sections, unassignedAuthors, refreshing, error, refresh: load };
}