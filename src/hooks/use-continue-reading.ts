import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { loadContinueReadingItems } from '@/lib/continue-reading';
import type { ContinueReadingItem } from '@/types/continue-reading';

export function useContinueReading() {
  const [items, setItems] = useState<ContinueReadingItem[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const next = await loadContinueReadingItems();
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