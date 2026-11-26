begin;

drop function if exists public.get_public_listing_advertiser(uuid);

create function public.get_public_listing_advertiser(target_user_id uuid)
returns table (
  slug text,
  account_type text,
  display_name text,
  logo_url text,
  avatar_url text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    case when profile.tipo_usuario in ('corretor', 'imobiliaria') then profile.public_slug end,
    profile.tipo_usuario,
    case when profile.tipo_usuario in ('corretor', 'imobiliaria') then
      coalesce(
        nullif(btrim(profile.public_display_name), ''),
        case when profile.tipo_usuario = 'imobiliaria' then profile.nome_imobiliaria else profile.nome_completo end
      )
    end,
    case when profile.tipo_usuario in ('corretor', 'imobiliaria') then profile.public_logo_url end,
    case when profile.tipo_usuario = 'pessoa_fisica'
      and coalesce(
        nullif(btrim(auth_user.raw_user_meta_data ->> 'avatar_url'), ''),
        nullif(btrim(auth_user.raw_user_meta_data ->> 'picture'), '')
      ) ~* '^https?://' then coalesce(
        nullif(btrim(auth_user.raw_user_meta_data ->> 'avatar_url'), ''),
        nullif(btrim(auth_user.raw_user_meta_data ->> 'picture'), '')
      )
    end
  from public.user_profiles as profile
  left join auth.users as auth_user on auth_user.id = profile.user_id
  where profile.user_id = target_user_id
    and (
      (
        profile.tipo_usuario in ('corretor', 'imobiliaria')
        and nullif(btrim(profile.public_slug), '') is not null
        and nullif(btrim(coalesce(
          nullif(btrim(profile.public_display_name), ''),
          case when profile.tipo_usuario = 'imobiliaria' then profile.nome_imobiliaria else profile.nome_completo end
        )), '') is not null
      )
      or profile.tipo_usuario = 'pessoa_fisica'
    )
    and exists (
      select 1
      from public.listings as listing
      where listing.user_id = profile.user_id
        and listing.status = 'aprovado'
    );
$$;

revoke all on function public.get_public_listing_advertiser(uuid) from public;
grant execute on function public.get_public_listing_advertiser(uuid) to anon, authenticated;

commit;
