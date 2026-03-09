# Lucro ML SaaS 2.0 — mudanças aplicadas

## O que entrou
- Novo dashboard mais executivo em `src/app/dashboard/page.tsx`
- Novo módulo de Inteligência em `src/app/dashboard/inteligencia/page.tsx`
- Novo módulo Radar em `src/app/dashboard/radar/page.tsx`
- Nova página pública de aquisição em `src/app/(public)/raio-x/page.tsx`
- Biblioteca mock inicial em `src/lib/market/mock.ts`
- Componentes de mercado em `src/components/market/*`
- Navegação atualizada na sidebar e home pública
- Classes CSS novas no final de `src/app/globals.css`

## Ideia estratégica adicionada
A função de aquisição é o **Raio-X de Produto compartilhável**:
- o seller pesquisa um produto
- recebe score, preço médio, anúncios ativos e saturação
- compartilha isso em grupos
- o compartilhamento vira tráfego e prova social do SaaS

## Próximo passo recomendado
Trocar os mocks de `src/lib/market/mock.ts` por dados reais vindos de integração / cache de mercado.


## Ajustes de UX — sellers
- textos das telas principais encurtados e focados em decisão rápida
- dashboard, home, inteligência, radar e raio-x com copy mais objetiva
- botões padronizados com a mesma altura, padding, peso e raio
- CTA principais reduzidos para verbos curtos: Entrar, Abrir, Atualizar, Gerar
