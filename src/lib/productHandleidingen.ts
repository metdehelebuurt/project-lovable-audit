import { supabase } from "@/integrations/supabase/client";

export type HandleidingType = "installatie" | "gebruiker";

export interface Handleiding {
  product_id: string;
  product_naam: string;
  type: HandleidingType;
  url: string;
  bestandsnaam: string;
}

/**
 * Bouwt een publieke URL voor een opgeslagen handleiding.
 * Paden zijn relatief binnen de `product-images` bucket.
 */
export function buildHandleidingUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}

function extractProductIds(producten: unknown): string[] {
  if (!Array.isArray(producten)) return [];
  const ids = producten
    .map((r) => {
      const obj = (r ?? {}) as Record<string, unknown>;
      const id = obj.product_id;
      return typeof id === "string" && id.length > 0 ? id : null;
    })
    .filter((v): v is string => Boolean(v));
  return Array.from(new Set(ids));
}

async function fetchHandleidingenVoorProductIds(productIds: string[]): Promise<Handleiding[]> {
  if (productIds.length === 0) return [];
  const { data, error } = await supabase
    .from("producten")
    .select(
      "id, naam, installatie_handleiding_url, installatie_handleiding_naam, gebruiker_handleiding_url, gebruiker_handleiding_naam",
    )
    .in("id", productIds);
  if (error) throw error;
  const out: Handleiding[] = [];
  for (const p of data ?? []) {
    if (p.installatie_handleiding_url) {
      out.push({
        product_id: p.id,
        product_naam: p.naam,
        type: "installatie",
        url: buildHandleidingUrl(p.installatie_handleiding_url),
        bestandsnaam: p.installatie_handleiding_naam ?? "Installatiehandleiding.pdf",
      });
    }
    if (p.gebruiker_handleiding_url) {
      out.push({
        product_id: p.id,
        product_naam: p.naam,
        type: "gebruiker",
        url: buildHandleidingUrl(p.gebruiker_handleiding_url),
        bestandsnaam: p.gebruiker_handleiding_naam ?? "Gebruikershandleiding.pdf",
      });
    }
  }
  return out;
}

export async function fetchHandleidingenVoorInstallatie(installatieId: string): Promise<Handleiding[]> {
  const { data, error } = await supabase
    .from("installaties")
    .select("producten")
    .eq("id", installatieId)
    .maybeSingle();
  if (error) throw error;
  const ids = extractProductIds(data?.producten);
  return fetchHandleidingenVoorProductIds(ids);
}

export async function fetchHandleidingenVoorOpdracht(opdrachtId: string): Promise<Handleiding[]> {
  const { data, error } = await supabase
    .from("opdrachten")
    .select("regels")
    .eq("id", opdrachtId)
    .maybeSingle();
  if (error) throw error;
  const ids = extractProductIds(data?.regels);
  return fetchHandleidingenVoorProductIds(ids);
}

export async function fetchHandleidingenVoorRapport(opts: {
  installatieId?: string | null;
  opdrachtId?: string | null;
}): Promise<Handleiding[]> {
  const verzameld: Handleiding[] = [];
  if (opts.installatieId) {
    verzameld.push(...(await fetchHandleidingenVoorInstallatie(opts.installatieId)));
  }
  if (opts.opdrachtId) {
    verzameld.push(...(await fetchHandleidingenVoorOpdracht(opts.opdrachtId)));
  }
  // dedupliceer op product_id+type
  const seen = new Set<string>();
  return verzameld.filter((h) => {
    const key = `${h.product_id}-${h.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}