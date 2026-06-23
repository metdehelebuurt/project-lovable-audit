import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod'

const BodySchema = z.object({
  lead_id: z.string().uuid(),
})

const FIRECRAWL_V2 = 'https://api.firecrawl.dev/v2'

type Suggesties = {
  email: string | null
  telefoon: string | null
  website: string | null
  contactpersoon: string | null
  adres: string | null
  postcode: string | null
  plaats: string | null
  branche: string | null
  samenvatting: string | null
}

function normaliseerUrl(u: string | null | undefined): string | null {
  if (!u) return null
  const trim = u.trim()
  if (!trim) return null
  if (/^https?:\/\//i.test(trim)) return trim
  return `https://${trim}`
}

async function fcScrape(apiKey: string, url: string) {
  const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, formats: ['markdown', 'links'], onlyMainContent: true }),
  })
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) }
}

async function fcSearch(apiKey: string, query: string, limit = 5) {
  const res = await fetch(`${FIRECRAWL_V2}/search`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query, limit, lang: 'nl', country: 'nl',
      scrapeOptions: { formats: ['markdown'], onlyMainContent: true },
    }),
  })
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) }
}

function collectMd(payload: unknown): { markdown: string; bron: string | null }[] {
  const out: { markdown: string; bron: string | null }[] = []
  if (!payload || typeof payload !== 'object') return out
  const p = payload as Record<string, unknown>

  if (typeof p.markdown === 'string') {
    out.push({
      markdown: p.markdown.slice(0, 14000),
      bron: ((p.metadata as Record<string, unknown> | undefined)?.sourceURL as string) || null,
    })
  }
  const cands: unknown[] = []
  if (Array.isArray(p.data)) cands.push(...(p.data as unknown[]))
  const web = (p as { web?: { results?: unknown[] } }).web?.results
  if (Array.isArray(web)) cands.push(...web)
  const dataObj = p.data as { web?: { results?: unknown[] } } | undefined
  if (dataObj && Array.isArray(dataObj.web?.results)) cands.push(...dataObj.web!.results!)
  for (const c of cands) {
    if (!c || typeof c !== 'object') continue
    const it = c as Record<string, unknown>
    const md = (it.markdown as string) || ((it.data as Record<string, unknown> | undefined)?.markdown as string)
    const url = (it.url as string) || ((it.metadata as Record<string, unknown> | undefined)?.sourceURL as string) || null
    if (md && md.trim().length > 50) out.push({ markdown: md.slice(0, 10000), bron: url })
  }
  return out
}

function vindContactUrl(payload: unknown, basisUrl: string): string | null {
  if (!payload || typeof payload !== 'object') return null
  const p = payload as Record<string, unknown>
  const links = (p.links as string[]) ?? ((p.data as Record<string, unknown> | undefined)?.links as string[]) ?? []
  const target = links.find((l) => typeof l === 'string' && /contact|over[\s-]?ons|about/i.test(l))
  if (!target) return null
  try {
    return new URL(target, basisUrl).toString()
  } catch {
    return null
  }
}

