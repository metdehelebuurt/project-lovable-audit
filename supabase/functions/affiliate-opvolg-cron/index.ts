import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' }

const TYPE_NAAR_REGEL: Record<string, string> = {
  demo: 'demo',
  trial_check: 'trial',
  bel: 'terugbel',
  whatsapp: 'terugbel',
  mail: 'algemeen',
  anders: 'algemeen',
}

interface Regel {
  actief: boolean
  aantal_herinneringen: number
  herinnering_termijnen_uren: number[]
  escalatie_na_uren: number
  escalatie_toegestaan: boolean
}

const DEFAULT_REGEL: Regel = {
  actief: true,
  aantal_herinneringen: 1,
  herinnering_termijnen_uren: [24],
  escalatie_na_uren: 24,
  escalatie_toegestaan: true,
}

async function regelFor(admin: any, cache: Map<string, Regel>, affiliateId: string, taakType: string): Promise<Regel> {
  const leadType = TYPE_NAAR_REGEL[taakType] ?? 'algemeen'
  const key = `${affiliateId}:${leadType}`
  if (cache.has(key)) return cache.get(key)!
  const { data } = await admin
    .from('affiliate_opvolg_regels')
    .select('actief, aantal_herinneringen, herinnering_termijnen_uren, escalatie_na_uren, escalatie_toegestaan')
    .eq('affiliate_id', affiliateId)
    .eq('lead_type', leadType)
    .maybeSingle()
  const regel: Regel = data ?? DEFAULT_REGEL
  cache.set(key, regel)
  return regel
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(url, serviceKey)

    const nu = new Date()
    const regelCache = new Map<string, Regel>()
    let herinneringCount = 0
    let escalatieCount = 0

    // 1. Herinneringen — voor open taken in de toekomst, nog niet gestuurd
    const { data: aankomend } = await admin
      .from('affiliate_opvolg_taken')
      .select('id, affiliate_id, lead_id, titel, notitie, due_op, type, prioriteit')
      .is('voltooid_op', null)
      .is('herinnering_verstuurd_op', null)
      .gte('due_op', nu.toISOString())
      .limit(200)

    for (const t of aankomend ?? []) {
      const regel = await regelFor(admin, regelCache, t.affiliate_id, t.type)
      if (!regel.actief || regel.aantal_herinneringen <= 0) continue
      const eersteUren = regel.herinnering_termijnen_uren[0] ?? 24
      const urenTotDue = (new Date(t.due_op).getTime() - nu.getTime()) / 3600000
      if (urenTotDue > eersteUren) continue
      await notifyEnMail(admin, t, 'affiliate-opvolg-herinnering', 'Herinnering: ' + t.titel, false, TYPE_NAAR_REGEL[t.type] ?? 'algemeen')
      await admin.from('affiliate_opvolg_taken').update({ herinnering_verstuurd_op: nu.toISOString() }).eq('id', t.id)
      herinneringCount++
    }

    // 2. Escalatie — voor overdue taken volgens de regel
    const { data: overdue } = await admin
      .from('affiliate_opvolg_taken')
      .select('id, affiliate_id, lead_id, titel, notitie, due_op, type, prioriteit')
      .is('voltooid_op', null)
      .is('escalatie_verstuurd_op', null)
      .lt('due_op', nu.toISOString())
      .limit(200)

    for (const t of overdue ?? []) {
      const regel = await regelFor(admin, regelCache, t.affiliate_id, t.type)
      if (!regel.actief || !regel.escalatie_toegestaan) continue
      const urenTeLaat = (nu.getTime() - new Date(t.due_op).getTime()) / 3600000
      if (urenTeLaat < regel.escalatie_na_uren) continue
      await notifyEnMail(admin, t, 'affiliate-opvolg-escalatie', 'Achterstallig: ' + t.titel, true, TYPE_NAAR_REGEL[t.type] ?? 'algemeen')
      await admin.from('affiliate_opvolg_taken').update({ escalatie_verstuurd_op: nu.toISOString() }).eq('id', t.id)
      escalatieCount++
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

    return new Response(JSON.stringify({ ok: true, herinnering: herinneringCount, escalatie: escalatieCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('affiliate-opvolg-cron', e)
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

async function notifyEnMail(admin: any, t: any, templateName: string, titel: string, escalatie: boolean, regelLeadType?: string) {
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
  if (t.lead_id) {
    await admin.from('affiliate_opvolg_log').insert({
      lead_id: t.lead_id,
      affiliate_id: t.affiliate_id,
      taak_id: t.id,
      actie: escalatie ? 'escalatie_verstuurd' : 'herinnering_verstuurd',
      bron: 'cron',
      titel,
      details: {
        template: templateName,
        type: t.type,
        due_op: t.due_op,
        regel_lead_type: regelLeadType,
      },
    })
  }
}