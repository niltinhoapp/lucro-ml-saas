-- Saneamento 2/3 — PREPARAÇÃO de limpeza de policies RLS duplicadas.
-- Branch: chore/supabase-schema-sync-2026-08-17
--
-- STATUS: NÃO EXECUTAR. Este arquivo é preparatório/rascunho.
-- Ele documenta candidatos a consolidação de RLS, mas os DDLs reais de
-- DROP/CREATE POLICY estão comentados até:
--   1. termos o dump real das policies (nome exato, `qual`, `with_check`)
--      via supabase/audit/production_inventory.sql;
--   2. validarmos em ambiente separado que a policy remanescente cobre
--      exatamente os mesmos casos de uso das policies removidas;
--   3. confirmarmos, tabela a tabela, que nenhuma policy amplia acesso
--      além do isolamento por auth.uid() já existente.
--
-- Regras desta etapa (docs/SUPABASE_CLEANUP_PLAN.md):
--   - preservar isolamento por auth.uid() em todas as tabelas multiusuário;
--   - preservar regras PLUS onde necessárias (ex: is_plus_user(uuid));
--   - não ampliar acesso;
--   - marcar dúvidas com comentários SQL (feito abaixo).

-- ============================================================
-- Tabelas com coexistência confirmada de policies antigas/novas
-- (baseline 2026-08-17): candidatas a auditoria de duplicidade.
-- ============================================================

-- TODO: catalog_item_analysis
--   Ação: capturar policies atuais (pg_policies), comparar predicados,
--   manter só o conjunto mínimo necessário por operação (select/insert/update/delete).
--   Risco: catalog_item_analysis é referenciada pelo pipeline de análise de catálogo
--   (server-only, conforme docs/SUPABASE_CODE_DEPENDENCIES.md) — confirmar se todas
--   as policies existentes são realmente exercidas pelo client, ou se algumas são
--   vestígio de uma versão anterior do fluxo.

-- TODO: supplier_catalog_items
--   Ação: mesma auditoria acima. Tabela referenciada por catálogos de fornecedor
--   (upload/analise). Confirmar policy de SELECT usada pela página de detalhe
--   do catálogo antes de remover qualquer policy candidata a duplicada.

-- TODO: supplier_catalogs
--   Ação: mesma auditoria acima.

-- TODO: profiles
--   Ação: CUIDADO — profiles é criada via trigger handle_new_user() em auth.users
--   e é lida amplamente (plano do usuário, is_plus_user). Não reduzir policies
--   sem mapear TODAS as leituras/escritas atuais (server e client) primeiro.

-- TODO: subscriptions
--   Ação: tabela ligada a Mercado Pago (webhook e create-subscription são
--   server-only, usam service role — não dependem de RLS). Confirmar se há
--   alguma leitura client-side antes de reduzir policies de select.

-- TODO: dre_ai_insights
--   Ação: mesma auditoria. Confirmar se é exclusivamente server-only
--   (rotas api/ai/dre-insights) antes de qualquer alteração de policy.

-- TODO: usage_counters
--   Ação: mesma auditoria. Confirmar leitura/escrita client vs server.

-- ============================================================
-- Nenhum DDL de DROP/CREATE POLICY incluído nesta etapa.
-- Próximo passo: gerar diff real de pg_policies vs. este documento
-- antes de transformar os TODOs acima em SQL executável.
-- ============================================================
