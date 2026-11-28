import { createClient } from 'npm:@supabase/supabase-js@2'

const jsonResponse = (body: Record<string, unknown>, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { 'Content-Type': 'application/json' } },
)

const parseSignatureHeader = (value: string) => new Map<string, string>(
  value.split(',').map((part) => {
    const [key, ...rest] = part.trim().split('=')
    return [key, rest.join('=')] as const
  }),
)

const hexToBytes = (hex: string) => {
  if (!/^[\da-f]{64}$/i.test(hex)) return null
  return Uint8Array.from(hex.match(/.{2}/g) || [], (byte) => Number.parseInt(byte, 16))
}

const isValidSignature = async (request: Request, dataId: string, secret: string) => {
  const signatureHeader = request.headers.get('x-signature')
  const requestId = request.headers.get('x-request-id')
  if (!signatureHeader || !requestId) return false

  const signature = parseSignatureHeader(signatureHeader)
  const timestamp = signature.get('ts')
  const signatureBytes = hexToBytes(signature.get('v1') || '')
  if (!timestamp || !/^\d+$/.test(timestamp) || !signatureBytes) return false

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`
  // Delayed retries remain safe because the payment is re-fetched and confirmation is idempotent.
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  return crypto.subtle.verify('HMAC', key, signatureBytes, new TextEncoder().encode(manifest))
}

type MercadoPagoNotification = {
  action?: unknown
  data?: { id?: unknown }
  topic?: unknown
  type?: unknown
}

const asString = (value: unknown) => typeof value === 'string' ? value : ''

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok')
  if (request.method !== 'POST') return jsonResponse({ error: 'Método não permitido.' }, 405)

  const webhookSecret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET')
  const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
  const mode = Deno.env.get('MERCADO_PAGO_MODE')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!webhookSecret || !accessToken || !mode || !supabaseUrl || !serviceRoleKey) {
    console.error('Configuração do webhook Mercado Pago incompleta.')
    return jsonResponse({ error: 'Webhook não configurado.' }, 503)
  }
  if (!['test', 'production'].includes(mode)) {
    console.error('MERCADO_PAGO_MODE inválido para o webhook.')
    return jsonResponse({ error: 'Webhook não configurado corretamente.' }, 503)
  }

  const url = new URL(request.url)
  const notification = await request.json().catch(() => null) as MercadoPagoNotification | null
  const bodyDataId = asString(notification?.data?.id)
  const queryDataId = url.searchParams.get('data.id') || url.searchParams.get('data_id') || ''
  const legacyQueryId = url.searchParams.get('id') || ''
  const actionType = asString(notification?.action).split('.')[0]
  const topic = (
    url.searchParams.get('type')
    || url.searchParams.get('topic')
    || asString(notification?.type)
    || asString(notification?.topic)
    || actionType
  ).toLowerCase()

  if (topic !== 'payment') {
    console.info('Notificação Mercado Pago ignorada por tipo não suportado.', { topic: topic || 'ausente' })
    return jsonResponse({ received: true })
  }

  if (queryDataId && bodyDataId && queryDataId !== bodyDataId) {
    console.warn('Notificação Mercado Pago ignorada: ID do pagamento diverge entre URL e corpo.')
    return jsonResponse({ received: true })
  }

  const paymentId = queryDataId || legacyQueryId || bodyDataId
  if (!paymentId || !/^\d+$/.test(paymentId)) {
    console.warn('Notificação Mercado Pago ignorada: ID do pagamento ausente ou inválido.')
    return jsonResponse({ error: 'Identificador de pagamento inválido.' }, 400)
  }
  try {
    const signatureDataId = queryDataId || legacyQueryId || bodyDataId
    if (!await isValidSignature(request, signatureDataId, webhookSecret)) {
      console.warn('Notificação Mercado Pago rejeitada: assinatura HMAC inválida.')
      return jsonResponse({ error: 'Assinatura do webhook inválida.' }, 401)
    }
  } catch (error) {
    console.error('Falha ao validar a assinatura do webhook:', error)
    return jsonResponse({ error: 'Não foi possível validar a assinatura do webhook.' }, 500)
  }

  let paymentResponse: Response
  try {
    paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch (error) {
    console.error('Falha ao consultar o pagamento no Mercado Pago:', error)
    return jsonResponse({ error: 'Não foi possível consultar o pagamento.' }, 502)
  }
  if (!paymentResponse.ok) {
    console.error('Mercado Pago recusou a consulta de pagamento:', paymentResponse.status)
    return jsonResponse({ error: 'Não foi possível confirmar o pagamento no Mercado Pago.' }, 502)
  }

  const payment = await paymentResponse.json()
  const expectedLiveMode = mode === 'production'
  if (String(payment.id) !== paymentId
    || typeof payment.external_reference !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payment.external_reference)
    || payment.status !== 'approved'
    || typeof payment.live_mode !== 'boolean'
    || payment.live_mode !== expectedLiveMode
    || payment.currency_id !== 'BRL'
    || Math.round(Number(payment.transaction_amount) * 100) !== 490) {
    console.warn('Notificação Mercado Pago ignorada: pagamento não aprovado ou dados não correspondem.', {
      approved: payment.status === 'approved',
      expectedLiveMode,
      actualLiveMode: payment.live_mode,
      currencyMatches: payment.currency_id === 'BRL',
      amountMatches: Number(payment.transaction_amount) === 4.9,
      hasExternalReference: typeof payment.external_reference === 'string',
    })
    return jsonResponse({ received: true })
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: transaction, error: transactionError } = await serviceClient
    .from('billing_transactions')
    .select('id, amount_cents, currency, status, payment_method, metadata, transaction_type')
    .eq('id', payment.external_reference)
    .maybeSingle()
  if (transactionError) {
    console.error('Falha ao localizar a transação do webhook:', transactionError)
    return jsonResponse({ error: 'Não foi possível localizar a cobrança.' }, 500)
  }
  if (!transaction
    || transaction.amount_cents !== 490
    || transaction.currency !== 'BRL'
    || !['individual_listing', 'individual_reactivation'].includes(transaction.transaction_type)) {
    console.warn('Notificação Mercado Pago ignorada: transação local ausente ou incompatível.')
    return jsonResponse({ received: true })
  }

  const metadata = transaction.metadata && typeof transaction.metadata === 'object'
    ? transaction.metadata as Record<string, unknown>
    : {}
  if (typeof metadata.provider_preference_id !== 'string'
    || metadata.provider_preference_id !== payment.preference_id) {
    console.warn('Notificação Mercado Pago ignorada: preferência não corresponde à transação local.')
    return jsonResponse({ received: true })
  }

  const actualPaymentMethod = payment.payment_method_id === 'pix'
    ? 'pix'
    : payment.payment_type_id === 'credit_card'
      ? 'credit_card'
      : null
  const expectedPaymentMethod = transaction.payment_method || metadata.requested_payment_method
  if (!actualPaymentMethod || expectedPaymentMethod !== actualPaymentMethod) {
    console.warn('Notificação Mercado Pago ignorada: meio de pagamento não corresponde à cobrança local.', {
      providerPaymentMethod: payment.payment_method_id,
      providerPaymentType: payment.payment_type_id,
      expectedMethod: expectedPaymentMethod,
    })
    return jsonResponse({ received: true })
  }

  const expectedCollectorId = Deno.env.get('MERCADO_PAGO_COLLECTOR_ID')?.trim()
  if (expectedCollectorId && String(payment.collector_id) !== expectedCollectorId) {
    console.error('Notificação Mercado Pago ignorada: collector_id não corresponde ao configurado.')
    return jsonResponse({ received: true })
  }

  const { error: confirmationError } = await serviceClient.rpc('confirm_listing_billing_transaction', {
    target_transaction_id: transaction.id,
    external_payment_id: String(payment.id),
    selected_payment_method: actualPaymentMethod,
  })
  if (confirmationError) {
    console.error('Falha ao confirmar a cobrança pelo webhook:', confirmationError)
    return jsonResponse({ error: 'Não foi possível registrar a confirmação do pagamento.' }, 500)
  }

  console.info('Cobrança individual confirmada pelo webhook.', {
    transactionType: transaction.transaction_type,
    paymentMethod: actualPaymentMethod,
  })
  return jsonResponse({ received: true })
})
