// Synchroniseer één entiteit (schouw/installatie/afspraak/taak) naar Google Agenda
// Wordt aangeroepen door DB-triggers via pg_net of handmatig vanuit het platform
import {
  adminClient,
  buildEventBody,
  corsHeaders,
  EntiteitData,
  gcalFetch,
  GoogleAccount,
  hashEntiteit,
} from "../_shared/google-calendar.ts";

interface PushRequest {
  user_id: string;
  entiteit_type: "schouw" | "installatie" | "afspraak" | "taak";
  entiteit_id: string;
  actie: "upsert" | "delete";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as PushRequest;
    if (!body.user_id || !body.entiteit_type || !body.entiteit_id) {
      return json({ error: "Ongeldige parameters" }, 400);
    }

    const admin = adminClient();

    // Account ophalen
    const { data: account } = await admin
      .from("google_calendar_accounts")
      .select("*")
      .eq("user_id", body.user_id)
      .eq("actief", true)
      .maybeSingle();
    if (!account) return json({ skipped: "geen actieve koppeling" });

    if (!isSyncEnabled(account as GoogleAccount, body.entiteit_type)) {
      return json({ skipped: "type uitgeschakeld" });
    }

    // Bestaande mapping zoeken
    const { data: mapping } = await admin
      .from("google_calendar_event_mapping")
      .select("*")
      .eq("user_id", body.user_id)
      .eq("entiteit_type", body.entiteit_type)
      .eq("entiteit_id", body.entiteit_id)
      .maybeSingle();

    if (body.actie === "delete") {
      if (mapping) {
        await gcalFetch(account as GoogleAccount, `/calendars/${encodeURIComponent(account.calendar_id)}/events/${mapping.google_event_id}`, { method: "DELETE" });
        await admin.from("google_calendar_event_mapping").delete().eq("id", mapping.id);
      }
      return json({ ok: true, deleted: true });
    }

    const entiteit = await laadEntiteit(admin, body.entiteit_type, body.entiteit_id);
    if (!entiteit) return json({ skipped: "entiteit niet gevonden" });

    const hash = await hashEntiteit(entiteit);
    if (mapping && mapping.laatste_hash === hash) {
      return json({ skipped: "ongewijzigd" });
    }

    const eventBody = buildEventBody(entiteit);
    let googleEventId = mapping?.google_event_id;
    let etag: string | null = null;

    if (googleEventId) {
      const resp = await gcalFetch(
        account as GoogleAccount,
        `/calendars/${encodeURIComponent(account.calendar_id)}/events/${googleEventId}`,
        { method: "PATCH", body: JSON.stringify(eventBody) },
      );
      if (resp.status === 404) {
        googleEventId = undefined; // event handmatig verwijderd in Google → opnieuw aanmaken
      } else if (!resp.ok) {
        const txt = await resp.text();
        await markeerFout(admin, account.id, `Patch fout ${resp.status}: ${txt.slice(0, 200)}`);
        return json({ error: `Google patch fout: ${resp.status}` }, 500);
      } else {
        const data = await resp.json();
        etag = data.etag;
      }
    }

    if (!googleEventId) {
      const resp = await gcalFetch(
        account as GoogleAccount,
        `/calendars/${encodeURIComponent(account.calendar_id)}/events`,
        { method: "POST", body: JSON.stringify(eventBody) },
      );
      if (!resp.ok) {
        const txt = await resp.text();
        await markeerFout(admin, account.id, `Insert fout ${resp.status}: ${txt.slice(0, 200)}`);
        return json({ error: `Google insert fout: ${resp.status}` }, 500);
      }
      const data = await resp.json();
      googleEventId = data.id;
      etag = data.etag;
    }

    await admin.from("google_calendar_event_mapping").upsert({
      user_id: body.user_id,
      partner_id: account.partner_id,
      entiteit_type: body.entiteit_type,
      entiteit_id: body.entiteit_id,
      google_event_id: googleEventId!,
      google_etag: etag,
      laatste_hash: hash,
      laatste_sync_op: new Date().toISOString(),
    }, { onConflict: "user_id,entiteit_type,entiteit_id" });

    await admin
      .from("google_calendar_accounts")
      .update({ laatst_gesynchroniseerd_op: new Date().toISOString(), laatste_fout: null })
      .eq("id", account.id);

