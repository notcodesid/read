/**
 * Add or update an author and assign a home shelf group.
 *
 * bun run add:author -- --file scripts/authors/example.json
 *
 * author_group_id: new-chapters | essay | general-ideas | not-creative
 */
import { readFileSync } from 'node:fs';
import pg from 'pg';

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error('Missing SUPABASE_DB_URL in .env');
  process.exit(1);
}

const fileArg = process.argv.find((a) => a.endsWith('.json'));
if (!fileArg) {
  console.error('Usage: bun run add:author -- --file scripts/authors/your-author.json');
  process.exit(1);
}

const author = JSON.parse(readFileSync(fileArg, 'utf8'));
const required = ['id', 'name', 'author_group_id'];
for (const key of required) {
  if (!author[key]) {
    console.error(`Missing required field: ${key}`);
    process.exit(1);
  }
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(
    `insert into public.authors (id, name, tagline, site_url, sort_order, author_group_id)
     values ($1, $2, $3, $4, coalesce($5, 0), $6)
     on conflict (id) do update set
       name = excluded.name,
       tagline = excluded.tagline,
       site_url = excluded.site_url,
       sort_order = excluded.sort_order,
       author_group_id = excluded.author_group_id`,
    [
      author.id,
      author.name,
      author.tagline ?? null,
      author.site_url ?? null,
      author.sort_order ?? 0,
      author.author_group_id,
    ],
  );
  console.log(`Saved author: ${author.id} → shelf "${author.author_group_id}"`);
  console.log('Then: bun run export:authors && bun run export:taxonomy');
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}