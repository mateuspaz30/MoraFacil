begin;

alter table public.listings
  add column if not exists visualizacoes integer not null default 0;

alter table public.listings
  drop constraint if exists listings_visualizacoes_nonnegative_check;

alter table public.listings
  add constraint listings_visualizacoes_nonnegative_check
  check (visualizacoes >= 0);

create or replace function public.increment_listing_views(target_listing_id bigint)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  view_count integer;
begin
  update public.listings as listing
  set visualizacoes = listing.visualizacoes + 1
  where listing.id = target_listing_id
    and listing.status = 'aprovado'
  returning listing.visualizacoes into view_count;

  return view_count;
end;
$$;

revoke all on function public.increment_listing_views(bigint) from public, anon, authenticated;
grant execute on function public.increment_listing_views(bigint) to anon, authenticated;

commit;
