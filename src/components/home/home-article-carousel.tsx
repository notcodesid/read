import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ReadingLayout, ReadingTypography } from '@/constants/reading';

export type HomeArticleCard = {
  articleId: string;
  title: string;
  authorName: string;
  subtitle: string;
};

const CARD_WIDTH = 188;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

type HomeArticleCarouselProps = {
  items: HomeArticleCard[];
  textColor: string;
  metaColor: string;
  borderColor: string;
  surfaceColor: string;
  onArticlePress: (articleId: string) => void;
  onItemLongPress?: (articleId: string) => void;
  accessibilityVerb?: string;
};

export function HomeArticleCarousel({
  items,
  textColor,
  metaColor,
  borderColor,
  surfaceColor,
  onArticlePress,
  onItemLongPress,
  accessibilityVerb = 'Open',
}: HomeArticleCarouselProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <FlatList
      data={items}
      horizontal
      keyExtractor={(item) => item.articleId}
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={SNAP_INTERVAL}
      snapToAlignment="start"
      disableIntervalMomentum
      nestedScrollEnabled
      contentContainerStyle={styles.carousel}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onArticlePress(item.articleId)}
          onLongPress={
            onItemLongPress ? () => onItemLongPress(item.articleId) : undefined
          }
          accessibilityRole="button"
          accessibilityLabel={`${accessibilityVerb} ${item.title} by ${item.authorName}`}
          style={({ pressed }) => [
            styles.card,
            { borderColor, backgroundColor: surfaceColor },
            pressed && styles.cardPressed,
          ]}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.author, { color: metaColor }]} numberOfLines={1}>
            {item.authorName}
          </Text>
          <Text style={[styles.subtitle, { color: metaColor }]} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  carousel: {
    paddingHorizontal: ReadingLayout.insetX,
  },
  card: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
    minHeight: 96,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
    justifyContent: 'space-between',
  },
  cardPressed: {
    opacity: 0.65,
  },
  title: {
    fontFamily: ReadingTypography.serif,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  author: {
    ...ReadingTypography.meta,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
  subtitle: {
    ...ReadingTypography.meta,
    fontSize: 11,
    fontStyle: 'italic',
  },
});