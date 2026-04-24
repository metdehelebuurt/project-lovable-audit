import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.23.8'

const BodySchema = z.object({
  grant_id: z.string().uuid(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Niet ingelogd' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData.user) return json({ error: 'Ongeldige sessie' }, 401)
    const userId = userData.user.id

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: profile } = await admin.from('users').select('rol').eq('id', userId).single()
    if (!profile || profile.rol !== 'superadmin') {
      return json({ error: 'Alleen platformbeheerders mogen toegang intrekken' }, 403)
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return json({ error: 'Ongeldige invoer' }, 400)

    const { data: grant, error: fetchErr } = await admin
      .from('superadmin_access_grants')
      .select('id, superadmin_user_id, ingetrokken_op')
      .eq('id', parsed.data.grant_id)
      .single()
    if (fetchErr || !grant) return json({ error: 'Grant niet gevonden' }, 404)
    if (grant.superadmin_user_id !== userId) {
      return json({ error: 'U kunt alleen uw eigen toegang intrekken' }, 403)
    }
    if (grant.ingetrokken_op) return json({ error: 'Toegang al ingetrokken' }, 400)

    const { error: updErr } = await admin
      .from('superadmin_access_grants')
      .update({
        ingetrokken_op: new Date().toISOString(),
        ingetrokken_door: userId,
      })
      .eq('id', parsed.data.grant_id)
    if (updErr) return json({ error: updErr.message }, 400)

    return json({ ok: true }, 200)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Onbekende fout' }, 500)
  }
})

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}