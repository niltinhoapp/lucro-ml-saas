alter table public.ml_connections
  rename column nickname to ml_nickname;

alter table public.ml_connections
  rename column token_expires_at to expires_at;

alter table public.ml_connections
  add column if not exists token_type text,
  add column if not exists connected_at timestamptz,
  add column if not exists is_active boolean not null default true;

update public.ml_connections
set
  connected_at = coalesce(connected_at, created_at),
  token_type = coalesce(token_type, 'Bearer'),
  is_active = coalesce(is_active, true)
where connected_at is null
   or token_type is null;