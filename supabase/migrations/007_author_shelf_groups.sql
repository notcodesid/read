-- Home shelf categories for authors (how you group writers, not article topics).

insert into public.author_groups (id, name, description, sort_order)
values
  ('new-chapters', 'New chapters', 'Serial chapters and ongoing series', 0),
  ('essay', 'Essay', 'Long-form essays', 1),
  ('general-ideas', 'General ideas', 'Short ideas and notes', 2),
  ('not-creative', 'Not creative', 'Everything else — not the creative shelf', 3)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

update public.authors set author_group_id = 'essay' where id = 'paul-graham';
update public.authors set author_group_id = 'general-ideas' where id = 'noah-zender';
update public.authors set author_group_id = 'new-chapters' where id = 'dan-koe';

delete from public.author_groups
where id in ('essayists', 'newsletters', 'culture', 'family', 'brand');