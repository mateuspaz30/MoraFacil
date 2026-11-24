begin;

alter table public.user_profiles
  add column if not exists public_cover_url text;

grant update (
  public_logo_url,
  public_cover_url
)
on public.user_profiles to authenticated;

drop function if exists public.get_public_company_profile(text);

create function public.get_public_company_profile(target_slug text)
returns table (
  user_id uuid,
  slug text,
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
    coalesce(nullif(btrim(profile.public_display_name), ''), profile.nome_imobiliaria),
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
  where profile.tipo_usuario = 'imobiliaria'
    and profile.public_slug = target_slug;
$$;

revoke all on function public.get_public_company_profile(text) from public;
grant execute on function public.get_public_company_profile(text) to anon, authenticated;

commit;
