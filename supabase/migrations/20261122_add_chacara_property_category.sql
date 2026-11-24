alter table public.listings
  drop constraint if exists property_category_check,
  drop constraint if exists listings_property_category_check;

alter table public.listings
  add constraint listings_property_category_check
  check (property_category in ('casa', 'apartamento', 'chacara', 'terreno', 'ponto_comercial'));
