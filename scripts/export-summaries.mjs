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
  .select('id, title, category')
  .order('category', { ascending: true })
  .order('title', { ascending: true });

if (error) {
  console.error(error.message);
  process.exit(1);
}

const normalized = data.map((row) => ({
  ...row,
  title: decodeHtml(row.title),
  category: row.category ? decodeHtml(row.category) : row.category,
}));

const out = join(__dirname, '../src/data/article-summaries.json');
writeFileSync(out, JSON.stringify(normalized, null, 0));
console.log(`Wrote ${data.length} summaries to ${out}`);