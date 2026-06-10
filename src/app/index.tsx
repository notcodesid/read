import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountProfileButton } from '@/components/account-profile-button';
import { AppLogo } from '@/components/app-logo';
import { AuthorGroupCarousel } from '@/components/home/author-group-carousel';
import { DailyPickCard } from '@/components/home/daily-pick-card';
import { HomePersonalSection } from '@/components/home/home-personal-section';
import { ReadingSettingsSheet } from '@/components/reader/reading-settings-sheet';
import { ReadingLayout } from '@/constants/reading';
import { useAuthorShelf } from '@/hooks/use-author-shelf';
import { useHomePersonal } from '@/hooks/use-home-personal';
import { useReadingReminders } from '@/hooks/use-reading-reminders';
import { toggleArticleBookmark } from '@/lib/bookmarks';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { sections, unassignedAuthors, refreshing, error, refresh } = useAuthorShelf();
  const { continueReading, readLater, forYou, dailyPick, refresh: refreshPersonal } =
    useHomePersonal();
  const {
    settings: reminderSettings,
    permissionDenied,
    toggleEnabled: toggleReminder,
    changePreset: changeReminderPreset,
    remindersAvailable,
  } = useReadingReminders(dailyPick);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const hasAuthors =
    sections.some((section) => section.authors.length > 0) || unassignedAuthors.length > 0;
  const showLoadingScreen = refreshing && !hasAuthors;
  const showErrorScreen = Boolean(error) && !hasAuthors && !refreshing;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable
          onLongPress={() => setSettingsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Home. Long press for reading settings"
          hitSlop={6}
          style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}>
          <AppLogo size={ReadingLayout.headerIconSize} />
        </Pressable>
        <AccountProfileButton />
      </View>

      {showLoadingScreen ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator color={theme.textSecondary} />
        </View>
      ) : showErrorScreen ? (
        <View style={styles.loaderCenter}>
          <Pressable onPress={refresh} accessibilityRole="button">
            <Text style={[styles.retry, { color: theme.textSecondary }]}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}>
          {error ? (
            <Pressable onPress={refresh} accessibilityRole="button" style={styles.headerStatus}>
              <Text style={[styles.retry, { color: theme.textSecondary }]}>Try again</Text>
            </Pressable>
          ) : null}

          <View style={styles.shelves}>
            {dailyPick ? (
              <DailyPickCard
                pick={dailyPick}
                textColor={theme.text}
                metaColor={theme.textSecondary}
                borderColor={theme.border}
                surfaceColor={theme.backgroundElement}
                onPress={(articleId) => router.push(`/read/${articleId}`)}
              />
            ) : null}

            <HomePersonalSection
              dailyPickArticleId={dailyPick?.articleId}
              continueReading={continueReading}
              readLater={readLater}
              forYou={forYou}
              textColor={theme.text}
              metaColor={theme.textSecondary}
              borderColor={theme.border}
              surfaceColor={theme.backgroundElement}
              onArticlePress={(articleId) => router.push(`/read/${articleId}`)}
              onRemoveFromReadLater={(articleId) => {
                void toggleArticleBookmark(articleId).then(() => refreshPersonal());
              }}
            />

            {sections.map((section) => (
              <AuthorGroupCarousel
                key={section.group.id}
                group={section.group}
                authors={section.authors}
                textColor={theme.text}
                metaColor={theme.textSecondary}
                onAuthorPress={(authorId) => router.push(`/author/${authorId}`)}
              />
            ))}

            {unassignedAuthors.length > 0 ? (
              <AuthorGroupCarousel
                group={{
                  id: 'unassigned',
                  name: 'Unsorted',
                  sortOrder: 99,
                }}
                authors={unassignedAuthors}
                textColor={theme.text}
                metaColor={theme.textSecondary}
                onAuthorPress={(authorId) => router.push(`/author/${authorId}`)}
              />
            ) : null}
          </View>
        </ScrollView>
      )}

      <ReadingSettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        reminderSettings={reminderSettings}
        remindersAvailable={remindersAvailable}
        reminderPermissionDenied={permissionDenied}
        onToggleReminder={() => void toggleReminder()}
        onReminderPresetChange={(preset) => void changeReminderPreset(preset)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: ReadingLayout.insetBottom,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ReadingLayout.insetX,
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerIcon: {
    width: ReadingLayout.headerIconSize,
    height: ReadingLayout.headerIconSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStatus: {
    alignItems: 'center',
    minHeight: 20,
  },
  retry: {
    fontSize: 14,
    fontWeight: '500',
  },
  shelves: {
    paddingTop: 4,
  },
});