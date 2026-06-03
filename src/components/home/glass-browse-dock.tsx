import {
  GlassContainer,
  GlassView,
  isGlassEffectAPIAvailable,
} from 'expo-glass-effect';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReadingTypography } from '@/constants/reading';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { HomeBrowseMode } from '@/types/taxonomy';

type GlassBrowseDockProps = {
  mode: HomeBrowseMode;
  onChange: (mode: HomeBrowseMode) => void;
  textColor: string;
  metaColor: string;
  surfaceColor: string;
  borderColor: string;
};

const DOCK_BOTTOM_GAP = 12;
const PILL_HEIGHT = 52;
const PILL_MIN_WIDTH = 248;

export function GlassBrowseDock({
  mode,
  onChange,
  textColor,
  metaColor,
  surfaceColor,
  borderColor,
}: GlassBrowseDockProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const glassScheme = scheme === 'dark' ? 'dark' : 'light';
  const useGlass = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

  return (
    <View
      style={[styles.dock, { paddingBottom: Math.max(insets.bottom, DOCK_BOTTOM_GAP) }]}
      pointerEvents="box-none">
      {useGlass ? (
        <GlassContainer spacing={10} style={styles.pill}>
          <DockSegment
            label="Authors"
            active={mode === 'authors'}
            onPress={() => onChange('authors')}
            textColor={textColor}
            metaColor={metaColor}
            glassScheme={glassScheme}
            glass
          />
          <DockSegment
            label="Blogs"
            active={mode === 'blogs'}
            onPress={() => onChange('blogs')}
            textColor={textColor}
            metaColor={metaColor}
            glassScheme={glassScheme}
            glass
          />
        </GlassContainer>
      ) : (
        <View
          style={[
            styles.pill,
            styles.fallbackPill,
            { backgroundColor: surfaceColor, borderColor },
          ]}>
          <DockSegment
            label="Authors"
            active={mode === 'authors'}
            onPress={() => onChange('authors')}
            textColor={textColor}
            metaColor={metaColor}
            glassScheme={glassScheme}
            selectedFill={surfaceColor}
          />
          <DockSegment
            label="Blogs"
            active={mode === 'blogs'}
            onPress={() => onChange('blogs')}
            textColor={textColor}
            metaColor={metaColor}
            glassScheme={glassScheme}
            selectedFill={surfaceColor}
          />
        </View>
      )}
    </View>
  );
}

function DockSegment({
  label,
  active,
  onPress,
  textColor,
  metaColor,
  glassScheme,
  glass = false,
  selectedFill,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  textColor: string;
  metaColor: string;
  glassScheme: 'light' | 'dark';
  glass?: boolean;
  selectedFill?: string;
}) {
  const inner = (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Browse by ${label}`}
      style={({ pressed }) => [
        styles.segment,
        !glass && active && selectedFill && { backgroundColor: selectedFill },
        pressed && styles.segmentPressed,
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

  if (glass) {
    return (
      <GlassView
        style={styles.glassSegment}
        glassEffectStyle={active ? 'clear' : 'regular'}
        isInteractive={active}
        colorScheme={glassScheme}
        tintColor={active ? 'rgba(255, 205, 105, 0.22)' : undefined}>
        {inner}
      </GlassView>
    );
  }

  return <View style={styles.fallbackSegment}>{inner}</View>;
}

/** Extra scroll padding so content clears the floating dock. */
export const GLASS_BROWSE_DOCK_SCROLL_PADDING = PILL_HEIGHT + DOCK_BOTTOM_GAP + 40;

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minWidth: PILL_MIN_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    padding: 4,
    gap: 4,
  },
  fallbackPill: {
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  glassSegment: {
    flex: 1,
    borderRadius: (PILL_HEIGHT - 8) / 2,
    overflow: 'hidden',
  },
  fallbackSegment: {
    flex: 1,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: (PILL_HEIGHT - 8) / 2,
    paddingHorizontal: 20,
  },
  segmentPressed: {
    opacity: 0.82,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
  segmentLabelActive: {
    fontFamily: ReadingTypography.serif,
    fontWeight: '600',
    fontSize: 15,
  },
});