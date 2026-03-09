# Handoff — Catálogos PLUS

## O que entrou
- novo módulo em `/dashboard/catalogos`
- API `POST /api/catalogos/analisar`
- parser leve para PDF/TXT/CSV sem dependência extra
- leitura organizada por item, margem, risco e score
- suporte a planos `free`, `pro`, `plus`
- checkout e Mercado Pago preparados para PLUS
- migration inicial para `supplier_catalogs` e `supplier_catalog_items`

## Como isso se conecta ao projeto
- mesma linguagem visual do dashboard atual
- usa `globals.css` já consolidado, com classes novas isoladas
- segue a lógica existente de entitlements no Supabase
- não interfere no simulador, DRE ou histórico
- o PLUS expande o sistema em vez de criar um módulo solto

## Limitações desta fase
- extração de PDF funciona melhor com PDFs baseados em texto
- PDFs imagem ainda podem precisar de OCR em etapa futura
- a análise atual usa regras e score determinístico, sem depender de custo alto de IA
- salvamento no banco é opcional: se as tabelas ainda não existirem, a análise continua funcionando

## Ordem recomendada
1. aplicar `supabase/migrations/20260308_catalogos_plus.sql`
2. testar checkout PRO e PLUS
3. validar webhook do Mercado Pago
4. testar `/dashboard/catalogos` com PDF simples e TXT
5. depois evoluir matching com Mercado Livre / OCR / IA avançada
