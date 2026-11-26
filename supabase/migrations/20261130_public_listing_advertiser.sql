begin;

create or replace function public.get_public_listing_advertiser(target_user_id uuid)
returns table (
  slug text,
  account_type text,
  display_name text,
  logo_url text
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
    profile.public_logo_url
  from public.user_profiles as profile
  where profile.user_id = target_user_id
    and profile.tipo_usuario in ('corretor', 'imobiliaria')
    and nullif(btrim(profile.public_slug), '') is not null
    and nullif(btrim(coalesce(
      nullif(btrim(profile.public_display_name), ''),
      case when profile.tipo_usuario = 'imobiliaria' then profile.nome_imobiliaria else profile.nome_completo end
    )), '') is not null;
$$;

revoke all on function public.get_public_listing_advertiser(uuid) from public;
grant execute on function public.get_public_listing_advertiser(uuid) to anon, authenticated;

commit;
