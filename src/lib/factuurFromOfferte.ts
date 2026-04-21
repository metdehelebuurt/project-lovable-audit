import { supabase } from "@/integrations/supabase/client";
import type { OfferteRegel } from "@/types/offerte";

export interface EenmaligeRelatieData {
  naam: string;
  email: string | null;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
  telefoon: string | null;
}

export interface BestaandeFactuur {
  id: string;
  documentnummer: string;
  totaal_bedrag: number;
  status: string;
  factuurdatum: string;
  factuur_subtype?: "regulier" | "voorschot" | "eindafrekening";
  termijn_volgnummer?: number | null;
  termijn_percentage?: number | null;
  subtotaal?: number;
  btw_bedrag?: number;
}

export interface OfferteConversieResult {
  /** Het volledige offerte-record voor context-weergave */
  offerte: any;
  /** Gevonden klant id (uit klanten-tabel) */
  klantId?: string;
  /** Eenmalige relatie data wanneer geen klant kon worden gematcht */
  eenmalig?: EenmaligeRelatieData;
  /** Hoe de klant is geresolveerd, voor info-banners */
  resolutionMethod: "lead" | "email" | "naam_postcode" | "eenmalig" | "geen";
  /** Volledig gemapte regels incl. product_id, offerte_tekst, alle korting velden */
  regels: OfferteRegel[];
  /** Geparseerde betalingstermijn in dagen */
  betalingstermijn: number;
  /** Originele tekst van betalingsvoorwaarden indien aanwezig */
  betalingsvoorwaardenTekst?: string;
  /** Voorgevulde notities, inclusief context-header */
  notities: string;
  /** Totaal korting uit offerte regels */
  kortingTotaal: number;
  /** Auto-gekoppelde opdracht */
  opdrachtId?: string;
  /** Auto-gekoppelde installatie */
  installatieId?: string;
  /** Bestaande verkoopfacturen voor deze offerte (waarschuwing dubbele facturatie) */
  bestaandeFacturen: BestaandeFactuur[];
  /** Reeds gefactureerd bedrag (uit offertes.gefactureerd_bedrag of som) */
  reedsGefactureerd: number;
  /** Restbedrag dat nog open staat */
  openstaand: number;
  /** Voorschotfacturen (subtype='voorschot') klaar voor verrekening */
  voorschotten: BestaandeFactuur[];
}

/** Parse betalingsvoorwaarden tekst zoals "30 dagen netto" of "Binnen 14 dagen" naar dagen. */
export function parseBetalingstermijn(tekst: string | null | undefined, fallback = 30): number {
  if (!tekst) return fallback;
  const m = tekst.match(/(\d{1,3})\s*(dag|dagen|days)?/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (!isNaN(n) && n > 0 && n <= 365) return n;
  }
  // bv. "direct" / "contant" → 0
  if (/direct|contant|cash/i.test(tekst)) return 0;
  return fallback;
}

/** Bouw notitie-header met offerte-context. */
function buildNotities(offerte: any): string {
  const header = `Factuur bij offerte ${offerte.offertenummer || ""}`.trim();
  const intro = (offerte.introductie_tekst || "").replace(/<[^>]+>/g, "").trim();
  const orig = (offerte.notities || "").trim();
  const parts = [header];
  if (orig) parts.push(orig);
  if (intro) parts.push(`— Uit offerte: ${intro.slice(0, 280)}${intro.length > 280 ? "…" : ""}`);
  return parts.join("\n\n");
}

