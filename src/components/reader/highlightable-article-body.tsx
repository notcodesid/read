import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { HighlightActionsSheet } from '@/components/reader/highlight-actions-sheet';
import { ReadingHighlight, ReadingTypography } from '@/constants/reading';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  buildHighlightFromSelection,
  findWordPointerAtPoint,
  highlightIntervalInParagraph,
  isWordInSelection,
  tokenizeParagraph,
  type WordScreenLayout,
  type WordToken,
} from '@/lib/highlight-text';
import type { Highlight, WordPointer } from '@/types/highlight';

const LONG_PRESS_MS = 380;

type HighlightableArticleBodyProps = {
  articleId: string;
  paragraphs: string[];
  highlights: Highlight[];
  textColor: string;
  metaColor: string;
  onAddHighlight: (highlight: Highlight) => void;
  onRemoveHighlight: (highlightId: string) => void;
  onSelectingChange?: (selecting: boolean) => void;
};

export function HighlightableArticleBody({
  articleId,
  paragraphs,
  highlights,
  textColor,
  metaColor,
  onAddHighlight,
  onRemoveHighlight,
  onSelectingChange,
}: HighlightableArticleBodyProps) {
  const scheme = useColorScheme();
  const highlightPalette = ReadingHighlight[scheme === 'dark' ? 'dark' : 'light'];

  const wordLayoutsRef = useRef<Map<string, WordScreenLayout>>(new Map());
  const [selecting, setSelecting] = useState(false);
  const [anchor, setAnchor] = useState<WordPointer | null>(null);
  const [focus, setFocus] = useState<WordPointer | null>(null);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  const selectingRef = useRef(false);
  const anchorRef = useRef<WordPointer | null>(null);
  const focusRef = useRef<WordPointer | null>(null);

  const activeHighlight = useMemo(
    () => highlights.find((item) => item.id === activeHighlightId) ?? null,
    [activeHighlightId, highlights],
  );

  useEffect(() => {
    onSelectingChange?.(selecting);
  }, [onSelectingChange, selecting]);

  const cancelSelection = useCallback(() => {
    selectingRef.current = false;
    anchorRef.current = null;
    focusRef.current = null;
    setSelecting(false);
    setAnchor(null);
    setFocus(null);
  }, []);

  const beginSelection = useCallback((pointer: WordPointer) => {
    selectingRef.current = true;
    anchorRef.current = pointer;
    focusRef.current = pointer;
    setSelecting(true);
    setAnchor(pointer);
    setFocus(pointer);
    setActiveHighlightId(null);
  }, []);

  const updateFocus = useCallback((pointer: WordPointer) => {
    if (!selectingRef.current) {
      return;
    }
    focusRef.current = pointer;
    setFocus(pointer);
  }, []);

  const commitSelection = useCallback(() => {
    const lo = anchorRef.current;
    const hi = focusRef.current;

    if (!selectingRef.current || !lo || !hi) {
      cancelSelection();
      return;
    }

    const draft = buildHighlightFromSelection(articleId, paragraphs, lo, hi);
    cancelSelection();

    if (draft) {
      onAddHighlight(draft);
    }
  }, [articleId, cancelSelection, onAddHighlight, paragraphs]);

  const handleGestureFinalize = useCallback(() => {
    if (selectingRef.current) {
      cancelSelection();
    }
  }, [cancelSelection]);

  const pointerAt = useCallback((x: number, y: number) => {
    return findWordPointerAtPoint(wordLayoutsRef.current.values(), x, y);
  }, []);

  const handleGestureStart = useCallback(
    (x: number, y: number) => {
      const pointer = pointerAt(x, y);
      if (pointer) {
        beginSelection(pointer);
      }
    },
    [beginSelection, pointerAt],
  );

  const handleGestureUpdate = useCallback(
    (x: number, y: number) => {
      const pointer = pointerAt(x, y);
      if (pointer) {
        updateFocus(pointer);
      }
    },
    [pointerAt, updateFocus],
  );

  const registerWordLayout = useCallback((key: string, layout: WordScreenLayout) => {
    wordLayoutsRef.current.set(key, layout);
  }, []);

  const unregisterWordLayout = useCallback((key: string) => {
    wordLayoutsRef.current.delete(key);
  }, []);

  /* eslint-disable react-hooks/refs -- gesture runs on touch; layout ref read in handlers only */
  const selectionGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activateAfterLongPress(LONG_PRESS_MS)
        .minDistance(0)
        .onStart((event) => {
          handleGestureStart(event.absoluteX, event.absoluteY);
        })
        .onUpdate((event) => {
          handleGestureUpdate(event.absoluteX, event.absoluteY);
        })
        .onEnd(() => {
          commitSelection();
        })
        .onFinalize(() => {
          handleGestureFinalize();
        }),
    [commitSelection, handleGestureFinalize, handleGestureStart, handleGestureUpdate],
  );
  /* eslint-enable react-hooks/refs */

  const openHighlight = useCallback(
    (highlightId: string) => {
      if (selecting) {
        return;
      }
      setActiveHighlightId(highlightId);
    },
    [selecting],
  );

  return (
    <>
      <Text style={[styles.selectionHint, { color: metaColor }]}>
        {selecting
          ? 'Drag to the end of the passage, then release'
          : highlights.length > 0
            ? 'Press and drag across text to highlight · tap a highlight to manage'
            : 'Press and drag across text to highlight'}
      </Text>

      <GestureDetector gesture={selectionGesture}>
        <View style={styles.body}>
          {paragraphs.map((paragraph, paragraphIndex) => (
            <ParagraphWords
              key={paragraphIndex}
              paragraph={paragraph}
              paragraphIndex={paragraphIndex}
              isFirst={paragraphIndex === 0}
              textColor={textColor}
              highlights={highlights}
              highlightFill={highlightPalette.fill}
              highlightSelecting={highlightPalette.fillSelecting}
              selecting={selecting}
              anchor={anchor}
              focus={focus}
              onRegisterLayout={registerWordLayout}
              onUnregisterLayout={unregisterWordLayout}
              onOpenHighlight={openHighlight}
            />
          ))}
        </View>
      </GestureDetector>

      <HighlightActionsSheet
        highlight={activeHighlight}
        visible={activeHighlight !== null}
        onClose={() => setActiveHighlightId(null)}
        onRemove={onRemoveHighlight}
      />
    </>
  );
}

