import { countArticleWords } from '@/lib/resolve-reading-styles';
import { loadReadingStats, saveReadingStats } from '@/lib/reading-preferences-storage';

const MAX_SAMPLES = 12;
const DEFAULT_WPM = 220;

export function averageWpm(samples: number[]): number {
  if (samples.length === 0) {
    return DEFAULT_WPM;
  }
  const sum = samples.reduce((total, value) => total + value, 0);
  return Math.round(sum / samples.length);
}

export function estimateReadingMinutes(wordCount: number, samples: number[]): number {
  const wpm = averageWpm(samples);
  return Math.max(1, Math.ceil(wordCount / wpm));
}

export async function recordReadingSession(
  paragraphs: string[],
  elapsedMs: number,
  progressRatio: number,
): Promise<number> {
  const totalWords = countArticleWords(paragraphs);
  const wordsRead = Math.max(1, Math.round(totalWords * Math.min(1, Math.max(0, progressRatio))));
  const minutes = elapsedMs / 60_000;

  if (minutes < 0.15) {
    return averageWpm((await loadReadingStats()).wpmSamples);
  }

  const sessionWpm = Math.round(wordsRead / minutes);
  const clamped = Math.min(500, Math.max(80, sessionWpm));

  const stats = await loadReadingStats();
  const wpmSamples = [...stats.wpmSamples, clamped].slice(-MAX_SAMPLES);

  await saveReadingStats({
    wpmSamples,
    totalWordsRead: stats.totalWordsRead + wordsRead,
  });

  return averageWpm(wpmSamples);
}