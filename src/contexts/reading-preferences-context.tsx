import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  HIGHLIGHT_COLOR_STYLES,
  HIGHLIGHT_COLOR_STYLES_DARK,
} from '@/constants/reading-palettes';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  loadReadingPreferences,
  loadReadingStats,
  saveReadingPreferences,
} from '@/lib/reading-preferences-storage';
import {
  resolvePalette,
  resolveReadingLayout,
  resolveReadingTypography,
} from '@/lib/resolve-reading-styles';
import { averageWpm } from '@/lib/reading-wpm';
import type { ReadingPalette } from '@/constants/reading-palettes';
import {
  DEFAULT_READING_PREFERENCES,
  DEFAULT_READING_STATS,
  type ReadingPreferences,
  type ReadingStats,
} from '@/types/reading-preferences';

type ReadingPreferencesContextValue = {
  ready: boolean;
  preferences: ReadingPreferences;
  stats: ReadingStats;
  theme: ReadingPalette;
  isDark: boolean;
  typography: ReturnType<typeof resolveReadingTypography>;
  layout: ReturnType<typeof resolveReadingLayout>;
  wpm: number;
  setPreference: <K extends keyof ReadingPreferences>(
    key: K,
    value: ReadingPreferences[K],
  ) => Promise<void>;
  refreshStats: () => Promise<void>;
  reloadFromStorage: () => Promise<void>;
  getHighlightStyle: (colorId: 'yellow' | 'green') => {
    fill: string;
    fillSelecting: string;
    underline: string;
  };
};

const ReadingPreferencesContext = createContext<ReadingPreferencesContextValue | null>(
  null,
);

export function ReadingPreferencesProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const [preferences, setPreferences] = useState<ReadingPreferences>(DEFAULT_READING_PREFERENCES);
  const [stats, setStats] = useState<ReadingStats>(DEFAULT_READING_STATS);

  useEffect(() => {
    let cancelled = false;

    Promise.all([loadReadingPreferences(), loadReadingStats()]).then(([prefs, nextStats]) => {
      if (!cancelled) {
        setPreferences(prefs);
        setStats(nextStats);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshStats = useCallback(async () => {
    const nextStats = await loadReadingStats();
    setStats(nextStats);
  }, []);

  const reloadFromStorage = useCallback(async () => {
    const [prefs, nextStats] = await Promise.all([
      loadReadingPreferences(),
      loadReadingStats(),
    ]);
    setPreferences(prefs);
    setStats(nextStats);
  }, []);

  const setPreference = useCallback(
    async <K extends keyof ReadingPreferences>(key: K, value: ReadingPreferences[K]) => {
      setPreferences((current) => {
        const next = { ...current, [key]: value };
        void saveReadingPreferences(next);
        return next;
      });
    },
    [],
  );

  const resolved = useMemo(() => {
    const palette = resolvePalette(preferences.appearance, systemScheme);

    return {
      theme: palette,
      isDark: palette.isDark,
      typography: resolveReadingTypography(preferences),
      layout: resolveReadingLayout(preferences),
      wpm: averageWpm(stats.wpmSamples),
    };
  }, [preferences, stats.wpmSamples, systemScheme]);

  const getHighlightStyle = useCallback(
    (colorId: 'yellow' | 'green') => {
      const styles = resolved?.isDark ? HIGHLIGHT_COLOR_STYLES_DARK : HIGHLIGHT_COLOR_STYLES;
      return styles[colorId];
    },
    [resolved?.isDark],
  );

  const value = useMemo(
    (): ReadingPreferencesContextValue => ({
      ready,
      preferences,
      stats,
      theme: resolved.theme,
      isDark: resolved.isDark,
      typography: resolved.typography,
      layout: resolved.layout,
      wpm: resolved.wpm,
      setPreference,
      refreshStats,
      reloadFromStorage,
      getHighlightStyle,
    }),
    [
      ready,
      preferences,
      stats,
      resolved,
      setPreference,
      refreshStats,
      reloadFromStorage,
      getHighlightStyle,
    ],
  );

  return (
    <ReadingPreferencesContext.Provider value={value}>
      {children}
    </ReadingPreferencesContext.Provider>
  );
}

export function useReadingPreferences() {
  const context = useContext(ReadingPreferencesContext);
  if (!context) {
    throw new Error('useReadingPreferences must be used within ReadingPreferencesProvider');
  }
  return context;
}