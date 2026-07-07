import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Genereert 3-5 coaching-tips per sales-rep. Alleen manager mag draaien.
// Analyseert leads, opvolg-log en risico-signalen van de laatste 30 dagen.
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
    if (!isManager) return json({ error: "Alleen sales managers" }, 403);

    const body = await req.json().catch(() => ({}));
    const repId: string | undefined = body?.rep_id;
    const force: boolean = !!body?.force;
    if (!repId) return json({ error: "rep_id vereist" }, 400);

    // Cache: 1 tip-set per 7 dagen
    if (!force) {
      const grens = new Date(Date.now() - 7 * 86400_000).toISOString();
      const { data: cache } = await admin
        .from("sales_coaching_tips")
        .select("tips, gegenereerd_op, context")
        .eq("eigenaar_id", repId)
        .gte("gegenereerd_op", grens)
        .order("gegenereerd_op", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cache) return json({ cached: true, tips: cache.tips, context: cache.context, gegenereerd_op: cache.gegenereerd_op });
    }

    const grens30 = new Date(Date.now() - 30 * 86400_000).toISOString();
    const [leadsRes, logsRes, snipRes] = await Promise.all([
      admin.from("affiliate_leads")
        .select("id, fase_slug, temperatuur, risico_score, geschatte_waarde, updated_at, volgende_actie_op")
        .eq("eigenaar_id", repId)
        .gte("updated_at", grens30)
        .limit(500),
      admin.from("affiliate_opvolg_log")
        .select("actie, created_at")
        .eq("affiliate_id", repId)
        .gte("created_at", grens30)
        .limit(500),
      admin.from("sales_snippets").select("titel, kanaal, temperatuur").eq("eigenaar_id", repId).limit(50),
    ]);

    const leads = leadsRes.data ?? [];
    const logs = logsRes.data ?? [];
    const nu = Date.now();
    const context = {
      totaal_leads: leads.length,
      stil_7d: leads.filter((l) => l.updated_at && (nu - new Date(l.updated_at).getTime()) > 7 * 86400_000).length,
      te_laat: leads.filter((l) => l.volgende_actie_op && new Date(l.volgende_actie_op).getTime() < nu).length,
      hoog_risico: leads.filter((l) => l.risico_score === "rood").length,
      koud: leads.filter((l) => l.temperatuur === "koud").length,
      activiteit_30d: logs.length,
      actie_verdeling: aggregate(logs.map((l) => l.actie ?? "onbekend")),
      snippets_beschikbaar: snipRes.data?.length ?? 0,
    };

    let tips: Array<{ titel: string; toelichting: string; prioriteit: "hoog" | "midden" | "laag" }> = ruleTips(context);

    if (lovableKey) {
      const prompt = `Geef 3-5 concrete coaching-tips voor deze verkoper op basis van de data. Antwoord JSON.
Data (laatste 30d):
- Actieve leads: ${context.totaal_leads}
- ≥7d stil: ${context.stil_7d}
- Volgende actie te laat: ${context.te_laat}
- Hoog risico (rood): ${context.hoog_risico}
- Koude leads: ${context.koud}
- Aantal activiteiten: ${context.activiteit_30d}
- Actie-verdeling: ${JSON.stringify(context.actie_verdeling)}
- Beschikbare snippets: ${context.snippets_beschikbaar}

Geef JSON: { "tips": [ { "titel": "kort", "toelichting": "1-2 zinnen concreet", "prioriteit": "hoog|midden|laag" } ] }`;
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Je bent een B2B sales-coach. Alleen valide JSON." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (aiResp.ok) {
        try {
          const j = await aiResp.json();
          const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
          if (Array.isArray(parsed.tips) && parsed.tips.length > 0) {
            tips = parsed.tips.slice(0, 5).map((t: { titel?: string; toelichting?: string; prioriteit?: string }) => ({
              titel: String(t.titel ?? "").slice(0, 100),
              toelichting: String(t.toelichting ?? "").slice(0, 400),
              prioriteit: (["hoog", "midden", "laag"].includes(String(t.prioriteit)) ? t.prioriteit : "midden") as "hoog" | "midden" | "laag",
            }));
          }
        } catch (e) { console.error("parse coaching-tip", e); }
      } else {
        console.error("AI coaching-tip faalde:", aiResp.status, await aiResp.text());
      }
    }

    await admin.from("sales_coaching_tips").insert({ eigenaar_id: repId, tips, context });

    return json({ cached: false, tips, context });
  } catch (e) {
    console.error("sales-coaching-tip", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function aggregate(arr: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of arr) out[a] = (out[a] ?? 0) + 1;
  return out;
}

function ruleTips(ctx: { stil_7d: number; te_laat: number; hoog_risico: number; koud: number; activiteit_30d: number; snippets_beschikbaar: number }) {
  const tips: Array<{ titel: string; toelichting: string; prioriteit: "hoog" | "midden" | "laag" }> = [];
  if (ctx.te_laat > 0) tips.push({ titel: `${ctx.te_laat} vervallen acties inhalen`, toelichting: "Werk verstreken volgende-acties vandaag weg om deals warm te houden.", prioriteit: "hoog" });
  if (ctx.hoog_risico > 0) tips.push({ titel: `${ctx.hoog_risico} rode deals aanpakken`, toelichting: "Bel deze week rechtstreeks met een concreet volgende-stap-voorstel.", prioriteit: "hoog" });
  if (ctx.stil_7d > 3) tips.push({ titel: "Reactiveer stille leads", toelichting: `${ctx.stil_7d} leads zijn >7 dagen stil — stuur een korte check-in mail.`, prioriteit: "midden" });
  if (ctx.activiteit_30d < 20) tips.push({ titel: "Activiteitsniveau opvoeren", toelichting: "Streef naar minimaal 20 contactmomenten per maand.", prioriteit: "midden" });
  if (ctx.snippets_beschikbaar < 3) tips.push({ titel: "Meer snippets gebruiken", toelichting: "Voeg standaard bezwaar-antwoorden toe aan je snippet-bibliotheek.", prioriteit: "laag" });
  if (tips.length === 0) tips.push({ titel: "Goed op koers", toelichting: "Geen dringende signalen — hou dit tempo vast en verhoog waar mogelijk pijp-waarde.", prioriteit: "laag" });
  return tips;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}