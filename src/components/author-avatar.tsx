import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type AuthorAvatarProps = {
  name: string;
  size?: number;
};

export function AuthorAvatar({ name, size = 44 }: AuthorAvatarProps) {
  const theme = useTheme();
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.backgroundSelected,
        },
      ]}>
      <Text style={[styles.initials, { color: theme.text, fontSize: size * 0.34 }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});