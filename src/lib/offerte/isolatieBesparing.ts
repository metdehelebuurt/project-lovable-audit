/**
 * Vereenvoudigde besparingsberekening voor isolatiemaatregelen.
 * Basis: warmteverlies door een bouwdeel = U-waarde x oppervlakte x graaduren.
 * Aannames zijn bewust conservatief en worden in de offerte als schatting gepresenteerd.
 */

export const ISOLATIE_CONFIG = {
  /** Gemiddelde graaduren per jaar (kKh) voor een Nederlandse woning. */
  graad_kkh: 70,
  /** Verbrandingswaarde aardgas in kWh per m³. */
  kwh_per_m3_gas: 8.8,
  /** Rendement cv-ketel. */
  ketel_rendement: 0.9,
  /** CO₂-uitstoot per m³ aardgas. */
  co2_per_m3_gas: 1.887,
  /** Standaard gasprijs per m³ (incl. belasting). */
  gasprijs_per_m3: 1.45,
  levensduur_jaren: 15,
} as const;

export interface IsolatieVlakInput {
  oppervlakte_m2: number;
  rd_huidig?: number | null;
  rd_nieuw?: number | null;
}

export interface IsolatieBesparing {
  oppervlakte: number;
  gasbesparingM3: number;
  besparing: number;
  co2Reductie: number;
}

/** U-waarde uit Rd-waarde; Rse+Rsi samen ~0,17 m²K/W. */
function uWaarde(rd: number): number {
  return 1 / (rd + 0.17);
}

export function berekenIsolatieBesparing(vlakken: IsolatieVlakInput[]): IsolatieBesparing | null {
  const bruikbaar = vlakken.filter((v) => v.oppervlakte_m2 > 0 && (v.rd_nieuw ?? 0) > 0);
  if (bruikbaar.length === 0) return null;

  let kwh = 0;
  let oppervlakte = 0;
  for (const v of bruikbaar) {
    const rdOud = v.rd_huidig && v.rd_huidig > 0 ? v.rd_huidig : 0.35;
    const deltaU = uWaarde(rdOud) - uWaarde(v.rd_nieuw as number);
    if (deltaU <= 0) continue;
    oppervlakte += v.oppervlakte_m2;
    kwh += deltaU * v.oppervlakte_m2 * ISOLATIE_CONFIG.graad_kkh;
  }
  if (kwh <= 0) return null;

  const gasbesparingM3 = Math.round(kwh / ISOLATIE_CONFIG.kwh_per_m3_gas / ISOLATIE_CONFIG.ketel_rendement);
  return {
    oppervlakte: Math.round(oppervlakte),
    gasbesparingM3,
    besparing: Math.round(gasbesparingM3 * ISOLATIE_CONFIG.gasprijs_per_m3),
    co2Reductie: Math.round(gasbesparingM3 * ISOLATIE_CONFIG.co2_per_m3_gas),
  };
}

type Gegevens = Record<string, unknown>;

function num(o: Gegevens, key: string): number | null {
  const v = o[key];
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Haalt isolatievlakken uit schouwgegevens (per bouwdeel of losse velden). */
export function isolatieVlakkenUitSchouw(gegevens: Gegevens | null | undefined): IsolatieVlakInput[] {
  if (!gegevens) return [];
  const vlakken: IsolatieVlakInput[] = [];

  const lijst = (gegevens as { isolatie_vlakken?: unknown }).isolatie_vlakken;
  if (Array.isArray(lijst)) {
    for (const raw of lijst) {
      if (!raw || typeof raw !== "object") continue;
      const v = raw as Gegevens;
      const opp = num(v, "oppervlakte_m2") ?? num(v, "oppervlakte");
      if (!opp) continue;
      vlakken.push({ oppervlakte_m2: opp, rd_huidig: num(v, "rd_huidig"), rd_nieuw: num(v, "rd_nieuw") ?? num(v, "rd_waarde") });
    }
  }

  for (const deel of ["dak", "muur", "gevel", "vloer", "bodem", "spouwmuur", "zolder"]) {
    const opp = num(gegevens, `${deel}_oppervlakte`) ?? num(gegevens, `oppervlakte_${deel}`);
    if (!opp) continue;
    vlakken.push({
      oppervlakte_m2: opp,
      rd_huidig: num(gegevens, `${deel}_rd_huidig`) ?? num(gegevens, `huidige_rd_${deel}`),
      rd_nieuw: num(gegevens, `${deel}_rd_nieuw`) ?? num(gegevens, `gewenste_rd_waarde`),
    });
  }

  return vlakken;
}
