import { describe, expect, it } from "vitest";
import { berekenRd, gemiddeldeRd, toetsIsde, totaalOppervlakte } from "../isolatieConfig";
import { berekenIsolatieBesparing, isolatieVlakkenUitSchouw } from "@/lib/offerte/isolatieBesparing";
import type { IsolatieVlak } from "../types";

const vlak = (p: Partial<IsolatieVlak>): IsolatieVlak =>
  ({ id: p.id ?? "1", vlak_type: p.vlak_type ?? "dak", ...p }) as IsolatieVlak;

describe("isolatieConfig", () => {
  it("berekent Rd uit dikte en lambda", () => {
    expect(berekenRd(120, 0.035)).toBeCloseTo(3.43, 2);
  });

  it("toetst een dakvlak aan de ISDE-minimumeis", () => {
    expect(toetsIsde(vlak({ vlak_type: "dak", rd_waarde: 3.6 })).voldoet).toBe(true);
    expect(toetsIsde(vlak({ vlak_type: "dak", rd_waarde: 2.5 })).voldoet).toBe(false);
  });

  it("telt oppervlakte en middelt Rd gewogen", () => {
    const vlakken = [
      vlak({ id: "a", oppervlakte_m2: 40, rd_waarde: 4 }),
      vlak({ id: "b", oppervlakte_m2: 10, rd_waarde: 2 }),
    ];
    expect(totaalOppervlakte(vlakken)).toBe(50);
    expect(gemiddeldeRd(vlakken)).toBeCloseTo(3.6, 1);
  });
});

describe("isolatiebesparing voor de offerte", () => {
  it("rekent gasbesparing en CO₂ door voor een geïsoleerd dak", () => {
    const res = berekenIsolatieBesparing([{ oppervlakte_m2: 60, rd_huidig: 0.35, rd_nieuw: 4 }]);
    expect(res).not.toBeNull();
    expect(res!.gasbesparingM3).toBeGreaterThan(300);
    expect(res!.co2Reductie).toBeGreaterThan(res!.gasbesparingM3);
    expect(res!.besparing).toBeGreaterThan(0);
  });

  it("geeft null zonder bruikbare vlakken", () => {
    expect(berekenIsolatieBesparing([])).toBeNull();
    expect(berekenIsolatieBesparing([{ oppervlakte_m2: 10, rd_nieuw: 0 }])).toBeNull();
  });

  it("leest vlakken uit schouwgegevens", () => {
    const vlakken = isolatieVlakkenUitSchouw({ dak_oppervlakte: "55", dak_rd_nieuw: 4.5 });
    expect(vlakken).toHaveLength(1);
    expect(vlakken[0]).toMatchObject({ oppervlakte_m2: 55, rd_nieuw: 4.5 });
  });
});
