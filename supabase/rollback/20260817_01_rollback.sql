-- Lucro ML — ROLLBACK específico de 20260817_01_cleanup_updated_at.sql
--
-- STATUS: NÃO EXECUTAR AGORA. Só usar se a migration 01 precisar ser
-- revertida depois de aplicada em produção.
--
-- ==========================================================================
-- AVISO CRÍTICO DE FIDELIDADE — LEIA ANTES DE CONFIAR NESTE ARQUIVO
-- ==========================================================================
-- Nunca conseguimos um dump completo do banco (supabase db dump --linked
-- falhou por falta de Docker no Windows). Isso significa que os bindings
-- ORIGINAIS de alguns triggers (qual função cada um chamava antes da
-- migration 01) vêm de inferência documental, não de captura direta.
--
-- CERTO (confirmado em docs/SUPABASE_CLEANUP_PLAN.md, texto explícito):
--   - ml_connections.trg_ml_connections_set_updated_at  -> chamava set_updated_at()
--   - ml_connections.trg_ml_connections_updated_at      -> chamava set_updated_at()
--     ("Existem dois triggers BEFORE UPDATE executando set_updated_at()")
--
-- MUITO PROVÁVEL, MAS INFERIDO POR CONVENÇÃO DE NOME (não confirmado por
-- dump literal):
--   - catalog_ai_cache.trg_set_updated_at_catalog_ai_cache
--     -> assumido chamando set_updated_at_catalog_ai_cache()
--
-- DESCONHECIDO — assumido set_updated_at() por ser a função canônica mais
-- provável, mas SEM confirmação direta:
--   - catalog_item_analysis.trg_catalog_item_analysis_updated_at
--   - catalog_runs.trg_catalog_runs_updated_at
--   - subscriptions.update_subscriptions_updated_at
--   - supplier_catalog_items.trg_supplier_catalog_items_updated_at
--   - supplier_catalogs.trg_supplier_catalogs_updated_at
--
-- AÇÃO OBRIGATÓRIA ANTES DE CONFIAR NESTE ROLLBACK:
--   Rodar supabase/audit/20260817_01_pre_check.sql ANTES de aplicar a
--   migration 01 e guardar a saída completa (especialmente os blocos 1 e
--   2, que trazem pg_get_functiondef e pg_get_triggerdef reais). Se algum
--   binding real capturado divergir do que este arquivo assume abaixo,
--   corrigir este arquivo com o texto real ANTES de precisar rodá-lo de
--   verdade. Este rollback é o melhor esforço com a evidência documental
--   disponível — não uma cópia literal garantida do estado anterior.
--
-- Os corpos das funções set_updated_at_catalog_ai_cache() e
-- update_updated_at_column() abaixo usam o MESMO idioma de
-- set_updated_at() (new.updated_at = now(); return new;), porque os docs
-- as descrevem como "funcionalmente redundantes/equivalentes" — mas os
-- corpos literais originais nunca foram capturados. Se o pre_check
-- revelar um corpo diferente, usar o corpo real capturado aqui.
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

-- 2. Restaura os 5 triggers de tabela única para os bindings assumidos
--    (set_updated_at() — ver aviso de incerteza acima).
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

-- 3. Restaura catalog_ai_cache para o binding inferido por convenção de
--    nome (set_updated_at_catalog_ai_cache()) — ver aviso acima.
drop trigger if exists trg_set_updated_at_catalog_ai_cache on public.catalog_ai_cache;
create trigger trg_set_updated_at_catalog_ai_cache
  before update on public.catalog_ai_cache
  for each row
  execute function public.set_updated_at_catalog_ai_cache();

-- 4. Restaura ml_connections para os DOIS triggers duplicados originais
--    (binding confirmado em docs — ambos chamavam set_updated_at()).
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
