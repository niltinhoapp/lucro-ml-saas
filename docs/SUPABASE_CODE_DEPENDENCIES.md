# Mapa de dependências de código — Supabase

Data: 17/08/2026
Branch: `chore/supabase-schema-sync-2026-08-17`
Escopo: as 22 tabelas de negócio listadas em `docs/SUPABASE_SCHEMA_SYNC.md` +
as 3 tabelas de backup (`_backup_caixa_lancamentos_orfos`,
`_backup_caixa_relatorios_orfos`, `_backup_simulacoes_orfas`).

## Metodologia

- Grep exaustivo de `.from(['"]` em todo `src/` (88 ocorrências revisadas).
- Grep direcionado por nome de cada uma das 25 tabelas em todo `src/`.
- Leitura de cada arquivo candidato para determinar operação (SELECT/INSERT/UPDATE/UPSERT/DELETE),
  contexto (server vs client) e exposição multi-tenant.
- Nenhuma chamada `.rpc(...)` no projeto referencia estas tabelas — toda interação é via `.from()`.
- Nenhuma tabela é acessada diretamente de componente `"use client"`. Telas que exibem dados
  (`StrategiesShell.tsx`, `historico/page.tsx`, `DrePageClient.tsx` etc.) consomem via `fetch()`
  as próprias rotas de API — nunca chamam o Supabase diretamente do browser.
- Tabelas fora do escopo pedido, encontradas no grep geral mas ignoradas por não estarem na
  lista original: `catalog_jobs`, `catalog_rows` (pipeline paralelo de catálogo, arquivos
  `src/lib/catalog/upload/route.ts` e `src/lib/catalog/process-job.ts`).

## Visão executiva

| Tabela | Classificação | Server/Client | RLS necessária | Operações |
|---|---|---|---|---|
| profiles | ATIVA | Server-only | Sim (multi-tenant) | SELECT, UPDATE |
| subscriptions | ATIVA | Server-only | Sim (multi-tenant) | SELECT, INSERT, UPDATE, UPSERT |
| supplier_catalogs | ATIVA | Server-only | Sim (multi-tenant) | SELECT, INSERT, UPDATE |
| supplier_catalog_items | ATIVA | Server-only | Sim (multi-tenant) | SELECT, INSERT, DELETE |
| catalog_item_analysis | ATIVA | Server-only | Sim (multi-tenant) | SELECT, INSERT, DELETE |
| catalog_runs | ATIVA (só escrita, nunca lida por UI) | Server-only | Sim (tem user_id) | SELECT, INSERT, UPDATE |
| catalog_ai_cache | ATIVA | Server-only | Não (cache global por cache_key) | SELECT, UPSERT, DELETE |
| radar_searches | ATIVA | Server-only | Sim (multi-tenant) | SELECT, INSERT |
| radar_cache | ATIVA | Server-only | Não (cache global por query normalizada) | SELECT, UPSERT |
| radar_favorites | **ÓRFÃ** | — | — | nenhuma |
| ml_connections | ATIVA | Server-only | Sim (multi-tenant, dado sensível: tokens OAuth) | SELECT, UPDATE, UPSERT |
| ml_sync_logs | **ÓRFÃ** | — | — | nenhuma |
| dre_ai_insights | **ÓRFÃ** | — | — | nenhuma |
| ai_cache | ATIVA | Server-only | Não (cache global) | SELECT, UPSERT |
| ai_usage | ATIVA | Server-only | Sim (contador por user_id) | SELECT, UPSERT |
| caixa_relatorios | ATIVA | Server-only | Sim (multi-tenant) | SELECT, INSERT, DELETE |
| caixa_lancamentos | ATIVA | Server-only | Sim (multi-tenant) | SELECT, INSERT |
| simulacoes | ATIVA | Server-only | Sim (multi-tenant) | SELECT, INSERT |
| sku_custos | ATIVA (atípica — ver observação) | Server-only, mas via client **anônimo** sem escopo de usuário | Requer revisão | SELECT, UPSERT |
| strategies | ATIVA | Server-only | Não obrigatória (conteúdo editorial global) | SELECT |
| user_strategy_reads | ATIVA | Server-only | Sim (multi-tenant) | SELECT, INSERT, UPDATE |
| usage_counters | **ÓRFÃ** | — | — | nenhuma |
| _backup_caixa_lancamentos_orfos | **ÓRFÃ** (esperado) | — | — | nenhuma |
| _backup_caixa_relatorios_orfos | **ÓRFÃ** (esperado) | — | — | nenhuma |
| _backup_simulacoes_orfas | **ÓRFÃ** (esperado) | — | — | nenhuma |

## Detalhamento por tabela

### profiles
| Arquivo | Operação |
|---|---|
| `src/ui/Sidebar.tsx:113-117` | SELECT (`plan`) |
| `src/lib/getUserPlan.ts:17-21` | SELECT (`plan`) |
| `src/integrations/supabase/entitlements.ts:40-44` | SELECT (`plan`) |
| `src/app/api/ml/oauth/start/route.ts:40-44` | SELECT (`plan`) |
| `src/app/api/ml/oauth/callback/route.ts:276-280` | SELECT (`plan`) |
| `src/app/api/mp/webhook/route.ts:190-193, 221-223` | SELECT + UPDATE (`plan`), via `createAdminClient()` |

