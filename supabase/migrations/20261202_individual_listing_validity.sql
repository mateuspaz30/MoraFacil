begin;

alter table public.listings
  add column if not exists individual_validity_started_at timestamptz;

update public.listings as listing
set individual_validity_started_at = coalesce(listing.created_at, now())
from public.user_profiles as profile
where profile.user_id = listing.user_id
  and profile.tipo_usuario = 'pessoa_fisica'
  and listing.status in ('aprovado', 'pausado')
  and listing.individual_validity_started_at is null;

update public.listings as listing
set individual_validity_started_at = null
from public.user_profiles as profile
where profile.user_id = listing.user_id
  and profile.tipo_usuario in ('corretor', 'imobiliaria')
  and listing.individual_validity_started_at is not null;

create index if not exists listings_individual_validity_started_at_idx
  on public.listings (individual_validity_started_at)
  where individual_validity_started_at is not null;

create or replace function public.set_individual_listing_validity_started_at()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  owner_type text;
begin
  select profile.tipo_usuario
  into owner_type
  from public.user_profiles as profile
  where profile.user_id = new.user_id;

  if owner_type is distinct from 'pessoa_fisica' then
    new.individual_validity_started_at := null;
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.individual_validity_started_at := case
      when new.status = 'aprovado' then now()
      else null
    end;
  elsif current_setting('app.individual_listing_reactivation', true) = 'on'
    and new.status = 'aprovado' then
    new.individual_validity_started_at := now();
  elsif new.status = 'aprovado'
    and (old.status is distinct from 'aprovado' or old.individual_validity_started_at is null) then
    new.individual_validity_started_at := now();
  else
    new.individual_validity_started_at := old.individual_validity_started_at;
  end if;

  return new;
end;
$$;

revoke all on function public.set_individual_listing_validity_started_at() from public, anon, authenticated;

drop trigger if exists listings_set_individual_validity_started_at on public.listings;
create trigger listings_set_individual_validity_started_at
before insert or update of user_id, status, individual_validity_started_at
on public.listings
for each row execute function public.set_individual_listing_validity_started_at();

drop policy if exists "Anyone can read published listings" on public.listings;
create policy "Anyone can read published listings"
on public.listings for select
to anon, authenticated
using (
  (
    status = 'aprovado'
    and (
      individual_validity_started_at is null
      or individual_validity_started_at > now() - interval '30 days'
    )
  )
  or auth.uid() = user_id
  or public.is_admin()
);

create or replace function public.reactivate_individual_listing(target_listing_id bigint)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  owner_type text;
  updated_listing_id bigint;
begin
  if auth.uid() is null then
    raise exception 'É necessário entrar na conta para reativar o anúncio.'
      using errcode = '42501';
  end if;

  select profile.tipo_usuario
  into owner_type
  from public.user_profiles as profile
  where profile.user_id = auth.uid();

  if owner_type is distinct from 'pessoa_fisica' then
    raise exception 'A renovação de 30 dias está disponível apenas para pessoas físicas.'
      using errcode = '42501';
  end if;

  perform set_config('app.individual_listing_reactivation', 'on', true);

  update public.listings as listing
  set status = 'aprovado',
      individual_validity_started_at = now()
  where listing.id = target_listing_id
    and listing.user_id = auth.uid()
    and listing.status in ('aprovado', 'pausado')
  returning listing.id into updated_listing_id;

  if updated_listing_id is null then
    raise exception 'O anúncio não pode ser reativado. Verifique se pertence à sua conta e se não foi reprovado ou concluído.'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.reactivate_individual_listing(bigint) from public, anon, authenticated;
grant execute on function public.reactivate_individual_listing(bigint) to authenticated;

create or replace function public.get_public_professional_directory()
returns table (
  slug text,
  professional_type text,
  professional_name text,
  city text,
  description text,
  logo_url text,
  cover_url text,
  active_listing_count bigint
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    profile.public_slug,
    profile.tipo_usuario,
    coalesce(
      nullif(btrim(profile.public_display_name), ''),
      case when profile.tipo_usuario = 'imobiliaria' then profile.nome_imobiliaria else profile.nome_completo end
    ),
    coalesce(
      nullif(btrim(profile.public_city), ''),
      (
        select listing.city
        from public.listings as listing
        where listing.user_id = profile.user_id
          and listing.status = 'aprovado'
          and (
            listing.individual_validity_started_at is null
            or listing.individual_validity_started_at > now() - interval '30 days'
          )
        order by listing.created_at desc
        limit 1
      )
    ),
    profile.public_description,
    profile.public_logo_url,
    profile.public_cover_url,
    (
      select count(*)::bigint
      from public.listings as listing
      where listing.user_id = profile.user_id
        and listing.status = 'aprovado'
        and (
          listing.individual_validity_started_at is null
          or listing.individual_validity_started_at > now() - interval '30 days'
        )
    )
  from public.user_profiles as profile
  where profile.tipo_usuario in ('corretor', 'imobiliaria')
    and nullif(btrim(profile.public_slug), '') is not null
    and nullif(btrim(coalesce(
      nullif(btrim(profile.public_display_name), ''),
      case when profile.tipo_usuario = 'imobiliaria' then profile.nome_imobiliaria else profile.nome_completo end
    )), '') is not null
  order by 3;
$$;

revoke all on function public.get_public_professional_directory() from public;
grant execute on function public.get_public_professional_directory() to anon, authenticated;

commit;
