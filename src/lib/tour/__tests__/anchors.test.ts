import { describe, expect, it } from "vitest";
import { TOUR_ANCHORS, isBekendAnker, tourAnchor } from "../anchors";

describe("tutorial-ankers", () => {
  it("heeft unieke ids", () => {
    const ids = TOUR_ANCHORS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("heeft een label, route en omschrijving per anker", () => {
    for (const a of TOUR_ANCHORS) {
      expect(a.label.length).toBeGreaterThan(0);
      expect(a.route.length).toBeGreaterThan(0);
      expect(a.omschrijving.length).toBeGreaterThan(0);
    }
  });

  it("herkent bekende en onbekende ankers", () => {
    expect(isBekendAnker("offertes:nieuw")).toBe(true);
    expect(isBekendAnker("verzonnen:anker")).toBe(false);
  });

  it("levert het data-attribuut", () => {
    expect(tourAnchor("leads:nieuw")).toEqual({ "data-tour": "leads:nieuw" });
  });
});
