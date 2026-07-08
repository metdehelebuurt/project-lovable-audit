import { describe, it, expect } from "vitest";
import { expandWideRows } from "../wideRows";

describe("expandWideRows", () => {
  it("laat een lijst zonder persoonskolommen ongewijzigd", () => {
    const input = [{ Organisatie: "Foo", Plaats: "Amsterdam" }];
    expect(expandWideRows(input)).toEqual(input);
  });

  it("expandeert een bedrijf met meerdere contactpersonen naar aparte rijen", () => {
    const input = [
      {
        Organisatie: "Acme",
        Plaats: "Utrecht",
        "Persoon 1 naam": "Jansen, J.",
        "Persoon 1 e-mail": "j@acme.nl",
        "Persoon 2 naam": "De Vries, P.",
        "Persoon 2 e-mail": "p@acme.nl",
        "Persoon 3 naam": "",
        "Persoon 3 e-mail": "",
      },
    ];
    const uit = expandWideRows(input);
    expect(uit).toHaveLength(2);
    expect(uit[0].Organisatie).toBe("Acme");
    expect(uit[0]["Persoon naam"]).toBe("Jansen, J.");
    expect(uit[1]["Persoon e-mail"]).toBe("p@acme.nl");
  });

  it("behoudt een bedrijf zonder ingevulde contactpersonen als één rij", () => {
    const input = [
      {
        Organisatie: "Solo",
        "Persoon 1 naam": "",
        "Persoon 1 e-mail": "",
      },
    ];
    const uit = expandWideRows(input);
    expect(uit).toHaveLength(1);
    expect(uit[0].Organisatie).toBe("Solo");
  });
});