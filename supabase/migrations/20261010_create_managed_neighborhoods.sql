create table if not exists public.neighborhoods (
  name text primary key check (name = btrim(name) and char_length(name) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.normalize_neighborhood_name(value text)
returns text
language sql
immutable
strict
parallel safe
set search_path = pg_catalog
as $$
  select translate(
    lower(regexp_replace(btrim(value), '[[:space:]]+', ' ', 'g')),
    'áàâãäåéèêëíìîïóòôõöúùûüçñýÿ',
    'aaaaaaeeeeiiiiooooouuuucnyy'
  );
$$;

drop index if exists public.neighborhoods_normalized_name_uidx;
create unique index neighborhoods_normalized_name_uidx
  on public.neighborhoods (public.normalize_neighborhood_name(name));

insert into public.neighborhoods (name)
values
  ('Centro'),
  ('Jardim das Flores'),
  ('Jardim Primavera'),
  ('Residencial Santana'),
  ('Vila Nova'),
  ('Zona Norte')
on conflict do nothing;

insert into public.neighborhoods (name)
select min(btrim(neighborhood))
from public.listings
where nullif(btrim(neighborhood), '') is not null
group by public.normalize_neighborhood_name(neighborhood)
on conflict do nothing;

update public.listings as listing
set neighborhood = neighborhood.name
from public.neighborhoods as neighborhood
where public.normalize_neighborhood_name(listing.neighborhood) = public.normalize_neighborhood_name(neighborhood.name)
  and listing.neighborhood is distinct from neighborhood.name;

do $$
begin
  if exists (
    select 1
    from public.listings
    where nullif(btrim(neighborhood), '') is null
  ) then
    raise exception 'Existem anúncios sem bairro. Preencha esses bairros antes de aplicar a migração.'
      using errcode = '23502';
  end if;
end;
$$;

alter table public.listings
  alter column neighborhood set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_neighborhood_fkey'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_neighborhood_fkey
      foreign key (neighborhood)
      references public.neighborhoods (name)
      on update cascade
      on delete restrict;
  end if;
end;
$$;

create or replace function public.require_active_listing_neighborhood()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.neighborhood is not distinct from old.neighborhood then
    return new;
  end if;

  if not exists (
    select 1
    from public.neighborhoods
    where name = new.neighborhood
      and active
  ) then
    raise exception 'O bairro selecionado não está cadastrado ou está inativo.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists listings_require_active_neighborhood on public.listings;
create trigger listings_require_active_neighborhood
before insert or update on public.listings
for each row execute function public.require_active_listing_neighborhood();

alter table public.neighborhoods enable row level security;

drop policy if exists "Anyone can view active neighborhoods" on public.neighborhoods;
create policy "Anyone can view active neighborhoods"
on public.neighborhoods for select
using (active or public.is_admin());

drop policy if exists "Admins can create neighborhoods" on public.neighborhoods;
create policy "Admins can create neighborhoods"
on public.neighborhoods for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update neighborhoods" on public.neighborhoods;
create policy "Admins can update neighborhoods"
on public.neighborhoods for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete neighborhoods" on public.neighborhoods;
create policy "Admins can delete neighborhoods"
on public.neighborhoods for delete
to authenticated
using (public.is_admin());

grant select on public.neighborhoods to anon, authenticated;
grant insert, update, delete on public.neighborhoods to authenticated;
