import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HIGHLIGHT_LABELS } from '@/constants/reading-palettes';
import { useReadingPreferences } from '@/contexts/reading-preferences-context';
import { READING_REMINDER_PRESETS } from '@/types/daily-reading';
import type { ReadingReminderPreset, ReadingReminderSettings } from '@/types/daily-reading';
import type {
  HighlightColorId,
  ReadingAppearance,
  ReadingContentWidth,
  ReadingFontFamily,
  ReadingFontSize,
  ReadingLineHeight,
  ReadingMargin,
} from '@/types/reading-preferences';

type ReadingSettingsSheetProps = {
  visible: boolean;
  onClose: () => void;
  onExportHighlights?: () => void;
  highlightCount?: number;
  reminderSettings?: ReadingReminderSettings;
  remindersAvailable?: boolean;
  reminderPermissionDenied?: boolean;
  onToggleReminder?: () => void;
  onReminderPresetChange?: (preset: ReadingReminderPreset) => void;
};

type Option<T extends string> = { value: T; label: string };

function OptionRow<T extends string>({
  label,
  options,
  value,
  onChange,
  textColor,
  metaColor,
  borderColor,
  chipBg,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  textColor: string;
  metaColor: string;
  borderColor: string;
  chipBg: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: metaColor }]}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[
                styles.chip,
                { borderColor, backgroundColor: selected ? chipBg : 'transparent' },
              ]}>
              <Text style={[styles.chipText, { color: selected ? textColor : metaColor }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ReadingSettingsSheet({
  visible,
  onClose,
  onExportHighlights,
  highlightCount = 0,
  reminderSettings,
  remindersAvailable = false,
  reminderPermissionDenied = false,
  onToggleReminder,
  onReminderPresetChange,
}: ReadingSettingsSheetProps) {
  const { preferences, setPreference, theme } = useReadingPreferences();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button">
        <Pressable
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom + 16, 28),
              backgroundColor: theme.background,
              borderColor: theme.border,
            },
          ]}
          onPress={(event) => event.stopPropagation()}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Reading settings</Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <Text style={[styles.done, { color: theme.textSecondary }]}>Done</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            <OptionRow<ReadingAppearance>
              label="Theme"
              value={preferences.appearance}
              onChange={(value) => setPreference('appearance', value)}
              textColor={theme.text}
              metaColor={theme.textSecondary}
              borderColor={theme.border}
              chipBg={theme.backgroundElement}
              options={[
                { value: 'system', label: 'System' },
                { value: 'paper', label: 'Paper' },
                { value: 'sepia', label: 'Sepia' },
                { value: 'oled', label: 'OLED' },
              ]}
            />

            <OptionRow<ReadingFontFamily>
              label="Font"
              value={preferences.fontFamily}
              onChange={(value) => setPreference('fontFamily', value)}
              textColor={theme.text}
              metaColor={theme.textSecondary}
              borderColor={theme.border}
              chipBg={theme.backgroundElement}
              options={[
                { value: 'serif', label: 'Serif' },
                { value: 'sans', label: 'Sans' },
              ]}
            />

            <OptionRow<ReadingFontSize>
              label="Size"
              value={preferences.fontSize}
              onChange={(value) => setPreference('fontSize', value)}
              textColor={theme.text}
              metaColor={theme.textSecondary}
              borderColor={theme.border}
              chipBg={theme.backgroundElement}
              options={[
                { value: 'small', label: 'S' },
                { value: 'medium', label: 'M' },
                { value: 'large', label: 'L' },
                { value: 'xlarge', label: 'XL' },
              ]}
            />

            <OptionRow<ReadingLineHeight>
              label="Line height"
              value={preferences.lineHeight}
              onChange={(value) => setPreference('lineHeight', value)}
              textColor={theme.text}
              metaColor={theme.textSecondary}
              borderColor={theme.border}
              chipBg={theme.backgroundElement}
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'normal', label: 'Normal' },
                { value: 'relaxed', label: 'Relaxed' },
              ]}
            />

            <OptionRow<ReadingMargin>
              label="Margins"
              value={preferences.margin}
              onChange={(value) => setPreference('margin', value)}
              textColor={theme.text}
              metaColor={theme.textSecondary}
              borderColor={theme.border}
              chipBg={theme.backgroundElement}
              options={[
                { value: 'narrow', label: 'Narrow' },
                { value: 'normal', label: 'Normal' },
                { value: 'wide', label: 'Wide' },
              ]}
            />

            <OptionRow<ReadingContentWidth>
              label="Reading width"
              value={preferences.contentWidth}
              onChange={(value) => setPreference('contentWidth', value)}
              textColor={theme.text}
              metaColor={theme.textSecondary}
              borderColor={theme.border}
              chipBg={theme.backgroundElement}
              options={[
                { value: 'narrow', label: 'Narrow' },
                { value: 'standard', label: 'Standard' },
                { value: 'wide', label: 'Wide' },
              ]}
            />

            <OptionRow<HighlightColorId>
              label="Default highlight"
              value={preferences.defaultHighlightColor}
              onChange={(value) => setPreference('defaultHighlightColor', value)}
              textColor={theme.text}
              metaColor={theme.textSecondary}
              borderColor={theme.border}
              chipBg={theme.backgroundElement}
              options={[
                { value: 'yellow', label: 'Yellow' },
                { value: 'green', label: 'Green' },
              ]}
            />

            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                Default label
              </Text>
              <View style={styles.chipRow}>
                <Pressable
                  onPress={() => setPreference('defaultHighlightLabel', null)}
                  style={[
                    styles.chip,
                    {
                      borderColor: theme.border,
                      backgroundColor:
                        preferences.defaultHighlightLabel === null
                          ? theme.backgroundElement
                          : 'transparent',
                    },
                  ]}>
                  <Text style={[styles.chipText, { color: theme.textSecondary }]}>None</Text>
                </Pressable>
                {HIGHLIGHT_LABELS.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setPreference('defaultHighlightLabel', item.id)}
                    style={[
                      styles.chip,
                      {
                        borderColor: theme.border,
                        backgroundColor:
                          preferences.defaultHighlightLabel === item.id
                            ? theme.backgroundElement
                            : 'transparent',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color:
                            preferences.defaultHighlightLabel === item.id
                              ? theme.text
                              : theme.textSecondary,
                        },
                      ]}>
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {remindersAvailable && reminderSettings && onToggleReminder ? (
              <View style={[styles.reminderBlock, { borderColor: theme.border }]}>
                <View style={styles.reminderHeader}>
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                    Daily reminder
                  </Text>
                  <Pressable
                    onPress={onToggleReminder}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: reminderSettings.enabled }}
                    style={[
                      styles.reminderToggle,
                      {
                        borderColor: theme.border,
                        backgroundColor: reminderSettings.enabled
                          ? theme.backgroundElement
                          : 'transparent',
                      },
                    ]}>
                    <Text style={[styles.chipText, { color: theme.text }]}>
                      {reminderSettings.enabled ? 'On' : 'Off'}
                    </Text>
                  </Pressable>
                </View>
                <Text style={[styles.reminderMeta, { color: theme.textSecondary }]}>
                  Local notification with today&apos;s pick
                </Text>
                {reminderPermissionDenied ? (
                  <Text style={[styles.reminderWarning, { color: theme.textSecondary }]}>
                    Allow notifications in Settings to use reminders.
                  </Text>
                ) : null}
                {reminderSettings.enabled && onReminderPresetChange ? (
                  <View style={styles.chipRow}>
                    {(Object.keys(READING_REMINDER_PRESETS) as ReadingReminderPreset[]).map(
                      (preset) => {
                        const selected = reminderSettings.preset === preset;
                        return (
                          <Pressable
                            key={preset}
                            onPress={() => onReminderPresetChange(preset)}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            style={[
                              styles.chip,
                              {
                                borderColor: theme.border,
                                backgroundColor: selected
                                  ? theme.backgroundElement
                                  : 'transparent',
                              },
                            ]}>
                            <Text
                              style={[
                                styles.chipText,
                                { color: selected ? theme.text : theme.textSecondary },
                              ]}>
                              {READING_REMINDER_PRESETS[preset].label}
                            </Text>
                          </Pressable>
                        );
                      },
                    )}
                  </View>
                ) : null}
              </View>
            ) : null}

            {onExportHighlights ? (
              <Pressable
                onPress={onExportHighlights}
                disabled={highlightCount === 0}
                style={({ pressed }) => [
                  styles.exportRow,
                  { borderColor: theme.border, opacity: highlightCount === 0 ? 0.45 : 1 },
                  pressed && styles.exportPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Export highlights">
                <Text style={[styles.exportLabel, { color: theme.text }]}>
                  Export highlights ({highlightCount})
                </Text>
                <Text style={[styles.exportMeta, { color: theme.textSecondary }]}>
                  Saves .md file · clipboard · share sheet
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
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
    maxHeight: '88%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  done: {
    fontSize: 15,
    fontWeight: '500',
  },
  scroll: {
    flexGrow: 0,
  },
  section: {
    marginBottom: 18,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  exportRow: {
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  exportPressed: {
    opacity: 0.65,
  },
  exportLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  exportMeta: {
    fontSize: 12,
  },
  reminderBlock: {
    marginTop: 4,
    marginBottom: 12,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  reminderMeta: {
    fontSize: 12,
    lineHeight: 17,
  },
  reminderWarning: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});