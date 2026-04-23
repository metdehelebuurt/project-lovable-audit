import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatDate(d: string): string {
  return d.replace(/-/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Missing token", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, partner_id")
    .eq("ical_token", token)
    .single();

  if (userErr || !user) {
    return new Response("Invalid token", { status: 403 });
  }

  const now = new Date();
  const sixMonthsLater = new Date(now);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
  const startStr = now.toISOString().slice(0, 10);
  const endStr = sixMonthsLater.toISOString().slice(0, 10);

  const [schouwen, installaties, afspraken, taken] = await Promise.all([
    supabase.from("schouwen")
      .select("id, geplande_datum, consument_naam, schouw_nummer, status, categorie")
      .eq("partner_id", user.partner_id)
      .gte("geplande_datum", startStr)
      .lte("geplande_datum", endStr),
    supabase.from("installaties")
      .select("id, geplande_startdatum, geplande_einddatum, consument_naam, status")
      .eq("partner_id", user.partner_id)
      .gte("geplande_startdatum", startStr)
      .lte("geplande_startdatum", endStr),
    supabase.from("afspraken")
      .select("id, datum, titel, type, status, start_tijd, eind_tijd, locatie")
      .eq("partner_id", user.partner_id)
      .gte("datum", startStr)
      .lte("datum", endStr),
    supabase.from("helpdesk_ticket_taken")
      .select("id, titel, geplande_datum, geplande_starttijd, geplande_eindtijd, status, ticket_id, agenda_user_id")
      .eq("partner_id", user.partner_id)
      .eq("inplannen_in_agenda", true)
      .gte("geplande_datum", startStr)
      .lte("geplande_datum", endStr),
  ]);

  const stamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lovable//Planning//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Planning",
  ];

  for (const s of schouwen.data ?? []) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:schouw-${s.id}@planning`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${formatDate(s.geplande_datum)}`,
      `SUMMARY:Schouw - ${s.consument_naam || s.schouw_nummer}`,
      `DESCRIPTION:Status: ${s.status}\\nCategorie: ${s.categorie}\\nNr: ${s.schouw_nummer}`,
      "END:VEVENT",
    );
  }

  for (const i of installaties.data ?? []) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:installatie-${i.id}@planning`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${formatDate(i.geplande_startdatum!)}`,
      ...(i.geplande_einddatum ? [`DTEND;VALUE=DATE:${formatDate(i.geplande_einddatum)}`] : []),
      `SUMMARY:Installatie - ${i.consument_naam || "Installatie"}`,
      `DESCRIPTION:Status: ${i.status}`,
      "END:VEVENT",
    );
  }

  for (const a of afspraken.data ?? []) {
    const dtStart = a.start_tijd
      ? `${formatDate(a.datum)}T${(a.start_tijd as string).replace(/:/g, "").slice(0, 6)}`
      : formatDate(a.datum);
    const dtEnd = a.eind_tijd
      ? `${formatDate(a.datum)}T${(a.eind_tijd as string).replace(/:/g, "").slice(0, 6)}`
      : null;
    const isAllDay = !a.start_tijd;

    lines.push(
      "BEGIN:VEVENT",
      `UID:afspraak-${a.id}@planning`,
      `DTSTAMP:${stamp}`,
      isAllDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
      ...(dtEnd && !isAllDay ? [`DTEND:${dtEnd}`] : []),
      `SUMMARY:${a.type === "op_afstand" ? "📹" : a.type === "belafspraak" ? "📞" : "🏠"} ${a.titel}`,
      `DESCRIPTION:Type: ${a.type}\\nStatus: ${a.status}${a.locatie ? "\\nLocatie: " + a.locatie : ""}`,
      ...(a.locatie ? [`LOCATION:${a.locatie}`] : []),
      "END:VEVENT",
    );
  }

  for (const t of taken.data ?? []) {
    if (!t.geplande_datum) continue;
    const dtStart = t.geplande_starttijd
      ? `${formatDate(t.geplande_datum)}T${(t.geplande_starttijd as string).replace(/:/g, "").slice(0, 6)}`
      : formatDate(t.geplande_datum);
    const dtEnd = t.geplande_eindtijd
      ? `${formatDate(t.geplande_datum)}T${(t.geplande_eindtijd as string).replace(/:/g, "").slice(0, 6)}`
      : null;
    const isAllDay = !t.geplande_starttijd;

    lines.push(
      "BEGIN:VEVENT",
      `UID:taak-${t.id}@planning`,
      `DTSTAMP:${stamp}`,
      isAllDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
      ...(dtEnd && !isAllDay ? [`DTEND:${dtEnd}`] : []),
      `SUMMARY:✔ Taak - ${t.titel}`,
      `DESCRIPTION:Status: ${t.status}${t.ticket_id ? "\\nTicket: " + t.ticket_id : ""}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n"), {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="planning.ics"',
    },
  });
});
