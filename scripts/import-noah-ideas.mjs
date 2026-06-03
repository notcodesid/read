import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://www.noahzender.com';
const SOURCE = 'Noah Zender';
const CONCURRENCY = 6;
const DELAY_MS = 150;

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error('Missing SUPABASE_DB_URL in .env');
  process.exit(1);
}

const migrationSql = readFileSync(
  join(__dirname, '../supabase/migrations/002_article_category.sql'),
  'utf8',
);

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'");
}

function stripTags(html) {
  return decodeHtml(html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
}

function parseIndexHtml(html) {
  const parts = html.split(/<h3[^>]*>/i).slice(1);
  const categories = [];

  for (const part of parts) {
    const catEnd = part.indexOf('</h3>');
    if (catEnd < 0) continue;

    const category = decodeHtml(part.slice(0, catEnd).trim());
    const slugs = [
      ...new Set([...part.matchAll(/href="\/ideas\/([a-z0-9-]+)"/g)].map((m) => m[1])),
    ];

    if (category && slugs.length > 0) {
      categories.push({ category, slugs });
    }
  }

  return categories;
}

function parseProseBlock(proseBlock) {
  const paragraphs = [];
  const blockRegex = /<(p|h[2-4]|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match = blockRegex.exec(proseBlock);

  while (match) {
    const text = stripTags(match[2]);
    if (text) paragraphs.push(text);
    match = blockRegex.exec(proseBlock);
  }

  if (paragraphs.length === 0) {
    const imgAlts = [...proseBlock.matchAll(/<img[^>]*alt="([^"]*)"/gi)]
      .map((m) => stripTags(m[1]))
      .filter(Boolean);
    paragraphs.push(...imgAlts);
  }

  return paragraphs;
}

function parseArticleHtml(html) {
  const title =
    html.match(/<h1 class="page-title">([^<]*)<\/h1>/)?.[1]?.trim() ??
    html.match(/<title>([^<—]+)/)?.[1]?.trim();

  const proseBlock = html.match(/<div class="prose-site"[^>]*>([\s\S]*?)<\/div>/)?.[1];
  let paragraphs = proseBlock ? parseProseBlock(proseBlock) : [];

  if (paragraphs.length === 0) {
    const description = html.match(/name="description" content="([^"]+)"/)?.[1];
    if (description) {
      paragraphs.push(decodeHtml(description.replace(/\s*—\s*a working note.*/i, '').trim()));
    }
  }

  return { title, paragraphs };
}

async function fetchIndex() {
  const res = await fetch(`${BASE}/ideas`, {
    headers: { 'User-Agent': 'read-app-importer/1.0' },
  });
  if (!res.ok) throw new Error(`Index page: HTTP ${res.status}`);
  return res.text();
}

async function fetchArticle(slug, category) {
  const url = `${BASE}/ideas/${slug}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'read-app-importer/1.0' },
  });

  if (!res.ok) {
    throw new Error(`${slug}: HTTP ${res.status}`);
  }

  const html = await res.text();
  const { title, paragraphs } = parseArticleHtml(html);

  if (!title || paragraphs.length === 0) {
    throw new Error(`${slug}: missing title or body`);
  }

  return {
    id: slug,
    title,
    author_id: 'noah-zender',
    category,
    source: SOURCE,
    author: SOURCE,
    source_url: url,
    paragraphs,
    added_at: new Date().toISOString().slice(0, 10),
  };
}

async function runPool(tasks, concurrency) {
  const results = [];
  let index = 0;
  let completed = 0;
  const total = tasks.length;
  const errors = [];

  async function worker() {
    while (index < tasks.length) {
      const current = index++;
      const task = tasks[current];
      try {
        results[current] = await task();
        completed++;
        if (completed % 25 === 0 || completed === total) {
          process.stdout.write(`\r  fetched ${completed}/${total}`);
        }
      } catch (err) {
        errors.push({ index: current, message: err.message });
      }
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  process.stdout.write('\n');

  return { articles: results.filter(Boolean), errors };
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(migrationSql);

  console.log('Fetching idea index…');
  const indexHtml = await fetchIndex();
  const categories = parseIndexHtml(indexHtml);
  const totalSlugs = categories.reduce((n, c) => n + c.slugs.length, 0);

  console.log(`Found ${categories.length} categories, ${totalSlugs} ideas:\n`);
  for (const { category, slugs } of categories) {
    console.log(`  ${category}: ${slugs.length}`);
  }

  const tasks = [];
  for (const { category, slugs } of categories) {
    for (const slug of slugs) {
      tasks.push(() => fetchArticle(slug, category));
    }
  }

  console.log(`\nFetching articles (${CONCURRENCY} at a time)…`);
  const { articles, errors } = await runPool(tasks, CONCURRENCY);

  if (errors.length > 0) {
    console.warn(`\nWarning: ${errors.length} articles could not be fetched:`);
    for (const err of errors.slice(0, 10)) {
      console.warn(`  - ${err.message}`);
    }
    if (errors.length > 10) {
      console.warn(`  … and ${errors.length - 10} more`);
    }
  }

  if (articles.length === 0) {
    throw new Error('No articles fetched');
  }

  console.log(`\nSaving ${articles.length} articles to Supabase…`);
  await client.query('begin');
  await client.query('delete from public.articles where source = $1', [SOURCE]);

  for (const article of articles) {
    await client.query(
      `insert into public.articles (
        id, title, author_id, source, author, category, source_url, paragraphs, added_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::date)
      on conflict (id) do update set
        title = excluded.title,
        author_id = excluded.author_id,
        source = excluded.source,
        author = excluded.author,
        category = excluded.category,
        source_url = excluded.source_url,
        paragraphs = excluded.paragraphs,
        added_at = excluded.added_at`,
      [
        article.id,
        article.title,
        article.author_id,
        article.source,
        article.author,
        article.category,
        article.source_url,
        JSON.stringify(article.paragraphs),
        article.added_at,
      ],
    );
  }

  await client.query('commit');

  const { rows } = await client.query(
    `select category, count(*)::int as count
     from public.articles
     group by category
     order by category`,
  );

  console.log('\nDone.');
  let sum = 0;
  for (const row of rows) {
    console.log(`  ${row.category}: ${row.count}`);
    sum += row.count;
  }
  console.log(`  Total: ${sum}`);
} catch (err) {
  await client.query('rollback').catch(() => {});
  console.error('\nImport failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}