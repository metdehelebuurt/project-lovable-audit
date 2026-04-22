import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendPartnerEmail, PartnerEmailError } from "../_shared/partner-email-send.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { rapport_id, klant_email: overrideEmail } = await req.json();
    if (!rapport_id) throw new Error("rapport_id verplicht");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rapport, error: rErr } = await admin
      .from("opleverrapporten")
      .select("id, partner_id, rapportnummer, klant_id, opdracht_id, installatie_id")
      .eq("id", rapport_id)
      .single();
    if (rErr || !rapport) throw new Error(rErr?.message ?? "Rapport niet gevonden");

    const token = crypto.randomUUID();
    const expires = new Date();
    expires.setDate(expires.getDate() + 14);

    const { error: uErr } = await admin
      .from("opleverrapporten")
      .update({ klant_token: token, klant_token_expires_at: expires.toISOString(), status: "wacht_op_klant" })
      .eq("id", rapport_id);
    if (uErr) throw uErr;

    let klantEmail: string | null = null;
    let klantNaam: string | null = null;
    if (rapport.klant_id) {
      const { data: klant } = await admin.from("klanten").select("email, voornaam, achternaam").eq("id", rapport.klant_id).maybeSingle();
      klantEmail = klant?.email ?? null;
      klantNaam = klant ? `${klant.voornaam ?? ""} ${klant.achternaam ?? ""}`.trim() : null;
    }
    if (!klantEmail && rapport.opdracht_id) {
      const { data: opd } = await admin
        .from("opdrachten")
        .select("klant_email, klant_naam")
        .eq("id", rapport.opdracht_id)
        .maybeSingle();
      klantEmail = opd?.klant_email ?? klantEmail;
      klantNaam = klantNaam || (opd?.klant_naam ?? null);
    }
    // Override door installateur ingevoerd e-mailadres heeft voorrang
    if (typeof overrideEmail === "string" && overrideEmail.trim()) {
      klantEmail = overrideEmail.trim();
    }

    const origin = req.headers.get("origin") ?? "";
    const link = `${origin}/oplevering/${token}`;

    // Verzamel gebruikershandleidingen van producten op gekoppelde installatie/opdracht
    const productIds = new Set<string>();
    const collectIds = (regels: unknown) => {
      if (!Array.isArray(regels)) return;
      for (const r of regels) {
        const obj = (r ?? {}) as Record<string, unknown>;
        if (typeof obj.product_id === "string" && obj.product_id) productIds.add(obj.product_id);
      }
    };
    if (rapport.installatie_id) {
      const { data: inst } = await admin.from("installaties").select("producten").eq("id", rapport.installatie_id).maybeSingle();
      collectIds(inst?.producten);
    }
    if (rapport.opdracht_id) {
      const { data: opd } = await admin.from("opdrachten").select("regels").eq("id", rapport.opdracht_id).maybeSingle();
      collectIds(opd?.regels);
    }
    let handleidingen: { naam: string; bestandsnaam: string; url: string }[] = [];
    if (productIds.size > 0) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const { data: prods } = await admin
        .from("producten")
        .select("id, naam, gebruiker_handleiding_url, gebruiker_handleiding_naam")
        .in("id", Array.from(productIds));
      handleidingen = (prods ?? [])
        .filter((p) => p.gebruiker_handleiding_url)
        .map((p) => ({
          naam: p.naam,
          bestandsnaam: p.gebruiker_handleiding_naam ?? "Gebruikershandleiding.pdf",
          url: p.gebruiker_handleiding_url!.startsWith("http")
            ? p.gebruiker_handleiding_url!
            : `${supabaseUrl}/storage/v1/object/public/product-images/${p.gebruiker_handleiding_url}`,
        }));
    }

    await admin.from("opleverrapport_audit").insert({
      rapport_id,
      partner_id: rapport.partner_id,
      actie: "verzonden_naar_klant",
      details: { klantEmail, link_expires: expires.toISOString(), aantal_handleidingen: handleidingen.length },
    });

    // Email versturen via partner e-mailaccount (OAuth/SMTP)
    if (klantEmail) {
      try {
        const begroeting = klantNaam ? `Beste ${klantNaam},` : "Beste klant,";
        const handleidingenBlock = handleidingen.length > 0
          ? `
            <div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:8px">
              <p style="margin:0 0 12px;font-weight:600">📘 Handleidingen bij uw installatie</p>
              <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.8">
                ${handleidingen.map((h) => `<li><a href="${h.url}" style="color:#7c3aed;text-decoration:underline">${h.naam} — ${h.bestandsnaam}</a></li>`).join("")}
              </ul>
            </div>`
          : "";
        const html = `
          <div style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="margin:0 0 16px;font-size:20px">Opleverrapport ${rapport.rapportnummer}</h2>
            <p>${begroeting}</p>
            <p>Uw installateur heeft het opleverrapport voor uw installatie afgerond. We vragen u dit rapport te bekijken en digitaal te ondertekenen.</p>
            <p style="margin:24px 0">
              <a href="${link}" style="background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:600">Bekijk en onderteken rapport</a>
            </p>
            <p style="font-size:13px;color:#666">Of kopieer deze link in uw browser:<br/><span style="word-break:break-all">${link}</span></p>
            ${handleidingenBlock}
            <p style="font-size:13px;color:#666;margin-top:24px">Deze link is 14 dagen geldig.</p>
          </div>`;
        await sendPartnerEmail({
          adminClient: admin,
          partnerId: rapport.partner_id,
          to: klantEmail,
          subject: `Opleverrapport ${rapport.rapportnummer} — graag ondertekenen`,
          html,
          type: "oplever",
          klantId: rapport.klant_id ?? null,
        });
      } catch (e) {
        if (e instanceof PartnerEmailError) {
          console.warn("Partner-email mislukt:", e.message);
        } else {
          console.warn("Mail versturen faalde:", e);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, token, link }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
