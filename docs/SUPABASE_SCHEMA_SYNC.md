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

## Estado conhecido pelo código

O código atual usa, entre outras, as seguintes tabelas:

- `profiles`
- `subscriptions`
- `supplier_catalogs`
- `supplier_catalog_items`
- `catalog_item_analysis`
- `catalog_runs`
- `radar_searches`
- `radar_favorites`
- `ml_connections`

As migrations atuais do repositório não representam completamente o schema esperado pelo código. Exemplos:

- `catalog_item_analysis` e `catalog_runs` são usadas pela aplicação, mas não constam nas migrations versionadas encontradas.
- `supplier_catalog_items` possui divergência entre as colunas da migration antiga e as colunas usadas pela API atual.
- `ml_connections` possui divergência entre a migration antiga e os campos usados pelo OAuth atual.

## Extração do schema vivo

Executar no checkout local do projeto, sem copiar segredos para o GitHub.

### Opção recomendada — Supabase CLI

```powershell
cd "D:\usuario1\niltinho\webcenter\lucro-ml-saas-atual"

supabase --version
supabase login
supabase link --project-ref rkxexvstpatmetaoypgb

New-Item -ItemType Directory -Force -Path supabase\snapshot | Out-Null
supabase db dump --linked --schema public -f supabase\snapshot\production-public-schema.sql
```

Se a versão instalada da CLI não aceitar `--linked`, consultar `supabase db dump --help` e usar a sintaxe equivalente da versão instalada.

### Inventário complementar

Além do schema `public`, registrar migrations remotas e estado de conexão:

```powershell
supabase migration list
supabase projects list
```

Não commitar saída contendo credenciais.

## Próxima etapa após o dump

1. Adicionar `supabase/snapshot/production-public-schema.sql` na branch de saneamento.
2. Comparar esse snapshot com `supabase/migrations/*`.
3. Criar migration consolidada/fix-forward, sem reescrever migrations já aplicadas de forma destrutiva.
4. Identificar objetos órfãos e código morto.
5. Testar banco limpo criado apenas pelas migrations versionadas.
6. Somente depois remover artefatos antigos e promover a versão estável para `main`.

## CI/CD Supabase

GitHub não deve executar mudanças destrutivas no banco de produção a cada push comum. O fluxo recomendado é:

- pull request: validação/lint/diff de migrations;
- merge em branch protegida: deploy controlado de migrations;
- produção: secrets protegidos no GitHub Actions e execução explícita do Supabase CLI;
- migrations sempre `forward-only` e revisadas.

A automação GitHub → Supabase será adicionada somente depois que o schema real estiver alinhado e reproduzível a partir do repositório.
