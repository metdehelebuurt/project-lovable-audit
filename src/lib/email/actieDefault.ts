/**
 * Selecteert de juiste affiliate-template voor een planning-actie,
 * o.b.v. het `actie_default`-veld op `affiliate_email_templates`.
 * Valt terug op het registry-default als de gebruiker geen voorkeur
 * heeft opgegeven.
 */

import type { AffiliateEmailTemplateRow } from "@/hooks/affiliate/useAffiliateEmailTemplates";
import { AFFILIATE_TEMPLATES, getTemplate } from "@/lib/affiliateTemplates/registry";

export type ActieKey =
  | "demo_klant" | "demo_collega"
  | "terugbel_klant" | "terugbel_collega"
  | "trial_klant";

/** Fallback-registry-key wanneer gebruiker nog geen `actie_default` heeft toegewezen. */
const FALLBACK_REGISTRY_KEY: Record<ActieKey, string> = {
  demo_klant: "demo-uitnodiging",
  demo_collega: "demo-uitnodiging",
  terugbel_klant: "terugbel-bevestiging",
  terugbel_collega: "terugbel-bevestiging",
  trial_klant: "trial-gestart",
};

export interface ResolvedTemplate {
  templateKey: string;
  onderwerp: string;
  bodyHtml: string;
  bron: "aangepast" | "standaard";
}

export function resolveDefaultTemplate(
  actie: ActieKey,
  customByKey: Record<string, AffiliateEmailTemplateRow> | undefined | null,
): ResolvedTemplate | null {
  // 1) Heeft de gebruiker een template gemarkeerd als default voor deze actie?
  if (customByKey) {
    const eigen = Object.values(customByKey).find(
      (t) => t.actie_default === actie && t.actief !== false,
    );
    if (eigen) {
      return {
        templateKey: eigen.template_key,
        onderwerp: eigen.onderwerp,
        bodyHtml: eigen.body_html,
        bron: "aangepast",
      };
    }
  }

  // 2) Val terug op registry + eventuele aanpassing van diezelfde key
  const fallbackKey = FALLBACK_REGISTRY_KEY[actie];
  const reg = getTemplate(fallbackKey);
  if (!reg) return null;
  const aangepast = customByKey?.[reg.key];
  return {
    templateKey: reg.key,
    onderwerp: aangepast?.onderwerp ?? reg.defaultOnderwerp,
    bodyHtml: aangepast?.body_html ?? reg.defaultBodyHtml,
    bron: aangepast ? "aangepast" : "standaard",
  };
}

/** Lijst voor handmatige selector — alle bestaande templates plus registry. */
export function alleBeschikbareTemplates(
  customByKey: Record<string, AffiliateEmailTemplateRow> | undefined | null,
): Array<{ key: string; label: string; onderwerp: string; bodyHtml: string; aangepast: boolean }> {
  return AFFILIATE_TEMPLATES.map((t) => {
    const eigen = customByKey?.[t.key];
    return {
      key: t.key,
      label: t.displayName,
      onderwerp: eigen?.onderwerp ?? t.defaultOnderwerp,
      bodyHtml: eigen?.body_html ?? t.defaultBodyHtml,
      aangepast: !!eigen,
    };
  });
}

export const ACTIE_LABELS: Record<ActieKey, string> = {
  demo_klant: "Demo — mail naar klant",
  demo_collega: "Demo — mail naar collega",
  terugbel_klant: "Terugbel — mail naar klant",
  terugbel_collega: "Terugbel — mail naar collega",
  trial_klant: "Trial — welkomstmail klant",
};