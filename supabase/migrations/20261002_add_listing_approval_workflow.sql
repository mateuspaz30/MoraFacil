alter table public.listings
  add column if not exists status text not null default 'em_analise',
  add column if not exists motivo_reprovacao text;

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

drop policy if exists "Users can view their admin record" on public.admin_users;
create policy "Users can view their admin record"
on public.admin_users for select
to authenticated
using (auth.uid() = user_id);

insert into public.admin_users (user_id)
select id from auth.users where email = 'mateus_ipua@hotmail.com'
on conflict (user_id) do nothing;

update public.listings
set status = case lower(coalesce(status, ''))
  when 'disponível' then 'aprovado'
  when 'disponivel' then 'aprovado'
  when 'ativo' then 'aprovado'
  when 'active' then 'aprovado'
  when 'publicado' then 'aprovado'
  when 'concluído' then 'concluido'
  when 'concluido' then 'concluido'
  when 'vendido' then 'concluido'
  when 'expirado' then 'concluido'
  when 'aprovado' then 'aprovado'
  when 'reprovado' then 'reprovado'
  when 'em_analise' then 'em_analise'
  else 'em_analise'
end;

alter table public.listings
  alter column status set default 'em_analise';

alter table public.listings
  drop constraint if exists listings_status_check;

alter table public.listings
  add constraint listings_status_check
  check (status in ('em_analise', 'aprovado', 'reprovado', 'concluido'));

create index if not exists listings_status_created_at_idx
  on public.listings (status, created_at desc);

drop policy if exists "Anyone can read published listings" on public.listings;
create policy "Anyone can read published listings"
on public.listings for select
to anon, authenticated
using (
  status = 'aprovado'
  or auth.uid() = user_id
  or public.is_admin()
);

drop policy if exists "Users can create their own listings" on public.listings;
create policy "Users can create their own listings"
on public.listings for insert
to authenticated
with check (auth.uid() = user_id and status = 'em_analise');

drop policy if exists "Users can update their own listings" on public.listings;
create policy "Users can update their own listings"
on public.listings for update
to authenticated
using (auth.uid() = user_id or public.is_admin())
with check (
  public.is_admin()
  or (auth.uid() = user_id and status in ('em_analise', 'concluido'))
);