    return json({ ok: true, google_event_id: googleEventId });
  } catch (e) {
    console.error("sync-push fout", e);
    return json({ error: e instanceof Error ? e.message : "Onbekende fout" }, 500);
  }
});

function isSyncEnabled(a: GoogleAccount, type: string): boolean {
  switch (type) {
    case "schouw": return a.sync_schouwen;
    case "installatie": return a.sync_installaties;
    case "afspraak": return a.sync_afspraken;
    case "taak": return a.sync_taken;
    default: return false;
  }
}

async function markeerFout(admin: ReturnType<typeof adminClient>, accountId: string, fout: string) {
  await admin
    .from("google_calendar_accounts")
    .update({ laatste_fout: fout })
    .eq("id", accountId);
}

async function laadEntiteit(
  admin: ReturnType<typeof adminClient>,
  type: string,
  id: string,
): Promise<EntiteitData | null> {
  if (type === "schouw") {
    const { data } = await admin
      .from("schouwen")
      .select("id, partner_id, schouw_nummer, consument_naam, consument_adres, geplande_datum, geplande_starttijd, geplande_eindtijd, status, categorie")
      .eq("id", id).maybeSingle();
    if (!data?.geplande_datum) return null;
    return {
      type: "schouw", id: data.id, partner_id: data.partner_id,
      titel: `Schouw – ${data.consument_naam || data.schouw_nummer}`,
      beschrijving: `Status: ${data.status}\nCategorie: ${data.categorie}\nNr: ${data.schouw_nummer}`,
      locatie: data.consument_adres || undefined,
      datum: data.geplande_datum,
      start_tijd: (data as any).geplande_starttijd ?? null,
      eind_tijd: (data as any).geplande_eindtijd ?? null,
      status: data.status,
    };
  }
  if (type === "installatie") {
    const { data } = await admin
      .from("installaties")
      .select("id, partner_id, installatienummer, consument_naam, consument_adres, geplande_startdatum, geplande_einddatum, geplande_starttijd, geplande_eindtijd, status")
      .eq("id", id).maybeSingle();
    if (!data?.geplande_startdatum) return null;
    return {
      type: "installatie", id: data.id, partner_id: data.partner_id,
      titel: `Installatie – ${data.consument_naam || data.installatienummer}`,
      beschrijving: `Status: ${data.status}\nNr: ${data.installatienummer}`,
      locatie: data.consument_adres || undefined,
      datum: data.geplande_startdatum,
      eind_datum: data.geplande_einddatum,
      start_tijd: (data as any).geplande_starttijd ?? null,
      eind_tijd: (data as any).geplande_eindtijd ?? null,
      status: data.status,
    };
  }
  if (type === "afspraak") {
    const { data } = await admin
      .from("afspraken")
      .select("id, partner_id, titel, beschrijving, locatie, datum, start_tijd, eind_tijd, status, type")
      .eq("id", id).maybeSingle();
    if (!data?.datum) return null;
    const prefix = data.type === "op_afstand" ? "📹 " : data.type === "belafspraak" ? "📞 " : "";
    return {
      type: "afspraak", id: data.id, partner_id: data.partner_id,
      titel: `${prefix}${data.titel}`,
      beschrijving: data.beschrijving || `Type: ${data.type}\nStatus: ${data.status}`,
      locatie: data.locatie || undefined,
      datum: data.datum,
      start_tijd: data.start_tijd,
      eind_tijd: data.eind_tijd,
      status: data.status,
    };
  }
  if (type === "taak") {
    const { data } = await admin
      .from("helpdesk_ticket_taken")
      .select("id, partner_id, titel, beschrijving, geplande_datum, geplande_starttijd, geplande_eindtijd, status, ticket_id, inplannen_in_agenda")
      .eq("id", id).maybeSingle();
    if (!data?.geplande_datum || data.inplannen_in_agenda === false) return null;
    return {
      type: "taak", id: data.id, partner_id: data.partner_id,
      titel: `✔ Taak – ${data.titel}`,
      beschrijving: data.beschrijving || `Status: ${data.status}${data.ticket_id ? "\nTicket: " + data.ticket_id : ""}`,
      datum: data.geplande_datum,
      start_tijd: data.geplande_starttijd,
      eind_tijd: data.geplande_eindtijd,
      status: data.status,
    };
  }
  return null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}