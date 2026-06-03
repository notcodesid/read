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
  .select('id, title, category')
  .order('category', { ascending: true })
  .order('title', { ascending: true });

if (error) {
  console.error(error.message);
  process.exit(1);
}

const out = join(__dirname, '../src/data/article-summaries.json');
writeFileSync(out, JSON.stringify(data, null, 0));
console.log(`Wrote ${data.length} summaries to ${out}`);