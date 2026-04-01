# Handoff — OAuth Mercado Livre no LucroML

## O que foi adicionado
- Rotas `api/ml/oauth/start`, `api/ml/oauth/callback` e `api/ml/notifications`
- Integração com PKCE
- Página `dashboard/conta`
- Item de menu `Integrações ML` no módulo Conta
- Migração Supabase `20260315_ml_connections.sql`

## Variáveis de ambiente necessárias
```env
ML_APP_ID=
ML_CLIENT_SECRET=
ML_REDIRECT_URI=https://lucro.conectweb.online/api/ml/oauth/callback
ML_AUTH_URL=https://auth.mercadolivre.com.br/authorization
ML_TOKEN_URL=https://api.mercadolibre.com/oauth/token
ML_API_URL=https://api.mercadolibre.com
```

## Fluxo
1. Usuário Plus entra em `/dashboard/conta`
2. Clica em `Conectar Mercado Livre`
3. Vai para `/api/ml/oauth/start`
4. O app monta o OAuth com PKCE
5. O callback troca `code` por token e grava em `ml_connections`

## Próximos passos sugeridos
- Refresh automático do token com cron/job
- Consumir `orders`, `shipments`, `items` e `catalog`
- Persistir notificações em tabela própria
