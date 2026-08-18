# Saída real do post-check — migration 01 aplicada em produção

**Executado**: 18/08/2026, imediatamente após aplicar
`supabase/migrations/20260817_01_cleanup_updated_at.sql` contra produção
(`rkxexvstpatmetaoypgb`), via `supabase db query --linked`.

**Resultado geral: ✅ todos os itens de validação bateram.** Nenhuma
divergência de dados, contagens, RLS ou triggers. Uma observação sobre
remoção condicional de função é detalhada abaixo (comportamento correto,
não é falha).

## 1. `set_updated_at()` — confirmado

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
```

Idêntica à definição pré-migration e à confirmada pelo usuário. ✅

## 2. Funções redundantes — remoção condicional

| Função | Resultado | Motivo |
|---|---|---|
| `set_updated_at_catalog_ai_cache()` | **Removida** | Nenhum trigger em `public` a referenciava mais após o redirecionamento |
| `update_updated_at_column()` | **Preservada** | A checagem de segurança da migration (`pg_trigger` + `pg_proc` por `proname`, sem qualificar schema) encontrou um trigger com o **mesmo nome de função em outro schema** — `storage.update_objects_updated_at`, que chama `storage.update_updated_at_column()` (função interna do Supabase Storage, não relacionada ao projeto). Por não distinguir schema, a migration tratou isso como "ainda em uso" e **não removeu** `public.update_updated_at_column()`, por segurança. |

Confirmei manualmente que **nenhum trigger em `public`** ainda referencia
`public.update_updated_at_column()` (busca ampla por nome de função em
qualquer schema, filtrando depois por schema da função = `public`, retornou
zero linhas). Ou seja: a função ficou órfã em `public`, mas a migration
preferiu o caminho conservador (não remover) em vez de arriscar um
falso-negativo. **Isso é o comportamento correto pedido** — "remover
somente se não houver dependência residual" — só que a checagem interna da
migration é mais conservadora do que precisava ser (não distingue schema).
Não removi manualmente; nenhuma outra migration foi executada, conforme
instruído. Fica registrado como candidato para uma migration futura, com
uma checagem qualificada por schema.

## 3. Os 7 triggers — todos apontando para `set_updated_at()`

| Tabela | Trigger | Função |
|---|---|---|
| catalog_ai_cache | trg_set_updated_at_catalog_ai_cache | `set_updated_at()` ✅ |
| catalog_item_analysis | trg_catalog_item_analysis_updated_at | `set_updated_at()` ✅ |
| catalog_runs | trg_catalog_runs_updated_at | `set_updated_at()` ✅ |
| ml_connections | trg_ml_connections_set_updated_at | `set_updated_at()` ✅ |
| subscriptions | update_subscriptions_updated_at | `set_updated_at()` ✅ (antes era `update_updated_at_column()`) |
| supplier_catalog_items | trg_supplier_catalog_items_updated_at | `set_updated_at()` ✅ |
| supplier_catalogs | trg_supplier_catalogs_updated_at | `set_updated_at()` ✅ |

## 4. `trg_ml_connections_updated_at` (duplicado) — removido

Confirmado: 0 linhas retornadas ao buscar esse trigger em `ml_connections`. ✅

## 5. `ml_connections` — exatamente 1 trigger

Confirmado: apenas `trg_ml_connections_set_updated_at` existe na tabela agora. ✅

## 6. Contagem de linhas — idêntica ao pre-check

| Tabela | Antes | Depois |
|---|---|---|
| catalog_ai_cache | 0 | 0 ✅ |
| catalog_item_analysis | 2361 | 2361 ✅ |
| catalog_runs | 60 | 60 ✅ |
| ml_connections | 2 | 2 ✅ |
| subscriptions | 2 | 2 ✅ |
| supplier_catalog_items | 3518 | 3518 ✅ |
| supplier_catalogs | 60 | 60 ✅ |

## 7. `max(updated_at)` — idêntico ao pre-check

| Tabela | Antes | Depois |
|---|---|---|
| catalog_ai_cache | null | null ✅ |
| catalog_item_analysis | 2026-07-24 01:41:48.968243+00 | idêntico ✅ |
| catalog_runs | 2026-08-17 23:06:46.027239+00 | idêntico ✅ |
| ml_connections | 2026-07-24 01:42:31.965781+00 | idêntico ✅ |
| subscriptions | 2026-04-01 23:59:56.598519+00 | idêntico ✅ |
| supplier_catalog_items | 2026-07-24 01:41:48.84016+00 | idêntico ✅ |
| supplier_catalogs | 2026-08-17 23:06:45.912214+00 | idêntico ✅ |

Nenhum `updated_at` mudou — confirma que recriar os triggers não disparou
nenhuma escrita, como esperado.

## 8. RLS — inalterado

| Tabela | RLS habilitado |
|---|---|
| catalog_ai_cache | false (igual ao baseline) ✅ |
| catalog_item_analysis | true ✅ |
| catalog_runs | true ✅ |
| ml_connections | true ✅ |
| subscriptions | true ✅ |
| supplier_catalog_items | true ✅ |
| supplier_catalogs | true ✅ |

Todos idênticos ao estado documentado em
`supabase/baseline/2026-08-17-production-baseline.md`.

## Conclusão

Todos os critérios de validação passaram. A única observação não prevista
é a preservação de `update_updated_at_column()` por um falso-positivo de
nome (colisão com `storage.update_updated_at_column()`, função interna do
Supabase) — comportamento seguro, não uma falha. Nenhuma ação corretiva
foi tomada nesta sessão, conforme instruído ("não execute nenhuma outra
migration").
