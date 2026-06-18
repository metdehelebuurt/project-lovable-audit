import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendTransactional, sendTransactionalBatch } from "../_shared/partner-notify-recipients.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Payload = {
  event: "nieuw" | "status_wijziging" | "log";
  feedback_id: string;
  oude_status?: string;
  nieuwe_status?: string;
};

const PLATFORM_URL = "https://app.mijnhuis.nu";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return json({ error: "Ongeldige JSON" }, 400);
  }
  if (!body?.event || !body?.feedback_id) {
    return json({ error: "event en feedback_id zijn verplicht" }, 400);
  }

  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (body.event === "log") {
    return await handleLog(supa, req, body.feedback_id);
  }

  const { data: fb, error } = await supa
    .from("feedback_verzoeken")
    .select("id, user_id, partner_id, type, titel, beschrijving, categorie, prioriteit, status, admin_reactie")
    .eq("id", body.feedback_id)
    .maybeSingle();

  if (error || !fb) return json({ error: "feedback niet gevonden" }, 404);

  if (body.event === "nieuw") {
    return await handleNieuw(supa, fb);
  }
  if (body.event === "status_wijziging") {
    return await handleStatusWijziging(supa, fb, body);
  }
  return json({ error: "onbekend event" }, 400);
});

type FeedbackRow = {
  id: string;
  user_id: string | null;
  partner_id: string | null;
  type: string;
  titel: string;
  beschrijving: string | null;
  categorie: string | null;
  prioriteit: string | null;
  status: string;
  admin_reactie: string | null;
};

async function handleNieuw(supa: ReturnType<typeof createClient>, fb: FeedbackRow) {
  const { data: admins } = await supa
    .from("users")
    .select("id, email, status")
    .eq("rol", "superadmin");

  const actieve = (admins ?? []).filter((u) => (u.status ?? "actief") === "actief");
  const adminIds = actieve.map((u) => u.id).filter(Boolean) as string[];

  // Voorkeuren ophalen (default: alles aan als geen rij bestaat)
  const { data: voorkeuren } = await supa
    .from("feedback_notificatie_voorkeuren")
    .select("user_id, email_bug, inapp_bug, email_functieverzoek, inapp_functieverzoek")
    .in("user_id", adminIds);
  const prefMap = new Map<string, any>();
  (voorkeuren ?? []).forEach((v: any) => prefMap.set(v.user_id, v));

  const isBug = (fb.type ?? "").toLowerCase() === "bug" || (fb.categorie ?? "").toLowerCase() === "bug";
  const wantsEmail = (userId: string) => {
    const p = prefMap.get(userId);
    if (!p) return true;
    return isBug ? !!p.email_bug : !!p.email_functieverzoek;
  };
  const wantsInapp = (userId: string) => {
    const p = prefMap.get(userId);
    if (!p) return true;
    return isBug ? !!p.inapp_bug : !!p.inapp_functieverzoek;
  };

  const emailOntvangers = actieve.filter((u) => u.id && u.email && wantsEmail(u.id as string));
  const emails = Array.from(new Set(emailOntvangers.map((u) => u.email).filter(Boolean) as string[]));

  const titelKort = (fb.titel || "feedback").slice(0, 80);
  const notifRows = actieve
    .filter((u) => u.id && wantsInapp(u.id as string))
    .map((u) => ({
      user_id: u.id as string,
      type: "feedback_nieuw",
      titel: fb.type === "functieverzoek" ? "Nieuw functieverzoek" : "Nieuwe feedback",
      bericht: titelKort,
      entity_type: "feedback_verzoeken",
      entity_id: fb.id,
      gelezen: false,
    }));
  if (notifRows.length > 0) {
    await supa.from("notificaties").insert(notifRows);
  }

  let indienerNaam = "";
  let indienerEmail = "";
  let partnerNaam = "";
  if (fb.user_id) {
    const { data: u } = await supa
      .from("users")
      .select("voornaam, achternaam, email")
      .eq("id", fb.user_id)
      .maybeSingle();
    indienerNaam = [u?.voornaam, u?.achternaam].filter(Boolean).join(" ").trim();
    indienerEmail = u?.email ?? "";
  }
  if (fb.partner_id) {
    const { data: p } = await supa
      .from("partners")
      .select("naam")
      .eq("id", fb.partner_id)
      .maybeSingle();
    partnerNaam = p?.naam ?? "";
  }

  if (emails.length > 0) {
    await sendTransactionalBatch("feedback-nieuw-platform", emails, `feedback-nieuw-${fb.id}`, {
      type: fb.type,
      titel: fb.titel,
      beschrijving: fb.beschrijving ?? "",
      categorie: fb.categorie ?? "",
      prioriteit: fb.prioriteit ?? "",
      indienerNaam,
      indienerEmail,
      partnerNaam,
      feedbackUrl: `${PLATFORM_URL}/feedback-admin?id=${fb.id}`,
    });
  }

  return json({ ok: true, emails_sent: emails.length, notifs: notifRows.length });
}

