import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReadingLayout, ReadingTypography } from '@/constants/reading';
import { useTheme } from '@/hooks/use-theme';

type HighlightToolbarProps = {
  selectionPreview: string;
  onHighlight: () => void;
  onCancel: () => void;
};

export function HighlightToolbar({
  selectionPreview,
  onHighlight,
  onCancel,
}: HighlightToolbarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, ReadingLayout.insetBottom / 2),
          backgroundColor: theme.backgroundElement,
          borderTopColor: theme.border,
        },
      ]}>
      <Text style={[styles.preview, { color: theme.textSecondary }]} numberOfLines={2}>
        {selectionPreview}
      </Text>
      <View style={styles.actions}>
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel selection"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={[styles.cancel, { color: theme.textSecondary }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={onHighlight}
          accessibilityRole="button"
          accessibilityLabel="Save highlight"
          style={({ pressed }) => [
            styles.button,
            styles.highlightButton,
            { backgroundColor: theme.text },
            pressed && styles.buttonPressed,
          ]}>
          <Text style={[styles.highlightLabel, { color: theme.background }]}>Highlight</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: ReadingLayout.insetX,
    paddingTop: 14,
    gap: 12,
  },
  preview: {
    fontFamily: ReadingTypography.serif,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  highlightButton: {
    minWidth: 108,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.72,
  },
  cancel: {
    fontSize: 15,
    fontWeight: '500',
  },
  highlightLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});