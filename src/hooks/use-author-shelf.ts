import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchAuthors } from '@/lib/authors';
import { clearSyncBackoff, shouldSyncFromNetwork } from '@/lib/connectivity';
import { devLog } from '@/lib/log';
import { getOfflineAuthorGroups, getOfflineAuthors } from '@/lib/offline-content';
import { fetchAuthorGroups } from '@/lib/taxonomy';
import type { Author } from '@/types/author';
import type { AuthorGroup, AuthorGroupSection } from '@/types/taxonomy';

const LOG = '[read:catalog-sync]';

export function useAuthorShelf() {
  const [authors, setAuthors] = useState<Author[]>(() => getOfflineAuthors());
  const [groups, setGroups] = useState<AuthorGroup[]>(() => getOfflineAuthorGroups());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    if (force) {
      clearSyncBackoff();
    }

    const hasBundledLibrary = getOfflineAuthors().length > 0;

    if (!(await shouldSyncFromNetwork())) {
      setAuthors(getOfflineAuthors());
      setGroups(getOfflineAuthorGroups());
      setError(null);
      setRefreshing(false);
      if (__DEV__) {
        devLog(LOG, 'using bundled catalog');
      }
      return;
    }

    if (!hasBundledLibrary || force) {
      setRefreshing(true);
    }

    setError(null);

    try {
      const [authorList, groupList] = await Promise.all([fetchAuthors(), fetchAuthorGroups()]);
      setAuthors(authorList);
      setGroups(groupList);
      if (__DEV__) {
        devLog(LOG, 'catalog synced from network');
      }
    } catch (err) {
      if (__DEV__) {
        devLog(LOG, 'catalog sync failed, using bundled library', err);
      }
      setAuthors(getOfflineAuthors());
      setGroups(getOfflineAuthorGroups());
      if (!hasBundledLibrary) {
        const message = err instanceof Error ? err.message : 'Failed to load authors';
        setError(message);
      } else {
        setError(null);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
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

  const refresh = useCallback(() => load(true), [load]);

  return { sections, unassignedAuthors, refreshing, error, refresh };
}