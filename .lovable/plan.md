

## Plan — Werkvoorbereiding op het overzicht + AI-werkomschrijving

Drie samenhangende verbeteringen op de installatie-module:

### 1. Overzicht: statusbalk + plaatsnaam (Installaties.tsx)

**Nieuwe kolom "Voorbereiding"** met een mini-progressbar per rij die toont hoeveel checklist-items klaar zijn. Bij 100% groen, met blokkades rood, anders neutraal. Hover-tooltip toont "X / Y items · Z blokkerend(e)".

- Nieuwe component `InstallatieGereedheidsBar.tsx` — kleine balk + ratio-tekst, gebruikt de bestaande `useInstallatieGereedheid`-hook.
- Om N+1 queries te vermijden: een nieuwe hook `useInstallatiesGereedheid(ids)` die in **één query** per tabel (`installatie_checklist_items`, `opdrachten→schouwen`, `product_serienummers`) data ophaalt en client-side per installatie aggregeert. Lichtere variant van de detail-hook (alleen totaal/ok/blokkades, niet alle 12 individuele checks).
- Kolommen volgorde: Nummer · Klant · Adres · **Plaats** · Voorbereiding · Status · Monteur · Datum · Acties.
- Zoekfilter uitgebreid: zoekt nu ook op `klant_plaats`.

### 2. Nummerreeks zichtbaarheid

De configuratie staat al in `NummerreeksConfig.tsx` (regel 29: "Installatie / INST"). Geen DB-werk. We tonen het `installatienummer` voortaan in de tabel als gekleurde badge (kopieerbaar bij hover), en de prefix-uitleg wordt zichtbaar in de header van het detailscherm (al aanwezig). Dit punt is dus **al gebouwd** — we documenteren het in de Werkvoorbereiding-tab met een korte hint en zorgen dat lege nummers (oude installaties) een knop "Nummer toekennen" krijgen die `generate_documentnummer_v2` aanroept.

### 3. AI-werkomschrijving voor monteur

Een knop **"AI-werkomschrijving genereren"** in `InstallatiePlanningCard.tsx` (boven het werkomschrijving-veld) en in de Werkvoorbereiding-tab. De AI krijgt context uit:

- Installatie zelf (klant, adres, datum, geplande tijd, producten-array)
- Gekoppelde schouw via `opdracht.schouw_id`: dakvlakken, type meterkast, bijzonderheden, fotonotities, zekeringen, kabelroute
- Producten met technische specs (`producten.naam`, `wattpiek`, `merk`, `type`)
- Eventuele open checklist-items (zodat monteur ze meeneemt)
- Klantbevestiging-data (gewenste tijd, bijzonderheden klant)

**Edge function `genereer-werkomschrijving`** (nieuw):
- Input: `{ installatie_id }`
- Verzamelt server-side alle bovenstaande data via service role + RLS-bypass
- Stuurt naar Lovable AI Gateway met `google/gemini-3-flash-preview`
- System prompt: "Je bent een planner die een korte, praktische werkomschrijving schrijft voor de monteur. Nederlands, zakelijk, max 200 woorden, in bullets per onderdeel: Aankomst & toegang · Materiaal & producten · Werkzaamheden · Aandachtspunten uit schouw · Oplevering."
- Output: tekst die in `werkomschrijving` veld komt (gebruiker kan nog editen vóór opslaan).
- Toast bij rate-limit (429) en credits (402).
- Knop disabled met spinner tijdens generatie.

**UI-detail**: na generatie verschijnt de tekst in een dialog met "Gebruiken" / "Annuleren" / "Opnieuw genereren" zodat de gebruiker controle houdt — geen automatische overschrijving.

### Bestanden

**Nieuw**
- `src/components/installaties/InstallatieGereedheidsBar.tsx` — mini-progressbar voor lijst (~60 regels)
- `src/hooks/installaties/useInstallatiesGereedheidBulk.ts` — batch-hook voor N installaties (~120 regels)
- `src/components/installaties/AiWerkomschrijvingDialog.tsx` — dialog met preview + acties (~150 regels)
- `supabase/functions/genereer-werkomschrijving/index.ts` — edge function (~180 regels)

**Aangepast**
- `src/pages/Installaties.tsx` — kolommen Plaats + Voorbereiding, zoek op plaats, badge voor nummer
- `src/components/installaties/InstallatiePlanningCard.tsx` — AI-knop bij werkomschrijving
- `src/components/installaties/InstallatieWerkvoorbereidingTab.tsx` — AI-knop in header
- `supabase/config.toml` — nieuwe edge function registreren (verify_jwt = true)

### Niet-doelen
- Geen wijziging aan de bestaande detail-hook `useInstallatieGereedheid` (blijft voor detailscherm).
- Geen automatische re-generatie bij wijzigingen — handmatig op verzoek.
- Geen AI-streaming UI — eenvoudige request/response is voldoende voor ~200 woorden.
- Geen wijzigingen aan de nummerreeks-database of generator-functie.