/** Centrale converter: zet een offerte om naar voorgevulde factuur-data. */
export async function buildFactuurFromOfferte(
  offerteId: string,
  partnerId: string
): Promise<OfferteConversieResult> {
  const { data: offerte, error } = await supabase
    .from("offertes")
    .select("*")
    .eq("id", offerteId)
    .maybeSingle();

  if (error) throw error;
  if (!offerte) throw new Error("Offerte niet gevonden");

  // ---- Regels met volledige veld-mapping ----
  const ruwRegels = (Array.isArray(offerte.regels) ? offerte.regels : []) as any[];
  const regels: OfferteRegel[] = ruwRegels.map((r: any) => ({
    product_id: r.product_id || undefined,
    omschrijving: r.omschrijving || "",
    offerte_tekst: r.offerte_tekst || "",
    aantal: Number(r.aantal) || 1,
    prijs_per_stuk: Number(r.prijs_per_stuk) || 0,
    btw_percentage: r.btw_percentage ?? 21,
    korting_percentage: Number(r.korting_percentage) || 0,
    korting_bedrag: Number(r.korting_bedrag) || 0,
    korting_type: (r.korting_type === "bedrag" ? "bedrag" : "percentage") as "percentage" | "bedrag",
  }));

  const bruto = regels.reduce((s, r) => s + r.aantal * r.prijs_per_stuk, 0);
  const subtotaal = regels.reduce((s, r) => {
    const b = r.aantal * r.prijs_per_stuk;
    return s + (r.korting_type === "bedrag" ? b - (r.korting_bedrag || 0) : b * (1 - (r.korting_percentage || 0) / 100));
  }, 0);
  const kortingTotaal = Math.max(0, bruto - subtotaal);

  // ---- Klant-resolutie (volgorde: lead → email → naam+postcode → eenmalig) ----
  let klantId: string | undefined;
  let eenmalig: EenmaligeRelatieData | undefined;
  let resolutionMethod: OfferteConversieResult["resolutionMethod"] = "geen";

  // 1. Via lead → klant
  if (offerte.lead_id) {
    const { data: kl } = await supabase
      .from("klanten")
      .select("id")
      .eq("partner_id", partnerId)
      .eq("lead_id", offerte.lead_id)
      .limit(1)
      .maybeSingle();
    if (kl?.id) {
      klantId = kl.id;
      resolutionMethod = "lead";
    }
  }

  // 2. Via email
  if (!klantId && offerte.klant_email) {
    const email = offerte.klant_email.trim().toLowerCase();
    const { data: emailMatches } = await supabase
      .from("klanten")
      .select("id, email, extra_emails")
      .eq("partner_id", partnerId);
    const match = (emailMatches || []).find((k: any) => {
      if ((k.email || "").trim().toLowerCase() === email) return true;
      const extras: string[] = Array.isArray(k.extra_emails) ? k.extra_emails : [];
      return extras.some(e => (e || "").trim().toLowerCase() === email);
    });
    if (match) {
      klantId = match.id;
      resolutionMethod = "email";
    }
  }

  // 3. Naam + postcode fuzzy fallback
  if (!klantId && offerte.klant_naam && offerte.klant_postcode) {
    const postcodeNorm = offerte.klant_postcode.replace(/\s/g, "").toUpperCase();
    const naamLower = offerte.klant_naam.trim().toLowerCase();
    const { data: kandidaten } = await supabase
      .from("klanten")
      .select("id, voornaam, achternaam, bedrijfsnaam, postcode")
      .eq("partner_id", partnerId);
    const match = (kandidaten || []).find((k: any) => {
      const pc = (k.postcode || "").replace(/\s/g, "").toUpperCase();
      if (pc !== postcodeNorm) return false;
      const volledig = `${k.voornaam || ""} ${k.achternaam || ""}`.trim().toLowerCase();
      const bedrijf = (k.bedrijfsnaam || "").trim().toLowerCase();
      return volledig === naamLower || (bedrijf && bedrijf === naamLower);
    });
    if (match) {
      klantId = match.id;
      resolutionMethod = "naam_postcode";
    }
  }

  // 4. Geen match → eenmalige relatie automatisch invullen
  if (!klantId) {
    eenmalig = {
      naam: offerte.klant_naam || "",
      email: offerte.klant_email || null,
      adres: offerte.klant_adres || null,
      postcode: offerte.klant_postcode || null,
      plaats: offerte.klant_plaats || null,
      telefoon: offerte.klant_telefoon || null,
    };
    resolutionMethod = eenmalig.naam ? "eenmalig" : "geen";
  }

  // ---- Auto-koppel opdracht & installatie ----
  let opdrachtId: string | undefined;
  let installatieId: string | undefined;

  const { data: opdracht } = await supabase
    .from("opdrachten")
    .select("id, installatie_id")
    .eq("offerte_id", offerteId)
    .limit(1)
    .maybeSingle();
  if (opdracht?.id) {
    opdrachtId = opdracht.id;
    if (opdracht.installatie_id) installatieId = opdracht.installatie_id;
  }

  if (!installatieId) {
    const { data: inst } = await supabase
      .from("installaties")
      .select("id")
      .eq("offerte_id", offerteId)
      .limit(1)
      .maybeSingle();
    if (inst?.id) installatieId = inst.id;
  }

  // ---- Bestaande facturen check ----
  const { data: bestaande } = await supabase
    .from("financiele_documenten")
    .select("id, documentnummer, totaal_bedrag, status, factuurdatum, factuur_subtype, termijn_volgnummer, termijn_percentage, subtotaal, btw_bedrag")
    .eq("offerte_id", offerteId)
    .eq("type", "verkoopfactuur")
    .order("factuurdatum", { ascending: true });

  const bestaandeFacturen: BestaandeFactuur[] = (bestaande || []).map((b: any) => ({
    id: b.id,
    documentnummer: b.documentnummer,
    totaal_bedrag: Number(b.totaal_bedrag) || 0,
    status: b.status,
    factuurdatum: b.factuurdatum,
    factuur_subtype: b.factuur_subtype || "regulier",
    termijn_volgnummer: b.termijn_volgnummer,
    termijn_percentage: b.termijn_percentage,
    subtotaal: Number(b.subtotaal) || 0,
    btw_bedrag: Number(b.btw_bedrag) || 0,
  }));

  const reedsGefactureerd = Number((offerte as any).gefactureerd_bedrag) || bestaandeFacturen
    .filter(f => f.status !== "concept")
    .reduce((s, f) => s + f.totaal_bedrag, 0);

  const totaalOfferte = Number(offerte.totaal_bedrag) || 0;
  const openstaand = Math.max(0, totaalOfferte - reedsGefactureerd);

  const voorschotten = bestaandeFacturen.filter(
    (f) => f.factuur_subtype === "voorschot" && f.status !== "concept"
  );

  return {
    offerte,
    klantId,
    eenmalig,
    resolutionMethod,
    regels,
    betalingstermijn: parseBetalingstermijn(offerte.betalingsvoorwaarden, 30),
    betalingsvoorwaardenTekst: offerte.betalingsvoorwaarden || undefined,
    notities: buildNotities(offerte),
    kortingTotaal,
    opdrachtId,
    installatieId,
    bestaandeFacturen,
    reedsGefactureerd,
    openstaand,
    voorschotten,
  };
}

