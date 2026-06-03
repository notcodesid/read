/**
 * Build article JSON from a plain-text file (paragraphs separated by blank lines).
 * Usage: node scripts/build-article-json.mjs <input.txt> <output.json> --meta scripts/articles/meta.json
 */
import { readFileSync, writeFileSync } from 'node:fs';

const inputPath = process.argv[2];
const outputPath = process.argv[3];
const metaPath = process.argv[5];

if (!inputPath || !outputPath || !metaPath) {
  console.error(
    'Usage: node scripts/build-article-json.mjs input.txt output.json --meta meta.json',
  );
  process.exit(1);
}

const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
const raw = readFileSync(inputPath, 'utf8').replace(/\r\n/g, '\n').trim();

const paragraphs = raw
  .split(/\n\n+/)
  .map((p) => p.trim())
  .filter(Boolean);

writeFileSync(
  outputPath,
  JSON.stringify({ ...meta, paragraphs }, null, 2),
);
console.log(`Wrote ${paragraphs.length} paragraphs to ${outputPath}`);