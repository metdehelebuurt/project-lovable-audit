import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  lead_id: z.string().uuid(),
  bedrijfsnaam: z.string().min(2).max(200),
  voornaam: z.string().min(1).max(100),
  achternaam: z.string().min(1).max(100),
  email: z.string().email(),
  telefoon: z.string().max(40).optional().nullable(),
  password: z.string().min(8).max(100),
  toestemming: z.literal(true),
  trial_dagen: z.number().int().min(1).max(30).optional(),
});

function err(message: string, status = 400, code = "bad_request") {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function randomCode(prefix: string) {
  const s = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${s}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return err("Niet ingelogd", 401, "unauthorized");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user?.id) {
      return err("Niet ingelogd: " + (userError?.message ?? "geen gebruiker"), 401, "unauthorized");
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: profile, error: profileError } = await admin
      .from("users")
      .select("id, rol, voornaam, achternaam, email")
      .eq("id", userId)
      .maybeSingle();
    if (profileError || !profile) return err("Profiel niet gevonden", 404, "no_profile");
    if (profile.rol !== "affiliate" && profile.rol !== "superadmin") {
      return err("Alleen affiliates of superadmins kunnen deze actie uitvoeren", 403, "forbidden");
    }

    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return err("Ongeldige invoer: " + JSON.stringify(parsed.error.flatten().fieldErrors), 400, "validation");
    }
    const body = parsed.data;

    // Lead check + eigenaarschap
    const { data: lead, error: leadError } = await admin
      .from("affiliate_leads")
      .select("id, eigenaar_id, bedrijfsnaam, status, gewonnen_partner_id")
      .eq("id", body.lead_id)
      .maybeSingle();
    if (leadError || !lead) return err("Lead niet gevonden", 404, "no_lead");
    if (lead.eigenaar_id !== userId && profile.rol !== "superadmin") {
      return err("Deze lead is niet van jou", 403, "forbidden");
    }
    if (lead.gewonnen_partner_id) return err("Voor deze lead is al een trial gestart", 409, "already_started");

    // Rate limit: max 5 trials per affiliate per uur
    const sinds = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recent } = await admin
      .from("affiliate_referrals")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_id", userId)
      .gte("created_at", sinds);
    if ((recent ?? 0) >= 5) return err("Limiet bereikt: max 5 trials per uur", 429, "rate_limit");

    // Affiliate-link ophalen of aanmaken
    let { data: link } = await admin
      .from("affiliate_links")
      .select("id, code")
      .eq("user_id", userId)
      .eq("actief", true)
      .limit(1)
      .maybeSingle();
    if (!link) {
      const code = randomCode("AF");
      const { data: nieuw, error: linkError } = await admin
        .from("affiliate_links")
        .insert({ user_id: userId, code, actief: true })
        .select("id, code")
        .single();
      if (linkError) return err("Kon affiliate-link niet aanmaken: " + linkError.message, 500, "link_create");
      link = nieuw;
    }

    // Trial-signup aanroepen
    const isTrialDurationAdmin =
      profile.rol === "superadmin" || (profile.email ?? "").toLowerCase() === "bas@mijnhuis.nu";
    const effectieveTrialDagen = isTrialDurationAdmin && body.trial_dagen ? body.trial_dagen : 30;
    const signupRes = await admin.functions.invoke("trial-signup", {
      body: {
        bedrijfsnaam: body.bedrijfsnaam,
        voornaam: body.voornaam,
        achternaam: body.achternaam,
        email: body.email,
        password: body.password,
        telefoon: body.telefoon ?? null,
        ref_code: link!.code,
        tijdelijk_wachtwoord: body.password,
        aangemaakt_door: `${profile.voornaam ?? ""} ${profile.achternaam ?? ""}`.trim() || profile.email,
        trial_dagen: effectieveTrialDagen,
        bron: "affiliate",
      },
    });
    if (signupRes.error) {
      return err("Trial aanmaken mislukt: " + signupRes.error.message, 500, "signup_failed");
    }
    const signupData = signupRes.data as { success?: boolean; partner_id?: string; error?: string };
    if (!signupData?.success || !signupData.partner_id) {
      return err(signupData?.error || "Trial aanmaken mislukt", 400, "signup_failed");
    }
    const partnerId = signupData.partner_id;

    // Trial einddatum ophalen voor logging
    const { data: partner } = await admin
      .from("partners")
      .select("naam, trial_einddatum")
      .eq("id", partnerId)
      .single();

    const trialEind = partner?.trial_einddatum
      ? new Date(partner.trial_einddatum).toLocaleDateString("nl-NL")
      : "onbekend";
    const affiliateNaam = `${profile.voornaam ?? ""} ${profile.achternaam ?? ""}`.trim() || profile.email;

    // Lead bijwerken — trial gestart, partner gekoppeld. 'Gewonnen' is gereserveerd voor betalende klant.
    await admin
      .from("affiliate_leads")
      .update({ status: "trial_gestart", gewonnen_partner_id: partnerId })
      .eq("id", body.lead_id);

    // Contactmoment
    await admin.from("affiliate_lead_contactmomenten").insert({
      lead_id: body.lead_id,
      affiliate_id: userId,
      type: "notitie",
      uitkomst: "trial_gestart",
      notitie: `Trial gestart voor ${body.bedrijfsnaam}. Trial loopt tot ${trialEind}.`,
    });

    // Entiteit historie (lead + partner)
    await admin.from("entiteit_historie").insert([
      {
        partner_id: partnerId,
        entiteit_type: "affiliate_lead",
        entiteit_id: body.lead_id,
        actor_id: userId,
        actor_naam: affiliateNaam,
        actor_rol: "affiliate",
        actie: "trial_gestart",
        details: { partner_id: partnerId, trial_einddatum: partner?.trial_einddatum ?? null },
      },
      {
        partner_id: partnerId,
        entiteit_type: "partner",
        entiteit_id: partnerId,
        actor_id: userId,
        actor_naam: affiliateNaam,
        actor_rol: "affiliate",
        actie: "trial_aangemaakt_door_affiliate",
        details: { lead_id: body.lead_id, affiliate_id: userId },
      },
    ]);

    // Audit log
    await admin.from("audit_log").insert({
      partner_id: partnerId,
      actor_id: userId,
      actie: "trial.start_voor_lead",
      entity_type: "partner",
      entity_id: partnerId,
      nieuwe_waarde: { lead_id: body.lead_id, bedrijfsnaam: body.bedrijfsnaam, email: body.email },
    });

    return new Response(
      JSON.stringify({
        success: true,
        partner_id: partnerId,
        trial_einddatum: partner?.trial_einddatum ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return err((e as Error).message ?? "Onbekende fout", 500, "internal");
  }
});