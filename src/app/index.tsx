import { useRouter } from 'expo-router';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/app-logo';
import { ReadingLayout, ReadingTypography } from '@/constants/reading';
import { useArticles } from '@/hooks/use-articles';
import { useTheme } from '@/hooks/use-theme';
import type { ArticleSummary } from '@/types/article';

export default function LibraryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { sections, refreshing, error, refresh } = useArticles();
  const listSections = sections.map((section) => ({
    title: section.category,
    data: section.articles,
  }));

  const listHeader = (
    <View style={styles.header}>
      <AppLogo size={44} />
      {error ? (
        <View style={styles.status}>
          <Text style={[styles.statusText, { color: theme.textSecondary }]}>
            Could not refresh library
          </Text>
          <Pressable onPress={refresh} accessibilityRole="button" accessibilityLabel="Try again">
            <Text style={[styles.retry, { color: theme.text }]}>Try again</Text>
          </Pressable>
        </View>
      ) : refreshing ? (
        <Text style={[styles.statusText, { color: theme.textSecondary }]}>Updating…</Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <SectionList
        sections={listSections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator
        style={styles.sectionList}
        contentContainerStyle={styles.sectionListContent}
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
  sectionList: {
    flex: 1,
    maxWidth: ReadingLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  sectionListContent: {
    paddingHorizontal: ReadingLayout.insetX,
    paddingTop: ReadingLayout.insetTop,
    paddingBottom: ReadingLayout.insetBottom,
  },
  header: {
    marginBottom: 20,
    gap: 10,
  },
  status: {
    gap: 12,
    marginTop: 8,
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