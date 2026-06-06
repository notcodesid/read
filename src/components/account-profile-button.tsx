import { Pressable, StyleSheet, Text } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

type AccountProfileButtonProps = {
  onPress: () => void;
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

export function AccountProfileButton({ onPress }: AccountProfileButtonProps) {
  const theme = useTheme();
  const { session } = useAuth();

  if (!session) {
    return null;
  }

  const displayName = session.fullName ?? session.email ?? 'Account';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Profile, signed in as ${displayName}`}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: theme.border,
          backgroundColor: theme.backgroundElement,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Text style={[styles.initials, { color: theme.text }]}>
        {initialsFromSession(session.fullName, session.email)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});