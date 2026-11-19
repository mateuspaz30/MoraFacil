grant update (nome_completo, cpf, creci, telefone, nome_imobiliaria, cnpj, nome_responsavel)
  on public.user_profiles to authenticated;

drop policy if exists "Users can update their own profile" on public.user_profiles;
create policy "Users can update their own profile"
on public.user_profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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
on conflict do nothing;
