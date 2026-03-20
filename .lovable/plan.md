

## Plan: PDF Editor uitbreiden — drag & drop, A4 thumbnails, meer templates, specs als laatste pagina, uitgebreidere energieadvies en schouwrapport

### Wijzigingen

#### 1) Drag & drop sectievolorde
**Bestand:** `src/pages/OffertePDF.tsx`

- Voeg een `sectionOrder` state toe aan `TemplateConfig` (array van sectie-IDs: `["voorblad", "inhoudsopgave", "producten", "prijstabel", "energieadvies", "voorwaarden", "schouwrapport", "datasheets"]`)
- Implementeer drag & drop in het linker panel met native HTML5 drag events (geen externe library nodig) — elke sectie krijgt een drag handle (⠿ icoon)
- De volgorde wordt opgeslagen in `template_config.section_order` en bepaalt de render-volgorde van zowel de live preview als de print-versie
- TOC (inhoudsopgave) wordt automatisch bijgewerkt op basis van de actuele volgorde

**Bestand:** `src/components/offertes/templates/templateRegistry.ts`
- Voeg `section_order?: string[]` toe aan `TemplateConfig`

#### 2) Thumbnails A4 formaat + achtergrondafbeelding
**Bestand:** `src/pages/OffertePDF.tsx`

- Wijzig thumbnail `aspect-[4/3]` → `aspect-[210/297]` (A4 verhouding)
- Pas de inner render van 794×595 aan naar 794×1123 (A4 verhouding) met bijpassende scale
- Voorblad thumbnails tonen de heroImageUrl als achtergrond als die is ingesteld in de config

#### 3) "Opdrachtbevestiging" → "Offerte"
**Bestanden:** `src/pages/OffertePDF.tsx`, `src/components/OffertePDFPreview.tsx`

- Hernoem alle referenties van "Opdrachtbevestiging" naar "Offerte" in de TOC, pagina-headers en live preview

#### 4) "Uw product" → Technische specificaties als laatste pagina
**Bestanden:** `src/pages/OffertePDF.tsx`, `src/components/OffertePDFPreview.tsx`

- Hernoem "Uw product" sectie naar "Technische specificaties"
- Verplaats de productpagina + datasheets standaard naar het einde van de PDF (na voorwaarden en schouwrapport)
- De sectie toont uitgebreide specs uit `product.specs` in een professionele tabelopmaak (gegroepeerd per sectie)
- Datasheet (fabrikant of gegenereerd) volgt direct na de spec-pagina

#### 5) Meer en betere template varianten
**Bestand:** `src/components/offertes/templates/EnergieadviesTemplates.tsx`

Voeg 2 nieuwe varianten toe:
- **EnergyDashboard**: Modern dashboard-stijl met grote KPI-cijfers, progress bars voor besparing en CO2-reductie, en een rendementsgrafiek
- **EnergyTimeline**: Tijdlijn-layout die per jaar de cumulatieve besparing toont (jaar 1-15)

Breid bestaande varianten uit met meer datapunten:
- CO2-reductie (berekend: besparing kWh × 0.4 kg/kWh)
- Besparing over 15 jaar
- Maandelijkse besparing

**Bestand:** `src/components/offertes/templates/templateRegistry.ts`
- Voeg `energy-dashboard` en `energy-timeline` toe aan de energieadvies varianten

#### 6) Uitgebreider schouwrapport in PDF
**Bestanden:** `src/pages/OffertePDF.tsx`, `src/components/OffertePDFPreview.tsx`

Het schouwrapport toont nu alleen ruwe key-value pairs. Verbeter naar:
- **Gegroepeerde weergave**: Gebruik de `section` groepering uit `SchouwCategoryFields.ts` (Woning, Dak, Elektra, etc.) om de data gestructureerd te tonen
- **Visuele kaarten per groep**: Elke sectie (Woning, Dak, Schaduw, Elektra) krijgt een eigen kaart met icoon en gestructureerde velden
- **Leesbare labels**: Gebruik de `label` uit SchouwCategoryFields i.p.v. ruwe keys
- **Lege velden filteren**: Toon alleen ingevulde velden
- **Boolean waarden**: Toon "Ja"/"Nee" i.p.v. true/false
- **Foto's/media referenties**: Als er media-URLs in de schouwdata zitten, toon thumbnails

#### 7) Uitgebreider energieadvies in PDF
**Bestanden:** `src/pages/OffertePDF.tsx`, `src/components/OffertePDFPreview.tsx`

De energieadvies berekening mist veel data. Breid uit met:
- **CO2-reductie**: besparing kWh × 0.4 kg CO2/kWh
- **Maandelijkse besparing**: jaarlijkse besparing / 12
- **Besparing over levensduur** (15 jaar): jaarlijkse besparing × 15
- **Zelfvoorzieningsgraad**: percentage eigen opwek vs verbruik
- **Dynamisch tarief voordeel**: extra besparing bij dynamische contracten
- Alle extra datapunten worden doorgegeven aan de energieadvies template components via uitgebreide props

**Bestand:** `src/components/offertes/templates/EnergieadviesTemplates.tsx`
- Breid de `EnergieadviesProps` interface uit met optionele velden: `co2Reductie`, `maandBesparing`, `besparingLevensduur`, `zelfvoorzieningsgraad`
- Alle bestaande + nieuwe varianten tonen deze extra data waar beschikbaar

### Bestanden overzicht

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/OffertePDF.tsx` | Drag & drop, A4 thumbnails, hernoeming, sectievolorde, uitgebreidere data |
| `src/components/OffertePDFPreview.tsx` | Hernoeming, gegroepeerd schouwrapport, uitgebreider energieadvies, sectievolorde |
| `src/components/offertes/templates/templateRegistry.ts` | `section_order` in TemplateConfig, nieuwe varianten |
| `src/components/offertes/templates/EnergieadviesTemplates.tsx` | 2 nieuwe varianten, uitgebreide props |

