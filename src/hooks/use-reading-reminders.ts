import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import {
  cancelDailyReadingReminder,
  ensureReminderPermissions,
  getReadingReminderSettings,
  setReadingReminderEnabled,
  setReadingReminderPreset,
  syncDailyReadingReminder,
} from '@/lib/reading-reminders';
import type { DailyPickItem } from '@/types/daily-reading';
import type { ReadingReminderPreset, ReadingReminderSettings } from '@/types/daily-reading';

export function useReadingReminders(dailyPick: DailyPickItem | null) {
  const [settings, setSettings] = useState<ReadingReminderSettings>({
    enabled: false,
    preset: 'morning',
  });
  const [permissionDenied, setPermissionDenied] = useState(false);

  const refreshSettings = useCallback(async () => {
    const next = await getReadingReminderSettings();
    setSettings(next);
    return next;
  }, []);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    void syncDailyReadingReminder(dailyPick);
  }, [dailyPick, settings.enabled, settings.preset]);

  const applySettings = useCallback(
    async (next: ReadingReminderSettings) => {
      setSettings(next);
      await syncDailyReadingReminder(dailyPick);
    },
    [dailyPick],
  );

  const toggleEnabled = useCallback(async () => {
    if (Platform.OS === 'web') {
      return settings;
    }

    const nextEnabled = !settings.enabled;
    if (nextEnabled) {
      const granted = await ensureReminderPermissions();
      if (!granted) {
        setPermissionDenied(true);
        const next = await setReadingReminderEnabled(false);
        setSettings(next);
        return next;
      }
      setPermissionDenied(false);
    } else {
      await cancelDailyReadingReminder();
    }

    const next = await setReadingReminderEnabled(nextEnabled);
    await applySettings(next);
    return next;
  }, [applySettings, settings.enabled]);

  const changePreset = useCallback(
    async (preset: ReadingReminderPreset) => {
      const next = await setReadingReminderPreset(preset);
      await applySettings(next);
      return next;
    },
    [applySettings],
  );

  return {
    settings,
    permissionDenied,
    refreshSettings,
    toggleEnabled,
    changePreset,
    remindersAvailable: Platform.OS !== 'web',
  };
}