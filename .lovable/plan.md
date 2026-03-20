

## Plan: Fix offerte-aanmaak vastlopen op datasheet-dialoog

### Probleem

De offerte-aanmaak loopt vast op het "Ontbrekende productdatasheets" dialoog. De knop "Doorgaan met offerte" is disabled totdat elk product individueel is afgehandeld (upload/genereer/overslaan). Dit blokkeert de gebruiker onnodig.

### Oplossing

Twee aanpassingen om het niet-blokkerend te maken:

#### 1. "Alles overslaan" knop toevoegen

**`src/components/offertes/DatasheetCheckDialog.tsx`**

- Voeg een "Alles overslaan" knop toe naast de individuele opties
- Zet alle pending producten op "skipped" in één klik
- De "Doorgaan met offerte" knop wordt dan direct beschikbaar

#### 2. Maak de datasheet-check optioneel

**`src/pages/OfferteNieuw.tsx`**

- Verander de check zodat de dialoog puur informatief is — niet blokkerend
- Voeg een directe "Overslaan & doorgaan" optie toe in de footer die alle items skipt en meteen de offerte opslaat
- Dit voorkomt dat gebruikers vastlopen als ze geen datasheets willen beheren

### Bestanden

| Bestand | Actie |
|---------|-------|
| `src/components/offertes/DatasheetCheckDialog.tsx` | "Alles overslaan" knop, betere UX flow |
| `src/pages/OfferteNieuw.tsx` | Geen wijziging nodig (callback werkt al correct) |

