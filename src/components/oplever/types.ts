export type OpleverStatus = "concept" | "wacht_op_klant" | "ondertekend" | "afgekeurd" | "vervallen";
export type Verdict = "goedgekeurd" | "goedgekeurd_met_opmerkingen" | "afgekeurd";

export interface BatterijSpec {
  merk?: string;
  type?: string;
  capaciteit_kwh?: number;
  serienummer?: string;
  serienummers?: string[];
  typeplaatje_url?: string;
  ce_markering?: boolean;
}

export interface OmvormerSpec {
  merk?: string;
  type?: string;
  vermogen_kw?: number;
  fasen?: 1 | 3;
  serienummer?: string;
  serienummers?: string[];
  typeplaatje_url?: string;
  ce_markering?: boolean;
  rfg_klasse?: "A" | "B" | "C" | "D";
}

export interface BackupBoxSpec {
  merk?: string;
  type?: string;
  serienummer?: string;
  serienummers?: string[];
  typeplaatje_url?: string;
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

export type RapportType = "elektra" | "isolatie";

/** Eén geïsoleerd bouwdeel binnen een isolatie-opleverrapport. */
export interface IsolatieVlak {
  id: string;
  vlak_type: string;
  omschrijving?: string;
  oppervlakte_m2?: number | null;
  materiaal?: string;
  merk_type?: string;
  verwerking?: string;
  dikte_mm?: number | null;
  lambda?: number | null;
  rd_waarde?: number | null;
  u_waarde?: number | null;
  dampremmer?: boolean;
  charge_batchnummer?: string;
  fotos_voor?: string[];
  fotos_na?: string[];
  opmerking?: string;
}

export interface Opleverrapport {
  id: string;
  partner_id: string;
  rapport_type?: RapportType;
  installatie_id: string | null;
  klant_id: string | null;
  opdracht_id: string | null;
  installateur_id: string | null;
  created_by: string;
  rapportnummer: string;
  template_versie: string;
  status: OpleverStatus;
  scope_omschrijving: string | null;
  opleverdatum: string | null;
  batterij_spec: BatterijSpec;
  omvormer_spec: OmvormerSpec;
  backup_box_spec?: BackupBoxSpec;
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
  vervallen?: boolean;
  vervallen_reden_categorie?: string | null;
  vervallen_reden?: string | null;
  vervallen_op?: string | null;
  vervallen_door?: string | null;
  vervangen_door_id?: string | null;
  vervangt_id?: string | null;
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
  gateway_serienummers?: string[];
  aardweerstand_ohm?: number;
  heeft_backup?: boolean;
  heeft_backup_box?: boolean;
  omvormer_modulair?: boolean;
  scope_normen?: ScopeNormen;
  bekabeling_meterkast?: ChecklistItem[];
  aarding_beveiliging?: ChecklistItem[];
  backup_check?: ChecklistItem[];
  doc_labels?: ChecklistItem[];
  opmerkingen_afwijkingen?: string;
  // Isolatie-specifiek
  isolatie_vlakken?: IsolatieVlak[];
  isolatie_controle?: ChecklistItem[];
  isolatie_documenten?: ChecklistItem[];
  isolatie_thermografie_uitgevoerd?: boolean;
  isolatie_thermografie_notitie?: string;
  isolatie_luchtdichtheid_qv10?: number | null;
  isolatie_co2_besparing_kg?: number | null;
  isolatie_besparing_m3_gas?: number | null;
  isde_aanvraag_ingediend?: boolean;
  isde_aanvraagnummer?: string;
}

export const DEFAULT_CONFORMITEITSTEKST =
  "Ondergetekende verklaart dat de installatie is uitgevoerd en geïnspecteerd conform NEN 1010:2020+A1:2024, in het bijzonder de subdelen 551 (laagspanningsgeneratorsets) en, indien van toepassing, 712 (PV-systemen).";