import '@/global.css';

import * as Network from 'expo-network';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthGate } from '@/components/auth-gate';
import { LaunchSplash } from '@/components/launch-splash';
import { AuthProvider } from '@/contexts/auth-context';
import { ReadingPreferencesProvider, useReadingPreferences } from '@/contexts/reading-preferences-context';
import { useNotificationObserver } from '@/hooks/use-notification-observer';
import { clearSyncBackoff } from '@/lib/connectivity';
import { configureReadingNotifications } from '@/lib/notifications-setup';

configureReadingNotifications();

function NavigationRoot() {
  const { theme, isDark } = useReadingPreferences();
  useNotificationObserver();

  useEffect(() => {
    const subscription = Network.addNetworkStateListener((state) => {
      if (state.isConnected !== false && state.isInternetReachable !== false) {
        clearSyncBackoff();
      }
    });
    return () => subscription.remove();
  }, []);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.backgroundElement,
      text: theme.text,
      border: theme.border,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
            <Stack.Screen name="index" />
          <Stack.Screen
            name="author/[id]"
            options={{ gestureEnabled: true, fullScreenGestureEnabled: true }}
          />
          <Stack.Screen
            name="read/[id]"
            options={{ gestureEnabled: true, fullScreenGestureEnabled: true }}
          />
          </Stack>
        </AuthGate>
        <LaunchSplash />
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ReadingPreferencesProvider>
          <NavigationRoot />
        </ReadingPreferencesProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}