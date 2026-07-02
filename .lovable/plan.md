# Plan: Samengestelde Producten (assemblages)

## Doel
Een nieuwe module waar partners bundels van bestaande producten kunnen samenstellen. Een assemblage gedraagt zich als een normaal product (offerte, factuur, opdracht, oplevering, voorraad), met stuklijst-logica onder de motorkap. Daarnaast: kostprijs → inkoop, marge-inzicht, en een 'heeft serienummer'-vink per product.

## Database

### 1. `producten` uitbreiden
- `is_assemblage boolean default false`
- `heeft_serienummer boolean default false` (migratie: `true` voor categorieën batterij, omvormer, gateway/monitoring)
- `prijs_strategie text default 'vast'` — `'vast'` | `'som_componenten'` (assemblages gebruiken dit; overige producten negeren)
- `marge_opslag_percentage numeric default 0` — voor `som_componenten`
- `kostprijs` bestaat al; zorgen dat het overal (inkoop, offerte-marge) gebruikt wordt.

### 2. Nieuwe tabel `product_componenten` (stuklijst)
Kolommen: `id`, `partner_id`, `assemblage_id → producten.id`, `component_id → producten.id`, `aantal numeric`, `verplicht boolean`, `volgorde int`, `created_at`.
RLS: partner-scoped, standaard grants.

### 3. Nieuwe tabel `product_kostprijs_historie`
Kolommen: `id`, `partner_id`, `product_id`, `oude_kostprijs`, `nieuwe_kostprijs`, `gewijzigd_door`, `created_at`. Trigger op `producten` bij kostprijs-update.

### 4. Voorraad-view aanpassing
Assemblage-voorraad = MIN over componenten (`vrij / aantal_per_bundel`). Alleen "op voorraad" tonen wanneer alle componenten dekken. Reserveren van een assemblage schrijft reserveringen weg op componenten (zie logica hieronder).

### 5. SN-registratie bij reservering
`voorraad_reserveringen`: veld `serienummer_id → product_serienummers.id nullable` toevoegen. Bij reserveren van componenten uit een assemblage kan gebruiker per stuk een SN kiezen/toewijzen.

## Prijs- & margelogica
- Assemblage kan **beide**: vaste prijs OF som-van-componenten + opslag %. Wisselen via radio in productdetail. Gebruiker kan altijd handmatig een override-prijs invullen (die wordt bewaard bij 'vast').
- Marge = `(verkoopprijs − som_kostprijzen_componenten) / verkoopprijs`. Voor gewone producten: `(prijs − kostprijs) / prijs`.
- Marge-indicator (groen ≥ target, oranje, rood) in productdetail én per regel in offerte-editor. Threshold per partner instelbaar (later; nu hardcoded 20/10%).

## Voorraad & reservering (samengevat)
```text
assemblage.vrij   = min over componenten van floor(component.vrij / aantal)
op_voorraad(assemblage) = alle componenten dekken de bundel
reserveer(assemblage) → reserveer per component (aantal × bundelaantal)
                      → dialog: per stuk SN kiezen (optioneel)
```

## Integratie in bestaande modules

### Producten
- Nieuw tabblad "Assemblages" met dedicated lijst (filter `is_assemblage`).
- Detailpagina krijgt tab **Componenten** (drag-order stuklijst) + tab **Marge & prijs** (kostprijs, marge, strategie, historie).
- Op elk product: checkbox "Heeft serienummer".
- Op elk product: veld **Inkoopprijs (kostprijs)** met historie-knop.
- Snel-dupliceren-knop op assemblage (kloont stuklijst + prijzen).

### Offertes / Facturen
- Bij toevoegen van een assemblage-regel: standaard 1 regel met bundelprijs; optioneel "uitklappen naar componenten" (regels blijven visueel gegroepeerd).
- Marge-pill per regel (kleurcode) in editor, verborgen op PDF.

### Inkoop
- Kostprijs is default op inkooporderregel; historie zichtbaar via popover.
- Inkoopvoorstel: assemblage-verkoop → benodigde componenten worden opgeteld in voorstel, nooit de assemblage zelf.

### Voorraad
- Assemblages tonen berekende vrij/gereserveerd (afgeleid, niet-editable).
- Bij reserveren via opdracht: dialog "SN toewijzen aan reservering" (optioneel, per component met `heeft_serienummer`).

### Opdrachten
- Regel met assemblage → toont expandable subregels met componenten (visueel).
- Levering-tab: pakbon toont assemblage-regel én componenten (voor magazijn).

### Oplevering (NEN1010 + oplevering)
- Per assemblage-regel: SN-invoerblok dat itereert over alle componenten met `heeft_serienummer=true`.
- Bulk-SN invoer: textarea + camera-barcode-scan (BarcodeDetector API waar beschikbaar, fallback manueel). Al bestaande `SerienummerLijstInput` hergebruiken/uitbreiden.

### Voorraad-view op klantkaart (Apparatuur-tab)
- Assemblage tonen als expandable rij met onderliggende SNs per component.

### Menu / navigatie
- Onder groep **Catalogus** nieuw item "Samengestelde producten" (`/producten/assemblages`), toegankelijk voor rollen die nu ook `producten` zien.
- `MODULES` uitbreiden met key `assemblages` (configurable), zodat partner_admin het kan aan-/uitzetten.

## Extra features (meegenomen in v1)
1. **Marge-indicator (kleur)** in offerte-editor én productdetail.
2. **Snel-dupliceren** van assemblages.
3. **Prijshistorie kostprijs** (tabel + tijdlijn in productdetail).
4. **Bulk-SN invoer met barcode-scan** in oplevering.

## Extra suggesties voor productiviteit/conversie (ter overweging)
- **Assemblage-templates per klant-type** (bv. "Standaardpakket 8 panelen + 5kWh accu") als 1-klik startpunt in offerte.
- **AI-suggestie "vaak samen verkocht"**: op basis van historische offerteregels toont het systeem missende accessoires bij een assemblage.
- **Levertijd-rollup**: langste levertijd van componenten wordt automatisch op assemblage getoond bij offerte.
- **Garantie-rollup**: kortste garantie van componenten wordt getoond, met per-component overzicht op oplevering.
- **Marge-waarschuwing op offerte-verzenden**: modal wanneer totale marge < drempel.
- **Kostprijs-sync met leverancierartikelen** (`leverancier_artikelen`): auto-update kostprijs bij nieuwe inkoopprijs, met bevestiging.
- **Configurable assemblage** (varianten): één assemblage met keuzeopties (bv. 6/8/10 panelen) i.p.v. losse kopieën.

## Uitrol-volgorde
1. Migratie: kolommen op `producten`, `product_componenten`, `product_kostprijs_historie`, backfill `heeft_serienummer` voor SN-categorieën.
2. Producten-detail: SN-vink, kostprijs+historie, marge-tab.
3. Nieuwe route + lijst "Samengestelde producten" + editor met componenten-stuklijst.
4. Voorraad/reserveringen: rollup + SN-toewijzing dialog.
5. Offertes/Facturen: assemblage-regel + marge-pill + expand.
6. Inkoop: kostprijs op regel + rollup uit assemblages.
7. Oplevering: per-component SN-invoer + barcode-scan.
8. Menu-registratie + rechten in `MODULES` en `navigationModel`.

## Uit-scope (later)
- Configurable/variabele assemblages met opties.
- Automatische inkoop-sync met leverancier-feed.
- Meertaligheid van assemblage-teksten.
