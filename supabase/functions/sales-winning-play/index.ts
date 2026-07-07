import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Genereert een AI "waarom-gewonnen" samenvatting voor één lead en cachet
// het resultaat op affiliate_leads.winning_play_*.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ error: "Unauthorized" }, 401);
    const uid = userData.user.id;

    const admin = createClient(url, serviceKey);
    const { data: rollen } = await admin.from("user_roles").select("rol").eq("user_id", uid);
    const rolSet = new Set((rollen ?? []).map((r: { rol: string }) => r.rol));
    const isManager = rolSet.has("superadmin") || rolSet.has("sales_manager") || rolSet.has("sales_admin");

    const body = await req.json().catch(() => ({}));
    const leadId: string | undefined = body?.lead_id;
    const force: boolean = !!body?.force;
    if (!leadId) return json({ error: "lead_id vereist" }, 400);

    const { data: lead, error: leadErr } = await admin
      .from("affiliate_leads")
      .select("id, bedrijfsnaam, eigenaar_id, fase_slug, geschatte_waarde, notities, ai_bedrijf_samenvatting, winning_play_samenvatting, winning_play_hoogtepunten, winning_play_bijgewerkt_op, created_at, updated_at")
      .eq("id", leadId)
      .single();
    if (leadErr || !lead) return json({ error: "Lead niet gevonden" }, 404);
    if (lead.fase_slug !== "gewonnen") return json({ error: "Alleen gewonnen deals" }, 400);

    const mag = isManager || lead.eigenaar_id === uid;
    if (!mag) return json({ error: "Forbidden" }, 403);

    // Return cached als niet force en <30 dagen oud
    if (!force && lead.winning_play_samenvatting && lead.winning_play_bijgewerkt_op) {
      const ouderdom = Date.now() - new Date(lead.winning_play_bijgewerkt_op).getTime();
      if (ouderdom < 30 * 86400_000) {
        return json({ cached: true, samenvatting: lead.winning_play_samenvatting, hoogtepunten: lead.winning_play_hoogtepunten ?? [] });
      }
    }

    const { data: logs } = await admin
      .from("affiliate_opvolg_log")
      .select("actie, titel, created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true })
      .limit(30);

    const cyclusDagen = lead.created_at && lead.updated_at
      ? Math.max(1, Math.floor((new Date(lead.updated_at).getTime() - new Date(lead.created_at).getTime()) / 86400000))
      : null;

    let samenvatting = `Deal met ${lead.bedrijfsnaam} gewonnen na ${cyclusDagen ?? "?"} dagen. ${(lead.notities ?? "").slice(0, 200)}`;
    let hoogtepunten: string[] = ["Snel opgevolgd", "Duidelijke waardepropositie", "Actieve deelname klant"];

    if (lovableKey) {
      const prompt = `Vat samen waarom deze B2B-deal is gewonnen. Antwoord in JSON.
Bedrijf: ${lead.bedrijfsnaam}
Waarde: €${lead.geschatte_waarde ?? 0}
Doorlooptijd: ${cyclusDagen ?? "?"} dagen
Notities: ${(lead.notities ?? "").slice(0, 800)}
AI-context: ${(lead.ai_bedrijf_samenvatting ?? "").slice(0, 400)}
Timeline (${logs?.length ?? 0}): ${(logs ?? []).map((l) => `${l.actie}:${l.titel ?? ""}`).slice(0, 12).join(" | ")}

Geef JSON: { "samenvatting": "2 zinnen wat werkte", "hoogtepunten": ["3-5 concrete acties/argumenten"] }`;
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Je bent een B2B sales-analyst. Alleen valide JSON." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (aiResp.ok) {
        try {
          const j = await aiResp.json();
          const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
          if (typeof parsed.samenvatting === "string") samenvatting = parsed.samenvatting.slice(0, 500);
          if (Array.isArray(parsed.hoogtepunten)) hoogtepunten = parsed.hoogtepunten.map((x: unknown) => String(x)).slice(0, 6);
        } catch (e) { console.error("parse winning-play", e); }
      } else {
        console.error("AI winning-play faalde:", aiResp.status, await aiResp.text());
      }
    }

    await admin
      .from("affiliate_leads")
      .update({ winning_play_samenvatting: samenvatting, winning_play_hoogtepunten: hoogtepunten, winning_play_bijgewerkt_op: new Date().toISOString() })
      .eq("id", leadId);

    return json({ cached: false, samenvatting, hoogtepunten });
  } catch (e) {
    console.error("sales-winning-play", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}