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
import { ReadingLayout, ReadingTypography } from '@/constants/reading';
import { useAuthorShelf } from '@/hooks/use-author-shelf';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { sections, unassignedAuthors, refreshing, error, refresh } = useAuthorShelf();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppLogo size={56} />
          <View style={styles.headerRow}>
            <Text style={[styles.heading, { color: theme.text }]}>Authors</Text>
            {error ? (
              <Pressable onPress={refresh} accessibilityRole="button">
                <Text style={[styles.retry, { color: theme.textSecondary }]}>Try again</Text>
              </Pressable>
            ) : refreshing ? (
              <ActivityIndicator color={theme.textSecondary} />
            ) : null}
          </View>
        </View>

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
  headerRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontFamily: ReadingTypography.serif,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  retry: {
    fontSize: 14,
    fontWeight: '500',
  },
  shelves: {
    paddingTop: 4,
  },
});