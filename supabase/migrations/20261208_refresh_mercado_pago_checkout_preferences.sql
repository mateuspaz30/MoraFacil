begin;

create or replace function public.record_individual_listing_checkout(
  target_listing_id bigint,
  selected_payment_method text,
  external_preference_id text,
  checkout_url text
)
returns public.billing_transactions
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_transaction public.billing_transactions;
  target_listing public.listings;
  owner_type text;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'A criação de checkout só pode ser registrada pelo serviço de cobrança.'
      using errcode = '42501';
  end if;

  if selected_payment_method not in ('pix', 'credit_card')
    or nullif(btrim(external_preference_id), '') is null
    or nullif(btrim(checkout_url), '') is null
    or checkout_url !~ '^https://'
  then
    raise exception 'Os dados do checkout são inválidos.'
      using errcode = '23514';
  end if;

  select listing.*
  into target_listing
  from public.listings as listing
  where listing.id = target_listing_id
  for update;

  if not found then
    raise exception 'O anúncio não foi encontrado.'
      using errcode = 'P0002';
  end if;

  select profile.tipo_usuario
  into owner_type
  from public.user_profiles as profile
  where profile.user_id = target_listing.user_id;

  if owner_type is distinct from 'pessoa_fisica' then
    raise exception 'A cobrança individual está disponível somente para pessoa física.'
      using errcode = '42501';
  end if;

  select billing_tx.*
  into target_transaction
  from public.billing_transactions as billing_tx
  where billing_tx.listing_id = target_listing.id
    and billing_tx.user_id = target_listing.user_id
    and billing_tx.transaction_type in ('individual_listing', 'individual_reactivation')
    and billing_tx.amount_cents = 490
    and billing_tx.currency = 'BRL'
    and billing_tx.status in ('pendente_pagamento', 'aguardando_confirmacao')
  order by billing_tx.created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'Não há cobrança pendente para este anúncio.'
      using errcode = 'P0002';
  end if;

  if target_listing.billing_status not in ('pendente_pagamento', 'aguardando_confirmacao') then
    raise exception 'O anúncio não está aguardando pagamento.'
      using errcode = '23514';
  end if;

  update public.billing_transactions
  set status = 'aguardando_confirmacao',
      payment_method = selected_payment_method,
      provider = 'mercado_pago',
      metadata = metadata || jsonb_build_object(
        'provider_preference_id', external_preference_id,
        'checkout_url', checkout_url,
        'requested_payment_method', selected_payment_method,
        'checkout_configuration_version', 'payment-types-v2'
      ),
      updated_at = now()
  where id = target_transaction.id
  returning * into target_transaction;

  perform set_config('app.billing_action', 'payment_requested', true);
  update public.listings
  set billing_status = 'aguardando_confirmacao'
  where id = target_listing.id;

  return target_transaction;
end;
$$;

revoke all on function public.record_individual_listing_checkout(bigint, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_individual_listing_checkout(bigint, text, text, text)
  to service_role;

commit;
