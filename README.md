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

## Verificação

```bash
npm run lint
npm run build
```
