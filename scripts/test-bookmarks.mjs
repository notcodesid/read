import assert from 'node:assert/strict';

import {
  buildReadLaterItems,
  isArticleBookmarked,
  readLaterSubtitle,
} from '../src/lib/bookmarks-core.ts';

const summaryById = new Map([
  ['a1', { title: 'Alpha', authorId: 'author-1', category: 'Essay' }],
  ['a2', { title: 'Beta', authorId: 'author-1', category: 'Ideas' }],
]);
const authorNameById = new Map([['author-1', 'Ada']]);

const store = {
  bookmarks: {
    a1: { savedAt: '2026-06-04T12:00:00.000Z' },
    a2: { savedAt: '2026-06-04T13:00:00.000Z' },
    missing: { savedAt: '2026-06-04T11:00:00.000Z' },
  },
};

assert.equal(isArticleBookmarked(store, 'a1'), true);
assert.equal(isArticleBookmarked(store, 'x'), false);

const items = buildReadLaterItems(store, { a1: {} }, summaryById, authorNameById, 10);
assert.equal(items.length, 2);
assert.equal(items[0].articleId, 'a2');
assert.equal(items[0].completed, false);
assert.equal(items[1].articleId, 'a1');
assert.equal(items[1].completed, true);
assert.equal(readLaterSubtitle(items[1]), 'Read');
assert.equal(readLaterSubtitle(items[0]), 'Ideas');

console.log('bookmarks tests passed');