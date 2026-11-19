create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tipo_usuario text not null check (tipo_usuario in ('pessoa_fisica', 'corretor', 'imobiliaria')),
  nome_completo text,
  cpf text check (cpf is null or cpf ~ '^[0-9]{11}$'),
  creci text,
  telefone text,
  nome_imobiliaria text,
  cnpj text check (cnpj is null or cnpj ~ '^[0-9]{14}$'),
  nome_responsavel text,
  created_at timestamptz not null default now()
);

create unique index if not exists user_profiles_cpf_uidx
  on public.user_profiles (cpf)
  where cpf is not null;

create unique index if not exists user_profiles_cnpj_uidx
  on public.user_profiles (cnpj)
  where cnpj is not null;

create unique index if not exists user_profiles_creci_uidx
  on public.user_profiles (
    upper(regexp_replace(btrim(creci), '[[:space:]]+', ' ', 'g'))
  )
  where creci is not null;

alter table public.user_profiles enable row level security;

grant select on public.user_profiles to authenticated;

drop policy if exists "Users can view their own profile" on public.user_profiles;
create policy "Users can view their own profile"
on public.user_profiles for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.is_valid_cpf(value text)
returns boolean
language plpgsql
immutable
strict
parallel safe
set search_path = pg_catalog
as $$
declare
  digits text := regexp_replace(value, '[^0-9]', '', 'g');
  total integer;
  expected_digit integer;
  i integer;
begin
  if length(digits) <> 11 or digits = repeat(substr(digits, 1, 1), 11) then
    return false;
  end if;

  total := 0;
  for i in 1..9 loop
    total := total + substr(digits, i, 1)::integer * (11 - i);
  end loop;
  expected_digit := mod(total * 10, 11);
  if expected_digit = 10 then expected_digit := 0; end if;
  if expected_digit <> substr(digits, 10, 1)::integer then
    return false;
  end if;

  total := 0;
  for i in 1..10 loop
    total := total + substr(digits, i, 1)::integer * (12 - i);
  end loop;
  expected_digit := mod(total * 10, 11);
  if expected_digit = 10 then expected_digit := 0; end if;

  return expected_digit = substr(digits, 11, 1)::integer;
end;
$$;

create or replace function public.is_valid_cnpj(value text)
returns boolean
language plpgsql
immutable
strict
parallel safe
set search_path = pg_catalog
as $$
declare
  digits text := regexp_replace(value, '[^0-9]', '', 'g');
  first_weights integer[] := array[5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  second_weights integer[] := array[6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  total integer;
  expected_digit integer;
  i integer;
begin
  if length(digits) <> 14 or digits = repeat(substr(digits, 1, 1), 14) then
    return false;
  end if;

  total := 0;
  for i in 1..12 loop
    total := total + substr(digits, i, 1)::integer * first_weights[i];
  end loop;
  expected_digit := case when mod(total, 11) < 2 then 0 else 11 - mod(total, 11) end;
  if expected_digit <> substr(digits, 13, 1)::integer then
    return false;
  end if;

  total := 0;
  for i in 1..13 loop
    total := total + substr(digits, i, 1)::integer * second_weights[i];
  end loop;
  expected_digit := case when mod(total, 11) < 2 then 0 else 11 - mod(total, 11) end;

  return expected_digit = substr(digits, 14, 1)::integer;
end;
$$;

revoke all on function public.is_valid_cpf(text) from public, anon, authenticated;
revoke all on function public.is_valid_cnpj(text) from public, anon, authenticated;

create or replace function public.create_user_profile()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  user_type text := metadata ->> 'tipo_usuario';
  cpf_value text := nullif(regexp_replace(coalesce(metadata ->> 'cpf', ''), '[^0-9]', '', 'g'), '');
  cnpj_value text := nullif(regexp_replace(coalesce(metadata ->> 'cnpj', ''), '[^0-9]', '', 'g'), '');
  creci_value text := nullif(upper(btrim(metadata ->> 'creci')), '');
begin
  if user_type is null or user_type not in ('pessoa_fisica', 'corretor', 'imobiliaria') then
    raise exception 'Selecione um perfil de usuário válido.' using errcode = '23514';
  end if;

  if nullif(btrim(metadata ->> 'telefone'), '') is null then
    raise exception 'Informe um telefone.' using errcode = '23514';
  end if;

  if user_type in ('pessoa_fisica', 'corretor') then
    if nullif(btrim(metadata ->> 'full_name'), '') is null then
      raise exception 'Informe seu nome completo.' using errcode = '23514';
    end if;
    if cpf_value is null or not public.is_valid_cpf(cpf_value) then
      raise exception 'Informe um CPF válido.' using errcode = '23514';
    end if;
  end if;

  if user_type = 'corretor' and (
    creci_value is null
    or creci_value !~ '^([0-9]{6}(-[A-Z])?|CRECI/[A-Z]{2}[[:space:]]+[0-9]{6})$'
  ) then
    raise exception 'Informe um CRECI válido.' using errcode = '23514';
  end if;

  if user_type = 'imobiliaria' then
    if nullif(btrim(metadata ->> 'nome_imobiliaria'), '') is null
      or nullif(btrim(metadata ->> 'nome_responsavel'), '') is null then
      raise exception 'Informe o nome da imobiliária e do responsável.' using errcode = '23514';
    end if;
    if cnpj_value is null or not public.is_valid_cnpj(cnpj_value) then
      raise exception 'Informe um CNPJ válido.' using errcode = '23514';
    end if;
  end if;

  insert into public.user_profiles (
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
  values (
    new.id,
    user_type,
    nullif(btrim(metadata ->> 'full_name'), ''),
    case when user_type in ('pessoa_fisica', 'corretor') then cpf_value end,
    case when user_type = 'corretor' then creci_value end,
    nullif(btrim(metadata ->> 'telefone'), ''),
    nullif(btrim(metadata ->> 'nome_imobiliaria'), ''),
    case when user_type = 'imobiliaria' then cnpj_value end,
    nullif(btrim(metadata ->> 'nome_responsavel'), '')
  );

  return new;
end;
$$;

revoke all on function public.create_user_profile() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.create_user_profile();
