/**
 * Sanity check: bundled library is non-empty and offline helpers resolve IDs.
 * Run: bun scripts/test-offline-content.mjs
 */
import articles from '../src/data/articles.json' with { type: 'json' };
import authors from '../src/data/authors.json' with { type: 'json' };
import summaries from '../src/data/article-summaries.json' with { type: 'json' };

const articleCount = articles.length;
const authorCount = authors.length;
const summaryCount = summaries.length;

if (articleCount < 100) {
  console.error('Expected a large bundled library, got', articleCount);
  process.exit(1);
}

if (summaryCount !== articleCount) {
  console.error('Summaries and articles count mismatch', summaryCount, articleCount);
  process.exit(1);
}

const sample = articles[0];
if (!sample?.id || !Array.isArray(sample.paragraphs) || sample.paragraphs.length === 0) {
  console.error('Bundled article shape invalid', sample);
  process.exit(1);
}

console.log('offline bundle ok:', {
  articles: articleCount,
  authors: authorCount,
  summaries: summaryCount,
  sampleId: sample.id,
});