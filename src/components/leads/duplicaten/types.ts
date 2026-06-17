export type LeadLite = {
  id: string;
  partner_id: string;
  voornaam: string;
  achternaam: string;
  email: string | null;
  telefoon: string | null;
  bedrijfsnaam: string | null;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
  lead_status: string;
  bron: string | null;
  notities: string | null;
  owner_user_id: string | null;
  toegewezen_aan: string | null;
  created_at: string;
};

export type LeadEigenschappen = {
  id: string;
  lead_id: string;
  woningtype: string | null;
  bouwjaar: number | null;
  daktype: string | null;
  dakrichting: string | null;
  aantal_panelen: number | null;
  huidig_verbruik_kwh: number | null;
  huidige_energielabel: string | null;
  gewenst_energielabel: string | null;
  warmtepomp_interesse: boolean | null;
  batterij_interesse: boolean | null;
  laadpaal_interesse: boolean | null;
  isolatie_interesse: boolean | null;
};

export type DuplicaatPaar = {
  partner_id: string;
  lead_a_id: string;
  lead_b_id: string;
  match_redenen: string[];
  score: number;
};

export const LEAD_FIELDS: { key: keyof LeadLite; label: string }[] = [
  { key: "voornaam", label: "Voornaam" },
  { key: "achternaam", label: "Achternaam" },
  { key: "email", label: "E-mailadres" },
  { key: "telefoon", label: "Telefoon" },
  { key: "bedrijfsnaam", label: "Bedrijfsnaam" },
  { key: "adres", label: "Adres" },
  { key: "postcode", label: "Postcode" },
  { key: "plaats", label: "Plaats" },
  { key: "bron", label: "Bron" },
  { key: "notities", label: "Notities" },
  { key: "lead_status", label: "Status" },
  { key: "toegewezen_aan", label: "Toegewezen aan" },
  { key: "owner_user_id", label: "Eigenaar" },
];

export const EIGENSCHAPPEN_FIELDS: { key: keyof LeadEigenschappen; label: string }[] = [
  { key: "woningtype", label: "Woningtype" },
  { key: "bouwjaar", label: "Bouwjaar" },
  { key: "daktype", label: "Daktype" },
  { key: "dakrichting", label: "Dakrichting" },
  { key: "aantal_panelen", label: "Aantal panelen" },
  { key: "huidig_verbruik_kwh", label: "Huidig verbruik (kWh)" },
  { key: "huidige_energielabel", label: "Huidig energielabel" },
  { key: "gewenst_energielabel", label: "Gewenst energielabel" },
  { key: "warmtepomp_interesse", label: "Interesse warmtepomp" },
  { key: "batterij_interesse", label: "Interesse batterij" },
  { key: "laadpaal_interesse", label: "Interesse laadpaal" },
  { key: "isolatie_interesse", label: "Interesse isolatie" },
];

export const REDEN_LABELS: Record<string, string> = {
  email: "zelfde e-mailadres",
  telefoon: "zelfde telefoonnummer",
  adres: "zelfde adres",
};