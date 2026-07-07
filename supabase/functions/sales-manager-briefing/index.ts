import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Genereert een dagelijkse AI-briefing voor de ingelogde sales manager en cachet
// het resultaat in `sales_briefings` (één rij per gebruiker per dag).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const uid = userData.user.id;

    const admin = createClient(url, serviceKey);

    const { data: rollen } = await admin
      .from("user_roles")
      .select("rol")
      .eq("user_id", uid);
    const rolSet = new Set((rollen ?? []).map((r: { rol: string }) => r.rol));
    const { data: prof } = await admin.from("users").select("rol").eq("id", uid).single();
    if (prof?.rol) rolSet.add(prof.rol);
    const mag = rolSet.has("superadmin") || rolSet.has("sales_manager");
    if (!mag) return json({ error: "Forbidden" }, 403);

    const vandaag = new Date().toISOString().slice(0, 10);
    const force = new URL(req.url).searchParams.get("force") === "1";

    if (!force) {
      const { data: cached } = await admin
        .from("sales_briefings")
        .select("inhoud, created_at")
        .eq("gebruiker_id", uid)
        .eq("datum", vandaag)
        .maybeSingle();
      if (cached?.inhoud) return json({ briefing: cached.inhoud, cached: true });
    }

    // Verzamel team-data
    const nu = Date.now();
    const grens7d = new Date(nu - 7 * 86400000).toISOString();

    const [leadsResp, opvolgResp, terugbelResp] = await Promise.all([
      admin
        .from("affiliate_leads")
        .select("id, bedrijfsnaam, eigenaar_id, fase_slug, temperatuur, geschatte_waarde, updated_at, volgende_actie_op")
        .limit(2000),
      admin
        .from("affiliate_opvolg_log")
        .select("affiliate_id, actie, created_at")
        .gte("created_at", grens7d)
        .limit(2000),
      admin
        .from("affiliate_terugbel_afspraken")
        .select("affiliate_id, geplande_op, afgehandeld_op")
        .gte("geplande_op", grens7d)
        .limit(1000),
    ]);

    const leads = leadsResp.data ?? [];
    const opvolg = opvolgResp.data ?? [];
    const terugbel = terugbelResp.data ?? [];

    // Per rep aggregatie
    const perRep = new Map<string, { totaal: number; waarde: number; stil7d: number; nextActieTeLaat: number; heet: number; activiteit: number }>();
    for (const l of leads) {
      const id = l.eigenaar_id ?? "platform";
      const s = perRep.get(id) ?? { totaal: 0, waarde: 0, stil7d: 0, nextActieTeLaat: 0, heet: 0, activiteit: 0 };
      s.totaal += 1;
      s.waarde += Number(l.geschatte_waarde ?? 0);
      if (l.updated_at && new Date(l.updated_at).getTime() < nu - 7 * 86400000) s.stil7d += 1;
      if (l.volgende_actie_op && new Date(l.volgende_actie_op).getTime() < nu) s.nextActieTeLaat += 1;
      if (l.temperatuur === "heet" || l.temperatuur === "warm") s.heet += 1;
      perRep.set(id, s);
    }
    for (const o of opvolg) {
      const id = o.affiliate_id ?? "platform";
      const s = perRep.get(id);
      if (s) s.activiteit += 1;
    }

    const repIds = Array.from(perRep.keys()).filter((k) => k !== "platform");
    const { data: repUsers } = repIds.length
      ? await admin.from("users").select("id, voornaam, achternaam").in("id", repIds)
      : { data: [] as { id: string; voornaam: string | null; achternaam: string | null }[] };
    const nameMap = new Map((repUsers ?? []).map((u) => [u.id, `${u.voornaam ?? ""} ${u.achternaam ?? ""}`.trim() || "Onbekend"]));

    const repSamenvatting = Array.from(perRep.entries()).map(([id, s]) => ({
      rep: id === "platform" ? "Platform (ongewezen)" : nameMap.get(id) ?? "Onbekend",
      ...s,
    }));

    const totaalWaarde = leads.reduce((sum, l) => sum + Number(l.geschatte_waarde ?? 0), 0);
    const totaalStil = repSamenvatting.reduce((sum, r) => sum + r.stil7d, 0);
    const trialsBinnenkort = terugbel.length;

    const context = {
      totaal_leads: leads.length,
      totaal_waarde: Math.round(totaalWaarde),
      totaal_stil_7d: totaalStil,
      terugbel_afspraken_komende_week: trialsBinnenkort,
      per_rep: repSamenvatting,
    };

    if (!lovableKey) {
      // Fallback: rule-based samenvatting
      const fallback = {
        headline: `${leads.length} actieve leads · €${Math.round(totaalWaarde / 1000)}k in pipeline`,
        highlights: [
          `${totaalStil} leads zijn al 7+ dagen stil`,
          `${trialsBinnenkort} terugbel-afspraken komende week`,
          `Top-rep: ${[...repSamenvatting].sort((a, b) => b.waarde - a.waarde)[0]?.rep ?? "n.v.t."}`,
        ],
        acties: ["Bekijk stille leads", "Herverdeel platform-leads", "Neem risico-leads door"],
        context,
      };
      await admin.from("sales_briefings").upsert({ gebruiker_id: uid, datum: vandaag, inhoud: fallback });
      return json({ briefing: fallback, cached: false });
    }

    const prompt = `Je bent een sales-coach voor de sales-manager van een Nederlands SaaS-platform.
Geef een korte, actiegerichte ochtendbriefing (max 6 zinnen) in het Nederlands.
Data over het team van vandaag:
${JSON.stringify(context, null, 2)}

Geef terug in JSON met velden:
- headline: 1 zin met belangrijkste stand van zaken
- highlights: array van 3 bullets (kort, concreet, met getallen)
- acties: array van 3 concrete acties die de manager vandaag moet doen (kort, imperatief)`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Wees kort, scherp en concreet. Antwoord in valide JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const body = await aiResp.text();
      console.error("AI gateway failed:", aiResp.status, body);
      return json({ error: "AI request failed", status: aiResp.status, details: body }, aiResp.status);
    }

    const aiJson = await aiResp.json();
    let parsed: unknown = {};
    try {
      parsed = JSON.parse(aiJson.choices?.[0]?.message?.content ?? "{}");
    } catch (e) {
      console.error("AI JSON parse failed:", e);
    }
    const briefing = { ...(parsed as Record<string, unknown>), context };

    await admin
      .from("sales_briefings")
      .upsert({ gebruiker_id: uid, datum: vandaag, inhoud: briefing });

    return json({ briefing, cached: false });
  } catch (e) {
    console.error("sales-manager-briefing", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}