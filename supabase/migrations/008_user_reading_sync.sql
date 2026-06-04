-- Per-user reading state for cross-device sync (progress, bookmarks, highlights, prefs).

create table if not exists public.user_reading_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  bookmarks jsonb not null default '{}'::jsonb,
  highlights jsonb not null default '{}'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_reading_snapshots enable row level security;

drop policy if exists "snapshots_select_own" on public.user_reading_snapshots;
create policy "snapshots_select_own"
  on public.user_reading_snapshots
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "snapshots_insert_own" on public.user_reading_snapshots;
create policy "snapshots_insert_own"
  on public.user_reading_snapshots
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "snapshots_update_own" on public.user_reading_snapshots;
create policy "snapshots_update_own"
  on public.user_reading_snapshots
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_user_reading_snapshot_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_reading_snapshots_updated_at on public.user_reading_snapshots;
create trigger user_reading_snapshots_updated_at
  before update on public.user_reading_snapshots
  for each row
  execute function public.set_user_reading_snapshot_updated_at();