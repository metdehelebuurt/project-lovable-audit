

## Plan: Opdrachten Module + Schouw Uitbreiding + Status Locking

### Overzicht

Drie hoofdonderdelen:
1. **Opdrachten module** — Nieuwe volwaardige pagina voor geaccepteerde offertes met opdrachtbevestiging, schouw inplannen, installatie plannen + monteur toewijzen
2. **Offerte status locking** — Geaccepteerde offertes kunnen niet meer vrij worden aangepast, alleen geannuleerd met reden
3. **Schouw module uitbreiding** — Volwaardige pagina (geen dialogen), veel meer categorie-specifieke velden vanuit perspectief monteur/planner

---

### 1. Database wijzigingen

**Nieuwe tabel `opdrachten`:**
- `id` uuid PK
- `partner_id` uuid NOT NULL
- `offerte_id` uuid NOT NULL (ref offertes)
- `lead_id` uuid nullable
- `schouw_id` uuid nullable (gekoppelde schouw)
- `installatie_id` uuid nullable (gekoppelde installatie)
- `klant_naam` text NOT NULL
- `klant_email` text
- `klant_telefoon` text
- `klant_adres` text, `klant_postcode` text, `klant_plaats` text
- `status` enum `opdracht_status` (`nieuw`, `bevestigd`, `schouw_gepland`, `installatie_gepland`, `in_uitvoering`, `afgerond`, `geannuleerd`)
- `annulering_reden` text nullable
- `bevestiging_verzonden_op` timestamptz nullable
- `regels` jsonb (snapshot vanuit offerte)
- `totaal_bedrag` numeric
- `toegewezen_monteur_id` uuid nullable
- `notities` text
- `created_at`, `updated_at` timestamptz

**Nieuwe kolom op `offertes`:**
- `annulering_reden` text nullable

**RLS op `opdrachten`:**
- Zelfde multi-tenant patroon als installaties/offertes (superadmin alles, partner_admin/staff eigen partner, installateur eigen opdrachten, adviseur eigen opdrachten via offerte)

**Uitbreiding `schouwen.gegevens` velden** (geen schema wijziging nodig — gegevens is al JSONB):
- Alleen frontend uitbreiding van `categoryFields` met tientallen extra velden per categorie

---

### 2. Opdrachten pagina (`src/pages/Opdrachten.tsx`)

Volwaardige pagina (geen slide-in/dialoog) met:
- **Overzichtstabel** met alle opdrachten (gefilterd op status)
- **Opdracht detailpagina** (`/opdrachten/:id`) met:
  - Klantgegevens + offerteregels (read-only snapshot)
  - **Opdrachtbevestiging versturen** knop (markeert als `bevestigd`, stuurt notificatie)
  - **Schouw inplannen** knop → navigeert naar `/schouwen/nieuw?opdracht_id=...` met klantgegevens pre-filled
  - **Installatie plannen** knop → opent planningformulier met:
    - Monteur selectie (dropdown van installateurs)
    - Start/einddatum
    - Maakt automatisch `installaties` record aan + koppelt aan opdracht
  - **Schouwgegevens inzien** (als schouw gekoppeld) — alle inspectiedata inline zichtbaar
  - Statusflow met duidelijke stappen
  - Annulering met verplicht redenveld

**Automatische opdrachtcreatie:**
- Wanneer offerte status → `geaccepteerd` wordt (via offerte-accept edge function OF handmatig), automatisch een opdracht aanmaken via database trigger of in de frontend logica

---

### 3. Offerte status locking

**In `Offertes.tsx`:**
- Status dropdown voor `geaccepteerd` offertes verwijderen — alleen "Annuleren" knop tonen met reden-dialoog
- Status kan niet meer vrij worden gewijzigd na acceptatie
- `annulering_reden` opslaan bij annulering

**In `offerte-accept` edge function:**
- Na succesvolle acceptatie: automatisch opdracht record aanmaken in `opdrachten` tabel

---

### 4. Schouw module uitbreiding

**Volwaardige pagina's in plaats van dialogen:**
- `/schouwen` → overzichtspagina (blijft)
- `/schouwen/nieuw` → nieuwe volwaardige pagina voor inplannen
- `/schouwen/:id` → detailpagina met alle info overzichtelijk
- `/schouwen/:id/uitvoeren` → wizard voor uitvoering (volledige pagina)

**Uitgebreide categorie-specifieke velden (vanuit monteur/planner perspectief):**

