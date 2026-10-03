alter table public.listings
  add column if not exists destaque_home boolean not null default false,
  add column if not exists ordem_destaque integer;

alter table public.listings
  drop constraint if exists listings_featured_order_check;

alter table public.listings
  add constraint listings_featured_order_check check (
    (destaque_home and ordem_destaque is not null and ordem_destaque > 0)
    or (not destaque_home and ordem_destaque is null)
  );

create index if not exists listings_home_featured_order_idx
  on public.listings (ordem_destaque, id)
  where status = 'aprovado' and destaque_home = true;
