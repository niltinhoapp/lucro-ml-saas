-- Lucro ML — verificação PÓS-migration 01 (somente leitura)
-- Rodar em produção IMEDIATAMENTE depois de aplicar
-- 20260817_01_cleanup_updated_at.sql. Este script NÃO altera o banco.
-- Compare a saída com a captura de supabase/audit/20260817_01_pre_check.sql.

-- 1. set_updated_at() deve existir com o corpo canônico.
select p.proname as function_name, pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'set_updated_at';

-- 2. As duas funções redundantes podem ou não existir ainda —
--    dependendo se a checagem condicional da migration encontrou algum
--    trigger residual apontando pra elas. Se aparecerem aqui, checar os
--    RAISE NOTICE emitidos durante a execução da migration para saber
--    o motivo (algum trigger fora da lista das 8 ainda as usa).
select p.proname as function_name, pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('set_updated_at_catalog_ai_cache', 'update_updated_at_column');

-- 3. Os 7 triggers recriados devem existir e apontar para set_updated_at().
--    Expectativa: 7 linhas, todas com trigger_definition contendo
--    "EXECUTE FUNCTION public.set_updated_at()".
select
  c.relname as table_name,
  t.tgname as trigger_name,
  pg_get_triggerdef(t.oid) as trigger_definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and not t.tgisinternal
  and t.tgname in (
    'trg_set_updated_at_catalog_ai_cache',
    'trg_catalog_item_analysis_updated_at',
    'trg_catalog_runs_updated_at',
    'trg_ml_connections_set_updated_at',
    'update_subscriptions_updated_at',
    'trg_supplier_catalog_items_updated_at',
    'trg_supplier_catalogs_updated_at'
  )
order by c.relname, t.tgname;

-- 4. trg_ml_connections_updated_at (duplicado) NÃO deve mais existir.
--    Expectativa: 0 linhas.
select t.tgname
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'ml_connections'
  and not t.tgisinternal
  and t.tgname = 'trg_ml_connections_updated_at';

-- 5. ml_connections deve ter exatamente 1 trigger de updated_at agora.
--    Expectativa: 1 linha.
select t.tgname
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'ml_connections'
  and not t.tgisinternal;

-- 6. Contagem de linhas nas 7 tabelas afetadas — DEVE bater exatamente
--    com os números capturados no pre_check (nenhuma linha criada/apagada).
select 'catalog_item_analysis' as table_name, count(*) from public.catalog_item_analysis
union all
select 'catalog_runs', count(*) from public.catalog_runs
union all
select 'subscriptions', count(*) from public.subscriptions
union all
select 'supplier_catalog_items', count(*) from public.supplier_catalog_items
union all
select 'supplier_catalogs', count(*) from public.supplier_catalogs
union all
select 'catalog_ai_cache', count(*) from public.catalog_ai_cache
union all
select 'ml_connections', count(*) from public.ml_connections
order by table_name;

-- 7. max(updated_at) por tabela — DEVE bater exatamente com o pre_check
--    (recriar um trigger não dispara ele; só um UPDATE real dispara).
select 'catalog_item_analysis' as table_name, max(updated_at) as max_updated_at from public.catalog_item_analysis
union all
select 'catalog_runs', max(updated_at) from public.catalog_runs
union all
select 'subscriptions', max(updated_at) from public.subscriptions
union all
select 'supplier_catalog_items', max(updated_at) from public.supplier_catalog_items
union all
select 'supplier_catalogs', max(updated_at) from public.supplier_catalogs
union all
select 'catalog_ai_cache', max(updated_at) from public.catalog_ai_cache
union all
select 'ml_connections', max(updated_at) from public.ml_connections
order by table_name;

-- 8. Confirma que nada mudou fora do escopo: RLS habilitado/desabilitado
--    nas 7 tabelas deve continuar idêntico ao baseline
--    (supabase/baseline/2026-08-17-production-baseline.md).
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'catalog_item_analysis', 'catalog_runs', 'subscriptions',
    'supplier_catalog_items', 'supplier_catalogs', 'catalog_ai_cache',
    'ml_connections'
  )
order by c.relname;
