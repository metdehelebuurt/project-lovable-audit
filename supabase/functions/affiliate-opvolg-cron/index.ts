import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(url, serviceKey)

    const nu = new Date()
    const over24u = new Date(nu.getTime() + 86400000).toISOString()
    const min24u = new Date(nu.getTime() - 86400000).toISOString()

    // 1. Herinneringen voor taken binnen 24u, nog niet gestuurd
    const { data: aankomend } = await admin
      .from('affiliate_opvolg_taken')
      .select('id, affiliate_id, lead_id, titel, notitie, due_op, type, prioriteit')
      .is('voltooid_op', null)
      .is('herinnering_verstuurd_op', null)
      .lte('due_op', over24u)
      .gte('due_op', nu.toISOString())
      .limit(50)

    for (const t of aankomend ?? []) {
      await notifyEnMail(admin, t, 'affiliate-opvolg-herinnering', 'Herinnering: ' + t.titel, false)
      await admin.from('affiliate_opvolg_taken').update({ herinnering_verstuurd_op: nu.toISOString() }).eq('id', t.id)
    }

    // 2. Escalatie voor taken die overdue zijn (>24u)
    const { data: overdue } = await admin
      .from('affiliate_opvolg_taken')
      .select('id, affiliate_id, lead_id, titel, notitie, due_op, type, prioriteit')
      .is('voltooid_op', null)
      .is('escalatie_verstuurd_op', null)
      .lte('due_op', min24u)
      .limit(50)

    for (const t of overdue ?? []) {
      await notifyEnMail(admin, t, 'affiliate-opvolg-escalatie', 'Achterstallig: ' + t.titel, true)
      await admin.from('affiliate_opvolg_taken').update({ escalatie_verstuurd_op: nu.toISOString() }).eq('id', t.id)
    }

    // 3. Trial-opvolging (T-7, T-3, T-1)
    const { data: referrals } = await admin
      .from('affiliate_referrals')
      .select('id, affiliate_id, trial_laatste_herinnering_op, partners:partner_id(id, naam, email, trial_einddatum)')
      .limit(200)

    for (const r of referrals ?? []) {
      const p = (r as any).partners
      if (!p?.trial_einddatum) continue
      const eind = new Date(p.trial_einddatum)
      const dagen = Math.ceil((eind.getTime() - nu.getTime()) / 86400000)
      if (![7,3,1,0].includes(dagen)) continue
      const laatste = r.trial_laatste_herinnering_op ? new Date(r.trial_laatste_herinnering_op) : null
      if (laatste && (nu.getTime() - laatste.getTime()) < 23 * 3600 * 1000) continue

      const { data: aff } = await admin.from('users').select('email, voornaam').eq('id', r.affiliate_id).maybeSingle()
      if (aff?.email) {
        await admin.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'affiliate-trial-opvolging',
            recipientEmail: aff.email,
            idempotencyKey: `aff-trial-${r.id}-${dagen}`,
            templateData: { affiliateNaam: aff.voornaam, klantNaam: p.naam, dagen, einddatum: p.trial_einddatum },
          },
        }).catch((e) => console.error('trial-mail', e))
      }
      await admin.from('notificaties').insert({
        user_id: r.affiliate_id,
        type: 'affiliate_opvolging',
        titel: `Trial ${p.naam} loopt over ${dagen} dagen af`,
        bericht: 'Plan een check-in om de trial om te zetten.',
        entity_type: 'affiliate_referral',
        entity_id: r.id,
      })
      await admin.from('affiliate_referrals').update({ trial_laatste_herinnering_op: nu.toISOString() }).eq('id', r.id)
    }

    return new Response(JSON.stringify({ ok: true, herinnering: aankomend?.length ?? 0, escalatie: overdue?.length ?? 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('affiliate-opvolg-cron', e)
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

async function notifyEnMail(admin: any, t: any, templateName: string, titel: string, escalatie: boolean) {
  const { data: aff } = await admin.from('users').select('email, voornaam').eq('id', t.affiliate_id).maybeSingle()
  const { data: lead } = t.lead_id
    ? await admin.from('affiliate_leads').select('bedrijfsnaam, contactpersoon, telefoon, email').eq('id', t.lead_id).maybeSingle()
    : { data: null }
  if (aff?.email) {
    await admin.functions.invoke('send-transactional-email', {
      body: {
        templateName,
        recipientEmail: aff.email,
        idempotencyKey: `${templateName}-${t.id}`,
        templateData: {
          affiliateNaam: aff.voornaam,
          titel: t.titel,
          notitie: t.notitie,
          due_op: t.due_op,
          type: t.type,
          prioriteit: t.prioriteit,
          klantNaam: lead?.contactpersoon || lead?.bedrijfsnaam,
          klantTelefoon: lead?.telefoon,
          klantEmail: lead?.email,
        },
      },
    }).catch((e: unknown) => console.error('opvolg-mail', e))
  }
  await admin.from('notificaties').insert({
    user_id: t.affiliate_id,
    type: 'affiliate_opvolging',
    titel,
    bericht: t.notitie ?? '',
    entity_type: 'affiliate_opvolg_taak',
    entity_id: t.id,
  })
}