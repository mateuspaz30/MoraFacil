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
2. No SQL Editor, execute [`supabase/schema.sql`](supabase/schema.sql). O schema inclui as tabelas, funções, índices, políticas RLS e o bucket de imagens necessários para um banco novo.
3. Copie `.env.example` para `.env` e preencha a URL e a chave `anon` do projeto.
4. No GitHub Pages, adicione as mesmas variáveis em `Settings > Secrets and variables > Actions > Variables`.
5. No Vercel, adicione-as em `Settings > Environment Variables`.

Os visitantes continuam navegando sem conta. O login só é solicitado ao publicar ou gerenciar anúncios.

A permissão inicial de administrador deve ser provisionada separadamente para a conta escolhida em cada ambiente. Não conceda essa permissão automaticamente a usuários públicos.

## Perfis de usuário

O cadastro permite escolher entre pessoa física, corretor e imobiliária. Para bancos existentes, execute [`supabase/migrations/20261119_add_user_profiles.sql`](supabase/migrations/20261119_add_user_profiles.sql), [`supabase/migrations/20261119_enable_user_profile_updates.sql`](supabase/migrations/20261119_enable_user_profile_updates.sql) e [`supabase/migrations/20261119_make_account_identifiers_immutable.sql`](supabase/migrations/20261119_make_account_identifiers_immutable.sql), nesta ordem, no SQL Editor do Supabase. As migrações criam os perfis vinculados às contas, validam CPF/CNPJ/CRECI, impedem duplicidades, permitem a edição de dados não permanentes e bloqueiam alterações de CPF, CNPJ, CRECI e e-mail.

Usuários autenticados podem acessar a área pessoal em `/minha-area` para consultar seus imóveis e dados cadastrais. Pessoas físicas e corretores têm atalhos para “Meus Imóveis” e “Minha Conta”. Imobiliárias têm navegação própria com Dashboard, imóveis, estatísticas, perfil público e conta.

Para bancos existentes, depois das migrações de perfil acima, execute [`supabase/migrations/20261121_company_public_profiles.sql`](supabase/migrations/20261121_company_public_profiles.sql). Ela cria o slug público da imobiliária, os campos de cidade/descrição/logo e a função `get_public_company_profile`, que disponibiliza apenas informações públicas sem expor CNPJ ou dados do responsável. A cidade e a descrição podem ser preenchidas em “Minha Área” > “Minha Conta”; logo e indicadores avançados permanecem para etapas futuras.

Para habilitar as estatísticas por imóvel em bancos existentes, execute [`supabase/migrations/20261121_company_listing_statistics.sql`](supabase/migrations/20261121_company_listing_statistics.sql) depois das migrações de favoritos. A função retorna, apenas para o usuário autenticado, a contagem de favoritos recebidos por anúncio, sem liberar acesso às linhas da tabela `favorites`.

O Dashboard da imobiliária identifica anúncios com muitos acessos e poucos contatos, anúncios sem visualizações e a maior taxa de interesse. Em Estatísticas, a taxa por imóvel é calculada como cliques no WhatsApp divididos por visualizações; anúncios sem visualizações exibem 0,0%.

A seção “Bairros mais procurados” agrupa visualizações, cliques no WhatsApp, favoritos e quantidade atual de anúncios ativos por bairro.

Para habilitar filtros por período e histórico de visualizações, cliques no WhatsApp e novas marcações de favoritos, execute [`supabase/migrations/20261124_company_metric_history.sql`](supabase/migrations/20261124_company_metric_history.sql) no SQL Editor do Supabase depois das migrations que criam `listings`, `favorites` e os contadores acumulados. Os contadores acumulados existentes não são alterados; o histórico começa quando a migration é aplicada e, portanto, não há reconstrução de datas antigas. A remoção de um favorito não apaga o evento de marcação já registrado. A migration [`supabase/migrations/20261124_tag_demo_metric_events.sql`](supabase/migrations/20261124_tag_demo_metric_events.sql) adiciona a origem do evento (`live` ou `demo`) sem reclassificar eventos existentes.

