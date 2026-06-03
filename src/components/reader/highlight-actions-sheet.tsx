import * as Clipboard from 'expo-clipboard';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReadingLayout, ReadingTypography } from '@/constants/reading';
import { useTheme } from '@/hooks/use-theme';
import type { Highlight } from '@/types/highlight';

type HighlightActionsSheetProps = {
  highlight: Highlight | null;
  visible: boolean;
  onClose: () => void;
  onRemove: (highlightId: string) => void;
};

export function HighlightActionsSheet({
  highlight,
  visible,
  onClose,
  onRemove,
}: HighlightActionsSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!highlight) {
    return null;
  }

  const copyQuote = async () => {
    await Clipboard.setStringAsync(highlight.quote);
    onClose();
  };

  const remove = () => {
    onRemove(highlight.id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button">
        <Pressable
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom + 12, 24),
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
          onPress={(event) => event.stopPropagation()}>
          <Text style={[styles.quote, { color: theme.text }]} numberOfLines={4}>
            {highlight.quote}
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={copyQuote}
              accessibilityRole="button"
              accessibilityLabel="Copy highlight"
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}>
              <Text style={[styles.actionLabel, { color: theme.text }]}>Copy</Text>
            </Pressable>
            <Pressable
              onPress={remove}
              accessibilityRole="button"
              accessibilityLabel="Remove highlight"
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}>
              <Text style={[styles.actionLabel, styles.destructive]}>Remove highlight</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}>
              <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>Close</Text>
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
    marginHorizontal: ReadingLayout.insetX,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 18,
    paddingHorizontal: 18,
    gap: 8,
  },
  quote: {
    fontFamily: ReadingTypography.serif,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  actions: {
    gap: 2,
  },
  actionRow: {
    paddingVertical: 14,
  },
  actionPressed: {
    opacity: 0.65,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  destructive: {
    color: '#c45c4a',
  },
});