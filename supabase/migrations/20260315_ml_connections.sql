create table if not exists public.ml_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ml_user_id bigint not null,
  nickname text,
  email text,
  site_id text,
  access_token text not null,
  refresh_token text,
  scope text,
  token_expires_at timestamptz not null,
  raw_profile jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id),
  unique (ml_user_id)
);

alter table public.ml_connections enable row level security;

drop policy if exists "ml_connections_select_own" on public.ml_connections;
create policy "ml_connections_select_own"
  on public.ml_connections
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "ml_connections_insert_own" on public.ml_connections;
create policy "ml_connections_insert_own"
  on public.ml_connections
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "ml_connections_update_own" on public.ml_connections;
create policy "ml_connections_update_own"
  on public.ml_connections
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
