export type OpleverStatus = "concept" | "wacht_op_klant" | "ondertekend" | "afgekeurd";
export type Verdict = "goedgekeurd" | "goedgekeurd_met_opmerkingen" | "afgekeurd";

export interface BatterijSpec {
  merk?: string;
  type?: string;
  capaciteit_kwh?: number;
  serienummer?: string;
  typeplaatje_url?: string;
  ce_markering?: boolean;
}

export interface OmvormerSpec {
  merk?: string;
  type?: string;
  vermogen_kw?: number;
  fasen?: 1 | 3;
  serienummer?: string;
  typeplaatje_url?: string;
  ce_markering?: boolean;
  rfg_klasse?: "A" | "B" | "C" | "D";
}

export interface Opstelling {
  locatie?: string;
  droog?: boolean;
  geventileerd?: boolean;
  stevige_ondergrond?: boolean;
  geen_leefruimte?: boolean;
  vrije_werkruimte?: boolean;
}

export type ChecklistStatus = "pass" | "fail" | "nvt";

export interface ChecklistItem {
  key: string;
  label: string;
  status: ChecklistStatus | null;
  opmerking?: string;
  fotos?: string[];
}

export type MetingType =
  | "continuiteit"
  | "isolatieweerstand"
  | "aardimpedantie"
  | "aardlek_uitschakeltijd"
  | "polariteit"
  | "fasevolgorde"
  | "spanning"
  | "functioneel";

export interface Meting {
  id: string;
  type: MetingType;
  groep?: string;
  waarde?: number | string;
  eenheid?: string;
  passed?: boolean;
  opmerking?: string;
}

export interface Meetapparatuur {
  merk?: string;
  type?: string;
  serienummer?: string;
  laatste_kalibratie?: string;
}

export interface CircuitGroep {
  nummer: string;
  functie: string;
  kabeltype?: string;
  diameter_mm2?: number;
  beveiliging_a?: number;
  aardlek_ma?: number;
}

export interface OpleverDocument {
  type: "installatieschema" | "meterkasttekening" | "netbeheerder_aanmelding" | "scios" | "datasheet" | "overig";
  url: string;
  naam?: string;
  uploaded_at?: string;
}

export interface Bevindingen {
  verdict: Verdict | null;
  deficiencies: string[];
  recommendations: string[];
}

export interface Handtekening {
  image_url: string;
  name: string;
  signed_at: string;
  ip?: string;
}

export interface Opleverrapport {
  id: string;
  partner_id: string;
  installatie_id: string | null;
  klant_id: string | null;
  installateur_id: string | null;
  created_by: string;
  rapportnummer: string;
  template_versie: string;
  status: OpleverStatus;
  scope_omschrijving: string | null;
  opleverdatum: string | null;
  batterij_spec: BatterijSpec;
  omvormer_spec: OmvormerSpec;
  opstelling: Opstelling;
  visuele_inspectie: ChecklistItem[];
  metingen: Meting[];
  meetapparatuur: Meetapparatuur;
  groepenverdeling: CircuitGroep[];
  documenten: OpleverDocument[];
  bevindingen: Bevindingen;
  conformiteitstekst: string | null;
  installateur_handtekening: Handtekening | null;
  klant_handtekening: Handtekening | null;
  klant_token: string | null;
  klant_token_expires_at: string | null;
  pdf_url: string | null;
  pdf_hash: string | null;
  gefinaliseerd_op: string | null;
  created_at: string;
  updated_at: string;
  extra_velden?: ExtraVelden;
}

export interface ScopeNormen {
  nen1010?: boolean;
  nen3140?: boolean;
  fabrikant?: boolean;
  netbeheerder?: boolean;
}

export interface ExtraVelden {
  projectnummer?: string;
  installatiedatum?: string;
  aansluitwaarde?: string;
  systeem_type?: "AC" | "DC";
  gateway_serienummer?: string;
  aardweerstand_ohm?: number;
  heeft_backup?: boolean;
  scope_normen?: ScopeNormen;
  bekabeling_meterkast?: ChecklistItem[];
  aarding_beveiliging?: ChecklistItem[];
  backup_check?: ChecklistItem[];
  doc_labels?: ChecklistItem[];
  opmerkingen_afwijkingen?: string;
}

export const DEFAULT_CONFORMITEITSTEKST =
  "Ondergetekende verklaart dat de installatie is uitgevoerd en geïnspecteerd conform NEN 1010:2020+A1:2024, in het bijzonder de subdelen 551 (laagspanningsgeneratorsets) en, indien van toepassing, 712 (PV-systemen).";