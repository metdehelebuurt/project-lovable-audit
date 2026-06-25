/**
 * Bouwt een placeholder-context op die zowel onderwerp als body
 * van een planning-mail vult. Alle waarden zijn strings; ontbrekende
 * velden krijgen lege string zodat letterlijke "{{x.y}}" nooit
 * in een verzonden mail belandt.
 *
 * Wordt gebruikt door MailReviewDialog (klant + collega tab) bij
 * inplannen van demo / terugbel / trial.
 */

export interface PlanningContextInput {
  lead?: {
    voornaam?: string | null;
    achternaam?: string | null;
    contactpersoon?: string | null;
    bedrijfsnaam?: string | null;
    email?: string | null;
    telefoon?: string | null;
  } | null;
  affiliate?: {
    voornaam?: string | null;
    achternaam?: string | null;
    email?: string | null;
    telefoon?: string | null;
    bedrijfsnaam?: string | null;
  } | null;
  collega?: {
    voornaam?: string | null;
    achternaam?: string | null;
    email?: string | null;
    telefoon?: string | null;
  } | null;
  planner?: {
    voornaam?: string | null;
    achternaam?: string | null;
    email?: string | null;
  } | null;
  afspraak: {
    type: "terugbel" | "demo" | "trial";
    gepland_op: string; // ISO
    duur_minuten?: number | null;
    notitie?: string | null;
    link?: string | null;
    locatie?: string | null;
  };
  trial?: {
    url?: string | null;
    eind_datum_iso?: string | null;
  } | null;
}

function splitNaam(volledig?: string | null): { voornaam: string; achternaam: string } {
  const v = (volledig ?? "").trim();
  if (!v) return { voornaam: "", achternaam: "" };
  const idx = v.indexOf(" ");
  if (idx === -1) return { voornaam: v, achternaam: "" };
  return { voornaam: v.slice(0, idx), achternaam: v.slice(idx + 1).trim() };
}

function naamCombi(voornaam?: string | null, achternaam?: string | null): string {
  return [voornaam, achternaam].filter(Boolean).join(" ").trim();
}

function formatDatumLang(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("nl-NL", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDatumKort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
  } catch {
    return iso;
  }
}

function formatTijd(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export type PlanningContext = Record<string, string>;

export function buildPlanningContext(input: PlanningContextInput): PlanningContext {
  // Lead-naam: leadbron heeft soms "contactpersoon" (volledige string),
  // soms aparte voornaam/achternaam. We accepteren beide en vallen terug.
  const leadFromContact = splitNaam(input.lead?.contactpersoon);
  const leadVoornaam = input.lead?.voornaam || leadFromContact.voornaam || "";
  const leadAchternaam = input.lead?.achternaam || leadFromContact.achternaam || "";

  const affiliateNaam = naamCombi(input.affiliate?.voornaam, input.affiliate?.achternaam);
  const collegaNaam = naamCombi(input.collega?.voornaam, input.collega?.achternaam);
  const plannerNaam = naamCombi(input.planner?.voornaam, input.planner?.achternaam);

  const gepland = input.afspraak.gepland_op;

  // Trial-eind menselijk formatteren
  let trialEindLang = "";
  if (input.trial?.eind_datum_iso) {
    trialEindLang = formatDatumLang(input.trial.eind_datum_iso);
  }

  const ctx: PlanningContext = {
    // Lead
    "lead.voornaam": leadVoornaam,
    "lead.achternaam": leadAchternaam,
    "lead.naam": naamCombi(leadVoornaam, leadAchternaam) || input.lead?.contactpersoon || "",
    "lead.bedrijf": input.lead?.bedrijfsnaam ?? "",
    "lead.email": input.lead?.email ?? "",
    "lead.telefoon": input.lead?.telefoon ?? "",
    // Affiliate (eigenaar van de lead — gebruikt in mails naar klant)
    "affiliate.naam": affiliateNaam || "Team mijnhuis.nu",
    "affiliate.voornaam": input.affiliate?.voornaam ?? "",
    "affiliate.achternaam": input.affiliate?.achternaam ?? "",
    "affiliate.email": input.affiliate?.email ?? "",
    "affiliate.telefoon": input.affiliate?.telefoon ?? "",
    "affiliate.bedrijf": input.affiliate?.bedrijfsnaam ?? "mijnhuis.nu",
    // Collega (interne ontvanger)
    "collega.naam": collegaNaam,
    "collega.voornaam": input.collega?.voornaam ?? "",
    "collega.email": input.collega?.email ?? "",
    "collega.telefoon": input.collega?.telefoon ?? "",
    // Planner (de ingelogde gebruiker die de afspraak inplant)
    "planner.naam": plannerNaam,
    "planner.email": input.planner?.email ?? "",
    // Afspraak
    "afspraak.type": input.afspraak.type,
    "afspraak.type_label": labelVoorType(input.afspraak.type),
    "afspraak.datum_lang": formatDatumLang(gepland),
    "afspraak.datum_kort": formatDatumKort(gepland),
    "afspraak.tijd": formatTijd(gepland),
    "afspraak.duur": input.afspraak.duur_minuten ? `${input.afspraak.duur_minuten} minuten` : "",
    "afspraak.notitie": input.afspraak.notitie ?? "",
    "afspraak.locatie": input.afspraak.locatie ?? "Online (Google Meet)",
    "afspraak.link": input.afspraak.link ?? "",
    // Terugbel-aliassen voor templates die "terugbel.*" gebruiken
    "terugbel.datum_lang": formatDatumLang(gepland),
    "terugbel.datum_kort": formatDatumKort(gepland),
    "terugbel.tijd": formatTijd(gepland),
    // Trial
    "trial.url": input.trial?.url ?? "https://app.mijnhuis.nu",
    "trial.eind_datum": trialEindLang,
  };
  return ctx;
}

function labelVoorType(type: PlanningContextInput["afspraak"]["type"]): string {
  if (type === "demo") return "Demo";
  if (type === "terugbel") return "Terugbelafspraak";
  return "Trial-start";
}

/**
 * Vervangt {{x.y}} door waarden uit de context. Onbekende of lege
 * placeholders worden vervangen door lege string zodat ontvangers
 * nooit ruwe template-syntax zien.
 */
export function renderWithContext(template: string, ctx: PlanningContext): string {
  return (template ?? "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => ctx[key] ?? "");
}

/**
 * Welke placeholders zitten er nog in een tekst nadat we de context
 * hebben toegepast? Lege array = alles is netjes ingevuld.
 */
export function ontbrekendePlaceholders(template: string, ctx: PlanningContext): string[] {
  const out = new Set<string>();
  const re = /\{\{\s*([\w.]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template ?? "")) !== null) {
    const key = m[1];
    if (!ctx[key]) out.add(key);
  }
  return [...out];
}