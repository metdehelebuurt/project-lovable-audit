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

    // 4. Demo/terugbel reminders T-24u en T-1u (affiliate + klant)
    const reminderCounts = { r24: 0, r1: 0 }
    const toekomst24 = new Date(nu.getTime() + 25 * 3600 * 1000).toISOString()
    const { data: openAfspraken } = await admin
      .from('affiliate_terugbel_afspraken')
      .select('id, type, geplande_op, notitie, lead_id, collega_user_id, affiliate_id, reminder_24u_op, reminder_1u_op')
      .is('afgehandeld_op', null)
      .eq('noshow', false)
      .gte('geplande_op', nu.toISOString())
      .lte('geplande_op', toekomst24)
      .limit(200)

    for (const a of openAfspraken ?? []) {
      const urenTot = (new Date(a.geplande_op).getTime() - nu.getTime()) / 3600000
      const isDemo = (a as { type?: string }).type === 'demo'
      // T-24u (binnen [23, 25] uur) — alleen voor demo's
      if (isDemo && !a.reminder_24u_op && urenTot >= 23 && urenTot <= 25) {
        await sendAfspraakReminder(admin, a, '24u')
        await admin.from('affiliate_terugbel_afspraken').update({ reminder_24u_op: nu.toISOString() }).eq('id', a.id)
        reminderCounts.r24++
      }
      // T-1u (binnen [0.5, 1.5] uur) — demo + terugbel
      if (!a.reminder_1u_op && urenTot >= 0.5 && urenTot <= 1.5) {
        await sendAfspraakReminder(admin, a, '1u')
        await admin.from('affiliate_terugbel_afspraken').update({ reminder_1u_op: nu.toISOString() }).eq('id', a.id)
        reminderCounts.r1++
      }
    }

    // 5. No-show detectie — afspraken >30 min geleden, niet afgehandeld, nog niet gemeld
    const noshowCutoff = new Date(nu.getTime() - 30 * 60 * 1000).toISOString()
    const { data: missedAfspraken } = await admin
      .from('affiliate_terugbel_afspraken')
      .select('id, type, geplande_op, lead_id, affiliate_id, collega_user_id')
      .is('afgehandeld_op', null)
      .is('noshow_gemeld_op', null)
      .eq('noshow', false)
      .lt('geplande_op', noshowCutoff)
      .limit(200)
    let noshowCount = 0
    for (const a of missedAfspraken ?? []) {
      const ontvanger = a.collega_user_id || a.affiliate_id
      const { data: lead } = a.lead_id
        ? await admin.from('affiliate_leads').select('bedrijfsnaam, contactpersoon').eq('id', a.lead_id).maybeSingle()
        : { data: null }
      const klantNaam = lead?.contactpersoon || lead?.bedrijfsnaam || 'klant'
      await admin.from('notificaties').insert({
        user_id: ontvanger,
        type: 'affiliate_opvolging',
        titel: `Mogelijke no-show: ${a.type === 'demo' ? 'demo' : 'terugbel'} met ${klantNaam}`,
        bericht: 'De afspraak stond gepland maar is nog niet afgevinkt. Volg deze klant op.',
        entity_type: 'affiliate_terugbel_afspraak',
        entity_id: a.id,
      })
      await admin.from('affiliate_terugbel_afspraken').update({ noshow: true, noshow_gemeld_op: nu.toISOString() }).eq('id', a.id)
      if (a.lead_id) {
        await admin.from('affiliate_opvolg_log').insert({
          lead_id: a.lead_id,
          affiliate_id: a.affiliate_id,
          actie: 'noshow_gedetecteerd',
          bron: 'cron',
          titel: `No-show ${a.type}`,
          details: { afspraak_id: a.id, geplande_op: a.geplande_op },
        })
      }
      noshowCount++
    }

    // 6. Stale-lead detectie — leads >14 dagen geen contact, geen toekomstige actie, niet eindstaat
    const staleCutoff = new Date(nu.getTime() - 14 * 86400000).toISOString()
    const meldCutoff = new Date(nu.getTime() - 7 * 86400000).toISOString()
    const { data: staleLeads } = await admin
      .from('affiliate_leads')
      .select('id, affiliate_id, bedrijfsnaam, contactpersoon, laatste_contact_op, volgende_actie_datum, status, stale_gemeld_op')
      .not('status', 'in', '(gewonnen,verloren)')
      .or(`laatste_contact_op.lt.${staleCutoff},laatste_contact_op.is.null`)
      .or(`stale_gemeld_op.is.null,stale_gemeld_op.lt.${meldCutoff}`)
      .limit(300)
    let staleCount = 0
    for (const l of staleLeads ?? []) {
      if (l.volgende_actie_datum && new Date(l.volgende_actie_datum).getTime() > nu.getTime()) continue
      await admin.from('notificaties').insert({
        user_id: l.affiliate_id,
        type: 'affiliate_opvolging',
        titel: `Stille lead: ${l.contactpersoon || l.bedrijfsnaam || 'onbekend'}`,
        bericht: 'Deze lead staat >14 dagen stil. Plan een actie of zet hem op verloren.',
        entity_type: 'affiliate_lead',
        entity_id: l.id,
      })
      await admin.from('affiliate_leads').update({ stale_gemeld_op: nu.toISOString() }).eq('id', l.id)
      staleCount++
    }

    return new Response(JSON.stringify({
      ok: true,
      herinnering: herinneringCount,
      escalatie: escalatieCount,
      reminder24u: reminderCounts.r24,
      reminder1u: reminderCounts.r1,
      noshow: noshowCount,
      stale: staleCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('affiliate-opvolg-cron', e)
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

async function sendAfspraakReminder(admin: any, a: any, fase: '24u' | '1u') {
  const { data: lead } = a.lead_id
    ? await admin.from('affiliate_leads').select('bedrijfsnaam, contactpersoon, email, telefoon').eq('id', a.lead_id).maybeSingle()
    : { data: null }
  const ontvangerId = a.collega_user_id || a.affiliate_id
  const { data: ontvanger } = await admin.from('users').select('email, voornaam, achternaam').eq('id', ontvangerId).maybeSingle()
  const klantNaam = lead?.contactpersoon || lead?.bedrijfsnaam || undefined
  const titel = `${fase === '24u' ? 'Morgen' : 'Over 1 uur'}: ${a.type === 'demo' ? 'demo' : 'terugbel'}${klantNaam ? ' met ' + klantNaam : ''}`
  // In-app notificatie naar eigenaar van de afspraak
  await admin.from('notificaties').insert({
    user_id: ontvangerId,
    type: 'affiliate_opvolging',
    titel,
    bericht: a.notitie ?? '',
    entity_type: 'affiliate_terugbel_afspraak',
    entity_id: a.id,
  })
  // Mail naar eigenaar
  if (ontvanger?.email) {
    await admin.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'affiliate-opvolg-herinnering',
        recipientEmail: ontvanger.email,
        idempotencyKey: `affiliate-afspraak-reminder-${a.id}-${fase}`,
        templateData: {
          affiliateNaam: ontvanger.voornaam,
          titel,
          notitie: a.notitie ?? undefined,
          due_op: a.geplande_op,
          type: a.type,
          prioriteit: 'normaal',
          klantNaam,
          klantTelefoon: lead?.telefoon ?? undefined,
          klantEmail: lead?.email ?? undefined,
        },
      },
    }).catch((e: unknown) => console.error('afspraak-reminder eigenaar', e))
  }
  // Mail naar klant — alleen bij demo's en alleen op T-24u (T-1u is intern)
  if (fase === '24u' && a.type === 'demo' && lead?.email) {
    await admin.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'affiliate-afspraak-klant',
        recipientEmail: lead.email,
        idempotencyKey: `affiliate-afspraak-klant-reminder-${a.id}-${fase}`,
        templateData: {
          klantNaam,
          type: a.type,
          gepland: a.geplande_op,
          notitie: a.notitie ?? undefined,
        },
      },
    }).catch((e: unknown) => console.error('afspraak-reminder klant', e))
  }
}

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