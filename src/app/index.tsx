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
          <AppLogo size={56} />
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

        <View style={styles.carouselWrap}>
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
                onPress={() => router.push(`/author/${item.id}`)}
              />
            )}
            ListEmptyComponent={
              !refreshing ? (
                <Text style={[styles.empty, { color: theme.textSecondary }]}>
                  No authors yet.
                </Text>
              ) : null
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function AuthorTile({
  author,
  textColor,
  onPress,
}: {
  author: Author;
  textColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={author.name}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}>
      <AuthorAvatar authorId={author.id} name={author.name} width={TILE_WIDTH} />
      <Text style={[styles.name, { color: textColor }]} numberOfLines={2}>
        {author.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: ReadingLayout.insetX,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 20,
  },
  carouselWrap: {
    flex: 1,
    justifyContent: 'center',
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
    gap: 8,
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
  empty: {
    ...ReadingTypography.meta,
    paddingVertical: 24,
  },
});