begin;

alter table public.listings
  add column if not exists billing_status text;

alter table public.listings
  drop constraint if exists listings_billing_status_check;

alter table public.listings
  add constraint listings_billing_status_check
    check (billing_status in ('isento', 'pendente_pagamento', 'aguardando_confirmacao', 'pago', 'cortesia_admin'));

update public.listings as listing
set billing_status = case
      when profile.tipo_usuario = 'pessoa_fisica' then 'cortesia_admin'
      else 'isento'
    end
from public.user_profiles as profile
where profile.user_id = listing.user_id
  and listing.billing_status is null;

update public.listings
set billing_status = 'isento'
where billing_status is null;

alter table public.listings
  alter column billing_status set default 'isento',
  alter column billing_status set not null;

create table if not exists public.individual_listing_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  free_listing_id bigint references public.listings(id) on delete set null deferrable initially deferred,
  free_listing_claimed_at timestamptz not null default now()
);

create table if not exists public.billing_plans (
  id text primary key,
  account_type text not null check (account_type in ('corretor', 'imobiliaria')),
  name text not null,
  active_listing_limit integer not null check (active_listing_limit > 0),
  monthly_price_cents integer check (monthly_price_cents is null or monthly_price_cents >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.billing_plans (id, account_type, name, active_listing_limit, monthly_price_cents)
values
  ('corretor-10', 'corretor', 'Corretor Essencial', 10, null),
  ('corretor-25', 'corretor', 'Corretor Profissional', 25, null),
  ('imobiliaria-50', 'imobiliaria', 'Imobiliária Essencial', 50, null),
  ('imobiliaria-120', 'imobiliaria', 'Imobiliária Profissional', 120, null)
on conflict (id) do nothing;

create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_id text references public.billing_plans(id) on delete set null,
  status text not null default 'inactive'
    check (status in ('inactive', 'pending_payment', 'awaiting_confirmation', 'active', 'past_due', 'cancelled')),
  payment_status text not null default 'isento'
    check (payment_status in ('isento', 'pendente_pagamento', 'aguardando_confirmacao', 'pago')),
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  provider text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (current_period_ends_at is null or current_period_starts_at is null or current_period_ends_at > current_period_starts_at)
);

create table if not exists public.billing_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id bigint references public.listings(id) on delete set null,
  plan_id text references public.billing_plans(id) on delete set null,
  transaction_type text not null check (transaction_type in ('individual_listing', 'individual_reactivation', 'subscription')),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'BRL' check (currency = 'BRL'),
  status text not null default 'pendente_pagamento'
    check (status in ('pendente_pagamento', 'aguardando_confirmacao', 'pago', 'falhou', 'cancelado')),
  payment_method text check (payment_method is null or payment_method in ('pix', 'credit_card')),
  provider text,
  provider_payment_id text,
  idempotency_key text not null unique,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists billing_transactions_user_created_idx
  on public.billing_transactions (user_id, created_at desc);
create index if not exists billing_transactions_listing_created_idx
  on public.billing_transactions (listing_id, created_at desc);
create unique index if not exists billing_transactions_provider_payment_uidx
  on public.billing_transactions (provider, provider_payment_id)
  where provider is not null and provider_payment_id is not null;

alter table public.individual_listing_entitlements enable row level security;
alter table public.billing_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.billing_transactions enable row level security;

revoke all on public.individual_listing_entitlements, public.billing_plans, public.user_subscriptions, public.billing_transactions
  from public, anon, authenticated;
grant select on public.billing_plans, public.user_subscriptions, public.billing_transactions to authenticated;

drop policy if exists "Admins can view billing plans" on public.billing_plans;
create policy "Admins can view billing plans"
on public.billing_plans for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can view individual listing entitlements" on public.individual_listing_entitlements;
create policy "Admins can view individual listing entitlements"
on public.individual_listing_entitlements for select to authenticated
using (public.is_admin());

drop policy if exists "Users can view their subscription" on public.user_subscriptions;
create policy "Users can view their subscription"
on public.user_subscriptions for select to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can view their billing transactions" on public.billing_transactions;
create policy "Users can view their billing transactions"
on public.billing_transactions for select to authenticated
using (auth.uid() = user_id or public.is_admin());

create or replace function public.apply_listing_billing_rules()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  owner_type text;
  claimed_user_id uuid;
  assigned_plan_limit integer;
  active_listing_count integer;
  billing_action text := current_setting('app.billing_action', true);
begin
  select profile.tipo_usuario
  into owner_type
  from public.user_profiles as profile
  where profile.user_id = new.user_id;

  if tg_op = 'INSERT' then
    new.billing_status := 'isento';

    if owner_type = 'pessoa_fisica' then
      insert into public.individual_listing_entitlements (user_id, free_listing_id)
      values (new.user_id, new.id)
      on conflict (user_id) do nothing
      returning user_id into claimed_user_id;

      if claimed_user_id is null then
        new.billing_status := 'pendente_pagamento';
      end if;
    end if;
    return new;
  end if;

  if new.billing_status is distinct from old.billing_status
    and coalesce(billing_action, '') not in ('payment_requested', 'payment_confirmed', 'admin_grant') then
    raise exception 'O estado de cobrança só pode ser alterado por uma operação autorizada.'
      using errcode = '42501';
  end if;

  if new.status = 'aprovado' and old.status is distinct from 'aprovado' then
    if owner_type = 'pessoa_fisica' then
      if new.billing_status not in ('isento', 'pago', 'cortesia_admin') then
        raise exception 'O anúncio está pendente de pagamento e não pode ser publicado.'
          using errcode = '42501';
      end if;
    elsif owner_type in ('corretor', 'imobiliaria') then
      select plan.active_listing_limit
      into assigned_plan_limit
      from public.user_subscriptions as subscription
      join public.billing_plans as plan on plan.id = subscription.plan_id
      where subscription.user_id = new.user_id
        and subscription.status = 'active'
        and plan.active;

      if assigned_plan_limit is null then
        raise exception 'Atribua um plano ativo ao profissional antes de aprovar novos anúncios.'
          using errcode = '23514';
      end if;

      select count(*)::integer
      into active_listing_count
      from public.listings as listing
      where listing.user_id = new.user_id
        and listing.id <> new.id
        and listing.status = 'aprovado';

      if active_listing_count >= assigned_plan_limit then
        raise exception 'O limite do plano foi atingido (% anúncios ativos).', assigned_plan_limit
          using errcode = '23514';
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.apply_listing_billing_rules() from public, anon, authenticated;

drop trigger if exists listings_apply_billing_rules on public.listings;
create trigger listings_apply_billing_rules
before insert or update of status, billing_status
on public.listings
for each row execute function public.apply_listing_billing_rules();

create or replace function public.create_individual_listing_payment_request()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.billing_status = 'pendente_pagamento' then
    insert into public.billing_transactions (
      user_id, listing_id, transaction_type, amount_cents, idempotency_key
    )
    values (
      new.user_id,
      new.id,
      'individual_listing',
      490,
      'individual-listing:' || new.id::text
    )
    on conflict (idempotency_key) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.create_individual_listing_payment_request() from public, anon, authenticated;

drop trigger if exists listings_create_individual_listing_payment_request on public.listings;
create trigger listings_create_individual_listing_payment_request
after insert on public.listings
for each row execute function public.create_individual_listing_payment_request();

create or replace function public.assign_professional_plan(
  target_user_id uuid,
  target_plan_id text,
  activate_without_charge boolean default true
)
returns public.user_subscriptions
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  owner_type text;
  selected_plan public.billing_plans;
  result public.user_subscriptions;
begin
  if not public.is_admin() then
    raise exception 'Somente administradores podem atribuir planos.'
      using errcode = '42501';
  end if;

  select tipo_usuario into owner_type
  from public.user_profiles
  where user_id = target_user_id;

  select * into selected_plan
  from public.billing_plans
  where id = target_plan_id and active;

  if selected_plan.id is null or selected_plan.account_type is distinct from owner_type then
    raise exception 'O plano selecionado não corresponde ao tipo de conta profissional.'
      using errcode = '23514';
  end if;

  insert into public.user_subscriptions (
    user_id, plan_id, status, payment_status, assigned_by, assigned_at, current_period_starts_at
  )
  values (
    target_user_id,
    target_plan_id,
    case when activate_without_charge then 'active' else 'inactive' end,
    'isento',
    auth.uid(),
    now(),
    case when activate_without_charge then now() else null end
  )
  on conflict (user_id) do update
  set plan_id = excluded.plan_id,
      status = excluded.status,
      payment_status = 'isento',
      assigned_by = auth.uid(),
      assigned_at = now(),
      current_period_starts_at = excluded.current_period_starts_at,
      current_period_ends_at = null,
      updated_at = now()
  returning * into result;

  return result;
end;
$$;

revoke all on function public.assign_professional_plan(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.assign_professional_plan(uuid, text, boolean) to authenticated;

create or replace function public.update_professional_billing_plan(
  target_plan_id text,
  target_active_listing_limit integer,
  target_monthly_price_cents integer default null
)
returns public.billing_plans
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  result public.billing_plans;
begin
  if not public.is_admin() then
    raise exception 'Somente administradores podem configurar planos.'
      using errcode = '42501';
  end if;
  if target_active_listing_limit < 1
    or (target_monthly_price_cents is not null and target_monthly_price_cents < 0) then
    raise exception 'Informe um limite positivo e um valor mensal válido.'
      using errcode = '23514';
  end if;

  update public.billing_plans
  set active_listing_limit = target_active_listing_limit,
      monthly_price_cents = target_monthly_price_cents,
      updated_at = now()
  where id = target_plan_id
  returning * into result;

  if result.id is null then
    raise exception 'O plano selecionado não foi encontrado.'
      using errcode = 'P0002';
  end if;
  return result;
end;
$$;

revoke all on function public.update_professional_billing_plan(text, integer, integer) from public, anon, authenticated;
grant execute on function public.update_professional_billing_plan(text, integer, integer) to authenticated;

create or replace function public.request_individual_listing_reactivation(target_listing_id bigint)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_listing public.listings;
  result_transaction_id uuid;
  request_key text;
begin
  if auth.uid() is null then
    raise exception 'Entre na sua conta para solicitar a reativação.'
      using errcode = '42501';
  end if;

  select listing.* into target_listing
  from public.listings as listing
  join public.user_profiles as profile on profile.user_id = listing.user_id
  where listing.id = target_listing_id
    and listing.user_id = auth.uid()
    and profile.tipo_usuario = 'pessoa_fisica'
  for update;

  if target_listing.id is null then
    raise exception 'O anúncio não foi encontrado na sua conta.'
      using errcode = 'P0002';
  end if;
  if target_listing.individual_validity_started_at is null
    or target_listing.individual_validity_started_at > now() - interval '30 days' then
    raise exception 'A cobrança de reativação se aplica após os 30 dias de validade.'
      using errcode = '23514';
  end if;

  request_key := 'individual-reactivation:' || target_listing.id::text || ':'
    || to_char(target_listing.individual_validity_started_at at time zone 'UTC', 'YYYYMMDDHH24MISSUS');

  select id into result_transaction_id
  from public.billing_transactions
  where idempotency_key = request_key
    and status in ('pendente_pagamento', 'aguardando_confirmacao');

  if result_transaction_id is not null then
    return result_transaction_id;
  end if;

  select id into result_transaction_id
  from public.billing_transactions
  where idempotency_key = request_key;

  if result_transaction_id is not null then
    update public.billing_transactions
    set status = 'pendente_pagamento',
        provider = null,
        provider_payment_id = null,
        payment_method = null,
        confirmed_at = null,
        updated_at = now()
    where id = result_transaction_id;
  else
    perform set_config('app.billing_action', 'payment_requested', true);
    update public.listings
    set billing_status = 'pendente_pagamento'
    where id = target_listing.id;

    insert into public.billing_transactions (
      user_id, listing_id, transaction_type, amount_cents, idempotency_key
    )
    values (
      auth.uid(),
      target_listing.id,
      'individual_reactivation',
      490,
      request_key
    )
    returning id into result_transaction_id;
  end if;

  return result_transaction_id;
end;
$$;

revoke all on function public.request_individual_listing_reactivation(bigint) from public, anon, authenticated;
grant execute on function public.request_individual_listing_reactivation(bigint) to authenticated;

create or replace function public.reactivate_individual_listing(target_listing_id bigint)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_listing public.listings;
  owner_type text;
  is_administrator boolean := public.is_admin();
begin
  if auth.uid() is null then
    raise exception 'É necessário entrar na conta para reativar o anúncio.'
      using errcode = '42501';
  end if;

  select listing.*
  into target_listing
  from public.listings as listing
  where listing.id = target_listing_id
    and (listing.user_id = auth.uid() or is_administrator)
  for update;

  select profile.tipo_usuario
  into owner_type
  from public.user_profiles as profile
  where profile.user_id = target_listing.user_id;

  if target_listing.id is null or owner_type is distinct from 'pessoa_fisica' then
    raise exception 'O anúncio não pode ser reativado por esta operação.'
      using errcode = '42501';
  end if;

  if is_administrator then
    perform set_config('app.billing_action', 'admin_grant', true);
    perform set_config('app.individual_listing_reactivation', 'on', true);
    update public.billing_transactions
    set status = 'cancelado',
        updated_at = now(),
        metadata = metadata || jsonb_build_object('cancelled_by_admin', auth.uid())
    where listing_id = target_listing.id
      and status in ('pendente_pagamento', 'aguardando_confirmacao');

    update public.listings
    set status = 'aprovado',
    billing_status = 'cortesia_admin',
        individual_validity_started_at = now()
    where id = target_listing.id
      and status in ('aprovado', 'pausado');
    if not found then
      raise exception 'O anúncio não pode ser reativado neste estado.'
        using errcode = '23514';
    end if;
  elsif target_listing.status = 'pausado'
    and target_listing.individual_validity_started_at > now() - interval '30 days' then
    update public.listings
    set status = 'aprovado'
    where id = target_listing.id;
  else
    raise exception 'Após os 30 dias, a reativação exige pagamento de R$ 4,90.'
      using errcode = '23514';
  end if;
end;
$$;

revoke all on function public.reactivate_individual_listing(bigint) from public, anon, authenticated;
grant execute on function public.reactivate_individual_listing(bigint) to authenticated;

create or replace function public.admin_release_listing_without_charge(target_listing_id bigint)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_listing public.listings;
  owner_type text;
begin
  if not public.is_admin() then
    raise exception 'Somente administradores podem liberar anúncios sem cobrança.'
      using errcode = '42501';
  end if;

  select listing.*
  into target_listing
  from public.listings as listing
  where listing.id = target_listing_id
  for update;

  select profile.tipo_usuario
  into owner_type
  from public.user_profiles as profile
  where profile.user_id = target_listing.user_id;

  if target_listing.id is null or owner_type is distinct from 'pessoa_fisica' then
    raise exception 'A liberação manual está disponível apenas para anúncios de pessoa física.'
      using errcode = '42501';
  end if;
  if target_listing.status not in ('em_analise', 'aprovado', 'pausado') then
    raise exception 'Somente anúncios em análise, aprovados ou pausados podem ser liberados.'
      using errcode = '23514';
  end if;

  perform set_config('app.billing_action', 'admin_grant', true);
  perform set_config('app.individual_listing_reactivation', 'on', true);
  update public.billing_transactions
  set status = 'cancelado',
      updated_at = now(),
      metadata = metadata || jsonb_build_object('cancelled_by_admin', auth.uid())
  where listing_id = target_listing.id
    and status in ('pendente_pagamento', 'aguardando_confirmacao');

  update public.listings
  set billing_status = 'cortesia_admin',
      status = case when target_listing.status = 'pausado' then 'aprovado' else target_listing.status end,
      individual_validity_started_at = case
        when target_listing.status in ('aprovado', 'pausado') then now()
        else individual_validity_started_at
      end
  where id = target_listing.id;
end;
$$;

revoke all on function public.admin_release_listing_without_charge(bigint) from public, anon, authenticated;
grant execute on function public.admin_release_listing_without_charge(bigint) to authenticated;

create or replace function public.confirm_listing_billing_transaction(
  target_transaction_id uuid,
  external_payment_id text,
  selected_payment_method text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_transaction public.billing_transactions;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Confirmação de pagamento permitida somente pelo serviço de webhook.'
      using errcode = '42501';
  end if;
  if nullif(btrim(external_payment_id), '') is null
    or selected_payment_method not in ('pix', 'credit_card') then
    raise exception 'A confirmação exige um identificador externo e um meio de pagamento válido.'
      using errcode = '23514';
  end if;

  select * into target_transaction
  from public.billing_transactions
  where id = target_transaction_id
  for update;

  if target_transaction.id is null then
    raise exception 'Transação de cobrança não encontrada.'
      using errcode = 'P0002';
  end if;
  if target_transaction.status = 'pago' then
    if target_transaction.provider_payment_id = external_payment_id then return; end if;
    raise exception 'A transação já foi confirmada com outro identificador.'
      using errcode = '23514';
  end if;
  if target_transaction.status not in ('pendente_pagamento', 'aguardando_confirmacao') then
    raise exception 'A transação não está aguardando confirmação.'
      using errcode = '23514';
  end if;

  perform set_config('app.billing_action', 'payment_confirmed', true);
  perform set_config('app.individual_listing_reactivation', 'on', true);
  update public.billing_transactions
  set status = 'pago',
      provider = 'mercado_pago',
      provider_payment_id = external_payment_id,
      payment_method = selected_payment_method,
      confirmed_at = now(),
      updated_at = now()
  where id = target_transaction.id;

  if target_transaction.transaction_type in ('individual_listing', 'individual_reactivation')
    and target_transaction.listing_id is not null then
    update public.listings
    set billing_status = 'pago',
        status = case
          when target_transaction.transaction_type = 'individual_reactivation' then 'aprovado'
          else status
        end,
        individual_validity_started_at = case
          when target_transaction.transaction_type = 'individual_reactivation' then now()
          else individual_validity_started_at
        end
    where id = target_transaction.listing_id;
  elsif target_transaction.transaction_type = 'subscription' then
    update public.user_subscriptions
    set status = 'active',
        payment_status = 'pago',
        updated_at = now()
    where user_id = target_transaction.user_id
      and plan_id = target_transaction.plan_id;
  end if;
end;
$$;

revoke all on function public.confirm_listing_billing_transaction(uuid, text, text) from public, anon, authenticated;
grant execute on function public.confirm_listing_billing_transaction(uuid, text, text) to service_role;

drop policy if exists "Anyone can read published listings" on public.listings;
create policy "Anyone can read published listings"
on public.listings for select to anon, authenticated
using (
  (
    status = 'aprovado'
    and billing_status in ('isento', 'pago', 'cortesia_admin')
    and (
      individual_validity_started_at is null
      or individual_validity_started_at > now() - interval '30 days'
    )
  )
  or auth.uid() = user_id
  or public.is_admin()
);

create or replace function public.get_public_professional_directory()
returns table (
  slug text,
  professional_type text,
  professional_name text,
  city text,
  description text,
  logo_url text,
  cover_url text,
  active_listing_count bigint
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    profile.public_slug,
    profile.tipo_usuario,
    coalesce(
      nullif(btrim(profile.public_display_name), ''),
      case when profile.tipo_usuario = 'imobiliaria' then profile.nome_imobiliaria else profile.nome_completo end
    ),
    coalesce(
      nullif(btrim(profile.public_city), ''),
      (
        select listing.city
        from public.listings as listing
        where listing.user_id = profile.user_id
          and listing.status = 'aprovado'
          and listing.billing_status in ('isento', 'pago', 'cortesia_admin')
          and (
            listing.individual_validity_started_at is null
            or listing.individual_validity_started_at > now() - interval '30 days'
          )
        order by listing.created_at desc
        limit 1
      )
    ),
    profile.public_description,
    profile.public_logo_url,
    profile.public_cover_url,
    (
      select count(*)::bigint
      from public.listings as listing
      where listing.user_id = profile.user_id
        and listing.status = 'aprovado'
        and listing.billing_status in ('isento', 'pago', 'cortesia_admin')
    )
  from public.user_profiles as profile
  where profile.tipo_usuario in ('corretor', 'imobiliaria')
    and nullif(btrim(profile.public_slug), '') is not null
    and nullif(btrim(coalesce(
      nullif(btrim(profile.public_display_name), ''),
      case when profile.tipo_usuario = 'imobiliaria' then profile.nome_imobiliaria else profile.nome_completo end
    )), '') is not null
  order by 3;
$$;

revoke all on function public.get_public_professional_directory() from public;
grant execute on function public.get_public_professional_directory() to anon, authenticated;

insert into public.individual_listing_entitlements (user_id, free_listing_id, free_listing_claimed_at)
select distinct on (listing.user_id)
  listing.user_id,
  listing.id,
  coalesce(listing.created_at, now())
from public.listings as listing
join public.user_profiles as profile on profile.user_id = listing.user_id
where profile.tipo_usuario = 'pessoa_fisica'
order by listing.user_id, listing.created_at nulls last, listing.id
on conflict (user_id) do nothing;

commit;
