import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { lead_id } = await req.json();
    if (!lead_id) throw new Error("lead_id is vereist");

    const sb = createClient(supabaseUrl, serviceKey);
    const { data: lead, error: leadErr } = await sb
      .from("affiliate_leads")
      .select("id, bedrijfsnaam, contactpersoon, website, branche, regio, notities, tags, geschatte_waarde")
      .eq("id", lead_id)
      .single();
    if (leadErr || !lead) throw new Error("Lead niet gevonden");

    const prompt = `Maak een korte verkoop-gerichte analyse van dit bedrijf voor een sales adviseur die het zo gaat bellen. Wees concreet, geen vage marketing-taal. Schrijf in het Nederlands.

BEDRIJF:
- Naam: ${lead.bedrijfsnaam}
- Website: ${lead.website || "onbekend"}
- Branche: ${lead.branche || "onbekend"}
- Regio: ${lead.regio || "onbekend"}
- Contactpersoon: ${lead.contactpersoon || "onbekend"}
- Tags: ${(lead.tags || []).join(", ") || "geen"}
- Notities: ${lead.notities || "geen"}

Geef:
1. samenvatting: 3-4 zinnen over wat dit bedrijf doet en waarom ze interessant zijn als klant voor een SaaS platform voor duurzame energie installateurs (offerte/CRM/schouw software).
2. kansen: 3-5 concrete sales kansen / openingszinnen / haakjes om in het gesprek te gebruiken.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Je bent een ervaren B2B sales adviseur in de Nederlandse duurzame-energie branche. Wees kort, scherp en actionable." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "bedrijf_analyse",
            description: "Lever bedrijfsanalyse",
            parameters: {
              type: "object",
              properties: {
                samenvatting: { type: "string", description: "3-4 zinnen samenvatting" },
                kansen: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      titel: { type: "string" },
                      uitleg: { type: "string" },
                    },
                    required: ["titel", "uitleg"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["samenvatting", "kansen"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "bedrijf_analyse" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit bereikt." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits op. Voeg credits toe in je workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway fout: " + status);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Geen AI response");
    const parsed = JSON.parse(toolCall.function.arguments);

    await sb.from("affiliate_leads").update({
      ai_bedrijf_samenvatting: parsed.samenvatting,
      ai_bedrijf_kansen: parsed.kansen,
      ai_bedrijf_samenvatting_op: new Date().toISOString(),
    }).eq("id", lead_id);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-affiliate-bedrijf-samenvatting error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});