begin;

drop function if exists public.get_public_professional_directory();

create function public.get_public_professional_directory()
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
