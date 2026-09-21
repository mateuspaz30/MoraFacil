create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "Users can view their admin record" on public.admin_users;
create policy "Users can view their admin record"
on public.admin_users for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can update their own listings" on public.listings;
create policy "Users can update their own listings"
on public.listings for update
to authenticated
using (
  auth.uid() = user_id
  or exists (select 1 from public.admin_users where user_id = auth.uid())
)
with check (
  auth.uid() = user_id
  or exists (select 1 from public.admin_users where user_id = auth.uid())
);

drop policy if exists "Users can delete their own listings" on public.listings;
create policy "Users can delete their own listings"
on public.listings for delete
to authenticated
using (
  auth.uid() = user_id
  or exists (select 1 from public.admin_users where user_id = auth.uid())
);

insert into public.admin_users (user_id)
select id
from auth.users
where email = 'mateus_ipua@hotmail.com'
on conflict (user_id) do nothing;
