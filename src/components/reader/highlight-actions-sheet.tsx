import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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

const NOTE_SAVE_DEBOUNCE_MS = 400;

type HighlightActionsSheetProps = {
  highlight: Highlight | null;
  visible: boolean;
  onClose: () => void;
  onRemove: (highlightId: string) => void;
  onUpdate: (
    highlightId: string,
    patch: Partial<Pick<Highlight, 'color' | 'label' | 'note'>>,
  ) => void | Promise<void>;
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
  const [noteSaved, setNoteSaved] = useState(false);
  const noteDraftRef = useRef('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightId = highlight?.id;

  useEffect(() => {
    const next = highlight?.note ?? '';
    setNoteDraft(next);
    noteDraftRef.current = next;
    setNoteSaved(false);
  }, [highlightId, highlight?.note]);

  const persistNote = useCallback(
    async (draft: string) => {
      if (!highlightId) {
        return;
      }

      const trimmed = draft.trim();
      const stored = highlight?.note?.trim() ?? '';
      if (trimmed === stored) {
        return;
      }

      await onUpdate(highlightId, { note: trimmed || undefined });
      setNoteSaved(true);
    },
    [highlight?.note, highlightId, onUpdate],
  );

  const scheduleNoteSave = useCallback(
    (draft: string) => {
      noteDraftRef.current = draft;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        void persistNote(draft);
      }, NOTE_SAVE_DEBOUNCE_MS);
    },
    [persistNote],
  );

  const flushNote = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await persistNote(noteDraftRef.current);
  }, [persistNote]);

  const handleClose = useCallback(() => {
    void flushNote().finally(onClose);
  }, [flushNote, onClose]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  if (!highlight) {
    return null;
  }

  const copyQuote = async () => {
    await flushNote();
    await Clipboard.setStringAsync(highlight.quote);
    onClose();
  };

  const shareHighlight = async () => {
    await flushNote();
    const tags = [highlight.label, highlight.color].filter(Boolean).join(', ');
    const body = highlight.note
      ? `${highlight.quote}\n\nNote: ${highlight.note}\n\n— ${tags}`
      : tags
        ? `${highlight.quote}\n\n— ${tags}`
        : highlight.quote;
    await Share.share({ message: body });
  };

  const remove = () => {
    void flushNote().finally(() => {
      onRemove(highlight.id);
      onClose();
    });
  };

  const setColor = (color: HighlightColorId) => {
    void onUpdate(highlight.id, { color });
  };

  const setLabel = (label: HighlightLabel | undefined) => {
    void onUpdate(highlight.id, { label });
  };

  const handleNoteChange = (text: string) => {
    setNoteDraft(text);
    setNoteSaved(false);
    scheduleNoteSave(text);
  };

  const handleSaveNotePress = () => {
    void flushNote();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} accessibilityRole="button">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}>
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
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={[styles.quote, { color: theme.text }]}>{highlight.quote}</Text>

              {highlight.note ? (
                <Text style={[styles.savedNotePreview, { color: theme.textSecondary }]}>
                  Saved note: {highlight.note}
                </Text>
              ) : null}

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

              <View style={styles.noteHeader}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Note</Text>
                {noteSaved ? (
                  <Text style={[styles.savedBadge, { color: theme.textSecondary }]}>Saved</Text>
                ) : null}
              </View>
              <TextInput
                value={noteDraft}
                onChangeText={handleNoteChange}
                onBlur={() => void flushNote()}
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
              <Pressable
                onPress={handleSaveNotePress}
                accessibilityRole="button"
                style={({ pressed }) => [styles.saveNoteButton, pressed && styles.actionPressed]}>
                <Text style={[styles.saveNoteLabel, { color: theme.text }]}>Save note</Text>
              </Pressable>

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
                  onPress={handleClose}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.actionRow, pressed && styles.actionPressed]}>
                  <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>Close</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
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
  keyboardWrap: {
    justifyContent: 'flex-end',
  },
  sheet: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 18,
    paddingHorizontal: 18,
    gap: 8,
    maxHeight: '85%',
  },
  quote: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  savedNotePreview: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  savedBadge: {
    fontSize: 11,
    fontWeight: '600',
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
    minHeight: 72,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  saveNoteButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  saveNoteLabel: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
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