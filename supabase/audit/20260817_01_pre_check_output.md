# Saída real do pre-check — 20260817_01_pre_check.sql

Executado em produção (`rkxexvstpatmetaoypgb`) via `supabase db query --linked`,
somente leitura, antes de aplicar `20260817_01_cleanup_updated_at.sql`.

## Bloco 1 — definição das 3 funções

Todas as três têm corpo **idêntico**: `new.updated_at = now(); return new;`.
Confirma que a suposição de equivalência funcional estava correta.

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

CREATE OR REPLACE FUNCTION public.set_updated_at_catalog_ai_cache()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
```

## Bloco 2 — definição real dos 8 triggers (binding função atual)

| Tabela | Trigger | Função chamada HOJE | Batia com o assumido no rollback? |
|---|---|---|---|
| catalog_ai_cache | trg_set_updated_at_catalog_ai_cache | `set_updated_at_catalog_ai_cache()` | ✅ sim |
| catalog_item_analysis | trg_catalog_item_analysis_updated_at | `set_updated_at()` | ✅ sim |
| catalog_runs | trg_catalog_runs_updated_at | `set_updated_at()` | ✅ sim |
| ml_connections | trg_ml_connections_set_updated_at | `set_updated_at()` | ✅ sim |
| ml_connections | trg_ml_connections_updated_at | `set_updated_at()` | ✅ sim |
| subscriptions | update_subscriptions_updated_at | **`update_updated_at_column()`** | ❌ **NÃO — rollback assumia `set_updated_at()`** |
| supplier_catalog_items | trg_supplier_catalog_items_updated_at | `set_updated_at()` | ✅ sim |
| supplier_catalogs | trg_supplier_catalogs_updated_at | `set_updated_at()` | ✅ sim |

Todos os 8 triggers com `enabled_flag = 'O'` (habilitados, modo normal — nenhum
trigger desabilitado encontrado).

**Única divergência**: `subscriptions.update_subscriptions_updated_at` chama
`update_updated_at_column()` em produção, não `set_updated_at()` como o
rollback preparado assumia. Corrigido em
`supabase/rollback/20260817_01_rollback.sql` após esta captura.

Como as três funções têm corpo idêntico (bloco 1), essa divergência **não
afeta o comportamento** da migration 01 (redirecionar para `set_updated_at()`
é funcionalmente equivalente) — mas afetava a fidelidade do rollback, que
precisava restaurar o binding exato anterior.

## Bloco 3 — contagem de linhas (referência "antes")

| Tabela | Linhas |
|---|---|
| catalog_ai_cache | 0 |
| catalog_item_analysis | 2361 |
| catalog_runs | 60 |
| ml_connections | 2 |
| subscriptions | 2 |
| supplier_catalog_items | 3518 |
| supplier_catalogs | 60 |

## Bloco 4 — max(updated_at) por tabela (referência "antes")

| Tabela | max(updated_at) |
|---|---|
| catalog_ai_cache | null (tabela vazia) |
| catalog_item_analysis | 2026-07-24 01:41:48.968243+00 |
| catalog_runs | 2026-08-17 23:06:46.027239+00 |
| ml_connections | 2026-07-24 01:42:31.965781+00 |
| subscriptions | 2026-04-01 23:59:56.598519+00 |
| supplier_catalog_items | 2026-07-24 01:41:48.84016+00 |
| supplier_catalogs | 2026-08-17 23:06:45.912214+00 |

Estes números (blocos 3 e 4) devem ser comparados com a saída do
`20260817_01_post_check.sql` depois de aplicar a migration 01 — nenhum deles
deve mudar (recriar um trigger não dispara ele; só um UPDATE real dispara).
