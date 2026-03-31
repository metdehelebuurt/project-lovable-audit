

## Plan: Fix 3 PDF offerte problemen

### 1. Witte laatste pagina verwijderen

**Probleem**: De CSS `page-break-after: always` op `.pdf-page` in de `pageStyle` (regel 284) forceert altijd een page break, ook na de laatste pagina. De `:last-of-type` CSS-regel werkt niet wanneer datasheets in een `React.Fragment` gewrapt zitten — de individuele `.pdf-page` divs binnen het Fragment zijn niet het `:last-of-type` van hun parent.

**Oplossing**: Verwijder `pageBreakAfter: "always"` uit de inline `pageStyle` en vertrouw volledig op de CSS-regel `.pdf-page { page-break-after: always }` + `.pdf-page:last-child { page-break-after: avoid }`. Wijzig `:last-of-type` naar `:last-child` zodat het correct werkt ongeacht nesting.

### 2. Adviseur-naam op offerte tonen (via instellingen)

**Probleem**: De adviseur-naam staat al op het voorblad via `adviseurNaam`, maar de user wil dat partner-admins in Instellingen de standaard adviseur-naam kunnen instellen die op offertes verschijnt.

**Oplossing**: De adviseur wordt al opgehaald uit de `users` tabel op basis van `adviseur_id` (regel 142). De naam staat al op het voorblad. Aanvulling: toon de adviseur-naam ook expliciet in de **prijstabel-sectie** ("Opgesteld door" blok, regel 436-441) naast de bedrijfsnaam, zodat het duidelijk is welke adviseur de offerte heeft gemaakt.

### 3. Dubbele specificaties verwijderen

**Probleem**: In de `datasheets` case (regel 513-563) worden er **twee loops** uitgevoerd:
1. **Eerste loop** (regel 517-541): rendert een raw specs-tabel voor elk product met `specs`
2. **Tweede loop** (regel 542-559): rendert ProductDatasheet of iframe voor producten met `datasheet_type`

Producten met `datasheet_type === "gegenereerd"` én `specs` krijgen BEIDE pagina's — dit is de dubbele specificatie.

**Oplossing**: In de eerste loop (raw specs-tabel), sla producten over die `datasheet_type === "gegenereerd"` hebben, want die krijgen al een volledige ProductDatasheet via de tweede loop.

---

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/OffertePDFPreview.tsx` | (1) `pageBreakAfter` uit inline style, CSS `:last-child` fix; (2) adviseur-naam in prijstabel "Opgesteld door" blok; (3) filter `datasheet_type === "gegenereerd"` uit raw specs loop |

