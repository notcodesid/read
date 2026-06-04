import { useCallback, useEffect, useState } from 'react';

import {
  addHighlight as persistHighlight,
  loadHighlights,
  removeHighlight as persistRemoveHighlight,
  updateHighlight as persistUpdateHighlight,
} from '@/lib/highlights-storage';
import type { Highlight } from '@/types/highlight';

export function useHighlights(articleId: string | undefined) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!articleId) {
      setHighlights([]);
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    loadHighlights(articleId).then((items) => {
      if (!cancelled) {
        setHighlights(items);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  const addHighlight = useCallback(async (highlight: Highlight) => {
    const next = await persistHighlight(highlight);
    setHighlights(next);
    return highlight;
  }, []);

  const removeHighlight = useCallback(async (highlightId: string) => {
    if (!articleId) {
      return;
    }
    const next = await persistRemoveHighlight(articleId, highlightId);
    setHighlights(next);
  }, [articleId]);

  const updateHighlight = useCallback(
    async (highlightId: string, patch: Partial<Pick<Highlight, 'color' | 'label' | 'note'>>) => {
      if (!articleId) {
        return;
      }
      const next = await persistUpdateHighlight(articleId, highlightId, patch);
      setHighlights(next);
    },
    [articleId],
  );

  return { highlights, ready, addHighlight, removeHighlight, updateHighlight };
}