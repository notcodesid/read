import { useReadingPreferences } from '@/contexts/reading-preferences-context';

export function useTheme() {
  return useReadingPreferences().theme;
}