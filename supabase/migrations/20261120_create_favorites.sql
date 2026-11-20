create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id bigint not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_pkey primary key (user_id, listing_id)
);

create index if not exists favorites_user_created_at_idx
  on public.favorites (user_id, created_at desc);

create index if not exists favorites_listing_id_idx
  on public.favorites (listing_id);

alter table public.favorites enable row level security;

revoke all on public.favorites from public, anon, authenticated;
grant select, insert, delete on public.favorites to authenticated;

drop policy if exists "Users can view their own favorites" on public.favorites;
create policy "Users can view their own favorites"
on public.favorites for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own favorites" on public.favorites;
create policy "Users can create their own favorites"
on public.favorites for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.listings
    where listings.id = listing_id
      and listings.status = 'aprovado'
  )
);

drop policy if exists "Users can delete their own favorites" on public.favorites;
create policy "Users can delete their own favorites"
on public.favorites for delete
to authenticated
using (auth.uid() = user_id);
