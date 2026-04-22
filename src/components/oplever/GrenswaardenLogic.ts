import type { Meting, MetingType } from "./types";

export interface Grenswaarde {
  label: string;
  eenheid: string;
  min?: number;
  max?: number;
  helptekst: string;
}

export const GRENSWAARDEN: Record<MetingType, Grenswaarde> = {
  continuiteit: {
    label: "Continuïteit beschermings-/aardleiding",
    eenheid: "Ω",
    max: 1,
    helptekst: "Maximaal 1 Ω volgens NEN 1010.",
  },
  isolatieweerstand: {
    label: "Isolatieweerstand (500 V)",
    eenheid: "MΩ",
    min: 1,
    helptekst: "Minimaal 1 MΩ per eindgroep.",
  },
  aardimpedantie: {
    label: "Aardcircuitimpedantie",
    eenheid: "Ω",
    max: 1.5,
    helptekst: "Waarschuwing bij waarden boven 1.5 Ω.",
  },
  aardlek_uitschakeltijd: {
    label: "Aardlek uitschakeltijd (30 mA)",
    eenheid: "ms",
    max: 300,
    helptekst: "Maximaal 300 ms bij toetsing met 30 mA.",
  },
  polariteit: {
    label: "Polariteitscontrole",
    eenheid: "",
    helptekst: "Pass/fail.",
  },
  fasevolgorde: {
    label: "Fasevolgorde 3-fase",
    eenheid: "",
    helptekst: "Pass/fail.",
  },
  spanning: {
    label: "Spanning L-N / L-L",
    eenheid: "V",
    min: 207,
    max: 253,
    helptekst: "Tussen 207 en 253 V (230 V ±10%).",
  },
  functioneel: {
    label: "Functionele beproeving",
    eenheid: "",
    helptekst: "Pass/fail per onderdeel.",
  },
};

export function valideerMeting(meting: Meting): boolean | null {
  const grens = GRENSWAARDEN[meting.type];
  if (!grens) return null;
  if (typeof meting.passed === "boolean") return meting.passed;
  if (meting.waarde === undefined || meting.waarde === null || meting.waarde === "") return null;
  const num = typeof meting.waarde === "number" ? meting.waarde : Number(meting.waarde);
  if (Number.isNaN(num)) return null;
  if (grens.min !== undefined && num < grens.min) return false;
  if (grens.max !== undefined && num > grens.max) return false;
  return true;
}

export const STANDAARD_CHECKLIST = [
  { key: "materialen", label: "Juiste materialen toegepast" },
  { key: "bereikbaarheid", label: "Bediening en onderhoud bereikbaar" },
  { key: "aardleiding", label: "Aansluitingen beschermings- en aardleidingen correct" },
  { key: "waarschuwing", label: "Waarschuwingsborden aanwezig" },
  { key: "tekeningen", label: "Tekeningen aanwezig en kloppend" },
  { key: "kabeldim", label: "Kabeldimensionering passend (≥6 mm² bij 5 kW + grotere afstand)" },
  { key: "spd", label: "SPD aanwezig in groepenkast" },
  { key: "aparte_groep", label: "Aparte eindgroep met aardlekautomaat" },
  { key: "selectiviteit", label: "Selectiviteit van automaten/zekeringen" },
] as const;