import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/app-logo';
import { AuthorGroupCarousel } from '@/components/home/author-group-carousel';
import { ReadingLayout } from '@/constants/reading';
import { useAuthorShelf } from '@/hooks/use-author-shelf';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { sections, unassignedAuthors, refreshing, error, refresh } = useAuthorShelf();

  const hasAuthors =
    sections.some((section) => section.authors.length > 0) || unassignedAuthors.length > 0;
  const showLoadingScreen = refreshing && !hasAuthors;
  const showErrorScreen = Boolean(error) && !hasAuthors && !refreshing;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <AppLogo size={56} />
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
          showsVerticalScrollIndicator={false}>
          {error ? (
            <Pressable onPress={refresh} accessibilityRole="button" style={styles.headerStatus}>
              <Text style={[styles.retry, { color: theme.textSecondary }]}>Try again</Text>
            </Pressable>
          ) : null}

          <View style={styles.shelves}>
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
    alignItems: 'center',
    paddingHorizontal: ReadingLayout.insetX,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 20,
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