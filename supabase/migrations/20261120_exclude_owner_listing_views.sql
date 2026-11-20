begin;

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
    and listing.user_id is distinct from auth.uid()
  returning listing.visualizacoes into view_count;

  return view_count;
end;
$$;

revoke all on function public.increment_listing_views(bigint) from public, anon, authenticated;
grant execute on function public.increment_listing_views(bigint) to anon, authenticated;

commit;
