// Backfill: push alle bestaande, relevante entiteiten van een gebruiker
// (schouwen, installaties, afspraken, helpdesk-taken) éénmalig naar Google Agenda.
// Roept hiervoor de bestaande `google-calendar-sync-push` functie aan per item.
import { adminClient, corsHeaders, GoogleAccount } from "../_shared/google-calendar.ts";

interface BackfillRequest {
  user_id?: string;
  // window in dagen — standaard 30 terug, 365 vooruit
  dagen_terug?: number;
  dagen_vooruit?: number;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body: BackfillRequest = await req.json().catch(() => ({}));
    const admin = adminClient();

    // Bepaal welke gebruiker: als user_id meekomt, gebruik die; anders uit JWT
    let userId = body.user_id;
    if (!userId) {
      const auth = req.headers.get("Authorization") || "";
      const token = auth.replace(/^Bearer\s+/i, "");
      if (!token) return json({ error: "Niet ingelogd" }, 401);
      const { data: { user }, error } = await admin.auth.getUser(token);
      if (error || !user) return json({ error: "Ongeldige sessie" }, 401);
      userId = user.id;
    }

    const { data: account } = await admin
      .from("google_calendar_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("actief", true)
      .maybeSingle();
    if (!account) return json({ error: "Geen actieve Google koppeling" }, 400);

    const acc = account as GoogleAccount & Record<string, unknown>;

    const dagenTerug = body.dagen_terug ?? 30;
    const dagenVooruit = body.dagen_vooruit ?? 365;
    const today = new Date();
    const minDate = isoDate(new Date(today.getTime() - dagenTerug * 86400_000));
    const maxDate = isoDate(new Date(today.getTime() + dagenVooruit * 86400_000));

    const tasks: Array<{ type: "schouw" | "installatie" | "afspraak" | "taak"; id: string }> = [];

    if (acc.sync_schouwen) {
      const { data } = await admin
        .from("schouwen")
        .select("id")
        .or(`adviseur_id.eq.${userId},installateur_id.eq.${userId}`)
        .not("geplande_datum", "is", null)
        .gte("geplande_datum", minDate)
        .lte("geplande_datum", maxDate);
      for (const r of data || []) tasks.push({ type: "schouw", id: r.id });
    }

    if (acc.sync_installaties) {
      const { data } = await admin
        .from("installaties")
        .select("id")
        .or(`installateur_id.eq.${userId},backoffice_eigenaar_id.eq.${userId}`)
        .not("geplande_startdatum", "is", null)
        .gte("geplande_startdatum", minDate)
        .lte("geplande_startdatum", maxDate);
      for (const r of data || []) tasks.push({ type: "installatie", id: r.id });
    }

    if (acc.sync_afspraken || acc.sync_handmatig) {
      const { data } = await admin
        .from("afspraken")
        .select("id")
        .eq("adviseur_id", userId)
        .gte("datum", minDate)
        .lte("datum", maxDate);
      for (const r of data || []) tasks.push({ type: "afspraak", id: r.id });
    }

    if (acc.sync_taken) {
      const { data } = await admin
        .from("helpdesk_ticket_taken")
        .select("id")
        .or(`toegewezen_aan.eq.${userId},agenda_user_id.eq.${userId}`)
        .eq("inplannen_in_agenda", true)
        .not("geplande_datum", "is", null)
        .gte("geplande_datum", minDate)
        .lte("geplande_datum", maxDate);
      for (const r of data || []) tasks.push({ type: "taak", id: r.id });
    }

    let gelukt = 0;
    let overgeslagen = 0;
    let mislukt = 0;
    const fouten: string[] = [];

    // Sequentieel om Google rate limits te respecteren
    for (const t of tasks) {
      try {
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-sync-push`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_ROLE}`,
          },
          body: JSON.stringify({
            user_id: userId,
            entiteit_type: t.type,
            entiteit_id: t.id,
            actie: "upsert",
          }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || data?.error) {
          mislukt++;
          if (fouten.length < 5) fouten.push(`${t.type} ${t.id}: ${data?.error || resp.status}`);
        } else if (data?.skipped) {
          overgeslagen++;
        } else {
          gelukt++;
        }
      } catch (e) {
        mislukt++;
        if (fouten.length < 5) fouten.push(`${t.type} ${t.id}: ${e instanceof Error ? e.message : "fout"}`);
      }
    }

    return json({
      ok: true,
      totaal: tasks.length,
      gelukt,
      overgeslagen,
      mislukt,
      fouten: fouten.length ? fouten : undefined,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Onbekende fout" }, 500);
  }
});

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}