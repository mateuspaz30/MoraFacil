begin;

alter table public.user_profiles
  add column if not exists public_display_name text,
  add column if not exists public_slogan text,
  add column if not exists public_city text,
  add column if not exists public_description text,
  add column if not exists public_logo_url text,
  add column if not exists public_cover_url text,
  add column if not exists public_phone text,
  add column if not exists public_whatsapp text,
  add column if not exists public_instagram text,
  add column if not exists public_facebook text,
  add column if not exists public_website text,
  add column if not exists public_business_hours text;

grant update (
  public_display_name,
  public_slogan,
  public_city,
  public_description,
  public_logo_url,
  public_cover_url,
  public_phone,
  public_whatsapp,
  public_instagram,
  public_facebook,
  public_website,
  public_business_hours
)
on public.user_profiles to authenticated;

create or replace function public.prevent_individual_public_profile_data()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.tipo_usuario = 'pessoa_fisica' then
    if tg_op = 'INSERT' then
      if new.public_display_name is not null
        or new.public_slogan is not null
        or new.public_city is not null
        or new.public_description is not null
        or new.public_logo_url is not null
        or new.public_cover_url is not null
        or new.public_phone is not null
        or new.public_whatsapp is not null
        or new.public_instagram is not null
        or new.public_facebook is not null
        or new.public_website is not null
        or new.public_business_hours is not null then
        raise exception 'Contas pessoa física não podem configurar um perfil público profissional.'
          using errcode = '23514';
      end if;
    elsif row(
      new.public_display_name,
      new.public_slogan,
      new.public_city,
      new.public_description,
      new.public_logo_url,
      new.public_cover_url,
      new.public_phone,
      new.public_whatsapp,
      new.public_instagram,
      new.public_facebook,
      new.public_website,
      new.public_business_hours
    ) is distinct from row(
      old.public_display_name,
      old.public_slogan,
      old.public_city,
      old.public_description,
      old.public_logo_url,
      old.public_cover_url,
      old.public_phone,
      old.public_whatsapp,
      old.public_instagram,
      old.public_facebook,
      old.public_website,
      old.public_business_hours
    ) then
      raise exception 'Contas pessoa física não podem configurar um perfil público profissional.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_individual_public_profile_data() from public, anon, authenticated;

drop trigger if exists user_profiles_prevent_individual_public_data on public.user_profiles;
create trigger user_profiles_prevent_individual_public_data
before insert or update on public.user_profiles
for each row execute function public.prevent_individual_public_profile_data();

commit;
