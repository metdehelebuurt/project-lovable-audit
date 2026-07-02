import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'https://esm.sh/zod@3.23.8'

const BodySchema = z.object({ afspraakId: z.string().uuid() })

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

    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) return json({ error: 'afspraakId is required (uuid)' }, 400)
    const { afspraakId } = parsed.data

    const admin = createClient(url, serviceKey)

    const { data: afspraak, error: afsErr } = await admin
      .from('affiliate_terugbel_afspraken')
      .select('id, type, geplande_op, notitie, lead_id, collega_user_id, affiliate_id, afgehandeld_op, reminder_24u_op')
      .eq('id', afspraakId)
      .maybeSingle()
    if (afsErr || !afspraak) return json({ error: 'Afspraak niet gevonden' }, 404)

    // Autorisatie: sales_manager / superadmin OR eigenaar/collega
    const uid = userData.user.id
    const isBetrokken = afspraak.affiliate_id === uid || afspraak.collega_user_id === uid
    if (!isBetrokken) {
      const { data: rollen } = await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', uid)
      const rolSet = new Set((rollen ?? []).map((r: { role: string }) => r.role))
      const magBeheren = rolSet.has('superadmin') || rolSet.has('sales_manager') || rolSet.has('sales_admin')
      if (!magBeheren) return json({ error: 'Forbidden' }, 403)
    }

    if (afspraak.afgehandeld_op) return json({ error: 'Afspraak is al afgehandeld' }, 400)
    const geplandOp = new Date(afspraak.geplande_op)
    if (Number.isNaN(geplandOp.getTime())) return json({ error: 'Ongeldige geplande datum' }, 400)
    if (geplandOp.getTime() < Date.now() - 60 * 60 * 1000) {
      return json({ error: 'Demo ligt in het verleden' }, 400)
    }

    const { data: lead } = await admin
      .from('affiliate_leads')
      .select('contactpersoon, bedrijfsnaam, email, telefoon')
      .eq('id', afspraak.lead_id)
      .maybeSingle()

    const klantEmail = (lead?.email ?? '').trim() || null
    if (!klantEmail) return json({ error: 'Klant heeft geen e-mailadres' }, 400)

    const [{ data: collega }, { data: affiliate }] = await Promise.all([
      afspraak.collega_user_id
        ? admin.from('users').select('voornaam, achternaam, email').eq('id', afspraak.collega_user_id).maybeSingle()
        : Promise.resolve({ data: null as null | { voornaam: string | null; achternaam: string | null; email: string | null } }),
      admin.from('users').select('voornaam, achternaam, email').eq('id', afspraak.affiliate_id).maybeSingle(),
    ])

    const collegaNaam = collega ? `${collega.voornaam ?? ''} ${collega.achternaam ?? ''}`.trim() : undefined
    const affiliateNaam = affiliate ? `${affiliate.voornaam ?? ''} ${affiliate.achternaam ?? ''}`.trim() : undefined
    const klantNaam = lead?.contactpersoon || lead?.bedrijfsnaam || undefined

    const stamp = new Date().toISOString().slice(0, 10)
    const { error: mailErr } = await admin.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'affiliate-afspraak-klant',
        recipientEmail: klantEmail,
        idempotencyKey: `affiliate-demo-reminder-${afspraak.id}-${stamp}`,
        templateData: {
          klantNaam,
          type: afspraak.type,
          gepland: afspraak.geplande_op,
          collegaNaam: collegaNaam || affiliateNaam,
          collegaEmail: collega?.email ?? affiliate?.email ?? undefined,
          notitie: afspraak.notitie ?? undefined,
          isReminder: true,
        },
      },
    })
    if (mailErr) throw mailErr

    await admin
      .from('affiliate_terugbel_afspraken')
      .update({ reminder_24u_op: new Date().toISOString() })
      .eq('id', afspraak.id)

    return json({ ok: true, klantEmail })
  } catch (e) {
    console.error('affiliate-afspraak-reminder', e)
    return json({ error: (e as Error).message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}