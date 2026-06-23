import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

interface Body {
  afspraakId: string;
  klantBevestiging?: boolean;
  klantEmail?: string | null;
}

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

    const body = (await req.json()) as Body
    if (!body?.afspraakId) return json({ error: 'afspraakId is required' }, 400)
    const stuurNaarKlant = body.klantBevestiging !== false
    const klantEmailOverride = (body.klantEmail ?? '').trim() || null

    const admin = createClient(url, serviceKey)

    const { data: afspraak, error: afsErr } = await admin
      .from('affiliate_terugbel_afspraken')
      .select('id, type, geplande_op, notitie, lead_id, collega_user_id, affiliate_id')
      .eq('id', body.afspraakId)
      .maybeSingle()
    if (afsErr || !afspraak) return json({ error: 'Afspraak niet gevonden' }, 404)
    if (afspraak.affiliate_id !== userData.user.id) return json({ error: 'Forbidden' }, 403)

    const { data: lead } = await admin
      .from('affiliate_leads')
      .select('contactpersoon, bedrijfsnaam, email, telefoon')
      .eq('id', afspraak.lead_id)
      .maybeSingle()

    const [{ data: collega }, { data: affiliate }] = await Promise.all([
      afspraak.collega_user_id
        ? admin.from('users').select('voornaam, achternaam, email').eq('id', afspraak.collega_user_id).maybeSingle()
        : Promise.resolve({ data: null }),
      admin.from('users').select('voornaam, achternaam, email').eq('id', afspraak.affiliate_id).maybeSingle(),
    ])

    const collegaNaam = collega ? `${collega.voornaam ?? ''} ${collega.achternaam ?? ''}`.trim() : undefined
    const affiliateNaam = affiliate ? `${affiliate.voornaam ?? ''} ${affiliate.achternaam ?? ''}`.trim() : undefined
    const klantNaam = lead?.contactpersoon || lead?.bedrijfsnaam || undefined

    const sends: Array<Promise<unknown>> = []
    const results = { klant: false, collega: false }

    const klantEmail = klantEmailOverride ?? lead?.email ?? null
    if (stuurNaarKlant && klantEmail) {
      sends.push(
        admin.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'affiliate-afspraak-klant',
            recipientEmail: klantEmail,
            idempotencyKey: `affiliate-afspraak-klant-${afspraak.id}`,
            templateData: {
              klantNaam,
              type: afspraak.type,
              gepland: afspraak.geplande_op,
              collegaNaam,
              collegaEmail: collega?.email,
              notitie: afspraak.notitie ?? undefined,
            },
          },
        }).then(() => { results.klant = true }).catch((e) => console.error('klant mail', e))
      )
    }

    if (collega?.email) {
      sends.push(
        admin.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'affiliate-afspraak-collega',
            recipientEmail: collega.email,
            idempotencyKey: `affiliate-afspraak-collega-${afspraak.id}`,
            templateData: {
              collegaNaam,
              klantNaam,
              klantEmail: lead?.email ?? undefined,
              klantTelefoon: lead?.telefoon ?? undefined,
              bedrijfsnaam: lead?.bedrijfsnaam ?? undefined,
              type: afspraak.type,
              gepland: afspraak.geplande_op,
              notitie: afspraak.notitie ?? undefined,
              affiliateNaam,
            },
          },
        }).then(() => { results.collega = true }).catch((e) => console.error('collega mail', e))
      )
    }

    await Promise.all(sends)

    return json({ ok: true, sent: results })
  } catch (e) {
    console.error('affiliate-afspraak-notify', e)
    return json({ error: (e as Error).message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}