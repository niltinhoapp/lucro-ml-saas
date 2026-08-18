-- Saneamento 4 — PREPARAÇÃO (etapa 1/2, sem downtime): adiciona unicidade
-- composta (user_id, sku) em sku_custos, SEM remover a unicidade global
-- atual em (sku).
-- Branch: chore/supabase-schema-sync-2026-08-17
--
-- STATUS: NÃO EXECUTAR CONTRA PRODUÇÃO AINDA.
--
-- Estratégia de transição sem downtime:
--   1. (este arquivo) cria o unique composto (user_id, sku) mantendo o
--      unique global antigo em (sku) intacto — os dois coexistem;
--   2. o código passa a fazer upsert com onConflict "user_id,sku" (ver
--      src/app/api/sku/route.ts), já compatível com o novo índice;
--   3. só depois de validar GET/POST em produção com o novo índice,
--      supabase/migrations/20260817_05_remove_sku_global_unique.sql
--      remove o unique antigo em (sku) isoladamente.
--
-- Enquanto o unique global antigo em (sku) continuar ativo, dois usuários
-- ainda NÃO conseguirão cadastrar o mesmo código de SKU — isso só é
-- resolvido depois que a migration 05 for aplicada. Esta migration (04)
-- apenas prepara o terreno sem quebrar nada que já funciona hoje.
--
-- Esta migration é auto-protegida contra perda de dados: se já existirem
-- linhas duplicadas em (user_id, sku), o CREATE UNIQUE INDEX falha e nada
-- é alterado (a transação inteira é revertida). Antes disso, um bloco de
-- verificação explícita já aborta com uma mensagem clara.

begin;

-- 1. Verificação explícita de duplicidade em (user_id, sku) antes de
--    tentar criar o índice. Falha cedo com mensagem legível em vez de
--    depender só do erro genérico do Postgres.
do $migration$
declare
  v_dup_count integer;
begin
  select count(*) into v_dup_count
  from (
    select user_id, sku
    from public.sku_custos
    group by user_id, sku
    having count(*) > 1
  ) as duplicates;

  if v_dup_count > 0 then
    raise exception
      'sku_custos possui % combinação(ões) duplicada(s) de (user_id, sku). '
      'Resolva os dados conflitantes manualmente antes de aplicar esta migration.',
      v_dup_count;
  end if;
end;
$migration$;

-- 2. Cria o unique composto de forma idempotente. NÃO remove nem altera
--    o unique global existente em (sku).
create unique index if not exists sku_custos_user_id_sku_key
  on public.sku_custos (user_id, sku);

commit;
