export type TextAnchor = {
  paragraphIndex: number;
  offset: number;
};

export type HighlightColor = 'default';

export type Highlight = {
  id: string;
  articleId: string;
  start: TextAnchor;
  end: TextAnchor;
  quote: string;
  color: HighlightColor;
  createdAt: string;
};

export type WordPointer = {
  paragraphIndex: number;
  wordIndex: number;
};