type ParagraphWordsProps = {
  paragraph: string;
  paragraphIndex: number;
  isFirst: boolean;
  textColor: string;
  highlights: Highlight[];
  highlightFill: string;
  highlightSelecting: string;
  selecting: boolean;
  anchor: WordPointer | null;
  focus: WordPointer | null;
  onRegisterLayout: (key: string, layout: WordScreenLayout) => void;
  onUnregisterLayout: (key: string) => void;
  onOpenHighlight: (highlightId: string) => void;
};

function ParagraphWords({
  paragraph,
  paragraphIndex,
  isFirst,
  textColor,
  highlights,
  highlightFill,
  highlightSelecting,
  selecting,
  anchor,
  focus,
  onRegisterLayout,
  onUnregisterLayout,
  onOpenHighlight,
}: ParagraphWordsProps) {
  const tokens = useMemo(() => tokenizeParagraph(paragraph), [paragraph]);

  if (tokens.length === 0) {
    return (
      <Text
        style={[
          styles.paragraphFallback,
          { color: textColor },
          !isFirst && styles.paragraphSpacing,
        ]}>
        {paragraph}
      </Text>
    );
  }

  return (
    <View style={[styles.paragraph, !isFirst && styles.paragraphSpacing]}>
      <View style={styles.wordRow}>
        {tokens.map((token) => (
          <WordChip
            key={`${paragraphIndex}-${token.wordIndex}`}
            token={token}
            paragraphIndex={paragraphIndex}
            paragraphLength={paragraph.length}
            textColor={textColor}
            highlights={highlights}
            highlightFill={highlightFill}
            highlightSelecting={highlightSelecting}
            selecting={selecting}
            anchor={anchor}
            focus={focus}
            onRegisterLayout={onRegisterLayout}
            onUnregisterLayout={onUnregisterLayout}
            onOpenHighlight={onOpenHighlight}
          />
        ))}
      </View>
    </View>
  );
}

