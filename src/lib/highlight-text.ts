import type { Highlight, WordPointer } from '@/types/highlight';

export type WordToken = {
  wordIndex: number;
  text: string;
  start: number;
  end: number;
};

export type TextSegment = {
  text: string;
  highlighted: boolean;
  highlightId?: string;
};

const WORD_RE = /\S+/g;

export function tokenizeParagraph(text: string): WordToken[] {
  const tokens: WordToken[] = [];
  let match: RegExpExecArray | null;

  while ((match = WORD_RE.exec(text)) !== null) {
    tokens.push({
      wordIndex: tokens.length,
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return tokens;
}

export function comparePointers(a: WordPointer, b: WordPointer): number {
  if (a.paragraphIndex !== b.paragraphIndex) {
    return a.paragraphIndex - b.paragraphIndex;
  }
  return a.wordIndex - b.wordIndex;
}

export function normalizePointerRange(
  anchor: WordPointer,
  focus: WordPointer,
): { start: WordPointer; end: WordPointer } {
  return comparePointers(anchor, focus) <= 0
    ? { start: anchor, end: focus }
    : { start: focus, end: anchor };
}

export function isWordInSelection(
  pointer: WordPointer,
  anchor: WordPointer,
  focus: WordPointer,
): boolean {
  const { start, end } = normalizePointerRange(anchor, focus);
  return comparePointers(pointer, start) >= 0 && comparePointers(pointer, end) <= 0;
}

export function createHighlightId(): string {
  return `hl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function buildHighlightFromSelection(
  articleId: string,
  paragraphs: string[],
  anchor: WordPointer,
  focus: WordPointer,
): Highlight | null {
  const { start: lo, end: hi } = normalizePointerRange(anchor, focus);
  const startParagraph = paragraphs[lo.paragraphIndex];
  const endParagraph = paragraphs[hi.paragraphIndex];

  if (!startParagraph || !endParagraph) {
    return null;
  }

  const startTokens = tokenizeParagraph(startParagraph);
  const endTokens = tokenizeParagraph(endParagraph);
  const startToken = startTokens[lo.wordIndex];
  const endToken = endTokens[hi.wordIndex];

  if (!startToken || !endToken) {
    return null;
  }

  const quoteParts: string[] = [];

  for (let paragraphIndex = lo.paragraphIndex; paragraphIndex <= hi.paragraphIndex; paragraphIndex++) {
    const text = paragraphs[paragraphIndex] ?? '';

    if (lo.paragraphIndex === hi.paragraphIndex) {
      quoteParts.push(text.slice(startToken.start, endToken.end));
      continue;
    }

    if (paragraphIndex === lo.paragraphIndex) {
      quoteParts.push(text.slice(startToken.start));
    } else if (paragraphIndex === hi.paragraphIndex) {
      quoteParts.push(text.slice(0, endToken.end));
    } else {
      quoteParts.push(text);
    }
  }

  const quote = quoteParts.join('\n\n').trim();
  if (!quote) {
    return null;
  }

  return {
    id: createHighlightId(),
    articleId,
    start: { paragraphIndex: lo.paragraphIndex, offset: startToken.start },
    end: { paragraphIndex: hi.paragraphIndex, offset: endToken.end },
    quote,
    color: 'default',
    createdAt: new Date().toISOString(),
  };
}

export function highlightIntervalInParagraph(
  highlight: Highlight,
  paragraphIndex: number,
  paragraphLength: number,
): { start: number; end: number } | null {
  const { start, end } = highlight;

  if (paragraphIndex < start.paragraphIndex || paragraphIndex > end.paragraphIndex) {
    return null;
  }

  if (start.paragraphIndex === end.paragraphIndex && paragraphIndex === start.paragraphIndex) {
    return { start: start.offset, end: end.offset };
  }

  if (paragraphIndex === start.paragraphIndex) {
    return { start: start.offset, end: paragraphLength };
  }

  if (paragraphIndex === end.paragraphIndex) {
    return { start: 0, end: end.offset };
  }

  return { start: 0, end: paragraphLength };
}

type Interval = { start: number; end: number; highlightId: string };

function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) {
    return [];
  }

  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Interval[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
      last.highlightId = last.highlightId;
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

export function getParagraphSegments(
  paragraphText: string,
  paragraphIndex: number,
  highlights: Highlight[],
): TextSegment[] {
  const intervals: Interval[] = [];

  for (const highlight of highlights) {
    const range = highlightIntervalInParagraph(highlight, paragraphIndex, paragraphText.length);
    if (range && range.end > range.start) {
      intervals.push({
        start: range.start,
        end: range.end,
        highlightId: highlight.id,
      });
    }
  }

  if (intervals.length === 0) {
    return [{ text: paragraphText, highlighted: false }];
  }

  const merged = mergeIntervals(intervals);
  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const interval of merged) {
    if (interval.start > cursor) {
      segments.push({
        text: paragraphText.slice(cursor, interval.start),
        highlighted: false,
      });
    }

    segments.push({
      text: paragraphText.slice(interval.start, interval.end),
      highlighted: true,
      highlightId: interval.highlightId,
    });
    cursor = interval.end;
  }

  if (cursor < paragraphText.length) {
    segments.push({
      text: paragraphText.slice(cursor),
      highlighted: false,
    });
  }

  return segments.filter((segment) => segment.text.length > 0);
}

