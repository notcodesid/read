import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HighlightableArticleBody } from '@/components/reader/highlightable-article-body';
import { ReadingSettingsSheet } from '@/components/reader/reading-settings-sheet';
import { getBundledHeroImageSource } from '@/constants/article-images';
import { useReadingPreferences } from '@/contexts/reading-preferences-context';
import { useArticle } from '@/hooks/use-articles';
import { useHighlights } from '@/hooks/use-highlights';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import { useTheme } from '@/hooks/use-theme';
import { getBundledSummaries } from '@/lib/articles';
import { highlightsToMarkdown } from '@/lib/export-highlights';
import { exportHighlightsToFile } from '@/lib/export-highlights-file';
import { countArticleWords } from '@/lib/resolve-reading-styles';
import { recordReadingSession, estimateReadingMinutes } from '@/lib/reading-wpm';
import { loadScrollPosition, saveScrollPosition } from '@/lib/scroll-position';

const SCROLL_END_THRESHOLD = 48;
const SCROLL_SAVE_MS = 400;

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { typography, layout, preferences, stats, refreshStats, getHighlightStyle } =
    useReadingPreferences();
  const articleId = typeof id === 'string' ? id : undefined;
  const { article, loading, error, retry } = useArticle(articleId);
  const { highlights, addHighlight, removeHighlight, updateHighlight } = useHighlights(articleId);
  const { isArticleCompleted, markComplete } = useReadingProgress();
  const [selecting, setSelecting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeCompleteNotice, setThemeCompleteNotice] = useState<{
    articleId: string;
    themeName: string;
  } | null>(null);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollOffsetY, setScrollOffsetY] = useState(0);
  const markedCompleteRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const scrollRestoredRef = useRef(false);
  const openedAtRef = useRef(Date.now());
  const saveScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    markedCompleteRef.current = false;
    scrollRestoredRef.current = false;
    openedAtRef.current = Date.now();
    setScrollOffsetY(0);

    if (!articleId) {
      return;
    }

    loadScrollPosition(articleId).then((offsetY) => {
      if (offsetY > 0) {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ y: offsetY, animated: false });
          setScrollOffsetY(offsetY);
        });
      }
      scrollRestoredRef.current = true;
    });
  }, [articleId]);

  useEffect(() => {
    return () => {
      if (saveScrollTimerRef.current) {
        clearTimeout(saveScrollTimerRef.current);
      }
    };
  }, []);

  const recordSession = useCallback(
    async (progressRatio: number) => {
      if (!article) {
        return;
      }
      await recordReadingSession(article.paragraphs, Date.now() - openedAtRef.current, progressRatio);
      await refreshStats();
    },
    [article, refreshStats],
  );

  useEffect(() => {
    return () => {
      if (!article) {
        return;
      }

      const maxScroll = Math.max(1, contentHeight - scrollHeight);
      const ratio = scrollHeight > 0 ? scrollOffsetY / maxScroll : 0;
      void recordSession(ratio);
    };
  }, [article?.id]);

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

    const maxScroll = Math.max(1, contentHeight - scrollHeight);
    const ratio = scrollHeight > 0 ? Math.min(1, scrollOffsetY / maxScroll) : 1;
    await recordSession(Math.max(ratio, 1));

    if (result.themeJustCompleted && result.themeName) {
      setThemeCompleteNotice({ articleId: article.id, themeName: result.themeName });
    }
  }, [
    article,
    articleIdsInTheme,
    contentHeight,
    isArticleCompleted,
    markComplete,
    recordSession,
    scrollHeight,
    scrollOffsetY,
    selecting,
  ]);

  const scheduleScrollSave = useCallback(
    (offsetY: number) => {
      if (!articleId) {
        return;
      }

      if (saveScrollTimerRef.current) {
        clearTimeout(saveScrollTimerRef.current);
      }

      saveScrollTimerRef.current = setTimeout(() => {
        void saveScrollPosition(articleId, offsetY);
      }, SCROLL_SAVE_MS);
    },
    [articleId],
  );

  const evaluateScrollEnd = useCallback(
    (offsetY: number) => {
      if (scrollHeight <= 0 || contentHeight <= 0) {
        return;
      }

      const fitsWithoutScrolling = contentHeight <= scrollHeight + SCROLL_END_THRESHOLD;
      const scrolledToEnd = offsetY + scrollHeight >= contentHeight - SCROLL_END_THRESHOLD;

      if (fitsWithoutScrolling || scrolledToEnd) {
        void tryMarkFinished();
      }
    },
    [contentHeight, scrollHeight, tryMarkFinished],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      setScrollOffsetY(offsetY);
      scheduleScrollSave(offsetY);
      evaluateScrollEnd(offsetY);
    },
    [evaluateScrollEnd, scheduleScrollSave],
  );

  const handleScrollLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      setScrollHeight(height);
      if (height > 0 && contentHeight > 0) {
        evaluateScrollEnd(scrollOffsetY);
      }
    },
    [contentHeight, evaluateScrollEnd, scrollOffsetY],
  );

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      setContentHeight(height);
      if (scrollHeight > 0 && height > 0) {
        evaluateScrollEnd(scrollOffsetY);
      }
    },
    [evaluateScrollEnd, scrollHeight, scrollOffsetY],
  );

  const exportHighlights = useCallback(async () => {
    if (!article || highlights.length === 0) {
      Alert.alert('No highlights', 'Highlight some text first, then export.');
      return;
    }

    setSettingsOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 400));

    try {
      const markdown = highlightsToMarkdown(
        article.title,
        highlights,
        article.author ?? article.source,
      );
      const result = await exportHighlightsToFile(article.title, markdown);

      Alert.alert(
        'Highlights exported',
        `Copied to clipboard.\n\nIn the share sheet, choose Save to Files (or Notes) to download ${result.fileName}.`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not export highlights';
      Alert.alert('Export failed', message);
    }
  }, [article, highlights]);

  const contentStyle = {
    paddingHorizontal: layout.insetX,
    paddingTop: layout.insetTop,
    paddingBottom: layout.insetBottom,
    maxWidth: layout.maxWidth,
  };

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
  const wordCount = countArticleWords(article.paragraphs);
  const readMinutes = estimateReadingMinutes(wordCount, stats.wpmSamples);
  const readTimeLabel =
    stats.wpmSamples.length > 0
      ? `${readMinutes} min read`
      : `~${readMinutes} min read`;

  const getHighlightFill = (color: 'yellow' | 'green') => getHighlightStyle(color).fill;
  const getHighlightSelectingFill = (color: 'yellow' | 'green') =>
    getHighlightStyle(color).fillSelecting;

  return (
    <>
      <Stack.Screen options={{ animation: 'fade', gestureEnabled: true }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <Pressable
          onPress={() => setSettingsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Reading settings"
          style={[styles.settingsButton, { borderColor: theme.border }]}>
          <Text style={[styles.settingsButtonText, { color: theme.textSecondary }]}>Aa</Text>
        </Pressable>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.content, contentStyle]}
          scrollEnabled={!selecting}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onLayout={handleScrollLayout}
          onContentSizeChange={handleContentSizeChange}
          onScroll={handleScroll}
          scrollEventThrottle={80}>
          {article.category ? (
            <View style={styles.categoryRow}>
              <Text
                style={[
                  styles.category,
                  typography.meta,
                  { color: theme.textSecondary, fontFamily: typography.bodyFontFamily },
                ]}>
                {article.category}
              </Text>
              {completed ? (
                <Text
                  style={[
                    styles.completedBadge,
                    typography.meta,
                    { color: theme.textSecondary },
                  ]}>
                  Read
                </Text>
              ) : null}
            </View>
          ) : null}
          <Text
            style={[
              styles.title,
              {
                color: theme.text,
                fontFamily: typography.bodyFontFamily,
                fontSize: typography.bodySize + 6,
                lineHeight: typography.bodyLineHeight + 2,
              },
            ]}>
            {article.title}
          </Text>
          <Text style={[styles.byline, typography.meta, { color: theme.textSecondary }]}>
            {[article.source, article.author].filter(Boolean).join(' · ')}
            {wordCount > 0 ? ` · ${readTimeLabel}` : ''}
          </Text>

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
                typography={typography}
                highlightDefaults={{
                  color: preferences.defaultHighlightColor,
                  label: preferences.defaultHighlightLabel,
                }}
                getHighlightFill={getHighlightFill}
                getHighlightSelectingFill={getHighlightSelectingFill}
                onAddHighlight={addHighlight}
                onRemoveHighlight={removeHighlight}
                onUpdateHighlight={updateHighlight}
                onSelectingChange={handleSelectingChange}
              />
            ) : (
              <Text
                style={[
                  styles.emptyBody,
                  {
                    color: theme.textSecondary,
                    fontFamily: typography.bodyFontFamily,
                    fontSize: typography.bodySize,
                    lineHeight: typography.bodyLineHeight,
                  },
                ]}>
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
              <Text style={[styles.themeCompleteTitle, { color: theme.text }]}>Theme complete</Text>
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
              <Text style={[styles.sourceLinkText, typography.meta, { color: theme.textSecondary }]}>
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
              <Text style={[styles.markFinishedText, typography.meta, { color: theme.textSecondary }]}>
                Mark as finished
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>

        <ReadingSettingsSheet
          visible={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onExportHighlights={exportHighlights}
          highlightCount={highlights.length}
        />
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
    paddingHorizontal: 28,
  },
  missingText: {
    fontSize: 12,
    lineHeight: 16,
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
  settingsButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
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
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  completedBadge: {
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
    fontSize: 12,
    lineHeight: 18,
  },
  markFinished: {
    marginTop: 20,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  markFinishedText: {
    textDecorationLine: 'underline',
  },
  title: {
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  byline: {
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
    textDecorationLine: 'underline',
  },
});