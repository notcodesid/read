/**
 * Upsert a single article. Example:
 * node --env-file=.env scripts/add-article.mjs --file scripts/articles/the-path-at-night.json
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
  console.error('Usage: node --env-file=.env scripts/add-article.mjs --file path/to/article.json');
  process.exit(1);
}

const article = JSON.parse(readFileSync(fileArg, 'utf8'));
const required = ['id', 'title', 'paragraphs'];
for (const key of required) {
  if (!article[key]) {
    console.error(`Missing required field: ${key}`);
    process.exit(1);
  }
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(
    `insert into public.articles (
      id, title, source, author, category, source_url, hero_image_url, paragraphs, added_at
    ) values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, coalesce($9::date, current_date))
    on conflict (id) do update set
      title = excluded.title,
      source = excluded.source,
      author = excluded.author,
      category = excluded.category,
      source_url = excluded.source_url,
      hero_image_url = excluded.hero_image_url,
      paragraphs = excluded.paragraphs,
      added_at = excluded.added_at`,
    [
      article.id,
      article.title,
      article.source ?? null,
      article.author ?? null,
      article.category ?? null,
      article.source_url ?? null,
      article.hero_image_url ?? null,
      JSON.stringify(article.paragraphs),
      article.added_at ?? null,
    ],
  );
  console.log(`Saved article: ${article.id} — ${article.title}`);
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}