async function handleLog(
  supa: ReturnType<typeof createClient>,
  req: Request,
  feedbackId: string,
) {
  // Auth: alleen ingelogde superadmin
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Niet geautoriseerd" }, 401);
  const { data: userRes, error: userErr } = await supa.auth.getUser(token);
  if (userErr || !userRes?.user) return json({ error: "Niet geautoriseerd" }, 401);
  const { data: me } = await supa
    .from("users")
    .select("rol")
    .eq("id", userRes.user.id)
    .maybeSingle();
  if (me?.rol !== "superadmin") return json({ error: "Alleen superadmin" }, 403);

  const { data: emails } = await supa
    .from("email_send_log")
    .select("id, message_id, template_name, recipient_email, status, error_message, created_at")
    .or(
      `message_id.eq.feedback-nieuw-${feedbackId},message_id.like.feedback-status-${feedbackId}-%`,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: notifs } = await supa
    .from("notificaties")
    .select("id, user_id, type, titel, bericht, gelezen, created_at")
    .eq("entity_type", "feedback_verzoeken")
    .eq("entity_id", feedbackId)
    .order("created_at", { ascending: false })
    .limit(200);

  // Verrijk notificaties met gebruikersnaam/email
  const userIds = Array.from(new Set((notifs ?? []).map((n: any) => n.user_id).filter(Boolean)));
  let userMap = new Map<string, any>();
  if (userIds.length > 0) {
    const { data: usrs } = await supa
      .from("users")
      .select("id, voornaam, achternaam, email")
      .in("id", userIds);
    (usrs ?? []).forEach((u: any) => userMap.set(u.id, u));
  }
  const notifsVerrijkt = (notifs ?? []).map((n: any) => ({
    ...n,
    ontvanger: userMap.get(n.user_id) ?? null,
  }));

  return json({ emails: emails ?? [], notifs: notifsVerrijkt });
}

async function handleStatusWijziging(
  supa: ReturnType<typeof createClient>,
  fb: FeedbackRow,
  body: Payload,
) {
  if (!fb.user_id) return json({ skipped: "geen indiener" });

  const { data: u } = await supa
    .from("users")
    .select("voornaam, email, status")
    .eq("id", fb.user_id)
    .maybeSingle();

  if (!u?.email || (u.status ?? "actief") !== "actief") {
    return json({ skipped: "geen actieve indiener" });
  }

  await supa.from("notificaties").insert({
    user_id: fb.user_id,
    type: "feedback_status",
    titel: "Update op je feedback",
    bericht: `${fb.titel} → ${body.nieuwe_status ?? fb.status}`,
    entity_type: "feedback_verzoeken",
    entity_id: fb.id,
    gelezen: false,
  });

  const nieuweStatus = body.nieuwe_status ?? fb.status;
  await sendTransactional(
    "feedback-status-update",
    u.email,
    `feedback-status-${fb.id}-${nieuweStatus}-${Date.now()}`,
    {
      titel: fb.titel,
      type: fb.type,
      oudeStatus: body.oude_status ?? "",
      nieuweStatus,
      adminReactie: fb.admin_reactie ?? "",
      indienerNaam: u.voornaam ?? "",
      feedbackUrl: `${PLATFORM_URL}/feedback`,
    },
  );

  return json({ ok: true });
}