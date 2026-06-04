import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { loadRecentlyOpenedItems } from '@/lib/recently-opened';
import type { RecentlyOpenedItem } from '@/types/recently-opened';

export function useRecentlyOpened() {
  const [items, setItems] = useState<RecentlyOpenedItem[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const next = await loadRecentlyOpenedItems();
    setItems(next);
    setReady(true);
    return next;
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { items, ready, refresh };
}