export type TermijnModus =
  | "volledig"
  | "voorschot_percentage"
  | "voorschot_bedrag"
  | "eindafrekening";

/** Groepeer offerte-regels per BTW-tarief en geef per tarief het netto subtotaal. */
function groupBtw(regels: OfferteRegel[]): Array<{ pct: number; subtotaal: number }> {
  const map = new Map<number, number>();
  for (const r of regels) {
    const pct = r.btw_percentage ?? 21;
    const bruto = r.aantal * r.prijs_per_stuk;
    const sub = r.korting_type === "bedrag"
      ? bruto - (r.korting_bedrag || 0)
      : bruto * (1 - (r.korting_percentage || 0) / 100);
    map.set(pct, (map.get(pct) || 0) + sub);
  }
  return Array.from(map.entries())
    .map(([pct, subtotaal]) => ({ pct, subtotaal }))
    .sort((a, b) => b.pct - a.pct);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Bouw factuurregels voor een termijn:
 *  - "volledig"            → originele offerteregels
 *  - "voorschot_percentage"→ per BTW-tarief één voorschotregel met X% van die grondslag
 *  - "voorschot_bedrag"    → één regel met vast bedrag (gebruikt dominant BTW-tarief)
 *  - "eindafrekening"      → originele regels + per BTW-tarief een negatieve verrekenregel
 *                            voor het reeds-gefactureerde voorschotbedrag
 */
export function buildTermijnRegels(
  origineel: OfferteConversieResult,
  modus: TermijnModus,
  percentage = 30,
  vastBedrag = 0,
  omschrijvingPrefix?: string,
): OfferteRegel[] {
  if (modus === "volledig") return origineel.regels;

  const offerteNr = origineel.offerte.offertenummer || "";
  const groepen = groupBtw(origineel.regels);
  const prefix = omschrijvingPrefix?.trim() || "Voorschot";

  if (modus === "voorschot_percentage") {
    const factor = Math.max(0, Math.min(100, percentage)) / 100;
    return groepen
      .filter((g) => g.subtotaal > 0)
      .map((g) => ({
        omschrijving: `${prefix} ${percentage}% offerte ${offerteNr} (BTW ${g.pct}%)`,
        offerte_tekst: "",
        aantal: 1,
        prijs_per_stuk: round2(g.subtotaal * factor),
        btw_percentage: g.pct,
        korting_percentage: 0,
        korting_bedrag: 0,
        korting_type: "percentage",
      }));
  }

  if (modus === "voorschot_bedrag") {
    const dominantPct = groepen[0]?.pct ?? 21;
    return [{
      omschrijving: `${prefix} offerte ${offerteNr}`,
      offerte_tekst: "",
      aantal: 1,
      prijs_per_stuk: round2(vastBedrag),
      btw_percentage: dominantPct,
      korting_percentage: 0,
      korting_bedrag: 0,
      korting_type: "percentage",
    }];
  }

  // Eindafrekening: originele regels + per-BTW negatieve verrekening
  const verrekenRegels: OfferteRegel[] = [];
  // Per BTW-tarief: som van voorschot-subtotalen (excl. BTW)
  const voorschotPerTarief = new Map<number, { subtotaal: number; nummers: string[] }>();

  for (const v of origineel.voorschotten) {
    // Splits op basis van dezelfde verhoudingen als de offerte (eenvoudig:
    // gebruik dominant tarief van de voorschotfactuur indien bekend, anders splitsen pro rata)
    const totaalExcl = (v.subtotaal ?? 0) || (v.totaal_bedrag - (v.btw_bedrag ?? 0));
    if (totaalExcl <= 0) continue;

    // Verdeel pro rata over de offerte-BTW-verdeling
    const totaalGroepen = groepen.reduce((s, g) => s + g.subtotaal, 0);
    if (totaalGroepen <= 0) continue;

    for (const g of groepen) {
      const aandeel = (g.subtotaal / totaalGroepen) * totaalExcl;
      if (aandeel <= 0) continue;
      const cur = voorschotPerTarief.get(g.pct) || { subtotaal: 0, nummers: [] };
      cur.subtotaal += aandeel;
      if (!cur.nummers.includes(v.documentnummer)) cur.nummers.push(v.documentnummer);
      voorschotPerTarief.set(g.pct, cur);
    }
  }

  for (const [pct, info] of voorschotPerTarief.entries()) {
    if (info.subtotaal <= 0) continue;
    verrekenRegels.push({
      omschrijving: `Reeds gefactureerd voorschot (${info.nummers.join(", ")}) — BTW ${pct}%`,
      offerte_tekst: "",
      aantal: 1,
      prijs_per_stuk: -round2(info.subtotaal),
      btw_percentage: pct,
      korting_percentage: 0,
      korting_bedrag: 0,
      korting_type: "percentage",
    });
  }

  return [...origineel.regels, ...verrekenRegels];
}

/** Lees alle bestaande termijnen + bepaal volgnummer en totaal voor een nieuwe termijn. */
export function getTermijnContext(ctx: OfferteConversieResult): {
  volgnummer: number;
  totaal: number;
  bestaandeVoorschotten: number;
} {
  const voorschotten = ctx.voorschotten.length;
  // Heuristiek: minimaal 2 (huidige + restant). Meer als al voorschotten bestaan.
  const totaal = Math.max(2, voorschotten + 2);
  return {
    volgnummer: voorschotten + 1,
    totaal,
    bestaandeVoorschotten: voorschotten,
  };
}