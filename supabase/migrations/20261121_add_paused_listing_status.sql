alter table public.listings
  drop constraint if exists listings_status_check;

alter table public.listings
  add constraint listings_status_check
  check (status in ('em_analise', 'aprovado', 'reprovado', 'concluido', 'pausado'));
