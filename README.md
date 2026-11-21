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

## Perfis de usuário

O cadastro permite escolher entre pessoa física, corretor e imobiliária. Para bancos existentes, execute [`supabase/migrations/20261119_add_user_profiles.sql`](supabase/migrations/20261119_add_user_profiles.sql), [`supabase/migrations/20261119_enable_user_profile_updates.sql`](supabase/migrations/20261119_enable_user_profile_updates.sql) e [`supabase/migrations/20261119_make_account_identifiers_immutable.sql`](supabase/migrations/20261119_make_account_identifiers_immutable.sql), nesta ordem, no SQL Editor do Supabase. As migrações criam os perfis vinculados às contas, validam CPF/CNPJ/CRECI, impedem duplicidades, permitem a edição de dados não permanentes e bloqueiam alterações de CPF, CNPJ, CRECI e e-mail.

Usuários autenticados podem acessar a área pessoal em `/minha-area` para consultar seus imóveis e dados cadastrais.

Para bancos existentes, execute [`supabase/migrations/20261119_add_listing_view_count.sql`](supabase/migrations/20261119_add_listing_view_count.sql) no SQL Editor do Supabase. A migração adiciona o contador de visualizações e a função atômica que o incrementa ao abrir os detalhes de um imóvel aprovado.

Para bancos existentes, execute [`supabase/migrations/20261119_add_listing_whatsapp_clicks.sql`](supabase/migrations/20261119_add_listing_whatsapp_clicks.sql) no SQL Editor do Supabase. A migração adiciona o contador de cliques de contato e a função atômica que o incrementa ao clicar em um botão de contato de um imóvel aprovado.

## Anúncios em destaque na Home

Em bancos existentes, execute [`supabase/migrations/20261003_add_home_featured_listings.sql`](supabase/migrations/20261003_add_home_featured_listings.sql) no SQL Editor do Supabase. Administradores organizam os anúncios aprovados em “Minha Área” > “Administração” > “Destaques da Home”. Apenas anúncios aprovados e destacados aparecem no carrossel.

## Bairros controlados

Em bancos existentes, execute [`supabase/migrations/20261010_create_managed_neighborhoods.sql`](supabase/migrations/20261010_create_managed_neighborhoods.sql) no SQL Editor do Supabase. A migração cria e preenche a tabela de bairros, associa os bairros existentes aos anúncios e impede novos anúncios com bairros ausentes ou inativos. Se houver anúncios sem bairro, preencha esse dado antes de executar a migração. Administradores gerenciam bairros em “Minha Área” > “Administração” > “Gerenciar Bairros”; bairros são desativados, não excluídos.

## Administração

Administradores acessam o módulo em “Minha Área” > “Administração”. As permissões continuam sendo determinadas pela função existente `is_admin()` e pelas policies atuais. Nenhuma migration adicional é necessária para o painel.

A tela “Usuários” lista contas e concede/remove permissões administrativas por meio da Edge Function protegida `admin-management`. Para bancos existentes, publique a função no projeto Supabase:

```bash
supabase functions deploy admin-management
```

A função valida cada chamada com a sessão autenticada e `is_admin()` antes de usar a chave de serviço no servidor. Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no frontend ou no repositório; configure-a apenas como segredo do projeto Supabase caso ela não esteja disponível como variável padrão da Edge Function.

## Verificação

```bash
npm run lint
npm run build
```
