insert into public.authors (id, name, tagline, site_url, sort_order)
values (
  'paul-graham',
  'Paul Graham',
  'Essays on startups, technology, and how to do great work',
  'https://paulgraham.com',
  0
)
on conflict (id) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  site_url = excluded.site_url,
  sort_order = excluded.sort_order;

update public.authors set sort_order = 1 where id = 'noah-zender';
update public.authors set sort_order = 2 where id = 'dan-koe';