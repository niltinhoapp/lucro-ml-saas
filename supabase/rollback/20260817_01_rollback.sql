-- Lucro ML — ROLLBACK específico de 20260817_01_cleanup_updated_at.sql
--
-- STATUS: NÃO EXECUTAR AGORA. Só usar se a migration 01 precisar ser
-- revertida depois de aplicada em produção.
--
-- ==========================================================================
-- FIDELIDADE CONFIRMADA — pre-check real rodado em produção em 17/08/2026
-- ==========================================================================
-- supabase/audit/20260817_01_pre_check.sql foi executado contra produção
-- (rkxexvstpatmetaoypgb) via `supabase db query --linked` ANTES de aplicar
-- a migration 01. Saída completa arquivada em
-- supabase/audit/20260817_01_pre_check_output.md. Todos os bindings
-- abaixo vêm dessa captura real (pg_get_triggerdef / pg_get_functiondef),
-- não de suposição.
--
-- Confirmado por captura real:
--   - catalog_ai_cache.trg_set_updated_at_catalog_ai_cache  -> set_updated_at_catalog_ai_cache()
--   - catalog_item_analysis.trg_catalog_item_analysis_updated_at -> set_updated_at()
--   - catalog_runs.trg_catalog_runs_updated_at -> set_updated_at()
--   - ml_connections.trg_ml_connections_set_updated_at -> set_updated_at()
--   - ml_connections.trg_ml_connections_updated_at -> set_updated_at()
--   - subscriptions.update_subscriptions_updated_at -> update_updated_at_column()
--     (DIVERGIU da suposição original deste arquivo, que era set_updated_at();
--     corrigido abaixo com o binding real)
--   - supplier_catalog_items.trg_supplier_catalog_items_updated_at -> set_updated_at()
--   - supplier_catalogs.trg_supplier_catalogs_updated_at -> set_updated_at()
--
-- Os corpos das 3 funções (set_updated_at, set_updated_at_catalog_ai_cache,
-- update_updated_at_column) foram capturados e são LITERALMENTE idênticos
-- (new.updated_at = now(); return new;) — confirmando que a suposição de
-- equivalência funcional estava correta. Os corpos abaixo usam o texto
-- real capturado.
-- ==========================================================================
--
-- Este rollback NÃO altera dados, RLS, policies, índices ou colunas —
-- apenas funções e triggers, espelhando o escopo da migration 01.

begin;

-- 1. Recria as duas funções redundantes com o corpo assumido-equivalente
--    (ver aviso acima). Idempotente via CREATE OR REPLACE.
create or replace function public.set_updated_at_catalog_ai_cache()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- set_updated_at() não precisa ser recriada — a migration 01 não altera
-- sua definição (o corpo já era e continua sendo o idioma canônico).
-- Recriar aqui de qualquer forma, por idempotência/clareza.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- 2. Restaura os 5 triggers de tabela única para os bindings confirmados
--    pelo pre-check real (ver aviso acima).
drop trigger if exists trg_catalog_item_analysis_updated_at on public.catalog_item_analysis;
create trigger trg_catalog_item_analysis_updated_at
  before update on public.catalog_item_analysis
  for each row
  execute function public.set_updated_at();

drop trigger if exists trg_catalog_runs_updated_at on public.catalog_runs;
create trigger trg_catalog_runs_updated_at
  before update on public.catalog_runs
  for each row
  execute function public.set_updated_at();

-- subscriptions: binding real confirmado é update_updated_at_column(),
-- NÃO set_updated_at() (corrigido após o pre-check real de 17/08/2026).
drop trigger if exists update_subscriptions_updated_at on public.subscriptions;
create trigger update_subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists trg_supplier_catalog_items_updated_at on public.supplier_catalog_items;
create trigger trg_supplier_catalog_items_updated_at
  before update on public.supplier_catalog_items
  for each row
  execute function public.set_updated_at();

drop trigger if exists trg_supplier_catalogs_updated_at on public.supplier_catalogs;
create trigger trg_supplier_catalogs_updated_at
  before update on public.supplier_catalogs
  for each row
  execute function public.set_updated_at();

-- 3. Restaura catalog_ai_cache para o binding confirmado pelo pre-check
--    real (set_updated_at_catalog_ai_cache()).
drop trigger if exists trg_set_updated_at_catalog_ai_cache on public.catalog_ai_cache;
create trigger trg_set_updated_at_catalog_ai_cache
  before update on public.catalog_ai_cache
  for each row
  execute function public.set_updated_at_catalog_ai_cache();

-- 4. Restaura ml_connections para os DOIS triggers duplicados originais
--    (binding confirmado pelo pre-check real — ambos chamavam set_updated_at()).
drop trigger if exists trg_ml_connections_set_updated_at on public.ml_connections;
create trigger trg_ml_connections_set_updated_at
  before update on public.ml_connections
  for each row
  execute function public.set_updated_at();

drop trigger if exists trg_ml_connections_updated_at on public.ml_connections;
create trigger trg_ml_connections_updated_at
  before update on public.ml_connections
  for each row
  execute function public.set_updated_at();

commit;
