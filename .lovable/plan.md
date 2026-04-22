

## Plan — Product-handleidingen (installatie & gebruiker) toevoegen

### Doel
Per product twee PDF-handleidingen kunnen uploaden:
1. **Installatiehandleiding** — voor de monteur, zichtbaar op de installatiedetail- én monteur-werkscherm
2. **Gebruikershandleiding** — voor de eindklant, automatisch meegestuurd bij het opleverrapport

Plus integratie op alle logische plekken (offerte, klantportaal, productdetail, downloadcenter).

### Datamodel — één migratie

Nieuwe kolommen op `producten`:
```sql
alter table public.producten
  add column installatie_handleiding_url text,
  add column installatie_handleiding_naam text,
  add column gebruiker_handleiding_url text,
  add column gebruiker_handleiding_naam text;
```

Storage: hergebruik bestaande **`product-images`** bucket (al public) met pad-conventie:
```
handleidingen/{product_id}/installatie-{timestamp}.pdf
handleidingen/{product_id}/gebruiker-{timestamp}.pdf
```

RLS op bucket is reeds correct (partner-scoped + global). Geen extra policy nodig.

Voor partner-overrides (zoals datasheets per partner): uitbreiding van `partner_product_datasheets` zou kunnen, maar **scope houden we op productniveau** (1 globale handleiding per product) — partners kunnen eigen producten nog steeds eigen handleidingen geven, en globale producten gebruiken de fabrikant-handleiding. Dat dekt 95% van de use cases zonder extra complexiteit.

### Nieuwe component

**`src/components/producten/ProductHandleidingenSection.tsx`** (~180 regels)
- Twee upload-zones (installatie + gebruiker), max 20 MB PDF
- Toont huidige bestandsnaam + bekijk- en verwijder-knoppen
- Drag-and-drop ondersteuning
- Hint-tekst per type ("Wordt meegestuurd met opleverrapport" / "Beschikbaar voor monteur")

### Integratie per locatie

| Locatie | Wat verschijnt | Bestand |
|---|---|---|
| **ProductDetail** — nieuwe sectie tussen Datasheet en Offertetekst | Beide uploads + previews | `src/pages/ProductDetail.tsx` |
| **InstallatieDetail** — nieuwe kaart "Documentatie monteur" | Lijst van installatiehandleidingen van alle gekoppelde producten, met bekijk-knop | `src/pages/InstallatieDetail.tsx` + nieuwe `InstallatieDocumentatieCard.tsx` |
| **InstallatieMonteurView** (mobiel werkscherm) | Knoppenrij "Handleidingen" → opent in nieuw tabblad | `src/pages/InstallatieMonteurView.tsx` |
| **OpleverDetail** — nieuwe sectie "Bijlagen voor klant" | Toont automatisch alle gebruikershandleidingen van producten op gekoppelde installatie/opdracht; vinkbaar (default aan) | `src/pages/OpleverDetail.tsx` |
| **oplever-verzend-klant** edge function | Voegt handleiding-links toe aan e-mailtekst (geen PDF-attachments — links naar publieke bucket) | `supabase/functions/oplever-verzend-klant/index.ts` |
| **OpleverRapportPDF** — extra sectie aan einde | "Meegeleverde documenten" met lijst van handleidingen | `src/components/oplever/OpleverRapportPDF.tsx` |
| **OffertePublic** (klantportaal) — nieuwe tab "Handleidingen" | Klant kan downloaden vóór installatie | `src/pages/OffertePublic.tsx` |
| **ProductDatasheetPage** — extra knoppen bovenaan | "Installatiehandleiding" / "Gebruikershandleiding" links | `src/pages/ProductDatasheetPage.tsx` |

### Logica voor automatische verzameling

Nieuwe helper **`src/lib/productHandleidingen.ts`**:
```ts
export async function fetchHandleidingenVoorInstallatie(installatieId: string)
  : Promise<{ product_id, naam, type, url, bestandsnaam }[]>
```
- Leest `installaties.producten` (productregels), trekt unieke `product_id`'s
- Joint met `producten` voor de twee handleiding-velden
- Dedupliceert per product
- Wordt gebruikt door OpleverDetail én InstallatieDetail

### Volwaardiger maken (extra slimme features)

1. **Auto-prefix in offerte** — bij toevoegen product met handleiding aan offerte, optionele toggle "USP: gebruikershandleiding inbegrepen" in tekst.
2. **Status-indicator op productlijst** — badge "📘 Handleiding" naast producten in `Producten.tsx` voor productbeheerders die overzicht willen.
3. **AI-suggestie** — bij ontbrekende handleiding: knop "AI zoek online handleiding" via bestaande `ai-parse-datasheet`-pipeline (zoekt fabrikantsite). **Optioneel, achter feature flag.**
4. **Versie-tracking** — bestandsnaam toont upload-datum (`uploaded_at` afgeleid van pad-timestamp), zodat duidelijk is welke versie actief is.
5. **Bulk-download** — op opleverrapport: één knop "Download alle handleidingen als ZIP" (client-side via JSZip).

Punten 1, 2 en 4 zitten in deze sprint. Punten 3 en 5 als optioneel uitbreidingsbriefje voor latere sessie.

### Bestanden-overzicht

| Bestand | Actie | Geschatte regels |
|---|---|---|
| `supabase/migrations/<nieuw>_product_handleidingen.sql` | nieuw | ~10 |
| `src/components/producten/ProductHandleidingenSection.tsx` | nieuw | ~180 |
| `src/lib/productHandleidingen.ts` | nieuw | ~60 |
| `src/components/installaties/InstallatieDocumentatieCard.tsx` | nieuw | ~80 |
| `src/pages/ProductDetail.tsx` | edit — sectie inbouwen | +15 |
| `src/pages/InstallatieDetail.tsx` | edit — kaart inbouwen | +5 |
| `src/pages/InstallatieMonteurView.tsx` | edit — knoppen-rij | +30 |
| `src/pages/OpleverDetail.tsx` | edit — bijlagen-sectie + auto-suggest | +60 |
| `src/components/oplever/OpleverRapportPDF.tsx` | edit — meegeleverde docs sectie | +40 |
| `supabase/functions/oplever-verzend-klant/index.ts` | edit — handleiding-links in mail | +30 |
| `src/pages/OffertePublic.tsx` | edit — handleidingen-tab | +50 |
| `src/pages/ProductDatasheetPage.tsx` | edit — extra download-knoppen | +20 |
| `src/pages/Producten.tsx` | edit — badge in tabel | +5 |
| `src/integrations/supabase/types.ts` | auto-update | — |

### Geen wijzigingen aan
- RLS policies (bestaande dekking is voldoende)
- Authenticatie / klant-token-flow
- Bestaande datasheet-systeem (handleidingen staan ernaast, niet erin)

### Bevestigingsvragen
Geen — alle keuzes (bucket, conventie, integratiepunten) volgen bestaande patronen.

