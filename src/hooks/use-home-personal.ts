import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { loadReadLaterItems } from '@/lib/bookmarks';
import { loadContinueReadingItems } from '@/lib/continue-reading';
import { resolveDailyPick } from '@/lib/daily-pick';
import { loadForYouRecommendations } from '@/lib/recommendations';
import { syncDailyReadingReminder } from '@/lib/reading-reminders';
import type { ReadLaterItem } from '@/types/bookmark';
import type { ContinueReadingItem } from '@/types/continue-reading';
import type { DailyPickItem } from '@/types/daily-reading';
import type { ForYouItem } from '@/types/recommendation';

/**
 * Loads Continue, Read later, and For you from the same local snapshot.
 * Refreshes whenever Home gains focus (e.g. back from the reader).
 */
export function useHomePersonal() {
  const [continueReading, setContinueReading] = useState<ContinueReadingItem[]>([]);
  const [readLater, setReadLater] = useState<ReadLaterItem[]>([]);
  const [forYou, setForYou] = useState<ForYouItem[]>([]);
  const [dailyPick, setDailyPick] = useState<DailyPickItem | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const [nextContinue, nextReadLater, nextForYou] = await Promise.all([
      loadContinueReadingItems(),
      loadReadLaterItems(),
      loadForYouRecommendations(),
    ]);

    const preferredIds = nextForYou.map((item) => item.articleId);
    const nextDailyPick = await resolveDailyPick(preferredIds);
    await syncDailyReadingReminder(nextDailyPick);

    setContinueReading(nextContinue);
    setReadLater(nextReadLater);
    setForYou(nextForYou);
    setDailyPick(nextDailyPick);
    setReady(true);

    return {
      continueReading: nextContinue,
      readLater: nextReadLater,
      forYou: nextForYou,
      dailyPick: nextDailyPick,
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { continueReading, readLater, forYou, dailyPick, ready, refresh };
}