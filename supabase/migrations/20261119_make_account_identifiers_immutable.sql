begin;

revoke update on table public.user_profiles from public, anon, authenticated;
revoke update (
  user_id,
  tipo_usuario,
  nome_completo,
  cpf,
  creci,
  telefone,
  nome_imobiliaria,
  cnpj,
  nome_responsavel
)
on public.user_profiles from public, anon, authenticated;

grant update (nome_completo, telefone, nome_responsavel)
  on public.user_profiles to authenticated;

drop policy if exists "Users can update their own profile" on public.user_profiles;
create policy "Users can update their own profile"
on public.user_profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.prevent_user_profile_identity_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.user_id is distinct from old.user_id
    or new.tipo_usuario is distinct from old.tipo_usuario
    or new.cpf is distinct from old.cpf
    or new.creci is distinct from old.creci
    or new.cnpj is distinct from old.cnpj then
    raise exception 'Os identificadores e o tipo de conta não podem ser alterados.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_user_profile_identity_change() from public, anon, authenticated;

drop trigger if exists user_profiles_prevent_identity_change on public.user_profiles;
create trigger user_profiles_prevent_identity_change
before update on public.user_profiles
for each row execute function public.prevent_user_profile_identity_change();

create or replace function public.prevent_auth_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if new.email is distinct from old.email then
    raise exception 'O e-mail da conta não pode ser alterado.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_auth_user_email_change() from public, anon, authenticated;

drop trigger if exists auth_users_prevent_email_change on auth.users;
create trigger auth_users_prevent_email_change
before update of email on auth.users
for each row execute function public.prevent_auth_user_email_change();

commit;
