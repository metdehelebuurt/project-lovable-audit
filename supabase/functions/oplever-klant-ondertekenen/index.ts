import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getPartnerNotifyRecipients, sendTransactionalBatch } from "../_shared/partner-notify-recipients.ts";
import { sendPartnerEmail, PartnerEmailError } from "../_shared/partner-email-send.ts";
import { loadPartnerBrand, wrapInPartnerTemplate } from "../_shared/partner-branded-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { token, naam, signature_image } = await req.json();
    if (!token || !naam || !signature_image) throw new Error("token, naam en handtekening verplicht");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rapport, error } = await admin
      .from("opleverrapporten")
      .select("id, partner_id, klant_token_expires_at, status, rapportnummer, pdf_url, klant_id, opdracht_id, installatie_id")
      .eq("klant_token", token)
      .maybeSingle();
    if (error || !rapport) throw new Error("Rapport niet gevonden");
    if (rapport.status === "ondertekend") throw new Error("Rapport is al ondertekend");
    if (rapport.klant_token_expires_at && new Date(rapport.klant_token_expires_at) < new Date()) {
      throw new Error("Link is verlopen");
    }

    // Decode dataURL → upload
    const m = /^data:(.+?);base64,(.+)$/.exec(signature_image);
    if (!m) throw new Error("Ongeldig handtekening-formaat");
    const contentType = m[1];
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    const path = `${rapport.partner_id}/${rapport.id}/klant-handtekening-${Date.now()}.png`;
    const { error: upErr } = await admin.storage.from("oplever-media").upload(path, bytes, {
      contentType,
      upsert: false,
    });
    if (upErr) throw upErr;

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? "";

    // Permanent view-token zodat de klant later terug kan naar het ondertekende rapport
    const viewToken = crypto.randomUUID();
    const viewExpires = new Date();
    viewExpires.setDate(viewExpires.getDate() + 180);

    const { error: uErr } = await admin
      .from("opleverrapporten")
      .update({
        klant_handtekening: { image_url: path, name: naam, signed_at: new Date().toISOString(), ip },
        status: "ondertekend",
        gefinaliseerd_op: new Date().toISOString(),
        klant_token: null,
        klant_token_expires_at: null,
        klant_view_token: viewToken,
        klant_view_token_expires_at: viewExpires.toISOString(),
      })
      .eq("id", rapport.id);
    if (uErr) throw uErr;

    await admin.from("opleverrapport_audit").insert({
      rapport_id: rapport.id,
      partner_id: rapport.partner_id,
      actie: "klant_ondertekend",
      details: { naam, ip },
    });

    // Bepaal origin voor blijvende view-link
    const origin = req.headers.get("origin")
      ?? req.headers.get("referer")?.replace(/\/oplevering\/.*$/, "")
      ?? "https://app.mijnhuis.nu";
    const viewLink = `${origin.replace(/\/$/, "")}/oplevering/${viewToken}/bekijken`;

    // Klant-bevestigingsmail: bepaal ontvanger
    let klantEmail: string | null = null;
    let klantNaamDb: string | null = null;
    if (rapport.klant_id) {
      const { data: klant } = await admin
        .from("klanten")
        .select("email, voornaam, achternaam")
        .eq("id", rapport.klant_id)
        .maybeSingle();
      klantEmail = klant?.email ?? null;
      klantNaamDb = klant ? `${klant.voornaam ?? ""} ${klant.achternaam ?? ""}`.trim() : null;
    }
    if (!klantEmail && rapport.opdracht_id) {
      const { data: opd } = await admin
        .from("opdrachten")
        .select("klant_email, klant_naam")
        .eq("id", rapport.opdracht_id)
        .maybeSingle();
      klantEmail = opd?.klant_email ?? klantEmail;
      klantNaamDb = klantNaamDb || (opd?.klant_naam ?? null);
    }

    // Signed URL naar bestaande PDF (indien aanwezig)
    let pdfLink: string | null = null;
    if (rapport.pdf_url) {
      const { data: sig } = await admin.storage
        .from("oplever-media")
        .createSignedUrl(rapport.pdf_url, 60 * 60 * 24 * 7); // 7 dagen
      pdfLink = sig?.signedUrl ?? null;
    }

    // Handleidingen van gekoppelde producten
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

    // Verstuur klant-bevestigingsmail (partner-branded)
    let bevestigingStatus: "sent" | "skipped_no_email" | "failed" = "skipped_no_email";
    let bevestigingFout: string | null = null;
    if (klantEmail) {
      try {
        const brand = await loadPartnerBrand(admin, rapport.partner_id);
        const primair = (brand?.primaire_kleur || "#6d28d9").trim();
        const begroeting = klantNaamDb ? `Beste ${klantNaamDb},` : `Beste ${naam},`;
        const pdfBlock = pdfLink
          ? `<p style="margin:8px 0 0;"><a href="${pdfLink}" style="color:${primair};text-decoration:underline;">Download de PDF-versie</a> (link 7 dagen geldig)</p>`
          : "";
        const handleidingenBlock = handleidingen.length > 0
          ? `<div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:8px">
              <p style="margin:0 0 12px;font-weight:600">Handleidingen bij uw installatie</p>
              <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.8">
                ${handleidingen.map((h) => `<li><a href="${h.url}" style="color:#0f172a;text-decoration:underline">${h.naam} — ${h.bestandsnaam}</a></li>`).join("")}
              </ul>
            </div>`
          : "";
        const bodyHtml = `
          <h2 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Bedankt voor uw ondertekening</h2>
          <p style="margin:0 0 12px;">${begroeting}</p>
          <p style="margin:0 0 12px;">U heeft opleverrapport <strong>${rapport.rapportnummer ?? ""}</strong> zojuist digitaal ondertekend. Bij deze mail ontvangt u een blijvende link naar uw rapport voor uw eigen administratie.</p>
          <p style="margin:24px 0;">
            <a href="${viewLink}" style="background:${primair};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;display:inline-block;font-weight:600;">Bekijk uw ondertekende rapport</a>
          </p>
          <p style="font-size:13px;color:#64748b;margin:0;">Werkt de knop niet? Kopieer deze link in uw browser:<br/><span style="word-break:break-all;color:#0f172a;">${viewLink}</span></p>
          ${pdfBlock}
          ${handleidingenBlock}
          <p style="font-size:13px;color:#64748b;margin-top:24px;">Bewaar deze e-mail goed. De online-weergave blijft 180 dagen beschikbaar.</p>`;
        const html = wrapInPartnerTemplate({
          brand,
          bodyHtml,
          senderName: brand?.afzender_naam || brand?.naam || null,
          preheader: `Uw ondertekende opleverrapport ${rapport.rapportnummer ?? ""}`,
        });
        await sendPartnerEmail({
          adminClient: admin,
          partnerId: rapport.partner_id,
          to: klantEmail,
          subject: `Uw ondertekende opleverrapport ${rapport.rapportnummer ?? ""}`.trim(),
          html,
          type: "oplever",
          klantId: rapport.klant_id ?? null,
        });
        bevestigingStatus = "sent";
      } catch (e) {
        bevestigingStatus = "failed";
        bevestigingFout = e instanceof PartnerEmailError ? e.message : (e instanceof Error ? e.message : String(e));
        console.warn("Klantbevestiging opleverrapport mislukt:", bevestigingFout);
      }
    }

    await admin.from("opleverrapport_audit").insert({
      rapport_id: rapport.id,
      partner_id: rapport.partner_id,
      actie: "bevestiging_naar_klant",
      details: { klantEmail, status: bevestigingStatus, fout: bevestigingFout, view_link: viewLink },
    });

    // Notificeer partner-team
    try {
      const { data: full } = await admin
        .from("opleverrapporten")
        .select("rapportnummer")
        .eq("id", rapport.id)
        .maybeSingle();
      const recipients = await getPartnerNotifyRecipients(admin, rapport.partner_id);
      if (recipients.length > 0) {
        await sendTransactionalBatch(
          "oplever-ondertekend",
          recipients,
          `oplever-ondertekend-${rapport.id}`,
          {
            rapportnummer: full?.rapportnummer ?? undefined,
            klantNaam: naam,
            ondertekendOp: new Date().toLocaleDateString("nl-NL"),
          },
        );
      }
    } catch (e) {
      console.warn("oplever-ondertekend mail kon niet worden verzonden:", e);
    }

    return new Response(JSON.stringify({ ok: true, view_token: viewToken, view_link: viewLink, klant_bevestiging: bevestigingStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
