import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key);

const { data, error } = await supabase
  .from('articles')
  .select('id, title')
  .order('added_at', { ascending: false });

if (error) {
  console.error('Connection failed:', error.message);
  process.exit(1);
}

console.log(`Connected. ${data.length} article(s):`);
for (const row of data) {
  console.log(`  - ${row.id}: ${row.title}`);
}