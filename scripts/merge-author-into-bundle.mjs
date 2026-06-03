/**
 * Upsert one author into src/data/authors.json
 * node scripts/merge-author-into-bundle.mjs scripts/authors/andrew-bosworth.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const authorsPath = join(__dirname, '../src/data/authors.json');

const fileArg = process.argv.find((a) => a.endsWith('.json'));
const author = JSON.parse(readFileSync(fileArg, 'utf8'));
const authors = JSON.parse(readFileSync(authorsPath, 'utf8'));

const index = authors.findIndex((row) => row.id === author.id);
const row = {
  id: author.id,
  name: author.name,
  tagline: author.tagline ?? null,
  site_url: author.site_url ?? null,
  sort_order: author.sort_order ?? 0,
  author_group_id: author.author_group_id ?? null,
};

if (index >= 0) {
  authors[index] = row;
} else {
  authors.push(row);
}

authors.sort((a, b) => a.sort_order - b.sort_order);
writeFileSync(authorsPath, JSON.stringify(authors));
console.log(`Merged author ${author.id}`);