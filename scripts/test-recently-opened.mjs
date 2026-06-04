import assert from 'node:assert/strict';

import {
  buildRecentlyOpenedItems,
  formatOpenedAgo,
  recentlyOpenedSubtitle,
} from '../src/lib/recently-opened-core.ts';

const summaryById = new Map([
  ['a1', { title: 'Alpha', authorId: 'author-1', category: 'Essay' }],
  ['a2', { title: 'Beta', authorId: 'author-1', category: 'Essay' }],
]);
const authorNameById = new Map([['author-1', 'Ada']]);

const now = Date.parse('2026-06-04T15:00:00.000Z');
assert.equal(formatOpenedAgo('2026-06-04T14:59:30.000Z', now), 'Just now');
assert.equal(formatOpenedAgo('2026-06-04T14:30:00.000Z', now), '30m ago');
assert.equal(formatOpenedAgo('2026-06-03T15:00:00.000Z', now), '1d ago');

const store = {
  articles: { a2: { completedAt: '2026-06-01T00:00:00.000Z' } },
  themes: {},
  scrollPositions: {},
  recentOpens: {
    a1: { openedAt: '2026-06-04T12:00:00.000Z' },
    a2: { openedAt: '2026-06-04T13:00:00.000Z' },
    missing: { openedAt: '2026-06-04T11:00:00.000Z' },
  },
};

const items = buildRecentlyOpenedItems(store, summaryById, authorNameById, 10);
assert.equal(items.length, 2);
assert.equal(items[0].articleId, 'a2');
assert.equal(items[0].completed, true);
assert.equal(recentlyOpenedSubtitle(items[0]), 'Finished');
assert.equal(items[1].articleId, 'a1');
assert.equal(items[1].completed, false);

console.log('recently-opened tests passed');