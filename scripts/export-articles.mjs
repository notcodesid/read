import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

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
  .select('id, title, category, source, author, source_url, paragraphs, added_at')
  .order('id', { ascending: true });

if (error) {
  console.error(error.message);
  process.exit(1);
}

const out = join(__dirname, '../src/data/articles.json');
const json = JSON.stringify(data);
writeFileSync(out, json);
console.log(`Wrote ${data.length} articles (${(json.length / 1024).toFixed(0)} KB) to ${out}`);