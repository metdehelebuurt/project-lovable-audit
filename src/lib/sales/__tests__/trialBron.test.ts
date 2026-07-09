import { describe, it, expect } from "vitest";
import { bepaalBron, filterOpBron, telBronnen } from "../trialBron";
import type { SalesTrialPartner } from "@/hooks/sales/useSalesTrials";

function maak(overrides: Partial<SalesTrialPartner>): SalesTrialPartner {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    naam: "Test",
    email: null,
    telefoonnummer: null,
    contactpersoon_voornaam: null,
    contactpersoon_achternaam: null,
    contactpersoon_email: null,
    contactpersoon_telefoon: null,
    contactpersoon_functie: null,
    plaats: null,
    postcode: null,
    adres: null,
    website: null,
    kvk: null,
    status: "trial",
    trial_einddatum: null,
    created_at: new Date().toISOString(),
    trial_bron: null,
    trial_aangemaakt_op: null,
    affiliate: null,
    ...overrides,
  };
}

describe("bepaalBron", () => {
  it("gebruikt expliciete trial_bron wanneer aanwezig", () => {
    expect(bepaalBron(maak({ trial_bron: "sales" }))).toBe("sales");
    expect(bepaalBron(maak({ trial_bron: "google_oauth" }))).toBe("google_oauth");
  });

  it("valt terug op 'affiliate' als er een affiliate aan hangt", () => {
    expect(
      bepaalBron(
        maak({
          trial_bron: null,
          affiliate: { affiliate_id: "a", commissie_percentage: 10, voornaam: null, achternaam: null, email: null },
        }),
      ),
    ).toBe("affiliate");
  });

  it("valt terug op 'selfservice' zonder signalen", () => {
    expect(bepaalBron(maak({ trial_bron: null }))).toBe("selfservice");
  });
});

describe("telBronnen", () => {
  it("telt exact per bron plus totaal onder 'alles'", () => {
    const trials = [
      maak({ trial_bron: "selfservice" }),
      maak({ trial_bron: "selfservice" }),
      maak({ trial_bron: "affiliate" }),
      maak({ trial_bron: "sales" }),
      maak({ trial_bron: "google_oauth" }),
      maak({ trial_bron: null }), // valt terug op selfservice
    ];
    expect(telBronnen(trials)).toEqual({
      alles: 6,
      selfservice: 3,
      affiliate: 1,
      sales: 1,
      google_oauth: 1,
    });
  });

  it("geeft nullen terug bij lege lijst", () => {
    expect(telBronnen([])).toEqual({ alles: 0, selfservice: 0, affiliate: 0, sales: 0, google_oauth: 0 });
  });
});

describe("filterOpBron", () => {
  const trials = [
    maak({ id: "1", trial_bron: "selfservice" }),
    maak({ id: "2", trial_bron: "affiliate" }),
    maak({ id: "3", trial_bron: "sales" }),
    maak({ id: "4", trial_bron: "google_oauth" }),
  ];

  it("laat 'alles' de hele lijst intact", () => {
    expect(filterOpBron(trials, "alles")).toHaveLength(4);
  });

  it.each(["selfservice", "affiliate", "sales", "google_oauth"] as const)(
    "filtert uitsluitend %s trials",
    (bron) => {
      const uit = filterOpBron(trials, bron);
      expect(uit).toHaveLength(1);
      expect(uit[0].trial_bron).toBe(bron);
    },
  );

  it("bron-tellingen matchen exact met filter-resultaat lengths", () => {
    const tel = telBronnen(trials);
    for (const bron of ["selfservice", "affiliate", "sales", "google_oauth"] as const) {
      expect(filterOpBron(trials, bron).length).toBe(tel[bron]);
    }
    expect(filterOpBron(trials, "alles").length).toBe(tel.alles);
  });
});