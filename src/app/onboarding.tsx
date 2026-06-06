import * as AppleAuthentication from 'expo-apple-authentication';
import * as Device from 'expo-device';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/app-logo';
import { useAuth } from '@/contexts/auth-context';
import { useReadingPreferences } from '@/contexts/reading-preferences-context';
import { ReadingLayout } from '@/constants/reading';

export default function OnboardingScreen() {
  const theme = useReadingPreferences().theme;
  const { reloadFromStorage } = useReadingPreferences();
  const { appleSignInAvailable, busy, error, signInWithApple, clearError } = useAuth();
  const onSimulator = !Device.isDevice;
  const signingIn = busy;

  const handleSignUp = () => {
    clearError();
    void (async () => {
      try {
        await signInWithApple();
        await reloadFromStorage();
      } catch {
        // Error is already handled by auth context
        // Don't reload storage if sign-in failed
      }
    })();
  };

  const canShowAppleButton = Platform.OS === 'ios' && appleSignInAvailable;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <AppLogo size={88} />
        <Text style={[styles.title, { color: theme.text }]}>Welcome to Read</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Sign up with Apple to start reading. Your library stays private on this device.
        </Text>

        {onSimulator ? (
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            Simulator: open Settings → Apple Account, sign in there first, then tap Sign up
            with Apple below.
          </Text>
        ) : null}

        {signingIn ? (
          <View style={styles.pending}>
            <ActivityIndicator color={theme.textSecondary} />
            <Text style={[styles.hint, { color: theme.textSecondary }]}>Signing up…</Text>
          </View>
        ) : canShowAppleButton ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={10}
            style={styles.appleButton}
            onPress={handleSignUp}
          />
        ) : (
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            {Platform.OS === 'ios'
              ? 'Sign up with Apple is not available on this device. Rebuild with bun run ios.'
              : 'Sign up with Apple is available on iOS.'}
          </Text>
        )}

        {error ? <Text style={[styles.error, { color: theme.textSecondary }]}>{error}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ReadingLayout.insetX,
    gap: 16,
  },
  title: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
  },
  appleButton: {
    width: '100%',
    maxWidth: 320,
    height: 50,
    marginTop: 8,
  },
  pending: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 300,
    fontStyle: 'italic',
  },
});