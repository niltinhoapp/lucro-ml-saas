create extension if not exists pgcrypto;

create table if not exists public.radar_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  site_id text not null default 'MLB',
  category_id text,
  category_name text,
  demand_score integer,
  competition_score integer,
  opportunity_score integer,
  active_listings integer,
  unique_sellers integer,
  avg_price numeric(12,2),
  top_opportunity jsonb,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists radar_searches_user_created_idx
  on public.radar_searches (user_id, created_at desc);

create table if not exists public.radar_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  title text not null,
  price numeric(12,2) not null default 0,
  opportunity_score integer not null default 0,
  sold_quantity integer not null default 0,
  competition_level text not null default 'média',
  permalink text,
  shipping text not null default 'a validar',
  created_at timestamptz not null default now(),
  unique(user_id, keyword)
);

create index if not exists radar_favorites_user_created_idx
  on public.radar_favorites (user_id, created_at desc);

alter table public.radar_searches enable row level security;
alter table public.radar_favorites enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'radar_searches' and policyname = 'Users can read own radar searches'
  ) then
    create policy "Users can read own radar searches"
      on public.radar_searches
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'radar_searches' and policyname = 'Users can insert own radar searches'
  ) then
    create policy "Users can insert own radar searches"
      on public.radar_searches
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'radar_favorites' and policyname = 'Users can read own radar favorites'
  ) then
    create policy "Users can read own radar favorites"
      on public.radar_favorites
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'radar_favorites' and policyname = 'Users can insert own radar favorites'
  ) then
    create policy "Users can insert own radar favorites"
      on public.radar_favorites
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'radar_favorites' and policyname = 'Users can update own radar favorites'
  ) then
    create policy "Users can update own radar favorites"
      on public.radar_favorites
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'radar_favorites' and policyname = 'Users can delete own radar favorites'
  ) then
    create policy "Users can delete own radar favorites"
      on public.radar_favorites
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;
