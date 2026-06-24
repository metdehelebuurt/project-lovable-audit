export type AffiliateLeadLite = {
  id: string;
  eigenaar_id: string | null;
  bedrijfsnaam: string | null;
  contactpersoon: string | null;
  email: string | null;
  telefoon: string | null;
  website: string | null;
  branche: string | null;
  regio: string | null;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
  status: string | null;
  sales_fase: string | null;
  bron: string | null;
  notities: string | null;
  geschatte_waarde: number | null;
  tags: string[] | null;
  created_at: string;
};

export type AffiliateDuplicaatPaar = {
  eigenaar_id: string | null;
  lead_a_id: string;
  lead_b_id: string;
  match_redenen: string[];
  score: number;
};

export const AFFILIATE_LEAD_FIELDS: { key: keyof AffiliateLeadLite; label: string }[] = [
  { key: "bedrijfsnaam", label: "Bedrijfsnaam" },
  { key: "contactpersoon", label: "Contactpersoon" },
  { key: "email", label: "E-mailadres" },
  { key: "telefoon", label: "Telefoon" },
  { key: "website", label: "Website" },
  { key: "branche", label: "Branche" },
  { key: "regio", label: "Regio" },
  { key: "adres", label: "Adres" },
  { key: "postcode", label: "Postcode" },
  { key: "plaats", label: "Plaats" },
  { key: "status", label: "Status" },
  { key: "sales_fase", label: "Sales fase" },
  { key: "bron", label: "Bron" },
  { key: "geschatte_waarde", label: "Geschatte waarde" },
  { key: "notities", label: "Notities" },
];

export const AFFILIATE_REDEN_LABELS: Record<string, string> = {
  email: "zelfde e-mailadres",
  telefoon: "zelfde telefoonnummer",
  website: "zelfde website",
  bedrijfsnaam: "zelfde bedrijfsnaam",
  adres: "zelfde adres",
};