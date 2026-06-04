import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { loadForYouRecommendations } from '@/lib/recommendations';
import type { ForYouItem } from '@/types/recommendation';

export function useForYou() {
  const [items, setItems] = useState<ForYouItem[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const next = await loadForYouRecommendations();
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