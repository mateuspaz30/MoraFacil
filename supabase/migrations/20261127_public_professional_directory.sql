begin;

create or replace function public.set_company_public_slug()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  base_slug text;
  public_name text;
begin
  if new.tipo_usuario in ('corretor', 'imobiliaria') then
    public_name := case
      when new.tipo_usuario = 'imobiliaria' then coalesce(new.nome_imobiliaria, '')
      else coalesce(new.nome_completo, '')
    end;
    base_slug := regexp_replace(
      translate(
        lower(btrim(public_name)),
        'áàâãäåéèêëíìîïóòôõöúùûüçñýÿ',
        'aaaaaaeeeeiiiiooooouuuucnyy'
      ),
      '[^a-z0-9]+',
      '-',
      'g'
    );
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then
      base_slug := case when new.tipo_usuario = 'imobiliaria' then 'imobiliaria' else 'corretor' end;
    end if;
    new.public_slug := base_slug || '-' || substr(replace(new.user_id::text, '-', ''), 1, 12);
  else
    new.public_slug := null;
  end if;

  return new;
end;
$$;

revoke all on function public.set_company_public_slug() from public, anon, authenticated;

update public.user_profiles
set public_slug = (
  coalesce(
    nullif(
      trim(both '-' from regexp_replace(
        translate(
          lower(btrim(case when tipo_usuario = 'imobiliaria' then coalesce(nome_imobiliaria, '') else coalesce(nome_completo, '') end)),
          'áàâãäåéèêëíìîïóòôõöúùûüçñýÿ',
          'aaaaaaeeeeiiiiooooouuuucnyy'
        ),
        '[^a-z0-9]+',
        '-',
        'g'
      )),
      ''
    ),
    case when tipo_usuario = 'imobiliaria' then 'imobiliaria' else 'corretor' end
  )
  || '-'
  || substr(replace(user_id::text, '-', ''), 1, 12)
)
where tipo_usuario in ('corretor', 'imobiliaria');

drop index if exists public.user_profiles_public_slug_uidx;
create unique index user_profiles_public_slug_uidx
  on public.user_profiles (public_slug)
  where tipo_usuario in ('corretor', 'imobiliaria');

drop function if exists public.get_public_company_profile(text);
create function public.get_public_company_profile(target_slug text)
returns table (
  user_id uuid,
  slug text,
  account_type text,
  company_name text,
  city text,
  description text,
  logo_url text,
  cover_url text,
  phone text,
  whatsapp text,
  slogan text,
  instagram text,
  facebook text,
  website text,
  business_hours text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    profile.user_id,
    profile.public_slug,
    profile.tipo_usuario,
    coalesce(
      nullif(btrim(profile.public_display_name), ''),
      case when profile.tipo_usuario = 'imobiliaria' then profile.nome_imobiliaria else profile.nome_completo end
    ),
    profile.public_city,
    profile.public_description,
    profile.public_logo_url,
    profile.public_cover_url,
    coalesce(nullif(profile.public_phone, ''), profile.telefone),
    coalesce(nullif(profile.public_whatsapp, ''), nullif(profile.public_phone, ''), profile.telefone),
    profile.public_slogan,
    profile.public_instagram,
    profile.public_facebook,
    profile.public_website,
    profile.public_business_hours
  from public.user_profiles as profile
  where profile.tipo_usuario in ('corretor', 'imobiliaria')
    and profile.public_slug = target_slug;
$$;

revoke all on function public.get_public_company_profile(text) from public;
grant execute on function public.get_public_company_profile(text) to anon, authenticated;

create or replace function public.get_public_professional_directory()
returns table (
  slug text,
  professional_type text,
  professional_name text,
  city text,
  description text,
  logo_url text,
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
        order by listing.created_at desc
        limit 1
      )
    ),
    profile.public_description,
    profile.public_logo_url,
    (
      select count(*)::bigint
      from public.listings as listing
      where listing.user_id = profile.user_id
        and listing.status = 'aprovado'
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
