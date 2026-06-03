import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthorAvatarSource } from '@/constants/author-avatars';
import { useTheme } from '@/hooks/use-theme';

type AuthorAvatarProps = {
  authorId?: string;
  name: string;
  size?: number;
};

export function AuthorAvatar({ authorId, name, size = 44 }: AuthorAvatarProps) {
  const theme = useTheme();
  const imageSource = authorId ? getAuthorAvatarSource(authorId) : undefined;
  const radius = size / 2;

  if (imageSource) {
    return (
      <Image
        source={imageSource}
        style={[
          styles.photo,
          {
            width: size,
            height: size,
            borderRadius: radius,
          },
        ]}
        contentFit="cover"
        accessibilityLabel={`${name} portrait`}
      />
    );
  }

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
          borderRadius: radius,
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
  photo: {
    backgroundColor: '#e8e2d9',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});