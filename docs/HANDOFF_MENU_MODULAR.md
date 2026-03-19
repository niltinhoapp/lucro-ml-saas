# Handoff menu modular e planos

Alterações aplicadas neste pacote:

- Menu lateral reorganizado por módulos/pastas: Produtos, Lucro, Operação, Estratégia e Conta.
- Dashboard inicial reorganizado para refletir os módulos.
- Plano PLUS mantido acima do PRO na navegação e no checkout.
- Radar ML, Catálogos e Estratégias ML posicionados como recursos premium do PLUS.
- PRO mantido como camada operacional principal.
- Ajuste de TypeScript em `src/app/api/ai/opportunity-radar/route.ts` para evitar erro no `tsc --noEmit`.
- Novo componente `src/ui/SidebarNavClient.tsx` para navegação modular com destaque do item ativo.
