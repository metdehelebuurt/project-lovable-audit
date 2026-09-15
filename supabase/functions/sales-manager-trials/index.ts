import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const auth = req.headers.get('Authorization')
    if (!auth) return json({ error: 'Unauthorized' }, 401)

    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: auth } } })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) return json({ error: 'Unauthorized' }, 401)

    const admin = createClient(url, serviceKey)

    // Rollen zijn additief: primaire rol staat op users.rol, extra rollen in user_roles.
    const [{ data: rollen }, { data: profiel }] = await Promise.all([
      admin.from('user_roles').select('rol').eq('user_id', userData.user.id),
      admin.from('users').select('rol').eq('id', userData.user.id).maybeSingle(),
    ])
    const rolSet = new Set((rollen ?? []).map((r: { rol: string }) => r.rol))
    if (profiel?.rol) rolSet.add(profiel.rol as string)
    const mag = rolSet.has('superadmin') || rolSet.has('sales_manager') || rolSet.has('sales_admin')
    if (!mag) return json({ error: 'Forbidden' }, 403)

    // Alle partners met een lopende of onlangs verlopen trial (t.b.v. reactivatie-sales).
    const vandaag = new Date(); vandaag.setHours(0, 0, 0, 0)
    const grens = new Date(vandaag.getTime() - 14 * 86400000).toISOString().slice(0, 10)

    const { data: partners, error: pErr } = await admin
      .from('partners')
      .select(`id, naam, email, telefoonnummer, contactpersoon_voornaam, contactpersoon_achternaam,
               contactpersoon_email, contactpersoon_telefoon, contactpersoon_functie,
               plaats, postcode, adres, website, kvk, status, trial_einddatum, trial_bron,
               trial_aangemaakt_op, created_at`)
      .not('trial_einddatum', 'is', null)
      .gte('trial_einddatum', grens)
      .order('trial_einddatum', { ascending: true })
    if (pErr) throw pErr

    const ids = (partners ?? []).map((p: { id: string }) => p.id)
    let referralsByPartner = new Map<string, {
      affiliate_id: string; commissie_percentage: number | null;
      voornaam: string | null; achternaam: string | null; email: string | null;
    }>()
    if (ids.length) {
      const { data: refs } = await admin
        .from('affiliate_referrals')
        .select('partner_id, affiliate_id, commissie_percentage, users:affiliate_id(voornaam, achternaam, email)')
        .in('partner_id', ids)
      for (const r of refs ?? []) {
        const u = (r as { users?: { voornaam: string | null; achternaam: string | null; email: string | null } }).users ?? null
        referralsByPartner.set((r as { partner_id: string }).partner_id, {
          affiliate_id: (r as { affiliate_id: string }).affiliate_id,
          commissie_percentage: (r as { commissie_percentage: number | null }).commissie_percentage,
          voornaam: u?.voornaam ?? null,
          achternaam: u?.achternaam ?? null,
          email: u?.email ?? null,
        })
      }
    }

    const trials = (partners ?? []).map((p) => ({
      ...p,
      affiliate: referralsByPartner.get(p.id) ?? null,
    }))

    return json({ trials })
  } catch (e) {
    console.error('sales-manager-trials', e)
    return json({ error: (e as Error).message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}