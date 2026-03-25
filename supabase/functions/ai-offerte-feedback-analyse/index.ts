import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check role
    const { data: profile } = await supabase.from("users").select("rol, partner_id").eq("id", user.id).single();
    if (!profile || !["superadmin", "partner_admin", "partner_staff"].includes(profile.rol)) {
      return new Response(JSON.stringify({ error: "Geen toegang" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch rejected offertes last 90 days
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    let query = supabase
      .from("offertes")
      .select("offertenummer, klant_naam, totaal_bedrag, afwijzing_reden, afwijzing_categorie, status, updated_at")
      .in("status", ["afgewezen", "verlopen"])
      .gte("updated_at", since)
      .order("updated_at", { ascending: false });

    if (profile.rol !== "superadmin") {
      query = query.eq("partner_id", profile.partner_id);
    }

    const { data: offertes, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    if (!offertes || offertes.length === 0) {
      return new Response(JSON.stringify({ rapport: "Er zijn geen afgewezen offertes in de laatste 90 dagen om te analyseren." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt
    const summaries = offertes.map((o) =>
      `- ${o.offertenummer} | ${o.klant_naam} | €${o.totaal_bedrag} | Categorie: ${o.afwijzing_categorie || "onbekend"} | Reden: ${o.afwijzing_reden || "niet opgegeven"} | Status: ${o.status}`
    ).join("\n");

    const prompt = `Je bent een business analyst die offertedata analyseert voor een energiebedrijf. Analyseer de volgende ${offertes.length} afgewezen/verlopen offertes van de laatste 90 dagen en schrijf een beknopt rapport in het Nederlands.

DATA:
${summaries}

Schrijf het rapport met deze structuur:
## Samenvatting
Kort overzicht van de belangrijkste bevindingen.

## Hoofdredenen voor afwijzing
Analyseer de categorieën en redenen. Welke patronen zie je?

## Trends & patronen
Zijn er opvallende trends? (bijv. veel prijs-gerelateerde afwijzingen, specifieke periodes)

## Financiële impact
Geschat gemist omzetpotentieel en gemiddelde offertewaarde bij afwijzing.

## Concrete verbeterpunten
Geef 3-5 actiepunten die het bedrijf kan nemen om de conversie te verbeteren.

Wees concreet en data-gedreven. Gebruik getallen en percentages waar mogelijk.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY niet geconfigureerd");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Je bent een Nederlandse business analyst gespecialiseerd in sales optimalisatie voor energiebedrijven." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "AI service is tijdelijk overbelast, probeer het later opnieuw." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI-tegoed onvoldoende. Neem contact op met de beheerder." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const rapport = aiData.choices?.[0]?.message?.content || "Geen rapport gegenereerd.";

    return new Response(JSON.stringify({ rapport }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-offerte-feedback-analyse error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
