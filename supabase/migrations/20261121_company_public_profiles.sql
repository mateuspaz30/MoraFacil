begin;

alter table public.user_profiles
  add column if not exists public_slug text,
  add column if not exists public_city text,
  add column if not exists public_description text,
  add column if not exists public_logo_url text;

create or replace function public.set_company_public_slug()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  base_slug text;
begin
  if new.tipo_usuario = 'imobiliaria' then
    base_slug := regexp_replace(
      translate(
        lower(btrim(coalesce(new.nome_imobiliaria, ''))),
        'áàâãäåéèêëíìîïóòôõöúùûüçñýÿ',
        'aaaaaaeeeeiiiiooooouuuucnyy'
      ),
      '[^a-z0-9]+',
      '-',
      'g'
    );
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then
      base_slug := 'imobiliaria';
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
          lower(btrim(coalesce(nome_imobiliaria, ''))),
          'áàâãäåéèêëíìîïóòôõöúùûüçñýÿ',
          'aaaaaaeeeeiiiiooooouuuucnyy'
        ),
        '[^a-z0-9]+',
        '-',
        'g'
      )),
      ''
    ),
    'imobiliaria'
  )
  || '-'
  || substr(replace(user_id::text, '-', ''), 1, 12)
)
where tipo_usuario = 'imobiliaria';

drop trigger if exists user_profiles_set_company_public_slug on public.user_profiles;
create trigger user_profiles_set_company_public_slug
before insert or update on public.user_profiles
for each row execute function public.set_company_public_slug();

create unique index if not exists user_profiles_public_slug_uidx
  on public.user_profiles (public_slug)
  where tipo_usuario = 'imobiliaria';

revoke update on table public.user_profiles from public, anon, authenticated;
revoke update (
  user_id,
  tipo_usuario,
  cpf,
  creci,
  nome_imobiliaria,
  cnpj,
  public_slug,
  public_logo_url
)
on public.user_profiles from public, anon, authenticated;

grant update (nome_completo, telefone, nome_responsavel, public_city, public_description)
  on public.user_profiles to authenticated;

create or replace function public.get_public_company_profile(target_slug text)
returns table (
  user_id uuid,
  slug text,
  company_name text,
  city text,
  description text,
  logo_url text,
  phone text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    profile.user_id,
    profile.public_slug,
    profile.nome_imobiliaria,
    profile.public_city,
    profile.public_description,
    profile.public_logo_url,
    profile.telefone
  from public.user_profiles as profile
  where profile.tipo_usuario = 'imobiliaria'
    and profile.public_slug = target_slug;
$$;

revoke all on function public.get_public_company_profile(text) from public;
grant execute on function public.get_public_company_profile(text) to anon, authenticated;

commit;
