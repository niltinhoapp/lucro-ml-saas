# Plano de saneamento do Supabase — 17/08/2026

## Status

Inventário essencial concluído a partir do banco vivo de produção `rkxexvstpatmetaoypgb`.

Foram levantados:

- tabelas e colunas;
- constraints principais;
- policies RLS;
- estado de RLS por tabela;
- funções `public`;
- triggers `public` e trigger de `auth.users`;
- índices `public`.

## Decisões confirmadas

### Manter

- `handle_new_user()` + trigger `on_auth_user_created` em `auth.users`.
- `is_plus_user(uuid)`.
- isolamento por `auth.uid()` nas tabelas multiusuário.
- índices de PK, FK/consulta e unicidade realmente necessários.
- `ml_connections` com unicidade por usuário e por conta ML, preservando a regra de uma conexão ativa por usuário.

### Consolidar depois de teste

#### Funções de `updated_at`

As funções abaixo são equivalentes:

- `set_updated_at()`
- `set_updated_at_catalog_ai_cache()`
- `update_updated_at_column()`

Meta: migrar todos os triggers para `set_updated_at()` e remover as funções redundantes em migration separada.

#### Triggers duplicados em `ml_connections`

Existem dois triggers BEFORE UPDATE executando `set_updated_at()`:

- `trg_ml_connections_set_updated_at`
- `trg_ml_connections_updated_at`

Meta: manter apenas um após validação.

#### Policies RLS duplicadas

Há coexistência de policies antigas e novas em algumas tabelas, principalmente:

- `catalog_item_analysis`
- `supplier_catalog_items`
- `supplier_catalogs`
- `profiles`
- `subscriptions`
- `dre_ai_insights`
- `usage_counters`

Meta: manter um conjunto mínimo por operação sem ampliar acesso.

### Índices redundantes identificados

#### `caixa_lancamentos`

Há pares/grupos equivalentes:

- `caixa_lancamentos_categoria_idx` e `idx_caixa_lanc_categoria` — ambos em `(categoria)`.
- `caixa_lancamentos_relatorio_idx`, `idx_caixa_lanc_relatorio` e `idx_caixa_lancamentos_relatorio` — todos em `(relatorio_id)`.
- `caixa_lancamentos_relatorio_data_idx` e `idx_caixa_lanc_relatorio_data` — ambos em `(relatorio_id, release_date)`.

Manter a unique `uq_caixa_lanc_unico_por_relatorio`, pois possui regra funcional própria.

#### `catalog_ai_cache`

Os índices simples em `file_hash` e `cache_key` devem ser revisados porque já há unique indexes que começam por essas colunas. Não remover até testar os planos de consulta.

#### `ml_connections`

Há forte duplicidade:

- `idx_ml_connections_ml_user_id` e `ml_connections_ml_user_id_idx`.
- `ml_connections_ml_user_id_key` e `ml_connections_ml_user_id_unique_idx` são unique equivalentes em `(ml_user_id)`.
- `idx_ml_connections_user_active` e parte de outros índices cobrem `(user_id, is_active)`.
- `ml_connections_one_active_per_user_idx` e `ux_ml_connections_user_active` são unique parciais equivalentes para `user_id where is_active = true`.
- `ml_connections_user_id_key` e `ml_connections_user_id_unique_idx` são unique equivalentes em `(user_id)`.

A regra de negócio aparente é uma conta ML por usuário e uma conta ML não compartilhada entre usuários. Antes de remover índices, validar o código OAuth/upsert e constraints associadas.

#### `subscriptions`

- `subscriptions_provider_id_idx` e `subscriptions_provider_id_key` são unique equivalentes em `(provider_id)`.

#### `user_strategy_reads`

- `user_strategy_reads_user_id_strategy_id_key` e `user_strategy_reads_user_strategy_unique` são unique equivalentes em `(user_id, strategy_id)`.

### Objetos com RLS desabilitado

Confirmados com RLS `false`:

- `_backup_caixa_lancamentos_orfos`
- `_backup_caixa_relatorios_orfos`
- `_backup_simulacoes_orfas`
- `ai_cache`
- `catalog_ai_cache`
- `radar_cache`
- `strategies`
- `user_strategy_reads`

Isso não significa automaticamente erro: caches e tabelas de catálogo global podem ser server-only. Cada uma deve ser classificada por acesso real do código antes de habilitar RLS ou remover.

### Candidatos a legado/remoção — NÃO APAGAR AINDA

- `_backup_caixa_lancamentos_orfos`
- `_backup_caixa_relatorios_orfos`
- `_backup_simulacoes_orfas`

Precisamos confirmar contagem de linhas, datas e se há referências no código antes de excluir.

## Problema de migrations

`supabase migration list` mostrou:

- local `20260308`, remoto vazio;
- local `20260314`, remoto vazio;
- local `20260315`, remoto vazio.

O banco vivo contém objetos mais novos e divergentes das migrations locais. Não executar `db push`, `db reset --linked` ou `migration repair` até a baseline estar preparada.

## Próxima fase

1. Criar baseline versionada representando o estado vivo conhecido.
2. Criar migrations forward-only para ajustes futuros, sem tentar reaplicar DDL antigo contra produção.
3. Testar a reconstrução em banco separado.
4. Reconciliar o histórico remoto de migrations.
5. Executar saneamento de triggers/policies/índices em migrations pequenas e reversíveis.
6. Só então remover tabelas/arquivos/branches obsoletos.
7. Configurar GitHub Actions para validar migrations em PR e aplicar produção apenas em fluxo protegido.

## Regra para CI/CD

Nunca ligar `git push -> supabase db push` indiscriminadamente.

Fluxo alvo:

- PR: lint e validação;
- merge em branch estável: workflow de deploy controlado;
- secrets do Supabase somente no GitHub Actions;
- produção só recebe migrations versionadas e revisadas;
- nenhuma migration destrutiva sem etapa explícita de aprovação.
