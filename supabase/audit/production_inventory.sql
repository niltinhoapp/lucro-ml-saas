-- Lucro ML — inventário somente-leitura do Supabase de produção
-- Este script NÃO altera o banco.

-- Tabelas/colunas
select table_schema, table_name, column_name, ordinal_position,
       data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

-- RLS
select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

-- Policies
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Índices
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

-- Funções public
select n.nspname as schema_name, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_function_result(p.oid) as return_type,
       pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;

-- Triggers public
select event_object_schema, event_object_table, trigger_name,
       event_manipulation, action_timing, action_statement
from information_schema.triggers
where event_object_schema = 'public'
order by event_object_table, trigger_name, event_manipulation;

-- Trigger de criação do profile em auth.users
select tg.tgname as trigger_name, pg_get_triggerdef(tg.oid) as trigger_definition
from pg_trigger tg
join pg_class c on c.oid = tg.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'auth'
  and c.relname = 'users'
  and not tg.tgisinternal;
