begin;

alter table public.listing_metric_events
  add column if not exists event_origin text not null default 'live';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.listing_metric_events'::regclass
      and conname = 'listing_metric_events_event_origin_check'
  ) then
    alter table public.listing_metric_events
      add constraint listing_metric_events_event_origin_check
      check (event_origin in ('live', 'demo'));
  end if;
end;
$$;

comment on column public.listing_metric_events.event_origin is
  'Distinguishes real activity from explicitly seeded demonstration events.';

commit;