### subscriptions
| Arquivo | Operação |
|---|---|
| `src/integrations/supabase/entitlements.ts:46-50` | SELECT |
| `src/app/api/billing/subscribe/route.ts:40` | INSERT |
| `src/app/api/mp/create-subscription/route.ts:58-71` | UPSERT (onConflict `user_id,provider`) |
| `src/app/api/mp/webhook/route.ts:137-172` | SELECT + UPSERT (onConflict `provider_id`), via admin client |

### supplier_catalogs
| Arquivo | Operação |
|---|---|
| `src/app/dashboard/catalogos/page.tsx:31-38` | SELECT |
| `src/app/dashboard/produtos/catalogos/[id]/page.tsx:78-85` | SELECT |
| `src/lib/catalog/process-catalog.ts:56-238` | SELECT, UPDATE (status) |
| `src/app/api/internal/catalog-worker/route.ts:15-39` | SELECT, UPDATE (via admin) |
| `src/app/api/catalogos/analisar/route.ts:266-289` | INSERT |

### supplier_catalog_items
| Arquivo | Operação |
|---|---|
| `src/lib/catalog/process-catalog.ts:131,156-170` | DELETE, INSERT, SELECT |
| `src/app/dashboard/produtos/catalogos/[id]/page.tsx:91-97` | SELECT |
| `src/app/api/catalogos/analisar/route.ts:330-333` | INSERT |

### catalog_item_analysis
| Arquivo | Operação |
|---|---|
| `src/lib/catalog/process-catalog.ts:175,218` | DELETE, INSERT |
| `src/app/dashboard/produtos/catalogos/[id]/page.tsx:103-109` | SELECT |
| `src/app/api/catalogos/analisar/route.ts:422-424` | INSERT |

### catalog_runs
| Arquivo | Operação |
|---|---|
| `src/lib/catalog/process-catalog.ts:21-50 (upsertRun)` | SELECT, UPDATE, INSERT (via admin) |
| `src/app/api/catalogos/analisar/route.ts:135-150` | INSERT |

Nota: nenhuma tela lê `catalog_runs` para exibição — é usada só como log interno de progresso.

### catalog_ai_cache
| Arquivo | Operação |
|---|---|
| `src/server/catalog/cache.ts` | SELECT (89-93), UPSERT (140-143, onConflict `cache_key,version`), DELETE (171-174) |

### radar_searches
| Arquivo | Operação |
|---|---|
| `src/features/produtos/radar/server/saveRadarSearch.ts:65` | INSERT |
| `src/features/strategies/server/queries.ts:80-85` | SELECT |

### radar_cache
| Arquivo | Operação |
|---|---|
| `src/features/produtos/radar/server/saveRadarCache.ts:44-48` | UPSERT (onConflict `query_normalized,site_id`) |
| `src/features/produtos/radar/server/getRadarCache.ts:30-38` | SELECT |

### radar_favorites — ÓRFÃ
Nenhuma referência em `src/`. Existe migration (`20260314_radar_ml_history_favorites.sql`) e RLS
documentada no baseline, mas nenhum código do app atual lê ou escreve nela.

### ml_connections
| Arquivo | Operação |
|---|---|
| `src/app/dashboard/conta/page.tsx:86-97` | SELECT |
| `src/app/api/ml/oauth/callback/route.ts:363-368 (SELECT), 428-435 e 460-467 (UPDATE), 515-521 (UPSERT onConflict user_id)` | SELECT, UPDATE, UPSERT |

Dado sensível: guarda `access_token`/`refresh_token` do Mercado Livre. RLS crítica — não relaxar.

### ml_sync_logs — ÓRFÃ
Nenhuma referência em `src/`.

### dre_ai_insights — ÓRFÃ
Nenhuma referência em `src/`. O endpoint `src/app/api/ai/dre-insights/route.ts` usa as tabelas
genéricas `ai_cache` e `ai_usage`, não `dre_ai_insights`.

### ai_cache
| Arquivo | Operação |
|---|---|
| `src/app/api/ai/dre-insights/route.ts:104-107 (SELECT), 126-127 (UPSERT onConflict key)` | SELECT, UPSERT |

Chamadas envoltas em try/catch que trata erro `42P01` (tabela inexistente) como não-fatal —
sinal de que o código foi escrito para tolerar a ausência dessa tabela.

### ai_usage
| Arquivo | Operação |
|---|---|
| `src/app/api/ai/dre-insights/route.ts:66-69 (SELECT), 87-88 (UPSERT onConflict user_id)` | SELECT, UPSERT |

Mesmo tratamento tolerante a tabela ausente.

