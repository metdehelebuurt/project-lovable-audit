/**
 * Centrale lijst van e-mailtemplate-sleutels.
 * Per organisatie kan voor elke sleutel maximaal 1 standaard-template bestaan.
 */

export const EMAIL_TEMPLATE_KEYS = {
  offerte_nieuw: "Nieuwe offerte versturen",
  offerte_herinnering: "Offerte herinnering",
  factuur_nieuw: "Nieuwe factuur versturen",
  factuur_herinnering: "Factuur herinnering",
  orderbevestiging: "Orderbevestiging",
  oplevering_klaar: "Oplevering gereed",
} as const;

export type EmailTemplateKey = keyof typeof EMAIL_TEMPLATE_KEYS;

export const EMAIL_TEMPLATE_KEY_LIST = Object.keys(
  EMAIL_TEMPLATE_KEYS,
) as EmailTemplateKey[];

export const EMAIL_TEMPLATE_TYPE_BY_KEY: Record<EmailTemplateKey, string> = {
  offerte_nieuw: "offerte",
  offerte_herinnering: "offerte",
  factuur_nieuw: "factuur",
  factuur_herinnering: "factuur",
  orderbevestiging: "orderbevestiging",
  oplevering_klaar: "oplevering",
};
