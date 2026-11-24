begin;

create table if not exists public.listing_metric_events (
  id bigint generated always as identity primary key,
  listing_id bigint not null references public.listings(id) on delete cascade,
  metric_type text not null check (metric_type in ('view', 'whatsapp_click', 'favorite')),
  created_at timestamptz not null default now()
);

create index if not exists listing_metric_events_listing_created_idx
  on public.listing_metric_events (listing_id, created_at desc);

alter table public.listing_metric_events enable row level security;
revoke all on public.listing_metric_events from public, anon, authenticated;

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

  if view_count is not null then
    insert into public.listing_metric_events (listing_id, metric_type)
    values (target_listing_id, 'view');
  end if;

  return view_count;
end;
$$;

revoke all on function public.increment_listing_views(bigint) from public, anon, authenticated;
grant execute on function public.increment_listing_views(bigint) to anon, authenticated;

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

  if click_count is not null then
    insert into public.listing_metric_events (listing_id, metric_type)
    values (target_listing_id, 'whatsapp_click');
  end if;

  return click_count;
end;
$$;

revoke all on function public.increment_listing_whatsapp_clicks(bigint) from public, anon, authenticated;
grant execute on function public.increment_listing_whatsapp_clicks(bigint) to anon, authenticated;

create or replace function public.record_listing_favorite_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  listing_owner_id uuid;
begin
  select listing.user_id
  into listing_owner_id
  from public.listings as listing
  where listing.id = new.listing_id;

  if listing_owner_id is not null and new.user_id <> listing_owner_id then
    insert into public.listing_metric_events (listing_id, metric_type)
    values (new.listing_id, 'favorite');
  end if;

  return new;
end;
$$;

revoke all on function public.record_listing_favorite_event() from public, anon, authenticated;

drop trigger if exists favorites_record_listing_metric on public.favorites;
create trigger favorites_record_listing_metric
after insert on public.favorites
for each row execute function public.record_listing_favorite_event();

create or replace function public.get_company_listing_metrics_by_period(period_start date, period_end date)
returns table (
  listing_id bigint,
  visualizacoes bigint,
  whatsapp_clicks bigint,
  favoritos bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    raise exception 'É necessário entrar na conta para consultar as métricas.'
      using errcode = '28000';
  end if;

  if period_start is null or period_end is null or period_start > period_end then
    raise exception 'Informe um intervalo de datas válido.'
      using errcode = '22007';
  end if;

  return query
  select
    listing.id,
    count(event.id) filter (where event.metric_type = 'view'),
    count(event.id) filter (where event.metric_type = 'whatsapp_click'),
    count(event.id) filter (where event.metric_type = 'favorite')
  from public.listings as listing
  left join public.listing_metric_events as event
    on event.listing_id = listing.id
    and event.created_at >= (period_start::timestamp at time zone 'America/Sao_Paulo')
    and event.created_at < ((period_end + 1)::timestamp at time zone 'America/Sao_Paulo')
  where listing.user_id = auth.uid()
  group by listing.id;
end;
$$;

revoke all on function public.get_company_listing_metrics_by_period(date, date) from public, anon, authenticated;
grant execute on function public.get_company_listing_metrics_by_period(date, date) to authenticated;

commit;
