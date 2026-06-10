import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import {
  isAppleSignInAvailable,
  onAppleCredentialRevoked,
  restoreAppleSession,
  setAppleProfilePhoto,
  signInWithApple,
  signOutFromApple,
} from '@/lib/native-apple-auth';
import type { AppleUserSession } from '@/types/apple-session';

type AuthContextValue = {
  ready: boolean;
  session: AppleUserSession | null;
  isSignedIn: boolean;
  appleSignInAvailable: boolean;
  busy: boolean;
  photoBusy: boolean;
  error: string | null;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  setProfilePhoto: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AppleUserSession | null>(null);
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signOut = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await signOutFromApple();
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign out.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      const available = Platform.OS === 'ios' && (await isAppleSignInAvailable());
      if (!active) {
        return;
      }
      setAppleSignInAvailable(available);
      setSession(await restoreAppleSession());
      setReady(true);
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    const subscription = onAppleCredentialRevoked(() => {
      void signOut();
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setProfilePhoto = useCallback(async () => {
    if (photoBusy) {
      return;
    }
    setPhotoBusy(true);
    setError(null);
    try {
      setSession(await setAppleProfilePhoto());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update profile photo.');
    } finally {
      setPhotoBusy(false);
    }
  }, [photoBusy]);

  const handleSignIn = useCallback(async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setSession(await signInWithApple());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not sign in.';
      if (message !== 'ERR_REQUEST_CANCELED') {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const value = useMemo(
    (): AuthContextValue => ({
      ready,
      session,
      isSignedIn: Boolean(session),
      appleSignInAvailable,
      busy,
      photoBusy,
      error,
      signInWithApple: handleSignIn,
      signOut,
      setProfilePhoto,
      clearError: () => setError(null),
    }),
    [ready, session, appleSignInAvailable, busy, photoBusy, error, handleSignIn, signOut, setProfilePhoto],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}