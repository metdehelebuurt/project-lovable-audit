// Pure helpers voor de assemblage-config edge function.
// Losgekoppeld van Deno.serve/Supabase zodat we ze end-to-end kunnen
// testen zonder database.

export interface SlotDef {
  id: string;
  sleutel: string;
  label: string;
  slot_type: "single_select" | "multi_select" | "quantity_step";
  product_rol_filter: string | null;
  categorie_filter: string | null;
  spec_filter: Record<string, string> | null;
  min_aantal: number;
  max_aantal: number;
  default_aantal: number;
  verplicht: boolean;
  volgorde: number;
  helptekst: string | null;
}

export interface AssemblageDef {
  prijs_strategie: "vast" | "som_componenten";
  prijs_excl_btw: number | string;
  btw_percentage: number | null;
  marge_opslag_percentage: number | string;
}

export interface OptieDef {
  id: string;
  prijs_excl_btw: number | string;
  specs?: Record<string, unknown> | null;
}

export type Keuzes = Record<string, Array<{ product_id: string; aantal: number }>>;

export interface PrijsResultaat {
  regels: Array<{
    slot: string;
    product_id: string;
    aantal: number;
    prijs_excl_btw: number;
    regel_totaal: number;
  }>;
  subtotaal_excl_btw: number;
  marge_opslag: number;
  totaal_excl_btw: number;
  totaal_incl_btw: number;
  btw_percentage: number;
  waarschuwingen: string[];
}

export function resolveSpecFilter(
  filter: Record<string, string> | null,
  templateAttrs: Record<string, unknown>,
): Record<string, string> {
  if (!filter) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(filter)) {
    out[k] = v.replace(/\{\{template\.([a-zA-Z0-9_]+)\}\}/g, (_m, key) => {
      const val = templateAttrs[key];
      return val == null ? "" : String(val);
    });
  }
  return out;
}

export function specsMatch(
  productSpecs: Record<string, unknown> | null | undefined,
  filter: Record<string, string>,
): boolean {
  if (!Object.keys(filter).length) return true;
  if (!productSpecs) return false;
  for (const [k, v] of Object.entries(filter)) {
    if (!v) continue;
    const actual = productSpecs[k];
    if (actual == null) return false;
    if (String(actual).toLowerCase() !== String(v).toLowerCase()) return false;
  }
  return true;
}

/**
 * Valideert keuzes tegen slots en berekent de prijs volgens de assemblage-strategie.
 * Retourneert regels, subtotalen en (niet-fatale) waarschuwingen — de aanroeper
 * beslist of waarschuwingen tot een fout leiden.
 */
export function berekenPrijs(
  assemblage: AssemblageDef,
  slots: SlotDef[],
  optiesPerSlot: Record<string, OptieDef[]>,
  keuzes: Keuzes,
): PrijsResultaat {
  const waarschuwingen: string[] = [];
  const regels: PrijsResultaat["regels"] = [];
  let subtotaal = 0;

  for (const slot of slots) {
    const gekozen = keuzes[slot.sleutel] ?? [];
    const totaalAantal = gekozen.reduce((s, k) => s + (Number(k.aantal) || 0), 0);

    if (slot.verplicht && totaalAantal < slot.min_aantal) {
      waarschuwingen.push(`Slot '${slot.label}' vereist minimaal ${slot.min_aantal}.`);
    }
    if (totaalAantal > slot.max_aantal) {
      waarschuwingen.push(`Slot '${slot.label}' overschrijdt maximum (${slot.max_aantal}).`);
      continue;
    }

    const geldigeIds = new Set((optiesPerSlot[slot.sleutel] ?? []).map((p) => p.id));
    for (const k of gekozen) {
      if (!geldigeIds.has(k.product_id)) {
        waarschuwingen.push(
          `Product ${k.product_id} is niet compatibel met slot '${slot.label}'.`,
        );
        continue;
      }
      const prod = (optiesPerSlot[slot.sleutel] ?? []).find((p) => p.id === k.product_id)!;
      const prijsExcl = Number(prod.prijs_excl_btw) || 0;
      const aantal = Number(k.aantal) || 0;
      const regelTotaal = prijsExcl * aantal;
      subtotaal += regelTotaal;
      regels.push({
        slot: slot.sleutel,
        product_id: k.product_id,
        aantal,
        prijs_excl_btw: prijsExcl,
        regel_totaal: regelTotaal,
      });
    }
  }

  const opslagPct = Number(assemblage.marge_opslag_percentage) || 0;
  const btwPct = Number(assemblage.btw_percentage ?? 21);
  let totaal = subtotaal;
  if (assemblage.prijs_strategie === "som_componenten") {
    totaal = subtotaal * (1 + opslagPct / 100);
  } else if (assemblage.prijs_strategie === "vast") {
    totaal = Number(assemblage.prijs_excl_btw ?? 0) + subtotaal;
  }

  return {
    regels,
    subtotaal_excl_btw: Number(subtotaal.toFixed(2)),
    marge_opslag: opslagPct,
    totaal_excl_btw: Number(totaal.toFixed(2)),
    totaal_incl_btw: Number((totaal * (1 + btwPct / 100)).toFixed(2)),
    btw_percentage: btwPct,
    waarschuwingen,
  };
}