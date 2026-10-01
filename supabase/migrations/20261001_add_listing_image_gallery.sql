alter table public.listings
  add column if not exists images jsonb not null default '[]'::jsonb;

alter table public.listings
  add column if not exists property_category text not null default 'casa'
    check (property_category in ('casa', 'apartamento', 'terreno', 'ponto_comercial')),
  add column if not exists purpose text not null default 'venda'
    check (purpose in ('venda', 'aluguel'));

update public.listings
set images = jsonb_build_array(image)
where image is not null
  and images = '[]'::jsonb;

update public.listings
set property_category = case type
  when 'terreno' then 'terreno'
  when 'ponto_comercial' then 'ponto_comercial'
  else 'casa'
end,
purpose = case when type = 'aluguel' then 'aluguel' else 'venda' end
where type in ('terreno', 'ponto_comercial', 'aluguel');