import {
  assertEquals,
  assertAlmostEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  berekenPrijs,
  resolveSpecFilter,
  specsMatch,
  type AssemblageDef,
  type OptieDef,
  type SlotDef,
} from "./logic.ts";

// -----------------------------------------------------------------------------
// Test fixtures
// -----------------------------------------------------------------------------

const batterijSlot: SlotDef = {
  id: "s1",
  sleutel: "batterij",
  label: "Batterij-module",
  slot_type: "quantity_step",
  product_rol_filter: "batterij_module",
  categorie_filter: null,
  spec_filter: { fase: "{{template.fase}}" },
  min_aantal: 1,
  max_aantal: 4,
  default_aantal: 1,
  verplicht: true,
  volgorde: 1,
  helptekst: null,
};

const omvormerSlot: SlotDef = {
  id: "s2",
  sleutel: "omvormer",
  label: "Omvormer",
  slot_type: "single_select",
  product_rol_filter: "omvormer",
  categorie_filter: null,
  spec_filter: null,
  min_aantal: 1,
  max_aantal: 1,
  default_aantal: 1,
  verplicht: true,
  volgorde: 2,
  helptekst: null,
};

const installatieSlot: SlotDef = {
  id: "s3",
  sleutel: "installatie",
  label: "Installatie",
  slot_type: "single_select",
  product_rol_filter: "installatiedienst",
  categorie_filter: null,
  spec_filter: null,
  min_aantal: 0,
  max_aantal: 1,
  default_aantal: 0,
  verplicht: false,
  volgorde: 3,
  helptekst: null,
};

const opties: Record<string, OptieDef[]> = {
  batterij: [
    { id: "bat-1", prijs_excl_btw: 1000, specs: { fase: "1" } },
    { id: "bat-2", prijs_excl_btw: 1200, specs: { fase: "3" } },
  ],
  omvormer: [
    { id: "omv-1", prijs_excl_btw: 800 },
  ],
  installatie: [
    { id: "ins-1", prijs_excl_btw: 500 },
  ],
};

const somAssemblage: AssemblageDef = {
  prijs_strategie: "som_componenten",
  prijs_excl_btw: 0,
  btw_percentage: 21,
  marge_opslag_percentage: 10,
};

const vastAssemblage: AssemblageDef = {
  prijs_strategie: "vast",
  prijs_excl_btw: 2500,
  btw_percentage: 21,
  marge_opslag_percentage: 0,
};

// -----------------------------------------------------------------------------
// resolveSpecFilter
// -----------------------------------------------------------------------------

Deno.test("resolveSpecFilter vervangt {{template.x}} placeholders", () => {
  const out = resolveSpecFilter({ fase: "{{template.fase}}" }, { fase: "3" });
  assertEquals(out, { fase: "3" });
});

Deno.test("resolveSpecFilter geeft lege string voor ontbrekende template-attr", () => {
  const out = resolveSpecFilter({ fase: "{{template.fase}}" }, {});
  assertEquals(out, { fase: "" });
});

Deno.test("resolveSpecFilter returnt {} voor null filter", () => {
  assertEquals(resolveSpecFilter(null, { fase: "1" }), {});
});

// -----------------------------------------------------------------------------
// specsMatch
// -----------------------------------------------------------------------------

Deno.test("specsMatch: leeg filter matcht altijd", () => {
  assertEquals(specsMatch({ fase: "1" }, {}), true);
  assertEquals(specsMatch(null, {}), true);
});

Deno.test("specsMatch: hoofdletter-ongevoelig", () => {
  assertEquals(specsMatch({ fase: "Drie" }, { fase: "drie" }), true);
});

Deno.test("specsMatch: mismatch => false", () => {
  assertEquals(specsMatch({ fase: "1" }, { fase: "3" }), false);
});

Deno.test("specsMatch: ontbrekende spec => false", () => {
  assertEquals(specsMatch({}, { fase: "1" }), false);
  assertEquals(specsMatch(null, { fase: "1" }), false);
});

Deno.test("specsMatch: lege filter-waarde wordt genegeerd", () => {
  assertEquals(specsMatch({ fase: "1" }, { fase: "", merk: "" }), true);
});

