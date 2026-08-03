import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { toAsciiHeader } from "../_shared/mail-header.ts";

/** Een headerwaarde is veilig als denomailer er nooit een encoded-word van maakt. */
function isSafeHeader(value: string): boolean {
  return (
    /^[\x20-\x7E]*$/.test(value) &&
    !/[\r\n]/.test(value) &&
    value.length <= 200
  );
}

Deno.test("laat pure ASCII ongewijzigd", () => {
  assertEquals(toAsciiHeader("Offerte 2026-0001 voor Jansen"), "Offerte 2026-0001 voor Jansen");
});

Deno.test("strip diakrieten uit klantnamen", () => {
  assertEquals(toAsciiHeader("Offerte voor José Müller-Beauchêne"), "Offerte voor Jose Muller-Beauchene");
  assertEquals(toAsciiHeader("Renée Öztürk"), "Renee Ozturk");
});

Deno.test("vervangt speciale tekens door ASCII-equivalent", () => {
  assertEquals(toAsciiHeader("Prijs €1.250 – scherp"), "Prijs EUR1.250 - scherp");
  assertEquals(toAsciiHeader("„Slimme” keuze’s"), '"Slimme" keuze\'s');
  assertEquals(toAsciiHeader("Straße 12"), "Strasse 12");
});

Deno.test("verwijdert regelafbrekingen (header-injectie)", () => {
  const out = toAsciiHeader("Offerte\r\nBcc: aanvaller@example.com");
  assert(!/[\r\n]/.test(out));
  assertEquals(out, "Offerte Bcc: aanvaller@example.com");
});

Deno.test("verwijdert tabs en dubbele spaties", () => {
  assertEquals(toAsciiHeader("Offerte\tvoor   Jansen "), "Offerte voor Jansen");
});

Deno.test("kort lange onderwerpen af tot maxLength", () => {
  const lang = "Offerte thuisbatterij inclusief installatie en montage ".repeat(10);
  const out = toAsciiHeader(lang);
  assertEquals(out.length <= 200, true);
  assert(out.endsWith("..."));
});

Deno.test("respecteert aangepaste maxLength voor afzendernaam", () => {
  const out = toAsciiHeader("Smart Accu Nederland B.V. ".repeat(10), 80);
  assertEquals(out.length <= 80, true);
});

Deno.test("lege of ontbrekende waarde geeft lege string", () => {
  assertEquals(toAsciiHeader(""), "");
  assertEquals(toAsciiHeader(undefined as unknown as string), "");
});

Deno.test("verwijdert emoji en overige non-ASCII volledig", () => {
  assertEquals(toAsciiHeader("Offerte 🚀 klaar ✅"), "Offerte klaar");
  assertEquals(toAsciiHeader("日本語 offerte"), "offerte");
});

Deno.test("resultaat is altijd veilig voor SMTP-headers (edge cases)", () => {
  const cases = [
    "Offerte voor Ünlü & Zoon – €12.500,50 incl. btw",
    "Bevestiging: uw offerte “Thuisbatterij 20 kWh” is klaar",
    "L'Été chaud — offerte réf. n°123",
    "Offerte\nmet\nnieuwe\nregels",
    "A".repeat(500),
    "€".repeat(300),
  ];
  for (const c of cases) {
    const subject = toAsciiHeader(c);
    const fromName = toAsciiHeader(c, 80);
    assert(isSafeHeader(subject), `onveilig subject: ${subject}`);
    assert(isSafeHeader(fromName), `onveilige fromName: ${fromName}`);
    assertEquals(fromName.length <= 80, true);
  }
});

Deno.test("From-header blijft geldig RFC 5322 met genormaliseerde naam", () => {
  const from = `${toAsciiHeader("Café Solar & Zoön", 80)} <info@smartaccu.nl>`;
  assertEquals(from, "Cafe Solar & Zoon <info@smartaccu.nl>");
  assert(isSafeHeader(from));
});