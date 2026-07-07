import { describe, it, expect } from "vitest";
import { berekenForecast, berekenPeriodeForecast, berekenDoorlooptijd, winkansVoor, euro } from "../forecast";
import type { SalesLead } from "@/hooks/sales/useSalesLeads";

function lead(overrides: Partial<SalesLead>): SalesLead {
  return {
    id: crypto.randomUUID(),
    bedrijfsnaam: "Test",
    fase_slug: "warm",
    sales_fase: "warm",
    geschatte_waarde: 1000,
    temperatuur: "warm",
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    volgende_actie_op: null,
    ...overrides,
  } as SalesLead;
}

describe("berekenForecast", () => {
  it("telt open leads en berekent gewogen forecast per fase", () => {
    const leads = [
      lead({ fase_slug: "warm", geschatte_waarde: 1000 }),        // 30% → 300
      lead({ fase_slug: "gekwalificeerd", geschatte_waarde: 2000 }), // 55% → 1100
      lead({ fase_slug: "doorgezet", geschatte_waarde: 5000 }),   // 80% → 4000
      lead({ fase_slug: "gewonnen", geschatte_waarde: 3000 }),    // sluit uit open
      lead({ fase_slug: "verloren", geschatte_waarde: 4000 }),    // sluit uit
    ];
    const { perFase, totalen } = berekenForecast(leads);
    expect(totalen.aantalOpen).toBe(3);
    expect(totalen.totaal).toBe(8000);
    expect(totalen.gewogen).toBe(300 + 1100 + 4000);
    expect(totalen.gewonnen30d).toBe(3000);
    expect(perFase.find((f) => f.fase === "warm")?.gewogen).toBe(300);
    expect(perFase.find((f) => f.fase === "doorgezet")?.gewogen).toBe(4000);
  });

  it("winkansVoor valt terug op 10% voor onbekende fases", () => {
    expect(winkansVoor("warm")).toBe(0.30);
    expect(winkansVoor("onbekend")).toBe(0.1);
    expect(winkansVoor(null)).toBe(0.1);
  });
});

describe("berekenPeriodeForecast", () => {
  it("groepeert leads in juiste periode (deze maand + dit kwartaal)", () => {
    const nu = new Date(2026, 6, 15); // 15 juli 2026 (Q3)
    const dezeMaand = new Date(2026, 6, 20).toISOString();
    const volgendeMaand = new Date(2026, 7, 5).toISOString();
    const overKwartaal = new Date(2026, 10, 10).toISOString(); // Q4
    const leads = [
      lead({ fase_slug: "warm", geschatte_waarde: 1000, volgende_actie_op: dezeMaand }),
      lead({ fase_slug: "gekwalificeerd", geschatte_waarde: 2000, volgende_actie_op: volgendeMaand }),
      lead({ fase_slug: "doorgezet", geschatte_waarde: 5000, volgende_actie_op: overKwartaal }),
      lead({ fase_slug: "warm", geschatte_waarde: 999, volgende_actie_op: null }), // negeer, geen close
    ];
    const p = berekenPeriodeForecast(leads, nu);
    const dezeM = p.find((x) => x.key === "deze-maand")!;
    const volM = p.find((x) => x.key === "volgende-maand")!;
    const ditQ = p.find((x) => x.key === "dit-kwartaal")!;
    const volQ = p.find((x) => x.key === "volgend-kwartaal")!;

    expect(dezeM.aantal).toBe(1);
    expect(dezeM.gewogen).toBe(300); // 1000 × 0.30
    expect(volM.aantal).toBe(1);
    expect(volM.gewogen).toBe(1100); // 2000 × 0.55
    // Dit kwartaal (Q3, jul-sep) omvat beide bovenstaande
    expect(ditQ.aantal).toBe(2);
    expect(ditQ.gewogen).toBe(300 + 1100);
    // Volgend kwartaal (Q4) heeft de derde lead
    expect(volQ.aantal).toBe(1);
    expect(volQ.gewogen).toBe(4000); // 5000 × 0.80
  });

  it("negeert gewonnen/verloren leads in periode-forecast", () => {
    const nu = new Date(2026, 6, 15);
    const dezeMaand = new Date(2026, 6, 20).toISOString();
    const leads = [
      lead({ fase_slug: "gewonnen", geschatte_waarde: 9999, volgende_actie_op: dezeMaand }),
      lead({ fase_slug: "verloren", geschatte_waarde: 9999, volgende_actie_op: dezeMaand }),
    ];
    const p = berekenPeriodeForecast(leads, nu);
    for (const x of p) expect(x.aantal).toBe(0);
  });
});

describe("berekenDoorlooptijd", () => {
  it("berekent gemiddelde cyclus en detecteert bottleneck-fase", () => {
    const dagenGeleden = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
    const leads = [
      lead({ fase_slug: "gewonnen", created_at: dagenGeleden(30), updated_at: dagenGeleden(0) }),
      lead({ fase_slug: "gewonnen", created_at: dagenGeleden(50), updated_at: dagenGeleden(0) }),
      lead({ fase_slug: "verloren", created_at: dagenGeleden(70), updated_at: dagenGeleden(0) }),
    ];
    const perFase = [
      { fase: "warm", aantal: 5, waarde: 0, gewogen: 0, gemiddeldeDagen: 12 },
      { fase: "gekwalificeerd", aantal: 3, waarde: 0, gewogen: 0, gemiddeldeDagen: 35 },
      { fase: "doorgezet", aantal: 2, waarde: 0, gewogen: 0, gemiddeldeDagen: 8 },
    ];
    const stats = berekenDoorlooptijd(leads, perFase);
    expect(stats.aantalGewonnen).toBe(2);
    expect(stats.aantalVerloren).toBe(1);
    expect(stats.gemGewonnenDagen).toBe(40);
    expect(stats.gemVerlorenDagen).toBe(70);
    expect(stats.bottleneckFase).toBe("gekwalificeerd");
    expect(stats.bottleneckDagen).toBe(35);
  });

  it("geeft nul-stats terug bij lege input", () => {
    const stats = berekenDoorlooptijd([], []);
    expect(stats.gemGewonnenDagen).toBe(0);
    expect(stats.bottleneckFase).toBeNull();
  });
});

describe("euro formatter", () => {
  it("formatteert korte waarden", () => {
    expect(euro(500)).toBe("€500");
    expect(euro(1500)).toBe("€2k");
    expect(euro(2_500_000)).toBe("€2.5M");
  });
});