import { useAuth } from "@/contexts/AuthContext";

export type BerichtenZichtbaarheid = "alle" | "toegewezen" | "geen";

/**
 * Bepaalt op welke berichten een gebruiker recht heeft (UX-niveau).
 * - 'alle'        → partner-brede inbox (default voor admin/adviseur)
 * - 'toegewezen'  → enkel berichten gekoppeld aan eigen leads/klanten/offertes
 * - 'geen'        → geen toegang (lege inbox + count 0)
 *
 * RLS staat partner-breed lezen toe; deze hook is dus geen security-gate
 * maar een organisatie-instelling die door partner_admin beheerd wordt.
 */
export function useBerichtenZichtbaarheid(): BerichtenZichtbaarheid {
  const { profile } = useAuth();
  const raw = (profile as { berichten_zichtbaarheid?: string } | null)?.berichten_zichtbaarheid;
  if (raw === "toegewezen" || raw === "geen") return raw;
  return "alle";
}

/**
 * Haalt de IDs op van leads/klanten/offertes waar deze gebruiker eigenaar of
 * toegewezene van is. Wordt gebruikt om berichten te filteren bij
 * zichtbaarheid 'toegewezen'.
 */
export async function fetchToegewezenEntiteiten(
  supabase: typeof import("@/integrations/supabase/client").supabase,
  userId: string,
  partnerId: string,
): Promise<{ leadIds: string[]; klantIds: string[]; offerteIds: string[] }> {
  const [leads, klanten, offertes] = await Promise.all([
    supabase
      .from("leads")
      .select("id")
      .eq("partner_id", partnerId)
      .or(`owner_user_id.eq.${userId},toegewezen_aan.eq.${userId}`),
    supabase
      .from("klanten")
      .select("id")
      .eq("partner_id", partnerId)
      .or(`owner_user_id.eq.${userId},toegewezen_aan.eq.${userId}`),
    supabase
      .from("offertes")
      .select("id")
      .eq("partner_id", partnerId)
      .eq("adviseur_id", userId),
  ]);

  return {
    leadIds: (leads.data ?? []).map((r) => (r as { id: string }).id),
    klantIds: (klanten.data ?? []).map((r) => (r as { id: string }).id),
    offerteIds: (offertes.data ?? []).map((r) => (r as { id: string }).id),
  };
}

/**
 * Bouwt een PostgREST .or() filter voor de email_berichten query op basis
 * van toegewezen entiteit-IDs. Geeft null terug wanneer er geen koppelingen
 * zijn (resulterend in 0 berichten).
 */
export function buildToegewezenFilter(ids: {
  leadIds: string[];
  klantIds: string[];
  offerteIds: string[];
}): string | null {
  const parts: string[] = [];
  if (ids.leadIds.length) parts.push(`lead_id.in.(${ids.leadIds.join(",")})`);
  if (ids.klantIds.length) parts.push(`klant_id.in.(${ids.klantIds.join(",")})`);
  if (ids.offerteIds.length) parts.push(`offerte_id.in.(${ids.offerteIds.join(",")})`);
  return parts.length ? parts.join(",") : null;
}