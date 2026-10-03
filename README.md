# Mora Fácil

Portal imobiliário de Ipuã-SP com mapa, filtros e anúncios.

## Desenvolvimento

```bash
npm install
npm run dev
```

Sem Supabase configurado, o modo local usa o armazenamento do navegador para testar o fluxo.

## Ativar contas e anúncios permanentes

1. Crie um projeto em [Supabase](https://supabase.com).
2. No SQL Editor, execute [`supabase/schema.sql`](supabase/schema.sql).
3. Copie `.env.example` para `.env` e preencha a URL e a chave `anon` do projeto.
4. No GitHub Pages, adicione as mesmas variáveis em `Settings > Secrets and variables > Actions > Variables`.
5. No Vercel, adicione-as em `Settings > Environment Variables`.

Os visitantes continuam navegando sem conta. O login só é solicitado ao publicar ou gerenciar anúncios.

## Anúncios em destaque na Home

Em bancos existentes, execute [`supabase/migrations/20261003_add_home_featured_listings.sql`](supabase/migrations/20261003_add_home_featured_listings.sql) no SQL Editor do Supabase. Administradores podem selecionar anúncios publicados em “Meus Imóveis”, ativar “Destacar na página inicial” e definir sua ordem. Apenas anúncios aprovados e destacados aparecem no carrossel.

## Verificação

```bash
npm run lint
npm run build
```
