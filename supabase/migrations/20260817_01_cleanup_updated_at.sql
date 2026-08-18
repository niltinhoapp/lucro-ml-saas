-- Saneamento 1/3 — consolidação de triggers/funções de updated_at
-- Branch: chore/supabase-schema-sync-2026-08-17
-- Baseado em: docs/SUPABASE_SCHEMA_SYNC.md, docs/SUPABASE_CLEANUP_PLAN.md,
--             supabase/baseline/2026-08-17-production-baseline.md
--
-- NÃO EXECUTAR CONTRA PRODUÇÃO SEM VALIDAÇÃO PRÉVIA EM AMBIENTE SEPARADO.
-- Esta migration é forward-only, idempotente e conservadora:
--   - NÃO remove tabelas
--   - NÃO altera dados
--   - NÃO altera policies de RLS
--   - NÃO altera índices
--   - Consolida apenas triggers/funções de manutenção de `updated_at`
--
-- Contexto (confirmado no inventário de produção):
--   Funções equivalentes hoje coexistindo: set_updated_at(), set_updated_at_catalog_ai_cache(),
--   update_updated_at_column().
--   ml_connections possui DOIS triggers BEFORE UPDATE redundantes chamando a mesma lógica:
--   trg_ml_connections_set_updated_at e trg_ml_connections_updated_at.
--
-- IMPORTANTE: o corpo de public.set_updated_at() abaixo segue o idioma padrão
-- (NEW.updated_at = now(); RETURN NEW;). Isso é uma suposição declarativa baseada
-- na convenção do projeto — a definição exata em produção não foi capturada via dump
-- (supabase db dump --linked falhou por ausência de Docker no ambiente Windows).
-- Antes de aplicar esta migration contra o banco de produção, comparar esta definição
-- com o resultado real de `supabase/audit/production_inventory.sql` (bloco "Funções public").

begin;

-- 1. Função canônica de updated_at (idempotente).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- 2. Recria, de forma idempotente, os triggers de tabelas com um único trigger
--    conhecido, apontando todos para a função canônica.

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

drop trigger if exists update_subscriptions_updated_at on public.subscriptions;
create trigger update_subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function public.set_updated_at();

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

drop trigger if exists trg_set_updated_at_catalog_ai_cache on public.catalog_ai_cache;
create trigger trg_set_updated_at_catalog_ai_cache
  before update on public.catalog_ai_cache
  for each row
  execute function public.set_updated_at();

-- 3. ml_connections tem dois triggers BEFORE UPDATE redundantes.
--    Remove ambos e recria apenas um, com o nome já documentado como principal
--    em supabase/baseline/2026-08-17-production-baseline.md.
drop trigger if exists trg_ml_connections_set_updated_at on public.ml_connections;
drop trigger if exists trg_ml_connections_updated_at on public.ml_connections;
create trigger trg_ml_connections_set_updated_at
  before update on public.ml_connections
  for each row
  execute function public.set_updated_at();

-- 4. Remoção condicional das funções redundantes.
--    Só remove cada função se, no momento da execução, nenhum trigger em
--    pg_trigger ainda referenciar essa função — prova em tempo de execução,
--    não suposição estática. Se algo além dos triggers listados acima ainda
--    depender delas, o DROP é pulado e um aviso é emitido via RAISE NOTICE.
do $migration$
declare
  v_still_used boolean;
begin
  select exists (
    select 1
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where not t.tgisinternal
      and p.proname = 'set_updated_at_catalog_ai_cache'
  ) into v_still_used;

  if v_still_used then
    raise notice 'set_updated_at_catalog_ai_cache() ainda referenciada por algum trigger — não removida.';
  else
    drop function if exists public.set_updated_at_catalog_ai_cache();
  end if;

  select exists (
    select 1
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where not t.tgisinternal
      and p.proname = 'update_updated_at_column'
  ) into v_still_used;

  if v_still_used then
    raise notice 'update_updated_at_column() ainda referenciada por algum trigger — não removida.';
  else
    drop function if exists public.update_updated_at_column();
  end if;
end;
$migration$;

commit;
