begin;

create or replace function public.reactivate_individual_listing(target_listing_id bigint)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  owner_id uuid;
  owner_type text;
  updated_listing_id bigint;
begin
  if auth.uid() is null then
    raise exception 'É necessário entrar na conta para reativar o anúncio.'
      using errcode = '42501';
  end if;

  select listing.user_id, profile.tipo_usuario
  into owner_id, owner_type
  from public.listings as listing
  join public.user_profiles as profile on profile.user_id = listing.user_id
  where listing.id = target_listing_id;

  if owner_type is distinct from 'pessoa_fisica' then
    raise exception 'A renovação de 30 dias está disponível apenas para anúncios de pessoas físicas.'
      using errcode = '42501';
  end if;

  if auth.uid() <> owner_id and not public.is_admin() then
    raise exception 'Você não tem permissão para reativar este anúncio.'
      using errcode = '42501';
  end if;

  perform set_config('app.individual_listing_reactivation', 'on', true);

  update public.listings as listing
  set status = 'aprovado',
      individual_validity_started_at = now()
  where listing.id = target_listing_id
    and listing.user_id = owner_id
    and listing.status in ('aprovado', 'pausado')
  returning listing.id into updated_listing_id;

  if updated_listing_id is null then
    raise exception 'O anúncio não pode ser reativado. Verifique se está aprovado ou pausado.'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.reactivate_individual_listing(bigint) from public, anon, authenticated;
grant execute on function public.reactivate_individual_listing(bigint) to authenticated;

commit;
