

# Grondige Analyse: Fouten en Verbeteringen Platform

## Samenvatting

Na uitgebreide analyse van de codebase zijn er **28 concrete problemen en verbeteringen** gevonden, onderverdeeld in bugs, inconsistenties, ontbrekende functionaliteit en UX-verbeteringen.

---

## A. BUGS (Moeten gerepareerd worden)

### A1. Offertes.tsx: Omschrijving bevat nog steeds merk + model
**Bestand:** `src/pages/Offertes.tsx` regel 405
In `OfferteNieuw.tsx` is dit gefixt naar `product.naam`, maar in de **edit-dialog** van `Offertes.tsx` staat nog de oude code:
```
omschrijving: `${product.naam}${product.merk ? ` — ${product.merk}` : ""}${product.model ? ` ${product.model}` : ""}`
```
**Impact:** Bij het bewerken van een offerte via de lijstpagina wordt merk/model dubbel toegevoegd.

### A2. Offertes.tsx edit-dialog: Geen WYSIWYG editor
**Bestand:** `src/pages/Offertes.tsx` regels 802-814
De introductietekst, garantievoorwaarden en installatietermijn gebruiken hier nog `<Textarea>` in plaats van `<RichTextEditor>`. HTML-opmaak gaat verloren bij bewerken via deze dialog.

### A3. Offertes.tsx view-dialog: Korting per bedrag niet correct weergegeven
**Bestand:** `src/pages/Offertes.tsx` regel 878-879
De korting-kolom toont altijd `r.korting_percentage}%`, maar houdt geen rekening met `korting_type === "bedrag"`. Bij bedrag-kortingen wordt dan `0%` getoond i.p.v. het werkelijke bedrag.

### A4. Dashboard: 16 aparte database-calls voor chartdata
**Bestand:** `src/pages/Dashboard.tsx` regels 152-175
De chart-query doet **16 sequentiele database-calls** (2 per week x 8 weken). Dit is extreem traag en zou moeten werken met een enkele query met `GROUP BY`.

### A5. OfferteDetail: Subtotaal terugrekening foutief bij percentage-korting
**Bestand:** `src/pages/OfferteDetail.tsx` regels 437-441
De bruto subtotaal-berekening `offerte.subtotaal / (1 - offerteKortingWaarde / 100) * (offerteKortingWaarde / 100)` is wiskundig incorrect en kan tot afrondingsfouten leiden. De originele bruto subtotaal zou opgeslagen moeten worden of herberekend vanuit de regels.

### A6. OfferteNieuw: Edit-modus mist laadlogica
**Bestand:** `src/pages/OfferteNieuw.tsx`
De URL bevat `?edit=<id>` maar er is **geen code** die de bestaande offerte ophaalt en de formuliervelden vult. De "Bewerken" knop op OfferteDetail navigeert naar `/offertes/nieuw?edit=${offerte.id}` maar OfferteNieuw negeert deze parameter volledig. Bewerken werkt daardoor niet.

### A7. Offertenummer collision risico
**Bestand:** `src/pages/OfferteNieuw.tsx` regel 58-65 en `Offertes.tsx` regel 110-117
Het offertenummer wordt client-side gegenereerd met `Math.random()`. Bij gelijktijdig gebruik door meerdere adviseurs kan dit duplicaten opleveren. Zou server-side of met een sequence moeten.

### A8. Leads verwijderen: FK-constraints niet afgehandeld
**Bestand:** `src/pages/Leads.tsx` regel 175-184
Bij het verwijderen van een lead worden gerelateerde records (lead_notities, lead_contactmomenten, lead_eigenschappen, offertes, klanten) niet eerst opgeruimd. Dit kan FK-constraint errors opleveren.

### A9. OrderbevestigingPDF: korting_type "bedrag" niet in interface
**Bestand:** `src/components/OrderbevestigingPDF.tsx` regel 19-26
De `OfferteRegel` interface in dit bestand mist `korting_bedrag` en `korting_type` velden. De cast `(r as any).korting_type` werkt, maar er is geen TypeScript-veiligheid.

---

## B. INCONSISTENTIES

### B1. OfferteRegel interface herhaald in 5+ bestanden
De `OfferteRegel` interface is gedefinieerd in: `OfferteNieuw.tsx`, `OfferteDetail.tsx`, `Offertes.tsx`, `OffertePDFPreview.tsx`, `OrderbevestigingPDF.tsx`, en `PrijstabelTemplates.tsx` -- telkens iets anders. Sommige hebben `korting_bedrag`, sommige niet. Dit moet naar een gedeeld types-bestand.

### B2. formatCurrency herhaald in 6+ bestanden
Elke pagina definieert zijn eigen `formatCurrency` functie. Zou in `src/lib/utils.ts` moeten.

### B3. regelSub/regelSubtotaal herhaald in 5+ bestanden
Zelfde berekening, maar soms net iets anders geimplementeerd.

### B4. Offertes statuswijziging vanuit lijstpagina vraagt geen reden
**Bestand:** `src/pages/Offertes.tsx` regels 509-519
Bij statuswijziging naar "afgewezen" of "verlopen" vanuit de tabelweergave wordt **geen reden gevraagd** (geen afwijzingsdialog). In `OfferteDetail.tsx` wordt dit wel gedaan.

