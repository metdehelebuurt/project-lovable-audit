// Partner-branded e-mailtemplate voor mails naar consumenten/klanten.
// Haalt logo, huisstijlkleuren, adres/website/telefoon uit de partners-tabel
// en verpakt de meegegeven HTML-body in een consistente, moderne opmaak.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface PartnerBrand {
  naam: string;
  logo_url: string | null;
  primaire_kleur: string | null;
  secundaire_kleur: string | null;
  bedrijfsslogan: string | null;
  website: string | null;
  email: string | null;
  telefoonnummer: string | null;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
  afzender_naam: string | null;
}

export async function loadPartnerBrand(
  adminClient: SupabaseClient,
  partnerId: string,
): Promise<PartnerBrand | null> {
  const { data } = await adminClient
    .from("partners")
    .select(
      "naam, logo_url, primaire_kleur, secundaire_kleur, bedrijfsslogan, website, email, telefoonnummer, adres, postcode, plaats, afzender_naam",
    )
    .eq("id", partnerId)
    .maybeSingle();
  return (data as PartnerBrand | null) ?? null;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeColor(c: string | null | undefined, fallback: string): string {
  if (!c) return fallback;
  const t = c.trim();
  if (!t) return fallback;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(t)) return t;
  if (/^[0-9a-f]{6}$/i.test(t)) return `#${t}`;
  return t;
}

/** Herkent of body al een <p> / <div> / <h1..6> bevat. Zo niet: tekst → paragrafen. */
function ensureHtmlBody(body: string): string {
  const trimmed = body.trim();
  if (/<(p|div|h[1-6]|table|ul|ol|section|article)[\s>]/i.test(trimmed)) return trimmed;
  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((block) => {
      const withBreaks = escapeHtml(block).replace(/\n/g, "<br/>");
      return `<p style="margin:0 0 14px 0;">${withBreaks}</p>`;
    })
    .join("");
  return paragraphs;
}

export interface WrapOptions {
  brand: PartnerBrand | null;
  bodyHtml: string;
  /** Extra afsluiting/afzendernaam onderaan de content. */
  senderName?: string | null;
  /** Preheader-tekst (verborgen preview in inbox). */
  preheader?: string | null;
}

export function wrapInPartnerTemplate(opts: WrapOptions): string {
  const brand = opts.brand;
  const primair = normalizeColor(brand?.primaire_kleur, "#6d28d9");
  const secundair = normalizeColor(brand?.secundaire_kleur, primair);
  const naam = (brand?.afzender_naam || brand?.naam || "").trim();
  const slogan = (brand?.bedrijfsslogan || "").trim();
  const website = (brand?.website || "").trim();
  const email = (brand?.email || "").trim();
  const tel = (brand?.telefoonnummer || "").trim();
  const adresRegel = [brand?.adres, [brand?.postcode, brand?.plaats].filter(Boolean).join(" ")]
    .filter((s) => (s ?? "").trim())
    .join(", ");

  const websiteHref = website
    ? (website.startsWith("http") ? website : `https://${website}`)
    : "";
  const websiteLabel = website.replace(/^https?:\/\//i, "").replace(/\/$/, "");

  const header = brand?.logo_url
    ? `<img src="${escapeHtml(brand.logo_url)}" alt="${escapeHtml(naam || "logo")}" style="max-height:48px;max-width:220px;display:block;" />`
    : `<span style="font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.01em;">${escapeHtml(naam || "")}</span>`;

  const headerSubtitle = slogan
    ? `<p style="margin:6px 0 0;font-size:12px;color:#64748b;">${escapeHtml(slogan)}</p>`
    : "";

  const signatureName = (opts.senderName ?? naam ?? "").trim();
  const signature = signatureName
    ? `<p style="margin:28px 0 4px;color:#0f172a;font-weight:600;">Met vriendelijke groet,</p>
       <p style="margin:0;color:#0f172a;">${escapeHtml(signatureName)}</p>`
    : "";

  const contactBits: string[] = [];
  if (websiteHref) contactBits.push(`<a href="${escapeHtml(websiteHref)}" style="color:${primair};text-decoration:none;font-weight:600;">${escapeHtml(websiteLabel)}</a>`);
  if (email) contactBits.push(`<a href="mailto:${escapeHtml(email)}" style="color:#475569;text-decoration:none;">${escapeHtml(email)}</a>`);
  if (tel) contactBits.push(`<a href="tel:${escapeHtml(tel.replace(/\s+/g, ""))}" style="color:#475569;text-decoration:none;">${escapeHtml(tel)}</a>`);

  const footerLine1 = naam
    ? `<p style="margin:0 0 4px;color:#0f172a;font-weight:600;">${escapeHtml(naam)}</p>`
    : "";
  const footerLine2 = adresRegel
    ? `<p style="margin:0 0 6px;color:#64748b;">${escapeHtml(adresRegel)}</p>`
    : "";
  const footerLine3 = contactBits.length
    ? `<p style="margin:0;color:#64748b;">${contactBits.join(' &middot; ')}</p>`
    : "";

  const preheader = (opts.preheader ?? "").trim();
  const preheaderHtml = preheader
    ? `<div style="display:none;overflow:hidden;line-height:1px;max-height:0;max-width:0;opacity:0;">${escapeHtml(preheader)}</div>`
    : "";

  const bodyHtml = ensureHtmlBody(opts.bodyHtml);

  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(naam || "Bericht")}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    ${preheaderHtml}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f7;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.06);border:1px solid #e2e8f0;">
            <tr>
              <td style="background-color:#ffffff;padding:24px 28px 20px;border-bottom:3px solid ${primair};">
                ${header}
                ${headerSubtitle}
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-size:15px;line-height:1.65;color:#0f172a;">
                ${bodyHtml}
                ${signature}
              </td>
            </tr>
            <tr>
              <td style="background-color:#f8fafc;padding:20px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
                ${footerLine1}
                ${footerLine2}
                ${footerLine3}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}