import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Body = z.object({
  keep_lead_id: z.string().uuid(),
  merge_lead_id: z.string().uuid(),
  lead_values: z.record(z.string(), z.unknown()).optional().default({}),
});

// Tabellen met FK naar affiliate_leads.id via kolom lead_id
const RELATED_TABLES = [
  "affiliate_lead_contactmomenten",
  "affiliate_opvolg_taken",
  "affiliate_opvolg_log",
  "affiliate_terugbel_afspraken",
  "affiliate_onboarding_taken",
  "affiliate_referrals",
  "affiliate_commissies",
];

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: claims } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    const userId = claims?.claims?.sub as string | undefined;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);

    const { keep_lead_id, merge_lead_id, lead_values } = parsed.data;
    if (keep_lead_id === merge_lead_id) {
      return json({ error: "keep_lead_id en merge_lead_id mogen niet gelijk zijn" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Eigenaars-/rol-check
    const { data: leads, error: leadErr } = await admin
      .from("affiliate_leads")
      .select("id, eigenaar_id")
      .in("id", [keep_lead_id, merge_lead_id]);
    if (leadErr) throw leadErr;
    if (!leads || leads.length !== 2) return json({ error: "Lead(s) niet gevonden" }, 404);

    const { data: u } = await admin.from("users").select("rol").eq("id", userId).single();
    const isSuperadmin = u?.rol === "superadmin";

    const eigenaars = new Set(leads.map((l) => l.eigenaar_id));
    if (eigenaars.size > 1 && !isSuperadmin) {
      return json({ error: "Leads horen niet bij dezelfde eigenaar" }, 403);
    }
    const eigenaarId = leads[0].eigenaar_id;
    if (!isSuperadmin && eigenaarId !== userId) {
      return json({ error: "Geen toegang tot deze leads" }, 403);
    }

    // 1. Update keep-lead met gekozen waarden
    const allowedCols = new Set([
      "bedrijfsnaam", "contactpersoon", "email", "telefoon", "branche", "regio",
      "website", "geschatte_waarde", "status", "bron", "volgende_actie_datum",
      "notities", "tags", "adres", "postcode", "plaats", "sales_fase",
      "temperatuur", "ai_score", "ai_score_reden",
    ]);
    const leadUpdate: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(lead_values ?? {})) {
      if (allowedCols.has(k)) leadUpdate[k] = v;
    }
    if (Object.keys(leadUpdate).length > 0) {
      const { error: upErr } = await admin
        .from("affiliate_leads")
        .update({ ...leadUpdate, updated_at: new Date().toISOString() })
        .eq("id", keep_lead_id);
      if (upErr) throw upErr;
    }

    // 2. Verplaats gerelateerde records
    for (const table of RELATED_TABLES) {
      const { error } = await admin.from(table).update({ lead_id: keep_lead_id }).eq("lead_id", merge_lead_id);
      if (error) console.warn(`affiliate-lead-merge: ${table} update faalde`, error.message);
    }

    // 3. Negeerlijst-items voor merge-lead opruimen
    await admin
      .from("lead_duplicaat_negeerlijst_affiliate")
      .delete()
      .or(`lead_a_id.eq.${merge_lead_id},lead_b_id.eq.${merge_lead_id}`);

    // 4. Merge-lead verwijderen
    const { error: delErr } = await admin.from("affiliate_leads").delete().eq("id", merge_lead_id);
    if (delErr) throw delErr;

    // 5. Audit-log
    await admin.from("audit_log").insert({
      actor_id: userId,
      target_user_id: eigenaarId,
      actie: "affiliate_lead_samengevoegd",
      entity_type: "affiliate_leads",
      entity_id: keep_lead_id,
      nieuwe_waarde: { keep_lead_id, merge_lead_id, gekozen_velden: leadUpdate },
    }).then(() => null, () => null);

    return json({ ok: true, kept_lead_id: keep_lead_id });
  } catch (e) {
    console.error("affiliate-lead-merge error", e);
    return json({ error: e instanceof Error ? e.message : "fout" }, 500);
  }
});