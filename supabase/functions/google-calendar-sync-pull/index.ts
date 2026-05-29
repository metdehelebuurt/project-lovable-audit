// Trekt wijzigingen uit Google Agenda terug naar het platform
// Incremental sync via syncToken; init bij eerste keer met timeMin
import {
  adminClient,
  corsHeaders,
  gcalFetch,
  GoogleAccount,
} from "../_shared/google-calendar.ts";

interface PullRequest {
  user_id?: string; // als opgegeven: alleen die account
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: PullRequest = await req.json().catch(() => ({}));
    const admin = adminClient();

    let query = admin.from("google_calendar_accounts").select("*").eq("actief", true);
    if (body.user_id) query = query.eq("user_id", body.user_id);
    const { data: accounts } = await query;

    if (!accounts?.length) return json({ ok: true, accounts: 0 });

    let totaal = 0;
    for (const account of accounts) {
      try {
        totaal += await syncAccount(admin, account as GoogleAccount);
      } catch (e) {
        console.error(`Pull fout ${account.id}`, e);
        await admin.from("google_calendar_accounts")
          .update({ laatste_fout: e instanceof Error ? e.message : "fout" })
          .eq("id", account.id);
      }
    }
    return json({ ok: true, accounts: accounts.length, gewijzigd: totaal });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Onbekende fout" }, 500);
  }
});

async function syncAccount(admin: ReturnType<typeof adminClient>, account: GoogleAccount): Promise<number> {
  let pageToken: string | undefined;
  let newSyncToken: string | null = null;
  let totaal = 0;

  do {
    const params = new URLSearchParams();
    if (account.sync_token) {
      params.set("syncToken", account.sync_token);
    } else {
      params.set("timeMin", new Date(Date.now() - 7 * 86400_000).toISOString());
      params.set("singleEvents", "true");
    }
    if (pageToken) params.set("pageToken", pageToken);
    params.set("maxResults", "250");

    const resp = await gcalFetch(
      account,
      `/calendars/${encodeURIComponent(account.calendar_id)}/events?${params.toString()}`,
    );
    if (resp.status === 410) {
      // syncToken verlopen → reset en herstart
      await admin.from("google_calendar_accounts").update({ sync_token: null }).eq("id", account.id);
      account.sync_token = null;
      return await syncAccount(admin, account);
    }
    if (!resp.ok) throw new Error(`Pull HTTP ${resp.status}`);
    const data = await resp.json();

    for (const ev of data.items || []) {
      totaal += await verwerkEvent(admin, account, ev);
    }

    pageToken = data.nextPageToken;
    if (data.nextSyncToken) newSyncToken = data.nextSyncToken;
  } while (pageToken);

  await admin.from("google_calendar_accounts").update({
    sync_token: newSyncToken || account.sync_token,
    laatst_gesynchroniseerd_op: new Date().toISOString(),
    laatste_fout: null,
  }).eq("id", account.id);

  return totaal;
}

async function verwerkEvent(
  admin: ReturnType<typeof adminClient>,
  account: GoogleAccount,
  ev: Record<string, unknown>,
): Promise<number> {
  const eventId = ev.id as string;
  if (!eventId) return 0;

  // Zoek mapping
  const { data: mapping } = await admin
    .from("google_calendar_event_mapping")
    .select("*")
    .eq("user_id", account.user_id)
    .eq("google_event_id", eventId)
    .maybeSingle();

  if (!mapping) return 0; // event niet door ons aangemaakt

  // Verwijderd in Google?
  if (ev.status === "cancelled") {
    await admin.from("google_calendar_event_mapping").delete().eq("id", mapping.id);
    await markeerExternGeannuleerd(admin, mapping.entiteit_type, mapping.entiteit_id);
    return 1;
  }

  // Tijd gewijzigd?
  const start = (ev as any).start;
  if (!start) return 0;
  const isAllDay = !!start.date;
  const startDate = isAllDay ? start.date : (start.dateTime as string).slice(0, 10);
  const startTime = isAllDay ? null : (start.dateTime as string).slice(11, 16);
  const end = (ev as any).end;
  const endTime = isAllDay || !end?.dateTime ? null : (end.dateTime as string).slice(11, 16);

  await updateEntiteitTijd(admin, mapping.entiteit_type, mapping.entiteit_id, startDate, startTime, endTime);

  await admin.from("google_calendar_event_mapping").update({
    google_etag: ev.etag as string,
    laatste_sync_op: new Date().toISOString(),
  }).eq("id", mapping.id);

  return 1;
}

async function markeerExternGeannuleerd(
  admin: ReturnType<typeof adminClient>,
  type: string, id: string,
) {
  const tabel = { schouw: "schouwen", installatie: "installaties", afspraak: "afspraken", taak: "helpdesk_ticket_taken" }[type];
  if (!tabel) return;
  // Voor afspraken zetten we status op 'geannuleerd', voor anderen alleen notitie via update_at trigger – we doen geen harde wijziging om dataverlies te voorkomen
  if (tabel === "afspraken") {
    await admin.from("afspraken").update({ status: "geannuleerd" }).eq("id", id);
  }
}

async function updateEntiteitTijd(
  admin: ReturnType<typeof adminClient>,
  type: string, id: string,
  datum: string, startTijd: string | null, eindTijd: string | null,
) {
  if (type === "schouw") {
    const upd: Record<string, unknown> = { geplande_datum: datum };
    if (startTijd) upd.geplande_starttijd = startTijd;
    if (eindTijd) upd.geplande_eindtijd = eindTijd;
    await admin.from("schouwen").update(upd).eq("id", id);
  } else if (type === "installatie") {
    const upd: Record<string, unknown> = { geplande_startdatum: datum };
    if (startTijd) upd.geplande_starttijd = startTijd;
    if (eindTijd) upd.geplande_eindtijd = eindTijd;
    await admin.from("installaties").update(upd).eq("id", id);
  } else if (type === "afspraak") {
    const upd: Record<string, unknown> = { datum };
    upd.start_tijd = startTijd;
    upd.eind_tijd = eindTijd;
    await admin.from("afspraken").update(upd).eq("id", id);
  } else if (type === "taak") {
    const upd: Record<string, unknown> = { geplande_datum: datum };
    if (startTijd) upd.geplande_starttijd = startTijd;
    if (eindTijd) upd.geplande_eindtijd = eindTijd;
    await admin.from("helpdesk_ticket_taken").update(upd).eq("id", id);
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}