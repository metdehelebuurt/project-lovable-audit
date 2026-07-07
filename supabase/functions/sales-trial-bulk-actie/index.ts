import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Bulk-acties op trials voor sales managers.
// Ondersteunde acties:
//   verleng      { dagen: number }          → schuift trial_einddatum
//   opgevolgd    { notitie?: string }       → prepend "[YYYY-MM-DD naam] opgevolgd..." aan partners.notities
//   markeer_verloren { reden?: string }     → zet status = 'trial_verlopen'
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const uid = userData.user.id;

    const admin = createClient(url, serviceKey);

    const { data: rollen } = await admin.from("user_roles").select("rol").eq("user_id", uid);
    const rolSet = new Set((rollen ?? []).map((r: { rol: string }) => r.rol));
    const mag = rolSet.has("superadmin") || rolSet.has("sales_manager") || rolSet.has("sales_admin");
    if (!mag) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const actie = String(body?.actie ?? "");
    const ids: string[] = Array.isArray(body?.partner_ids) ? body.partner_ids.filter((x: unknown) => typeof x === "string") : [];
    if (!actie) return json({ error: "actie vereist" }, 400);
    if (ids.length === 0) return json({ error: "partner_ids vereist" }, 400);
    if (ids.length > 200) return json({ error: "Maximaal 200 partners per actie" }, 400);

    const { data: profielRow } = await admin.from("users").select("voornaam, achternaam, email").eq("id", uid).maybeSingle();
    const actorNaam = [profielRow?.voornaam, profielRow?.achternaam].filter(Boolean).join(" ").trim() || profielRow?.email || "sales-manager";

    if (actie === "verleng") {
      const dagen = Math.max(1, Math.min(180, Number(body?.dagen ?? 14)));
      const { data: rows, error } = await admin
        .from("partners")
        .select("id, trial_einddatum")
        .in("id", ids);
      if (error) throw error;
      const updates = (rows ?? []).map((r: { id: string; trial_einddatum: string | null }) => {
        const basis = r.trial_einddatum ? new Date(r.trial_einddatum) : new Date();
        if (basis.getTime() < Date.now()) basis.setTime(Date.now());
        basis.setDate(basis.getDate() + dagen);
        return admin
          .from("partners")
          .update({ trial_einddatum: basis.toISOString().slice(0, 10) })
          .eq("id", r.id);
      });
      await Promise.all(updates);
      return json({ ok: true, verwerkt: updates.length, actie, dagen });
    }

    if (actie === "opgevolgd") {
      const notitie = String(body?.notitie ?? "opgevolgd door sales").slice(0, 500);
      const stempel = `[${new Date().toISOString().slice(0, 10)} · ${actorNaam}] ${notitie}`;
      const { data: rows, error } = await admin
        .from("partners")
        .select("id, notities")
        .in("id", ids);
      if (error) throw error;
      const updates = (rows ?? []).map((r: { id: string; notities: string | null }) => {
        const nieuw = r.notities ? `${stempel}\n${r.notities}` : stempel;
        return admin.from("partners").update({ notities: nieuw }).eq("id", r.id);
      });
      await Promise.all(updates);
      return json({ ok: true, verwerkt: updates.length, actie });
    }

    if (actie === "markeer_verloren") {
      const reden = String(body?.reden ?? "trial verlopen zonder conversie").slice(0, 300);
      const stempel = `[${new Date().toISOString().slice(0, 10)} · ${actorNaam}] verloren: ${reden}`;
      const { data: rows, error } = await admin
        .from("partners")
        .select("id, notities")
        .in("id", ids);
      if (error) throw error;
      const updates = (rows ?? []).map((r: { id: string; notities: string | null }) => {
        const nieuw = r.notities ? `${stempel}\n${r.notities}` : stempel;
        return admin.from("partners").update({ status: "trial_verlopen", notities: nieuw }).eq("id", r.id);
      });
      await Promise.all(updates);
      return json({ ok: true, verwerkt: updates.length, actie });
    }

    return json({ error: `Onbekende actie: ${actie}` }, 400);
  } catch (e) {
    console.error("sales-trial-bulk-actie", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}