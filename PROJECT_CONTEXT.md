# Contexto do projeto Mora Fácil

## Objetivo

O Mora Fácil é um portal imobiliário voltado principalmente a Ipuã-SP. Ele permite que visitantes encontrem imóveis para venda ou aluguel, consultem anúncios em mapa e entrem em contato com anunciantes. Usuários podem cadastrar e acompanhar anúncios; administradores podem moderá-los e manter dados do portal.

## Arquitetura atual

- Aplicação web de página única (SPA), renderizada no navegador com React e servida/desenvolvida pelo Vite.
- A interface, o estado das páginas e os fluxos de negócio ficam no cliente. `src/App.jsx` concentra boa parte desses fluxos; componentes de apresentação de anúncios estão em `src/ListingShowcase.jsx`.
- A integração com Supabase é feita diretamente pelo cliente oficial, inicializado em `src/lib/supabase.js` com variáveis `VITE_*`. Não há uma API ou servidor de aplicação próprio no repositório.
- Com Supabase configurado, autenticação, consultas e gravações vão diretamente para Supabase. Sem configuração, o portal apresenta anúncios de demonstração e permite testar anúncios localmente, guardando-os no `localStorage` do navegador.
- Os mapas usam Leaflet/OpenStreetMap. O formulário consulta ViaCEP para CEP e Nominatim para localizar endereços.
- O workflow em `.github/workflows/deploy-pages.yml` compila e publica no GitHub Pages; também copia `index.html` para `404.html` para dar suporte a rotas da SPA. O README menciona Vercel como opção de hospedagem, mas não há workflow de deploy para Vercel configurado no repositório.

## Tecnologias utilizadas

- JavaScript com módulos ES; React 19 e React DOM.
- Vite 8 e plugin React para desenvolvimento e build.
- Supabase JS 2 para autenticação, banco de dados e Storage.
- Leaflet 1.9 e React Leaflet 5 para mapas e marcadores.
- CSS próprio, dividido entre estilos globais e estilos da aplicação/vitrine.
- Oxlint para lint; GitHub Actions e Node.js 20 no workflow de publicação.
- Supabase PostgreSQL para persistência, Row Level Security (RLS) e políticas do Storage.

## Estrutura de pastas

```text
.
├── .github/workflows/       # Pipeline de build e publicação no GitHub Pages
├── public/                  # Arquivos públicos servidos sem processamento
├── src/
│   ├── assets/              # Logos, ilustrações e imagens
│   ├── lib/                 # Integrações, incluindo inicialização do Supabase
│   ├── App.jsx              # Aplicação e principais fluxos de interface
│   ├── ListingShowcase.jsx  # Vitrine e apresentação de anúncios
│   ├── listingPresentation.js # Formatação e classificação de anúncios
│   └── *.css                # Estilos da aplicação
├── supabase/
│   ├── migrations/          # Migrações SQL incrementais
│   └── schema.sql           # Schema e políticas-base do Supabase
├── .env.example             # Exemplo de configuração local
├── package.json             # Dependências e scripts
└── vite.config.js           # Configuração do Vite e caminho-base de publicação
```

## Funcionamento da autenticação

