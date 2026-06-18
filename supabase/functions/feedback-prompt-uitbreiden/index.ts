import { generateText } from "npm:ai@5.0.0";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { basis_prompt?: string; titel?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Ongeldige JSON" }, 400);
  }
  if (!body?.basis_prompt || body.basis_prompt.length < 20) {
    return json({ error: "basis_prompt ontbreekt of is te kort" }, 400);
  }

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return json({ error: "LOVABLE_API_KEY ontbreekt" }, 500);

  const gateway = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });

  const systemPrompt = `Je bent een senior product engineer die implementatie-prompts schrijft voor het mijnhuis.nu SaaS-platform (React 18 + Vite + TypeScript + Tailwind + shadcn + Supabase, multi-tenant, Nederlands).

Je krijgt een basis-implementatieprompt en moet deze UITBREIDEN en VERRIJKEN zodat een AI-coding-agent (Lovable) hem zonder verdere vragen volledig kan uitvoeren. Voeg toe waar nuttig:
- Concrete bestandspaden en componentnamen die waarschijnlijk geraakt worden (op basis van de mijnhuis.nu module-structuur: leads, klanten, offertes, schouwen, installaties, opleverrapporten, producten, abonnementen, helpdesk).
- Voorgestelde datamodel-wijzigingen (kolommen, types, FK's, indexen) inclusief RLS-policies per rol.
- Voorgestelde API/edge-function endpoints met request/response shape.
- UI-detaillering (welke shadcn componenten, welke states, welke flow).
- Concrete edge cases en testscenario's.
- Volgorde van implementatie in duidelijke stappen.

Behoud de structuur en headings van de basisprompt. Maak hem duidelijk uitgebreider, maar blijf praktisch en concreet — geen vage taal. Lever het resultaat in Markdown, in het Nederlands. Geen inleidende of afsluitende meta-tekst.`;

  try {
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: systemPrompt,
      prompt: `Hier is de basis-implementatieprompt voor "${body.titel ?? "een verzoek"}" (type: ${body.type ?? "onbekend"}). Breid hem uit volgens je instructies:\n\n${body.basis_prompt}`,
    });
    return json({ prompt: text });
  } catch (e: any) {
    return json({ error: e?.message ?? "AI-call mislukt" }, 500);
  }
});