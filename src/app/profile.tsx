import { Stack, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IosSettingsGroup, IosSettingsRow } from '@/components/ios-settings-group';
import { ProfileAvatar } from '@/components/profile-avatar';
import { ReadingLayout } from '@/constants/reading';
import { useAuth } from '@/contexts/auth-context';
import { useReadingPreferences } from '@/contexts/reading-preferences-context';
import { useTheme } from '@/hooks/use-theme';
import { profileDisplayName, profileSubtitle } from '@/lib/profile-display';

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { reloadFromStorage } = useReadingPreferences();
  const { session, busy, photoBusy, error, signOut, setProfilePhoto, clearError } = useAuth();

  if (!session) {
    return null;
  }

  const displayName = profileDisplayName(session);
  const subtitle = profileSubtitle(session);

  const handleChangePhoto = () => {
    if (photoBusy) {
      return;
    }
    clearError();
    void setProfilePhoto();
  };

  const handleSignOut = () => {
    void signOut().then(() => {
      void reloadFromStorage();
      router.replace('/onboarding');
    });
  };

  return (
    <>
      <Stack.Screen options={{ animation: 'slide_from_right', gestureEnabled: true }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.navBar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={[styles.backLabel, { color: theme.text }]}>← Read</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ProfileAvatar
              fullName={session.fullName}
              photoUri={session.photoUri}
              photoUpdatedAt={session.photoUpdatedAt}
              size="profile"
              onPress={handleChangePhoto}
            />
            {photoBusy ? (
              <ActivityIndicator color={theme.textSecondary} style={styles.photoLoader} />
            ) : null}
            {displayName ? (
              <Text style={[styles.name, { color: theme.text }]}>{displayName}</Text>
            ) : null}
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
            ) : null}
          </View>

          {error ? (
            <Text style={[styles.error, { color: theme.textSecondary }]}>{error}</Text>
          ) : null}

          <View style={styles.sections}>
            {(displayName || session.email) ? (
              <IosSettingsGroup>
                {displayName ? (
                  <IosSettingsRow label="Name" value={displayName} isLast={!session.email} />
                ) : null}
                {session.email ? (
                  <IosSettingsRow label="Email" value={session.email} isLast />
                ) : null}
              </IosSettingsGroup>
            ) : null}

            <Pressable
              onPress={handleSignOut}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Sign out">
              <IosSettingsGroup>
                <View style={styles.signOutRow}>
                  {busy ? (
                    <ActivityIndicator color="#FF3B30" />
                  ) : (
                    <Text style={styles.signOutText}>Sign Out</Text>
                  )}
                </View>
              </IosSettingsGroup>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  navBar: {
    paddingHorizontal: ReadingLayout.insetX,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backLabel: {
    fontSize: 17,
    fontWeight: '400',
  },
  pressed: {
    opacity: 0.55,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: ReadingLayout.insetX,
    paddingBottom: ReadingLayout.insetBottom,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 28,
    gap: 8,
  },
  photoLoader: {
    marginTop: 4,
  },
  name: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  sections: {
    gap: 20,
  },
  signOutRow: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 17,
    color: '#FF3B30',
    fontWeight: '400',
  },
});