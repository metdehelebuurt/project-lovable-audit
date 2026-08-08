import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { valideerPlan, beschikbareAnkers } from "./tutorial-plan.ts";

const ROL = "partner_admin";
const MODULES = ["offertes", "leads"];

Deno.test("filtert verzonnen ankers en behoudt geldige stappen", () => {
  const plan = valideerPlan(
    {
      titel: "Offerte maken",
      samenvatting: "In vier stappen",
      stappen: [
        { titel: "Open offertes", uitleg: "Klik in het menu.", wacht: "klik", route: "/offertes", anchor: null, textMatch: "Offertes", elementType: "link" },
        { titel: "Verzonnen", uitleg: "Doet niets.", wacht: "klik", anchor: "bestaat:niet", route: null, textMatch: null, elementType: null },
        { titel: "Nieuwe offerte", uitleg: "Klik op de knop.", wacht: "klik", anchor: "offertes:nieuw", route: "/offertes", textMatch: null, elementType: "button" },
      ],
    },
    ROL,
    MODULES,
  );
  assertEquals(plan?.stappen.length, 3);
  assertEquals(plan?.stappen[1].anchor, undefined);
  assertEquals(plan?.stappen[2].anchor, "offertes:nieuw");
});

Deno.test("geeft null bij een leeg of onbruikbaar plan", () => {
  assertEquals(valideerPlan({ stappen: [] }, ROL, MODULES), null);
  assertEquals(valideerPlan({ stappen: [{ titel: "", uitleg: "" }] }, ROL, MODULES), null);
  assertEquals(valideerPlan("kapot", ROL, MODULES), null);
});

Deno.test("toont geen ankers van modules zonder toegang", () => {
  const ids = beschikbareAnkers(ROL, ["leads"]).map((a) => a.id);
  assertEquals(ids.includes("offertes:nieuw"), false);
  assertEquals(ids.includes("leads:nieuw"), true);
  assertEquals(ids.includes("app:hulp"), true);
});
