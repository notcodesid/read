import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReadingLayout, ReadingTypography } from '@/constants/reading';
import { useArticle } from '@/hooks/use-articles';
import { useTheme } from '@/hooks/use-theme';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const articleId = typeof id === 'string' ? id : undefined;
  const { article, loading, error } = useArticle(articleId);

  if (loading) {
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
        </View>
      </SafeAreaView>
    );
  }

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
            {article.paragraphs.map((paragraph, index) => (
              <Text
                key={index}
                style={[
                  styles.paragraph,
                  { color: theme.text },
                  index > 0 && styles.paragraphSpacing,
                ]}>
                {paragraph}
              </Text>
            ))}
          </View>
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
  },
  missingText: {
    ...ReadingTypography.meta,
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
});