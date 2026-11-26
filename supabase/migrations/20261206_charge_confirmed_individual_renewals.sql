begin;

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
    raise exception 'Entre na sua conta para solicitar a renovação.'
      using errcode = '42501';
  end if;

  select listing.*
  into target_listing
  from public.listings as listing
  join public.user_profiles as profile on profile.user_id = listing.user_id
  where listing.id = target_listing_id
    and listing.user_id = auth.uid()
    and profile.tipo_usuario = 'pessoa_fisica'
  for update;

  if not found then
    raise exception 'O anúncio não foi encontrado na sua conta.'
      using errcode = 'P0002';
  end if;
  if target_listing.status not in ('aprovado', 'pausado')
    or target_listing.individual_validity_started_at is null then
    raise exception 'Somente anúncios publicados ou pausados com validade podem ser renovados.'
      using errcode = '23514';
  end if;

  request_key := 'individual-reactivation:' || target_listing.id::text || ':'
    || to_char(target_listing.individual_validity_started_at at time zone 'UTC', 'YYYYMMDDHH24MISSUS');

  select id into result_transaction_id
  from public.billing_transactions
  where idempotency_key = request_key
    and status in ('pendente_pagamento', 'aguardando_confirmacao');

  if result_transaction_id is not null then
    perform set_config('app.billing_action', 'payment_requested', true);
    update public.listings
    set billing_status = 'pendente_pagamento'
    where id = target_listing.id;
    return result_transaction_id;
  end if;

  select id into result_transaction_id
  from public.billing_transactions
  where idempotency_key = request_key;

  perform set_config('app.billing_action', 'payment_requested', true);
  update public.listings
  set billing_status = 'pendente_pagamento'
  where id = target_listing.id;

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

commit;
