import { useCallback, useEffect, useState } from 'react';

import { fetchAuthors, getBundledAuthors } from '@/lib/authors';
import { devWarn } from '@/lib/log';
import type { Author } from '@/types/author';

export function useAuthors() {
  const [authors, setAuthors] = useState<Author[]>(() => getBundledAuthors());
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const result = await fetchAuthors();
      setAuthors(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load authors';
      devWarn('[read:useAuthors]', message, err);
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { authors, refreshing, error, refresh: load };
}