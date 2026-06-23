/**
 * Auto-mapping van CSV-kolomnamen naar interne lead-velden.
 * Vergelijkt case-insensitive en strip accenten/non-alfanumeriek.
 */

export type SalesVeld =
  | "bedrijfsnaam"
  | "contactpersoon"
  | "email"
  | "telefoon"
  | "branche"
  | "regio"
  | "website"
  | "notities"
  | "geschatte_waarde";

export const SALES_VELDEN: { key: SalesVeld; label: string }[] = [
  { key: "bedrijfsnaam", label: "Bedrijfsnaam" },
  { key: "contactpersoon", label: "Contactpersoon" },
  { key: "email", label: "E-mail" },
  { key: "telefoon", label: "Telefoon" },
  { key: "branche", label: "Branche" },
  { key: "regio", label: "Regio / plaats" },
  { key: "website", label: "Website" },
  { key: "notities", label: "Notitie" },
  { key: "geschatte_waarde", label: "Geschatte waarde" },
];

const SYNONIEMEN: Record<SalesVeld, string[]> = {
  bedrijfsnaam: ["bedrijfsnaam", "bedrijf", "company", "companyname", "organisatie", "organization", "naam", "name", "klant"],
  contactpersoon: ["contactpersoon", "contact", "contactname", "aanspreekpunt", "fullname", "voornaam achternaam", "naamcontact"],
  email: ["email", "emailadres", "emailaddress", "mail", "mailadres", "e", "epost"],
  telefoon: ["telefoon", "telefoonnummer", "phone", "phonenumber", "tel", "mobiel", "mobile", "gsm", "mobielnr"],
  branche: ["branche", "sector", "industrie", "industry", "vakgebied"],
  regio: ["regio", "region", "plaats", "stad", "city", "locatie", "location", "woonplaats", "vestigingsplaats"],
  website: ["website", "url", "site", "homepage", "web"],
  notities: ["notities", "notitie", "opmerking", "opmerkingen", "omschrijving", "beschrijving", "description", "note", "notes", "memo"],
  geschatte_waarde: ["geschattewaarde", "waarde", "value", "budget", "potentie", "geschatewaarde", "estimatedvalue", "omzet"],
};

function normaliseer(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const LOOKUP = new Map<string, SalesVeld>();
for (const [veld, synoniemen] of Object.entries(SYNONIEMEN) as [SalesVeld, string[]][]) {
  for (const syn of synoniemen) {
    LOOKUP.set(normaliseer(syn), veld);
  }
}

/** Probeer een CSV-kolomnaam te koppelen aan een SalesVeld. */
export function detecteerVeld(kolomnaam: string): SalesVeld | null {
  if (!kolomnaam) return null;
  return LOOKUP.get(normaliseer(kolomnaam)) ?? null;
}

/** Auto-mapping voor alle kolommen tegelijk. */
export function autoMapKolommen(kolommen: string[]): Record<string, SalesVeld | null> {
  const resultaat: Record<string, SalesVeld | null> = {};
  const gebruikt = new Set<SalesVeld>();
  for (const k of kolommen) {
    const veld = detecteerVeld(k);
    if (veld && !gebruikt.has(veld)) {
      resultaat[k] = veld;
      gebruikt.add(veld);
    } else {
      resultaat[k] = null;
    }
  }
  return resultaat;
}

/** Vertaal CSV-rij naar lead-record op basis van mapping. */
export function rijNaarLead(
  rij: Record<string, string>,
  mapping: Record<string, SalesVeld | null>,
): Record<SalesVeld, string> {
  const lead = {} as Record<SalesVeld, string>;
  for (const [csvKolom, veld] of Object.entries(mapping)) {
    if (!veld) continue;
    const waarde = rij[csvKolom];
    if (waarde !== undefined && waarde !== null && String(waarde).trim() !== "") {
      lead[veld] = String(waarde).trim();
    }
  }
  return lead;
}