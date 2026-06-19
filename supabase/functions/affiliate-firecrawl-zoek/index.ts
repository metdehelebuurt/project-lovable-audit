import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod'

const BodySchema = z.object({
  modus: z.enum(['search', 'scrape']),
  query: z.string().max(300).optional(),
  url: z.string().url().optional(),
  branches: z.array(z.string()).max(10).default([]),
  regio: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(20).default(10),
})

type ExtractedLead = {
  bedrijfsnaam: string
  website: string | null
  email: string | null
  telefoon: string | null
  plaats: string | null
  branche: string | null
  fragment: string | null
  bron_url: string | null
}

const FIRECRAWL_V2 = 'https://api.firecrawl.dev/v2'

async function firecrawlSearch(apiKey: string, query: string, limit: number) {
  const res = await fetch(`${FIRECRAWL_V2}/search`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      limit,
      lang: 'nl',
      country: 'nl',
      scrapeOptions: { formats: ['markdown'], onlyMainContent: true },
    }),
  })
  const data = await res.json()
  return { ok: res.ok, status: res.status, data }
}

async function firecrawlScrape(apiKey: string, url: string) {
  const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'links'],
      onlyMainContent: true,
    }),
  })
  const data = await res.json()
  return { ok: res.ok, status: res.status, data }
}

function collectMarkdown(payload: unknown): { markdown: string; bronUrl: string | null }[] {
  // Normaliseert search-respons (web[] of data[]) en scrape-respons (single)
  const out: { markdown: string; bronUrl: string | null }[] = []
  if (!payload || typeof payload !== 'object') return out
  const p = payload as Record<string, unknown>

  const pushItem = (item: unknown) => {
    if (!item || typeof item !== 'object') return
    const it = item as Record<string, unknown>
    const md = (it.markdown as string) || ((it.data as Record<string, unknown> | undefined)?.markdown as string)
    const url = (it.url as string) || ((it.metadata as Record<string, unknown> | undefined)?.sourceURL as string) || null
    if (md && md.trim().length > 50) out.push({ markdown: md.slice(0, 12000), bronUrl: url })
  }

  // Scrape single shape
  if (typeof p.markdown === 'string') {
    out.push({
      markdown: p.markdown.slice(0, 12000),
      bronUrl: ((p.metadata as Record<string, unknown> | undefined)?.sourceURL as string) || null,
    })
    return out
  }

  // Search shapes
  const candidates: unknown[] = []
  if (Array.isArray(p.data)) candidates.push(...(p.data as unknown[]))
  const web = (p as { web?: { results?: unknown[] } }).web?.results
  if (Array.isArray(web)) candidates.push(...web)
  const dataObj = p.data as { web?: { results?: unknown[] } } | undefined
  if (dataObj && Array.isArray(dataObj.web?.results)) candidates.push(...dataObj.web!.results!)

  for (const c of candidates) pushItem(c)
  return out
}

