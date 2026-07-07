import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Scoort deal-risico op één lead (groen/oranje/rood) + reden + next step.
// Slaat op in `affiliate_leads`. Vereist superadmin/sales_manager of eigenaar.
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
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const uid = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const leadId: string | undefined = body?.lead_id;
    if (!leadId) return json({ error: "lead_id vereist" }, 400);

    const admin = createClient(url, serviceKey);

    const { data: rollen } = await admin.from("user_roles").select("rol").eq("user_id", uid);
    const { data: prof } = await admin.from("users").select("rol").eq("id", uid).single();
    const rolSet = new Set((rollen ?? []).map((r: { rol: string }) => r.rol));
    if (prof?.rol) rolSet.add(prof.rol);

    const { data: lead, error: leadErr } = await admin
      .from("affiliate_leads")
      .select(
        "id, bedrijfsnaam, eigenaar_id, temperatuur, sales_fase, fase_slug, geschatte_waarde, updated_at, volgende_actie_op, notities, ai_score, ai_score_reden, ai_bedrijf_samenvatting"
      )
      .eq("id", leadId)
      .single();
    if (leadErr || !lead) return json({ error: "Lead niet gevonden" }, 404);

    const mag = rolSet.has("superadmin") || rolSet.has("sales_manager") || lead.eigenaar_id === uid;
    if (!mag) return json({ error: "Forbidden" }, 403);

    const { data: logs } = await admin
      .from("affiliate_opvolg_log")
      .select("actie, titel, created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(15);

    const dagenStil = lead.updated_at
      ? Math.floor((Date.now() - new Date(lead.updated_at).getTime()) / 86400000)
      : 999;
    const nextTeLaat = lead.volgende_actie_op && new Date(lead.volgende_actie_op).getTime() < Date.now();

    // Rule-based fallback
    const ruleBased = () => {
      let score: "groen" | "oranje" | "rood" = "groen";
      const redenen: string[] = [];
      if (dagenStil > 21) { score = "rood"; redenen.push(`${dagenStil} dagen geen contact`); }
      else if (dagenStil > 10) { score = score === "rood" ? "rood" : "oranje"; redenen.push(`${dagenStil} dagen geen contact`); }
      if (nextTeLaat) { score = "rood"; redenen.push("volgende actie is verstreken"); }
      if (lead.temperatuur === "koud") { redenen.push("warmte is koud"); }
      if ((logs?.length ?? 0) === 0) { redenen.push("geen contactmomenten gelogd"); }
      return {
        risico_score: score,
        risico_reden: redenen.join("; ") || "Geen risico-signalen",
        risico_next_step: nextTeLaat ? "Bel vandaag en herschik volgende actie" : dagenStil > 10 ? "Neem contact op deze week" : "Blijf opvolgen volgens plan",
      };
    };

    let result: { risico_score: string; risico_reden: string; risico_next_step: string };

    if (lovableKey) {
      const prompt = `Bepaal deal-risico voor deze B2B-lead. Antwoord in JSON.
Lead:
- Bedrijf: ${lead.bedrijfsnaam}
- Fase: ${lead.fase_slug ?? lead.sales_fase}
- Warmte: ${lead.temperatuur}
- Waarde: €${lead.geschatte_waarde ?? 0}
- Dagen sinds update: ${dagenStil}
- Volgende actie te laat: ${nextTeLaat ? "ja" : "nee"}
- AI lead-score: ${lead.ai_score ?? "n.v.t."} (${lead.ai_score_reden ?? ""})
- Notities: ${(lead.notities ?? "").slice(0, 500)}
- Recente activiteit (${logs?.length ?? 0}): ${(logs ?? []).map((l) => `${l.actie}:${l.titel ?? ""}`).slice(0, 8).join(" | ")}

Geef JSON: { "risico_score": "groen"|"oranje"|"rood", "risico_reden": "1 zin waarom", "risico_next_step": "1 concrete actie voor deze week" }`;

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Je bent een B2B sales-coach. Antwoord uitsluitend in valide JSON." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!aiResp.ok) {
        console.error("AI risico faalde:", aiResp.status, await aiResp.text());
        result = ruleBased();
      } else {
        try {
          const j = await aiResp.json();
          const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
          const score = ["groen", "oranje", "rood"].includes(parsed.risico_score) ? parsed.risico_score : "oranje";
          result = {
            risico_score: score,
            risico_reden: String(parsed.risico_reden ?? "").slice(0, 300),
            risico_next_step: String(parsed.risico_next_step ?? "").slice(0, 300),
          };
        } catch (e) {
          console.error("Parse risico:", e);
          result = ruleBased();
        }
      }
    } else {
      result = ruleBased();
    }

    await admin
      .from("affiliate_leads")
      .update({ ...result, risico_bijgewerkt_op: new Date().toISOString() })
      .eq("id", leadId);

    return json({ ...result });
  } catch (e) {
    console.error("sales-deal-risico", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}