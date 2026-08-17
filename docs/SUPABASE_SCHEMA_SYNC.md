# Supabase Schema Sync — 17/08/2026

## Objetivo

Alinhar o schema real do Supabase de produção com o repositório `niltinhoapp/lucro-ml-saas`, tornando as migrations versionadas no GitHub a fonte oficial de verdade do banco.

## Projeto de produção

- Supabase URL: `https://rkxexvstpatmetaoypgb.supabase.co`
- Branch de trabalho GitHub: `chore/supabase-schema-sync-2026-08-17`
- Base de produção: `cleanup/v2-estrutura-final`

## Regras de segurança

1. Não apagar tabela, coluna, migration, branch ou dado de produção antes da comparação completa.
2. Não executar migrations destrutivas automaticamente em produção.
3. Nunca commitar `.env`, tokens, senha do banco, access token do Mercado Livre ou service role key.
4. Primeiro capturar o schema real; depois comparar; só então consolidar migrations.
5. Alterações em produção devem ocorrer somente depois de validação em ambiente separado ou dry-run.

## Estado confirmado do banco vivo

O banco de produção contém, entre outras, as seguintes tabelas e estruturas relevantes:

- `profiles`
- `subscriptions`
- `supplier_catalogs`
- `supplier_catalog_items`
- `catalog_item_analysis`
- `catalog_runs`
- `catalog_ai_cache`
- `radar_searches`
- `radar_favorites`
- `ml_connections`
- `ml_sync_logs`
- `dre_ai_insights`
- `ai_cache`
- `ai_usage`
- `caixa_relatorios`
- `caixa_lancamentos`
- `simulacoes`
- `sku_custos`
- `usage_counters`

Também existem tabelas de backup/órfãos com prefixo `_backup_`. Elas não devem ser removidas até a validação de uso, volume e necessidade de retenção.

## Divergências confirmadas

As migrations atuais do repositório não representam completamente o schema real esperado pelo código.

- `catalog_item_analysis` e `catalog_runs` são usadas pela aplicação e existem no banco vivo, mas não constam nas três migrations atualmente versionadas.
- `supplier_catalog_items` possui divergência entre as colunas da migration antiga e as colunas usadas pela API atual.
- `ml_connections` possui divergência entre a migration antiga e os campos usados pelo OAuth atual.
- O histórico remoto de migrations está vazio para `20260308`, `20260314` e `20260315`, embora os objetos correspondentes já existam no banco.
- Há políticas RLS antigas e novas coexistindo em algumas tabelas, incluindo versões `{public}` e `{authenticated}`.

## Funções confirmadas

O schema `public` possui:

- `handle_new_user()` — cria `profiles` automaticamente para novos usuários.
- `is_plus_user(uuid)` — valida plano PLUS a partir de `profiles.plan`.
- `set_updated_at()` — função genérica para `updated_at`.
- `set_updated_at_catalog_ai_cache()` — funcionalmente redundante com `set_updated_at()`.
- `update_updated_at_column()` — funcionalmente redundante com `set_updated_at()`.

As duas últimas são candidatas a consolidação posterior, mas não devem ser removidas antes de migrar todos os triggers dependentes.

## Triggers confirmados

- `catalog_ai_cache.trg_set_updated_at_catalog_ai_cache`
- `catalog_item_analysis.trg_catalog_item_analysis_updated_at`
- `catalog_runs.trg_catalog_runs_updated_at`
- `ml_connections.trg_ml_connections_set_updated_at`
- `ml_connections.trg_ml_connections_updated_at`
- `subscriptions.update_subscriptions_updated_at`
- `supplier_catalog_items.trg_supplier_catalog_items_updated_at`
- `supplier_catalogs.trg_supplier_catalogs_updated_at`

`ml_connections` possui dois triggers BEFORE UPDATE executando `set_updated_at()`. Isso é redundante e deve ser consolidado após validação.

## RLS

Foram confirmadas policies por usuário em módulos financeiros, catálogos, Radar, Mercado Livre e uso de IA. Há duplicidade de policies em algumas tabelas, especialmente nos módulos de catálogo e em objetos mais antigos. O saneamento deve preservar o isolamento por `auth.uid()` e reduzir políticas redundantes sem ampliar acesso.

## Extração do schema vivo

A tentativa de `supabase db dump --linked` falhou por ausência de Docker no ambiente Windows. O inventário está sendo feito via consultas somente-leitura no SQL Editor do Supabase.

## Antes da migration consolidada

Ainda capturar:

1. índices de `public`;
2. trigger de `auth.users` que chama `handle_new_user()`;
3. confirmação de RLS habilitado/desabilitado por tabela;
4. opcionalmente sequences/views, caso existam.

## Estratégia de versionamento

Não reescrever migrations históricas de forma destrutiva. O plano é:

1. criar uma baseline/snapshot documentado do estado real de produção;
2. criar migration fix-forward que torne um banco novo reproduzível;
3. reconciliar o histórico remoto de migrations somente depois da comparação final;
4. testar em banco separado;
5. aplicar saneamento de policies, triggers e objetos redundantes em migrations próprias;
6. remover legado apenas depois de confirmar ausência de dependências.

## CI/CD Supabase

GitHub não deve executar mudanças destrutivas no banco de produção a cada push comum. O fluxo recomendado é:

- pull request: validação/lint/diff de migrations;
- merge em branch protegida: deploy controlado de migrations;
- produção: secrets protegidos no GitHub Actions e execução explícita do Supabase CLI;
- migrations sempre `forward-only` e revisadas.

A automação GitHub → Supabase será adicionada somente depois que o schema real estiver alinhado e reproduzível a partir do repositório.