## Dados de demonstração Jardim Verde

Para bancos existentes, execute [`supabase/migrations/20261122_add_chacara_property_category.sql`](supabase/migrations/20261122_add_chacara_property_category.sql), [`supabase/migrations/20261124_company_metric_history.sql`](supabase/migrations/20261124_company_metric_history.sql) e [`supabase/migrations/20261124_tag_demo_metric_events.sql`](supabase/migrations/20261124_tag_demo_metric_events.sql), nessa ordem, e então execute [`supabase/seeds/jardim_verde_demo.sql`](supabase/seeds/jardim_verde_demo.sql) no SQL Editor do Supabase. O seed cria 16 anúncios aprovados marcados como demonstração, com fotos externas, métricas e localizações aproximadas; ele localiza a imobiliária pelos dados de `user_profiles` ou pelos metadados de `auth.users` e interrompe a transação se a correspondência não for única, os bairros não estiverem ativos ou as contas visitantes de teste não forem encontradas. Também cria eventos identificados como `demo`, distribuídos pelo período dos últimos 90 dias, para visualizações, cliques no WhatsApp e favoritos. Ao reexecutar o seed, os eventos `demo` desses anúncios são recriados para manter o intervalo atualizado, enquanto eventos reais e contadores acumulados já existentes são preservados. As contas visitantes devem ser exclusivas de demonstração. Como o sistema conta favoritos por usuário autenticado, esses três visitantes geram no máximo três favoritos por anúncio; para simular contagens maiores, cadastre visitantes de teste adicionais e ajuste a carga.

Para bancos existentes, execute [`supabase/migrations/20261119_add_listing_view_count.sql`](supabase/migrations/20261119_add_listing_view_count.sql) no SQL Editor do Supabase. A migração adiciona o contador de visualizações e a função atômica que o incrementa ao abrir os detalhes de um imóvel aprovado.

Para bancos existentes, execute [`supabase/migrations/20261119_add_listing_whatsapp_clicks.sql`](supabase/migrations/20261119_add_listing_whatsapp_clicks.sql) no SQL Editor do Supabase. A migração adiciona o contador de cliques de contato e a função atômica que o incrementa ao clicar em um botão de contato de um imóvel aprovado.

## Anúncios em destaque na Home

Em bancos existentes, execute [`supabase/migrations/20261003_add_home_featured_listings.sql`](supabase/migrations/20261003_add_home_featured_listings.sql) no SQL Editor do Supabase. Administradores organizam os anúncios aprovados em “Minha Área” > “Administração” > “Destaques da Home”. Apenas anúncios aprovados e destacados aparecem no carrossel.

## Bairros controlados

Em bancos existentes, execute [`supabase/migrations/20261010_create_managed_neighborhoods.sql`](supabase/migrations/20261010_create_managed_neighborhoods.sql) no SQL Editor do Supabase. A migração cria e preenche a tabela de bairros, associa os bairros existentes aos anúncios e impede novos anúncios com bairros ausentes ou inativos. Se houver anúncios sem bairro, preencha esse dado antes de executar a migração. Administradores gerenciam bairros em “Minha Área” > “Administração” > “Gerenciar Bairros”; bairros são desativados, não excluídos.

## Administração

Administradores acessam o módulo em “Minha Área” > “Administração”. As permissões continuam sendo determinadas pela função existente `is_admin()` e pelas policies atuais. Para habilitar a pausa de anúncios em bancos existentes, execute [`supabase/migrations/20261121_add_paused_listing_status.sql`](supabase/migrations/20261121_add_paused_listing_status.sql) no SQL Editor do Supabase. A migração apenas inclui `pausado` na restrição de status; não altera RLS nem policies.

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
