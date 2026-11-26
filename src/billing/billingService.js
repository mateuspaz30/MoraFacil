export const BILLING_STATUS_LABELS = {
  isento: 'Sem cobrança',
  pendente_pagamento: 'Pendente de pagamento',
  aguardando_confirmacao: 'Aguardando confirmação',
  pago: 'Pago',
  cortesia_admin: 'Liberado pelo administrador',
}

const unwrap = ({ data, error }) => {
  if (error) throw error
  return data
}

export async function loadAdminBillingData(client) {
  const [plansResult, subscriptionsResult] = await Promise.all([
    client.from('billing_plans').select('*').order('account_type').order('active_listing_limit'),
    client.from('user_subscriptions').select('*'),
  ])
  return {
    plans: unwrap(plansResult) || [],
    subscriptions: unwrap(subscriptionsResult) || [],
  }
}

export async function assignProfessionalPlan(client, userId, planId) {
  return unwrap(await client.rpc('assign_professional_plan', {
    target_user_id: userId,
    target_plan_id: planId,
    activate_without_charge: true,
  }))
}

export async function updateProfessionalPlan(client, planId, activeListingLimit, monthlyPriceCents) {
  return unwrap(await client.rpc('update_professional_billing_plan', {
    target_plan_id: planId,
    target_active_listing_limit: activeListingLimit,
    target_monthly_price_cents: monthlyPriceCents,
  }))
}

export async function requestIndividualListingReactivation(client, listingId) {
  return unwrap(await client.rpc('request_individual_listing_reactivation', {
    target_listing_id: listingId,
  }))
}

export async function releaseListingWithoutCharge(client, listingId) {
  return unwrap(await client.rpc('admin_release_listing_without_charge', {
    target_listing_id: listingId,
  }))
}
