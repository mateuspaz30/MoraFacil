begin;

alter table public.listings
  add column if not exists whatsapp_clicks integer not null default 0;

alter table public.listings
  drop constraint if exists listings_whatsapp_clicks_nonnegative_check;

alter table public.listings
  add constraint listings_whatsapp_clicks_nonnegative_check
  check (whatsapp_clicks >= 0);

create or replace function public.increment_listing_whatsapp_clicks(target_listing_id bigint)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  click_count integer;
begin
  update public.listings as listing
  set whatsapp_clicks = listing.whatsapp_clicks + 1
  where listing.id = target_listing_id
    and listing.status = 'aprovado'
  returning listing.whatsapp_clicks into click_count;

  return click_count;
end;
$$;

revoke all on function public.increment_listing_whatsapp_clicks(bigint) from public, anon, authenticated;
grant execute on function public.increment_listing_whatsapp_clicks(bigint) to anon, authenticated;

commit;
