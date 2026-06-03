import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/app-logo';
import { AuthorAvatar } from '@/components/author-avatar';
import { ReadingLayout, ReadingTypography } from '@/constants/reading';
import { useAuthors } from '@/hooks/use-authors';
import { useTheme } from '@/hooks/use-theme';
import type { Author } from '@/types/author';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { authors, refreshing, error, refresh } = useAuthors();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppLogo size={44} />
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your reading shelf
          </Text>
          {error ? (
            <View style={styles.status}>
              <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                Could not refresh library
              </Text>
              <Pressable onPress={refresh} accessibilityRole="button">
                <Text style={[styles.retry, { color: theme.text }]}>Try again</Text>
              </Pressable>
            </View>
          ) : refreshing ? (
            <ActivityIndicator color={theme.textSecondary} style={styles.spinner} />
          ) : null}
        </View>

        <View style={styles.list}>
          {authors.map((author) => (
            <AuthorCard
              key={author.id}
              author={author}
              borderColor={theme.border}
              textColor={theme.text}
              metaColor={theme.textSecondary}
              onPress={() => router.push(`/author/${author.id}`)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AuthorCard({
  author,
  borderColor,
  textColor,
  metaColor,
  onPress,
}: {
  author: Author;
  borderColor: string;
  textColor: string;
  metaColor: string;
  onPress: () => void;
}) {
  const countLabel =
    author.articleCount === 1 ? '1 piece' : `${author.articleCount} pieces`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${author.name}, ${countLabel}`}
      style={({ pressed }) => [
        styles.card,
        { borderBottomColor: borderColor },
        pressed && styles.cardPressed,
      ]}>
      <AuthorAvatar name={author.name} size={48} />
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: textColor }]}>{author.name}</Text>
        {author.tagline ? (
          <Text style={[styles.cardTagline, { color: metaColor }]} numberOfLines={2}>
            {author.tagline}
          </Text>
        ) : null}
        <Text style={[styles.cardMeta, { color: metaColor }]}>{countLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
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
  header: {
    marginBottom: 28,
    gap: 10,
  },
  subtitle: {
    ...ReadingTypography.meta,
    fontSize: 14,
  },
  status: {
    gap: 8,
    marginTop: 4,
  },
  statusText: {
    ...ReadingTypography.meta,
  },
  retry: {
    fontSize: 14,
    fontWeight: '500',
  },
  spinner: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  list: {
    gap: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cardPressed: {
    opacity: 0.6,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  cardTagline: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardMeta: {
    ...ReadingTypography.meta,
    marginTop: 2,
  },
});