type WordChipProps = {
  token: WordToken;
  paragraphIndex: number;
  paragraphLength: number;
  textColor: string;
  highlights: Highlight[];
  highlightFill: string;
  highlightSelecting: string;
  selecting: boolean;
  anchor: WordPointer | null;
  focus: WordPointer | null;
  onRegisterLayout: (key: string, layout: WordScreenLayout) => void;
  onUnregisterLayout: (key: string) => void;
  onOpenHighlight: (highlightId: string) => void;
};

function WordChip({
  token,
  paragraphIndex,
  paragraphLength,
  textColor,
  highlights,
  highlightFill,
  highlightSelecting,
  selecting,
  anchor,
  focus,
  onRegisterLayout,
  onUnregisterLayout,
  onOpenHighlight,
}: WordChipProps) {
  const viewRef = useRef<View>(null);
  const layoutKey = `${paragraphIndex}:${token.wordIndex}`;
  const pointer = { paragraphIndex, wordIndex: token.wordIndex };

  const highlightId = useMemo(() => {
    for (const highlight of highlights) {
      const interval = highlightIntervalInParagraph(
        highlight,
        paragraphIndex,
        paragraphLength,
      );
      if (!interval) {
        continue;
      }
      if (token.start < interval.end && token.end > interval.start) {
        return highlight.id;
      }
    }
    return undefined;
  }, [highlights, paragraphIndex, paragraphLength, token.end, token.start]);

  const isSelected =
    selecting && anchor && focus && isWordInSelection(pointer, anchor, focus);

  const measureLayout = useCallback(() => {
    viewRef.current?.measureInWindow((x, y, width, height) => {
      if (width <= 0 || height <= 0) {
        return;
      }
      onRegisterLayout(layoutKey, {
        paragraphIndex,
        wordIndex: token.wordIndex,
        x,
        y,
        width,
        height,
      });
    });
  }, [layoutKey, onRegisterLayout, paragraphIndex, token.wordIndex]);

  useEffect(() => {
    measureLayout();
    return () => onUnregisterLayout(layoutKey);
  }, [layoutKey, measureLayout, onUnregisterLayout]);

  const handlePress = () => {
    if (selecting || !highlightId) {
      return;
    }
    onOpenHighlight(highlightId);
  };

  return (
    <View ref={viewRef} collapsable={false} onLayout={measureLayout}>
      <Pressable
        onPress={handlePress}
        disabled={selecting}
        accessibilityRole="text"
        accessibilityLabel={token.text}>
        <Text
          style={[
            styles.word,
            { color: textColor },
            highlightId && !selecting && { backgroundColor: highlightFill },
            isSelected && { backgroundColor: highlightSelecting },
          ]}>
          {token.text}
          {' '}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  selectionHint: {
    ...ReadingTypography.meta,
    marginBottom: 14,
  },
  body: {
    gap: 0,
  },
  paragraph: {
    width: '100%',
  },
  paragraphSpacing: {
    marginTop: ReadingTypography.paragraphGap,
  },
  paragraphFallback: {
    fontFamily: ReadingTypography.serif,
    fontSize: ReadingTypography.bodySize,
    lineHeight: ReadingTypography.bodyLineHeight,
    letterSpacing: 0.1,
  },
  wordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  word: {
    fontFamily: ReadingTypography.serif,
    fontSize: ReadingTypography.bodySize,
    lineHeight: ReadingTypography.bodyLineHeight,
    letterSpacing: 0.1,
  },
});