import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthorAvatarSource } from '@/constants/author-avatars';
import { ReadingCover } from '@/constants/reading';
import { useTheme } from '@/hooks/use-theme';

type AuthorAvatarProps = {
  authorId?: string;
  name: string;
  /** Cover width; height follows 3:4 aspect ratio. */
  width?: number;
};

/** Vertical 3:4 cover (Kindle-style), not square or circle. */
export function AuthorAvatar({
  authorId,
  name,
  width = ReadingCover.tileWidth,
}: AuthorAvatarProps) {
  const theme = useTheme();
  const imageSource = authorId ? getAuthorAvatarSource(authorId) : undefined;
  const height = Math.round(width * (4 / 3));
  const radius = ReadingCover.radius;

  const frameStyle = {
    width,
    height,
    borderRadius: radius,
    borderColor: theme.border,
    backgroundColor: theme.backgroundElement,
  };

  if (imageSource) {
    return (
      <View style={[styles.frame, frameStyle]}>
        <Image
          source={imageSource}
          style={[styles.photo, { borderRadius: Math.max(radius - 1, 0) }]}
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
      <Text style={[styles.initials, { color: theme.textSecondary, fontSize: width * 0.22 }]}>
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