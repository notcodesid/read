/**
 * Export author_groups and blog_topics for offline bundle.
 * Run: node --env-file=.env scripts/export-taxonomy.mjs
 */
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
const dataDir = join(__dirname, '../src/data');

const [groupsRes, topicsRes] = await Promise.all([
  supabase.from('author_groups').select('id, name, description, sort_order').order('sort_order'),
  supabase.from('blog_topics').select('id, name, description, sort_order').order('sort_order'),
]);

if (groupsRes.error) {
  console.error('author_groups:', groupsRes.error.message);
  process.exit(1);
}

if (topicsRes.error) {
  console.error('blog_topics:', topicsRes.error.message);
  process.exit(1);
}

writeFileSync(join(dataDir, 'author-groups.json'), JSON.stringify(groupsRes.data));
writeFileSync(join(dataDir, 'blog-topics.json'), JSON.stringify(topicsRes.data));
console.log(`Wrote ${groupsRes.data.length} author groups, ${topicsRes.data.length} blog topics`);