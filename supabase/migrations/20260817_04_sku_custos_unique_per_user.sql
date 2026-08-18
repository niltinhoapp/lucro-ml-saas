-- Saneamento 4 — PREPARAÇÃO: trocar unicidade global de sku_custos.sku
-- por unicidade composta (user_id, sku).
-- Branch: chore/supabase-schema-sync-2026-08-17
--
-- STATUS: NÃO EXECUTAR CONTRA PRODUÇÃO AINDA.
--
-- Motivo: a rota /api/sku é multiusuário (RLS exige user_id = auth.uid()
-- em todas as operações), mas o índice/constraint único hoje conhecido
-- em produção cobre apenas a coluna `sku` isoladamente. Isso significa que
-- dois usuários diferentes não conseguem cadastrar o mesmo código de SKU —
-- o segundo upsert entra em conflito com a linha do primeiro usuário e,
-- por causa da RLS de UPDATE (auth.uid() = user_id), a atualização do
-- ON CONFLICT é bloqueada para o segundo usuário.
--
-- PRÉ-REQUISITOS ANTES DE APLICAR ESTA MIGRATION:
--   1. Confirmar via consulta somente-leitura (ex: bloco de índices em
--      supabase/audit/production_inventory.sql) o nome exato do
--      constraint/índice único atual em (sku).
--   2. Rodar a verificação de duplicidade cruzada abaixo. Se retornar
--      linhas, decidir manualmente o que fazer com os dados conflitantes
--      ANTES de aplicar esta migration (ela não apaga nem mescla dados):
--
--        select sku, count(distinct user_id) as usuarios_distintos
--        from public.sku_custos
--        group by sku
--        having count(distinct user_id) > 1;
--
--   3. Atualizar src/app/api/sku/route.ts para usar
--      .upsert(payload, { onConflict: "user_id,sku" }) SOMENTE DEPOIS que
--      esta migration for aplicada em produção. Aplicar a migration sem
--      atualizar o código, ou atualizar o código sem aplicar a migration,
--      quebra o endpoint (o Postgres exige que as colunas do ON CONFLICT
--      correspondam a um unique/exclusion constraint real).
--
-- Esta migration é auto-protegida contra perda de dados: se já existirem
-- linhas duplicadas em (user_id, sku), o CREATE UNIQUE INDEX abaixo falha
-- e nada é alterado (a transação inteira é revertida).

begin;

-- 1. Remove o constraint único global em (sku), se existir como constraint
--    de tabela (não apenas índice solto). Busca dinâmica, sem nome fixo —
--    prova via catálogo do Postgres, não suposição.
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

-- 2. Caso a unicidade em (sku) tenha sido implementada como índice único
--    solto (sem constraint de tabela associado), remove pelo mesmo critério
--    dinâmico.
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

-- 3. Cria a nova unicidade composta (idempotente). Se houver dados
--    duplicados em (user_id, sku), este comando falha e a transação
--    inteira é revertida — nenhuma alteração é aplicada nesse caso.
create unique index if not exists sku_custos_user_id_sku_key
  on public.sku_custos (user_id, sku);

commit;
