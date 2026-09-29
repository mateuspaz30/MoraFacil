alter table public.listings
  add column if not exists parking_spaces integer not null default 0;
