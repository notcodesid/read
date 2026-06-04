export type DailyPickItem = {
  articleId: string;
  title: string;
  authorId: string;
  authorName: string;
  category?: string;
  dateKey: string;
};

export type ReadingReminderPreset = 'morning' | 'lunch' | 'evening' | 'night';

export type ReadingReminderSettings = {
  enabled: boolean;
  preset: ReadingReminderPreset;
};

export const READING_REMINDER_PRESETS: Record<
  ReadingReminderPreset,
  { hour: number; minute: number; label: string }
> = {
  morning: { hour: 8, minute: 0, label: '8:00 AM' },
  lunch: { hour: 12, minute: 0, label: '12:00 PM' },
  evening: { hour: 19, minute: 0, label: '7:00 PM' },
  night: { hour: 21, minute: 0, label: '9:00 PM' },
};