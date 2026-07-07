import type { SalesLead } from "@/hooks/sales/useSalesLeads";

/** Standaard win-kansen per fase-slug. */
export const FASE_WINKANS: Record<string, number> = {
  koud: 0.05,
  benaderd: 0.15,
  warm: 0.30,
  gekwalificeerd: 0.55,
  doorgezet: 0.80,
  gewonnen: 1,
  verloren: 0,
};

export function winkansVoor(slug: string | null | undefined): number {
  if (!slug) return 0.1;
  return FASE_WINKANS[slug] ?? 0.1;
}

export interface ForecastPerFase {
  fase: string;
  aantal: number;
  waarde: number;
  gewogen: number;
  gemiddeldeDagen: number;
}

export interface ForecastTotalen {
  totaal: number;
  gewogen: number;
  gewonnen30d: number;
  aantalOpen: number;
}

export function berekenForecast(leads: SalesLead[]): {
  perFase: ForecastPerFase[];
  totalen: ForecastTotalen;
} {
  const nu = Date.now();
  const buckets = new Map<string, { aantal: number; waarde: number; gewogen: number; dagen: number[] }>();
  let totaal = 0;
  let gewogen = 0;
  let gewonnen30d = 0;
  let aantalOpen = 0;
  const grens30 = nu - 30 * 86400000;

  for (const l of leads) {
    const slug = l.fase_slug ?? l.sales_fase ?? "koud";
    const waarde = Number(l.geschatte_waarde ?? 0);
    if (slug === "gewonnen") {
      const dt = l.updated_at ? new Date(l.updated_at).getTime() : 0;
      if (dt >= grens30) gewonnen30d += waarde;
      continue;
    }
    if (slug === "verloren") continue;
    aantalOpen += 1;
    totaal += waarde;
    const kans = winkansVoor(slug);
    const g = waarde * kans;
    gewogen += g;
    const b = buckets.get(slug) ?? { aantal: 0, waarde: 0, gewogen: 0, dagen: [] };
    b.aantal += 1;
    b.waarde += waarde;
    b.gewogen += g;
    if (l.updated_at) {
      const d = Math.floor((nu - new Date(l.updated_at).getTime()) / 86400000);
      b.dagen.push(d);
    }
    buckets.set(slug, b);
  }

  const perFase: ForecastPerFase[] = Array.from(buckets.entries()).map(([fase, b]) => ({
    fase,
    aantal: b.aantal,
    waarde: b.waarde,
    gewogen: b.gewogen,
    gemiddeldeDagen: b.dagen.length ? Math.round(b.dagen.reduce((a, c) => a + c, 0) / b.dagen.length) : 0,
  }));

  // Sorteer op standaard-fase-volgorde
  const volgorde = ["koud", "benaderd", "warm", "gekwalificeerd", "doorgezet"];
  perFase.sort((a, b) => {
    const ia = volgorde.indexOf(a.fase);
    const ib = volgorde.indexOf(b.fase);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return { perFase, totalen: { totaal, gewogen, gewonnen30d, aantalOpen } };
}

/** Verzamel-emmer per verwachte closing-periode. */
export interface PeriodeForecast {
  key: string;
  label: string;
  van: Date;
  tot: Date;
  aantal: number;
  waarde: number;
  gewogen: number;
}

function startVanMaand(d: Date, offset = 0): Date {
  return new Date(d.getFullYear(), d.getMonth() + offset, 1);
}

function startVanKwartaal(d: Date, offset = 0): Date {
  const q = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), (q + offset) * 3, 1);
}

/** Sluit-datum inschatten: expliciete velden eerst, anders volgende_actie_op. */
export function verwachteCloseDatum(lead: SalesLead): Date | null {
  const kandidaat = (lead as unknown as Record<string, string | null>).volgende_actie_op
    ?? (lead as unknown as Record<string, string | null>).volgende_actie_datum
    ?? (lead as unknown as Record<string, string | null>).ai_volgende_actie_op;
  if (!kandidaat) return null;
  const d = new Date(kandidaat);
  return isNaN(d.getTime()) ? null : d;
}

export function berekenPeriodeForecast(leads: SalesLead[], nu: Date = new Date()): PeriodeForecast[] {
  const dezeMaand = startVanMaand(nu, 0);
  const volgendeMaand = startVanMaand(nu, 1);
  const maandDaarna = startVanMaand(nu, 2);
  const ditKwartaal = startVanKwartaal(nu, 0);
  const volgendKwartaal = startVanKwartaal(nu, 1);
  const eindeVolgendKwartaal = startVanKwartaal(nu, 2);

  const periodes: PeriodeForecast[] = [
    { key: "deze-maand", label: "Deze maand", van: dezeMaand, tot: volgendeMaand, aantal: 0, waarde: 0, gewogen: 0 },
    { key: "volgende-maand", label: "Volgende maand", van: volgendeMaand, tot: maandDaarna, aantal: 0, waarde: 0, gewogen: 0 },
    { key: "dit-kwartaal", label: "Dit kwartaal", van: ditKwartaal, tot: volgendKwartaal, aantal: 0, waarde: 0, gewogen: 0 },
    { key: "volgend-kwartaal", label: "Volgend kwartaal", van: volgendKwartaal, tot: eindeVolgendKwartaal, aantal: 0, waarde: 0, gewogen: 0 },
  ];

  for (const l of leads) {
    const slug = l.fase_slug ?? l.sales_fase ?? "koud";
    if (slug === "gewonnen" || slug === "verloren") continue;
    const close = verwachteCloseDatum(l);
    if (!close) continue;
    const waarde = Number(l.geschatte_waarde ?? 0);
    const gewogen = waarde * winkansVoor(slug);
    for (const p of periodes) {
      if (close >= p.van && close < p.tot) {
        p.aantal += 1;
        p.waarde += waarde;
        p.gewogen += gewogen;
      }
    }
  }
  return periodes;
}

/** Gemiddelde doorlooptijd van gewonnen leads (created_at → updated_at). */
export interface DoorlooptijdStats {
  gemGewonnenDagen: number;
  gemVerlorenDagen: number;
  aantalGewonnen: number;
  aantalVerloren: number;
  bottleneckFase: string | null;
  bottleneckDagen: number;
}

export function berekenDoorlooptijd(
  leads: SalesLead[],
  perFase: ForecastPerFase[],
): DoorlooptijdStats {
  let sumG = 0, aantalG = 0, sumV = 0, aantalV = 0;
  for (const l of leads) {
    const slug = l.fase_slug ?? l.sales_fase ?? "";
    if (slug !== "gewonnen" && slug !== "verloren") continue;
    if (!l.created_at || !l.updated_at) continue;
    const dagen = Math.max(0, Math.floor((new Date(l.updated_at).getTime() - new Date(l.created_at).getTime()) / 86400000));
    if (slug === "gewonnen") { sumG += dagen; aantalG += 1; }
    else { sumV += dagen; aantalV += 1; }
  }
  let bottleneckFase: string | null = null;
  let bottleneckDagen = 0;
  for (const f of perFase) {
    if (f.gemiddeldeDagen > bottleneckDagen) {
      bottleneckDagen = f.gemiddeldeDagen;
      bottleneckFase = f.fase;
    }
  }
  return {
    gemGewonnenDagen: aantalG ? Math.round(sumG / aantalG) : 0,
    gemVerlorenDagen: aantalV ? Math.round(sumV / aantalV) : 0,
    aantalGewonnen: aantalG,
    aantalVerloren: aantalV,
    bottleneckFase,
    bottleneckDagen,
  };
}

export function euro(v: number): string {
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}k`;
  return `€${Math.round(v)}`;
}