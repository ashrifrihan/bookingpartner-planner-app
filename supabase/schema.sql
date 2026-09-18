-- BookingPartner Backend Planner - Supabase setup
-- Run this once in Supabase -> SQL Editor.
-- The browser uses only your public anon/publishable key.
-- Row Level Security below keeps each signed-in user's planner private.

create table if not exists public.planner_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_date date not null,
  week_number smallint not null check (week_number between 1 and 12),
  phase text not null,
  day_title text not null,
  item_index integer not null check (item_index >= 0),
  item_text text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, task_date, item_index)
);

create table if not exists public.planner_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_date date not null,
  note text not null default '',
  blocked text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, task_date)
);

create index if not exists planner_items_user_date_idx
  on public.planner_items(user_id, task_date);

create index if not exists planner_notes_user_date_idx
  on public.planner_notes(user_id, task_date);

alter table public.planner_items enable row level security;
alter table public.planner_notes enable row level security;

-- Remove old policies with the same names so this file can be re-run safely.
drop policy if exists "Users read own planner items" on public.planner_items;
drop policy if exists "Users insert own planner items" on public.planner_items;
drop policy if exists "Users update own planner items" on public.planner_items;
drop policy if exists "Users delete own planner items" on public.planner_items;
drop policy if exists "Users read own planner notes" on public.planner_notes;
drop policy if exists "Users insert own planner notes" on public.planner_notes;
drop policy if exists "Users update own planner notes" on public.planner_notes;
drop policy if exists "Users delete own planner notes" on public.planner_notes;

create policy "Users read own planner items"
on public.planner_items for select
to authenticated
using (auth.uid() = user_id);

create policy "Users insert own planner items"
on public.planner_items for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users update own planner items"
on public.planner_items for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users delete own planner items"
on public.planner_items for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users read own planner notes"
on public.planner_notes for select
to authenticated
using (auth.uid() = user_id);

create policy "Users insert own planner notes"
on public.planner_notes for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users update own planner notes"
on public.planner_notes for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users delete own planner notes"
on public.planner_notes for delete
to authenticated
using (auth.uid() = user_id);

-- Enable Postgres Changes for realtime. If a table is already in the publication,
-- Supabase/Postgres may say it already exists; that is harmless.
do $$
begin
  alter publication supabase_realtime add table public.planner_items;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.planner_notes;
exception when duplicate_object then null;
end $$;
