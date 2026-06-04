import assert from 'node:assert/strict';

import { localDateKey, pickDailyArticleId } from '../src/lib/daily-pick-core.ts';

const ids = ['a', 'b', 'c', 'd', 'e'];
const excluded = new Set(['a']);

assert.equal(pickDailyArticleId(ids, '2026-06-04', excluded), pickDailyArticleId(ids, '2026-06-04', excluded));
assert.equal(pickDailyArticleId(ids, '2026-06-05', excluded), pickDailyArticleId(ids, '2026-06-05', excluded));
assert.notEqual(
  pickDailyArticleId(ids, '2026-06-04', excluded),
  pickDailyArticleId(ids, '2026-06-05', excluded),
);

const preferred = pickDailyArticleId(ids, '2026-06-04', excluded, ['c', 'e']);
assert.ok(preferred === 'c' || preferred === 'e');

assert.equal(localDateKey(new Date('2026-06-04T22:00:00')), '2026-06-04');

console.log('daily-pick tests passed');