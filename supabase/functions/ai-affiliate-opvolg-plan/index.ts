import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

interface Body { leadId: string; context?: string; commit?: boolean }

const TYPES = ['bel','mail','demo','trial_check','whatsapp','anders'] as const

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const auth = req.headers.get('Authorization')
    if (!auth) return json({ error: 'Unauthorized' }, 401)

    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const lovableKey = Deno.env.get('LOVABLE_API_KEY')!

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: auth } } })
    const { data: userData } = await userClient.auth.getUser()
    if (!userData?.user) return json({ error: 'Unauthorized' }, 401)

    const { leadId, context, commit } = (await req.json()) as Body
    if (!leadId) return json({ error: 'leadId required' }, 400)

    const admin = createClient(url, serviceKey)
    const { data: lead } = await admin.from('affiliate_leads').select('*').eq('id', leadId).maybeSingle()
    if (!lead) return json({ error: 'Lead niet gevonden' }, 404)

    const prompt = `Plan 3 concrete vervolgacties voor deze lead. Antwoord ALLEEN met JSON: { taken: [{ titel: string (max 80 tekens NL), notitie: string (1-2 zinnen NL), type: 'bel'|'mail'|'demo'|'trial_check'|'whatsapp'|'anders', offset_dagen: int (0-21), prioriteit: 'laag'|'normaal'|'hoog' }] }.

LEAD: ${lead.bedrijfsnaam ?? ''} (${lead.contactpersoon ?? '-'}) status=${lead.status} branche=${lead.branche ?? '-'} bron=${lead.bron ?? '-'}
Notities: ${lead.notities ?? '-'}
AI-score: ${lead.ai_score ?? '-'} (${lead.ai_score_reden ?? '-'})
Extra context: ${context ?? '-'}`

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': lovableKey },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    })
    if (aiRes.status === 429) return json({ error: 'rate_limited' }, 429)
    if (aiRes.status === 402) return json({ error: 'credits_exhausted' }, 402)
    if (!aiRes.ok) return json({ error: `AI fout ${aiRes.status}` }, 500)

    const aiData = await aiRes.json()
    let parsed: any = {}
    try { parsed = JSON.parse(aiData?.choices?.[0]?.message?.content ?? '{}') } catch { parsed = {} }

    const taken = Array.isArray(parsed.taken) ? parsed.taken.slice(0, 5).map((t: any) => ({
      titel: String(t.titel ?? 'Vervolgactie').slice(0, 120),
      notitie: String(t.notitie ?? '').slice(0, 500),
      type: (TYPES as readonly string[]).includes(t.type) ? t.type : 'anders',
      offset_dagen: Math.max(0, Math.min(60, Number(t.offset_dagen ?? 1))),
      prioriteit: ['laag','normaal','hoog'].includes(t.prioriteit) ? t.prioriteit : 'normaal',
      due_op: new Date(Date.now() + Math.max(0, Math.min(60, Number(t.offset_dagen ?? 1))) * 86400000).toISOString(),
    })) : []

    if (commit && taken.length) {
      await admin.from('affiliate_opvolg_taken').insert(taken.map((t: any) => ({
        affiliate_id: userData.user.id,
        lead_id: leadId,
        titel: t.titel, notitie: t.notitie, type: t.type, prioriteit: t.prioriteit,
        due_op: t.due_op, bron: 'ai',
      })))
    }

    return json({ ok: true, taken })
  } catch (e) {
    console.error('ai-affiliate-opvolg-plan', e)
    return json({ error: (e as Error).message }, 500)
  }
})

function json(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}