/**
 * Append one article JSON into bundled summaries + articles (offline library).
 * bun run merge:bundle -- scripts/articles/traits-i-value.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../src/data');

const fileArg = process.argv.find((a) => a.endsWith('.json') && a.includes('articles/'));
if (!fileArg) {
  console.error('Usage: node scripts/merge-article-into-bundle.mjs scripts/articles/your.json');
  process.exit(1);
}

const article = JSON.parse(readFileSync(fileArg, 'utf8'));
const summariesPath = join(dataDir, 'article-summaries.json');
const articlesPath = join(dataDir, 'articles.json');

const summaries = JSON.parse(readFileSync(summariesPath, 'utf8'));
const articles = JSON.parse(readFileSync(articlesPath, 'utf8'));

const summary = {
  id: article.id,
  title: article.title,
  author_id: article.author_id,
  category: article.category ?? null,
};

const summaryIndex = summaries.findIndex((row) => row.id === article.id);
if (summaryIndex >= 0) {
  summaries[summaryIndex] = summary;
} else {
  summaries.push(summary);
}

const articleIndex = articles.findIndex((row) => row.id === article.id);
const full = {
  id: article.id,
  title: article.title,
  author_id: article.author_id,
  category: article.category ?? null,
  source: article.source ?? null,
  author: article.author ?? null,
  source_url: article.source_url ?? null,
  hero_image_url: article.hero_image_url ?? null,
  paragraphs: article.paragraphs,
};

if (articleIndex >= 0) {
  articles[articleIndex] = full;
} else {
  articles.push(full);
}

writeFileSync(summariesPath, JSON.stringify(summaries));
writeFileSync(articlesPath, JSON.stringify(articles));
console.log(`Merged ${article.id} into bundled library (${summaries.length} summaries)`);