---

## C. ONTBREKENDE FUNCTIONALITEIT

### C1. Geen paginering op lijstpagina's
Leads, offertes, producten, klanten laden ALLES in een keer. Bij 1000+ records wordt dit traag en raakt de Supabase 1000-rij limiet.

### C2. Geen automatische verlopen-check voor offertes
Offertes met `geldig_tot` in het verleden blijven op "verzonden" staan. Er is geen automatische statuswijziging naar "verlopen".

### C3. Geen offerte dupliceren/kopieren functie
Gebruikers moeten een hele offerte opnieuw invullen. Een "Kopieer offerte" functie zou veel tijd besparen.

### C4. Geen zoekfunctie in productselectie bij offerte aanmaken
**Bestand:** `src/pages/OfferteNieuw.tsx` regels 442-450
De productlijst is een simpele `<Select>`. Bij 50+ producten wordt dit onwerkbaar. Een zoekbare combobox is nodig.

### C5. Klanten pagina: geen bewerk/verwijder mogelijkheid
**Bestand:** `src/pages/Klanten.tsx`
De klantenpagina is read-only. Er kan geen klant bewerkt of verwijderd worden vanuit de lijst.

### C6. Planning: geen drag-and-drop voor afspraken
Afspraken kunnen niet verplaatst worden door te slepen in de kalender.

### C7. Geen bulk-acties op offertes
Leads heeft bulk-statuswijziging, maar offertes niet.

### C8. Dashboard: geen trend-percentages
De `trend` prop op StatCard wordt nooit gevuld. Er worden geen vergelijkingen met vorige periodes gemaakt.

### C9. Geen audit log voor statuswijzigingen
Wanneer een offerte of lead van status verandert, wordt niet bijgehouden wie dat deed en wanneer. Er zijn notificaties maar geen volledige audit trail.

---

## D. UX-VERBETERINGEN

### D1. Offerte bewerken navigeert weg van context
De "Bewerken" knop stuurt naar `/offertes/nieuw?edit=X` (wat niet werkt, zie A6). Bewerken zou inline moeten werken of in een zijpaneel.

### D2. Leads kanban: geen visuele indicatie van leeftijd
Leads die lang in een status staan worden niet visueel gemarkeerd. Een kleurcodering (groen < 3 dagen, oranje 3-7, rood > 7) zou helpen.

### D3. Geen loading states op knoppen bij statuswijzigingen
Statuswijzigingen in de leads kanban en offerte-lijst tonen geen loading indicator.

### D4. Mobile: offerte-regels formulier is niet responsive
**Bestand:** `src/pages/OfferteNieuw.tsx` regel 453
`grid-cols-5` op kleine schermen maakt de velden onleesbaar klein.

### D5. Producten: BTW-veld default 21 maar niet zichtbaar bij aanmaken
Bij het aanmaken van een product via de dialog in `Producten.tsx` is er een `btw_percentage` veld, maar deze is moeilijk vindbaar als standaard.

### D6. Geen bevestigingsdialog bij statuswijziging naar "geaccepteerd"
Een offerte kan per ongeluk als geaccepteerd worden gemarkeerd zonder bevestiging. Dit zou een extra check moeten hebben.

---

## E. PRIORITERING

| Prioriteit | Items | Impact |
|-----------|-------|--------|
| **Kritiek** | A6, A1, A2, A8 | Functionaliteit werkt niet of data-verlies |
| **Hoog** | A3, A5, A7, B1, B4, C1, C2 | Onjuiste data of schaalbaarheid |
| **Medium** | A4, A9, B2, B3, C3, C4, C5, C8, D1, D4 | Performance en gebruiksgemak |
| **Laag** | C6, C7, C9, D2, D3, D5, D6 | Nice-to-have verbeteringen |

---

## F. AANBEVOLEN AANPAK

### Fase 1 - Kritieke fixes
1. **A6**: Edit-modus implementeren in OfferteNieuw (offerte ophalen bij `?edit=` parameter)
2. **A1**: Product-omschrijving fixen in Offertes.tsx edit-dialog
3. **A2**: RichTextEditor toevoegen aan Offertes.tsx edit-dialog
4. **A8**: FK-constraints afhandelen bij lead-verwijdering

### Fase 2 - Data-integriteit
5. **A3 + B4**: Korting-weergave fixen in view-dialog + afwijzingsreden bij statuswijziging
6. **A5**: Subtotaal-berekening corrigeren in OfferteDetail
7. **A7**: Offertenummer uniciteit garanderen (database sequence)
8. **B1**: Gedeeld OfferteRegel type aanmaken

### Fase 3 - Schaalbaarheid & UX
9. **C1**: Paginering toevoegen aan lijstpagina's
10. **C2**: Automatische verlopen-check
11. **C4**: Zoekbare product-combobox
12. **A4**: Dashboard chart-query optimaliseren
13. **C3**: Offerte dupliceren functie
14. **D4**: Responsive grid voor offerte-regels

