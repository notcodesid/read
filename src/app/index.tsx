import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/app-logo';
import { AuthorAvatar } from '@/components/author-avatar';
import { ReadingCover, ReadingLayout, ReadingTypography } from '@/constants/reading';
import { useAuthors } from '@/hooks/use-authors';
import { useTheme } from '@/hooks/use-theme';
import type { Author } from '@/types/author';

const TILE_WIDTH = ReadingCover.tileWidth;
const TILE_GAP = ReadingCover.tileGap;
const SNAP_INTERVAL = TILE_WIDTH + TILE_GAP;

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { authors, refreshing, error, refresh } = useAuthors();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.page}>
        <View style={styles.header}>
          <AppLogo size={44} />
          <View style={styles.headerRow}>
            <Text style={[styles.heading, { color: theme.text }]}>Authors</Text>
            {error ? (
              <Pressable onPress={refresh} accessibilityRole="button">
                <Text style={[styles.retry, { color: theme.textSecondary }]}>Try again</Text>
              </Pressable>
            ) : refreshing ? (
              <ActivityIndicator color={theme.textSecondary} />
            ) : null}
          </View>
        </View>

        <FlatList
          data={authors}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="start"
          disableIntervalMomentum
          contentContainerStyle={[
            styles.carousel,
            { paddingHorizontal: ReadingLayout.insetX },
          ]}
          renderItem={({ item }) => (
            <AuthorTile
              author={item}
              textColor={theme.text}
              metaColor={theme.textSecondary}
              onPress={() => router.push(`/author/${item.id}`)}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

function AuthorTile({
  author,
  textColor,
  metaColor,
  onPress,
}: {
  author: Author;
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
      accessibilityLabel={`${author.name}, ${countLabel}`}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}>
      <AuthorAvatar authorId={author.id} name={author.name} width={TILE_WIDTH} />
      <Text style={[styles.name, { color: textColor }]} numberOfLines={2}>
        {author.name}
      </Text>
      {author.tagline ? (
        <Text style={[styles.descriptor, { color: metaColor }]} numberOfLines={3}>
          {author.tagline}
        </Text>
      ) : null}
      <Text style={[styles.count, { color: metaColor }]}>{countLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: ReadingLayout.insetX,
    marginBottom: 28,
    gap: 16,
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
  carousel: {
    paddingBottom: ReadingLayout.insetBottom,
  },
  tile: {
    width: TILE_WIDTH,
    marginRight: TILE_GAP,
    gap: 10,
  },
  tilePressed: {
    opacity: 0.65,
  },
  name: {
    fontFamily: ReadingTypography.serif,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  descriptor: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  count: {
    ...ReadingTypography.meta,
    fontSize: 11,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});