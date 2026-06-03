import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ReadingLayout, ReadingTypography } from '@/constants/reading';
import type { BlogTopic } from '@/types/taxonomy';

type BlogTopicRowProps = {
  topic: BlogTopic;
  previewTitles: string[];
  textColor: string;
  metaColor: string;
  borderColor: string;
  onPress: () => void;
};

export function BlogTopicRow({
  topic,
  previewTitles,
  textColor,
  metaColor,
  borderColor,
  onPress,
}: BlogTopicRowProps) {
  const countLabel =
    topic.articleCount === 1 ? '1 piece' : `${topic.articleCount} pieces`;
  const preview = previewTitles.slice(0, 2).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${topic.name}, ${countLabel}`}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: borderColor },
        pressed && styles.rowPressed,
      ]}>
      <View style={styles.main}>
        <Text style={[styles.title, { color: textColor }]}>{topic.name}</Text>
        {topic.description ? (
          <Text style={[styles.description, { color: metaColor }]} numberOfLines={2}>
            {topic.description}
          </Text>
        ) : preview ? (
          <Text style={[styles.preview, { color: metaColor }]} numberOfLines={2}>
            {preview}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.count, { color: metaColor }]}>{countLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowPressed: {
    opacity: 0.65,
  },
  main: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: ReadingTypography.serif,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
  preview: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  count: {
    ...ReadingTypography.meta,
    fontSize: 11,
    marginTop: 2,
  },
});