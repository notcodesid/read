import '@/global.css';

import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LaunchSplash } from '@/components/launch-splash';
import { ReadingPreferencesProvider, useReadingPreferences } from '@/contexts/reading-preferences-context';

function NavigationRoot() {
  const { theme, isDark } = useReadingPreferences();

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
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
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
        <LaunchSplash />
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReadingPreferencesProvider>
        <NavigationRoot />
      </ReadingPreferencesProvider>
    </GestureHandlerRootView>
  );
}