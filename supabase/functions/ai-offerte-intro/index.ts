import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { klant_naam, klant_plaats, producten, notities, bedrijfsnaam } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const productContext = Array.isArray(producten) && producten.length > 0
      ? producten.map((p: any) => `${p.naam}${p.merk ? ` (${p.merk})` : ""}`).join(", ")
      : "energiebesparende producten";

    const systemPrompt = `Je bent een professionele offerteschrijver voor een Nederlands energiebedrijf. Schrijf altijd in het Nederlands. Je stijl is warm, persoonlijk en professioneel. Gebruik geen overdreven verkooptaal maar wees oprecht en behulpzaam.`;

    const userPrompt = `Schrijf een persoonlijke introductietekst voor een offerte met de volgende gegevens:
- Klant: ${klant_naam}
${klant_plaats ? `- Woonplaats: ${klant_plaats}` : ""}
- Producten: ${productContext}
${bedrijfsnaam ? `- Ons bedrijf: ${bedrijfsnaam}` : ""}
${notities ? `- Notities/context: ${notities}` : ""}

De tekst moet:
- 3-4 zinnen lang zijn
- Persoonlijk aanvoelen (gebruik de naam van de klant)
- De producten/oplossing kort benoemen
- Eindigen met een positieve noot over de samenwerking
- Geen aanhef of afsluitgroet bevatten (die staan al in de offerte)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Te veel verzoeken, probeer het later opnieuw." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Geen tegoed meer. Voeg credits toe in Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service niet beschikbaar" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const intro = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ intro }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-offerte-intro error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
