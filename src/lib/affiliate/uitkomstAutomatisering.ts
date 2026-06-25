import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import type { TerugbelAfspraak } from "@/hooks/affiliate/useTerugbelAfspraken";

export type UitkomstWaarde =
  | "geen_gehoor"
  | "niet_interessant"
  | "terugbellen"
  | "gesprek_gepland"
  | "demo"
  | "voorstel"
  | "gewonnen";

/** Heeft de lead al een toekomstige open afspraak in `affiliate_terugbel_afspraken`? */
export function heeftOpenAfspraak(
  leadId: string,
  afspraken: TerugbelAfspraak[],
  type?: "terugbel" | "demo",
): boolean {
  const now = Date.now();
  return afspraken.some((a) => {
    if (a.lead_id !== leadId) return false;
    if (a.afgehandeld_op) return false;
    if (type && (a as { type?: string }).type && (a as { type?: string }).type !== type) return false;
    return new Date(a.geplande_op).getTime() > now;
  });
}

/** Heeft de lead een toekomstige `volgende_actie_datum` of open afspraak? */
export function heeftToekomstigeActie(lead: AffiliateLead, afspraken: TerugbelAfspraak[]): boolean {
  if (heeftOpenAfspraak(lead.id, afspraken)) return true;
  if (!lead.volgende_actie_datum) return false;
  return new Date(lead.volgende_actie_datum).getTime() > Date.now();
}

/**
 * Welke dialog moet eventueel open voordat we de status zetten?
 * - 'terugbel' → TerugbelDialog (type=terugbel) verplicht
 * - 'demo' → TerugbelDialog (type=demo) verplicht
 * - null → geen precondition
 */
export function vereistDialog(
  uitkomst: UitkomstWaarde,
  lead: AffiliateLead,
  afspraken: TerugbelAfspraak[],
): "terugbel" | "demo" | null {
  if (uitkomst === "terugbellen") {
    return heeftOpenAfspraak(lead.id, afspraken, "terugbel") ? null : "terugbel";
  }
  if (uitkomst === "gesprek_gepland") {
    return heeftToekomstigeActie(lead, afspraken) ? null : "demo";
  }
  if (uitkomst === "demo") {
    return "demo";
  }
  return null;
}
