import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/auth-context';
import { useReadingPreferences } from '@/contexts/reading-preferences-context';

type AccountProfileSheetProps = {
  visible: boolean;
  onClose: () => void;
};

function initialsFromSession(fullName?: string, email?: string): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length > 0) {
      return parts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
    }
  }
  if (email) {
    return email[0]?.toUpperCase() ?? 'A';
  }
  return 'A';
}

export function AccountProfileSheet({ visible, onClose }: AccountProfileSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, reloadFromStorage } = useReadingPreferences();
  const { session, busy, signOut } = useAuth();

  if (!session) {
    return null;
  }

  const displayName = session.fullName ?? session.email ?? 'Signed in with Apple';

  const handleSignOut = () => {
    void signOut().then(() => {
      reloadFromStorage();
      onClose();
      router.replace('/onboarding');
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button">
        <Pressable
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom + 16, 28),
              backgroundColor: theme.background,
              borderColor: theme.border,
            },
          ]}
          onPress={(event) => event.stopPropagation()}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Profile</Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <Text style={[styles.done, { color: theme.textSecondary }]}>Done</Text>
            </Pressable>
          </View>

          <View style={styles.content}>
            <View
              style={[
                styles.avatar,
                { borderColor: theme.border, backgroundColor: theme.backgroundElement },
              ]}>
              <Text style={[styles.avatarText, { color: theme.text }]}>
                {initialsFromSession(session.fullName, session.email)}
              </Text>
            </View>
            <Text style={[styles.name, { color: theme.text }]}>{displayName}</Text>
            {session.email ? (
              <Text style={[styles.email, { color: theme.textSecondary }]}>{session.email}</Text>
            ) : null}
            <Pressable
              onPress={handleSignOut}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              style={({ pressed }) => [
                styles.signOutButton,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.backgroundElement,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              {busy ? (
                <ActivityIndicator color={theme.text} />
              ) : (
                <Text style={[styles.signOutText, { color: theme.text }]}>Sign out</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  done: {
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    alignItems: 'center',
    gap: 10,
    paddingBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    textAlign: 'center',
  },
  signOutButton: {
    marginTop: 8,
    minWidth: 160,
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
  },
});