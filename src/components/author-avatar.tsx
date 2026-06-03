import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthorAvatarSource } from '@/constants/author-avatars';
import { ReadingCover } from '@/constants/reading';
import { useTheme } from '@/hooks/use-theme';

type AuthorAvatarProps = {
  authorId?: string;
  name: string;
  size?: number;
};

/** Kindle-style square cover thumbnail (not a circle). */
export function AuthorAvatar({ authorId, name, size = ReadingCover.homeSize }: AuthorAvatarProps) {
  const theme = useTheme();
  const imageSource = authorId ? getAuthorAvatarSource(authorId) : undefined;
  const radius = ReadingCover.radius;

  const frameStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    borderColor: theme.border,
    backgroundColor: theme.backgroundElement,
  };

  if (imageSource) {
    return (
      <View style={[styles.frame, frameStyle]}>
        <Image
          source={imageSource}
          style={[styles.photo, { borderRadius: radius - 1 }]}
          contentFit="cover"
          accessibilityLabel={`${name} cover`}
        />
      </View>
    );
  }

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View style={[styles.frame, styles.placeholder, frameStyle]}>
      <Text style={[styles.initials, { color: theme.textSecondary, fontSize: size * 0.3 }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
    letterSpacing: 1,
  },
});