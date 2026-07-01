import { supabase } from "@/integrations/supabase/client";

export type VoorraadType =
  | "inkomend"
  | "uitgaand"
  | "reservering"
  | "vrijgave"
  | "correctie";

export interface VoorraadMutatie {
  id: string;
  partner_id: string;
  product_id: string;
  type: VoorraadType;
  aantal: number;
  referentie_type: string | null;
  referentie_id: string | null;
  reden: string | null;
  actor_id: string | null;
  created_at: string;
}

export interface VoorraadStand {
  product_id: string;
  vrij: number;
  gereserveerd: number;
  totaal: number;
}

/**
 * Bereken voorraad-stand uit ruwe mutaties + actieve reserveringen.
 */
export const berekenStand = (
  mutaties: Pick<VoorraadMutatie, "type" | "aantal">[],
  gereserveerd: number,
): { totaal: number; vrij: number; gereserveerd: number } => {
  const totaal = mutaties.reduce((sum, m) => {
    if (m.type === "inkomend" || m.type === "vrijgave" || m.type === "correctie") {
      return sum + Number(m.aantal);
    }
    if (m.type === "uitgaand" || m.type === "reservering") {
      return sum - Number(m.aantal);
    }
    return sum;
  }, 0);
  return { totaal, vrij: totaal - gereserveerd + gereserveerd, gereserveerd };
};

/**
 * Schrijf één voorraad-mutatie weg.
 */
export const schrijfMutatie = async (params: {
  partner_id: string;
  product_id: string;
  type: VoorraadType;
  aantal: number;
  referentie_type?: string | null;
  referentie_id?: string | null;
  reden?: string | null;
  actor_id?: string | null;
}): Promise<void> => {
  const { error } = await supabase
    .from("voorraad_mutaties" as any)
    .insert({
      partner_id: params.partner_id,
      product_id: params.product_id,
      type: params.type,
      aantal: params.aantal,
      referentie_type: params.referentie_type ?? null,
      referentie_id: params.referentie_id ?? null,
      reden: params.reden ?? null,
      actor_id: params.actor_id ?? null,
    });
  if (error) throw error;
};

/**
 * Reserveer voorraad voor opdracht-regel (idempotent op opdracht_id+regel_id).
 */
export const reserveerVoorOpdracht = async (params: {
  partner_id: string;
  product_id: string;
  opdracht_id: string;
  regel_id: string;
  aantal: number;
  actor_id?: string | null;
}): Promise<void> => {
  const { data: bestaand } = await supabase
    .from("voorraad_reserveringen" as any)
    .select("id, aantal")
    .eq("opdracht_id", params.opdracht_id)
    .eq("regel_id", params.regel_id)
    .eq("status", "actief")
    .maybeSingle();

  if (bestaand) return; // al gereserveerd

  const { error: resErr } = await supabase
    .from("voorraad_reserveringen" as any)
    .insert({
      partner_id: params.partner_id,
      product_id: params.product_id,
      opdracht_id: params.opdracht_id,
      regel_id: params.regel_id,
      aantal: params.aantal,
      status: "actief",
    });
  if (resErr) throw resErr;

  await schrijfMutatie({
    partner_id: params.partner_id,
    product_id: params.product_id,
    type: "reservering",
    aantal: params.aantal,
    referentie_type: "opdracht",
    referentie_id: params.opdracht_id,
    reden: `Reservering voor opdracht`,
    actor_id: params.actor_id ?? null,
  });
};

/**
 * Geef alle actieve reserveringen voor een opdracht vrij.
 */
export const vrijgevenVoorOpdracht = async (
  partner_id: string,
  opdracht_id: string,
  actor_id?: string | null,
): Promise<void> => {
  const { data: actief, error } = await supabase
    .from("voorraad_reserveringen" as any)
    .select("id, product_id, aantal")
    .eq("opdracht_id", opdracht_id)
    .eq("status", "actief");
  if (error) throw error;
  if (!actief || actief.length === 0) return;

  for (const r of actief as any[]) {
    await supabase
      .from("voorraad_reserveringen" as any)
      .update({ status: "vrijgegeven" })
      .eq("id", r.id);
    await schrijfMutatie({
      partner_id,
      product_id: r.product_id,
      type: "vrijgave",
      aantal: Number(r.aantal),
      referentie_type: "opdracht",
      referentie_id: opdracht_id,
      reden: "Vrijgave bij annulering / wijziging",
      actor_id,
    });
  }
};

const normaliseerProductTekst = (waarde: string | null | undefined): string =>
  (waarde ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const bevatWaarde = (bron: string, waarde: string | null | undefined): boolean => {
  const genormaliseerd = normaliseerProductTekst(waarde);
  return genormaliseerd.length > 3 && bron.includes(genormaliseerd);
};

interface MatchbaarProduct {
  id: string;
  naam: string;
  merk?: string | null;
  model?: string | null;
  artikelnummer?: string | null;
  ean_code?: string | null;
  product_code?: string | null;
}

/**
 * Best-effort match van documentregel-omschrijving op productnaam of codes.
 */
export const matchProductOpRegel = (
  regelOmschrijving: string,
  producten: MatchbaarProduct[],
): { id: string; naam: string } | null => {
  if (!regelOmschrijving) return null;
  const lc = normaliseerProductTekst(regelOmschrijving);
  let hit = producten.find((p) => normaliseerProductTekst(p.naam) === lc);
  if (hit) return hit;
  hit = producten.find((p) => bevatWaarde(lc, p.artikelnummer) || bevatWaarde(lc, p.ean_code));
  if (hit) return hit;
  hit = producten.find((p) => bevatWaarde(lc, p.product_code) || bevatWaarde(lc, p.naam));
  if (hit) return hit;
  hit = producten.find((p) => p.merk && p.model && bevatWaarde(lc, `${p.merk} ${p.model}`));
  return hit ?? null;
};
