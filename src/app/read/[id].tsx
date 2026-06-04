import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HighlightableArticleBody } from '@/components/reader/highlightable-article-body';
import { getBundledHeroImageSource } from '@/constants/article-images';
import { ReadingLayout, ReadingTypography } from '@/constants/reading';
import { useArticle } from '@/hooks/use-articles';
import { useHighlights } from '@/hooks/use-highlights';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import { useTheme } from '@/hooks/use-theme';
import { getBundledSummaries } from '@/lib/articles';

const SCROLL_END_THRESHOLD = 48;

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const articleId = typeof id === 'string' ? id : undefined;
  const { article, loading, error, retry } = useArticle(articleId);
  const { highlights, addHighlight, removeHighlight } = useHighlights(articleId);
  const { isArticleCompleted, markComplete } = useReadingProgress();
  const [selecting, setSelecting] = useState(false);
  const [themeCompleteNotice, setThemeCompleteNotice] = useState<{
    articleId: string;
    themeName: string;
  } | null>(null);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const markedCompleteRef = useRef(false);

  useEffect(() => {
    markedCompleteRef.current = false;
  }, [articleId]);

  const handleSelectingChange = useCallback((value: boolean) => {
    setSelecting(value);
  }, []);

  const articleIdsInTheme = useCallback(() => {
    if (!article?.authorId || !article.category) {
      return [];
    }

    return getBundledSummaries(article.authorId)
      .filter((item) => item.category === article.category)
      .map((item) => item.id);
  }, [article]);

  const tryMarkFinished = useCallback(async () => {
    if (!article || markedCompleteRef.current || selecting) {
      return;
    }

    if (isArticleCompleted(article.id)) {
      markedCompleteRef.current = true;
      return;
    }

    markedCompleteRef.current = true;
    const result = await markComplete(
      article.id,
      article.authorId,
      article.category,
      articleIdsInTheme(),
    );

    if (result.themeJustCompleted && result.themeName) {
      setThemeCompleteNotice({ articleId: article.id, themeName: result.themeName });
    }
  }, [article, articleIdsInTheme, isArticleCompleted, markComplete, selecting]);

  const evaluateScrollEnd = useCallback(
    (offsetY: number) => {
      if (scrollHeight <= 0 || contentHeight <= 0) {
        return;
      }

      const fitsWithoutScrolling = contentHeight <= scrollHeight + SCROLL_END_THRESHOLD;
      const scrolledToEnd =
        offsetY + scrollHeight >= contentHeight - SCROLL_END_THRESHOLD;

      if (fitsWithoutScrolling || scrolledToEnd) {
        void tryMarkFinished();
      }
    },
    [contentHeight, scrollHeight, tryMarkFinished],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      evaluateScrollEnd(event.nativeEvent.contentOffset.y);
    },
    [evaluateScrollEnd],
  );

  const handleScrollLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      setScrollHeight(height);
      if (height > 0 && contentHeight > 0) {
        evaluateScrollEnd(0);
      }
    },
    [contentHeight, evaluateScrollEnd],
  );

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      setContentHeight(height);
      if (scrollHeight > 0 && height > 0) {
        evaluateScrollEnd(0);
      }
    },
    [scrollHeight, evaluateScrollEnd],
  );

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
  const bundledHero = getBundledHeroImageSource(article.id);
  const heroSource = bundledHero ?? (article.heroImageUrl ? { uri: article.heroImageUrl } : null);
  const completed = isArticleCompleted(article.id);

  return (
    <>
      <Stack.Screen options={{ animation: 'fade', gestureEnabled: true }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          scrollEnabled={!selecting}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onLayout={handleScrollLayout}
          onContentSizeChange={handleContentSizeChange}
          onScroll={handleScroll}
          scrollEventThrottle={80}>
          {article.category ? (
            <View style={styles.categoryRow}>
              <Text style={[styles.category, { color: theme.textSecondary }]}>
                {article.category}
              </Text>
              {completed ? (
                <Text style={[styles.completedBadge, { color: theme.textSecondary }]}>
                  Read
                </Text>
              ) : null}
            </View>
          ) : null}
          <Text style={[styles.title, { color: theme.text }]}>{article.title}</Text>
          {(article.source || article.author) && (
            <Text style={[styles.byline, { color: theme.textSecondary }]}>
              {[article.source, article.author].filter(Boolean).join(' · ')}
            </Text>
          )}

          {heroSource ? (
            <Image
              source={heroSource}
              style={styles.heroImage}
              contentFit="contain"
              accessibilityLabel={`Illustration for ${article.title}`}
            />
          ) : null}

          <View style={styles.body}>
            {hasBody ? (
              <HighlightableArticleBody
                articleId={article.id}
                paragraphs={article.paragraphs}
                highlights={highlights}
                textColor={theme.text}
                metaColor={theme.textSecondary}
                onAddHighlight={addHighlight}
                onRemoveHighlight={removeHighlight}
                onSelectingChange={handleSelectingChange}
              />
            ) : (
              <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
                No content available for this article.
              </Text>
            )}
          </View>

          {themeCompleteNotice?.articleId === article.id ? (
            <View
              style={[
                styles.themeCompleteBanner,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}>
              <Text style={[styles.themeCompleteTitle, { color: theme.text }]}>
                Theme complete
              </Text>
              <Text style={[styles.themeCompleteMeta, { color: theme.textSecondary }]}>
                You finished every piece in {themeCompleteNotice.themeName}
              </Text>
            </View>
          ) : null}

          {article.sourceUrl ? (
            <Pressable
              onPress={() => WebBrowser.openBrowserAsync(article.sourceUrl!)}
              accessibilityRole="link"
              accessibilityLabel="Open original article"
              style={({ pressed }) => [styles.sourceLink, pressed && styles.sourceLinkPressed]}>
              <Text style={[styles.sourceLinkText, { color: theme.textSecondary }]}>
                View original
              </Text>
            </Pressable>
          ) : null}

          {!completed && hasBody ? (
            <Pressable
              onPress={() => void tryMarkFinished()}
              accessibilityRole="button"
              accessibilityLabel="Mark as finished reading"
              style={({ pressed }) => [styles.markFinished, pressed && styles.sourceLinkPressed]}>
              <Text style={[styles.markFinishedText, { color: theme.textSecondary }]}>
                Mark as finished
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
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  category: {
    ...ReadingTypography.meta,
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  completedBadge: {
    ...ReadingTypography.meta,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  themeCompleteBanner: {
    marginTop: 28,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  themeCompleteTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  themeCompleteMeta: {
    ...ReadingTypography.meta,
    lineHeight: 18,
  },
  markFinished: {
    marginTop: 20,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  markFinishedText: {
    ...ReadingTypography.meta,
    textDecorationLine: 'underline',
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
  heroImage: {
    width: '100%',
    aspectRatio: 16 / 10,
    marginBottom: 22,
    borderRadius: 4,
  },
  body: {
    gap: 0,
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