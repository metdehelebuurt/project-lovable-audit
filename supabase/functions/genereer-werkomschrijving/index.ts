import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReqBody { installatie_id?: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY || !LOVABLE_API_KEY) {
      return jsonResp({ error: "Server-configuratie ontbreekt" }, 500);
    }

    const body = (await req.json().catch(() => ({}))) as ReqBody;
    const installatieId = body.installatie_id;
    if (!installatieId || typeof installatieId !== "string") {
      return jsonResp({ error: "installatie_id is verplicht" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: inst, error: instErr } = await supabase
      .from("installaties")
      .select("*")
      .eq("id", installatieId)
      .maybeSingle();
    if (instErr) return jsonResp({ error: instErr.message }, 500);
    if (!inst) return jsonResp({ error: "Installatie niet gevonden" }, 404);

    let schouw: Record<string, unknown> | null = null;
    // 1. Direct via installatie.schouw_id
    if (inst.schouw_id) {
      const { data: sch } = await supabase.from("schouwen").select("*").eq("id", inst.schouw_id).maybeSingle();
      if (sch) schouw = sch;
    }
    // 2. Via opdracht.schouw_id
    if (!schouw && inst.opdracht_id) {
      const { data: opd } = await supabase
        .from("opdrachten")
        .select("schouw_id")
        .eq("id", inst.opdracht_id)
        .maybeSingle();
      if (opd?.schouw_id) {
        const { data: sch } = await supabase.from("schouwen").select("*").eq("id", opd.schouw_id).maybeSingle();
        if (sch) schouw = sch;
      }
    }
    // 3. Voorstel via lead_id (uitgevoerd)
    if (!schouw && inst.lead_id && inst.partner_id) {
      const { data: sch } = await supabase
        .from("schouwen")
        .select("*")
        .eq("lead_id", inst.lead_id)
        .eq("partner_id", inst.partner_id)
        .eq("status", "uitgevoerd")
        .order("geplande_datum", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (sch) schouw = sch;
    }

    const productenArr = Array.isArray(inst.producten) ? inst.producten as Array<Record<string, unknown>> : [];
    const productIds = productenArr.map((p) => p.product_id).filter((x): x is string => typeof x === "string");
    let productenInfo: Array<Record<string, unknown>> = [];
    if (productIds.length > 0) {
      const { data: prods } = await supabase
        .from("producten")
        .select("id, naam, merk, type, wattpiek, technische_specs")
        .in("id", productIds);
      productenInfo = prods ?? [];
    }

    const { data: checklist } = await supabase
      .from("installatie_checklist_items")
      .select("label, blokkerend, voltooid_op, notitie")
      .eq("installatie_id", installatieId)
      .order("created_at");
    const openItems = (checklist ?? []).filter((c) => !c.voltooid_op);

    const monteurNaam = await resolveMonteur(supabase, inst.installateur_id);

    const context = {
      klant: {
        naam: inst.consument_naam,
        adres: inst.werkadres ?? inst.klant_adres,
        postcode: inst.klant_postcode,
        plaats: inst.klant_plaats,
        telefoon: inst.klant_telefoon,
        bijzonderheden_klant: inst.klantnotities ?? null,
      },
      planning: {
        datum: inst.geplande_startdatum,
        starttijd: inst.start_tijd,
        eindtijd: inst.eind_tijd,
        monteur: monteurNaam,
      },
      producten: productenArr.map((p) => {
        const meta = productenInfo.find((pi) => pi.id === p.product_id);
        return {
          omschrijving: p.omschrijving ?? meta?.naam,
          aantal: p.aantal,
          merk: meta?.merk,
          type: meta?.type,
          wattpiek: meta?.wattpiek,
        };
      }),
      schouw: schouw
        ? {
            schouw_nummer: schouw.schouw_nummer ?? null,
            categorie: schouw.categorie ?? null,
            geplande_datum: schouw.geplande_datum ?? null,
            status: schouw.status ?? null,
            zonnepanelen_clusters: ((schouw.gegevens as Record<string, unknown> | null)?.zonnepanelen as Record<string, unknown> | undefined)?.clusters ?? null,
            batterij: (schouw.gegevens as Record<string, unknown> | null)?.batterij ?? (schouw.gegevens as Record<string, unknown> | null)?.thuisbatterij ?? null,
            laadpaal: (schouw.gegevens as Record<string, unknown> | null)?.laadpaal ?? null,
            warmtepomp: (schouw.gegevens as Record<string, unknown> | null)?.warmtepomp ?? null,
            meterkast: (schouw.gegevens as Record<string, unknown> | null)?.meterkast ?? (schouw.gegevens as Record<string, unknown> | null)?.elektra ?? null,
            aandachtspunten: schouw.aandachtspunten ?? schouw.notities ?? null,
            aantal_fotos: Array.isArray(schouw.fotos) ? (schouw.fotos as unknown[]).length : 0,
          }
        : null,
      open_checklist: openItems.map((c) => ({
        label: c.label,
        blokkerend: c.blokkerend,
        notitie: c.notitie,
      })),
    };

    const systemPrompt = `Je bent een planner die een korte, praktische werkomschrijving schrijft voor de monteur.
Schrijf in het Nederlands, zakelijk en bondig. Maximaal 200 woorden.
Structureer in bullets onder deze 5 kopjes:
• Aankomst & toegang
• Materiaal & producten
• Werkzaamheden
• Aandachtspunten uit schouw
• Oplevering

Gebruik alleen informatie die je in de context vindt. Verzin niets. Als data ontbreekt, schrijf "—" of laat het kopje kort.
Bij dakvlakken: noem aantal panelen, oriëntatie en hellingshoek concreet (bv. "ZW-dak, 12 panelen, 35°").
Herhaal aandachtspunten uit de schouw één-op-één onder het kopje "Aandachtspunten uit schouw".`;

    const userPrompt = `Context (JSON):\n${JSON.stringify(context, null, 2)}\n\nGenereer de werkomschrijving.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (aiResp.status === 429) return jsonResp({ error: "rate_limit_429" }, 429);
    if (aiResp.status === 402) return jsonResp({ error: "credits_402" }, 402);
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return jsonResp({ error: `AI fout: ${aiResp.status}` }, 500);
    }

    const aiJson = await aiResp.json();
    const tekst = aiJson?.choices?.[0]?.message?.content?.trim() ?? "";
    if (!tekst) return jsonResp({ error: "AI gaf lege respons" }, 500);

    return jsonResp({ tekst });
  } catch (e) {
    console.error("genereer-werkomschrijving error:", e);
    const msg = e instanceof Error ? e.message : "Onbekende fout";
    return jsonResp({ error: msg }, 500);
  }
});

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function resolveMonteur(supabase: ReturnType<typeof createClient>, id: string | null | undefined): Promise<string | null> {
  if (!id) return null;
  const { data } = await supabase.from("users").select("voornaam, achternaam").eq("id", id).maybeSingle();
  if (!data) return null;
  return `${data.voornaam ?? ""} ${data.achternaam ?? ""}`.trim() || null;
}