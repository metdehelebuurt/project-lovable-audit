

## Plan: Uitgebreide Schouwmodule met duidelijke flow, media-uploads en zichtbaarheidsinstellingen

### Overzicht
Vier grote wijzigingen:
1. **Duidelijke scheiding "Inplannen" vs "Starten/Uitvoeren"** — twee aparte acties in de UI
2. **Uitgebreide schouwmodule** — meer wizard-stappen met foto/video uploads, checklists, opmerkingen per veld, en categorie-specifieke uitbreidingen
3. **Zichtbaarheidsinstelling voor adviseurs** — partner_admin kan in Instellingen instellen of adviseurs elkaars schouwen mogen inzien
4. **Database-wijzigingen** — storage bucket voor schouw-media, feature flag kolom op partners tabel, extra velden op schouwen

---

### 1. Database migraties

**Migration 1: Schouw-media storage bucket**
- Maak `schouw-media` bucket aan (public) met RLS policies voor partner-isolatie

**Migration 2: Partners tabel uitbreiden**
- Voeg `adviseurs_delen_schouwen` boolean kolom toe aan `partners` (default `false`)
- Dit vlag bepaalt of adviseurs van dezelfde partner elkaars schouwen kunnen inzien

**Migration 3: Schouwen tabel uitbreiden**
- Voeg `fotos` jsonb kolom toe (array van URLs met metadata)
- Voeg `checklist` jsonb kolom toe (afgevinkte items per categorie)
- Voeg `aandachtspunten` text kolom toe (extra vrij tekstveld)

**Migration 4: RLS policy aanpassen op schouwen**
- Nieuwe SELECT policy: "Adviseur ziet partner schouwen indien gedeeld" — adviseurs zien schouwen van hun partner als `adviseurs_delen_schouwen = true` op de partners tabel
- Bestaande "Adviseur ziet eigen schouwen" policy blijft als fallback

---

### 2. Schouwmodule UI herstructureren (`src/pages/Schouwen.tsx`)

**Twee duidelijke acties in de lijst:**
- **"Schouw inplannen"** (huidige "Nieuwe Schouw" knop) — maakt een schouw met status `gepland`, beperkte wizard (basisgegevens + datum)
- **"Schouw starten"** knop op bestaande geplande schouwen — opent de uitgebreide inspectie-wizard voor het uitvoeren

**Wizard uitbreiden van 3 naar 5 stappen:**
1. **Basisgegevens** — Lead, categorie, datum (bestaand)
2. **Technische inspectie** — Categorie-specifieke velden (bestaand, uitgebreid met meer velden)
3. **Foto's & Video's** — Upload sectie met camera-integratie, meerdere foto's per inspectieonderdeel, labels per foto
4. **Checklist** — Categorie-specifieke afvinkchecklist (bijv. voor zonnepanelen: "Dakconstructie gecontroleerd", "Meterkast gefotografeerd", etc.)
5. **Samenvatting & Afsluiten** — Overzicht met alle data, foto's, checklist status, mogelijkheid om status op "uitgevoerd" te zetten

**Categorie-specifieke checklists** (nieuw bestand `src/components/schouwen/SchouwChecklists.ts`):
- Per categorie een lijst van verplichte en optionele controles
- Bijv. zonnepanelen: dakconstructie, schaduwanalyse, meterkast, kabelroute, etc.

**Foto upload component** (nieuw bestand `src/components/schouwen/SchouwMediaUpload.tsx`):
- Upload naar `schouw-media` bucket
- Meerdere foto's per schouw, met label/categorie per foto
- Thumbnail preview en verwijder-optie

---

### 3. Instellingen uitbreiden (`src/pages/Instellingen.tsx`)

**Nieuwe sectie voor partner_admin: "Schouw instellingen"**
- Toggle: "Adviseurs mogen elkaars schouwen inzien"
- Slaat op als `adviseurs_delen_schouwen` op de partners tabel
- Uitleg-tekst: "Standaard kunnen adviseurs alleen hun eigen schouwen bekijken. Schakel dit in zodat alle adviseurs binnen uw organisatie elkaars schouwen kunnen inzien."

---

### 4. RLS policy update

Huidige situatie: adviseurs zien alleen eigen schouwen (`adviseur_id = auth.uid()`).

Nieuwe policy toevoegen:
```sql
CREATE POLICY "Adviseur ziet partner schouwen indien gedeeld"
ON public.schouwen FOR SELECT TO authenticated
USING (
  get_user_role(auth.uid()) = 'adviseur'
  AND partner_id = get_user_partner_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.partners
    WHERE id = partner_id
    AND adviseurs_delen_schouwen = true
  )
);
```

Dit is een extra permissive policy naast de bestaande, dus als de toggle uit staat valt het terug op "alleen eigen schouwen".

---

### Bestanden overzicht

| Actie | Bestand |
|-------|---------|
| DB migratie | `schouw-media` bucket + `adviseurs_delen_schouwen` kolom + `fotos`/`checklist`/`aandachtspunten` kolommen + RLS policy |
| Nieuw | `src/components/schouwen/SchouwChecklists.ts` — Checklist definities per categorie |
| Nieuw | `src/components/schouwen/SchouwMediaUpload.tsx` — Foto/video upload component |
| Edit | `src/pages/Schouwen.tsx` — Herstructureer met "Inplannen" vs "Starten", 5-staps wizard |
| Edit | `src/pages/Instellingen.tsx` — Adviseur-zichtbaarheid toggle voor partner_admin |

