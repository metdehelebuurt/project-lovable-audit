/**
 * Eenvoudige variabelen-renderer voor e-mailtemplates.
 * Vervangt {{pad.naar.veld}} placeholders door waarden uit het data-object.
 * Onbekende variabelen worden vervangen door een lege string.
 */

export interface TemplateRenderData {
  klant?: {
    naam?: string | null;
    voornaam?: string | null;
    achternaam?: string | null;
    email?: string | null;
    bedrijfsnaam?: string | null;
  };
  partner?: {
    naam?: string | null;
    afzender?: string | null;
    afzender_email?: string | null;
  };
  document?: {
    nummer?: string | null;
    totaal?: string | null;
    url?: string | null;
    type?: string | null;
  };
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Render template-string met {{var}} placeholders. */
export function renderTemplate(
  template: string,
  data: TemplateRenderData,
  options: { escape?: boolean } = {},
): string {
  const escape = options.escape ?? false;
  const enriched: TemplateRenderData = {
    vandaag: new Date().toLocaleDateString("nl-NL"),
    ...data,
  };
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, path: string) => {
    const value = getNested(enriched, path);
    if (value === null || value === undefined) return "";
    const str = String(value);
    return escape ? escapeHtml(str) : str;
  });
}

/** Lijst van beschikbare variabelen voor de template-editor UI. */
export const TEMPLATE_VARIABLES: Array<{ key: string; label: string }> = [
  { key: "klant.naam", label: "Naam klant" },
  { key: "klant.voornaam", label: "Voornaam klant" },
  { key: "klant.bedrijfsnaam", label: "Bedrijfsnaam klant" },
  { key: "partner.naam", label: "Naam organisatie" },
  { key: "partner.afzender", label: "Afzendernaam" },
  { key: "document.nummer", label: "Documentnummer" },
  { key: "document.totaal", label: "Totaalbedrag" },
  { key: "document.url", label: "Link naar portal" },
  { key: "vandaag", label: "Datum vandaag" },
];
