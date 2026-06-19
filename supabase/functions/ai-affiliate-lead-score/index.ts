import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' }

interface Body { leadId: string }

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

    const { leadId } = (await req.json()) as Body
    if (!leadId) return json({ error: 'leadId required' }, 400)

    const admin = createClient(url, serviceKey)
    const { data: lead } = await admin.from('affiliate_leads').select('*').eq('id', leadId).maybeSingle()
    if (!lead) return json({ error: 'Lead niet gevonden' }, 404)

    const [{ data: contact }, { data: terugbel }] = await Promise.all([
      admin.from('affiliate_lead_contactmomenten').select('type, uitkomst, notitie, created_at').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(10),
      admin.from('affiliate_terugbel_afspraken').select('type, geplande_op, notitie, afgehandeld_op').eq('lead_id', leadId).order('geplande_op', { ascending: false }).limit(5),
    ])

    const prompt = `Je bent een commerciële AI-assistent voor een Nederlandse SaaS (mijnhuis.nu) die wordt verkocht aan installatiebedrijven. Geef een lead-score (0-100) en advies. Antwoord ALLEEN met een JSON object met velden: score (int 0-100), reden (1 zin NL), volgende_actie (korte instructie NL), volgende_actie_op_offset_dagen (int aantal dagen vanaf vandaag).

LEAD:
- Bedrijf: ${lead.bedrijfsnaam ?? '-'}
- Contact: ${lead.contactpersoon ?? '-'}
- Branche: ${lead.branche ?? '-'} | Regio: ${lead.regio ?? '-'}
- Status: ${lead.status} | Bron: ${lead.bron ?? '-'}
- Notities: ${lead.notities ?? '-'}
- Aangemaakt: ${lead.created_at} | Laatste update: ${lead.updated_at}

CONTACTMOMENTEN (${contact?.length ?? 0}):
${(contact ?? []).map(c => `- ${c.created_at} ${c.type}: ${c.uitkomst ?? ''} ${c.notitie ?? ''}`).join('\n') || 'geen'}

TERUGBEL/DEMO AFSPRAKEN:
${(terugbel ?? []).map(t => `- ${t.geplande_op} ${t.type}${t.afgehandeld_op ? ' (afgehandeld)' : ''}: ${t.notitie ?? ''}`).join('\n') || 'geen'}`

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
    const raw = aiData?.choices?.[0]?.message?.content ?? '{}'
    let parsed: any = {}
    try { parsed = JSON.parse(raw) } catch { parsed = {} }

    const score = Math.max(0, Math.min(100, Number(parsed.score ?? 0)))
    const reden = String(parsed.reden ?? '').slice(0, 500)
    const volgende = String(parsed.volgende_actie ?? '').slice(0, 500)
    const offsetDagen = Math.max(0, Math.min(60, Number(parsed.volgende_actie_op_offset_dagen ?? 1)))
    const volgendeOp = new Date(Date.now() + offsetDagen * 86400000).toISOString()

    await admin.from('affiliate_leads').update({
      ai_score: score,
      ai_score_reden: reden,
      ai_volgende_actie: volgende,
      ai_volgende_actie_op: volgendeOp,
      laatst_gescoord_op: new Date().toISOString(),
      volgende_actie_datum: volgendeOp,
    }).eq('id', leadId)

    await admin.from('affiliate_opvolg_log').insert({
      lead_id: leadId,
      affiliate_id: lead.affiliate_id ?? userData.user.id,
      actie: 'ai_score',
      bron: 'ai',
      titel: `AI-score bijgewerkt: ${score}/100`,
      details: { score, reden, volgende_actie: volgende, volgende_actie_op: volgendeOp },
    })

    // Automatisch een opvolg-taak aanmaken zodat de AI-advies daadwerkelijk in
    // de belwerkbank en het opvolg-overzicht verschijnt. Alleen wanneer er nog
    // geen openstaande taak is voor deze lead.
    let taakAangemaakt = false
    if (volgende) {
      const { data: openTaken } = await admin
        .from('affiliate_opvolg_taken')
        .select('id')
        .eq('lead_id', leadId)
        .is('voltooid_op', null)
        .limit(1)
      if (!openTaken || openTaken.length === 0) {
        const taakType = score >= 60 ? 'bel' : score >= 30 ? 'mail' : 'anders'
        const prioriteit = score >= 70 ? 'hoog' : score >= 40 ? 'normaal' : 'laag'
        const eigenaarId = (lead as any).eigenaar_id ?? lead.affiliate_id ?? userData.user.id
        const { data: nieuw } = await admin.from('affiliate_opvolg_taken').insert({
          affiliate_id: eigenaarId,
          lead_id: leadId,
          titel: volgende.slice(0, 120),
          notitie: reden,
          type: taakType,
          prioriteit,
          due_op: volgendeOp,
          bron: 'ai',
        }).select('id').maybeSingle()
        if (nieuw?.id) {
          taakAangemaakt = true
          await admin.from('affiliate_opvolg_log').insert({
            lead_id: leadId,
            affiliate_id: eigenaarId,
            taak_id: nieuw.id,
            actie: 'taak_aangemaakt',
            bron: 'ai',
            titel: `AI heeft taak aangemaakt: ${volgende.slice(0, 80)}`,
            details: { type: taakType, prioriteit, due_op: volgendeOp },
          })
        }
      }
    }

    return json({ ok: true, score, reden, volgende_actie: volgende, volgende_actie_op: volgendeOp, taak_aangemaakt: taakAangemaakt })
  } catch (e) {
    console.error('ai-affiliate-lead-score', e)
    return json({ error: (e as Error).message }, 500)
  }
})

function json(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}