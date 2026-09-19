alter table public.listings
  add column if not exists city text default 'Ipuã-SP',
  add column if not exists cep text,
  add column if not exists number text,
  add column if not exists street text;

update public.listings
set city = 'Ipuã-SP'
where city is null;
