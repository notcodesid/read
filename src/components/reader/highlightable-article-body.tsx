import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HighlightActionsSheet } from '@/components/reader/highlight-actions-sheet';
import { ReadingHighlight, ReadingTypography } from '@/constants/reading';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  buildHighlightFromSelection,
  highlightIntervalInParagraph,
  isWordInSelection,
  tokenizeParagraph,
} from '@/lib/highlight-text';
import type { WordToken } from '@/lib/highlight-text';
import type { Highlight, WordPointer } from '@/types/highlight';

export type HighlightableArticleBodyHandle = {
  saveHighlight: () => void;
  cancelSelection: () => void;
};

type HighlightableArticleBodyProps = {
  articleId: string;
  paragraphs: string[];
  highlights: Highlight[];
  textColor: string;
  metaColor: string;
  onAddHighlight: (highlight: Highlight) => void;
  onRemoveHighlight: (highlightId: string) => void;
  onSelectingChange?: (selecting: boolean) => void;
  onSelectionPreviewChange?: (preview: string) => void;
};

export const HighlightableArticleBody = forwardRef<
  HighlightableArticleBodyHandle,
  HighlightableArticleBodyProps
>(function HighlightableArticleBody(
  {
    articleId,
    paragraphs,
    highlights,
    textColor,
    metaColor,
    onAddHighlight,
    onRemoveHighlight,
    onSelectingChange,
    onSelectionPreviewChange,
  },
  ref,
) {
  const scheme = useColorScheme();
  const highlightPalette = ReadingHighlight[scheme === 'dark' ? 'dark' : 'light'];

  const [selecting, setSelecting] = useState(false);
  const [anchor, setAnchor] = useState<WordPointer | null>(null);
  const [focus, setFocus] = useState<WordPointer | null>(null);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  const activeHighlight = useMemo(
    () => highlights.find((item) => item.id === activeHighlightId) ?? null,
    [activeHighlightId, highlights],
  );

  const selectionPreview = useMemo(() => {
    if (!anchor || !focus) {
      return 'Tap words to adjust your selection';
    }

    const draft = buildHighlightFromSelection(articleId, paragraphs, anchor, focus);
    return draft?.quote ?? 'Tap words to adjust your selection';
  }, [anchor, articleId, focus, paragraphs]);

  useEffect(() => {
    onSelectingChange?.(selecting);
  }, [onSelectingChange, selecting]);

  useEffect(() => {
    onSelectionPreviewChange?.(selectionPreview);
  }, [onSelectionPreviewChange, selectionPreview]);

  const cancelSelection = useCallback(() => {
    setSelecting(false);
    setAnchor(null);
    setFocus(null);
  }, []);

  const beginSelection = useCallback((pointer: WordPointer) => {
    setSelecting(true);
    setAnchor(pointer);
    setFocus(pointer);
    setActiveHighlightId(null);
  }, []);

  const updateFocus = useCallback((pointer: WordPointer) => {
    setFocus(pointer);
  }, []);

  const saveHighlight = useCallback(() => {
    if (!anchor || !focus) {
      return;
    }

    const draft = buildHighlightFromSelection(articleId, paragraphs, anchor, focus);
    if (!draft) {
      return;
    }

    onAddHighlight(draft);
    cancelSelection();
  }, [anchor, articleId, cancelSelection, focus, onAddHighlight, paragraphs]);

  useImperativeHandle(ref, () => ({ saveHighlight, cancelSelection }), [
    cancelSelection,
    saveHighlight,
  ]);

  const openHighlight = useCallback((highlightId: string) => {
    if (selecting) {
      return;
    }
    setActiveHighlightId(highlightId);
  }, [selecting]);

  return (
    <>
      {selecting ? (
        <Text style={[styles.selectionHint, { color: metaColor }]}>
          Tap the first and last word, then press Highlight
        </Text>
      ) : highlights.length > 0 ? (
        <Text style={[styles.selectionHint, { color: metaColor }]}>
          Long-press a word to highlight · tap a highlight to manage
        </Text>
      ) : (
        <Text style={[styles.selectionHint, { color: metaColor }]}>
          Long-press a word to highlight
        </Text>
      )}

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
            onBeginSelection={beginSelection}
            onUpdateFocus={updateFocus}
            onOpenHighlight={openHighlight}
          />
        ))}
      </View>

      <HighlightActionsSheet
        highlight={activeHighlight}
        visible={activeHighlight !== null}
        onClose={() => setActiveHighlightId(null)}
        onRemove={onRemoveHighlight}
      />
    </>
  );
});

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
  onBeginSelection: (pointer: WordPointer) => void;
  onUpdateFocus: (pointer: WordPointer) => void;
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
  onBeginSelection,
  onUpdateFocus,
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
            onBeginSelection={onBeginSelection}
            onUpdateFocus={onUpdateFocus}
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
  onBeginSelection: (pointer: WordPointer) => void;
  onUpdateFocus: (pointer: WordPointer) => void;
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
  onBeginSelection,
  onUpdateFocus,
  onOpenHighlight,
}: WordChipProps) {
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
    selecting &&
    anchor &&
    focus &&
    isWordInSelection(pointer, anchor, focus);

  const handlePress = () => {
    if (selecting) {
      onUpdateFocus(pointer);
      return;
    }
    if (highlightId) {
      onOpenHighlight(highlightId);
    }
  };

  const handleLongPress = () => {
    onBeginSelection(pointer);
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={360}
      accessibilityRole="button"
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