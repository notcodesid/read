import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppLogo } from '@/components/app-logo';
import { ReadingColors } from '@/constants/reading';
import { useColorScheme } from '@/hooks/use-color-scheme';

const DISPLAY_MS = 1100;
const FADE_MS = 300;

SplashScreen.preventAutoHideAsync().catch(() => {});

function hideNativeSplash() {
  SplashScreen.hideAsync().catch(() => {});
}

export function LaunchSplash() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? ReadingColors.dark : ReadingColors.light;
  const opacity = useSharedValue(1);
  const [done, setDone] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: FADE_MS }, (finished) => {
        if (finished) {
          runOnJS(hideNativeSplash)();
          runOnJS(setDone)(true);
        }
      });
    }, DISPLAY_MS);

    return () => clearTimeout(timer);
  }, [opacity]);

  if (done) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.overlay, animatedStyle, { backgroundColor: theme.background }]}>
      <View style={styles.center}>
        <AppLogo size={88} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});