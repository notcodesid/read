import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ReadingTypography } from '@/constants/reading';
import type { HomeBrowseMode } from '@/types/taxonomy';

type BrowseModeSwitchProps = {
  mode: HomeBrowseMode;
  onChange: (mode: HomeBrowseMode) => void;
  backgroundColor: string;
  selectedBackground: string;
  textColor: string;
  metaColor: string;
};

export function BrowseModeSwitch({
  mode,
  onChange,
  backgroundColor,
  selectedBackground,
  textColor,
  metaColor,
}: BrowseModeSwitchProps) {
  return (
    <View style={[styles.track, { backgroundColor }]}>
      <Segment
        label="Authors"
        active={mode === 'authors'}
        onPress={() => onChange('authors')}
        textColor={textColor}
        metaColor={metaColor}
        selectedBackground={selectedBackground}
      />
      <Segment
        label="Blogs"
        active={mode === 'blogs'}
        onPress={() => onChange('blogs')}
        textColor={textColor}
        metaColor={metaColor}
        selectedBackground={selectedBackground}
      />
    </View>
  );
}

function Segment({
  label,
  active,
  onPress,
  textColor,
  metaColor,
  selectedBackground,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  textColor: string;
  metaColor: string;
  selectedBackground: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Browse by ${label}`}
      style={[
        styles.segment,
        active && { backgroundColor: selectedBackground },
      ]}>
      <Text
        style={[
          styles.segmentLabel,
          { color: active ? textColor : metaColor },
          active && styles.segmentLabelActive,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  segmentLabelActive: {
    fontFamily: ReadingTypography.serif,
    fontWeight: '600',
  },
});