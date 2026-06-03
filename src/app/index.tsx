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
import { BlogTopicRow } from '@/components/home/blog-topic-row';
import {
  GLASS_BROWSE_DOCK_SCROLL_PADDING,
  GlassBrowseDock,
} from '@/components/home/glass-browse-dock';
import { ReadingLayout, ReadingTypography } from '@/constants/reading';
import { useHomeBrowse } from '@/hooks/use-home-browse';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const {
    mode,
    setMode,
    authorSections,
    blogSections,
    ungroupedAuthors,
    refreshing,
    error,
    refresh,
  } = useHomeBrowse();

  const heading = mode === 'authors' ? 'By author' : 'By topic';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: GLASS_BROWSE_DOCK_SCROLL_PADDING },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppLogo size={56} />
          <View style={styles.headerRow}>
            <Text style={[styles.heading, { color: theme.text }]}>{heading}</Text>
            {error ? (
              <Pressable onPress={refresh} accessibilityRole="button">
                <Text style={[styles.retry, { color: theme.textSecondary }]}>Try again</Text>
              </Pressable>
            ) : refreshing ? (
              <ActivityIndicator color={theme.textSecondary} />
            ) : null}
          </View>
        </View>

        {mode === 'authors' ? (
          <View>
            {authorSections.map((section) => (
              <AuthorGroupCarousel
                key={section.group.id}
                group={section.group}
                authors={section.authors}
                textColor={theme.text}
                metaColor={theme.textSecondary}
                onAuthorPress={(authorId) => router.push(`/author/${authorId}`)}
              />
            ))}
            {ungroupedAuthors.length > 0 ? (
              <AuthorGroupCarousel
                group={{
                  id: 'other',
                  name: 'More voices',
                  description: 'Writers not yet assigned to a shelf',
                  sortOrder: 99,
                }}
                authors={ungroupedAuthors}
                textColor={theme.text}
                metaColor={theme.textSecondary}
                onAuthorPress={(authorId) => router.push(`/author/${authorId}`)}
              />
            ) : null}
            {authorSections.length === 0 && !refreshing ? (
              <Text style={[styles.empty, { color: theme.textSecondary }]}>
                No authors yet. Add writers in Supabase and assign an author group.
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.blogList}>
            {blogSections.map((section) => (
              <BlogTopicRow
                key={section.topic.id}
                topic={section.topic}
                previewTitles={section.previewTitles}
                textColor={theme.text}
                metaColor={theme.textSecondary}
                borderColor={theme.border}
                onPress={() => router.push(`/topic/${section.topic.id}`)}
              />
            ))}
            {blogSections.length === 0 && !refreshing ? (
              <Text style={[styles.empty, { color: theme.textSecondary }]}>
                No topics with articles yet.
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      <GlassBrowseDock
        mode={mode}
        onChange={setMode}
        textColor={theme.text}
        metaColor={theme.textSecondary}
        surfaceColor={theme.backgroundSelected}
        borderColor={theme.border}
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
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: ReadingLayout.insetX,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 12,
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
  blogList: {
    paddingHorizontal: ReadingLayout.insetX,
  },
  empty: {
    ...ReadingTypography.meta,
    textAlign: 'center',
    paddingVertical: 32,
    paddingHorizontal: ReadingLayout.insetX,
  },
});