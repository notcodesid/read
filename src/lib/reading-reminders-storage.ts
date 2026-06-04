import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ReadingReminderPreset, ReadingReminderSettings } from '@/types/daily-reading';

const STORAGE_KEY = '@read/reading-reminders/v1';

const DEFAULT_SETTINGS: ReadingReminderSettings = {
  enabled: false,
  preset: 'morning',
};

export async function loadReadingReminderSettings(): Promise<ReadingReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }

    const parsed = JSON.parse(raw) as Partial<ReadingReminderSettings>;
    const preset = parsed.preset;
    const validPreset =
      preset === 'morning' || preset === 'lunch' || preset === 'evening' || preset === 'night'
        ? preset
        : DEFAULT_SETTINGS.preset;

    return {
      enabled: Boolean(parsed.enabled),
      preset: validPreset,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveReadingReminderSettings(
  settings: ReadingReminderSettings,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}