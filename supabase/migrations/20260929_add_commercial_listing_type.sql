alter table public.listings
  drop constraint if exists listings_type_check;

alter table public.listings
  add constraint listings_type_check
  check (type in ('venda', 'aluguel', 'terreno', 'ponto_comercial'));
