import { useEffect, useRef } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { useReadingPreferences } from '@/contexts/reading-preferences-context';

/**
 * Reloads reading prefs/stats when auth transitions change the on-device library.
 */
export function AuthReadingSync() {
  const { ready: authReady, isSignedIn } = useAuth();
  const { ready: prefsReady, reloadFromStorage } = useReadingPreferences();
  const previousSignedIn = useRef<boolean | null>(null);

  useEffect(() => {
    if (!authReady || !prefsReady) {
      return;
    }

    if (previousSignedIn.current !== null && previousSignedIn.current !== isSignedIn) {
      void reloadFromStorage();
    }

    previousSignedIn.current = isSignedIn;
  }, [authReady, prefsReady, isSignedIn, reloadFromStorage]);

  return null;
}