import * as WebBrowser from 'expo-web-browser';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReadingLayout, ReadingTypography } from '@/constants/reading';
import { useArticle } from '@/hooks/use-articles';
import { useTheme } from '@/hooks/use-theme';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const articleId = typeof id === 'string' ? id : undefined;
  const { article, loading, error, retry } = useArticle(articleId);

  if (loading && !article) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.textSecondary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !article) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.missingText, { color: theme.textSecondary }]}>
            {error ?? 'Not found'}
          </Text>
          <Pressable
            onPress={retry}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            style={styles.retryButton}>
            <Text style={[styles.retryText, { color: theme.text }]}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const hasBody = article.paragraphs.length > 0;

  return (
    <>
      <Stack.Screen options={{ animation: 'fade', gestureEnabled: true }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {article.category ? (
            <Text style={[styles.category, { color: theme.textSecondary }]}>{article.category}</Text>
          ) : null}
          <Text style={[styles.title, { color: theme.text }]}>{article.title}</Text>
          {(article.source || article.author) && (
            <Text style={[styles.byline, { color: theme.textSecondary }]}>
              {[article.source, article.author].filter(Boolean).join(' · ')}
            </Text>
          )}

          <View style={styles.body}>
            {hasBody ? (
              article.paragraphs.map((paragraph, index) => (
                <Text
                  key={index}
                  style={[
                    styles.paragraph,
                    { color: theme.text },
                    index > 0 && styles.paragraphSpacing,
                  ]}>
                  {paragraph}
                </Text>
              ))
            ) : (
              <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
                No content available for this article.
              </Text>
            )}
          </View>

          {article.sourceUrl ? (
            <Pressable
              onPress={() => WebBrowser.openBrowserAsync(article.sourceUrl!)}
              accessibilityRole="link"
              accessibilityLabel="Open original article"
              style={({ pressed }) => [styles.sourceLink, pressed && styles.sourceLinkPressed]}>
              <Text style={[styles.sourceLinkText, { color: theme.textSecondary }]}>
                View on noahzender.com
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: ReadingLayout.insetX,
  },
  missingText: {
    ...ReadingTypography.meta,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: ReadingLayout.insetX,
    paddingTop: ReadingLayout.insetTop,
    paddingBottom: ReadingLayout.insetBottom,
    maxWidth: ReadingLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  category: {
    ...ReadingTypography.meta,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontFamily: ReadingTypography.serif,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  byline: {
    ...ReadingTypography.meta,
    marginBottom: 22,
  },
  body: {
    gap: 0,
  },
  paragraph: {
    fontFamily: ReadingTypography.serif,
    fontSize: ReadingTypography.bodySize,
    lineHeight: ReadingTypography.bodyLineHeight,
    letterSpacing: 0.1,
  },
  paragraphSpacing: {
    marginTop: ReadingTypography.paragraphGap,
  },
  emptyBody: {
    fontFamily: ReadingTypography.serif,
    fontSize: ReadingTypography.bodySize,
    lineHeight: ReadingTypography.bodyLineHeight,
    fontStyle: 'italic',
  },
  sourceLink: {
    marginTop: 32,
    paddingVertical: 8,
  },
  sourceLinkPressed: {
    opacity: 0.6,
  },
  sourceLinkText: {
    ...ReadingTypography.meta,
    textDecorationLine: 'underline',
  },
});