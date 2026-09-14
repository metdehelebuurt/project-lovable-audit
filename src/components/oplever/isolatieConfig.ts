import type { ChecklistItem, IsolatieVlak } from "./types";

export const ISOLATIE_MATERIALEN = [
  "Glaswol",
  "Steenwol",
  "EPS",
  "XPS",
  "PIR",
  "PUR (spray)",
  "Houtvezel",
  "Cellulose",
  "Vlas/hennep",
  "Parelgrind (EPS)",
  "Spouwschuim",
  "HR++ glas",
  "Triple glas",
  "Anders",
] as const;

export const ISOLATIE_VLAK_TYPES = [
  "Hellend dak (binnenzijde)",
  "Hellend dak (buitenzijde)",
  "Plat dak",
  "Zoldervloer",
  "Spouwmuur",
  "Binnengevel",
  "Buitengevel",
  "Vloer (onderzijde)",
  "Bodem kruipruimte",
  "Kelderwand",
  "Glas / kozijnpaneel",
] as const;

export const ISOLATIE_VERWERKING = [
  "Platen",
  "Rollen/dekens",
  "Inblazen",
  "Spuiten",
  "Bodemafdekking",
  "Beglazing plaatsen",
] as const;

/** ISDE-minimumeisen 2026 per maatregeltype (Rd in m²K/W, glas in U-waarde W/m²K). */
export const ISDE_MINIMUM_RD: Record<string, number> = {
  dak: 3.5,
  zolder_vloer: 3.5,
  spouwmuur: 1.1,
  gevel_binnen: 3.5,
  gevel_buiten: 3.5,
  vloer: 3.5,
  bodem: 3.5,
};

export const ISDE_MAX_U_GLAS = 1.2; // HR++ glas
export const ISDE_MAX_U_TRIPLE = 0.7;

/** Afleiden van de ISDE-categorie op basis van het vlaktype. */
export function isdeCategorieVanVlak(vlakType: string): keyof typeof ISDE_MINIMUM_RD | "glas" | null {
  const t = vlakType.toLowerCase();
  if (t.includes("glas") || t.includes("kozijn")) return "glas";
  if (t.includes("dak")) return "dak";
  if (t.includes("zolder")) return "zolder_vloer";
  if (t.includes("spouw")) return "spouwmuur";
  if (t.includes("binnengevel")) return "gevel_binnen";
  if (t.includes("buitengevel")) return "gevel_buiten";
  if (t.includes("vloer")) return "vloer";
  if (t.includes("bodem") || t.includes("kelder")) return "bodem";
  return null;
}

export interface IsdeToets {
  categorie: string | null;
  voldoet: boolean | null;
  eis: string;
  gemeten: string;
}

/** Toets een vlak aan de ISDE-minimumeis. Geeft null terug als er te weinig gegevens zijn. */
export function toetsIsde(vlak: IsolatieVlak): IsdeToets {
  const cat = isdeCategorieVanVlak(vlak.vlak_type ?? "");
  if (cat === "glas") {
    const u = vlak.u_waarde;
    const eisWaarde = (vlak.materiaal ?? "").toLowerCase().includes("triple") ? ISDE_MAX_U_TRIPLE : ISDE_MAX_U_GLAS;
    return {
      categorie: "Glas",
      voldoet: u == null ? null : u <= eisWaarde,
      eis: `U ≤ ${eisWaarde} W/m²K`,
      gemeten: u == null ? "—" : `U = ${u} W/m²K`,
    };
  }
  if (!cat) return { categorie: null, voldoet: null, eis: "—", gemeten: "—" };
  const eisWaarde = ISDE_MINIMUM_RD[cat];
  const rd = vlak.rd_waarde;
  return {
    categorie: cat.replace(/_/g, " "),
    voldoet: rd == null ? null : rd >= eisWaarde,
    eis: `Rd ≥ ${eisWaarde} m²K/W`,
    gemeten: rd == null ? "—" : `Rd = ${rd} m²K/W`,
  };
}

