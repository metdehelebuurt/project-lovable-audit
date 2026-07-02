import { supabase } from "@/integrations/supabase/client";
import { emptyOfferteRegel, type OfferteRegel } from "@/types/offerte";

type OpdrachtRegel = {
  product_id?: string | null;
  omschrijving?: string;
  aantal?: number;
  btw_percentage?: number;
  offerte_tekst?: string;
};

type ProductRow = {
  id: string;
  naam: string;
  kostprijs: number | null;
  is_assemblage: boolean | null;
};

type ComponentRow = {
  assemblage_id: string;
  component_id: string;
  aantal: number;
  volgorde: number | null;
  component: {
    id: string;
    naam: string;
    kostprijs: number | null;
  } | null;
};

export type PrefillResult = {
  regels: OfferteRegel[];
  expandedBundles: number;
  totalComponentLines: number;
};

/**
 * Bouw inkooporder-regels op basis van een verkooporder (opdracht).
 * Neemt omschrijving + aantal + product-koppeling over en vult inkoopprijs
 * vanuit de productcatalogus.
 *
 * Wanneer `expandAssemblies` (default true) aan staat worden samengestelde
 * producten uitgeklapt naar losse componentregels — met kostprijs, aantal
 * (component.aantal × bundel.aantal) en referentie naar de bundelnaam in
 * offerte_tekst. Zo kan bij ontvangst per component-SN geboekt worden en
 * komt de voorraad op de juiste componenten terecht.
 */
export async function prefillRegelsUitOpdracht(
  opdrachtId: string,
  partnerId: string,
  opts: { expandAssemblies?: boolean } = {},
): Promise<PrefillResult> {
  const expandAssemblies = opts.expandAssemblies !== false;
  const { data: opdracht, error } = await supabase
    .from("opdrachten")
    .select("id, partner_id, regels")
    .eq("id", opdrachtId)
    .eq("partner_id", partnerId)
    .maybeSingle();
  if (error) throw error;
  if (!opdracht) return { regels: [], expandedBundles: 0, totalComponentLines: 0 };

  const bronRegels = (Array.isArray(opdracht.regels) ? opdracht.regels : []) as OpdrachtRegel[];
  if (bronRegels.length === 0) return { regels: [], expandedBundles: 0, totalComponentLines: 0 };

  const productIds = Array.from(
    new Set(bronRegels.map((r) => r.product_id).filter((x): x is string => !!x)),
  );

  const productMap = new Map<string, ProductRow>();
  if (productIds.length > 0) {
    const { data: producten } = await supabase
      .from("producten")
      .select("id, naam, kostprijs, is_assemblage")
      .in("id", productIds);
    for (const p of (producten ?? []) as ProductRow[]) productMap.set(p.id, p);
  }

  // Componenten ophalen voor alle bundels in één query.
  const bundelIds = expandAssemblies
    ? productIds.filter((id) => productMap.get(id)?.is_assemblage)
    : [];
  const componentenMap = new Map<string, ComponentRow[]>();
  if (bundelIds.length > 0) {
    const { data: comps } = await supabase
      .from("product_componenten" as any)
      .select(
        "assemblage_id, component_id, aantal, volgorde, component:producten!product_componenten_component_id_fkey(id, naam, kostprijs)",
      )
      .in("assemblage_id", bundelIds);
    for (const c of ((comps ?? []) as unknown as ComponentRow[])) {
      const list = componentenMap.get(c.assemblage_id) ?? [];
      list.push(c);
      componentenMap.set(c.assemblage_id, list);
    }
    for (const list of componentenMap.values()) {
      list.sort((a, b) => (a.volgorde ?? 0) - (b.volgorde ?? 0));
    }
  }

  const regels: OfferteRegel[] = [];
  let expandedBundles = 0;
  let totalComponentLines = 0;

  for (const r of bronRegels) {
    const omschr = (r.omschrijving ?? "").trim();
    const aantal = r.aantal ?? 0;
    if (!omschr || aantal <= 0) continue;

    const product = r.product_id ? productMap.get(r.product_id) : undefined;
    const componenten = product?.is_assemblage ? componentenMap.get(product.id) : undefined;

    if (expandAssemblies && componenten && componenten.length > 0) {
      expandedBundles++;
      const bundelNaam = product?.naam ?? omschr;
      for (const c of componenten) {
        if (!c.component) continue;
        const compAantal = Number(c.aantal ?? 0) * aantal;
        if (compAantal <= 0) continue;
        const kost = Number(c.component.kostprijs ?? 0);
        regels.push({
          ...emptyOfferteRegel,
          product_id: c.component.id,
          omschrijving: c.component.naam,
          offerte_tekst: `Uit bundel: ${bundelNaam}`,
          aantal: compAantal,
          prijs_per_stuk: kost > 0 ? kost : 0,
          btw_percentage: r.btw_percentage ?? 21,
        });
        totalComponentLines++;
      }
    } else {
      const kost = product ? Number(product.kostprijs ?? 0) : 0;
      // Gebruik altijd de volledige productnaam (voorkomt afgekapte omschrijvingen zoals "Sigenergy").
      const omschrijvingUit = product?.naam?.trim() ? product.naam : omschr;
      regels.push({
        ...emptyOfferteRegel,
        product_id: r.product_id ?? undefined,
        omschrijving: omschrijvingUit,
        offerte_tekst: r.offerte_tekst ?? "",
        aantal,
        prijs_per_stuk: kost > 0 ? kost : 0,
        btw_percentage: r.btw_percentage ?? 21,
      });
    }
  }

  return { regels, expandedBundles, totalComponentLines };
}