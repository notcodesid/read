import { Platform } from 'react-native';

/** Paper-like palette tuned for long-form reading — no side-effect imports */
export const ReadingColors = {
  light: {
    text: '#1a1816',
    background: '#faf8f5',
    backgroundElement: '#f0ebe4',
    backgroundSelected: '#e8e2d9',
    textSecondary: '#6b6560',
    border: '#e5dfd6',
  },
  dark: {
    text: '#ebe8e3',
    background: '#141312',
    backgroundElement: '#1f1d1b',
    backgroundSelected: '#2a2724',
    textSecondary: '#9a948c',
    border: '#2a2724',
  },
} as const;

export type ReadingTheme = (typeof ReadingColors)['light'];

const serif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
  web: 'var(--font-serif)',
});

export const ReadingTypography = {
  serif,
  bodySize: 16,
  bodyLineHeight: 26,
  paragraphGap: 16,
  meta: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.15,
  },
} as const;

/** Content inset — breathing room around text blocks */
export const ReadingLayout = {
  insetX: 28,
  insetTop: 20,
  insetBottom: 48,
  maxWidth: 580,
  headerIconSize: 36,
} as const;

/** Vertical 3:4 cover tiles (Kindle library carousel). */
export const ReadingCover = {
  aspectRatio: 3 / 4,
  tileWidth: 112,
  tileGap: 24,
  radius: 4,
  headerWidth: 72,
} as const;

/** Warm highlighter — matches the book logo accent */
export const ReadingHighlight = {
  light: {
    fill: 'rgba(255, 205, 105, 0.48)',
    fillSelecting: 'rgba(255, 205, 105, 0.62)',
    underline: 'rgba(255, 169, 107, 0.55)',
  },
  dark: {
    fill: 'rgba(255, 205, 105, 0.28)',
    fillSelecting: 'rgba(255, 205, 105, 0.42)',
    underline: 'rgba(255, 169, 107, 0.4)',
  },
} as const;