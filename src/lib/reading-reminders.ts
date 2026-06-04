import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import {
  loadReadingReminderSettings,
  saveReadingReminderSettings,
} from '@/lib/reading-reminders-storage';
import type { DailyPickItem } from '@/types/daily-reading';
import {
  READING_REMINDER_PRESETS,
  type ReadingReminderPreset,
  type ReadingReminderSettings,
} from '@/types/daily-reading';

export const DAILY_REMINDER_NOTIFICATION_ID = 'daily-reading-reminder';
const ANDROID_CHANNEL_ID = 'reading-reminders';

export async function getReadingReminderSettings(): Promise<ReadingReminderSettings> {
  return loadReadingReminderSettings();
}

export async function setReadingReminderEnabled(enabled: boolean): Promise<ReadingReminderSettings> {
  const current = await loadReadingReminderSettings();
  const next = { ...current, enabled };
  await saveReadingReminderSettings(next);
  return next;
}

export async function setReadingReminderPreset(
  preset: ReadingReminderPreset,
): Promise<ReadingReminderSettings> {
  const current = await loadReadingReminderSettings();
  const next = { ...current, preset };
  await saveReadingReminderSettings(next);
  return next;
}

export async function ensureReminderPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Reading reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function cancelDailyReadingReminder(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_NOTIFICATION_ID);
}

export async function syncDailyReadingReminder(
  dailyPick: DailyPickItem | null,
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const settings = await loadReadingReminderSettings();
  await cancelDailyReadingReminder();

  if (!settings.enabled || !dailyPick) {
    return;
  }

  const granted = await ensureReminderPermissions();
  if (!granted) {
    return;
  }

  await ensureAndroidChannel();

  const { hour, minute } = READING_REMINDER_PRESETS[settings.preset];
  const subtitle = dailyPick.category ?? dailyPick.authorName;

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_NOTIFICATION_ID,
    content: {
      title: "Today's pick is ready",
      body: `${dailyPick.title} · ${subtitle}`,
      data: {
        url: `/read/${dailyPick.articleId}`,
        articleId: dailyPick.articleId,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}