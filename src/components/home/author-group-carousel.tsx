import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthorAvatar } from '@/components/author-avatar';
import { ReadingCover, ReadingLayout, ReadingTypography } from '@/constants/reading';
import type { Author } from '@/types/author';
import type { AuthorGroup } from '@/types/taxonomy';

const TILE_WIDTH = ReadingCover.tileWidth;
const TILE_GAP = ReadingCover.tileGap;
const SNAP_INTERVAL = TILE_WIDTH + TILE_GAP;

type AuthorGroupCarouselProps = {
  group: AuthorGroup;
  authors: Author[];
  textColor: string;
  metaColor: string;
  onAuthorPress: (authorId: string) => void;
};

export function AuthorGroupCarousel({
  group,
  authors,
  textColor,
  metaColor,
  onAuthorPress,
}: AuthorGroupCarouselProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>{group.name}</Text>
        {group.description ? (
          <Text style={[styles.sectionMeta, { color: metaColor }]} numberOfLines={2}>
            {group.description}
          </Text>
        ) : null}
      </View>

      <FlatList
        data={authors}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={styles.carousel}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onAuthorPress(item.id)}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}>
            <AuthorAvatar authorId={item.id} name={item.name} width={TILE_WIDTH} />
            <Text style={[styles.name, { color: textColor }]} numberOfLines={2}>
              {item.name}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
    marginBottom: 28,
  },
  sectionHeader: {
    paddingHorizontal: ReadingLayout.insetX,
    gap: 4,
  },
  sectionTitle: {
    fontFamily: ReadingTypography.serif,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  sectionMeta: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  carousel: {
    paddingHorizontal: ReadingLayout.insetX,
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
  },
});