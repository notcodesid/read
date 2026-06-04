import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  getBookmarkState,
  loadReadLaterItems,
  toggleArticleBookmark,
} from '@/lib/bookmarks';
import type { ReadLaterItem } from '@/types/bookmark';

export function useBookmarks(articleId?: string) {
  const [items, setItems] = useState<ReadLaterItem[]>([]);
  const [bookmarked, setBookmarked] = useState(false);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const [nextItems, nextBookmarked] = await Promise.all([
      loadReadLaterItems(),
      articleId ? getBookmarkState(articleId) : Promise.resolve(false),
    ]);
    setItems(nextItems);
    setBookmarked(nextBookmarked);
    setReady(true);
    return { items: nextItems, bookmarked: nextBookmarked };
  }, [articleId]);

  const toggleBookmark = useCallback(async () => {
    if (!articleId) {
      return bookmarked;
    }

    const next = await toggleArticleBookmark(articleId);
    setBookmarked(next);
    const nextItems = await loadReadLaterItems();
    setItems(nextItems);
    return next;
  }, [articleId, bookmarked]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { items, bookmarked, ready, refresh, toggleBookmark };
}