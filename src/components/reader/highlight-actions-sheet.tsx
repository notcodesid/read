import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HIGHLIGHT_LABELS } from '@/constants/reading-palettes';
import { useReadingPreferences } from '@/contexts/reading-preferences-context';
import type { HighlightColorId, HighlightLabel } from '@/types/reading-preferences';
import type { Highlight } from '@/types/highlight';

type HighlightActionsSheetProps = {
  highlight: Highlight | null;
  visible: boolean;
  onClose: () => void;
  onRemove: (highlightId: string) => void;
  onUpdate: (highlightId: string, patch: Partial<Pick<Highlight, 'color' | 'label' | 'note'>>) => void;
};

export function HighlightActionsSheet({
  highlight,
  visible,
  onClose,
  onRemove,
  onUpdate,
}: HighlightActionsSheetProps) {
  const { theme, getHighlightStyle } = useReadingPreferences();
  const insets = useSafeAreaInsets();
  const [noteDraft, setNoteDraft] = useState('');

  useEffect(() => {
    setNoteDraft(highlight?.note ?? '');
  }, [highlight?.id, highlight?.note]);

  if (!highlight) {
    return null;
  }

  const copyQuote = async () => {
    await Clipboard.setStringAsync(highlight.quote);
    onClose();
  };

  const shareHighlight = async () => {
    const tags = [highlight.label, highlight.color].filter(Boolean).join(', ');
    const body = tags ? `${highlight.quote}\n\n— ${tags}` : highlight.quote;
    await Share.share({ message: body });
  };

  const remove = () => {
    onRemove(highlight.id);
    onClose();
  };

  const setColor = (color: HighlightColorId) => {
    onUpdate(highlight.id, { color });
  };

  const setLabel = (label: HighlightLabel | undefined) => {
    onUpdate(highlight.id, { label });
  };

  const saveNote = () => {
    onUpdate(highlight.id, { note: noteDraft.trim() || undefined });
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

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Color</Text>
          <View style={styles.chipRow}>
            {(['yellow', 'green'] as const).map((colorId) => {
              const swatch = getHighlightStyle(colorId);
              const selected = highlight.color === colorId;
              return (
                <Pressable
                  key={colorId}
                  onPress={() => setColor(colorId)}
                  style={[
                    styles.colorChip,
                    {
                      borderColor: theme.border,
                      backgroundColor: swatch.fill,
                      opacity: selected ? 1 : 0.55,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}>
                  <Text style={[styles.chipText, { color: theme.text }]}>
                    {colorId === 'yellow' ? 'Yellow' : 'Green'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Label</Text>
          <View style={styles.chipRow}>
            <Pressable
              onPress={() => setLabel(undefined)}
              style={[styles.chip, { borderColor: theme.border }]}>
              <Text style={[styles.chipText, { color: theme.textSecondary }]}>None</Text>
            </Pressable>
            {HIGHLIGHT_LABELS.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setLabel(item.id)}
                style={[
                  styles.chip,
                  {
                    borderColor: theme.border,
                    backgroundColor:
                      highlight.label === item.id ? theme.backgroundSelected : 'transparent',
                  },
                ]}>
                <Text style={[styles.chipText, { color: theme.text }]}>{item.name}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Note</Text>
          <TextInput
            value={noteDraft}
            onChangeText={setNoteDraft}
            onBlur={saveNote}
            placeholder="Add a short note…"
            placeholderTextColor={theme.textSecondary}
            multiline
            style={[
              styles.noteInput,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.background,
              },
            ]}
          />

          <View style={styles.actions}>
            <Pressable
              onPress={copyQuote}
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}>
              <Text style={[styles.actionLabel, { color: theme.text }]}>Copy</Text>
            </Pressable>
            <Pressable
              onPress={shareHighlight}
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}>
              <Text style={[styles.actionLabel, { color: theme.text }]}>Share</Text>
            </Pressable>
            <Pressable
              onPress={remove}
              accessibilityRole="button"
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}>
              <Text style={[styles.actionLabel, styles.destructive]}>Remove highlight</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
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
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 18,
    paddingHorizontal: 18,
    gap: 8,
    maxHeight: '80%',
  },
  quote: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  colorChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  noteInput: {
    minHeight: 64,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  actions: {
    gap: 2,
    marginTop: 4,
  },
  actionRow: {
    paddingVertical: 12,
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