begin;

create or replace function public.count_my_listing_favorites_by_listing()
returns table (listing_id bigint, favorite_count bigint)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    listing.id,
    count(favorite.user_id)::bigint
  from public.listings as listing
  left join public.favorites as favorite
    on favorite.listing_id = listing.id
    and favorite.user_id <> listing.user_id
  where listing.user_id = auth.uid()
  group by listing.id;
$$;

revoke all on function public.count_my_listing_favorites_by_listing() from public, anon, authenticated;
grant execute on function public.count_my_listing_favorites_by_listing() to authenticated;

commit;
