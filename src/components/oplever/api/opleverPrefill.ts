import { supabase } from "@/integrations/supabase/client";
import type {
  BackupBoxSpec,
  BatterijSpec,
  ExtraVelden,
  OmvormerSpec,
} from "../types";

export interface OpleverPrefill {
  opdracht_id: string | null;
  klant_id: string | null;
  scope_omschrijving: string | null;
  opleverdatum: string | null;
  batterij_spec: BatterijSpec;
  omvormer_spec: OmvormerSpec;
  backup_box_spec: BackupBoxSpec;
  extra_velden: ExtraVelden;
}

interface ProductInfo {
  id: string;
  naam: string;
  merk: string | null;
  model: string | null;
  categorie: string | null;
  is_assemblage: boolean | null;
  heeft_serienummer: boolean | null;
  omvormer_modulair: boolean | null;
  heeft_backup_box: boolean | null;
}

const toDate = (v: string | null | undefined): string | null => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

/**
 * Bouw een prefill-object voor een nieuw opleverrapport op basis van de installatie.
 * Vult klant/opdracht-koppeling, oplever/installatiedatum, projectnummer, scope
 * en de battery/inverter/backup-box specs (incl. serienummers) waar mogelijk in.
 */
export async function buildOpleverPrefillFromInstallatie(
  installatieId: string,
): Promise<OpleverPrefill> {
  const empty: OpleverPrefill = {
    opdracht_id: null,
    klant_id: null,
    scope_omschrijving: null,
    opleverdatum: null,
    batterij_spec: {},
    omvormer_spec: {},
    backup_box_spec: {},
    extra_velden: {},
  };

  const { data: installatie } = await supabase
    .from("installaties")
    .select(
      "id, partner_id, klant_id, opdracht_id, installatienummer, werkomschrijving, geplande_startdatum, gereedmelding_op, werkelijke_eindtijd, producten, klant_adres",
    )
    .eq("id", installatieId)
    .maybeSingle();

  if (!installatie) return empty;

  const opleverdatum =
    toDate(installatie.gereedmelding_op as string | null) ??
    toDate(installatie.werkelijke_eindtijd as string | null) ??
    toDate(installatie.geplande_startdatum as string | null) ??
    new Date().toISOString().slice(0, 10);

  const extra_velden: ExtraVelden = {
    projectnummer: installatie.installatienummer ?? undefined,
    installatiedatum: opleverdatum ?? undefined,
  };

  // Producten uit installatie regels
  const regels = (installatie.producten as Array<{ product_id?: string | null; omschrijving?: string; naam?: string; aantal?: number }> | null) ?? [];
  const productIds = Array.from(
    new Set(regels.map((r) => r.product_id).filter((v): v is string => !!v)),
  );

  let producten: ProductInfo[] = [];
  if (productIds.length > 0) {
    const { data } = await supabase
      .from("producten")
      .select("id, naam, merk, model, categorie, is_assemblage, heeft_serienummer, omvormer_modulair, heeft_backup_box")
      .in("id", productIds);
    producten = (data ?? []) as ProductInfo[];
  }

  // Serienummers voor deze installatie / opdracht
  const orFilters: string[] = [`installatie_id.eq.${installatieId}`];
  if (installatie.opdracht_id) orFilters.push(`opdracht_id.eq.${installatie.opdracht_id}`);
  const { data: sns } = await supabase
    .from("product_serienummers" as never)
    .select("product_id, serienummer, component_type")
    .or(orFilters.join(","));
  const snsRows = (sns ?? []) as Array<{ product_id: string; serienummer: string; component_type?: string | null }>;

  const bucket = {
    batterij: [] as string[],
    omvormer: [] as string[],
    backup_box: [] as string[],
  };

  const classify = (p: ProductInfo | undefined, componentType: string | null | undefined): keyof typeof bucket | null => {
    if (componentType === "batterij") return "batterij";
    if (componentType === "omvormer") return "omvormer";
    if (componentType === "backup_box") return "backup_box";
    if (!p) return null;
    if (p.heeft_backup_box) return "backup_box";
    if (p.omvormer_modulair) return "omvormer";
    const cat = (p.categorie ?? "").toLowerCase();
    if (cat.includes("batterij")) return "batterij";
    if (cat.includes("omvormer") || cat.includes("inverter")) return "omvormer";
    return null;
  };

  const pickMerk: Record<keyof typeof bucket, { merk?: string; type?: string }> = {
    batterij: {},
    omvormer: {},
    backup_box: {},
  };

  for (const row of snsRows) {
    const p = producten.find((pp) => pp.id === row.product_id);
    const key = classify(p, row.component_type);
    if (!key) continue;
    if (row.serienummer && !bucket[key].includes(row.serienummer)) {
      bucket[key].push(row.serienummer);
    }
    if (p && !pickMerk[key].merk) {
      pickMerk[key].merk = p.merk ?? undefined;
      pickMerk[key].type = p.model ?? undefined;
    }
  }

  // Ook zonder SN: leg merk/type vast als er een product in die categorie zit
  for (const p of producten) {
    const key = classify(p, null);
    if (!key) continue;
    if (!pickMerk[key].merk) {
      pickMerk[key].merk = p.merk ?? undefined;
      pickMerk[key].type = p.model ?? undefined;
    }
  }

  const batterij_spec: BatterijSpec = {
    ...(pickMerk.batterij.merk ? { merk: pickMerk.batterij.merk } : {}),
    ...(pickMerk.batterij.type ? { type: pickMerk.batterij.type } : {}),
    ...(bucket.batterij.length > 0
      ? { serienummer: bucket.batterij[0], serienummers: bucket.batterij }
      : {}),
  };
  const omvormer_spec: OmvormerSpec = {
    ...(pickMerk.omvormer.merk ? { merk: pickMerk.omvormer.merk } : {}),
    ...(pickMerk.omvormer.type ? { type: pickMerk.omvormer.type } : {}),
    ...(bucket.omvormer.length > 0
      ? { serienummer: bucket.omvormer[0], serienummers: bucket.omvormer }
      : {}),
  };
  const backup_box_spec: BackupBoxSpec = {
    ...(pickMerk.backup_box.merk ? { merk: pickMerk.backup_box.merk } : {}),
    ...(pickMerk.backup_box.type ? { type: pickMerk.backup_box.type } : {}),
    ...(bucket.backup_box.length > 0
      ? { serienummer: bucket.backup_box[0], serienummers: bucket.backup_box }
      : {}),
  };

  extra_velden.heeft_backup_box = bucket.backup_box.length > 0
    || producten.some((p) => p.heeft_backup_box);
  extra_velden.omvormer_modulair = producten.some((p) => p.omvormer_modulair);

  const scope_omschrijving = installatie.werkomschrijving?.trim() || null;

  return {
    opdracht_id: installatie.opdracht_id ?? null,
    klant_id: installatie.klant_id ?? null,
    scope_omschrijving,
    opleverdatum,
    batterij_spec,
    omvormer_spec,
    backup_box_spec,
    extra_velden,
  };
}