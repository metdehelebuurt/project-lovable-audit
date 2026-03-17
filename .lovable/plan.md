

## Plan: Offerte PDF Upgraden naar Professionele Multi-Page Layout

### Context
De huidige `OffertePDFPreview.tsx` is een simpele, enkelvoudige HTML-pagina met een basistabel. Het referentie-PDF (Solarite/AlphaESS) toont een professioneel multi-page document met coverpagina, productinformatie, besparingscijfers, voordelen-overzicht, formele offertepagina, financieringsopties, productspecs, bedrijfscertificeringen en consistente branding op elke pagina.

### Wat wordt gebouwd

De offerte-PDF wordt een multi-sectie document (allemaal in `OffertePDFPreview.tsx`) met de volgende pagina's/secties:

**Pagina 1 — Coverpagina**
- Grote hero-sectie met partner/platform branding (logo, naam, slogan)
- Klantnaam en adresgegevens
- Productcategorie als visuele kop (bijv. "Verduurzaam je huis met een Thuisbatterij")
- Keurmerken/badges balk onderaan
- Contactgegevens footer

**Pagina 2 — Productinformatie** (indien producten gekoppeld)
- Per product: naam, merk, model, omschrijving
- Productafbeelding (uit `afbeelding_url`)
- Technische specificaties (uit `specs` JSON)
- Garantie-informatie (uit `garantie_jaren`)
- USP-kaarten (uit certificeringen, onderhoud)

**Pagina 3 — Besparingen & Energieadvies** (indien energieadvies beschikbaar)
- Visuele besparingscijfers in highlight-cards
- Terugverdientijd visualisatie
- Vergelijkingstabel (zonder vs. met oplossing)
- Disclaimer tekst

**Pagina 4 — Formele Offerte (Opdrachtbevestiging)**
- Header met logo + bedrijfsgegevens
- Klantgegevens blok
- Offertenummer + datum + geldigheid
- Professionele prijstabel (aantal, omschrijving, prijs)
- Garantievoorwaarden inline
- Subtotaal / BTW / Totaal blok
- Akkoordsectie met twee kolommen (adviseur + klant)
- Betalingsvoorwaarden

**Pagina 5 — Schouwrapport** (optioneel, indien include_schouw)
- Gestructureerde weergave van schouwgegevens
- Technische details in grid
- Aandachtspunten en notities

**Elke pagina:**
- Consistente header met logo + bedrijfsgegevens
- Branded footer met contactinfo + KvK + BTW
- Primaire kleur als accent door het hele document
- CSS `page-break-before: always` voor nette print/PDF

### Offerte-aanmaak uitbreiden (OfferteNieuw.tsx)

Om de PDF rijker te maken, worden extra velden toegevoegd aan het offerte-formulier:
- **Introductietekst**: Optioneel tekstveld voor een persoonlijke begeleidende tekst
- **Garantievoorwaarden**: Tekstveld (met default per partner)
- **Installatietermijn**: Tekstveld (bijv. "Binnen 4 weken na akkoord")
- **Akkoord-ondertekeningssectie**: Adviseur naam (auto-filled)

### Database migratie
Nieuwe kolommen aan `offertes` tabel:
- `introductie_tekst` (text, nullable)
- `garantie_voorwaarden` (text, nullable)  
- `installatie_termijn` (text, nullable)

### Productdata ophalen
De PDF haalt nu ook de gekoppelde producten op (via `product_id` in regels) om afbeeldingen, specs en omschrijvingen te tonen. Dit vereist een extra query naar `producten` tabel.

### Technische aanpak
- Alles blijft CSS print-based (`@media print` + `page-break`)
- Rubik font (reeds geladen)
- Partner branding kleuren dynamisch toegepast via inline styles
- Productafbeeldingen uit Supabase Storage (`product-images` bucket)
- Responsive fallbacks: als er geen producten/energieadvies/schouw is, worden die pagina's overgeslagen

### Bestanden die wijzigen
| Bestand | Actie |
|---------|-------|
| `src/components/OffertePDFPreview.tsx` | Volledig herschrijven naar multi-page layout |
| `src/pages/OfferteNieuw.tsx` | Extra velden toevoegen (introductie, garantie, termijn) |
| DB migratie | 3 nullable kolommen toevoegen aan `offertes` |

