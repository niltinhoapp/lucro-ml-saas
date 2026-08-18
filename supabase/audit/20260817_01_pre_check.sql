-- Lucro ML — verificação PRÉ-migration 01 (somente leitura)
-- Rodar em produção ANTES de aplicar 20260817_01_cleanup_updated_at.sql.
-- Este script NÃO altera o banco. Guardar a saída completa — ela é a
-- fonte de verdade para validar a migration e, se necessário, corrigir
-- o rollback preparado em supabase/rollback/20260817_01_rollback.sql
-- antes de precisar usá-lo de verdade.

-- 1. Definição completa e atual das 3 funções envolvidas.
--    CRÍTICO: se o corpo de set_updated_at_catalog_ai_cache() ou
--    update_updated_at_column() aqui capturado divergir do texto usado
--    no rollback preparado, o rollback deve ser corrigido com o texto
--    real ANTES de a migration 01 ser aplicada.
select p.proname as function_name, pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('set_updated_at', 'set_updated_at_catalog_ai_cache', 'update_updated_at_column')
order by p.proname;

-- 2. Definição completa e atual dos 8 triggers, incluindo qual função
--    cada um chama HOJE (pg_get_triggerdef traz o EXECUTE FUNCTION exato).
--    Isso confirma ou corrige as suposições de binding do rollback.
select
  c.relname as table_name,
  t.tgname as trigger_name,
  pg_get_triggerdef(t.oid) as trigger_definition,
  t.tgenabled as enabled_flag
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
    'trg_ml_connections_updated_at',
    'update_subscriptions_updated_at',
    'trg_supplier_catalog_items_updated_at',
    'trg_supplier_catalogs_updated_at'
  )
order by c.relname, t.tgname;

-- 3. Contagem de linhas nas 7 tabelas afetadas — referência para
--    comparar depois (a migration não deve alterar nenhum desses números).
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

-- 4. Snapshot de um max(updated_at) por tabela — outra referência de
--    "antes", útil para confirmar depois que nenhum updated_at mudou
--    sem uma escrita real ter ocorrido.
--    Nota: supplier_catalog_items e supplier_catalogs não têm coluna
--    updated_at nas migrations versionadas (20260308_catalogos_plus.sql),
--    mas o baseline confirma trigger de updated_at ativo nelas em
--    produção — ou seja, a coluna foi adicionada fora de uma migration
--    versionada. Se esta query 4 falhar para alguma dessas tabelas, é
--    sinal de drift adicional a investigar antes de aplicar a migration 01.
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
