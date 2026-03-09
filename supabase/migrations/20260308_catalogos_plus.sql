-- Catálogos PLUS + base de planos PRO/PLUS

alter table if exists public.profiles
  add column if not exists plan text default 'free';

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null default 'mercadopago',
  provider_id text,
  payer_email text,
  plan text,
  status text,
  init_point text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_user_provider_idx
  on public.subscriptions (user_id, provider);

create unique index if not exists subscriptions_provider_id_idx
  on public.subscriptions (provider_id)
  where provider_id is not null;

create table if not exists public.supplier_catalogs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  workspace_id uuid,
  title text not null,
  file_name text,
  status text not null default 'structured',
  summary_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists supplier_catalogs_user_idx
  on public.supplier_catalogs (user_id, created_at desc);

create table if not exists public.supplier_catalog_items (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.supplier_catalogs(id) on delete cascade,
  product_name text not null,
  raw_line text,
  supplier_cost numeric(12,2),
  brand text,
  category text,
  ml_price_avg numeric(12,2),
  estimated_margin numeric(8,2),
  estimated_profit numeric(12,2),
  demand_score integer,
  competition_score integer,
  opportunity_score integer,
  risk_level text,
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists supplier_catalog_items_catalog_idx
  on public.supplier_catalog_items (catalog_id, opportunity_score desc);
