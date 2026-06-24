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
  eigenschappen_values: z.record(z.string(), z.unknown()).optional().default({}),
});

const RELATED_TABLES = [
  "afspraken",
  "schouwen",
  "offertes",
  "opdrachten",
  "installaties",
  "klanten",
  "daklayouts",
  "email_berichten",
  "lead_contactmomenten",
  "lead_notities",
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
    const { data: userData } = await userClient.auth.getUser(auth.replace("Bearer ", ""));
    const userId = userData?.user?.id;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const { keep_lead_id, merge_lead_id, lead_values, eigenschappen_values } = parsed.data;
    if (keep_lead_id === merge_lead_id) {
      return json({ error: "keep_lead_id en merge_lead_id mogen niet gelijk zijn" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Partner-check
    const { data: leads, error: leadErr } = await admin
      .from("leads")
      .select("id, partner_id")
      .in("id", [keep_lead_id, merge_lead_id]);
    if (leadErr) throw leadErr;
    if (!leads || leads.length !== 2) return json({ error: "Lead(s) niet gevonden" }, 404);
    if (leads[0].partner_id !== leads[1].partner_id) {
      return json({ error: "Leads horen niet bij dezelfde partner" }, 403);
    }

    const { data: u } = await admin.from("users").select("partner_id, rol").eq("id", userId).single();
    const isSuperadmin = u?.rol === "superadmin";
    if (!isSuperadmin && u?.partner_id !== leads[0].partner_id) {
      return json({ error: "Geen toegang tot deze leads" }, 403);
    }

    // 1. Update keep-lead met gekozen waarden
    const allowedLeadCols = new Set([
      "voornaam", "achternaam", "email", "telefoon", "bedrijfsnaam",
      "adres", "postcode", "plaats", "lead_status", "bron", "notities",
      "toegewezen_aan", "owner_user_id",
    ]);
    const leadUpdate: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(lead_values ?? {})) {
      if (allowedLeadCols.has(k)) leadUpdate[k] = v;
    }
    if (Object.keys(leadUpdate).length > 0) {
      const { error: upErr } = await admin.from("leads").update(leadUpdate).eq("id", keep_lead_id);
      if (upErr) throw upErr;
    }

    // 2. Verplaats gerelateerde records
    for (const table of RELATED_TABLES) {
      const { error } = await admin.from(table).update({ lead_id: keep_lead_id }).eq("lead_id", merge_lead_id);
      if (error) {
        console.warn(`lead-merge: ${table} update faalde`, error.message);
      }
    }

    // 3. lead_eigenschappen mergen (unique constraint op lead_id)
    const allowedEigCols = new Set([
      "woningtype", "bouwjaar", "daktype", "dakrichting", "aantal_panelen",
      "huidig_verbruik_kwh", "huidige_energielabel", "gewenst_energielabel",
      "warmtepomp_interesse", "batterij_interesse", "laadpaal_interesse",
      "isolatie_interesse", "extra_json",
    ]);
    const { data: keepEig } = await admin.from("lead_eigenschappen").select("id").eq("lead_id", keep_lead_id).maybeSingle();
    const { data: mergeEig } = await admin.from("lead_eigenschappen").select("id").eq("lead_id", merge_lead_id).maybeSingle();

    const eigUpdate: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(eigenschappen_values ?? {})) {
      if (allowedEigCols.has(k)) eigUpdate[k] = v;
    }

    if (mergeEig && !keepEig) {
      // verplaats merge-rij naar keep-lead
      await admin.from("lead_eigenschappen").update({ lead_id: keep_lead_id, ...eigUpdate }).eq("id", mergeEig.id);
    } else if (mergeEig && keepEig) {
      if (Object.keys(eigUpdate).length > 0) {
        await admin.from("lead_eigenschappen").update(eigUpdate).eq("id", keepEig.id);
      }
      await admin.from("lead_eigenschappen").delete().eq("id", mergeEig.id);
    } else if (!mergeEig && keepEig && Object.keys(eigUpdate).length > 0) {
      await admin.from("lead_eigenschappen").update(eigUpdate).eq("id", keepEig.id);
    }

    // 4. Negeerlijst-items voor het mergen-lead opruimen
    await admin.from("lead_duplicaat_negeerlijst").delete().or(`lead_a_id.eq.${merge_lead_id},lead_b_id.eq.${merge_lead_id}`);

    // 5. Merge-lead verwijderen
    const { error: delErr } = await admin.from("leads").delete().eq("id", merge_lead_id);
    if (delErr) throw delErr;

    // 6. Loggen
    await admin.rpc("log_entity_change", {
      _entiteit_type: "lead",
      _entiteit_id: keep_lead_id,
      _partner_id: leads[0].partner_id,
      _actie: "samengevoegd",
      _veld: null,
      _oude: merge_lead_id,
      _nieuwe: keep_lead_id,
      _details: { reden: "duplicaat" },
    }).then(() => null, () => null);

    return json({ ok: true, kept_lead_id: keep_lead_id });
  } catch (e) {
    console.error("lead-merge error", e);
    return json({ error: e instanceof Error ? e.message : "fout" }, 500);
  }
});