do $seed$
declare
  matching_companies integer;
  visitor_record record;
  matching_users uuid[];
begin
  select count(*)
  into matching_companies
  from auth.users as auth_user
  left join public.user_profiles as profile on profile.user_id = auth_user.id
  where coalesce(profile.tipo_usuario, auth_user.raw_user_meta_data ->> 'tipo_usuario') = 'imobiliaria'
    and public.normalize_neighborhood_name(
      coalesce(
        nullif(btrim(profile.nome_imobiliaria), ''),
        nullif(btrim(auth_user.raw_user_meta_data ->> 'nome_imobiliaria'), '')
      )
    ) = public.normalize_neighborhood_name('Jardim Verde');

  if matching_companies <> 1 then
    raise exception 'Esperada exatamente uma conta imobiliária chamada Jardim Verde; encontradas: %.', matching_companies
      using hint = 'Confira tipo_usuario e nome_imobiliaria em public.user_profiles ou auth.users.raw_user_meta_data.';
  end if;

insert into public.neighborhoods (name)
values ('Centro'), ('Olhos D''Água'), ('Pampuã')
on conflict do nothing;

  if exists (
    select 1
    from (values ('Centro'), ('Olhos D''Água'), ('Pampuã')) as requested(name)
    left join public.neighborhoods as neighborhood
      on public.normalize_neighborhood_name(neighborhood.name) = public.normalize_neighborhood_name(requested.name)
    where neighborhood.name is null or not neighborhood.active
  ) then
    raise exception 'Um dos bairros Centro, Olhos D''Água ou Pampuã não foi encontrado ou está inativo.'
      using hint = 'Ative/cadastre os bairros e execute novamente; nenhum anúncio foi inserido.';
  end if;

create temporary table jardim_verde_demo_company on commit drop as
select
  auth_user.id as user_id,
  coalesce(
    nullif(btrim(profile.telefone), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'telefone'), ''),
    '00000000000'
  ) as phone
from auth.users as auth_user
left join public.user_profiles as profile on profile.user_id = auth_user.id
where coalesce(profile.tipo_usuario, auth_user.raw_user_meta_data ->> 'tipo_usuario') = 'imobiliaria'
  and public.normalize_neighborhood_name(
    coalesce(
      nullif(btrim(profile.nome_imobiliaria), ''),
      nullif(btrim(auth_user.raw_user_meta_data ->> 'nome_imobiliaria'), '')
    )
  ) = public.normalize_neighborhood_name('Jardim Verde');

create temporary table jardim_verde_demo_visitors (
  position integer primary key,
  lookup_name text not null,
  user_id uuid
) on commit drop;

insert into jardim_verde_demo_visitors (position, lookup_name)
values (1, 'Iris'), (2, 'Lais Karen'), (3, 'Mateus');

  for visitor_record in
    select position, lookup_name
    from jardim_verde_demo_visitors
    order by position
  loop
    select array_agg(auth_user.id)
    into matching_users
    from auth.users as auth_user
    left join public.user_profiles as profile on profile.user_id = auth_user.id
    where coalesce(profile.tipo_usuario, auth_user.raw_user_meta_data ->> 'tipo_usuario') <> 'imobiliaria'
      and public.normalize_neighborhood_name(
        coalesce(
          nullif(btrim(profile.nome_completo), ''),
          nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), '')
        )
      ) = public.normalize_neighborhood_name(visitor_record.lookup_name);

    if coalesce(cardinality(matching_users), 0) = 0 then
      select array_agg(auth_user.id)
      into matching_users
      from auth.users as auth_user
      left join public.user_profiles as profile on profile.user_id = auth_user.id
      where coalesce(profile.tipo_usuario, auth_user.raw_user_meta_data ->> 'tipo_usuario') <> 'imobiliaria'
        and public.normalize_neighborhood_name(split_part(
          btrim(coalesce(profile.nome_completo, auth_user.raw_user_meta_data ->> 'full_name')),
          ' ',
          1
        ))
          = public.normalize_neighborhood_name(split_part(btrim(visitor_record.lookup_name), ' ', 1));
    end if;

    if coalesce(cardinality(matching_users), 0) <> 1 then
      raise exception 'Esperada exatamente uma conta de teste para "%"; encontradas: %.',
        visitor_record.lookup_name, coalesce(cardinality(matching_users), 0)
        using hint = 'Confira nome_completo em public.user_profiles; use contas exclusivamente de demonstração.';
    end if;

    update jardim_verde_demo_visitors
    set user_id = matching_users[1]
    where position = visitor_record.position;
  end loop;

  if (select count(distinct user_id) from jardim_verde_demo_visitors) <> 3 then
    raise exception 'Os três nomes de demonstração devem corresponder a contas distintas.';
  end if;

