create table if not exists public.boards (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.boards enable row level security;

create policy "Allow anon board reads"
on public.boards
for select
to anon
using (true);

create policy "Allow anon board creates"
on public.boards
for insert
to anon
with check (true);

create policy "Allow anon board updates"
on public.boards
for update
to anon
using (true)
with check (true);
