# Production baseline — Supabase — 17/08/2026

Projeto: `rkxexvstpatmetaoypgb`
Branch de saneamento: `chore/supabase-schema-sync-2026-08-17`

> Este arquivo é declarativo e NÃO deve ser executado como migration.

## Objetos confirmados no banco vivo

### Tabelas de negócio / aplicação

- profiles
- subscriptions
- supplier_catalogs
- supplier_catalog_items
- catalog_item_analysis
- catalog_runs
- catalog_ai_cache
- radar_searches
- radar_cache
- ml_connections
- ml_sync_logs
- dre_ai_insights
- ai_cache
- ai_usage
- caixa_relatorios
- caixa_lancamentos
- simulacoes
- sku_custos
- strategies
- user_strategy_reads
- usage_counters

### Tabelas de backup/legado

- _backup_caixa_lancamentos_orfos
- _backup_caixa_relatorios_orfos
- _backup_simulacoes_orfas

Não remover até confirmação de contagem, idade e ausência de dependências.

## Funções confirmadas

- public.handle_new_user()
- public.is_plus_user(uuid)
- public.set_updated_at()
- public.set_updated_at_catalog_ai_cache()
- public.update_updated_at_column()

## Trigger de Auth confirmado

`on_auth_user_created` AFTER INSERT ON `auth.users` EXECUTE FUNCTION `handle_new_user()`.

## Triggers public confirmados

- catalog_ai_cache.trg_set_updated_at_catalog_ai_cache
- catalog_item_analysis.trg_catalog_item_analysis_updated_at
- catalog_runs.trg_catalog_runs_updated_at
- ml_connections.trg_ml_connections_set_updated_at
- ml_connections.trg_ml_connections_updated_at
- subscriptions.update_subscriptions_updated_at
- supplier_catalog_items.trg_supplier_catalog_items_updated_at
- supplier_catalogs.trg_supplier_catalogs_updated_at

## RLS habilitado

- ai_usage
- caixa_lancamentos
- caixa_relatorios
- catalog_item_analysis
- catalog_runs
- dre_ai_insights
- ml_connections
- ml_sync_logs
- profiles
- radar_searches
- simulacoes
- sku_custos
- subscriptions
- supplier_catalog_items
- supplier_catalogs
- usage_counters

## RLS desabilitado

- _backup_caixa_lancamentos_orfos
- _backup_caixa_relatorios_orfos
- _backup_simulacoes_orfas
- ai_cache
- catalog_ai_cache
- radar_cache
- strategies
- user_strategy_reads

RLS desabilitado não implica erro automaticamente: caches e catálogos globais podem ser server-only.

## Redundâncias confirmadas para saneamento posterior

### Funções

`set_updated_at_catalog_ai_cache()` e `update_updated_at_column()` são equivalentes à função genérica `set_updated_at()`.

### ml_connections

Dois triggers BEFORE UPDATE chamam `set_updated_at()`.

Há múltiplos índices equivalentes em `user_id`, `ml_user_id`, `(user_id,is_active)` e unique parcial de conexão ativa.

### caixa_lancamentos

Existem índices equivalentes em `categoria`, `relatorio_id` e `(relatorio_id, release_date)`.

### subscriptions

Há dois unique indexes equivalentes em `provider_id`.

### user_strategy_reads

Há dois unique indexes equivalentes em `(user_id, strategy_id)`.

## Histórico de migrations

Migrations locais encontradas:

- 20260308_catalogos_plus.sql
- 20260314_radar_ml_history_favorites.sql
- 20260315_ml_connections.sql

`supabase migration list` mostrou os três IDs apenas em Local e nenhum em Remote.

## Regra de transição

1. Este baseline registra o estado existente.
2. Não executar migrations históricas contra produção automaticamente.
3. Toda alteração daqui em diante deve ser forward-only.
4. Limpeza será dividida em migrations pequenas: triggers/funções, policies, índices e por último objetos legado.
5. Nenhuma remoção de tabela de backup antes de confirmar que não contém dados necessários.
