alter table public.articles
  add column if not exists category text,
  add column if not exists source_url text;

create index if not exists articles_category_idx on public.articles (category);