import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.23.8'

const BodySchema = z.object({
  partner_id: z.string().uuid(),
  actie: z.enum(['blokkeren', 'deblokkeren']),
  reden: z.string().trim().min(5).max(500),
  betaal_url: z.string().trim().url().max(2000).nullable().optional(),
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const auth = req.headers.get('Authorization')
    if (!auth) return json({ error: { code: 'unauthorized', message: 'Niet ingelogd' } }, 401)

    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: auth } } })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) {
      return json({ error: { code: 'unauthorized', message: 'Niet ingelogd' } }, 401)
    }

    const admin = createClient(url, serviceKey)
    const actorId = userData.user.id

    // Rollen zijn additief: primaire rol op users.rol, extra rollen in user_roles.
    const [{ data: rollen }, { data: profiel }] = await Promise.all([
      admin.from('user_roles').select('rol').eq('user_id', actorId),
      admin.from('users').select('rol').eq('id', actorId).maybeSingle(),
    ])
    const rolSet = new Set((rollen ?? []).map((r: { rol: string }) => r.rol))
    if (profiel?.rol) rolSet.add(profiel.rol as string)
    if (!rolSet.has('superadmin')) {
      return json({ error: { code: 'forbidden', message: 'Geen rechten' } }, 403)
    }

    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return json({
        error: { code: 'validatie', message: 'Controleer de ingevulde gegevens' },
        velden: parsed.error.flatten().fieldErrors,
      }, 400)
    }
    const { partner_id, actie, reden } = parsed.data
    const blokkeren = actie === 'blokkeren'

    const { error: updErr } = await admin
      .from('partners')
      .update({
        status: blokkeren ? 'geblokkeerd' : 'actief',
        geblokkeerd_op: blokkeren ? new Date().toISOString() : null,
        geblokkeerd_reden: blokkeren ? reden : null,
        geblokkeerd_door_id: blokkeren ? actorId : null,
      })
      .eq('id', partner_id)
    if (updErr) throw updErr

    const { error: logErr } = await admin.from('partner_blokkades').insert({
      partner_id, actie, reden, uitgevoerd_door_id: actorId,
    })
    if (logErr) throw logErr

    return json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Onbekende fout'
    return json({ error: { code: 'server', message } }, 500)
  }
})
