import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendPartnerEmail, PartnerEmailError } from '../_shared/partner-email-send.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SITE_URL = 'https://app.mijnhuis.nu'
const MENTION_RE = /@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)/g

type ResourceType = 'lead' | 'klant' | 'offerte' | 'installatie' | 'schouw'

interface Payload {
  noteId?: string
  inhoud: string
  resourceType: ResourceType
  resourceId: string
  resourceTitel?: string
  partnerId: string
  senderId: string
}

const RESOURCE_LABEL: Record<ResourceType, string> = {
  lead: 'Lead',
  klant: 'Klant',
  offerte: 'Offerte',
  installatie: 'Installatie',
  schouw: 'Schouw',
}

const RESOURCE_PATH: Record<ResourceType, string> = {
  lead: 'leads',
  klant: 'klanten',
  offerte: 'offertes',
  installatie: 'installaties',
  schouw: 'schouwen',
}

const ENTITY_TYPE: Record<ResourceType, string> = {
  lead: 'leads',
  klant: 'klanten',
  offerte: 'offertes',
  installatie: 'installaties',
  schouw: 'schouwen',
}

function extractIds(inhoud: string): string[] {
  const ids = new Set<string>()
  for (const m of inhoud.matchAll(MENTION_RE)) ids.add(m[2])
  return [...ids]
}

