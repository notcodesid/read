import { loadReadingProgress, saveReadingProgress } from '@/lib/reading-progress-storage';

export async function loadScrollPosition(articleId: string): Promise<number> {
  const store = await loadReadingProgress();
  return store.scrollPositions[articleId]?.offsetY ?? 0;
}

export async function saveScrollPosition(articleId: string, offsetY: number): Promise<void> {
  const store = await loadReadingProgress();
  await saveReadingProgress({
    ...store,
    scrollPositions: {
      ...store.scrollPositions,
      [articleId]: {
        offsetY: Math.max(0, offsetY),
        updatedAt: new Date().toISOString(),
      },
    },
  });
}