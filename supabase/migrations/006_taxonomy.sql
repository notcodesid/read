-- Taxonomy for home browse: author groups (kinds of writers) and blog topics (kinds of writing).

create table if not exists public.author_groups (
  id text primary key,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_topics (
  id text primary key,
  name text not null unique,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.authors
  add column if not exists author_group_id text references public.author_groups (id);

alter table public.articles
  add column if not exists blog_topic_id text references public.blog_topics (id);

create index if not exists authors_author_group_id_idx on public.authors (author_group_id);
create index if not exists articles_blog_topic_id_idx on public.articles (blog_topic_id);

alter table public.author_groups enable row level security;
alter table public.blog_topics enable row level security;

drop policy if exists "author_groups_public_read" on public.author_groups;
create policy "author_groups_public_read"
  on public.author_groups for select to anon, authenticated using (true);

drop policy if exists "blog_topics_public_read" on public.blog_topics;
create policy "blog_topics_public_read"
  on public.blog_topics for select to anon, authenticated using (true);

-- Author kinds (expand as you add boy band, family, brand voices, etc.)
insert into public.author_groups (id, name, description, sort_order)
values
  (
    'essayists',
    'Essayists',
    'Long-form essays on ideas, startups, and how to think',
    0
  ),
  (
    'newsletters',
    'Newsletters',
    'Letters and serialized writing from individual creators',
    1
  ),
  (
    'culture',
    'Culture',
    'Music, entertainment, and cultural commentary',
    2
  ),
  (
    'family',
    'Family',
    'Parenting, relationships, and life at home',
    3
  ),
  (
    'brand',
    'Brand & business',
    'Brand building, marketing, and one-person business',
    4
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

update public.authors set author_group_id = 'essayists' where id in ('paul-graham', 'noah-zender');
update public.authors set author_group_id = 'newsletters' where id = 'dan-koe';

-- Blog topics (canonical taxonomy — synced from article categories)
insert into public.blog_topics (id, name, description, sort_order)
values
  ('knowledge-learning', 'Knowledge & Learning', null, 0),
  ('creativity-writing', 'Creativity, Craft & Writing', null, 1),
  ('product-startups', 'Product & Startups', null, 2),
  ('brand-marketing', 'Brand, Marketing & Media', null, 3),
  ('innovation-ai', 'Innovation, Technology & AI', null, 4),
  ('mental-models', 'Mental Models & Decisions', null, 5),
  ('investing-markets', 'Investing, Markets & Economics', null, 6),
  ('work-leadership', 'Work, Leadership & Relationships', null, 7),
  ('psychology-growth', 'Psychology, Identity & Growth', null, 8),
  ('philosophy', 'Philosophy & Worldviews', null, 9),
  ('letters', 'Letters', 'Personal letters on craft, creativity, and business', 10),
  ('essays', 'Essays', 'Classic startup and technology essays', 11)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

update public.articles a
set blog_topic_id = bt.id
from public.blog_topics bt
where a.blog_topic_id is null
  and a.category = bt.name;

update public.articles
set blog_topic_id = 'letters', category = 'Letters'
where blog_topic_id is null
  and author_id = 'dan-koe';

update public.articles
set blog_topic_id = 'essays', category = coalesce(category, 'Essays')
where blog_topic_id is null
  and author_id = 'paul-graham';