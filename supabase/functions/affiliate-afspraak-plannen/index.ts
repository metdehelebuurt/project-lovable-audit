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

    // Verifieer dat affiliate bestaat en actief is
    const { data: aff } = await admin
      .from("users")
      .select("id, voornaam, achternaam, email, rol, status")
      .eq("id", body.affiliate_id!)
      .maybeSingle();
    if (!aff || aff.rol !== "affiliate" || aff.status !== "actief") {
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
        const titel = body.type === "demo" ? "Demo Mijnhuis" : "Terugbelafspraak";
        const resp = await gcalFetch(gcalAcc as GoogleAccount, `/calendars/${encodeURIComponent(gcalAcc.calendar_id || "primary")}/events`, {
          method: "POST",
          body: JSON.stringify({
            summary: `${titel} (via sales)`,
            description: `${body.notitie ?? ""}\n\n— Gepland door sales-manager via Mijnhuis.nu`,
            start: { dateTime: startIso, timeZone: "Europe/Amsterdam" },
            end: { dateTime: endIso, timeZone: "Europe/Amsterdam" },
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