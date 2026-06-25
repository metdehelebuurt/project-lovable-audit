import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Briefing = {
  samenvatting: string;
  gesprekspunten: string[];
  mogelijke_bezwaren: string[];
  usps: string[];
  aanbevolen_volgende_actie: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const { lead_id } = await req.json();
    if (!lead_id || typeof lead_id !== "string") return json({ error: "lead_id required" }, 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: lead, error: leadErr } = await supabase
      .from("affiliate_leads")
      .select("bedrijfsnaam, contactpersoon, branche, regio, plaats, website, notities, status, geschatte_waarde")
      .eq("id", lead_id)
      .maybeSingle();
    if (leadErr || !lead) return json({ error: "lead niet gevonden" }, 404);

    const { data: contacten } = await supabase
      .from("affiliate_lead_contactmomenten")
      .select("type, uitkomst, notitie, created_at")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: false })
      .limit(10);

    const prompt = buildPrompt(lead, contacten ?? []);

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Je bent een Nederlandse sales-coach voor SaaS in de installatie- en verduurzamingsbranche. Antwoord ALTIJD in compact JSON volgens het schema; geen extra tekst." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      const status = resp.status === 429 || resp.status === 402 ? resp.status : 502;
      return json({ error: `AI gateway: ${resp.status} ${t}` }, status);
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let briefing: Briefing;
    try {
      briefing = JSON.parse(raw);
    } catch {
      return json({ error: "AI gaf onleesbare output" }, 502);
    }

    return json(briefing, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "onbekende fout" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildPrompt(lead: Record<string, unknown>, contacten: Array<Record<string, unknown>>): string {
  const historie = contacten.length === 0
    ? "(geen eerdere contactmomenten)"
    : contacten.map((c) =>
        `- ${new Date(c.created_at as string).toLocaleDateString("nl-NL")} · ${c.type}${c.uitkomst ? ` · ${c.uitkomst}` : ""}${c.notitie ? `\n  notitie: ${c.notitie}` : ""}`,
      ).join("\n");

  return `Bereid een belgesprek voor met deze lead:

Bedrijf: ${lead.bedrijfsnaam ?? "-"}
Contactpersoon: ${lead.contactpersoon ?? "-"}
Branche: ${lead.branche ?? "-"}
Regio: ${lead.regio ?? lead.plaats ?? "-"}
Website: ${lead.website ?? "-"}
Huidige status: ${lead.status ?? "-"}
Geschatte waarde: ${lead.geschatte_waarde ?? "-"}
Notities: ${lead.notities ?? "(geen)"}

Laatste contactmomenten:
${historie}

Geef terug in het volgende JSON-schema, in het Nederlands, kort en concreet:
{
  "samenvatting": "1-2 zinnen met wie dit bedrijf is en waar ze nu staan in het sales-traject",
  "gesprekspunten": ["3-5 concrete onderwerpen om aan te kaarten"],
  "mogelijke_bezwaren": ["2-4 verwachte bezwaren met telkens een kort weerwoord"],
  "usps": ["2-4 USP's specifiek relevant voor dit bedrijf"],
  "aanbevolen_volgende_actie": "wat zou de ideale volgende stap zijn"
}`;
}