create temporary table jardim_verde_demo_listings (
  title text primary key,
  type text not null,
  property_category text not null,
  purpose text not null,
  price text not null,
  area integer not null,
  bedrooms integer not null,
  bathrooms integer not null,
  parking_spaces integer not null,
  street text not null,
  number text not null,
  neighborhood text not null,
  cep text not null,
  description text not null,
  latitude double precision not null,
  longitude double precision not null,
  visualizacoes integer not null,
  whatsapp_clicks integer not null,
  favorite_count integer not null check (favorite_count between 0 and 3),
  images jsonb not null
) on commit drop;

insert into jardim_verde_demo_listings values
(
  'Casa térrea com varanda no Centro', 'venda', 'casa', 'venda', 'R$ 385.000', 148, 3, 2, 2,
  'Avenida Romualdo Fratin', '102', 'Centro', '14610-001',
  'Demonstração: casa fictícia com sala integrada à varanda, cozinha ampla, três dormitórios e quintal. Endereço e localização no mapa são aproximados para testes.',
  -20.4388, -48.0124, 1260, 42, 3,
  jsonb_build_array(
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85'
  )
),
(
  'Apartamento mobiliado próximo ao comércio', 'aluguel', 'apartamento', 'aluguel', 'R$ 1.850/mês', 76, 2, 1, 1,
  'Avenida Alvares Cabral', '244', 'Centro', '14610-003',
  'Demonstração: apartamento fictício mobiliado, com sala iluminada, cozinha funcional, dois quartos e vaga coberta. Localização aproximada para testes.',
  -20.4371, -48.0148, 842, 17, 2,
  jsonb_build_array(
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85'
  )
),
(
  'Sala comercial com vitrine', 'aluguel', 'ponto_comercial', 'aluguel', 'R$ 2.200/mês', 64, 0, 1, 0,
  'Avenida Regina Mosconi', '78', 'Centro', '14610-005',
  'Demonstração: ponto comercial fictício com salão aberto, vitrine voltada para a avenida e espaço de apoio. Imagens e endereço são ilustrativos.',
  -20.4396, -48.0108, 128, 3, 1,
  jsonb_build_array(
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85'
  )
),
(
  'Chácara com casa e pomar', 'venda', 'chacara', 'venda', 'R$ 690.000', 2400, 3, 2, 4,
  'Avenida Luiz Ferreira Costa', '128', 'Olhos D''Água', '14610-118',
  'Demonstração: chácara fictícia com casa térrea, varanda, pomar e amplo espaço gramado. A coordenada é aproximada e serve somente para validar os recursos do mapa.',
  -20.4325, -48.0080, 945, 28, 3,
  jsonb_build_array(
    'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=85'
  )
),
(
  'Casa compacta com quintal', 'venda', 'casa', 'venda', 'R$ 248.000', 92, 2, 1, 1,
  'Rua Waldemar Francelin', '46', 'Olhos D''Água', '14610-120',
  'Demonstração: casa fictícia de dois quartos, sala, cozinha, banheiro e quintal privativo. Sem interações para validar os estados vazios do painel.',
  -20.4332, -48.0068, 0, 0, 0,
  jsonb_build_array(
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?auto=format&fit=crop&w=1200&q=85'
  )
),
(
  'Terreno plano para construir', 'terreno', 'terreno', 'venda', 'R$ 118.000', 360, 0, 0, 0,
  'Avenida Ulisses Guimarães', '501', 'Olhos D''Água', '14610-122',
  'Demonstração: lote fictício plano, com área de 360 m² e potencial para projeto residencial. A posição do marcador é aproximada.',
  -20.4314, -48.0061, 345, 6, 1,
  jsonb_build_array(
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=85'
  )
),
(
  'Apartamento novo com sacada', 'venda', 'apartamento', 'venda', 'R$ 312.000', 83, 2, 2, 1,
  'Avenida Alberto Conrado', '37', 'Pampuã', '14611-000',
  'Demonstração: apartamento fictício com dois dormitórios, sacada, cozinha integrada e uma vaga. As imagens e a localização são ilustrativas.',
  -20.4451, -48.0015, 1500, 50, 3,
  jsonb_build_array(
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1615874694520-474822394e73?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85'
  )
),
(
  'Casa ampla com área gourmet', 'venda', 'casa', 'venda', 'R$ 520.000', 210, 4, 3, 2,
  'Avenida Alberto Conrado', '86', 'Pampuã', '14611-000',
  'Demonstração: casa fictícia com quatro quartos, área gourmet, garagem para dois carros e quintal. Tem muitos acessos e poucos contatos para testar oportunidades.',
  -20.4463, -48.0002, 412, 0, 2,
  jsonb_build_array(
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85'
  )
),
(
  'Lote residencial perto da avenida', 'venda', 'terreno', 'venda', 'R$ 89.000', 250, 0, 0, 0,
  'Avenida Romualdo Fratin', '318', 'Centro', '14610-001',
  'Demonstração: terreno fictício de 250 m², com topografia regular e vocação residencial. Marcador em posição aproximada para testes.',
  -20.4403, -48.0111, 0, 0, 0,
  jsonb_build_array(
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85'
  )
),
(
  'Chácara com espaço para lazer', 'venda', 'chacara', 'venda', 'R$ 780.000', 3200, 4, 3, 5,
  'Avenida Luiz Ferreira Costa', '240', 'Olhos D''Água', '14610-118',
  'Demonstração: propriedade rural fictícia com casa principal, varanda, árvores frutíferas e espaço para lazer. Localização aproximada para mapa.',
  -20.4340, -48.0088, 684, 21, 3,
  jsonb_build_array(
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=85'
  )
),
(
  'Casa familiar próxima à praça', 'venda', 'casa', 'venda', 'R$ 298.000', 118, 3, 2, 1,
  'Avenida Alvares Cabral', '401', 'Centro', '14610-003',
  'Demonstração: casa fictícia com três quartos, sala, cozinha, banheiro social e garagem. Incluída para compor diferentes faixas de desempenho.',
  -20.4364, -48.0154, 321, 2, 0,
  jsonb_build_array(
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85'
  )
),
(
  'Loja de esquina com salão amplo', 'venda', 'ponto_comercial', 'venda', 'R$ 460.000', 110, 0, 2, 2,
  'Rua Waldemar Francelin', '215', 'Olhos D''Água', '14610-120',
  'Demonstração: imóvel comercial fictício com salão amplo, duas entradas e espaço de apoio. Imagens demonstrativas; dados não representam oferta real.',
  -20.4344, -48.0053, 1190, 49, 2,
  jsonb_build_array(
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85'
  )
),
(
  'Apartamento compacto no Centro', 'aluguel', 'apartamento', 'aluguel', 'R$ 1.350/mês', 55, 1, 1, 1,
  'Avenida José do Patrocínio', '315', 'Centro', '14610-007',
  'Demonstração: apartamento fictício de um dormitório, sala integrada e vaga. Fotos externas de demonstração e localização aproximada.',
  -20.4380, -48.0150, 701, 16, 1,
  jsonb_build_array(
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85'
  )
),
(
  'Terreno amplo em rua tranquila', 'terreno', 'terreno', 'venda', 'R$ 145.000', 520, 0, 0, 0,
  'Avenida Alberto Conrado', '122', 'Pampuã', '14611-000',
  'Demonstração: lote fictício de 520 m², com espaço para residência e área verde. Coordenada aproximada para validar a visualização no mapa.',
  -20.4476, -48.0029, 88, 0, 1,
  jsonb_build_array(
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=85'
  )
),
(
  'Ponto comercial para atendimento', 'aluguel', 'ponto_comercial', 'aluguel', 'R$ 1.900/mês', 72, 0, 1, 0,
  'Avenida Alberto Conrado', '190', 'Pampuã', '14611-000',
  'Demonstração: sala comercial fictícia com espaço de recepção e área principal versátil. Os dados e as fotografias são ilustrativos.',
  -20.4440, -48.0038, 1102, 7, 3,
  jsonb_build_array(
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85'
  )
),
(
  'Casa com jardim e garagem coberta', 'venda', 'casa', 'venda', 'R$ 339.000', 136, 3, 2, 2,
  'Avenida Ulisses Guimarães', '605', 'Olhos D''Água', '14610-122',
  'Demonstração: casa fictícia com jardim, garagem coberta, três quartos e ambientes bem distribuídos. Sem interações para testar os indicadores vazios.',
  -20.4302, -48.0077, 0, 0, 0,
  jsonb_build_array(
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85'
  )
);

