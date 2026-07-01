import { supabase } from "@/integrations/supabase/client";
import { emptyOfferteRegel, type OfferteRegel } from "@/types/offerte";

type OpdrachtRegel = {
  product_id?: string | null;
  omschrijving?: string;
  aantal?: number;
  btw_percentage?: number;
  offerte_tekst?: string;
};

/**
 * Bouw inkooporder-regels op basis van een verkooporder (opdracht).
 * Neemt omschrijving + aantal + product-koppeling over en vult inkoopprijs
 * vanuit de productcatalogus wanneer bekend.
 */
export async function prefillRegelsUitOpdracht(
  opdrachtId: string,
  partnerId: string,
): Promise<{ regels: OfferteRegel[] }> {
  const { data: opdracht, error } = await supabase
    .from("opdrachten")
    .select("id, partner_id, regels")
    .eq("id", opdrachtId)
    .eq("partner_id", partnerId)
    .maybeSingle();
  if (error) throw error;
  if (!opdracht) return { regels: [] };

  const bronRegels = (Array.isArray(opdracht.regels) ? opdracht.regels : []) as OpdrachtRegel[];
  if (bronRegels.length === 0) return { regels: [] };

  const productIds = Array.from(
    new Set(bronRegels.map((r) => r.product_id).filter((x): x is string => !!x)),
  );

  const inkoopprijsMap = new Map<string, number>();
  if (productIds.length > 0) {
    const { data: producten } = await supabase
      .from("producten")
      .select("id, inkoopprijs")
      .in("id", productIds);
    for (const p of producten ?? []) {
      const prijs = Number((p as { inkoopprijs: number | null }).inkoopprijs ?? 0);
      if (prijs > 0) inkoopprijsMap.set((p as { id: string }).id, prijs);
    }
  }

  const regels: OfferteRegel[] = bronRegels
    .filter((r) => (r.omschrijving ?? "").trim() && (r.aantal ?? 0) > 0)
    .map((r) => ({
      ...emptyOfferteRegel,
      product_id: r.product_id ?? undefined,
      omschrijving: r.omschrijving ?? "",
      offerte_tekst: r.offerte_tekst ?? "",
      aantal: r.aantal ?? 1,
      prijs_per_stuk: r.product_id ? (inkoopprijsMap.get(r.product_id) ?? 0) : 0,
      btw_percentage: r.btw_percentage ?? 21,
    }));

  return { regels };
}