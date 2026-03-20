

## Plan: Mobiel/tablet optimalisatie + Video-opname in Schouwen

### 1) Mobiele/tablet responsiveness verbeteringen

**Probleem**: Diverse pagina's gebruiken vaste breedte-tabellen en desktop-georiënteerde layouts die op mobiel niet goed werken.

#### A) Lijstpagina's (Leads, Offertes, Schouwen) — Card-weergave op mobiel
**Bestanden:** `src/pages/Leads.tsx`, `src/pages/Offertes.tsx`, `src/pages/Schouwen.tsx`

- Op `< md` breakpoint: vervang de `<Table>` door een gestapelde card-weergave (naam, status badge, key info)
- Actieknoppen worden iconen in een horizontale rij onderaan elke card
- Zoekbalk en filters worden full-width gestapeld op mobiel
- Bulk-selectie toolbar wordt sticky onderaan het scherm op mobiel

#### B) Formulier-dialogen
**Bestanden:** `src/pages/Leads.tsx`, `src/pages/Schouwen.tsx`, `src/pages/OfferteNieuw.tsx`

- Dialogen op mobiel: `max-w-[95vw]` en `max-h-[90vh]`
- Form grids (`grid-cols-2`, `grid-cols-3`) worden `grid-cols-1` op mobiel
- Knoppen worden full-width op mobiel

#### C) Dashboard
**Bestand:** `src/pages/Dashboard.tsx`

- StatCards: `grid-cols-1` op mobiel (nu al `sm:grid-cols-2` — controleren)
- Activiteiten lijst: compactere spacing op mobiel

#### D) SchouwUitvoeren (wizard)
**Bestand:** `src/pages/SchouwUitvoeren.tsx`

- Titel verkleinen op mobiel (`text-xl` i.p.v. `text-2xl`)
- Navigatieknoppen: full-width stack op kleine schermen
- Step indicator: compacter met alleen huidige step naam

#### E) PDF Editor
**Bestand:** `src/pages/OffertePDF.tsx`

- Op mobiel: verberg het linker panel standaard, toon een toggle-knop (bottom sheet of overlay)
- Preview schaalt naar full-width
- Toolbar knoppen worden icoon-only op mobiel

#### F) SignaturePad
**Bestand:** `src/components/schouwen/SignaturePad.tsx`

- Canvas hoogte aanpassen: 160px op mobiel, 200px op desktop
- Touch events werken al correct (✓)

#### G) AppLayout
**Bestand:** `src/components/AppLayout.tsx`

- Main padding: `p-3` op mobiel i.p.v. `p-4` (al `md:p-8`)

### 2) Video-opname functionaliteit in SchouwMediaUpload

**Bestand:** `src/components/schouwen/SchouwMediaUpload.tsx`

Voeg een "Video opnemen" knop toe naast "Foto's toevoegen":

- **MediaRecorder API** gebruiken om video op te nemen via de camera van het apparaat
- Max **60 seconden** opnameduur (automatische stop + visuele countdown timer)
- Max resolutie: **1280×720 (HD)** via `getUserMedia` constraints
- Opnameformaat: **WebM** (native browser support, kleinste bestandsgrootte bij goede kwaliteit)
- Na opname: toon preview met afspeelknop voordat de gebruiker bevestigt
- Upload naar `schouw-media` bucket met bestaande upload-logica
- Bestandslimiet verhogen naar **50MB** voor video (10MB blijft voor foto's)
- Live camera preview tijdens opname in een modal/overlay
- Start/Stop/Annuleer knoppen
- Rode opname-indicator met timer

**UI flow:**
```text
[Foto's toevoegen] [Video opnemen]
         ↓
   Modal opent met camera preview
   [● REC 00:00/01:00]  [Stop] [Annuleer]
         ↓ (na stop)
   Preview met [Opslaan] [Opnieuw] [Annuleer]
         ↓ (na opslaan)
   Upload naar storage → verschijnt in media grid
```

**Video in media grid:**
- Video thumbnails tonen een play-icoon overlay
- Click opent video in een lightbox/modal met afspeelbesturing
- Bestaande video-uploads (file picker) ook accepteren tot 50MB

### Bestanden overzicht

| Bestand | Wijziging |
|---------|-----------|
| `src/components/schouwen/SchouwMediaUpload.tsx` | Video-opname component, 50MB limiet video, camera modal |
| `src/pages/Leads.tsx` | Card-weergave op mobiel |
| `src/pages/Offertes.tsx` | Card-weergave op mobiel |
| `src/pages/Schouwen.tsx` | Card-weergave op mobiel |
| `src/pages/SchouwUitvoeren.tsx` | Compactere mobiele layout |
| `src/pages/OffertePDF.tsx` | Toggle panel op mobiel |
| `src/pages/Dashboard.tsx` | Grid responsive check |
| `src/pages/OfferteNieuw.tsx` | Form grids responsive |
| `src/components/AppLayout.tsx` | Mobiele padding |