| Categorie | Nieuwe velden |
|-----------|--------------|
| **Zonnepanelen** | Bouwjaar woning, type aansluiting (1/3-fase), ampèrage hoofdzekering, afstand meterkast-omvormer (m), type omvormer locatie, dakdoorvoer nodig (ja/nee), asbest aanwezig, draagkracht dak (kg/m²), aantal dakpannen rij, type bevestigingssysteem, toegankelijkheid dak |
| **Warmtepomp** | Afstand meterkast-buitenunit (m), afstand buitenunit-binnenunit (m), leidingdoorvoer locatie, type vloerverwarming (nat/droog), aantal radiatoren, CV-buisdiameter (mm), bodemgesteldheid (voor bronpomp), geluidseis (dB), energielabel woning, huidige gasverbruik m³/jaar, huidige elektraverbruik kWh/jaar, terugvoertemp bestaand systeem |
| **Isolatie dak** | Bouwjaar, type spanten, spantafstand (cm), dampscherm aanwezig, ventilatieruimte (cm), bereikbaarheid kruipzolder, max isolatiedikte (mm), leidingen/kabels in dakconstructie |
| **Isolatie muur** | Bouwjaar, geveloppervlakte per zijde, hoekopstellingen, lateien/lintelen, luchtdichtheidseis, spouwankers aanwezig, voeg type, gevel oriëntatie |
| **Isolatie vloer** | Bouwjaar, type fundering, leidingen door kruipruimte (gas/water/riool), grondwater stand, ventilatieopeningen kruipruimte, draagconstructie type, vloer materiaal |
| **HR glas** | Bouwjaar, aantal gevels met glas, ventilatieroosters in kozijn, monumentale status, beglazing per raam (afmetingen tabel), draairichting per raam |
| **Ventilatie** | Bouwjaar, woningtype, aantal verdiepingen, huidige CO2-niveaus, huidige RV%, kanalen materiaal bestaand, dakdoorvoer aanwezig, zolderruimte voor unit, brandklep locaties |
| **Thuisbatterij** | Afstand meterkast-batterij (m), type omvormer (merk/model), aantal zonnepanelen, piekvermogen systeem, type aansluiting (1/3-fase), beschikbare wandruimte (bxh), gewichtscapaciteit vloer/wand, teruglevercapaciteit netbeheerder |

**Monteur inzage van schouwgegevens:**
- Op de opdracht detailpagina: volledige schouwdata inline tonen
- Bij installatieplanning: schouwgegevens zijn zichtbaar voor de monteur

---

### 5. Sidebar + Routes

**Nieuwe sidebar items:**
- `Opdrachten` (voor superadmin, partner_admin, partner_staff, adviseur, installateur) — icoon: `ClipboardCheck`
- Installaties wordt onderdeel van opdrachten-flow

**Nieuwe routes:**
- `/opdrachten` → Opdrachten overzicht
- `/opdrachten/:id` → Opdracht detail
- `/schouwen/nieuw` → Schouw inplannen (volwaardige pagina)
- `/schouwen/:id` → Schouw detail (volwaardige pagina)
- `/schouwen/:id/uitvoeren` → Schouw uitvoeren (volwaardige pagina)

---

### 6. Bestanden

| Bestand | Actie |
|---------|-------|
| DB migratie | Nieuwe tabel `opdrachten` + enum + RLS + kolom `annulering_reden` op offertes |
| `src/pages/Opdrachten.tsx` | **Nieuw** — Overzichtspagina |
| `src/pages/OpdrachtDetail.tsx` | **Nieuw** — Detailpagina met acties |
| `src/pages/SchouwDetail.tsx` | **Nieuw** — Volwaardige schouw detailpagina |
| `src/pages/SchouwNieuw.tsx` | **Nieuw** — Volwaardige schouw inplannen pagina |
| `src/pages/SchouwUitvoeren.tsx` | **Nieuw** — Volwaardige wizard pagina |
| `src/pages/Schouwen.tsx` | Refactor — verwijder dialogen, navigeer naar pagina's |
| `src/pages/Offertes.tsx` | Status locking voor geaccepteerde offertes |
| `src/components/AppSidebar.tsx` | Opdrachten toevoegen |
| `src/App.tsx` | Nieuwe routes |
| `src/components/schouwen/SchouwChecklists.ts` | Uitbreiden met meer items |
| `supabase/functions/offerte-accept/index.ts` | Opdracht automatisch aanmaken |

