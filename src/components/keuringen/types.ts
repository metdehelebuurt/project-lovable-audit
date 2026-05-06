export type KeuringType = "zonnepanelen" | "thuisbatterij" | "combi";
export type KeuringStatus = "gepland" | "in_uitvoering" | "afgerond" | "achterstallig" | "geannuleerd";
export type KeuringResultaat = "goedgekeurd" | "goedgekeurd_met_opmerkingen" | "afgekeurd";
export type ChecklistAntwoord = "ok" | "nok" | "nvt";

export interface ChecklistItem {
  id: string;
  keuring_id: string;
  partner_id: string;
  categorie: string;
  label: string;
  norm_referentie: string | null;
  blokkerend: boolean;
  volgorde: number;
  antwoord: ChecklistAntwoord | null;
  opmerking: string | null;
  foto_pad: string | null;
  meetwaarde: string | null;
  beoordeeld_op: string | null;
}

export interface Keuring {
  id: string;
  partner_id: string;
  keuringnummer: string | null;
  type: KeuringType;
  status: KeuringStatus;
  klant_id: string | null;
  installatie_id: string | null;
  object_omschrijving: string | null;
  locatie_adres: string | null;
  locatie_postcode: string | null;
  locatie_plaats: string | null;
  geplande_datum: string;
  uitgevoerd_op: string | null;
  uitgevoerd_door_id: string | null;
  uitgevoerd_door_naam: string | null;
  uitgevoerd_door_certificering: string | null;
  normenkader: string[];
  resultaat: KeuringResultaat | null;
  score_percentage: number | null;
  conclusie: string | null;
  aanbevelingen: string | null;
  volgende_keuring_datum: string | null;
  next_keuring_id: string | null;
  handtekening_monteur: string | null;
  handtekening_klant: string | null;
  handtekening_klant_naam: string | null;
  pdf_url: string | null;
  pdf_hash: string | null;
  pdf_gegenereerd_op: string | null;
  created_at: string;
  updated_at: string;
}

export const RESULTAAT_LABELS: Record<KeuringResultaat, string> = {
  goedgekeurd: "Goedgekeurd",
  goedgekeurd_met_opmerkingen: "Goedgekeurd met opmerkingen",
  afgekeurd: "Afgekeurd",
};

export const STATUS_LABELS: Record<KeuringStatus, string> = {
  gepland: "Gepland",
  in_uitvoering: "In uitvoering",
  afgerond: "Afgerond",
  achterstallig: "Achterstallig",
  geannuleerd: "Geannuleerd",
};

export const TYPE_LABELS: Record<KeuringType, string> = {
  zonnepanelen: "Zonnepanelen",
  thuisbatterij: "Thuisbatterij",
  combi: "Combi (PV + batterij)",
};