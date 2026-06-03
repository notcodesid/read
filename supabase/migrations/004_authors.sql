create table if not exists public.authors (
  id text primary key,
  name text not null,
  tagline text,
  site_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.authors enable row level security;

drop policy if exists "authors_public_read" on public.authors;
create policy "authors_public_read"
  on public.authors
  for select
  to anon, authenticated
  using (true);

alter table public.articles
  add column if not exists author_id text references public.authors (id);

create index if not exists articles_author_id_idx on public.articles (author_id);

insert into public.authors (id, name, tagline, site_url, sort_order)
values
  (
    'noah-zender',
    'Noah Zender',
    'Ideas on learning, creativity, and building',
    'https://www.noahzender.com/ideas',
    1
  ),
  (
    'dan-koe',
    'Dan Koe',
    'Letters on creativity, writing, and one-person business',
    'https://letters.thedankoe.com',
    2
  )
on conflict (id) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  site_url = excluded.site_url,
  sort_order = excluded.sort_order;

update public.articles
set author_id = 'noah-zender'
where author_id is null
  and (source = 'Noah Zender' or author = 'Noah Zender');

update public.articles
set author_id = 'dan-koe',
    category = case when category = 'Saved' then 'Letters' else category end
where author_id is null
  and (source = 'Dan Koe' or author = 'Dan Koe');