update public.listings as listing
set
  type = demo.type,
  property_category = demo.property_category,
  purpose = demo.purpose,
  status = 'aprovado',
  price = demo.price,
  area = demo.area,
  bedrooms = demo.bedrooms,
  bathrooms = demo.bathrooms,
  parking_spaces = demo.parking_spaces,
  city = 'Ipuã-SP',
  cep = demo.cep,
  street = demo.street,
  number = demo.number,
  neighborhood = neighborhood.name,
  address = format('%s, %s - %s, CEP %s, Ipuã-SP', demo.street, demo.number, neighborhood.name, demo.cep),
  description = demo.description,
  images = demo.images,
  image = demo.images ->> 0,
  advertiser = 'Jardim Verde (DEMONSTRACAO)',
  phone = company.phone,
  latitude = demo.latitude,
  longitude = demo.longitude
from jardim_verde_demo_listings as demo
cross join jardim_verde_demo_company as company
join public.neighborhoods as neighborhood
  on public.normalize_neighborhood_name(neighborhood.name) = public.normalize_neighborhood_name(demo.neighborhood)
where listing.user_id = company.user_id
  and listing.advertiser = 'Jardim Verde (DEMONSTRACAO)'
  and listing.title = demo.title;

insert into public.listings (
  user_id, title, type, property_category, purpose, status, price, area,
  bedrooms, bathrooms, parking_spaces, city, cep, street, number, neighborhood,
  address, description, images, image, advertiser, phone, latitude, longitude,
  visualizacoes, whatsapp_clicks
)
select
  company.user_id,
  demo.title,
  demo.type,
  demo.property_category,
  demo.purpose,
  'aprovado',
  demo.price,
  demo.area,
  demo.bedrooms,
  demo.bathrooms,
  demo.parking_spaces,
  'Ipuã-SP',
  demo.cep,
  demo.street,
  demo.number,
  neighborhood.name,
  format('%s, %s - %s, CEP %s, Ipuã-SP', demo.street, demo.number, neighborhood.name, demo.cep),
  demo.description,
  demo.images,
  demo.images ->> 0,
  'Jardim Verde (DEMONSTRACAO)',
  company.phone,
  demo.latitude,
  demo.longitude,
  demo.visualizacoes,
  demo.whatsapp_clicks
