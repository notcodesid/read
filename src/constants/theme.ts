import { Platform } from 'react-native';

export { ReadingColors, ReadingLayout, ReadingTypography } from '@/constants/reading';
export type { ReadingTheme } from '@/constants/reading';

/** @deprecated Use ReadingColors */
export { ReadingColors as Colors } from '@/constants/reading';

import { ReadingColors } from '@/constants/reading';

export type ThemeColor = keyof (typeof ReadingColors)['light'] &
  keyof (typeof ReadingColors)['dark'];

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'Georgia',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 680;