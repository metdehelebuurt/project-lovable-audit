import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Je bent een Nederlandse copywriter die converterende productpagina's schrijft voor verduurzamings-installateurs (zonnepanelen, warmtepompen, isolatie, laadpalen, thuisbatterijen).

Je krijgt productinformatie en levert ALTIJD een JSON-object met:
- pitch: 1 krachtige zin (max 160 tekens) die het kernvoordeel benoemt
- omschrijving: 2-4 alinea's vlotte verhalende tekst (geen markdown), gericht op een eindconsument; benoem voor wie het product geschikt is en waarom
- usps: array van 4-5 korte voordelen (max 80 tekens per stuk, geen punten/emoji)
- faq: array van 4-5 objecten {vraag, antwoord} met realistische consumenten-vragen

Schrijf zakelijk-warm, geen overdrijvingen, geen marketing-taal als "revolutionair" of "ongeevenaard". Geen emoji.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Niet ingelogd" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: claimsRes, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsRes?.claims?.sub) {
      return json({ error: "Niet ingelogd" }, 401);
    }
    const user = { id: claimsRes.claims.sub as string };

    const { product_id } = await req.json().catch(() => ({}));
    if (!product_id || typeof product_id !== "string") {
      return json({ error: "product_id ontbreekt" }, 400);
    }

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Toegangscheck: user moet bij dezelfde partner horen of superadmin zijn
    const { data: u } = await admin.from("users").select("partner_id, rol").eq("id", user.id).single();
    if (!u) return json({ error: "Gebruiker niet gevonden" }, 403);

    const { data: product, error: pErr } = await admin
      .from("producten")
      .select("id, partner_id, naam, merk, model, categorie, omschrijving, specs, garantie_jaren, certificeringen, eenheid")
      .eq("id", product_id)
      .single();
    if (pErr || !product) return json({ error: "Product niet gevonden" }, 404);

    if (product.partner_id !== u.partner_id && u.rol !== "superadmin") {
      return json({ error: "Geen toegang tot dit product" }, 403);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI-gateway niet geconfigureerd" }, 500);

    const userPrompt = `Schrijf marketing-content voor dit product:

Naam: ${product.naam}
Merk: ${product.merk ?? "—"}
Model: ${product.model ?? "—"}
Categorie: ${product.categorie ?? "—"}
Eenheid: ${product.eenheid ?? "stuk"}
Garantie: ${product.garantie_jaren ? product.garantie_jaren + " jaar" : "—"}
Certificeringen: ${product.certificeringen ?? "—"}
Bestaande omschrijving: ${product.omschrijving ?? "—"}
Specs: ${JSON.stringify(product.specs ?? {})}`;

    const tool = {
      type: "function" as const,
      function: {
        name: "lever_marketing_content",
        description: "Lever de marketing-content voor de productpagina.",
        parameters: {
          type: "object",
          properties: {
            pitch: { type: "string" },
            omschrijving: { type: "string" },
            usps: { type: "array", items: { type: "string" } },
            faq: {
              type: "array",
              items: {
                type: "object",
                properties: { vraag: { type: "string" }, antwoord: { type: "string" } },
                required: ["vraag", "antwoord"],
                additionalProperties: false,
              },
            },
          },
          required: ["pitch", "omschrijving", "usps", "faq"],
          additionalProperties: false,
        },
      },
    };

    const modellen = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
    let parsed: any = null;
    let laatsteFout = "";

    for (const model of modellen) {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          tools: [tool],
          tool_choice: { type: "function", function: { name: "lever_marketing_content" } },
        }),
      });

      if (aiResp.status === 429) return json({ error: "Te veel verzoeken — probeer over een minuut opnieuw." }, 429);
      if (aiResp.status === 402) return json({ error: "AI-tegoed op. Vul je workspace-credits aan." }, 402);

      if (!aiResp.ok) {
        laatsteFout = await aiResp.text();
        console.error(`AI gateway error (${model}):`, aiResp.status, laatsteFout);
        continue;
      }

      const aiJson = await aiResp.json();
      const msg = aiJson?.choices?.[0]?.message;
      const args = msg?.tool_calls?.[0]?.function?.arguments;

      if (args) {
        try {
          parsed = typeof args === "string" ? JSON.parse(args) : args;
          break;
        } catch (e) {
          laatsteFout = `Parse-fout: ${(e as Error).message}`;
          console.error(laatsteFout, args);
          continue;
        }
      }

      // Fallback: sommige modellen leveren JSON in content
      const content = typeof msg?.content === "string" ? msg.content : "";
      if (content) {
        const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
        try {
          parsed = JSON.parse(cleaned);
          break;
        } catch {
          laatsteFout = "Onverwacht AI-antwoord (geen tool-call, geen JSON)";
          console.error(laatsteFout, content.slice(0, 500));
        }
      }
    }

    if (!parsed) {
      return json({ error: `AI-aanroep mislukt: ${laatsteFout || "geen bruikbaar antwoord"}` }, 500);
    }

    // Normaliseer
    const result = {
      pitch: typeof parsed.pitch === "string" ? parsed.pitch.slice(0, 200) : "",
      omschrijving: typeof parsed.omschrijving === "string" ? parsed.omschrijving : "",
      usps: Array.isArray(parsed.usps) ? parsed.usps.filter((u: unknown) => typeof u === "string") : [],
      faq: Array.isArray(parsed.faq)
        ? parsed.faq
            .filter((f: any) => f && typeof f.vraag === "string" && typeof f.antwoord === "string")
            .map((f: any) => ({ vraag: f.vraag, antwoord: f.antwoord }))
        : [],
    };

    return json(result, 200);
  } catch (e: any) {
    console.error("ai-product-marketing error:", e);
    return json({ error: e?.message ?? "Onbekende fout" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}