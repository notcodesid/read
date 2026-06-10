import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ProfileAvatar } from '@/components/profile-avatar';
import { useAuth } from '@/contexts/auth-context';
import { profileDisplayName } from '@/lib/profile-display';

export function AccountProfileButton() {
  const router = useRouter();
  const { session } = useAuth();

  if (!session) {
    return null;
  }

  const displayName = profileDisplayName(session) ?? 'Account';

  return (
    <Pressable
      onPress={() => router.push('/profile')}
      accessibilityRole="button"
      accessibilityLabel={`Account, ${displayName}`}
      hitSlop={6}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <ProfileAvatar
        fullName={session.fullName}
        photoUri={session.photoUri}
        photoUpdatedAt={session.photoUpdatedAt}
        size="header"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});