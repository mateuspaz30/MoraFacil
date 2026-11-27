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

  const timestampSeconds = Number(timestamp)
  if (!Number.isSafeInteger(timestampSeconds)
    || Math.abs(Date.now() / 1000 - timestampSeconds) > 5 * 60) return false

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  return crypto.subtle.verify('HMAC', key, signatureBytes, new TextEncoder().encode(manifest))
}

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

  const url = new URL(request.url)
  const topic = url.searchParams.get('type') || url.searchParams.get('topic')
  if (topic !== 'payment') return jsonResponse({ received: true })

  const paymentId = url.searchParams.get('data.id')
  if (!paymentId || !/^\d+$/.test(paymentId)) {
    return jsonResponse({ error: 'Identificador de pagamento inválido.' }, 400)
  }
  try {
    if (!await isValidSignature(request, paymentId, webhookSecret)) {
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
  if (typeof payment.external_reference !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payment.external_reference)
    || payment.status !== 'approved'
    || Boolean(payment.live_mode) !== expectedLiveMode
    || payment.currency_id !== 'BRL'
    || Number(payment.transaction_amount) !== 4.9) {
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
    return jsonResponse({ received: true })
  }

  const metadata = transaction.metadata && typeof transaction.metadata === 'object'
    ? transaction.metadata as Record<string, unknown>
    : {}
  if (metadata.provider_preference_id !== payment.preference_id) return jsonResponse({ received: true })

  const actualPaymentMethod = payment.payment_method_id === 'pix'
    ? 'pix'
    : payment.payment_type_id === 'credit_card'
      ? 'credit_card'
      : null
  if (!actualPaymentMethod || metadata.requested_payment_method !== actualPaymentMethod) {
    console.error('O meio de pagamento aprovado não corresponde à preferência registrada.')
    return jsonResponse({ received: true })
  }

  const expectedCollectorId = Deno.env.get('MERCADO_PAGO_COLLECTOR_ID')
  if (expectedCollectorId && String(payment.collector_id) !== expectedCollectorId) {
    console.error('O pagamento foi recebido por uma conta Mercado Pago diferente da configurada.')
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

  return jsonResponse({ received: true })
})
