import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbUrl = process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error('Missing SUPABASE_DB_URL in .env');
  process.exit(1);
}

const migrationsDir = join(__dirname, '../supabase/migrations');
const migrationFiles = readdirSync(migrationsDir)
  .filter((name) => name.endsWith('.sql'))
  .sort();

const seed = {
  id: 'channel-capacity',
  title: 'Channel Capacity',
  source: 'Essay',
  author: 'Information theory',
  added_at: '2026-06-03',
  paragraphs: [
    'In information theory, channel capacity represents an absolute ceiling—the maximum amount of information that can be reliably transmitted through any communication channel.',
    'Dr. Claude Shannon, the father of information theory, proved this limit is fundamental and inviolable. What makes channel capacity so definitive is that it accounts for all possible encoding schemes. "There is no argument that more information can be sent reliably than the channel capacity permits," Richard Hamming explains, because the definition itself includes maximization across all potential encoding methods.',
    'This concept applies universally, from digital communications to biological systems. Like trying to pour a gallon of water into a half-gallon container, attempting to exceed channel capacity doesn\'t result in more efficient transmission—it results in information loss.',
    'The elegance of this principle lies in its finality: no clever engineering can circumvent this mathematical boundary.',
  ],
};

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();

  for (const file of migrationFiles) {
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    await client.query(sql);
    console.log(`Applied ${file}`);
  }

  await client.query(
    `insert into public.articles (id, title, source, author, paragraphs, added_at)
     values ($1, $2, $3, $4, $5::jsonb, $6::date)
     on conflict (id) do update set
       title = excluded.title,
       source = excluded.source,
       author = excluded.author,
       paragraphs = excluded.paragraphs,
       added_at = excluded.added_at`,
    [seed.id, seed.title, seed.source, seed.author, JSON.stringify(seed.paragraphs), seed.added_at],
  );

  const { rows } = await client.query(
    'select id, title from public.articles order by added_at desc limit 5',
  );
  console.log(`Setup complete. Sample articles (${rows.length} shown):`);
  for (const row of rows) {
    console.log(`  - ${row.id}: ${row.title}`);
  }
} catch (err) {
  console.error('Setup failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}