Confirmado: as rotas `src/app/api/ai/dre-risk`, `full-vs-flex`, `price-suggest` não importam
Supabase e não usam nenhuma tabela de banco. A rota `produtos-rank` mencionada em relatórios
anteriores não existe no projeto atual (não encontrada em `src/app/api/ai/`).

### caixa_relatorios
| Arquivo | Operação |
|---|---|
| `src/app/api/caixa/route.ts:36-40` | SELECT |
| `src/app/api/caixa/[id]/route.ts:28-33` | SELECT |
| `src/app/api/caixa/upload/route.ts:245-253 (INSERT), 273 (DELETE de rollback)` | INSERT, DELETE |

### caixa_lancamentos
| Arquivo | Operação |
|---|---|
| `src/app/api/caixa/route.ts:53-59` | SELECT |
| `src/app/api/caixa/[id]/route.ts:39-47` | SELECT |
| `src/app/api/caixa/upload/route.ts:268-270` | INSERT |

### simulacoes
| Arquivo | Operação |
|---|---|
| `src/app/api/simulacoes/route.ts:56-59 (COUNT), 85-90 (SELECT), 193-211 (INSERT)` | SELECT, INSERT |
| `src/app/api/simulacoes/[id]/route.ts:83-103` | SELECT |
| `src/app/api/upload-planilha/route.ts:94-97 (COUNT), 320-324 (INSERT)` | SELECT, INSERT |
| `src/integrations/supabase/salvarSimulacao.ts` | não acessa a tabela diretamente — helper client-side que faz `fetch("/api/simulacoes")` |

### sku_custos
| Arquivo | Operação |
|---|---|
| `src/app/api/sku/route.ts:9-15 (SELECT), 34-38 (UPSERT onConflict sku)` | SELECT, UPSERT |

**Observação importante**: este endpoint usa `src/lib/supabaseClient.ts`, que cria um client
Supabase com a anon key, sem sessão de usuário (`supabase.auth.getUser()` nunca é chamado) e
sem qualquer filtro `.eq("user_id", ...)`. Não há coluna de usuário no payload. Isso indica que
`sku_custos` é tratada como tabela global/compartilhada (não multi-tenant), acessada com
privilégio de client anônimo. Se RLS estiver habilitada exigindo `auth.uid()`, este endpoint
quebra silenciosamente; se RLS permitir leitura/escrita pública, qualquer visitante não
autenticado pode ler e sobrescrever custos de SKU. **Checar a política atual antes de mexer.**

### strategies
| Arquivo | Operação |
|---|---|
| `src/features/strategies/server/queries.ts:41-45` | SELECT (conteúdo publicado) |
| `src/features/strategies/server/generateRadarRecommendation.ts:78-83` | SELECT |

Tabela de conteúdo editorial global (título, categoria, corpo do artigo) — não contém dado de
usuário, RLS de leitura pode ser pública/autenticada simples.

### user_strategy_reads
| Arquivo | Operação |
|---|---|
| `src/features/strategies/server/queries.ts:46-49` | SELECT |
| `src/features/strategies/server/mutations.ts:7-42` | SELECT, UPDATE, INSERT |

### usage_counters — ÓRFÃ
Nenhuma referência em `src/`.

### _backup_caixa_lancamentos_orfos, _backup_caixa_relatorios_orfos, _backup_simulacoes_orfas — ÓRFÃS (confirmado)
Nenhuma referência em `src/` para nenhuma das três. Não removidas nem alteradas — apenas
confirmado que o código atual não as usa, conforme instrução explícita de não apagar.

## Pontos de atenção para a decisão de saneamento

1. **6 tabelas sem nenhum uso no código**: `radar_favorites`, `ml_sync_logs`, `dre_ai_insights`,
   `usage_counters`, e as 3 `_backup_*` (essas últimas já eram esperadas como órfãs).
   Candidatas a tabelas mortas se também não houver uso fora do app (outro serviço, cron
   externo, admin manual) — **não remover só por isso**, apenas marcar como candidatas.
2. **`ai_cache`/`ai_usage`**: o código tolera a ausência dessas tabelas (trata erro `42P01`
   como não-fatal) — sinal de que já são tratadas como "opcionais" no fluxo atual.
3. **`sku_custos`**: único caso de acesso via client anônimo sem escopo de usuário — revisar
   política de RLS antes de qualquer alteração; risco de exposição pública se RLS permitir
   escrita.
4. **`catalog_runs`**: só é escrita, nunca lida por nenhuma tela — log interno de progresso.
5. Todas as tabelas multi-tenant identificadas (`profiles`, `subscriptions`, `supplier_catalogs`,
   `supplier_catalog_items`, `catalog_item_analysis`, `catalog_runs`, `radar_searches`,
   `ml_connections`, `ai_usage`, `caixa_relatorios`, `caixa_lancamentos`, `simulacoes`,
   `user_strategy_reads`) são acessadas exclusivamente por rotas server-side com sessão do
   usuário (`createServerClient`) ou pelo client admin (`createAdminClient`, usado em
   `process-catalog.ts`, `catalog-worker`, e no webhook do Mercado Pago) — nenhuma é tocada
   diretamente do browser.
