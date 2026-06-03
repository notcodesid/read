-- Articles library for the read app

create table if not exists public.articles (
  id text primary key,
  title text not null,
  source text,
  author text,
  paragraphs jsonb not null default '[]'::jsonb,
  added_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.articles enable row level security;

drop policy if exists "articles_public_read" on public.articles;
create policy "articles_public_read"
  on public.articles
  for select
  to anon, authenticated
  using (true);