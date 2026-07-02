import { supabase } from "@/integrations/supabase/client";
import type { OfferteRegel } from "@/types/offerte";

export interface LeverancierGroep {
  leverancier_id: string | null;
  leverancier_naam: string;
  regels: OfferteRegel[];
}

type LevArt = {
  product_id: string;
  leverancier_id: string;
  voorkeur: boolean | null;
  inkoopprijs: number | null;
  leverancier?: { id: string; naam: string } | null;
};

/**
 * Groepeert inkoop-regels per (voorkeurs)leverancier op basis van `leverancier_artikelen`.
 * Regels waarvoor geen leverancier bekend is landen in een fallback-groep met `leverancier_id = null`.
 *
 * De inkoopprijs uit `leverancier_artikelen` overrulet — indien groter dan 0 — de kostprijs
 * van de bronregel, zodat de inkooporder direct correcte prijzen toont.
 */
export async function splitPerLeverancier(
  regels: OfferteRegel[],
  partnerId: string,
): Promise<LeverancierGroep[]> {
  const productIds = Array.from(
    new Set(regels.map((r) => r.product_id).filter((id): id is string => !!id)),
  );

  const byProduct = new Map<string, LevArt>();
  if (productIds.length > 0) {
    const { data } = await supabase
      .from("leverancier_artikelen" as any)
      .select(
        "product_id, leverancier_id, voorkeur, inkoopprijs, leverancier:leveranciers!leverancier_artikelen_leverancier_id_fkey(id, naam)",
      )
      .eq("partner_id", partnerId)
      .in("product_id", productIds);
    // Kies per product de voorkeur; anders eerste.
    const rows = ((data ?? []) as unknown as LevArt[]);
    for (const row of rows) {
      const bestaand = byProduct.get(row.product_id);
      if (!bestaand) {
        byProduct.set(row.product_id, row);
        continue;
      }
      if (row.voorkeur && !bestaand.voorkeur) byProduct.set(row.product_id, row);
    }
  }

  const groepen = new Map<string, LeverancierGroep>();
  const keyFor = (id: string | null) => id ?? "__onbekend__";

  for (const regel of regels) {
    const link = regel.product_id ? byProduct.get(regel.product_id) : undefined;
    const levId = link?.leverancier_id ?? null;
    const naam = link?.leverancier?.naam ?? "Onbekende leverancier";
    const key = keyFor(levId);
    if (!groepen.has(key)) {
      groepen.set(key, { leverancier_id: levId, leverancier_naam: naam, regels: [] });
    }
    const gekoppeldePrijs = Number(link?.inkoopprijs ?? 0);
    groepen.get(key)!.regels.push({
      ...regel,
      prijs_per_stuk: gekoppeldePrijs > 0 ? gekoppeldePrijs : regel.prijs_per_stuk,
    });
  }

  // Onbekende leverancier altijd achteraan.
  return Array.from(groepen.values()).sort((a, b) => {
    if (a.leverancier_id === null) return 1;
    if (b.leverancier_id === null) return -1;
    return a.leverancier_naam.localeCompare(b.leverancier_naam);
  });
}