/**
 * Server-side variabelen-renderer voor e-mailtemplates.
 * Identieke logica als src/lib/email/renderTemplate.ts.
 */

export interface TemplateRenderData {
  klant?: Record<string, unknown>;
  partner?: Record<string, unknown>;
  document?: Record<string, unknown>;
  vandaag?: string;
  [key: string]: unknown;
}

function getNested(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === "object" && key in (acc as Record<string, unknown>)
          ? (acc as Record<string, unknown>)[key]
          : undefined,
      obj,
    );
}

export function renderTemplate(
  template: string,
  data: TemplateRenderData,
): string {
  const enriched: TemplateRenderData = {
    vandaag: new Date().toLocaleDateString("nl-NL"),
    ...data,
  };
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, path: string) => {
    const value = getNested(enriched, path);
    if (value === null || value === undefined) return "";
    return String(value);
  });
}

/** Defaults per template-sleutel — gebruikt door seed-email-templates en als fallback. */
export const DEFAULT_TEMPLATES: Record<
  string,
  { onderwerp: string; body_html: string; type: string }
> = {
  offerte_nieuw: {
    type: "offerte",
    onderwerp: "Uw offerte {{document.nummer}} van {{partner.naam}}",
    body_html: `<p>Beste {{klant.voornaam}},</p>
<p>Hierbij ontvangt u onze offerte met nummer <strong>{{document.nummer}}</strong>. De volledige specificatie vindt u in de bijlage.</p>
<p>U kunt de offerte ook online bekijken en digitaal accepteren via onderstaande link:</p>
<p><a href="{{document.url}}">Bekijk en accepteer offerte</a></p>
<p>Heeft u vragen? Reageer gerust op deze e-mail.</p>
<p>Met vriendelijke groet,<br/>{{partner.afzender}}</p>`,
  },
  offerte_herinnering: {
    type: "offerte",
    onderwerp: "Herinnering: offerte {{document.nummer}}",
    body_html: `<p>Beste {{klant.voornaam}},</p>
<p>Wij willen u graag herinneren aan onze offerte <strong>{{document.nummer}}</strong>.</p>
<p>U kunt de offerte hier bekijken: <a href="{{document.url}}">{{document.url}}</a></p>
<p>Met vriendelijke groet,<br/>{{partner.afzender}}</p>`,
  },
  factuur_nieuw: {
    type: "factuur",
    onderwerp: "Factuur {{document.nummer}} van {{partner.naam}}",
    body_html: `<p>Beste {{klant.voornaam}},</p>
<p>In de bijlage vindt u factuur <strong>{{document.nummer}}</strong> ten bedrage van {{document.totaal}}.</p>
<p>Wij verzoeken u vriendelijk de factuur binnen de gestelde termijn te voldoen.</p>
<p>Met vriendelijke groet,<br/>{{partner.afzender}}</p>`,
  },
  factuur_herinnering: {
    type: "factuur",
    onderwerp: "Herinnering factuur {{document.nummer}}",
    body_html: `<p>Beste {{klant.voornaam}},</p>
<p>Onze administratie geeft aan dat factuur <strong>{{document.nummer}}</strong> nog openstaat. Mocht u de betaling al hebben verricht, dan kunt u deze e-mail als niet verzonden beschouwen.</p>
<p>Met vriendelijke groet,<br/>{{partner.afzender}}</p>`,
  },
  orderbevestiging: {
    type: "orderbevestiging",
    onderwerp: "Orderbevestiging — {{partner.naam}}",
    body_html: `<p>Beste {{klant.voornaam}},</p>
<p>Hartelijk dank voor uw opdracht. In de bijlage vindt u onze orderbevestiging met de afgesproken specificatie.</p>
<p>Wij nemen contact met u op voor de inplanning van de werkzaamheden.</p>
<p>Met vriendelijke groet,<br/>{{partner.afzender}}</p>`,
  },
  oplevering_klaar: {
    type: "oplevering",
    onderwerp: "Opleverdocument {{document.nummer}}",
    body_html: `<p>Beste {{klant.voornaam}},</p>
<p>De installatie is succesvol opgeleverd. In de bijlage vindt u het opleverdocument met alle relevante gegevens.</p>
<p>Met vriendelijke groet,<br/>{{partner.afzender}}</p>`,
  },
};

/**
 * Haal de actieve template op voor een bepaalde sleutel.
 * Volgorde: 1) partner-template met sleutel, 2) DEFAULT_TEMPLATES[sleutel], 3) null.
 */
export async function loadTemplate(
  adminClient: any,
  partnerId: string,
  sleutel: string,
): Promise<{ onderwerp: string; body_html: string } | null> {
  const { data } = await adminClient
    .from("email_templates")
    .select("onderwerp, html_body")
    .eq("partner_id", partnerId)
    .eq("sleutel", sleutel)
    .maybeSingle();
  if (data) return { onderwerp: data.onderwerp, body_html: data.html_body };
  const fallback = DEFAULT_TEMPLATES[sleutel];
  if (fallback) return { onderwerp: fallback.onderwerp, body_html: fallback.body_html };
  return null;
}
