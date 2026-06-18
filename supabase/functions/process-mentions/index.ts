import { createClient } from 'npm:@supabase/supabase-js@2'

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
    await Promise.all(
      (validUsers ?? []).map(async (u) => {
        if (!u.email) return
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
          else console.error('mention email failed', u.email, error)
        } catch (e) {
          console.error('mention email exception', u.email, e)
        }
      }),
    )

    return new Response(JSON.stringify({ inserted, emailed, mentioned: mentionedIds.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('process-mentions error', e)
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})