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

drop policy if exists "Users can view their own profile" on public.user_profiles;
create policy "Users can view their own profile"
on public.user_profiles for select
to authenticated
using (auth.uid() = user_id);

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
select
  users.id,
  case
    when users.raw_user_meta_data ->> 'tipo_usuario' in ('pessoa_fisica', 'corretor', 'imobiliaria')
      then users.raw_user_meta_data ->> 'tipo_usuario'
    else 'pessoa_fisica'
  end,
  nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''),
  case
    when length(regexp_replace(coalesce(users.raw_user_meta_data ->> 'cpf', ''), '[^0-9]', '', 'g')) = 11
      then regexp_replace(users.raw_user_meta_data ->> 'cpf', '[^0-9]', '', 'g')
  end,
  nullif(upper(btrim(users.raw_user_meta_data ->> 'creci')), ''),
  nullif(btrim(users.raw_user_meta_data ->> 'telefone'), ''),
  nullif(btrim(users.raw_user_meta_data ->> 'nome_imobiliaria'), ''),
  case
    when length(regexp_replace(coalesce(users.raw_user_meta_data ->> 'cnpj', ''), '[^0-9]', '', 'g')) = 14
      then regexp_replace(users.raw_user_meta_data ->> 'cnpj', '[^0-9]', '', 'g')
  end,
  nullif(btrim(users.raw_user_meta_data ->> 'nome_responsavel'), '')
from auth.users as users
on conflict (user_id) do nothing;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.create_user_profile();

create table if not exists public.neighborhoods (
  name text primary key check (name = btrim(name) and char_length(name) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.normalize_neighborhood_name(value text)
returns text
language sql
immutable
strict
parallel safe
set search_path = pg_catalog
as $$
  select translate(
    lower(regexp_replace(btrim(value), '[[:space:]]+', ' ', 'g')),
    'áàâãäåéèêëíìîïóòôõöúùûüçñýÿ',
    'aaaaaaeeeeiiiiooooouuuucnyy'
  );
$$;

create unique index if not exists neighborhoods_normalized_name_uidx
  on public.neighborhoods (public.normalize_neighborhood_name(name));

insert into public.neighborhoods (name)
values
  ('Centro'),
  ('Jardim das Flores'),
  ('Jardim Primavera'),
  ('Residencial Santana'),
  ('Vila Nova'),
  ('Zona Norte')
on conflict do nothing;

create table public.listings (
  id bigint generated by default as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('venda', 'aluguel', 'terreno', 'ponto_comercial')),
  property_category text not null default 'casa' check (property_category in ('casa', 'apartamento', 'terreno', 'ponto_comercial')),
  purpose text not null default 'venda' check (purpose in ('venda', 'aluguel')),
  status text not null default 'em_analise' check (status in ('em_analise', 'aprovado', 'reprovado', 'concluido')),
  destaque_home boolean not null default false,
  ordem_destaque integer,
  constraint listings_featured_order_check check (
    (destaque_home and ordem_destaque is not null and ordem_destaque > 0)
    or (not destaque_home and ordem_destaque is null)
  ),
  motivo_reprovacao text,
  price text not null,
  bedrooms integer not null default 0,
  bathrooms integer not null default 0,
  area integer not null,
  city text not null default 'Ipuã-SP',
  cep text,
  number text,
  street text,
  neighborhood text not null references public.neighborhoods(name) on update cascade on delete restrict,
  address text not null,
  description text not null,
  image text,
  images jsonb not null default '[]'::jsonb,
  advertiser text not null,
  phone text not null,
  latitude double precision not null,
  longitude double precision not null,
  visualizacoes integer not null default 0 check (visualizacoes >= 0),
  created_at timestamptz not null default now()
);

create or replace function public.increment_listing_views(target_listing_id bigint)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  view_count integer;
begin
  update public.listings as listing
  set visualizacoes = listing.visualizacoes + 1
  where listing.id = target_listing_id
    and listing.status = 'aprovado'
  returning listing.visualizacoes into view_count;

  return view_count;
end;
$$;

revoke all on function public.increment_listing_views(bigint) from public, anon, authenticated;
grant execute on function public.increment_listing_views(bigint) to anon, authenticated;

alter table public.listings enable row level security;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

alter table public.neighborhoods enable row level security;

drop policy if exists "Anyone can view active neighborhoods" on public.neighborhoods;
create policy "Anyone can view active neighborhoods"
on public.neighborhoods for select
using (active or public.is_admin());

drop policy if exists "Admins can create neighborhoods" on public.neighborhoods;
create policy "Admins can create neighborhoods"
on public.neighborhoods for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update neighborhoods" on public.neighborhoods;
create policy "Admins can update neighborhoods"
on public.neighborhoods for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete neighborhoods" on public.neighborhoods;
create policy "Admins can delete neighborhoods"
on public.neighborhoods for delete
to authenticated
using (public.is_admin());

grant select on public.neighborhoods to anon, authenticated;
grant insert, update, delete on public.neighborhoods to authenticated;

drop policy if exists "Users can view their admin record" on public.admin_users;
create policy "Users can view their admin record"
on public.admin_users for select
to authenticated
using (auth.uid() = user_id);

create policy "Anyone can read published listings"
on public.listings for select
using (status = 'aprovado' or auth.uid() = user_id or public.is_admin());

create policy "Users can create their own listings"
on public.listings for insert
to authenticated
with check (auth.uid() = user_id and status = 'em_analise');

create policy "Users can update their own listings"
on public.listings for update
to authenticated
using (auth.uid() = user_id or public.is_admin())
with check (public.is_admin() or (auth.uid() = user_id and status in ('em_analise', 'concluido')));

create policy "Users can delete their own listings"
on public.listings for delete
to authenticated
using (auth.uid() = user_id or public.is_admin());

create or replace function public.require_active_listing_neighborhood()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.neighborhood is not distinct from old.neighborhood then
    return new;
  end if;

  if not exists (
    select 1
    from public.neighborhoods
    where name = new.neighborhood
      and active
  ) then
    raise exception 'O bairro selecionado não está cadastrado ou está inativo.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists listings_require_active_neighborhood on public.listings;
create trigger listings_require_active_neighborhood
before insert or update on public.listings
for each row execute function public.require_active_listing_neighborhood();
