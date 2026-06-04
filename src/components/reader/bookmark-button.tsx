import { Pressable, StyleSheet, Text } from 'react-native';

type BookmarkButtonProps = {
  bookmarked: boolean;
  borderColor: string;
  textColor: string;
  onPress: () => void;
};

export function BookmarkButton({
  bookmarked,
  borderColor,
  textColor,
  onPress,
}: BookmarkButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={bookmarked ? 'Remove from read later' : 'Save to read later'}
      style={[styles.button, { borderColor }]}>
      <Text style={[styles.icon, { color: textColor }]}>{bookmarked ? '★' : '☆'}</Text>
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
  icon: {
    fontSize: 17,
    lineHeight: 20,
  },
});