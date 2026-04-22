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
  { key: "deugdelijk_gemonteerd", label: "Deugdelijk gemonteerd, geen beschadigingen" },
  { key: "ventilatie", label: "Voldoende ventilatie rondom apparatuur" },
  { key: "brandveilig", label: "Brandveilig geplaatst (afstand tot brandbaar materiaal)" },
  { key: "toegankelijk_onderhoud", label: "Toegankelijk voor onderhoud" },
  { key: "temperatuur", label: "Temperatuurregeling/condities OK" },
] as const;

export const BEKABELING_CHECKLIST = [
  { key: "kabeldoorsnede", label: "Kabeldoorsneden conform belasting" },
  { key: "mech_bescherming", label: "Mechanische bescherming aanwezig" },
  { key: "mantelbuis", label: "Mantelbuis correct toegepast" },
  { key: "trekontlasting", label: "Trekontlasting bij aansluitingen" },
  { key: "aansluitklemmen", label: "Aansluitklemmen vakkundig vastgedraaid" },
  { key: "hoofdschakelaar", label: "Hoofdschakelaar functioneel en bereikbaar" },
  { key: "aparte_groep_meterkast", label: "Aparte groep voor batterij-installatie" },
  { key: "aardlek_correct", label: "Aardlek correct gedimensioneerd (30 mA type B/A)" },
  { key: "selectiviteit_meterkast", label: "Selectiviteit met hoofdverdeler" },
  { key: "groepen_gelabeld", label: "Groepen duidelijk gelabeld" },
  { key: "schema_bijgewerkt", label: "Installatieschema in meterkast bijgewerkt" },
] as const;

export const AARDING_CHECKLIST = [
  { key: "hoofdaardrail", label: "Hoofdaardrail correct aangesloten" },
  { key: "potentiaalvereffening", label: "Hoofdpotentiaalvereffening uitgevoerd" },
  { key: "spd_ac", label: "Overspanningsbeveiliging (SPD) AC-zijde" },
  { key: "spd_dc", label: "Overspanningsbeveiliging (SPD) DC-zijde" },
  { key: "kortsluitbev", label: "Kortsluitbeveiliging aanwezig" },
  { key: "overbelasting", label: "Overbelastingsbeveiliging aanwezig" },
  { key: "auto_uitschakeling", label: "Automatische uitschakeling functioneel" },
] as const;

export const BACKUP_CHECKLIST = [
  { key: "gateway_geinstalleerd", label: "Gateway / ATS geïnstalleerd" },
  { key: "kritische_groepen", label: "Kritische groepen gescheiden" },
  { key: "functionele_test", label: "Functionele test uitgevoerd" },
  { key: "auto_omschakeling", label: "Automatische omschakeling werkt" },
] as const;

export const DOC_LABELS_CHECKLIST = [
  { key: "waarschuwingsstickers", label: "Waarschuwingsstickers aangebracht" },
  { key: "schemas_overhandigd", label: "Schema's aan klant overhandigd" },
  { key: "handleidingen", label: "Handleidingen overgedragen" },
  { key: "garantievoorwaarden", label: "Garantievoorwaarden verstrekt" },
  { key: "fotos_installatie", label: "Foto's installatie opgeslagen" },
] as const;