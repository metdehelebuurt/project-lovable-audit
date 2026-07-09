import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  bedrijfsnaam: z.string().trim().min(2).max(200),
  voornaam: z.string().trim().min(1).max(100),
  achternaam: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(100),
  telefoon: z.string().trim().max(40).optional().nullable(),
  ref_code: z.string().trim().max(60).optional().nullable(),
  kortingscode: z.string().trim().max(60).optional().nullable(),
  tijdelijk_wachtwoord: z.string().max(100).optional().nullable(),
  aangemaakt_door: z.string().max(200).optional().nullable(),
  aangemaakt_door_id: z.string().uuid().optional().nullable(),
  trial_dagen: z.number().int().min(1).max(30).optional(),
  // Selfservice signup vereist expliciet akkoord; interne flows (affiliate/admin) mogen deze weglaten.
  toestemming: z.boolean().optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Ongeldige invoer: " + JSON.stringify(parsed.error.flatten().fieldErrors) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const {
      bedrijfsnaam, voornaam, achternaam, email, password, telefoon, ref_code,
      kortingscode, tijdelijk_wachtwoord, aangemaakt_door, aangemaakt_door_id,
      trial_dagen, toestemming,
    } = parsed.data;

    // Selfservice (geen aangemaakt_door_id → publieke signup) vereist expliciet akkoord.
    if (!aangemaakt_door_id && toestemming !== true) {
      return new Response(
        JSON.stringify({ error: "Je moet akkoord gaan met de voorwaarden en het privacybeleid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      const msg = authError.message.includes("already been registered")
        ? "Dit e-mailadres is al in gebruik"
        : authError.message;
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Create partner (trial) — standaard 30 dagen, configureerbaar (1-30)
    const dagenRaw = Number.isFinite(Number(trial_dagen)) ? Math.floor(Number(trial_dagen)) : 30;
    const dagen = Math.min(30, Math.max(1, dagenRaw));
    const trialStart = new Date();
    const trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + dagen);

    const { data: partner, error: partnerError } = await supabaseAdmin
      .from("partners")
      .insert({
        naam: bedrijfsnaam,
        email,
        telefoonnummer: telefoon || null,
        status: "actief",
        abonnement_type: "trial",
        contract_startdatum: trialStart.toISOString().split("T")[0],
        trial_einddatum: trialEnd.toISOString().split("T")[0],
        contactpersoon_voornaam: voornaam,
        contactpersoon_achternaam: achternaam,
        contactpersoon_email: email,
        contactpersoon_telefoon: telefoon || null,
        licentie_adviseurs: 2,
        licentie_installateurs: 2,
        trial_aangemaakt_door_id: aangemaakt_door_id ?? null,
        trial_aangemaakt_op: trialStart.toISOString(),
            voorwaarden_geaccepteerd_op: toestemming === true ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    if (partnerError) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ error: "Kon bedrijf niet aanmaken: " + partnerError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Create user profile as partner_admin
    const { error: profileError } = await supabaseAdmin.from("users").insert({
      id: authUser.user.id,
      email,
      voornaam,
      achternaam,
      rol: "partner_admin",
      partner_id: partner.id,
      telefoon: telefoon || null,
      status: "actief",
    });

    if (profileError) {
      await supabaseAdmin.from("partners").delete().eq("id", partner.id);
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ error: "Kon gebruiker niet aanmaken: " + profileError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Handle affiliate referral & kortingscode
    let affiliateReferralId: string | null = null;
    let kortingscodeId: string | null = null;
    let kortingActiefTot: string | null = null;

    if (ref_code) {
      try {
        // Look up affiliate link
        const { data: affLink } = await supabaseAdmin
          .from("affiliate_links")
          .select("id, user_id")
          .eq("code", ref_code)
          .eq("actief", true)
          .single();

        if (affLink) {
          // Atomic increment via RPC (voorkomt race-condities bij gelijktijdige clicks).
          await supabaseAdmin.rpc("increment_affiliate_link_clicks", { _link_id: affLink.id });

          // Get default commission
          const { data: settings } = await supabaseAdmin
            .from("affiliate_instellingen")
            .select("standaard_commissie_percentage")
            .limit(1)
            .single();

          // Create referral
          const { data: referral } = await supabaseAdmin
            .from("affiliate_referrals")
            .insert({
              affiliate_id: affLink.user_id,
              partner_id: partner.id,
              affiliate_link_id: affLink.id,
              commissie_percentage: settings?.standaard_commissie_percentage ?? 10,
              status: "actief",
            })
            .select("id")
            .single();

          if (referral) affiliateReferralId = referral.id;
        }
      } catch (e) {
        console.error("Affiliate referral error (non-fatal):", e);
      }
    }

    if (kortingscode) {
      try {
        const { data: code } = await supabaseAdmin
          .from("kortingscodes")
          .select("*")
          .eq("code", kortingscode.toUpperCase())
          .eq("actief", true)
          .single();

        if (code) {
          const now = new Date();
          const isExpired = code.geldig_tot && new Date(code.geldig_tot) < now;
          const isMaxed = code.max_gebruik && code.aantal_gebruikt >= code.max_gebruik;

          if (!isExpired && !isMaxed) {
            kortingscodeId = code.id;
            // Korting active for 12 months
            const kortingEnd = new Date(now);
            kortingEnd.setMonth(kortingEnd.getMonth() + 12);
            kortingActiefTot = kortingEnd.toISOString().split("T")[0];

            // Increment usage
            await supabaseAdmin
              .from("kortingscodes")
              .update({ aantal_gebruikt: code.aantal_gebruikt + 1 })
              .eq("id", code.id);

            // Link to referral if affiliate matches
            if (affiliateReferralId) {
              await supabaseAdmin
                .from("affiliate_referrals")
                .update({ kortingscode_id: code.id })
                .eq("id", affiliateReferralId);
            }
          }
        }
      } catch (e) {
        console.error("Kortingscode error (non-fatal):", e);
      }
    }

    // 5. Create abonnement record
    try {
      await supabaseAdmin.from("abonnementen").insert({
        partner_id: partner.id,
        plan: "trial",
        status: "actief",
        maand_bedrag: 0,
        start_datum: trialStart.toISOString().split("T")[0],
        verloop_datum: trialEnd.toISOString().split("T")[0],
        affiliate_referral_id: affiliateReferralId,
        kortingscode_id: kortingscodeId,
        korting_actief_tot: kortingActiefTot,
      });
    } catch (e) {
      console.error("Abonnement creation error (non-fatal):", e);
    }

    // 6. Seed demo data
    try {
      await seedDemoData(supabaseAdmin, partner.id, authUser.user.id);
      await supabaseAdmin
        .from("partners")
        .update({
          demo_data_geseed_op: new Date().toISOString(),
          demo_data_geseed_door_id: aangemaakt_door_id ?? authUser.user.id,
        })
        .eq("id", partner.id);
    } catch (seedErr) {
      console.error("Demo seed error (non-fatal):", seedErr);
    }

    // 7. Verstuur welkomstmail via Lovable Email (niet-blokkerend)
    try {
      await supabaseAdmin.functions.invoke("send-transactional-email", {
        body: {
          templateName: "trial-welkom",
          recipientEmail: email,
          idempotencyKey: `trial-welkom-${partner.id}`,
          templateData: {
            voornaam,
            bedrijfsnaam,
            loginUrl: "https://app.mijnhuis.nu/login",
            tijdelijkWachtwoord: tijdelijk_wachtwoord ?? undefined,
            aangemaaktDoor: aangemaakt_door ?? undefined,
          },
        },
      });
    } catch (mailErr) {
      console.error("Trial welkomstmail mislukt (non-fatal):", mailErr);
    }

    return new Response(
      JSON.stringify({ success: true, email, partner_id: partner.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function seedDemoData(supabase: any, partnerId: string, userId: string) {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  // Unieke suffix zodat demo-nummers per partner niet botsen met andere trials (unique constraint).
  const suffix = partnerId.slice(0, 8).toUpperCase();

  // --- Demo Leads ---
  const leadsData = [
    {
      voornaam: "Anna", achternaam: "de Boer", email: "anna.deboer@voorbeeld.nl",
      telefoon: "06-12345678", adres: "Kerkstraat 12", postcode: "1234 AB", plaats: "Amsterdam",
      bron: "Website", lead_status: "nieuw", notities: "⚡ Demo: Geïnteresseerd in zonnepanelen op schuin dak. Woning bj. 2005.",
      partner_id: partnerId, owner_user_id: userId,
    },
    {
      voornaam: "Pieter", achternaam: "Jansen", email: "pieter.jansen@voorbeeld.nl",
      telefoon: "06-98765432", adres: "Dorpsweg 45", postcode: "5678 CD", plaats: "Utrecht",
      bron: "Verwijzing", lead_status: "gekwalificeerd", notities: "⚡ Demo: Wil warmtepomp + vloerverwarming. Huidige ketel is 15 jaar oud.",
      partner_id: partnerId, owner_user_id: userId,
    },
    {
      voornaam: "Sophie", achternaam: "van Dijk", email: "sophie.vandijk@voorbeeld.nl",
      telefoon: "06-55544433", adres: "Laan van Meerdervoort 88", postcode: "2517 AX", plaats: "Den Haag",
      bron: "Google Ads", lead_status: "offerte_verzonden", notities: "⚡ Demo: Thuisbatterij + laadpaal voor elektrische auto.",
      partner_id: partnerId, owner_user_id: userId,
    },
    {
      voornaam: "Mark", achternaam: "Bakker", email: "mark.bakker@voorbeeld.nl",
      telefoon: "06-11122233", adres: "Hoofdstraat 3", postcode: "3011 GH", plaats: "Rotterdam",
      bron: "Beurs", lead_status: "klant", notities: "⚡ Demo: Bestaande klant, 16 zonnepanelen geïnstalleerd.",
      partner_id: partnerId, owner_user_id: userId,
    },
  ];

  const { data: leads } = await supabase.from("leads").insert(leadsData).select("id, voornaam, achternaam, email");

  if (!leads || leads.length === 0) return;

  // --- Demo Producten ---
  const productenData = [
    {
      naam: "SolarEdge SE6000H Omvormer", merk: "SolarEdge", model: "SE6000H",
      categorie: "omvormer", omschrijving: "⚡ Demo: Hoog-rendement omvormer 6kW met geïntegreerde monitoring.",
      prijs_excl_btw: 1450, kostprijs: 980, garantie_jaren: 12, status: "actief",
      specs: { vermogen_w: 6000, gewicht_kg: 17.2, afmetingen: "370x370x174mm", rendement: "99.2%" },
      partner_id: partnerId,
    },
    {
      naam: "JA Solar JAM60S20 375W", merk: "JA Solar", model: "JAM60S20-375",
      categorie: "zonnepanelen", omschrijving: "⚡ Demo: Mono-kristallijn zonnepaneel 375Wp, Tier 1.",
      prijs_excl_btw: 145, kostprijs: 92, garantie_jaren: 25, status: "actief",
      specs: { vermogen_wp: 375, gewicht_kg: 20.7, afmetingen: "1769x1052x35mm", rendement: "20.4%", cellen: 120 },
      partner_id: partnerId,
    },
    {
      naam: "Daikin Altherma 3 H HT", merk: "Daikin", model: "ETBH16E9W",
      categorie: "warmtepomp", omschrijving: "⚡ Demo: Lucht-water warmtepomp voor verwarming en warm water.",
      prijs_excl_btw: 4800, kostprijs: 3200, garantie_jaren: 5, status: "actief",
      specs: { vermogen_kw: 16, cop: 4.56, geluidsniveau_db: 37, koelmiddel: "R32" },
      partner_id: partnerId,
    },
    {
      naam: "Alfen Eve Single S-line", merk: "Alfen", model: "904460034",
      categorie: "laadpaal", omschrijving: "⚡ Demo: Slimme laadpaal 1 fase/3 fase, 22kW.",
      prijs_excl_btw: 1150, kostprijs: 780, garantie_jaren: 3, status: "actief",
      specs: { max_vermogen_kw: 22, connector: "Type 2", smart_charging: true, rfid: true },
      partner_id: partnerId,
    },
    {
      naam: "BYD Battery-Box HVS 10.2", merk: "BYD", model: "HVS 10.2",
      categorie: "thuisbatterij", omschrijving: "⚡ Demo: Modulaire thuisbatterij 10.2 kWh.",
      prijs_excl_btw: 5200, kostprijs: 3600, garantie_jaren: 10, status: "actief",
      specs: { capaciteit_kwh: 10.2, gewicht_kg: 164, afmetingen: "585x298x1020mm", cycli: 6000 },
      partner_id: partnerId,
    },
  ];

  await supabase.from("producten").insert(productenData);

  // --- Demo Schouwen ---
  const schouwenData = [
    {
      schouw_nummer: "SCH-DEMO-001", adviseur_id: userId, lead_id: leads[0].id,
      partner_id: partnerId, categorie: "zonnepanelen", status: "uitgevoerd",
      geplande_datum: fmt(addDays(today, -5)), consument_naam: `${leads[0].voornaam} ${leads[0].achternaam}`,
      klant_email: leads[0].email,
      notities: "⚡ Demo: Schuin dak op het zuiden, geen schaduw. 40m² beschikbaar.",
      gegevens: {
        daktype: "Schuin dak", orientatie: "Zuid", hellingshoek: 35,
        beschikbaar_oppervlak_m2: 40, schaduw: "Geen", meterkast: "3x25A",
      },
    },
    {
      schouw_nummer: "SCH-DEMO-002", adviseur_id: userId, lead_id: leads[1].id,
      partner_id: partnerId, categorie: "warmtepomp", status: "gepland",
      geplande_datum: fmt(addDays(today, 3)), consument_naam: `${leads[1].voornaam} ${leads[1].achternaam}`,
      klant_email: leads[1].email,
      notities: "⚡ Demo: Tussenwoning, vloerverwarming aanwezig beneden.",
      gegevens: {
        woningtype: "Tussenwoning", bouwjaar: 2008, oppervlakte_m2: 125,
        huidige_verwarming: "HR-ketel", isolatie_label: "C",
      },
    },
  ];

  const { data: schouwen } = await supabase.from("schouwen").insert(schouwenData).select("id");

  // --- Demo Offertes ---
  const offertesData = [
    {
      offertenummer: `OFF-DEMO-${suffix}-001`, adviseur_id: userId, partner_id: partnerId,
      lead_id: leads[0].id, schouw_id: schouwen?.[0]?.id || null,
      klant_naam: `${leads[0].voornaam} ${leads[0].achternaam}`,
      klant_email: leads[0].email, klant_adres: "Kerkstraat 12", klant_postcode: "1234 AB", klant_plaats: "Amsterdam",
      status: "verzonden", subtotaal: 5370, btw_bedrag: 0, totaal_bedrag: 5370,
      geldig_tot: fmt(addDays(today, 25)),
      notities: "⚡ Demo: 16x JA Solar panelen + SolarEdge omvormer",
      regels: [
        { omschrijving: "JA Solar JAM60S20 375W", aantal: 16, prijs: 145, totaal: 2320 },
        { omschrijving: "SolarEdge SE6000H Omvormer", aantal: 1, prijs: 1450, totaal: 1450 },
        { omschrijving: "Installatie zonnepanelen (arbeid)", aantal: 1, prijs: 1200, totaal: 1200 },
        { omschrijving: "Montagesysteem schuin dak", aantal: 1, prijs: 400, totaal: 400 },
      ],
    },
    {
      offertenummer: `OFF-DEMO-${suffix}-002`, adviseur_id: userId, partner_id: partnerId,
      lead_id: leads[2].id,
      klant_naam: `${leads[2].voornaam} ${leads[2].achternaam}`,
      klant_email: leads[2].email, klant_adres: "Laan van Meerdervoort 88", klant_postcode: "2517 AX", klant_plaats: "Den Haag",
      status: "geaccepteerd", subtotaal: 7550, btw_bedrag: 1585.50, totaal_bedrag: 9135.50,
      geldig_tot: fmt(addDays(today, 10)),
      notities: "⚡ Demo: Thuisbatterij + laadpaal combinatie",
      regels: [
        { omschrijving: "BYD Battery-Box HVS 10.2", aantal: 1, prijs: 5200, totaal: 5200 },
        { omschrijving: "Alfen Eve Single S-line", aantal: 1, prijs: 1150, totaal: 1150 },
        { omschrijving: "Installatie en aansluiting", aantal: 1, prijs: 1200, totaal: 1200 },
      ],
    },
  ];

  await supabase.from("offertes").insert(offertesData);

  // --- Demo Installaties ---
  const installatiesData = [
    {
      partner_id: partnerId, consument_naam: `${leads[3].voornaam} ${leads[3].achternaam}`,
      consument_id: null, lead_id: leads[3].id,
      status: "afgerond",
      geplande_startdatum: fmt(addDays(today, -14)),
      geplande_einddatum: fmt(addDays(today, -12)),
      notities: "⚡ Demo: 16 zonnepanelen geïnstalleerd. Klant zeer tevreden.",
    },
    {
      partner_id: partnerId, consument_naam: `${leads[2].voornaam} ${leads[2].achternaam}`,
      consument_id: null, lead_id: leads[2].id,
      status: "gepland",
      geplande_startdatum: fmt(addDays(today, 7)),
      geplande_einddatum: fmt(addDays(today, 8)),
      notities: "⚡ Demo: Thuisbatterij + laadpaal installatie gepland.",
    },
  ];

  await supabase.from("installaties").insert(installatiesData);
}
