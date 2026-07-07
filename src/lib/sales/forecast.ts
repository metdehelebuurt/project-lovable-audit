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

export function euro(v: number): string {
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}k`;
  return `€${Math.round(v)}`;
}