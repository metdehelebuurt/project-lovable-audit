/**
 * Auto-mapping van CSV-kolomnamen naar interne lead-velden.
 * Vergelijkt case-insensitive en strip accenten/non-alfanumeriek.
 */

export type SalesVeld =
  | "bedrijfsnaam"
  | "contactpersoon"
  | "voornaam"
  | "achternaam"
  | "functie"
  | "email"
  | "telefoon"
  | "branche"
  | "regio"
  | "website"
  | "notities"
  | "geschatte_waarde"
  | "adres"
  | "postcode"
  | "plaats";

export type VeldGroep = "bedrijf" | "contactpersoon" | "overig";

export const SALES_VELDEN: { key: SalesVeld; label: string; groep: VeldGroep; hint?: string }[] = [
  { key: "bedrijfsnaam", label: "Bedrijfsnaam", groep: "bedrijf", hint: "Naam van het bedrijf / de organisatie" },
  { key: "branche", label: "Branche", groep: "bedrijf" },
  { key: "adres", label: "Adres (straat + huisnr.)", groep: "bedrijf" },
  { key: "postcode", label: "Postcode", groep: "bedrijf" },
  { key: "plaats", label: "Plaats / woonplaats", groep: "bedrijf" },
  { key: "regio", label: "Regio", groep: "bedrijf" },
  { key: "website", label: "Website", groep: "bedrijf" },
  { key: "geschatte_waarde", label: "Geschatte waarde", groep: "bedrijf" },
  { key: "contactpersoon", label: "Contactpersoon (volledige naam)", groep: "contactpersoon", hint: "Volledige naam van de persoon — niet het bedrijf" },
  { key: "voornaam", label: "Voornaam", groep: "contactpersoon" },
  { key: "achternaam", label: "Achternaam", groep: "contactpersoon" },
  { key: "functie", label: "Functie / rol", groep: "contactpersoon" },
  { key: "email", label: "E-mail", groep: "contactpersoon" },
  { key: "telefoon", label: "Telefoon", groep: "contactpersoon" },
  { key: "notities", label: "Notitie", groep: "overig" },
];

export const GROEP_LABEL: Record<VeldGroep, string> = {
  bedrijf: "Bedrijfsgegevens",
  contactpersoon: "Contactpersoon",
  overig: "Overig",
};

const SYNONIEMEN: Record<SalesVeld, string[]> = {
  // Strikt: alleen termen die ondubbelzinnig naar het bedrijf verwijzen.
  // "naam"/"name" zonder context laten we leeg — vaak betreft dat een persoon.
  bedrijfsnaam: ["bedrijfsnaam", "bedrijf", "company", "companyname", "company name", "organisatie", "organization", "klantnaam", "accountname", "account"],
  contactpersoon: ["contactpersoon", "contact", "contactname", "contact name", "aanspreekpunt", "fullname", "full name", "volledigenaam", "naamcontact", "persoon"],
  voornaam: ["voornaam", "firstname", "first name", "givenname", "given name", "vnaam"],
  achternaam: ["achternaam", "lastname", "last name", "surname", "familyname", "family name", "anaam"],
  functie: ["functie", "jobtitle", "job title", "title", "titel", "rol", "role", "position", "functieomschrijving"],
  email: ["email", "emailadres", "emailaddress", "mail", "mailadres", "e", "epost"],
  telefoon: ["telefoon", "telefoonnummer", "phone", "phonenumber", "tel", "mobiel", "mobile", "gsm", "mobielnr"],
  branche: ["branche", "sector", "industrie", "industry", "vakgebied"],
  regio: ["regio", "region", "gebied", "provincie", "province"],
  adres: ["adres", "address", "straat", "street", "straatnaam", "streetname", "adresregel", "addressline", "straatenhuisnummer", "straathuisnummer"],
  postcode: ["postcode", "postalcode", "postal", "zip", "zipcode", "pc"],
  plaats: ["plaats", "stad", "city", "woonplaats", "vestigingsplaats", "locatie", "location", "town"],
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

/**
 * Vertaal CSV-rij naar lead-record. Voornaam/achternaam worden samengevoegd
 * tot contactpersoon (als die niet expliciet gemapt is). Functie wordt aan
 * de notitie toegevoegd. Het bedrijf en de contactpersoon blijven gescheiden.
 */
export function rijNaarLead(
  rij: Record<string, string>,
  mapping: Record<string, SalesVeld | null>,
): Record<string, string> {
  const ruw = {} as Record<SalesVeld, string>;
  for (const [csvKolom, veld] of Object.entries(mapping)) {
    if (!veld) continue;
    const waarde = rij[csvKolom];
    if (waarde !== undefined && waarde !== null && String(waarde).trim() !== "") {
      ruw[veld] = String(waarde).trim();
    }
  }

  const lead: Record<string, string> = {};
  if (ruw.bedrijfsnaam) lead.bedrijfsnaam = ruw.bedrijfsnaam;
  if (ruw.email) lead.email = ruw.email;
  if (ruw.telefoon) lead.telefoon = ruw.telefoon;
  if (ruw.branche) lead.branche = ruw.branche;
  if (ruw.regio) lead.regio = ruw.regio;
  if (ruw.website) lead.website = ruw.website;
  if (ruw.geschatte_waarde) lead.geschatte_waarde = ruw.geschatte_waarde;
  if (ruw.adres) lead.adres = ruw.adres;
  if (ruw.postcode) lead.postcode = ruw.postcode;
  if (ruw.plaats) lead.plaats = ruw.plaats;

  const samengesteldeNaam = [ruw.voornaam, ruw.achternaam].filter(Boolean).join(" ").trim();
  const contact = ruw.contactpersoon || samengesteldeNaam;
  if (contact) lead.contactpersoon = contact;

  const notitieDelen: string[] = [];
  if (ruw.functie) notitieDelen.push(`Functie: ${ruw.functie}`);
  if (ruw.notities) notitieDelen.push(ruw.notities);
  if (notitieDelen.length) lead.notities = notitieDelen.join("\n");

  return lead;
}