import assert from 'node:assert/strict';

import {
  buildContinueReadingItems,
  continueReadingSubtitle,
  hasResumePosition,
  SCROLL_RESUME_THRESHOLD,
} from '../src/lib/continue-reading-core.ts';

const summaryById = new Map([
  ['a1', { title: 'Alpha', authorId: 'author-1', category: 'Essay' }],
  ['a2', { title: 'Beta', authorId: 'author-1', category: 'Essay' }],
]);
const authorNameById = new Map([['author-1', 'Ada']]);

const store = {
  articles: { a2: { completedAt: '2026-06-01T00:00:00.000Z' } },
  themes: {},
  scrollPositions: {
    a1: { offsetY: 120, updatedAt: '2026-06-04T12:00:00.000Z' },
    a2: { offsetY: 400, updatedAt: '2026-06-04T13:00:00.000Z' },
    missing: { offsetY: 50, updatedAt: '2026-06-04T11:00:00.000Z' },
  },
};

assert.equal(hasResumePosition(SCROLL_RESUME_THRESHOLD - 1), false);
assert.equal(hasResumePosition(SCROLL_RESUME_THRESHOLD), true);
assert.equal(continueReadingSubtitle(0), 'Continue reading');
assert.equal(continueReadingSubtitle(SCROLL_RESUME_THRESHOLD), 'Pick up where you left off');

const items = buildContinueReadingItems(store, summaryById, authorNameById, 12);
assert.equal(items.length, 1);
assert.equal(items[0].articleId, 'a1');
assert.equal(items[0].authorName, 'Ada');
assert.equal(items[0].offsetY, 120);

console.log('continue-reading tests passed');