begin;

drop function if exists public.reactivate_individual_listing(bigint);

create or replace function public.reactivate_individual_listing(target_listing_id bigint)
returns public.listings
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

  if not found then
    raise exception 'O anúncio não foi encontrado ou você não tem permissão para reativá-lo.'
      using errcode = '42501';
  end if;

  select profile.tipo_usuario
  into owner_type
  from public.user_profiles as profile
  where profile.user_id = target_listing.user_id;

  if owner_type is distinct from 'pessoa_fisica' then
    raise exception 'A renovação de 30 dias está disponível apenas para anúncios de pessoas físicas.'
      using errcode = '42501';
  end if;

  if target_listing.status not in ('aprovado', 'pausado') then
    raise exception 'Somente anúncios aprovados ou pausados podem ser reativados.'
      using errcode = '23514';
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
    returning * into target_listing;
  else
    if target_listing.individual_validity_started_at is null
      or target_listing.individual_validity_started_at <= now() - interval '30 days' then
      raise exception 'Após os 30 dias, a reativação exige pagamento de R$ 4,90.'
        using errcode = '23514';
    end if;

    if target_listing.billing_status not in ('isento', 'pago', 'cortesia_admin') then
      raise exception 'O anúncio exige pagamento antes de ser reativado.'
        using errcode = '23514';
    end if;

    perform set_config('app.individual_listing_reactivation', 'on', true);
    update public.listings
    set status = 'aprovado',
        individual_validity_started_at = now()
    where id = target_listing.id
    returning * into target_listing;
  end if;

  return target_listing;
end;
$$;

revoke all on function public.reactivate_individual_listing(bigint) from public, anon, authenticated;
grant execute on function public.reactivate_individual_listing(bigint) to authenticated;

commit;