async function aiVerrijk(
  lovableKey: string,
  bedrijfsnaam: string,
  bronnen: { markdown: string; bron: string | null }[],
): Promise<Suggesties | null> {
  if (bronnen.length === 0) return null

  const userPrompt = `BEDRIJF: ${bedrijfsnaam}\n\n` + bronnen
    .map((b, i) => `=== Bron ${i + 1} (${b.bron ?? 'onbekend'}) ===\n${b.markdown}`)
    .join('\n\n')
    .slice(0, 28000)

  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Lovable-API-Key': lovableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: `Je bent een Nederlandse B2B data-verrijker. Extraheer uit de bronteksten contactgegevens en bedrijfsinfo van EXACT het opgegeven bedrijf. Vul velden alleen in als ze letterlijk in de tekst staan. Geef bij twijfel null. Geen verzonnen data.`,
        },
        { role: 'user', content: userPrompt },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'verrijk_terug',
            description: 'Geef de gevonden bedrijfsgegevens terug',
            parameters: {
              type: 'object',
              properties: {
                email: { type: 'string', description: 'Algemeen contact e-mailadres, lowercase' },
                telefoon: { type: 'string', description: 'Telefoonnummer NL-format' },
                website: { type: 'string' },
                contactpersoon: { type: 'string', description: 'Naam van eigenaar/directeur indien duidelijk' },
                adres: { type: 'string', description: 'Straat + huisnummer' },
                postcode: { type: 'string', description: 'Format 1234 AB' },
                plaats: { type: 'string' },
                branche: { type: 'string', description: 'Korte branche-aanduiding' },
                samenvatting: { type: 'string', description: 'Maximaal 240 tekens, wat het bedrijf doet' },
              },
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'verrijk_terug' } },
    }),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`AI Gateway ${res.status}: ${txt.slice(0, 300)}`)
  }
  const json = await res.json()
  const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments
  if (!args) return null
  let parsed: Partial<Suggesties>
  try {
    parsed = typeof args === 'string' ? JSON.parse(args) : args
  } catch {
    return null
  }
  const clean = (v: unknown, max = 200) =>
    typeof v === 'string' && v.trim().length > 0 ? v.trim().slice(0, max) : null
  return {
    email: clean(parsed.email, 120)?.toLowerCase() ?? null,
    telefoon: clean(parsed.telefoon, 40),
    website: clean(parsed.website, 240),
    contactpersoon: clean(parsed.contactpersoon, 120),
    adres: clean(parsed.adres, 160),
    postcode: clean(parsed.postcode, 10)?.toUpperCase() ?? null,
    plaats: clean(parsed.plaats, 80),
    branche: clean(parsed.branche, 80),
    samenvatting: clean(parsed.samenvatting, 240),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Niet ingelogd' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
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
    const { lead_id } = parsed.data

    // Lead ophalen + eigenaar-check (RLS dwingt dit ook af, maar we falen vroeg met nette melding).
    const { data: lead, error: leadErr } = await supabase
      .from('affiliate_leads')
      .select('id, eigenaar_id, bedrijfsnaam, website, plaats, regio')
      .eq('id', lead_id)
      .maybeSingle()
    if (leadErr || !lead) {
      return new Response(JSON.stringify({ error: 'Lead niet gevonden of geen toegang' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (lead.eigenaar_id && lead.eigenaar_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: 'Geen toegang tot deze lead' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!lead.bedrijfsnaam || lead.bedrijfsnaam.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Bedrijfsnaam ontbreekt — vul die eerst aan.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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

    const bronnen: { markdown: string; bron: string | null }[] = []
    const website = normaliseerUrl(lead.website)

    if (website) {
      const home = await fcScrape(firecrawlKey, website)
      if (home.ok) {
        bronnen.push(...collectMd(home.data))
        const contactUrl = vindContactUrl(home.data, website)
        if (contactUrl && contactUrl !== website) {
          const contact = await fcScrape(firecrawlKey, contactUrl)
          if (contact.ok) bronnen.push(...collectMd(contact.data))
        }
      } else if (home.status === 402) {
        return new Response(JSON.stringify({ error: 'Firecrawl-credits zijn op. Top je Firecrawl-account op.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Aanvullend zoeken naar contactgegevens
    if (bronnen.length < 2) {
      const plaats = lead.plaats || lead.regio || ''
      const query = `${lead.bedrijfsnaam} ${plaats} contact telefoon email`.trim()
      const zoek = await fcSearch(firecrawlKey, query, 4)
      if (zoek.ok) bronnen.push(...collectMd(zoek.data))
      else if (zoek.status === 402) {
        return new Response(JSON.stringify({ error: 'Firecrawl-credits zijn op.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    if (bronnen.length === 0) {
      return new Response(JSON.stringify({
        suggesties: null, bronnen: 0,
        melding: 'Geen bruikbare webcontent gevonden — controleer bedrijfsnaam of voeg een website toe.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let suggesties: Suggesties | null = null
    try {
      suggesties = await aiVerrijk(lovableKey, lead.bedrijfsnaam, bronnen)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI verrijking mislukt'
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

    return new Response(
      JSON.stringify({
        suggesties,
        bronnen: bronnen.length,
        bron_urls: bronnen.map((b) => b.bron).filter(Boolean),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Onbekende fout'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})