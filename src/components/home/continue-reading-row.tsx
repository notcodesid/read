import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { continueReadingSubtitle } from '@/lib/continue-reading';
import { ReadingLayout, ReadingTypography } from '@/constants/reading';
import type { ContinueReadingItem } from '@/types/continue-reading';

const CARD_WIDTH = 200;
const CARD_GAP = 14;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

type ContinueReadingRowProps = {
  items: ContinueReadingItem[];
  textColor: string;
  metaColor: string;
  borderColor: string;
  surfaceColor: string;
  onArticlePress: (articleId: string) => void;
};

export function ContinueReadingRow({
  items,
  textColor,
  metaColor,
  borderColor,
  surfaceColor,
  onArticlePress,
}: ContinueReadingRowProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>Continue reading</Text>

      <FlatList
        data={items}
        horizontal
        keyExtractor={(item) => item.articleId}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={styles.carousel}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onArticlePress(item.articleId)}
            accessibilityRole="button"
            accessibilityLabel={`Continue ${item.title} by ${item.authorName}`}
            style={({ pressed }) => [
              styles.card,
              {
                borderColor,
                backgroundColor: surfaceColor,
              },
              pressed && styles.cardPressed,
            ]}>
            <Text style={[styles.title, { color: textColor }]} numberOfLines={3}>
              {item.title}
            </Text>
            <Text style={[styles.author, { color: metaColor }]} numberOfLines={1}>
              {item.authorName}
            </Text>
            <Text style={[styles.subtitle, { color: metaColor }]} numberOfLines={1}>
              {continueReadingSubtitle(item.offsetY)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: ReadingTypography.serif,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    paddingHorizontal: ReadingLayout.insetX,
  },
  carousel: {
    paddingHorizontal: ReadingLayout.insetX,
  },
  card: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
    minHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
    justifyContent: 'space-between',
  },
  cardPressed: {
    opacity: 0.65,
  },
  title: {
    fontFamily: ReadingTypography.serif,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  author: {
    ...ReadingTypography.meta,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
  subtitle: {
    ...ReadingTypography.meta,
    fontStyle: 'italic',
  },
});