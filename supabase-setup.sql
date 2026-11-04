-- Run this in Supabase → SQL Editor (demonstration project, test data only)

create table if not exists public.tasks (
  id          bigint generated always as identity primary key,
  title       text not null,
  description text,
  completed   boolean not null default false
);

alter table public.tasks enable row level security;

-- Public demo policies (no authentication in this introductory exercise)
drop policy if exists "public read"   on public.tasks;
drop policy if exists "public insert" on public.tasks;
drop policy if exists "public update" on public.tasks;
drop policy if exists "public delete" on public.tasks;

create policy "public read"   on public.tasks for select to anon using (true);
create policy "public insert" on public.tasks for insert to anon with check (true);
create policy "public update" on public.tasks for update to anon using (true) with check (true);
create policy "public delete" on public.tasks for delete to anon using (true);

-- Optional seed data
insert into public.tasks (title, description, completed) values
  ('Learn Git', 'Practice Git commands', false),
  ('Deploy to GitHub Pages', 'Publish from the root of main', false);
