import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReadingLayout, ReadingTypography } from '@/constants/reading';
import { fetchArticleSummaries } from '@/lib/articles';
import {
  getBundledArticlesForTopic,
  getBundledBlogTopic,
  fetchBlogTopics,
} from '@/lib/taxonomy';
import { useTheme } from '@/hooks/use-theme';
import type { ArticleSummary } from '@/types/article';

export default function TopicScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topicId = typeof id === 'string' ? id : undefined;

  const [topicName, setTopicName] = useState(() => getBundledBlogTopic(topicId ?? '')?.name ?? '');
  const [articles, setArticles] = useState<ArticleSummary[]>(() =>
    topicId ? getBundledArticlesForTopic(topicId) : [],
  );
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!topicId) {
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    setError(null);

    const bundled = getBundledArticlesForTopic(topicId);
    setArticles(bundled);

    const bundledTopic = getBundledBlogTopic(topicId);
    if (bundledTopic) {
      setTopicName(bundledTopic.name);
    }

    try {
      const topics = await fetchBlogTopics();
      const topic = topics.find((item) => item.id === topicId);
      if (topic) {
        setTopicName(topic.name);
      }

      const all = await fetchArticleSummaries();
      const filtered = all.articles.filter((article) => {
        const bundledMatch = bundledTopic && article.category === bundledTopic.name;
        return bundledMatch;
      });

      if (filtered.length > 0) {
        setArticles(filtered);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh';
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }, [topicId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!topicId) {
    return null;
  }

  const listHeader = (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back to library">
        <Text style={[styles.back, { color: theme.textSecondary }]}>← Library</Text>
      </Pressable>
      <Text style={[styles.title, { color: theme.text }]}>{topicName || topicId}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {articles.length === 1 ? '1 piece' : `${articles.length} pieces`}
      </Text>
      {error ? (
        <Pressable onPress={load}>
          <Text style={[styles.retry, { color: theme.textSecondary }]}>Try again</Text>
        </Pressable>
      ) : refreshing ? (
        <ActivityIndicator color={theme.textSecondary} style={styles.spinner} />
      ) : null}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ animation: 'fade', gestureEnabled: true }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <SectionList
          sections={[{ title: 'Articles', data: articles }]}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/read/${item.id}`)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: theme.border },
                pressed && styles.rowPressed,
              ]}>
              <Text style={[styles.articleTitle, { color: theme.text }]} numberOfLines={2}>
                {item.title}
              </Text>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: ReadingLayout.insetX,
    paddingBottom: ReadingLayout.insetBottom,
  },
  header: {
    paddingTop: ReadingLayout.insetTop,
    marginBottom: 16,
    gap: 8,
  },
  back: {
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontFamily: ReadingTypography.serif,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  subtitle: {
    ...ReadingTypography.meta,
  },
  retry: {
    fontSize: 14,
    marginTop: 4,
  },
  spinner: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  row: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowPressed: {
    opacity: 0.6,
  },
  articleTitle: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
});