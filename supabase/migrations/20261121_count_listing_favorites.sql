begin;

create or replace function public.count_my_listing_favorites()
returns bigint
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select count(*)::bigint
  from public.favorites as favorite
  join public.listings as listing on listing.id = favorite.listing_id
  where listing.user_id = auth.uid()
    and favorite.user_id <> listing.user_id;
$$;

revoke all on function public.count_my_listing_favorites() from public, anon, authenticated;
grant execute on function public.count_my_listing_favorites() to authenticated;

commit;
