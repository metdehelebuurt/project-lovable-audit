import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  ticket_id: string;
  partner_id: string;
  user_id: string;
  product_categorie?: string;
  product_merk?: string;
  product_type?: string;
  foutcode?: string;
  probleem: string;
  eerdere_antwoorden?: { vraag: string; antwoord: string }[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body.probleem || !body.ticket_id || !body.partner_id) {
      return json({ error: "probleem, ticket_id en partner_id zijn verplicht" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ontbreekt");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Zoek gerelateerde tickets en KB-artikelen binnen DEZE partner
    const kbRes = await fetch(
      `${supabaseUrl}/rest/v1/helpdesk_kennis_artikelen?partner_id=eq.${body.partner_id}&status=eq.gepubliceerd&select=id,titel,samenvatting,probleem,oplossing,product_merk,product_categorie,foutcode&limit=20`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    );
    const kbArtikelen: Array<Record<string, unknown>> = kbRes.ok ? await kbRes.json() : [];

    const ticketRes = await fetch(
      `${supabaseUrl}/rest/v1/helpdesk_tickets?partner_id=eq.${body.partner_id}&status=eq.opgelost&select=id,ticketnummer,titel,product_merk,foutcode,oplossing&limit=10&order=opgelost_op.desc`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    );
    const opgelost: Array<Record<string, unknown>> = ticketRes.ok ? await ticketRes.json() : [];

    const kbContext = kbArtikelen.length
      ? `KENNISBANK (alleen deze partner):\n${kbArtikelen.map((a, i) => `[${i + 1}] ${a.titel} — ${a.samenvatting ?? ""} (oplossing: ${a.oplossing ?? "-"})`).join("\n")}`
      : "Kennisbank is leeg.";

    const ticketContext = opgelost.length
      ? `EERDER OPGELOSTE TICKETS:\n${opgelost.map((t) => `- ${t.ticketnummer} ${t.titel} (foutcode: ${t.foutcode ?? "-"}) → ${t.oplossing ?? ""}`).join("\n")}`
      : "Geen eerder opgeloste tickets gevonden.";

    const eerdereAntwoorden = (body.eerdere_antwoorden ?? [])
      .map((q) => `Q: ${q.vraag}\nA: ${q.antwoord}`)
      .join("\n\n");

    const systemPrompt = `Je bent een ervaren technisch troubleshooter. Antwoord in helder Nederlands. Gebruik EERST de meegegeven kennisbank en eerdere tickets van DIT bedrijf voordat je generiek advies geeft. Als je een match herkent, vermeld dat expliciet.`;

    const userPrompt = `Klantprobleem:
${body.probleem}

Productcontext:
- Categorie: ${body.product_categorie ?? "onbekend"}
- Merk: ${body.product_merk ?? "onbekend"}
- Type: ${body.product_type ?? "onbekend"}
- Foutcode: ${body.foutcode ?? "geen"}

${kbContext}

${ticketContext}

${eerdereAntwoorden ? `Eerdere vraag-antwoord:\n${eerdereAntwoorden}` : ""}

Geef terug als JSON:
{
  "herkend_uit_kb": true|false,
  "match_artikel_id": "uuid of null",
  "diagnose": "korte analyse",
  "vervolgvragen": ["...", "..."],
  "suggesties": [{"actie": "...", "toelichting": "..."}],
  "monteur_aanbevolen": true|false,
  "monteur_reden": "uitleg of leeg"
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return json({ error: "Te veel verzoeken, probeer later opnieuw." }, 429);
      if (aiRes.status === 402) return json({ error: "AI-tegoed op." }, 402);
      return json({ error: "AI niet beschikbaar" }, 500);
    }

    const data = await aiRes.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let analyse: Record<string, unknown>;
    try {
      analyse = JSON.parse(raw);
    } catch {
      analyse = { diagnose: raw };
    }

    const gerelateerdeTickets = opgelost.slice(0, 5).map((t) => ({
      id: t.id,
      ticketnummer: t.ticketnummer,
      titel: t.titel,
    }));

    await fetch(`${supabaseUrl}/rest/v1/helpdesk_ticket_ai_sessies`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        ticket_id: body.ticket_id,
        partner_id: body.partner_id,
        user_id: body.user_id,
        type: "troubleshooter",
        input: {
          probleem: body.probleem,
          merk: body.product_merk ?? null,
          foutcode: body.foutcode ?? null,
          eerdere_antwoorden: body.eerdere_antwoorden ?? [],
        },
        output: analyse,
        gerelateerde_tickets: gerelateerdeTickets,
        model: "google/gemini-2.5-pro",
      }),
    });

    return json({ analyse, gerelateerde_tickets: gerelateerdeTickets });
  } catch (e) {
    console.error("helpdesk-ai-troubleshooter error:", e);
    return json({ error: e instanceof Error ? e.message : "Onbekende fout" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}