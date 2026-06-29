// Edge function: sales-manager (of superadmin) plant namens een affiliate een afspraak.
// - Maakt een rij in affiliate_terugbel_afspraken (sales-manager wordt collega_user_id).
// - Als affiliate Google heeft gekoppeld én sync_afspraken=true: maakt ook een Google-event
//   namens de affiliate via diens opgeslagen tokens.
// - Bij Google-fout blijft de platform-afspraak staan; google_sync wordt 'failed' gerapporteerd.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  corsHeaders, adminClient, gcalFetch, type GoogleAccount,
} from "../_shared/google-calendar.ts";

interface ReqBody {
  affiliate_id: string;
  lead_id?: string | null;
  type: "terugbel" | "demo";
  geplande_op: string; // ISO datetime
  duur_minuten: number;
  notitie?: string | null;
}

function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function isIso(v: unknown): v is string {
  return typeof v === "string" && !Number.isNaN(Date.parse(v));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    const admin = adminClient();
    const { data: rolCheck } = await admin
      .from("users").select("rol").eq("id", callerId).maybeSingle();
    const rol = rolCheck?.rol;
    if (rol !== "superadmin" && rol !== "sales_manager") {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<ReqBody>;
    if (
      !isUuid(body.affiliate_id) ||
      (body.type !== "terugbel" && body.type !== "demo") ||
      !isIso(body.geplande_op) ||
      typeof body.duur_minuten !== "number" ||
      body.duur_minuten < 5 ||
      body.duur_minuten > 480
    ) {
      return new Response(JSON.stringify({ error: "invalid_input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.lead_id != null && !isUuid(body.lead_id)) {
      return new Response(JSON.stringify({ error: "invalid_input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verifieer dat affiliate bestaat en actief is.
    // Belangrijk: hybride users (bv. partner_admin met additieve affiliate-rol) moeten
    // óók geaccepteerd worden, dus we checken via user_has_role i.p.v. users.rol.
    const { data: aff } = await admin
      .from("users")
      .select("id, voornaam, achternaam, email, partner_id, rol, status")
      .eq("id", body.affiliate_id!)
      .maybeSingle();
    if (!aff || aff.status !== "actief") {
      return new Response(JSON.stringify({ error: "affiliate_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: hasAffiliateRol } = await admin.rpc("user_has_role", {
      _user_id: aff.id, _rol: "affiliate",
    });
    if (!hasAffiliateRol) {
      return new Response(JSON.stringify({ error: "affiliate_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optioneel: leadcheck — moet bestaan
    if (body.lead_id) {
      const { data: lead } = await admin
        .from("affiliate_leads").select("id").eq("id", body.lead_id).maybeSingle();
      if (!lead) {
        return new Response(JSON.stringify({ error: "lead_not_found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Insert platform-afspraak
    const { data: afspraak, error: insErr } = await admin
      .from("affiliate_terugbel_afspraken")
      .insert({
        affiliate_id: body.affiliate_id!,
        lead_id: body.lead_id ?? null,
        type: body.type,
        geplande_op: body.geplande_op!,
        notitie: body.notitie ?? null,
        collega_user_id: callerId,
      })
      .select("*")
      .single();
    if (insErr || !afspraak) {
      return new Response(
        JSON.stringify({ error: "insert_failed", message: insErr?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Probeer Google-sync namens affiliate
    let google_sync: "synced" | "skipped" | "failed" = "skipped";
    let google_error: string | undefined;
    const { data: gcalAcc } = await admin
      .from("google_calendar_accounts")
      .select(
        "id, user_id, partner_id, google_email, calendar_id, access_token, refresh_token, token_expiry, sync_token, channel_id, resource_id, channel_expiry, sync_schouwen, sync_installaties, sync_afspraken, sync_taken, sync_handmatig, actief",
      )
      .eq("user_id", body.affiliate_id!)
      .eq("actief", true)
      .maybeSingle();

    if (gcalAcc && gcalAcc.sync_afspraken) {
      try {
        const startIso = new Date(body.geplande_op!).toISOString();
        const endIso = new Date(
          new Date(body.geplande_op!).getTime() + body.duur_minuten * 60_000,
        ).toISOString();

        // Haal lead + hoofdcontactpersoon op voor een sprekende titel + uitnodiging
        const { data: leadInfo } = body.lead_id
          ? await admin
              .from("affiliate_leads")
              .select("bedrijfsnaam, contactpersoon, email, telefoon")
              .eq("id", body.lead_id)
              .maybeSingle()
          : { data: null };
        const { data: hoofdContact } = body.lead_id
          ? await admin
              .from("affiliate_lead_contactpersonen")
              .select("naam, email, telefoon_mobiel, telefoon_kantoor")
              .eq("lead_id", body.lead_id)
              .eq("is_hoofdcontact", true)
              .maybeSingle()
          : { data: null };

        const bedrijf = (leadInfo?.bedrijfsnaam ?? "").trim() || null;
        const contactNaam = (hoofdContact?.naam ?? leadInfo?.contactpersoon ?? "").trim() || null;
        const contactEmail = (hoofdContact?.email ?? leadInfo?.email ?? "").trim() || null;
        const contactTel = (
          hoofdContact?.telefoon_mobiel ?? hoofdContact?.telefoon_kantoor ?? leadInfo?.telefoon ?? ""
        ).trim() || null;

        let summary: string;
        if (body.type === "demo") {
          if (bedrijf && contactNaam) summary = `Demo ${bedrijf} – ${contactNaam}`;
          else if (bedrijf) summary = `Demo ${bedrijf}`;
          else if (contactNaam) summary = `Demo – ${contactNaam}`;
          else summary = "Demo Mijnhuis";
        } else {
          if (bedrijf && contactNaam) summary = `Terugbel ${bedrijf} – ${contactNaam}`;
          else if (bedrijf) summary = `Terugbelafspraak ${bedrijf}`;
          else if (contactNaam) summary = `Terugbelafspraak – ${contactNaam}`;
          else summary = "Terugbelafspraak";
        }

        const descrRegels: string[] = [];
        if (bedrijf) descrRegels.push(`Bedrijf: ${bedrijf}`);
        if (contactNaam) descrRegels.push(`Contact: ${contactNaam}`);
        if (contactEmail) descrRegels.push(`E-mail: ${contactEmail}`);
        if (contactTel) descrRegels.push(`Telefoon: ${contactTel}`);
        if (body.notitie) descrRegels.push("", `Notitie: ${body.notitie}`);
        descrRegels.push("", "— Gepland via mijnhuis.nu");

        const attendees = contactEmail
          ? [{ email: contactEmail, displayName: contactNaam ?? undefined }]
          : undefined;

        const eventsPath = `/calendars/${encodeURIComponent(gcalAcc.calendar_id || "primary")}/events${
          attendees ? "?sendUpdates=all" : ""
        }`;

        const resp = await gcalFetch(gcalAcc as GoogleAccount, eventsPath, {
          method: "POST",
          body: JSON.stringify({
            summary,
            description: descrRegels.join("\n"),
            start: { dateTime: startIso, timeZone: "Europe/Amsterdam" },
            end: { dateTime: endIso, timeZone: "Europe/Amsterdam" },
            attendees,
            guestsCanSeeOtherGuests: true,
            extendedProperties: {
              private: {
                mijnhuis_type: "afspraak",
                mijnhuis_id: afspraak.id,
                mijnhuis_source: "sales_manager",
              },
            },
          }),
        });
        if (!resp.ok) {
          const txt = await resp.text();
          google_sync = "failed";
          google_error = `Google ${resp.status}: ${txt.slice(0, 200)}`;
        } else {
          const event = await resp.json();
          await admin.from("google_calendar_event_mapping").upsert({
            user_id: gcalAcc.user_id,
            partner_id: gcalAcc.partner_id,
            entiteit_type: "afspraak",
            entiteit_id: afspraak.id,
            google_event_id: event.id,
            google_etag: event.etag ?? null,
          }, { onConflict: "user_id,entiteit_type,entiteit_id" });
          google_sync = "synced";
        }
      } catch (e) {
        google_sync = "failed";
        google_error = e instanceof Error ? e.message : "onbekend";
      }
    }

    // Audit-log: wie heeft welke afspraak gepland, en wat is het Google-resultaat?
    await admin.from("audit_log").insert({
      partner_id: aff.partner_id ?? null,
      actor_id: callerId,
      target_user_id: aff.id,
      actie: body.type === "demo"
        ? "demo_afspraak_gepland_door_sales"
        : "terugbel_afspraak_gepland_door_sales",
      entity_type: "affiliate_terugbel_afspraken",
      entity_id: afspraak.id,
      nieuwe_waarde: {
        type: body.type,
        geplande_op: body.geplande_op,
        duur_minuten: body.duur_minuten,
        lead_id: body.lead_id ?? null,
        google_sync,
        google_error: google_error ?? null,
      },
    });

    return new Response(
      JSON.stringify({ afspraak, google_sync, google_error }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "internal", message: e instanceof Error ? e.message : "onbekend" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});