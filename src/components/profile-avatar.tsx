import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { avatarColorForUser } from '@/lib/profile-avatar-color';
import { profileInitials } from '@/lib/profile-display';
import { useTheme } from '@/hooks/use-theme';

type ProfileAvatarSize = 'header' | 'profile';

const SIZES: Record<ProfileAvatarSize, { diameter: number; fontSize: number; symbolSize: number }> =
  {
    header: { diameter: 36, fontSize: 13, symbolSize: 22 },
    profile: { diameter: 88, fontSize: 32, symbolSize: 52 },
  };

type ProfileAvatarProps = {
  fullName?: string;
  photoUri?: string;
  photoUpdatedAt?: number;
  size?: ProfileAvatarSize;
  onPress?: () => void;
};

function photoSource(photoUri: string, photoUpdatedAt?: number) {
  const base = photoUri.split('?')[0];
  return photoUpdatedAt ? `${base}?v=${photoUpdatedAt}` : base;
}

export function ProfileAvatar({
  fullName,
  photoUri,
  photoUpdatedAt,
  size = 'header',
  onPress,
}: ProfileAvatarProps) {
  const theme = useTheme();
  const { diameter, fontSize, symbolSize } = SIZES[size];
  const initials = profileInitials(fullName);

  const frameStyle = {
    width: diameter,
    height: diameter,
    borderRadius: diameter / 2,
  };

  let content: ReactNode;

  if (photoUri) {
    content = (
      <Image
        source={{ uri: photoSource(photoUri, photoUpdatedAt) }}
        style={[styles.photo, frameStyle]}
        contentFit="cover"
        cachePolicy="none"
        accessibilityLabel="Profile photo"
      />
    );
  } else if (initials) {
    const colors = avatarColorForUser(fullName!.trim());
    content = (
      <View
        style={[
          styles.avatar,
          frameStyle,
          {
            backgroundColor: colors.background,
          },
        ]}>
        <Text
          style={[
            styles.initials,
            {
              color: colors.text,
              fontSize,
              fontFamily: Platform.select({ ios: 'System', default: undefined }),
            },
          ]}>
          {initials}
        </Text>
      </View>
    );
  } else {
    content = (
      <View
        style={[
          styles.avatar,
          frameStyle,
          {
            backgroundColor: theme.backgroundElement,
          },
        ]}>
        <SymbolView
          name={{
            ios: 'person.crop.circle.fill',
            android: 'person',
            web: 'person',
          }}
          size={symbolSize}
          tintColor={theme.textSecondary}
        />
      </View>
    );
  }

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Change profile photo"
      style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
      {size === 'profile' ? (
        <View
          style={[
            styles.editBadge,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}>
          <SymbolView
            name={{ ios: 'camera.fill', android: 'camera', web: 'camera' }}
            size={14}
            tintColor={theme.text}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    overflow: 'hidden',
  },
  initials: {
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});