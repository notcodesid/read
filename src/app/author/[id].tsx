import * as WebBrowser from 'expo-web-browser';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthorAvatar } from '@/components/author-avatar';
import { ReadingCover, ReadingLayout, ReadingTypography } from '@/constants/reading';
import { useAuthorArticles } from '@/hooks/use-articles';
import { useTheme } from '@/hooks/use-theme';
import type { ArticleSummary } from '@/types/article';

export default function AuthorScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const authorId = typeof id === 'string' ? id : undefined;
  const { author, sections, refreshing, error, refresh } = useAuthorArticles(authorId);

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
          size={ReadingCover.detailSize}
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
          renderSectionHeader={({ section }) => (
            <Text style={[styles.categoryLabel, { color: theme.textSecondary }]}>
              {section.title} · {section.data.length}
            </Text>
          )}
          renderItem={({ item }) => (
            <ArticleRow
              article={item}
              borderColor={theme.border}
              textColor={theme.text}
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
  onPress,
}: {
  article: ArticleSummary;
  borderColor: string;
  textColor: string;
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
      <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
        {article.title}
      </Text>
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
    fontSize: 14,
    lineHeight: 20,
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
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  sectionGap: {
    height: 20,
  },
  row: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowPressed: {
    opacity: 0.6,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
});