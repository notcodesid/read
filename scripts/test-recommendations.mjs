import assert from 'node:assert/strict';

import { buildForYouRecommendations } from '../src/lib/recommendations-core.ts';

const candidates = [
  { id: 'a1', title: 'Alpha', authorId: 'noah', category: 'Essay' },
  { id: 'a2', title: 'Beta', authorId: 'noah', category: 'Essay' },
  { id: 'a3', title: 'Gamma', authorId: 'noah', category: 'Essay' },
  { id: 'b1', title: 'Delta', authorId: 'paul', category: 'Ideas' },
  { id: 'b2', title: 'Epsilon', authorId: 'paul', category: 'Ideas' },
];

const authorNameById = new Map([
  ['noah', 'Noah'],
  ['paul', 'Paul'],
]);

const progress = {
  articles: { a1: { completedAt: '2026-06-01T00:00:00.000Z' } },
  themes: {},
  scrollPositions: {},
  recentOpens: {
    a1: { openedAt: '2026-06-04T12:00:00.000Z' },
  },
};

const bookmarks = { bookmarks: {} };

const themed = buildForYouRecommendations(candidates, authorNameById, progress, bookmarks, 8);
assert.ok(themed.some((item) => item.reason === 'theme'));
assert.ok(themed.every((item) => item.articleId !== 'a1'));
assert.equal(themed.find((item) => item.articleId === 'a1'), undefined);

const cold = buildForYouRecommendations(candidates, authorNameById, {
  articles: {},
  themes: {},
  scrollPositions: {},
  recentOpens: {},
}, bookmarks, 4);
assert.equal(cold.length, 2);
assert.ok(cold.every((item) => item.reason === 'discover'));

console.log('recommendations tests passed');