- Visitantes podem navegar sem conta. Com Supabase configurado, é necessário entrar ou criar uma conta para publicar e acompanhar anúncios.
- A autenticação usa Supabase Auth por e-mail e senha: `signInWithPassword` para login e `signUp` para cadastro. O nome informado no cadastro é salvo como metadado `full_name`.
- A aplicação recupera a sessão existente e acompanha alterações com `getSession` e `onAuthStateChange`. O estado administrativo é obtido pela função RPC `is_admin()`.
- Dependendo da configuração de confirmação de e-mail do projeto Supabase, uma conta criada pode exigir confirmação antes do primeiro login.
- As credenciais do cliente são `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. A chave usada no front-end deve ser a chave pública `anon`; a segurança dos dados depende das políticas RLS, não de esconder essa chave.
- Sem essas variáveis, não há autenticação persistente: o modo local usa dados do navegador e serve apenas para demonstração/teste.

## Estrutura do banco Supabase

### Tabelas e funções

- `public.listings`: anúncios, com proprietário (`user_id` ligado a `auth.users`), título, tipo/categoria, finalidade, status de moderação, preço, características, endereço, bairro, descrição, imagens, dados do anunciante, coordenadas e data de criação. Os campos de destaque da Home são `destaque_home` e `ordem_destaque`; a reprovação pode registrar `motivo_reprovacao`.
- `public.favorites`: relação entre usuários autenticados e anúncios favoritos, com chave única por par usuário/anúncio e exclusão em cascata quando a conta ou o anúncio é removido.
- `public.neighborhoods`: nome do bairro, situação ativa/inativa e data de criação. O nome é referenciado pelos anúncios; há índice único que desconsidera diferenças de caixa, acentos e espaços repetidos.
- `public.admin_users`: associação entre usuários autenticados e o perfil administrativo.
- `public.is_admin()`: função usada pelas políticas e pelo cliente para identificar administradores.
- `public.normalize_neighborhood_name()` e `public.require_active_listing_neighborhood()`: normalização e validação de bairros, incluindo trigger para impedir novos anúncios com bairro inexistente/inativo.

### Acesso e armazenamento

- RLS está habilitado em `listings`, `favorites`, `admin_users` e `neighborhoods`.
- Anúncios aprovados são visíveis publicamente; proprietários veem seus próprios anúncios e administradores podem gerenciá-los. Novos anúncios autenticados começam `em_analise`.
- Em `favorites`, cada usuário autenticado só pode consultar, adicionar e remover os próprios favoritos; a política de inclusão permite apenas anúncios aprovados.
- `public.count_my_listing_favorites()` permite ao usuário autenticado consultar somente a contagem agregada de favoritos recebidos em seus próprios anúncios.
- Administradores podem moderar anúncios e gerenciar bairros. Bairros inativos deixam de ser opções para novos anúncios; bairros referenciados não podem ser excluídos.
- A migração `20260920_create_property_images_bucket.sql` cria o bucket público `property-images`. Leitura das imagens é pública; envio, atualização e exclusão exigem autenticação e restringem o caminho ao identificador do próprio usuário.
- As migrações em `supabase/migrations/` registram a evolução do banco: localização, Storage de imagens, administração, vagas, tipo comercial, galeria, moderação, destaques, bairros gerenciados, perfis, métricas e favoritos.

## Funcionalidades concluídas

- Busca e filtros de imóveis por cidade, finalidade/categoria, bairro e número mínimo de quartos, além de faixas de preço.
- Mapa interativo com marcadores, camadas e visualização ampliada; vitrine de cartões e páginas de detalhe por anúncio.
- Carrossel de anúncios destacados na Home.
- Cadastro e edição de anúncios com dados do imóvel, consulta de CEP, localização por endereço ou ajuste do marcador no mapa e galeria de até cinco fotos.
- Cadastro/login de usuários e painel “Meus Imóveis” com estados em análise, publicados, reprovados e concluídos.
- Favoritos de anúncios para usuários autenticados, com corações na vitrine, nos cartões do mapa e nos detalhes, além da página “Favoritos” na Minha Área. Visitantes são convidados a entrar; a tabela usa RLS para isolar os favoritos por usuário.
- Fluxo administrativo para aprovar/reprovar anúncios, registrar motivo de reprovação, marcar anúncio como concluído e ordenar destaques.
- Gerenciamento administrativo de bairros, incluindo inclusão, edição, ativação/desativação e exclusão quando não há anúncios vinculados.
- Modo de demonstração local, com anúncios de exemplo e persistência de anúncios do usuário no `localStorage`.
- Build e publicação automatizados no GitHub Pages.

## Funcionalidades em desenvolvimento

O banco de cada ambiente existente precisa receber as migrações incrementais correspondentes. Para ativar favoritos em um banco existente, execute `supabase/migrations/20261120_create_favorites.sql` e `supabase/migrations/20261121_count_listing_favorites.sql` no SQL Editor do Supabase. Bancos novos também recebem a tabela, as políticas e a função pelo `supabase/schema.sql`.

## Pendências técnicas encontradas

1. **Schema-base incompleto para vagas:** a aplicação lê e grava `parking_spaces`, e existe a migração `20260928_add_parking_spaces.sql`, mas `supabase/schema.sql` não declara essa coluna. Um banco recém-criado apenas com o schema-base pode falhar ao salvar ou exibir esse campo corretamente. Incluir a coluna no schema-base ou garantir/documentar a execução da migração.
2. **Evolução manual do banco:** as alterações estão em arquivos SQL executados manualmente; não há configuração do Supabase CLI nem fluxo automatizado de aplicação/validação de migrações no repositório. Bancos locais, de teste e produção podem divergir.
3. **Configuração de produção externa ao código:** o build precisa receber as variáveis do Supabase no ambiente de deploy. Sem elas, o modo local/demo é ativado, não sendo adequado para persistência de produção.
4. **Provisionamento administrativo:** uma migração de administração associa um usuário inicial por e-mail fixo. Esse procedimento deve ser revisto e controlado para cada ambiente antes da implantação.
5. **Testes automatizados ausentes:** `package.json` define `lint` e `build`, mas não há script ou suíte de testes automatizados configurados.
6. **Concentração de responsabilidades:** `src/App.jsx` reúne muitos estados, efeitos, consultas e componentes/fluxos. Essa concentração aumenta o custo de manutenção e dificulta testar regras isoladamente.
7. **Dependência de serviços externos no navegador:** a busca de CEP e geocodificação dependem de ViaCEP e Nominatim. Indisponibilidade, limites de uso ou mudanças desses serviços podem afetar o preenchimento do endereço e a localização.

## Próximas melhorias recomendadas

1. Sincronizar `supabase/schema.sql` com todas as colunas requeridas pela aplicação, especialmente `parking_spaces`, e validar a criação de um banco limpo.
2. Adotar Supabase CLI e migrações versionadas/automatizadas para que a mesma sequência seja aplicada e validada em desenvolvimento, teste e produção.
3. Documentar um checklist de implantação: variáveis de ambiente, confirmação de e-mail, provisionamento de administradores, execução das migrações e configuração de Storage/RLS.
4. Criar testes focados para regras de filtragem, normalização de anúncios e fluxos críticos; incluir o lint (e os testes, quando disponíveis) na CI.
5. Extrair componentes e hooks de autenticação, anúncios, moderação, bairros e mapas de `App.jsx`, preservando o comportamento atual e facilitando testes.
6. Avaliar uma estratégia resiliente e compatível com as políticas dos serviços externos de CEP/geocodificação, com tratamento de indisponibilidade e limites de requisição.
