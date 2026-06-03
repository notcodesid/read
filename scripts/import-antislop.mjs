/**
 * Import curated essays from antislop.xyz (public Supabase) into Read.
 *
 * bun run import:antislop
 * bun run import:antislop -- --limit 6
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = join(__dirname, 'articles');
const AUTHOR_ID = 'antislop';
const SOURCE = 'antislop';
const SUPABASE_URL = 'https://kxidlcvalfxxiugaftuz.supabase.co';
const CHUNK_URL =
  'https://www.antislop.xyz/_next/static/chunks/0.28srf_hhm14.js?dpl=dpl_FbxFSFfZd7LHxBrieq7cQ7VtR6EA';

const dbUrl = process.env.SUPABASE_DB_URL;
const limitArg = process.argv.find((a) => a.startsWith('--limit'));
const LIMIT = limitArg ? Number(limitArg.split('=')[1] ?? process.argv[process.argv.indexOf('--limit') + 1]) : 6;

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripTags(html) {
  return decodeHtml(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function slugFromUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, '');
    const last = path.split('/').filter(Boolean).pop() ?? 'article';
    return last
      .replace(/\.html?$/i, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 80);
  } catch {
    return 'article';
  }
}

function extractParagraphs(html, url) {
  const host = new URL(url).hostname.replace(/^www\./, '');

  if (host === 'paulgraham.com') {
    const cell = html.match(/<td[^>]*width[^>]*>([\s\S]*?)<\/td>/i)?.[1] ?? html;
    const chunks = cell
      .split(/<br\s*\/?>\s*<br\s*\/?>/i)
      .map((s) => stripTags(s))
      .filter((t) => t.length > 40 && !/^Want to start a startup/i.test(t));
    if (chunks.length >= 3) return chunks;
  }

  if (host === 'boz.com') {
    const body =
      html.match(/class="article-body"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ??
      html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1];
    if (body) return paragraphsFromTags(body);
  }

  if (host.includes('samaltman.com')) {
    const body = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1];
    if (body) return paragraphsFromTags(body);
  }

  if (host === 'perell.com') {
    const body = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1];
    if (body) return paragraphsFromTags(body);
  }

  if (host.includes('signalvnoise.com')) {
    const body =
      html.match(/class="post-content"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ??
      html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1];
    if (body) return paragraphsFromTags(body);
  }

  if (host === 'mindingourway.com' || host === 'danluu.com' || host.includes('waitbutwhy')) {
    const body = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1];
    if (body) return paragraphsFromTags(body);
  }

  const main =
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ??
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1];
  if (main) {
    const paras = paragraphsFromTags(main);
    if (paras.length >= 2) return paras;
  }

  return paragraphsFromTags(html).filter(
    (t) => t.length > 60 && !/cookie|subscribe|newsletter/i.test(t),
  );
}

function paragraphsFromTags(block) {
  const paragraphs = [];
  const tagRegex = /<(p|blockquote|li|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match = tagRegex.exec(block);
  while (match) {
    const text = stripTags(match[2]);
    if (text.length > 25) paragraphs.push(text);
    match = tagRegex.exec(block);
  }
  return paragraphs;
}

async function getAntislopKey() {
  const js = await (await fetch(CHUNK_URL)).text();
  const key = js.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)?.[0];
  if (!key) throw new Error('Could not read antislop Supabase anon key from site bundle');
  return key;
}

async function fetchCuratedResources(key, limit) {
  const params = new URLSearchParams({
    medium: 'eq.Essay',
    select: 'id,url,title,creator,description,date_published,consumption_time,medium',
    order: 'date_featured.desc',
    limit: String(limit),
  });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/antislop_resources?${params}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`antislop_resources: HTTP ${res.status}`);
  return res.json();
}

async function fetchHighlights(key, resourceId) {
  const params = new URLSearchParams({
    resource_id: `eq.${resourceId}`,
    select: 'content,order_position',
    order: 'order_position.asc',
  });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/resource_highlights?${params}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return [];
  return res.json();
}

async function fetchArticleBody(url, fallbackDescription, highlights) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'read-app-importer/1.0' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`fetch ${url}: HTTP ${res.status}`);
  const html = await res.text();
  let paragraphs = extractParagraphs(html, url);

  if (paragraphs.length < 2 && fallbackDescription) {
    paragraphs = [fallbackDescription];
  }

  for (const h of highlights) {
    const quote = h.content?.trim();
    if (quote && !paragraphs.some((p) => p.includes(quote.slice(0, 40)))) {
      paragraphs.push(quote);
    }
  }

  if (paragraphs.length === 0) {
    throw new Error('no paragraphs extracted');
  }

  return paragraphs;
}

async function upsertAuthor(client) {
  const author = JSON.parse(readFileSync(join(__dirname, 'authors/antislop.json'), 'utf8'));
  await client.query(
    `insert into public.authors (id, name, tagline, site_url, sort_order, author_group_id)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (id) do update set
       name = excluded.name,
       tagline = excluded.tagline,
       site_url = excluded.site_url,
       sort_order = excluded.sort_order,
       author_group_id = excluded.author_group_id`,
    [
      author.id,
      author.name,
      author.tagline,
      author.site_url,
      author.sort_order,
      author.author_group_id,
    ],
  );
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  if (!dbUrl) throw new Error('Missing SUPABASE_DB_URL in .env');

  mkdirSync(ARTICLES_DIR, { recursive: true });
  const key = await getAntislopKey();
  const resources = await fetchCuratedResources(key, LIMIT);

  console.log(`Importing ${resources.length} antislop essays…\n`);

  await client.connect();
  await upsertAuthor(client);

  const saved = [];
  const failed = [];

  for (const resource of resources) {
    const id = slugFromUrl(resource.url);
    const antislopPage = `https://www.antislop.xyz/resources/${resource.id}`;

    try {
      const highlights = await fetchHighlights(key, resource.id);
      const paragraphs = await fetchArticleBody(
        resource.url,
        resource.description?.trim(),
        highlights,
      );

      const article = {
        id,
        title: resource.title,
        author_id: AUTHOR_ID,
        category: resource.medium ?? 'Essays',
        source: SOURCE,
        author: resource.creator ?? null,
        source_url: resource.url,
        hero_image_url: null,
        added_at: resource.date_published ?? new Date().toISOString().slice(0, 10),
        paragraphs,
        antislop_resource_id: resource.id,
        antislop_page_url: antislopPage,
      };

      const filePath = join(ARTICLES_DIR, `${id}.json`);
      writeFileSync(filePath, JSON.stringify(article, null, 2) + '\n');

      await client.query(
        `insert into public.articles (
          id, title, author_id, source, author, category, source_url, hero_image_url, paragraphs, added_at
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, coalesce($10::date, current_date))
        on conflict (id) do update set
          title = excluded.title,
          author_id = excluded.author_id,
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
          article.author_id,
          article.source,
          article.author,
          article.category,
          article.source_url,
          article.hero_image_url,
          JSON.stringify(article.paragraphs),
          article.added_at,
        ],
      );

      saved.push({ id, title: article.title, creator: article.author, paras: paragraphs.length });
      console.log(`  ✓ ${article.title} (${paragraphs.length} ¶) — ${resource.creator}`);
    } catch (err) {
      failed.push({ title: resource.title, message: err.message });
      console.warn(`  ✗ ${resource.title}: ${err.message}`);
    }
  }

  // Remove mistaken Andrew Bosworth shelf author
  await client.query(`delete from public.articles where id = $1`, ['traits-i-value']);
  await client.query(`delete from public.authors where id = $1`, ['andrew-bosworth']);

  console.log(`\nSaved ${saved.length} articles. Removed andrew-bosworth / old traits-i-value row.`);

  if (failed.length) {
    console.warn(`\nFailed (${failed.length}):`);
    for (const f of failed) console.warn(`  - ${f.title}: ${f.message}`);
  }

  console.log('\nNext: bun run export:authors && bun run export:summaries && bun run export:articles');
} catch (err) {
  console.error('Import failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}