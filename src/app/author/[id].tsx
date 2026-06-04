import * as WebBrowser from 'expo-web-browser';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthorAvatar } from '@/components/author-avatar';
import { ReadingCover, ReadingLayout, ReadingTypography } from '@/constants/reading';
import { useAuthorArticles } from '@/hooks/use-articles';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import { useTheme } from '@/hooks/use-theme';
import type { ArticleSummary } from '@/types/article';

export default function AuthorScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const authorId = typeof id === 'string' ? id : undefined;
  const { author, sections, refreshing, error, refresh } = useAuthorArticles(authorId);
  const { refresh: refreshProgress, isArticleCompleted, getThemeProgress } = useReadingProgress();

  useFocusEffect(
    useCallback(() => {
      void refreshProgress();
    }, [refreshProgress]),
  );

  const listSections = sections.map((section) => ({
    title: section.category,
    data: section.articles,
  }));

  if (!authorId) {
    return null;
  }

  const listHeader = (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back to authors">
        <Text style={[styles.back, { color: theme.textSecondary }]}>← Authors</Text>
      </Pressable>
      <View style={styles.authorRow}>
        <AuthorAvatar
          authorId={authorId}
          name={author?.name ?? authorId}
          width={ReadingCover.headerWidth}
        />
        <View style={styles.authorMeta}>
          <Text style={[styles.authorName, { color: theme.text }]}>
            {author?.name ?? authorId}
          </Text>
          {author?.tagline ? (
            <Text style={[styles.authorTagline, { color: theme.textSecondary }]}>
              {author.tagline}
            </Text>
          ) : null}
          {author ? (
            <Text style={[styles.authorCount, { color: theme.textSecondary }]}>
              {author.articleCount === 1
                ? '1 piece'
                : `${author.articleCount} pieces`}
            </Text>
          ) : null}
        </View>
      </View>
      {author?.siteUrl ? (
        <Pressable
          onPress={() => WebBrowser.openBrowserAsync(author.siteUrl!)}
          accessibilityRole="link"
          accessibilityLabel="Visit author website">
          <Text style={[styles.siteLink, { color: theme.textSecondary }]}>Visit website</Text>
        </Pressable>
      ) : null}
      {error ? (
        <View style={styles.status}>
          <Text style={[styles.statusText, { color: theme.textSecondary }]}>
            Could not refresh
          </Text>
          <Pressable onPress={refresh}>
            <Text style={[styles.retry, { color: theme.text }]}>Try again</Text>
          </Pressable>
        </View>
      ) : refreshing ? (
        <Text style={[styles.statusText, { color: theme.textSecondary }]}>Updating…</Text>
      ) : null}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ animation: 'fade', gestureEnabled: true }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <SectionList
          sections={listSections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          renderSectionHeader={({ section }) => {
            const articleIds = section.data.map((item) => item.id);
            const progress =
              authorId && section.title
                ? getThemeProgress(authorId, section.title, articleIds)
                : null;

            return (
              <View style={styles.sectionHeader}>
                <Text style={[styles.categoryLabel, { color: theme.textSecondary }]}>
                  {section.title}
                </Text>
                {progress ? (
                  <Text
                    style={[
                      styles.sectionProgress,
                      {
                        color: progress.isComplete ? theme.text : theme.textSecondary,
                      },
                    ]}>
                    {progress.isComplete
                      ? 'Complete'
                      : `${progress.completed}/${progress.total}`}
                  </Text>
                ) : (
                  <Text style={[styles.sectionProgress, { color: theme.textSecondary }]}>
                    {section.data.length}
                  </Text>
                )}
              </View>
            );
          }}
          renderItem={({ item }) => (
            <ArticleRow
              article={item}
              borderColor={theme.border}
              textColor={theme.text}
              metaColor={theme.textSecondary}
              completed={isArticleCompleted(item.id)}
              onPress={() => router.push(`/read/${item.id}`)}
            />
          )}
          SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
        />
      </SafeAreaView>
    </>
  );
}

function ArticleRow({
  article,
  borderColor,
  textColor,
  metaColor,
  completed,
  onPress,
}: {
  article: ArticleSummary;
  borderColor: string;
  textColor: string;
  metaColor: string;
  completed: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={article.title}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: borderColor },
        pressed && styles.rowPressed,
      ]}>
      <Text
        style={[styles.title, { color: completed ? metaColor : textColor }]}
        numberOfLines={2}>
        {article.title}
      </Text>
      {completed ? (
        <Text style={[styles.readMark, { color: metaColor }]} accessibilityLabel="Read">
          ✓
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  list: {
    flex: 1,
    maxWidth: ReadingLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  listContent: {
    paddingHorizontal: ReadingLayout.insetX,
    paddingBottom: ReadingLayout.insetBottom,
  },
  header: {
    paddingTop: ReadingLayout.insetTop,
    marginBottom: 20,
    gap: 14,
  },
  back: {
    fontSize: 14,
    fontWeight: '500',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  authorMeta: {
    flex: 1,
    gap: 4,
  },
  authorName: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  authorTagline: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  authorCount: {
    ...ReadingTypography.meta,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.25,
    marginTop: 4,
  },
  siteLink: {
    ...ReadingTypography.meta,
    textDecorationLine: 'underline',
  },
  status: {
    gap: 8,
  },
  statusText: {
    ...ReadingTypography.meta,
  },
  retry: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
    gap: 12,
  },
  categoryLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sectionProgress: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.25,
    textTransform: 'uppercase',
  },
  sectionGap: {
    height: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  readMark: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowPressed: {
    opacity: 0.6,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
});