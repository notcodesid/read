import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

function decodeHtml(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(url, key);
const { data, error } = await supabase
  .from('articles')
  .select('id, title, author_id, category, source, author, source_url, hero_image_url, paragraphs, added_at')
  .order('id', { ascending: true });

if (error) {
  console.error(error.message);
  process.exit(1);
}

const normalized = data.map((row) => ({
  ...row,
  title: decodeHtml(row.title),
  category: row.category ? decodeHtml(row.category) : row.category,
  source: row.source ? decodeHtml(row.source) : row.source,
  author: row.author ? decodeHtml(row.author) : row.author,
  paragraphs: row.paragraphs.map(decodeHtml),
}));

const out = join(__dirname, '../src/data/articles.json');
const json = JSON.stringify(normalized);
writeFileSync(out, json);
console.log(`Wrote ${normalized.length} articles (${(json.length / 1024).toFixed(0)} KB) to ${out}`);