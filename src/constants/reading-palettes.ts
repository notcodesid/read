import type { HighlightColorId } from '@/types/reading-preferences';

export type ReadingPalette = {
  text: string;
  background: string;
  backgroundElement: string;
  backgroundSelected: string;
  textSecondary: string;
  border: string;
  isDark: boolean;
};

export const ReadingPaletteMap: Record<string, ReadingPalette> = {
  paper: {
    text: '#1a1816',
    background: '#faf8f5',
    backgroundElement: '#f0ebe4',
    backgroundSelected: '#e8e2d9',
    textSecondary: '#6b6560',
    border: '#e5dfd6',
    isDark: false,
  },
  sepia: {
    text: '#3d3229',
    background: '#f4ecd8',
    backgroundElement: '#ebe3cf',
    backgroundSelected: '#e0d6c0',
    textSecondary: '#6f5f4d',
    border: '#ddd2b8',
    isDark: false,
  },
  oled: {
    text: '#e8e6e3',
    background: '#000000',
    backgroundElement: '#141414',
    backgroundSelected: '#1f1f1f',
    textSecondary: '#9a968f',
    border: '#2a2a2a',
    isDark: true,
  },
  light: {
    text: '#1a1816',
    background: '#faf8f5',
    backgroundElement: '#f0ebe4',
    backgroundSelected: '#e8e2d9',
    textSecondary: '#6b6560',
    border: '#e5dfd6',
    isDark: false,
  },
  dark: {
    text: '#ebe8e3',
    background: '#141312',
    backgroundElement: '#1f1d1b',
    backgroundSelected: '#2a2724',
    textSecondary: '#9a948c',
    border: '#2a2724',
    isDark: true,
  },
};

export const HIGHLIGHT_COLOR_STYLES: Record<
  HighlightColorId,
  { fill: string; fillSelecting: string; underline: string }
> = {
  yellow: {
    fill: 'rgba(255, 205, 105, 0.48)',
    fillSelecting: 'rgba(255, 205, 105, 0.62)',
    underline: 'rgba(255, 169, 107, 0.55)',
  },
  green: {
    fill: 'rgba(144, 220, 160, 0.45)',
    fillSelecting: 'rgba(144, 220, 160, 0.58)',
    underline: 'rgba(90, 180, 110, 0.5)',
  },
};

/** Dark-mode adjusted highlight fills */
export const HIGHLIGHT_COLOR_STYLES_DARK: Record<
  HighlightColorId,
  { fill: string; fillSelecting: string; underline: string }
> = {
  yellow: {
    fill: 'rgba(255, 205, 105, 0.28)',
    fillSelecting: 'rgba(255, 205, 105, 0.42)',
    underline: 'rgba(255, 169, 107, 0.4)',
  },
  green: {
    fill: 'rgba(144, 220, 160, 0.22)',
    fillSelecting: 'rgba(144, 220, 160, 0.36)',
    underline: 'rgba(90, 180, 110, 0.35)',
  },
};

export const HIGHLIGHT_LABELS = [
  { id: 'idea' as const, name: 'Idea' },
  { id: 'quote' as const, name: 'Quote' },
  { id: 'todo' as const, name: 'Todo' },
];