function plainSnippet(inhoud: string, max = 200): string {
  const stripped = inhoud.replace(MENTION_RE, '@$1').replace(/\s+/g, ' ').trim()
  return stripped.length > max ? `${stripped.slice(0, max)}…` : stripped
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function renderMentionHtml(opts: {
  ontvangerNaam?: string
  senderNaam: string
  resourceLabel: string
  resourceTitel?: string
  snippet: string
  url: string
  siteName: string
}): string {
  const greet = opts.ontvangerNaam ? `Hoi ${escapeHtml(opts.ontvangerNaam)},` : 'Hoi,'
  const context = `${escapeHtml(opts.senderNaam)} heeft je genoemd in een notitie${
    opts.resourceLabel ? ` bij ${escapeHtml(opts.resourceLabel.toLowerCase())}` : ''
  }${opts.resourceTitel ? ` "${escapeHtml(opts.resourceTitel)}"` : ''} op ${escapeHtml(opts.siteName)}.`
  const snippetBlock = opts.snippet
    ? `<div style="background:#f1f5f9;padding:16px 20px;border-radius:12px;margin:8px 0 16px;">
         <p style="font-size:14px;color:#222;white-space:pre-wrap;margin:0;">${escapeHtml(opts.snippet)}</p>
       </div>`
    : ''
  return `<!doctype html><html lang="nl"><body style="background:#ffffff;font-family:Inter,Arial,sans-serif;margin:0;">
    <div style="max-width:600px;padding:24px;margin:0 auto;">
      <h1 style="font-size:22px;font-weight:bold;color:#0f172a;margin:0 0 16px;">Je bent getagd in een notitie</h1>
      <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 12px;">${greet} ${context}</p>
      ${snippetBlock}
      <div style="text-align:center;margin:24px 0;">
        <a href="${escapeHtml(opts.url)}" style="background:hsl(242,67%,62%);color:#ffffff;font-size:14px;font-weight:bold;border-radius:12px;padding:12px 22px;text-decoration:none;display:inline-block;">Bekijk in het platform</a>
      </div>
      <p style="font-size:12px;color:#888;margin:24px 0 0;line-height:1.5;">Je ontvangt deze e-mail omdat een collega je tagde in een notitie op ${escapeHtml(opts.siteName)}.</p>
    </div>
  </body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  try {
    const body = (await req.json()) as Payload
    if (!body?.inhoud || !body?.resourceType || !body?.resourceId || !body?.partnerId || !body?.senderId) {
      return new Response(JSON.stringify({ error: 'Ontbrekende velden' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const mentionedIds = extractIds(body.inhoud).filter((id) => id !== body.senderId)
    if (mentionedIds.length === 0) {
      return new Response(JSON.stringify({ inserted: 0, emailed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verifieer dat alle mentioned users binnen dezelfde partner zitten (multi-tenancy guard)
    const { data: validUsers, error: usersErr } = await supabase
      .from('users')
      .select('id, voornaam, achternaam, email, status, partner_id')
      .in('id', mentionedIds)
      .eq('partner_id', body.partnerId)
      .eq('status', 'actief')
    if (usersErr) throw usersErr

    const { data: sender } = await supabase
      .from('users')
      .select('voornaam, achternaam')
      .eq('id', body.senderId)
      .maybeSingle()

    const senderNaam = sender ? `${sender.voornaam ?? ''} ${sender.achternaam ?? ''}`.trim() : 'Een collega'
    const label = RESOURCE_LABEL[body.resourceType]
    const url = `${SITE_URL}/${RESOURCE_PATH[body.resourceType]}/${body.resourceId}`
    const snippet = plainSnippet(body.inhoud)
    const titelDisplay = body.resourceTitel ?? ''

    // In-app notificaties bulk insert
    const rows = (validUsers ?? []).map((u) => ({
      user_id: u.id,
      type: 'mention',
      titel: `${senderNaam} tagde je in een notitie`,
      bericht: titelDisplay ? `${label}: ${titelDisplay} — ${snippet}` : snippet,
      entity_type: ENTITY_TYPE[body.resourceType],
      entity_id: body.resourceId,
    }))
    let inserted = 0
    if (rows.length > 0) {
      const { error: insErr, count } = await supabase
        .from('notificaties')
        .insert(rows, { count: 'exact' })
      if (insErr) console.error('notificaties insert failed', insErr)
      else inserted = count ?? rows.length
    }

    // E-mails versturen (in parallel, niet-fataal bij individuele fouten)
    let emailed = 0
    let viaPartner = 0
    await Promise.all(
      (validUsers ?? []).map(async (u) => {
        if (!u.email) return
        const subject = `${senderNaam} tagde je in een notitie${titelDisplay ? ` — ${titelDisplay}` : ''}`
        const html = renderMentionHtml({
          ontvangerNaam: u.voornaam ?? '',
          senderNaam,
          resourceLabel: label,
          resourceTitel: titelDisplay,
          snippet,
          url,
          siteName: 'Mijnhuis.nu',
        })

        // 1) Eerst proberen via de partner-eigen mailaccount (Gmail / MS / SMTP).
        //    Dat gebruikt de door de klant geconfigureerde afzender (bv. info@smartaccu.nl),
        //    waardoor geen apart geverifieerd notify-domein nodig is.
        try {
          await sendPartnerEmail({
            adminClient: supabase,
            partnerId: body.partnerId,
            to: u.email,
            subject,
            html,
            type: 'notificatie',
            documentType: 'notificatie',
            verzondenDoorId: body.senderId,
          })
          emailed += 1
          viaPartner += 1
          return
        } catch (partnerErr) {
          if (!(partnerErr instanceof PartnerEmailError)) {
            console.error('partner mention email exception', u.email, partnerErr)
          } else {
            console.warn('partner mention email niet mogelijk, fallback naar systeem:', partnerErr.message)
          }
        }

        // 2) Fallback: systeem-transactional (kan falen bij niet-geverifieerd domein).
        try {
          const { error } = await supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'notitie-mention',
              recipientEmail: u.email,
              idempotencyKey: `mention-${body.noteId ?? body.resourceId}-${u.id}`,
              templateData: {
                ontvangerNaam: u.voornaam ?? '',
                senderNaam,
                resourceLabel: label,
                resourceTitel: titelDisplay,
                snippet,
                url,
              },
            },
          })
          if (!error) emailed += 1
          else console.error('mention email fallback failed', u.email, error)
        } catch (e) {
          console.error('mention email fallback exception', u.email, e)
        }
      }),
    )

    return new Response(JSON.stringify({ inserted, emailed, viaPartner, mentioned: mentionedIds.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('process-mentions error', e)
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})