/**
 * Configurator-type templates voor samengestelde producten.
 * Bepaalt welke template-attributen en welke default slots een assemblage krijgt.
 *
 * MVP-scope: thuisbatterij_pakket volledig uitgewerkt.
 * Overige types: minimale stubs (kunnen we later uitbreiden zonder migratie).
 */

export type ConfigureerbaarType =
  | "thuisbatterij_pakket"
  | "zonnepanelen_set"
  | "warmtepomp_set"
  | "laadpaal_set"
  | "custom";

export type SlotType = "single_select" | "multi_select" | "quantity_step";

export type ProductRol =
  | "batterij_module"
  | "omvormer"
  | "backup_box"
  | "ev_lader"
  | "zonnepaneel"
  | "optimizer"
  | "montage_materiaal"
  | "installatiedienst"
  | "accessoire"
  | "overig";

export interface TemplateAttribuut {
  sleutel: string;
  label: string;
  type: "select" | "boolean";
  opties?: { value: string; label: string }[];
  default: string | boolean;
  helptekst?: string;
}

export interface SlotBlueprint {
  sleutel: string;
  label: string;
  slot_type: SlotType;
  product_rol_filter?: ProductRol;
  categorie_filter?: string; // product_categorie enum-waarde
  spec_filter?: Record<string, string>; // waarden kunnen "{{template.<attr>}}" bevatten
  min_aantal: number;
  max_aantal: number;
  default_aantal: number;
  verplicht: boolean;
  helptekst?: string;
}

export interface ConfigureerbaarTemplate {
  type: ConfigureerbaarType;
  label: string;
  omschrijving: string;
  attributen: TemplateAttribuut[];
  slots: SlotBlueprint[];
}

export const PRODUCT_ROL_LABELS: Record<ProductRol, string> = {
  batterij_module: "Batterij-module / opslag",
  omvormer: "Omvormer / inverter",
  backup_box: "Backup-box / noodstroommodule",
  ev_lader: "Laadpaal (EV)",
  zonnepaneel: "Zonnepaneel",
  optimizer: "Optimizer",
  montage_materiaal: "Montagemateriaal",
  installatiedienst: "Installatie / arbeid",
  accessoire: "Accessoire",
  overig: "Overig",
};

