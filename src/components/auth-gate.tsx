import { Redirect, useSegments } from 'expo-router';
import { type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { useReadingPreferences } from '@/contexts/reading-preferences-context';

export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, isSignedIn } = useAuth();
  const { theme } = useReadingPreferences();
  const segments = useSegments();

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.textSecondary} />
      </View>
    );
  }

  const onOnboarding = segments[0] === 'onboarding';

  if (!isSignedIn && !onOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (isSignedIn && onOnboarding) {
    return <Redirect href="/" />;
  }

  return children;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});