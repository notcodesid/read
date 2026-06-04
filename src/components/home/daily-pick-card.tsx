import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ReadingLayout, ReadingTypography } from '@/constants/reading';
import type { DailyPickItem } from '@/types/daily-reading';

type DailyPickCardProps = {
  pick: DailyPickItem;
  textColor: string;
  metaColor: string;
  borderColor: string;
  surfaceColor: string;
  onPress: (articleId: string) => void;
};

export function DailyPickCard({
  pick,
  textColor,
  metaColor,
  borderColor,
  surfaceColor,
  onPress,
}: DailyPickCardProps) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: metaColor }]}>Daily pick</Text>
      <Pressable
        onPress={() => onPress(pick.articleId)}
        accessibilityRole="button"
        accessibilityLabel={`Today's pick: ${pick.title} by ${pick.authorName}`}
        style={({ pressed }) => [
          styles.card,
          { borderColor, backgroundColor: surfaceColor },
          pressed && styles.cardPressed,
        ]}>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
          {pick.title}
        </Text>
        <Text style={[styles.meta, { color: metaColor }]} numberOfLines={1}>
          {pick.authorName}
          {pick.category ? ` · ${pick.category}` : ''}
        </Text>
        <Text style={[styles.hint, { color: metaColor }]}>One article for today · same pick all day</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 20,
    gap: 8,
    paddingHorizontal: ReadingLayout.insetX,
  },
  label: {
    ...ReadingTypography.meta,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  card: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  cardPressed: {
    opacity: 0.65,
  },
  title: {
    fontFamily: ReadingTypography.serif,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  meta: {
    ...ReadingTypography.meta,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
  hint: {
    ...ReadingTypography.meta,
    fontSize: 10,
    fontStyle: 'italic',
  },
});