import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const jsonResponse = (body: Record<string, unknown>, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
)

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ error: 'Método não permitido.' }, 405)

  const authorization = request.headers.get('Authorization')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'A função administrativa não está configurada.' }, 500)
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: userData, error: authError } = await callerClient.auth.getUser()
  if (authError || !userData.user) return jsonResponse({ error: 'Sessão inválida. Entre novamente.' }, 401)

  const { data: isAdmin, error: permissionError } = await callerClient.rpc('is_admin')
  if (permissionError) return jsonResponse({ error: `Não foi possível verificar a permissão: ${permissionError.message}` }, 500)
  if (!isAdmin) return jsonResponse({ error: 'Acesso restrito a administradores.' }, 403)

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let body: { action?: string; targetUserId?: string }
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Corpo da solicitação inválido.' }, 400)
  }

  if (body.action === 'list-users') {
    const authUsers = []
    const perPage = 500
    for (let page = 1; ; page += 1) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
      if (error) return jsonResponse({ error: `Não foi possível listar usuários: ${error.message}` }, 500)
      authUsers.push(...data.users)
      if (data.users.length < perPage) break
    }

    const userIds = authUsers.map((user) => user.id)
    const profiles = []
    for (let offset = 0; offset < userIds.length; offset += 500) {
      const { data, error } = await adminClient
        .from('user_profiles')
        .select('user_id, tipo_usuario, nome_completo, nome_imobiliaria')
        .in('user_id', userIds.slice(offset, offset + 500))
      if (error) return jsonResponse({ error: `Não foi possível carregar perfis: ${error.message}` }, 500)
      profiles.push(...(data || []))
    }

    const { data: adminRows, error: adminsError } = await adminClient.from('admin_users').select('user_id')
    if (adminsError) return jsonResponse({ error: `Não foi possível carregar as permissões: ${adminsError.message}` }, 500)

    const profilesByUserId = new Map(profiles.map((profile) => [profile.user_id, profile]))
    const adminIds = new Set((adminRows || []).map((row) => row.user_id))
    const users = authUsers.map((user) => {
      const profile = profilesByUserId.get(user.id)
      const userType = profile?.tipo_usuario || user.user_metadata?.tipo_usuario || ''
      return {
        id: user.id,
        email: user.email || '',
        name: userType === 'imobiliaria'
          ? profile?.nome_imobiliaria || user.user_metadata?.nome_imobiliaria || user.user_metadata?.full_name || ''
          : profile?.nome_completo || user.user_metadata?.full_name || '',
        userType,
        createdAt: user.created_at,
        isAdmin: adminIds.has(user.id),
      }
    }).sort((first, second) => String(second.createdAt).localeCompare(String(first.createdAt)))

    return jsonResponse({ users })
  }

  if (!['promote-admin', 'remove-admin'].includes(body.action || '') || !body.targetUserId) {
    return jsonResponse({ error: 'Ação ou usuário inválido.' }, 400)
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.targetUserId)) {
    return jsonResponse({ error: 'Identificador de usuário inválido.' }, 400)
  }

  const { data: targetData, error: targetError } = await adminClient.auth.admin.getUserById(body.targetUserId)
  if (targetError || !targetData.user) return jsonResponse({ error: 'Usuário não encontrado.' }, 404)

  if (body.action === 'promote-admin') {
    const { error } = await adminClient.from('admin_users').upsert({ user_id: body.targetUserId }, { onConflict: 'user_id' })
    if (error) return jsonResponse({ error: `Não foi possível conceder acesso administrativo: ${error.message}` }, 500)
    return jsonResponse({ success: true })
  }

  if (body.targetUserId === userData.user.id) {
    return jsonResponse({ error: 'Não é possível remover sua própria permissão administrativa.' }, 400)
  }

  const { count, error: countError } = await adminClient
    .from('admin_users')
    .select('user_id', { count: 'exact', head: true })
  if (countError) return jsonResponse({ error: `Não foi possível validar administradores: ${countError.message}` }, 500)
  if ((count || 0) <= 1) return jsonResponse({ error: 'O último administrador não pode ser removido.' }, 409)

  const { error } = await adminClient.from('admin_users').delete().eq('user_id', body.targetUserId)
  if (error) return jsonResponse({ error: `Não foi possível remover a permissão administrativa: ${error.message}` }, 500)
  return jsonResponse({ success: true })
})
