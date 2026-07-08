import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Body = z.object({
  paren: z.array(z.object({
    keep_lead_id: z.string().uuid(),
    merge_lead_id: z.string().uuid(),
  })).min(1).max(500),
  contactpersoon_meenemen: z.boolean().default(true),
});

const RELATED_TABLES = [
  "affiliate_lead_contactmomenten",
  "affiliate_opvolg_taken",
  "affiliate_opvolg_log",
  "affiliate_terugbel_afspraken",
  "affiliate_onboarding_taken",
  "affiliate_referrals",
  "affiliate_commissies",
  "affiliate_lead_contactpersonen",
];

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface LeadRow {
  id: string;
  eigenaar_id: string | null;
  bedrijfsnaam: string | null;
  contactpersoon: string | null;
  email: string | null;
  telefoon: string | null;
  notities: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: userData } = await userClient.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(url, service);
    const { data: rollen } = await admin.from("user_roles").select("role").eq("user_id", userId);
    const rolSet = new Set((rollen ?? []).map((r: { role: string }) => r.role));
    const isAdmin = rolSet.has("superadmin") || rolSet.has("sales_manager") || rolSet.has("sales_admin");

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { paren, contactpersoon_meenemen } = parsed.data;

    const alleIds = Array.from(new Set(paren.flatMap((p) => [p.keep_lead_id, p.merge_lead_id])));
    const { data: leadRows, error: leadErr } = await admin
      .from("affiliate_leads")
      .select("id, eigenaar_id, bedrijfsnaam, contactpersoon, email, telefoon, notities")
      .in("id", alleIds);
    if (leadErr) throw leadErr;
    const byId = new Map<string, LeadRow>((leadRows ?? []).map((l) => [l.id, l as LeadRow]));

    let samengevoegd = 0;
    const overgeslagen: Array<{ pair: { keep_lead_id: string; merge_lead_id: string }; reden: string }> = [];
    // Reeds verwijderde leads bijhouden zodat volgende paren die verwijzen naar dezelfde merge-lead worden overgeslagen.
    const verwijderd = new Set<string>();

    for (const paar of paren) {
      if (paar.keep_lead_id === paar.merge_lead_id) {
        overgeslagen.push({ pair: paar, reden: "identiek" });
        continue;
      }
      if (verwijderd.has(paar.keep_lead_id) || verwijderd.has(paar.merge_lead_id)) {
        overgeslagen.push({ pair: paar, reden: "reeds samengevoegd" });
        continue;
      }
      const keep = byId.get(paar.keep_lead_id);
      const merge = byId.get(paar.merge_lead_id);
      if (!keep || !merge) {
        overgeslagen.push({ pair: paar, reden: "lead ontbreekt" });
        continue;
      }
      if (!isAdmin) {
        if (keep.eigenaar_id !== userId || merge.eigenaar_id !== userId) {
          overgeslagen.push({ pair: paar, reden: "geen toegang" });
          continue;
        }
      }

      // Optioneel: contactpersoon van merge-lead promoveren tot rij in affiliate_lead_contactpersonen
      const heeftAndereContact = contactpersoon_meenemen &&
        (merge.contactpersoon || merge.email || merge.telefoon) &&
        (
          (merge.contactpersoon ?? "").trim().toLowerCase() !==
            (keep.contactpersoon ?? "").trim().toLowerCase()
        );
      if (heeftAndereContact) {
        await admin.from("affiliate_lead_contactpersonen").insert({
          lead_id: keep.id,
          naam: merge.contactpersoon || "Onbekend",
          email: merge.email,
          telefoon_mobiel: merge.telefoon,
          notitie: "Automatisch samengevoegd vanuit duplicaat-lead",
          created_by: userId,
        }).then(() => null, (e) => console.warn("contactpersoon-insert faalde", e.message));
      }

      // Verplaats gerelateerde records
      for (const table of RELATED_TABLES) {
        await admin.from(table).update({ lead_id: keep.id }).eq("lead_id", merge.id)
          .then(() => null, (e) => console.warn(`${table} update faalde`, e.message));
      }

      // Negeerlijst opruimen
      await admin.from("lead_duplicaat_negeerlijst_affiliate")
        .delete()
        .or(`lead_a_id.eq.${merge.id},lead_b_id.eq.${merge.id}`);

      // Merge-lead verwijderen
      const { error: delErr } = await admin.from("affiliate_leads").delete().eq("id", merge.id);
      if (delErr) {
        overgeslagen.push({ pair: paar, reden: delErr.message });
        continue;
      }
      verwijderd.add(merge.id);
      samengevoegd++;

      await admin.from("audit_log").insert({
        actor_id: userId,
        target_user_id: keep.eigenaar_id,
        actie: "affiliate_lead_bulk_samengevoegd",
        entity_type: "affiliate_leads",
        entity_id: keep.id,
        nieuwe_waarde: { keep_lead_id: keep.id, merge_lead_id: merge.id },
      }).then(() => null, () => null);
    }

    return json({ ok: true, samengevoegd, overgeslagen });
  } catch (e) {
    console.error("affiliate-lead-merge-bulk", e);
    return json({ error: e instanceof Error ? e.message : "fout" }, 500);
  }
});