from jardim_verde_demo_listings as demo
cross join jardim_verde_demo_company as company
join public.neighborhoods as neighborhood
  on public.normalize_neighborhood_name(neighborhood.name) = public.normalize_neighborhood_name(demo.neighborhood)
where not exists (
  select 1
  from public.listings as existing
  where existing.user_id = company.user_id
    and existing.advertiser = 'Jardim Verde (DEMONSTRACAO)'
    and existing.title = demo.title
);

insert into public.favorites (user_id, listing_id)
select visitor.user_id, listing.id
from jardim_verde_demo_listings as demo
join jardim_verde_demo_company as company on true
join public.listings as listing
  on listing.user_id = company.user_id
  and listing.advertiser = 'Jardim Verde (DEMONSTRACAO)'
  and listing.title = demo.title
join jardim_verde_demo_visitors as visitor
  on visitor.position <= demo.favorite_count
on conflict (user_id, listing_id) do nothing;

delete from public.listing_metric_events as event
using public.listings as listing,
  jardim_verde_demo_listings as demo,
  jardim_verde_demo_company as company
where event.listing_id = listing.id
  and listing.user_id = company.user_id
  and listing.advertiser = 'Jardim Verde (DEMONSTRACAO)'
  and listing.title = demo.title
  and event.event_origin = 'demo';

insert into public.listing_metric_events (
  listing_id,
  metric_type,
  created_at,
  event_origin
)
select
  listing.id,
  metric.metric_type,
  (
    (
      (now() at time zone 'America/Sao_Paulo')::date
      - floor(
        (generated.event_number - 1) * 90.0 / nullif(metric.event_count, 0)
      )::integer
    ) + time '12:00'
  ) at time zone 'America/Sao_Paulo',
  'demo'
from jardim_verde_demo_listings as demo
cross join jardim_verde_demo_company as company
join public.listings as listing
  on listing.user_id = company.user_id
  and listing.advertiser = 'Jardim Verde (DEMONSTRACAO)'
  and listing.title = demo.title
cross join lateral (
  values
    ('view', demo.visualizacoes),
    ('whatsapp_click', demo.whatsapp_clicks),
    ('favorite', demo.favorite_count)
) as metric(metric_type, event_count)
cross join lateral generate_series(1, metric.event_count) as generated(event_number);

end;
$seed$;
