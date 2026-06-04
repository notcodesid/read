import AsyncStorage from '@react-native-async-storage/async-storage';


import type { Highlight } from '@/types/highlight';

const STORAGE_PREFIX = '@read/highlights/v1/';

export function highlightsStoragePrefix(): string {
  return STORAGE_PREFIX;
}

function storageKey(articleId: string): string {
  return `${STORAGE_PREFIX}${articleId}`;
}

export async function loadHighlights(articleId: string): Promise<Highlight[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(articleId));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Highlight[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item) =>
          typeof item?.id === 'string' &&
          item.articleId === articleId &&
          typeof item.quote === 'string' &&
          item.start &&
          item.end,
      )
      .map((item) => ({
        ...item,
        color: item.color === 'green' ? 'green' : 'yellow',
      }));
  } catch {
    return [];
  }
}

export async function saveHighlights(articleId: string, highlights: Highlight[]): Promise<void> {
  await AsyncStorage.setItem(storageKey(articleId), JSON.stringify(highlights));
}

export async function loadAllHighlights(): Promise<Record<string, Highlight[]>> {
  const keys = await AsyncStorage.getAllKeys();
  const prefix = STORAGE_PREFIX;
  const result: Record<string, Highlight[]> = {};

  for (const key of keys) {
    if (!key.startsWith(prefix)) {
      continue;
    }
    const articleId = key.slice(prefix.length);
    result[articleId] = await loadHighlights(articleId);
  }

  return result;
}

export async function addHighlight(highlight: Highlight): Promise<Highlight[]> {
  const existing = await loadHighlights(highlight.articleId);
  const next = [...existing, highlight];
  await saveHighlights(highlight.articleId, next);
  return next;
}

export async function removeHighlight(
  articleId: string,
  highlightId: string,
): Promise<Highlight[]> {
  const existing = await loadHighlights(articleId);
  const next = existing.filter((item) => item.id !== highlightId);
  await saveHighlights(articleId, next);
  return next;
}

export async function updateHighlight(
  articleId: string,
  highlightId: string,
  patch: Partial<Pick<Highlight, 'color' | 'label' | 'note'>>,
): Promise<Highlight[]> {
  const existing = await loadHighlights(articleId);
  const next = existing.map((item) =>
    item.id === highlightId ? { ...item, ...patch } : item,
  );
  await saveHighlights(articleId, next);
  return next;
}