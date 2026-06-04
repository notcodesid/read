export type ReadingAppearance = 'system' | 'paper' | 'sepia' | 'oled';

export type ReadingFontFamily = 'serif' | 'sans';

export type ReadingFontSize = 'small' | 'medium' | 'large' | 'xlarge';

export type ReadingLineHeight = 'compact' | 'normal' | 'relaxed';

export type ReadingMargin = 'narrow' | 'normal' | 'wide';

export type ReadingContentWidth = 'narrow' | 'standard' | 'wide';

export type HighlightColorId = 'yellow' | 'green';

export type HighlightLabel = 'idea' | 'quote' | 'todo';

export type ReadingPreferences = {
  appearance: ReadingAppearance;
  fontFamily: ReadingFontFamily;
  fontSize: ReadingFontSize;
  lineHeight: ReadingLineHeight;
  margin: ReadingMargin;
  contentWidth: ReadingContentWidth;
  defaultHighlightColor: HighlightColorId;
  defaultHighlightLabel: HighlightLabel | null;
};

export type ReadingStats = {
  wpmSamples: number[];
  totalWordsRead: number;
};

export const DEFAULT_READING_PREFERENCES: ReadingPreferences = {
  appearance: 'paper',
  fontFamily: 'serif',
  fontSize: 'medium',
  lineHeight: 'normal',
  margin: 'normal',
  contentWidth: 'standard',
  defaultHighlightColor: 'yellow',
  defaultHighlightLabel: null,
};

export const DEFAULT_READING_STATS: ReadingStats = {
  wpmSamples: [],
  totalWordsRead: 0,
};