import { Platform } from 'react-native';

import { ReadingPaletteMap } from '@/constants/reading-palettes';
import { ReadingLayout } from '@/constants/reading';
import type {
  ReadingAppearance,
  ReadingContentWidth,
  ReadingFontFamily,
  ReadingFontSize,
  ReadingLineHeight,
  ReadingMargin,
  ReadingPreferences,
} from '@/types/reading-preferences';
import type { ReadingPalette } from '@/constants/reading-palettes';

const FONT_SIZE_MAP: Record<ReadingFontSize, number> = {
  small: 14,
  medium: 16,
  large: 18,
  xlarge: 20,
};

const LINE_HEIGHT_RATIO: Record<ReadingLineHeight, number> = {
  compact: 1.45,
  normal: 1.625,
  relaxed: 1.85,
};

const MARGIN_MAP: Record<ReadingMargin, number> = {
  narrow: 16,
  normal: ReadingLayout.insetX,
  wide: 40,
};

const WIDTH_MAP: Record<ReadingContentWidth, number> = {
  narrow: 480,
  standard: ReadingLayout.maxWidth,
  wide: 720,
};

export function resolvePalette(
  appearance: ReadingAppearance,
  systemScheme: 'light' | 'dark' | 'unspecified',
): ReadingPalette {
  if (appearance === 'paper') {
    return ReadingPaletteMap.paper;
  }
  if (appearance === 'sepia') {
    return ReadingPaletteMap.sepia;
  }
  if (appearance === 'oled') {
    return ReadingPaletteMap.oled;
  }

  const scheme = systemScheme === 'dark' ? 'dark' : 'light';
  return ReadingPaletteMap[scheme];
}

export function resolveBodyFontFamily(fontFamily: ReadingFontFamily): string | undefined {
  if (fontFamily === 'sans') {
    return Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'system-ui',
      web: 'system-ui, -apple-system, sans-serif',
    });
  }

  return Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
    web: 'Georgia, "Times New Roman", serif',
  });
}

export function resolveReadingTypography(prefs: ReadingPreferences) {
  const bodySize = FONT_SIZE_MAP[prefs.fontSize];
  const bodyLineHeight = Math.round(bodySize * LINE_HEIGHT_RATIO[prefs.lineHeight]);

  return {
    bodyFontFamily: resolveBodyFontFamily(prefs.fontFamily),
    titleFontFamily: resolveBodyFontFamily(prefs.fontFamily === 'serif' ? 'serif' : 'sans'),
    bodySize,
    bodyLineHeight,
    paragraphGap: Math.round(bodyLineHeight * 0.62),
    meta: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.15,
    },
  };
}

export function resolveReadingLayout(prefs: ReadingPreferences) {
  return {
    insetX: MARGIN_MAP[prefs.margin],
    insetTop: ReadingLayout.insetTop,
    insetBottom: ReadingLayout.insetBottom,
    maxWidth: WIDTH_MAP[prefs.contentWidth],
  };
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}

export function countArticleWords(paragraphs: string[]): number {
  return paragraphs.reduce((sum, paragraph) => sum + countWords(paragraph), 0);
}