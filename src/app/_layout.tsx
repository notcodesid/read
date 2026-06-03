import '@/global.css';

import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { View } from 'react-native';
import { useColorScheme } from 'react-native';

import { LaunchSplash } from '@/components/launch-splash';
import { ReadingColors } from '@/constants/reading';

const light = ReadingColors.light;
const dark = ReadingColors.dark;

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: light.background,
    card: light.backgroundElement,
    text: light.text,
    border: light.border,
  },
};

const DarkReadingTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: dark.background,
    card: dark.backgroundElement,
    text: dark.text,
    border: dark.border,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? dark : light;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkReadingTheme : LightTheme}>
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