// -----------------------------------------------------------------------------
// berekenPrijs - happy path
// -----------------------------------------------------------------------------

Deno.test("berekenPrijs: som_componenten met marge-opslag", () => {
  const res = berekenPrijs(somAssemblage, [batterijSlot, omvormerSlot], opties, {
    batterij: [{ product_id: "bat-1", aantal: 2 }],
    omvormer: [{ product_id: "omv-1", aantal: 1 }],
  });
  assertEquals(res.waarschuwingen, []);
  assertEquals(res.regels.length, 2);
  assertEquals(res.subtotaal_excl_btw, 2800); // 2*1000 + 800
  assertAlmostEquals(res.totaal_excl_btw, 3080, 0.01); // +10% opslag
  assertAlmostEquals(res.totaal_incl_btw, 3726.8, 0.01); // +21% btw
  assertEquals(res.btw_percentage, 21);
});

Deno.test("berekenPrijs: vast prijs telt grondprijs bij subtotaal op", () => {
  const res = berekenPrijs(vastAssemblage, [batterijSlot, omvormerSlot], opties, {
    batterij: [{ product_id: "bat-1", aantal: 1 }],
    omvormer: [{ product_id: "omv-1", aantal: 1 }],
  });
  assertEquals(res.subtotaal_excl_btw, 1800);
  assertEquals(res.totaal_excl_btw, 4300); // 2500 grondprijs + 1800
  assertEquals(res.waarschuwingen, []);
});

// -----------------------------------------------------------------------------
// berekenPrijs - waarschuwingen
// -----------------------------------------------------------------------------

Deno.test("berekenPrijs: waarschuwt bij ontbreken van verplicht slot", () => {
  const res = berekenPrijs(somAssemblage, [batterijSlot, omvormerSlot], opties, {
    batterij: [{ product_id: "bat-1", aantal: 1 }],
    // omvormer ontbreekt
  });
  assertEquals(
    res.waarschuwingen.some((w) => w.includes("Omvormer") && w.includes("minimaal 1")),
    true,
  );
});

Deno.test("berekenPrijs: waarschuwt bij overschrijden max en slaat slot over", () => {
  const res = berekenPrijs(somAssemblage, [batterijSlot], opties, {
    batterij: [{ product_id: "bat-1", aantal: 5 }], // max = 4
  });
  assertEquals(res.regels.length, 0); // slot overgeslagen
  assertEquals(res.subtotaal_excl_btw, 0);
  assertEquals(
    res.waarschuwingen.some((w) => w.includes("maximum")),
    true,
  );
});

Deno.test("berekenPrijs: waarschuwt bij incompatibel product-id", () => {
  const res = berekenPrijs(somAssemblage, [batterijSlot], opties, {
    batterij: [{ product_id: "onbekend-999", aantal: 1 }],
  });
  assertEquals(res.regels.length, 0);
  assertEquals(
    res.waarschuwingen.some((w) => w.includes("niet compatibel")),
    true,
  );
});

Deno.test("berekenPrijs: optioneel slot zonder keuze levert geen waarschuwing", () => {
  const res = berekenPrijs(somAssemblage, [installatieSlot], opties, {});
  assertEquals(res.waarschuwingen, []);
  assertEquals(res.regels.length, 0);
});

Deno.test("berekenPrijs: BTW-fallback naar 21% als percentage null is", () => {
  const res = berekenPrijs(
    { ...somAssemblage, btw_percentage: null },
    [omvormerSlot],
    opties,
    { omvormer: [{ product_id: "omv-1", aantal: 1 }] },
  );
  assertEquals(res.btw_percentage, 21);
});

Deno.test("berekenPrijs: coerceert string-prijzen naar number", () => {
  const res = berekenPrijs(
    somAssemblage,
    [omvormerSlot],
    { omvormer: [{ id: "omv-x", prijs_excl_btw: "750.50" }] },
    { omvormer: [{ product_id: "omv-x", aantal: 2 }] },
  );
  assertEquals(res.subtotaal_excl_btw, 1501);
});