async function extractLeadsViaAi(
  lovableKey: string,
  bronnen: { markdown: string; bronUrl: string | null }[],
  branches: string[],
  regio: string | undefined,
): Promise<ExtractedLead[]> {
  if (bronnen.length === 0) return []

  const branchesTekst = branches.length ? branches.join(', ') : 'verduurzaming woningen'
  const systemPrompt = `Je bent een B2B leadextractor voor een Nederlands platform in de verduurzamingsbranche.
Doel: extraheer Nederlandse INSTALLATEURS / BEDRIJVEN actief in: ${branchesTekst}${regio ? ` (regio: ${regio})` : ''}.

Regels:
- Alleen bedrijfsentiteiten — GEEN particulieren, GEEN consumentenadressen.
- Skip review-sites, vergelijkers, nieuwsartikelen en bedrijven zonder duidelijke naam.
- Eén entry per uniek bedrijf. Geen duplicaten.
- Vul velden alleen in als ze daadwerkelijk in de tekst staan. Bij twijfel: null.
- Maximaal 20 bedrijven.`

  const userPrompt = bronnen
    .map((b, i) => `=== Bron ${i + 1} (${b.bronUrl ?? 'onbekend'}) ===\n${b.markdown}`)
    .join('\n\n')
    .slice(0, 30000)

  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Lovable-API-Key': lovableKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'leads_terug',
            description: 'Geef de geëxtraheerde bedrijven terug',
            parameters: {
              type: 'object',
              properties: {
                leads: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      bedrijfsnaam: { type: 'string' },
                      website: { type: 'string' },
                      email: { type: 'string' },
                      telefoon: { type: 'string' },
                      plaats: { type: 'string' },
                      branche: { type: 'string' },
                      fragment: { type: 'string', description: 'Max 200 tekens omschrijving' },
                      bron_url: { type: 'string' },
                    },
                    required: ['bedrijfsnaam'],
                  },
                },
              },
              required: ['leads'],
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'leads_terug' } },
    }),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`AI Gateway ${res.status}: ${txt.slice(0, 300)}`)
  }
  const json = await res.json()
  const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0]
  const args = toolCall?.function?.arguments
  if (!args) return []
  let parsed: { leads?: Partial<ExtractedLead>[] }
  try {
    parsed = typeof args === 'string' ? JSON.parse(args) : args
  } catch {
    return []
  }
  const leads = (parsed.leads ?? []).filter((l) => l.bedrijfsnaam && l.bedrijfsnaam.trim().length > 1)
  return leads.map((l) => ({
    bedrijfsnaam: String(l.bedrijfsnaam).trim(),
    website: l.website?.trim() || null,
    email: l.email?.trim().toLowerCase() || null,
    telefoon: l.telefoon?.trim() || null,
    plaats: l.plaats?.trim() || null,
    branche: l.branche?.trim() || null,
    fragment: l.fragment?.slice(0, 240) || null,
    bron_url: l.bron_url?.trim() || null,
  }))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Niet ingelogd' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: userData, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Ongeldige sessie' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const { modus, query, url, branches, regio, limit } = parsed.data

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!firecrawlKey) {
      return new Response(JSON.stringify({ error: 'Firecrawl is niet geconfigureerd' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const lovableKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: 'AI Gateway niet beschikbaar' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let fc: { ok: boolean; status: number; data: unknown }
    if (modus === 'search') {
      if (!query) return new Response(JSON.stringify({ error: 'query is verplicht in search-modus' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
      fc = await firecrawlSearch(firecrawlKey, query, Math.min(limit, 10))
    } else {
      if (!url) return new Response(JSON.stringify({ error: 'url is verplicht in scrape-modus' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
      fc = await firecrawlScrape(firecrawlKey, url)
    }

    if (!fc.ok) {
      if (fc.status === 402) {
        return new Response(JSON.stringify({ error: 'Firecrawl-credits zijn op. Top je Firecrawl-account op of upgrade je plan.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const errMsg = (fc.data as { error?: string })?.error ?? `Firecrawl-fout (${fc.status})`
      return new Response(JSON.stringify({ error: errMsg }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const bronnen = collectMarkdown(fc.data)
    if (bronnen.length === 0) {
      return new Response(JSON.stringify({ leads: [], bronnen: 0, melding: 'Firecrawl gaf geen bruikbare content terug.' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let leads: ExtractedLead[] = []
    try {
      leads = await extractLeadsViaAi(lovableKey, bronnen, branches, regio)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI extractie mislukt'
      if (msg.includes('429')) {
        return new Response(JSON.stringify({ error: 'AI-limiet bereikt, probeer over een minuut opnieuw.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (msg.includes('402')) {
        return new Response(JSON.stringify({ error: 'AI-credits op. Voeg credits toe in je workspace-instellingen.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw e
    }

    // Beperk tot gevraagde limit
    leads = leads.slice(0, limit)

    return new Response(JSON.stringify({ leads, bronnen: bronnen.length }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Onbekende fout'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})