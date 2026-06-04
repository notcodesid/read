import type { HighlightColorId, HighlightLabel } from '@/types/reading-preferences';

export type TextAnchor = {
  paragraphIndex: number;
  offset: number;
};

export type Highlight = {
  id: string;
  articleId: string;
  start: TextAnchor;
  end: TextAnchor;
  quote: string;
  color: HighlightColorId;
  label?: HighlightLabel;
  note?: string;
  createdAt: string;
};

export type WordPointer = {
  paragraphIndex: number;
  wordIndex: number;
};