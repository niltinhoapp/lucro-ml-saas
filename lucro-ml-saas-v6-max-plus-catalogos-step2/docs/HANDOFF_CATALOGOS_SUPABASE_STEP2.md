# Handoff — Catálogos + Supabase (Step 2)

## O que foi alinhado
- módulo de catálogos ajustado para o schema real baseado em `user_id`
- remoção da dependência implícita de `workspace_id` no salvamento
- gravação compatível com:
  - `supplier_catalogs`
  - `supplier_catalog_items`
  - `catalog_item_analysis`
  - `catalog_runs`
- histórico de catálogos exibido na tela principal
- página de detalhe criada em `/dashboard/catalogos/[id]`
- retorno da API agora informa `savedCatalogId`

## Observações
- a análise continua leve e compatível com PDFs baseados em texto
- o score ainda é heurístico, para manter baixo custo
- o fluxo visual segue o mesmo `globals.css`
- a atualização de `usage_counters` só acontece se já existir a linha do usuário

## Próximo passo natural
- conectar lookup real de Mercado Livre por item
- adicionar filtros por score/risco
- integrar botão "enviar para simulador" por item salvo
