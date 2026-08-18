-- Saneamento 5 — PREPARAÇÃO (etapa 2/2, sem downtime): remove a unicidade
-- global antiga em sku_custos(sku), agora que (user_id, sku) já cobre o
-- isolamento por usuário.
-- Branch: chore/supabase-schema-sync-2026-08-17
--
-- ============================================================
-- STATUS: NÃO EXECUTAR CONTRA PRODUÇÃO AINDA.
--
-- SÓ APLICAR DEPOIS QUE:
--   1. supabase/migrations/20260817_04_sku_custos_unique_per_user.sql
--      já tiver sido aplicada em produção (unique composto
--      sku_custos_user_id_sku_key existindo e saudável);
--   2. o código de src/app/api/sku/route.ts usando
--      onConflict: "user_id,sku" já estiver publicado e rodando em
--      produção (não só commitado na branch).
--
-- Aplicar esta migration antes disso remove o único mecanismo de
-- unicidade que o upsert atual (onConflict "sku") consegue usar,
-- quebrando o endpoint. A ordem importa.
-- ============================================================
--
-- Ordem completa de rollout (nenhuma etapa executada por esta tarefa):
--   1. aplicar migration 04 (cria unique composto, mantém o global);
--   2. publicar código com onConflict "user_id,sku";
--   3. validar GET/POST de SKU em produção;
--   4. aplicar esta migration 05 (remove o unique global antigo);
--   5. validar que dois usuários distintos podem possuir o mesmo SKU.
--
-- Esta migration remove SOMENTE a unicidade antiga em (sku) isolada.
-- Não toca no unique composto (user_id, sku), não remove dados, não
-- altera RLS, não altera outras colunas ou índices.

begin;

-- 1. Pré-condição de segurança: aborta se o unique composto (user_id, sku)
--    ainda não existir — sinal de que a migration 04 não foi aplicada.
do $migration$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'sku_custos'
      and indexname = 'sku_custos_user_id_sku_key'
  ) then
    raise exception
      'sku_custos_user_id_sku_key não existe. Aplique a migration '
      '20260817_04_sku_custos_unique_per_user.sql antes desta.';
  end if;
end;
$migration$;

-- 2. Remove o unique global antigo em (sku), via descoberta dinâmica pelo
--    catálogo do Postgres (sem nome fixo) — cobre tanto o caso de
--    constraint de tabela quanto o de índice único solto.

do $migration$
declare
  v_old_constraint text;
begin
  select con.conname into v_old_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'sku_custos'
    and con.contype = 'u'
    and (
      select array_agg(attname order by attnum)
      from pg_attribute
      where attrelid = con.conrelid
        and attnum = any(con.conkey)
    ) = array['sku'];

  if v_old_constraint is not null then
    execute format('alter table public.sku_custos drop constraint %I', v_old_constraint);
    raise notice 'Constraint único global "%" removido de sku_custos(sku).', v_old_constraint;
  else
    raise notice 'Nenhum constraint único de tabela encontrado em sku_custos(sku) — verificando índice solto.';
  end if;
end;
$migration$;

do $migration$
declare
  v_old_index text;
begin
  select i.relname into v_old_index
  from pg_index ix
  join pg_class i on i.oid = ix.indexrelid
  join pg_class t on t.oid = ix.indrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'sku_custos'
    and ix.indisunique
    and i.relname <> 'sku_custos_user_id_sku_key'
    and not exists (
      select 1 from pg_constraint c where c.conindid = ix.indexrelid
    )
    and (
      select array_agg(attname order by attnum)
      from pg_attribute
      where attrelid = t.oid
        and attnum = any(ix.indkey::int[])
    ) = array['sku'];

  if v_old_index is not null then
    execute format('drop index if exists public.%I', v_old_index);
    raise notice 'Índice único solto "%" removido de sku_custos(sku).', v_old_index;
  end if;
end;
$migration$;

commit;
