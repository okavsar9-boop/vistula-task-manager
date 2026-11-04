-- Run once in Supabase: SQL Editor -> New query -> Run
create table if not exists public.tasks (
  id          bigint generated always as identity primary key,
  title       text not null,
  description text,
  completed   boolean not null default false
);

alter table public.tasks enable row level security;

-- Demo-only public policies (test data only, no authentication)
create policy "tasks_select" on public.tasks for select to anon using (true);
create policy "tasks_insert" on public.tasks for insert to anon with check (true);
create policy "tasks_update" on public.tasks for update to anon using (true) with check (true);
create policy "tasks_delete" on public.tasks for delete to anon using (true);

grant select, insert, update, delete on public.tasks to anon;
