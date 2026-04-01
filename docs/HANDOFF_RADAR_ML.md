# Handoff Radar ML

## O que foi adicionado
- Integração do Radar com a busca pública do Mercado Livre.
- Salvamento automático do histórico de consultas do seller.
- Ranking das melhores oportunidades da semana com base nas buscas do próprio usuário.
- Favoritos por seller para guardar keywords e anúncios que merecem acompanhamento.

## Rotas novas
- `POST /api/ai/opportunity-radar`
- `GET /api/ai/opportunity-radar/history`
- `GET /api/ai/opportunity-radar/ranking`
- `GET /api/ai/opportunity-radar/favorites`
- `POST /api/ai/opportunity-radar/favorites`

## Banco de dados
Rodar a migration:
- `supabase/migrations/20260314_radar_ml_history_favorites.sql`

Tabelas criadas:
- `radar_searches`
- `radar_favorites`

## Fluxo
1. Seller faz busca no Radar.
2. O backend consulta o Mercado Livre.
3. O resultado principal é salvo em `radar_searches`.
4. O front atualiza histórico, ranking semanal e favoritos.

## Observações
- O módulo continua bloqueado para usuários fora do plano PLUS.
- O ranking da semana é individual por seller, usando os últimos 7 dias.
- Os favoritos são únicos por `user_id + keyword`.
- Se quiser evoluir depois, dá para adicionar alertas automáticos, etiquetas e comparação entre semanas.