/** Bereken Rd uit dikte (mm) en lambda (W/mK): Rd = d / λ. */
export function berekenRd(dikteMm?: number | null, lambda?: number | null): number | null {
  if (!dikteMm || !lambda || lambda <= 0) return null;
  return Number(((dikteMm / 1000) / lambda).toFixed(2));
}

export const STANDAARD_ISOLATIE_CHECKLIST: Omit<ChecklistItem, "status">[] = [
  { key: "vlakken_volledig", label: "Alle overeengekomen vlakken volledig geïsoleerd" },
  { key: "aansluitingen_dicht", label: "Aansluitingen en naden luchtdicht afgewerkt" },
  { key: "koudebruggen", label: "Koudebruggen behandeld waar mogelijk" },
  { key: "dampremmer", label: "Dampremmende laag correct aangebracht en doorvoeren afgeplakt" },
  { key: "ventilatie_gewaarborgd", label: "Ventilatie van de constructie/woning gewaarborgd" },
  { key: "ventilatieroosters", label: "Ventilatieroosters en luchttoevoer gecontroleerd" },
  { key: "geen_vochtplekken", label: "Geen zichtbare vocht- of schimmelplekken na uitvoering" },
  { key: "bevestiging_correct", label: "Bevestiging/verankering conform voorschrift fabrikant" },
  { key: "boorgaten_hersteld", label: "Boorgaten hersteld en gevelbeeld in orde" },
  { key: "kruipluik_hersteld", label: "Kruipluik/toegangen correct teruggeplaatst" },
  { key: "brandveiligheid", label: "Brandveiligheid rond doorvoeren en spots gewaarborgd" },
  { key: "werkgebied_opgeruimd", label: "Werkgebied opgeruimd en restmateriaal afgevoerd" },
  { key: "restmateriaal_afgevoerd", label: "Afvoerbewijs restmateriaal aanwezig" },
  { key: "klant_instructie", label: "Klant geïnstrueerd over gebruik, ventilatie en onderhoud" },
];

export const STANDAARD_ISOLATIE_DOCUMENTEN: Omit<ChecklistItem, "status">[] = [
  { key: "productdatasheets", label: "Productdatasheets / KOMO-certificaten overhandigd" },
  { key: "materiaalstaat", label: "Materiaalstaat met Rd-waarden per vlak bijgevoegd" },
  { key: "garantiebewijs", label: "Garantiebewijs materiaal en uitvoering" },
  { key: "isde_bewijsstukken", label: "ISDE-bewijsstukken compleet (factuur, m², Rd/U-waarde)" },
  { key: "onderhoudsadvies", label: "Onderhouds- en ventilatieadvies overhandigd" },
  { key: "fotorapportage", label: "Fotorapportage voor/na toegevoegd" },
];

export const DEFAULT_CONFORMITEITSTEKST_ISOLATIE =
  "Ondergetekende verklaart dat de isolatiewerkzaamheden zijn uitgevoerd conform de overeengekomen specificaties, de verwerkingsvoorschriften van de fabrikant en de geldende eisen uit het Bouwbesluit/Besluit bouwwerken leefomgeving. De opgegeven Rd- en U-waarden zijn gebaseerd op de toegepaste producten en de gemeten of opgemeten oppervlakten.";

/** Totale geïsoleerde oppervlakte over alle vlakken. */
export function totaalOppervlakte(vlakken: IsolatieVlak[]): number {
  return vlakken.reduce((som, v) => som + (Number(v.oppervlakte_m2) || 0), 0);
}

/** Gewogen gemiddelde Rd-waarde over de vlakken (op oppervlakte). */
export function gemiddeldeRd(vlakken: IsolatieVlak[]): number | null {
  const relevant = vlakken.filter((v) => v.rd_waarde && v.oppervlakte_m2);
  if (relevant.length === 0) return null;
  const opp = totaalOppervlakte(relevant);
  if (opp <= 0) return null;
  const som = relevant.reduce((s, v) => s + (v.rd_waarde ?? 0) * (v.oppervlakte_m2 ?? 0), 0);
  return Number((som / opp).toFixed(2));
}