export const CONFIGURATOR_TEMPLATES: Record<ConfigureerbaarType, ConfigureerbaarTemplate> = {
  thuisbatterij_pakket: {
    type: "thuisbatterij_pakket",
    label: "Thuisbatterij totaalpakket",
    omschrijving:
      "Klant configureert batterij-capaciteit, omvormer en optionele backup/installatie op basis van fase-keuze.",
    attributen: [
      {
        sleutel: "fase",
        label: "Aansluiting",
        type: "select",
        opties: [
          { value: "1", label: "1-fase" },
          { value: "3", label: "3-fase" },
        ],
        default: "1",
        helptekst: "Bepaalt welke omvormers en batterijen getoond worden (compatibel op fase).",
      },
      {
        sleutel: "noodstroom",
        label: "Noodstroom / backup",
        type: "boolean",
        default: false,
        helptekst: "Bij aanzetten wordt de backup-box slot getoond.",
      },
      {
        sleutel: "incl_installatie",
        label: "Inclusief installatie",
        type: "boolean",
        default: true,
        helptekst: "Bij aanzetten wordt de installatiedienst slot standaard geselecteerd.",
      },
    ],
    slots: [
      {
        sleutel: "batterij_module",
        label: "Batterij-capaciteit",
        slot_type: "quantity_step",
        product_rol_filter: "batterij_module",
        categorie_filter: "thuisbatterij",
        spec_filter: { fase: "{{template.fase}}-fase" },
        min_aantal: 1,
        max_aantal: 6,
        default_aantal: 1,
        verplicht: true,
        helptekst: "Kies het aantal batterij-modules (capaciteit stapelt).",
      },
      {
        sleutel: "omvormer",
        label: "Omvormer",
        slot_type: "single_select",
        product_rol_filter: "omvormer",
        categorie_filter: "omvormer",
        spec_filter: { fase: "{{template.fase}}-fase" },
        min_aantal: 1,
        max_aantal: 1,
        default_aantal: 1,
        verplicht: true,
        helptekst: "Compatibel op fase met de gekozen batterijen.",
      },
      {
        sleutel: "backup_box",
        label: "Noodstroom-module",
        slot_type: "single_select",
        product_rol_filter: "backup_box",
        min_aantal: 0,
        max_aantal: 1,
        default_aantal: 0,
        verplicht: false,
        helptekst: "Alleen relevant als klant noodstroom wil.",
      },
      {
        sleutel: "installatie",
        label: "Installatie",
        slot_type: "single_select",
        product_rol_filter: "installatiedienst",
        min_aantal: 0,
        max_aantal: 1,
        default_aantal: 1,
        verplicht: false,
        helptekst: "Kies installatiepakket (arbeid, materiaal, oplevering).",
      },
    ],
  },
  zonnepanelen_set: {
    type: "zonnepanelen_set",
    label: "Zonnepanelen-set",
    omschrijving: "Stub — bouw later uit met paneel-aantal, omvormer, optimizer, montage, installatie.",
    attributen: [
      {
        sleutel: "fase",
        label: "Aansluiting",
        type: "select",
        opties: [
          { value: "1", label: "1-fase" },
          { value: "3", label: "3-fase" },
        ],
        default: "1",
      },
    ],
    slots: [
      {
        sleutel: "paneel",
        label: "Zonnepanelen",
        slot_type: "quantity_step",
        product_rol_filter: "zonnepaneel",
        categorie_filter: "zonnepanelen",
        min_aantal: 1,
        max_aantal: 40,
        default_aantal: 8,
        verplicht: true,
      },
      {
        sleutel: "omvormer",
        label: "Omvormer",
        slot_type: "single_select",
        product_rol_filter: "omvormer",
        categorie_filter: "omvormer",
        min_aantal: 1,
        max_aantal: 1,
        default_aantal: 1,
        verplicht: true,
      },
      {
        sleutel: "installatie",
        label: "Installatie",
        slot_type: "single_select",
        product_rol_filter: "installatiedienst",
        min_aantal: 0,
        max_aantal: 1,
        default_aantal: 1,
        verplicht: false,
      },
    ],
  },
  warmtepomp_set: {
    type: "warmtepomp_set",
    label: "Warmtepomp-set (stub)",
    omschrijving: "Nog niet uitgewerkt — kies 'Custom' voor volledige vrijheid.",
    attributen: [],
    slots: [],
  },
  laadpaal_set: {
    type: "laadpaal_set",
    label: "Laadpaal-set (stub)",
    omschrijving: "Nog niet uitgewerkt — kies 'Custom' voor volledige vrijheid.",
    attributen: [],
    slots: [],
  },
  custom: {
    type: "custom",
    label: "Custom (vrije bundel)",
    omschrijving:
      "Klassieke assemblage: definieer zelf slots of gebruik de vaste componentenlijst hieronder.",
    attributen: [],
    slots: [],
  },
};

/**
 * Vervangt {{template.<sleutel>}} placeholders in een spec-filter door de
 * werkelijke template-attribuut-waarden. Gebruikt door de configurator-API
 * en de admin-preview.
 */
export function resolveSpecFilter(
  filter: Record<string, string> | null | undefined,
  templateAttributen: Record<string, unknown>,
): Record<string, string> {
  if (!filter) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(filter)) {
    out[k] = v.replace(/\{\{template\.([a-zA-Z0-9_]+)\}\}/g, (_m, sleutel) => {
      const val = templateAttributen[sleutel];
      return val == null ? "" : String(val);
    });
  }
  return out;
}