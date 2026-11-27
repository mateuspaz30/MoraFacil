import { createClient } from 'npm:@supabase/supabase-js@2'

const checkoutConfigurationVersion = 'payment-types-v2'

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
}

const jsonResponse = (body: Record<string, unknown>, status = 200, headers: HeadersInit = {}) => new Response(
  JSON.stringify(body),
  { status, headers: { ...headers, 'Content-Type': 'application/json' } },
)

const isAllowedCheckoutUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
      && (url.hostname === 'mercadopago.com.br'
        || url.hostname.endsWith('.mercadopago.com.br')
        || url.hostname === 'mercadopago.com'
        || url.hostname.endsWith('.mercadopago.com'))
  } catch {
    return false
  }
}

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin')
  const siteUrl = Deno.env.get('MERCADO_PAGO_SITE_URL')
  let siteOrigin = ''
  try {
    const site = new URL(siteUrl || '')
    if (site.protocol === 'https:') siteOrigin = site.origin
  } catch {
    // The configuration error is returned below as a normal checkout response.
  }
  const responseHeaders: Record<string, string> = { ...corsHeaders }
  if (origin && siteOrigin && origin === siteOrigin) responseHeaders['Access-Control-Allow-Origin'] = origin
  const respond = (body: Record<string, unknown>, status = 200) => jsonResponse(body, status, responseHeaders)

  if (request.method === 'OPTIONS') return new Response('ok', { headers: responseHeaders })
  if (request.method !== 'POST') return respond({ error: 'Método não permitido.' }, 405)

  const authorization = request.headers.get('Authorization')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
  const mode = Deno.env.get('MERCADO_PAGO_MODE')

  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey || !accessToken || !siteUrl) {
    return respond({ error: 'O checkout ainda não está configurado no servidor.' }, 503)
  }
  if (!['test', 'production'].includes(mode || '')) {
    return respond({ error: 'Configure MERCADO_PAGO_MODE como test ou production.' }, 503)
  }
  if ((mode === 'test' && !accessToken.startsWith('TEST-'))
    || (mode === 'production' && !accessToken.startsWith('APP_USR-'))) {
    return respond({ error: 'O Access Token não corresponde ao modo do Mercado Pago configurado.' }, 503)
  }

  if (!siteOrigin) return respond({ error: 'MERCADO_PAGO_SITE_URL precisa ser uma URL HTTPS válida.' }, 503)
  if (origin && origin !== siteOrigin) return respond({ error: 'Origem não autorizada.' }, 403)

  let body: { listingId?: number; paymentMethod?: string }
  try {
    body = await request.json()
  } catch {
    return respond({ error: 'Corpo da solicitação inválido.' }, 400)
  }

  const listingId = Number(body.listingId)
  const paymentMethod = body.paymentMethod
  if (!Number.isSafeInteger(listingId) || listingId <= 0
    || !['pix', 'credit_card'].includes(paymentMethod || '')) {
    return respond({ error: 'Anúncio ou forma de pagamento inválida.' }, 400)
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: userData, error: authError } = await callerClient.auth.getUser()
  if (authError || !userData.user) return respond({ error: 'Sessão inválida. Entre novamente.' }, 401)

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const [{ data: profile, error: profileError }, { data: listing, error: listingError }, { data: transaction, error: transactionError }] = await Promise.all([
    serviceClient.from('user_profiles').select('tipo_usuario').eq('user_id', userData.user.id).maybeSingle(),
    serviceClient.from('listings').select('id, user_id, title, billing_status').eq('id', listingId).eq('user_id', userData.user.id).maybeSingle(),
    serviceClient
      .from('billing_transactions')
      .select('id, user_id, listing_id, transaction_type, amount_cents, currency, status, payment_method, metadata')
      .eq('listing_id', listingId)
      .eq('user_id', userData.user.id)
      .in('transaction_type', ['individual_listing', 'individual_reactivation'])
      .in('status', ['pendente_pagamento', 'aguardando_confirmacao'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  if (profileError || listingError || transactionError) {
    console.error('Falha ao validar a cobrança individual:', profileError || listingError || transactionError)
    return respond({ error: 'Não foi possível validar a cobrança do anúncio.' }, 500)
  }
  if (profile?.tipo_usuario !== 'pessoa_fisica' || !listing || !transaction
    || transaction.amount_cents !== 490 || transaction.currency !== 'BRL'
    || !['pendente_pagamento', 'aguardando_confirmacao'].includes(listing.billing_status)) {
    return respond({ error: 'Não há uma cobrança de R$ 4,90 válida para este anúncio.' }, 409)
  }

  const storedMetadata = transaction.metadata && typeof transaction.metadata === 'object'
    ? transaction.metadata as Record<string, unknown>
    : {}
  if (storedMetadata.checkout_configuration_version === checkoutConfigurationVersion
    && typeof storedMetadata.provider_preference_id === 'string') {
    if (storedMetadata.requested_payment_method !== paymentMethod) {
      return respond({ error: 'Já existe um checkout iniciado com outra forma de pagamento para este anúncio.' }, 409)
    }
    if (typeof storedMetadata.checkout_url === 'string' && isAllowedCheckoutUrl(storedMetadata.checkout_url)) {
      return respond({
        checkout_url: storedMetadata.checkout_url,
        status: transaction.status,
      })
    }
  }

  let availableMethodsResponse: Response
  try {
    availableMethodsResponse = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch (error) {
    console.error('Falha ao consultar os meios de pagamento do Mercado Pago:', error)
    return respond({ error: 'Não foi possível consultar os meios de pagamento. Tente novamente.' }, 502)
  }
  if (!availableMethodsResponse.ok) {
    console.error('Mercado Pago recusou a consulta de meios de pagamento:', availableMethodsResponse.status)
    return respond({ error: 'O Mercado Pago não disponibilizou os meios de pagamento para esta conta.' }, 502)
  }

  const availableMethods = await availableMethodsResponse.json()
  const methods = Array.isArray(availableMethods) ? availableMethods : []
  const isSelectedMethod = (method: Record<string, unknown>) => paymentMethod === 'pix'
    ? method.id === 'pix' && method.payment_type_id === 'bank_transfer'
    : method.payment_type_id === 'credit_card'
  if (!methods.some((method: Record<string, unknown>) => isSelectedMethod(method))) {
    return respond({ error: `A forma ${paymentMethod === 'pix' ? 'Pix' : 'cartão de crédito'} não está habilitada nesta conta Mercado Pago.` }, 409)
  }
  const selectedPaymentType = paymentMethod === 'pix' ? 'bank_transfer' : 'credit_card'
  const excludedPaymentTypes = [...new Set(
    methods
      .map((method: Record<string, unknown>) => method.payment_type_id)
      .filter((type: unknown): type is string => (
        typeof type === 'string'
        && type !== selectedPaymentType
        && type !== 'account_money'
      )),
  )].map((id) => ({ id }))

  const webhookUrl = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/mercado-pago-webhook`
  const backUrl = `${siteOrigin}${new URL(siteUrl).pathname.replace(/\/+$/, '')}/minha-area/meus-imoveis?pagamento=retorno`
  const preferenceBody = {
    items: [{
      id: transaction.id,
      title: transaction.transaction_type === 'individual_reactivation'
        ? `Renovação do anúncio: ${listing.title}`
        : `Publicação do anúncio: ${listing.title}`,
      quantity: 1,
      unit_price: transaction.amount_cents / 100,
      currency_id: 'BRL',
    }],
    payer: mode === 'production' && userData.user.email
      ? { email: userData.user.email }
      : undefined,
    external_reference: transaction.id,
    metadata: { billing_transaction_id: transaction.id, listing_id: listing.id },
    notification_url: webhookUrl,
    back_urls: {
      success: backUrl,
      pending: backUrl,
      failure: backUrl,
    },
    auto_return: 'approved',
    payment_methods: {
      ...(paymentMethod === 'pix' ? { default_payment_method_id: 'pix' } : {}),
      excluded_payment_types: excludedPaymentTypes,
    },
  }

  let preferenceResponse: Response
  try {
    preferenceResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${transaction.id}:${paymentMethod}:${checkoutConfigurationVersion}`,
      },
      body: JSON.stringify(preferenceBody),
    })
  } catch (error) {
    console.error('Falha ao criar preferência de pagamento:', error)
    return respond({ error: 'Não foi possível iniciar o checkout. Tente novamente.' }, 502)
  }
  const preference = await preferenceResponse.json().catch(() => null)
  if (!preferenceResponse.ok) {
    console.error(
      'Mercado Pago recusou a preferência de pagamento:',
      preferenceResponse.status,
      preference?.message || '',
      Array.isArray(preference?.cause)
        ? preference.cause.map((cause: Record<string, unknown>) => ({
          code: cause.code,
          description: cause.description,
        }))
        : [],
    )
    return respond({ error: 'O Mercado Pago não conseguiu iniciar o pagamento. Tente novamente.' }, 502)
  }

  const checkoutUrl = mode === 'test'
    ? preference.sandbox_init_point || preference.init_point
    : preference.init_point
  if (typeof preference.id !== 'string' || typeof checkoutUrl !== 'string' || !isAllowedCheckoutUrl(checkoutUrl)) {
    console.error('Mercado Pago retornou uma preferência sem URL segura de checkout.')
    return respond({ error: 'O Mercado Pago retornou uma resposta de checkout inválida.' }, 502)
  }

  const { error: recordError } = await serviceClient.rpc('record_individual_listing_checkout', {
    target_listing_id: listingId,
    selected_payment_method: paymentMethod,
    external_preference_id: preference.id,
    checkout_url: checkoutUrl,
  })
  if (recordError) {
    console.error('Falha ao registrar a preferência de pagamento:', recordError)
    return respond({ error: 'O checkout foi criado, mas não foi possível registrar o estado da cobrança. Tente novamente.' }, 500)
  }

  return respond({ checkout_url: checkoutUrl, status: 'aguardando_confirmacao' })
})
