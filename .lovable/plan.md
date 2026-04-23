

## Plan — Schouw stevig koppelen aan installatie

### Probleem

De installatie kent geen directe schouw-koppeling. De huidige indirecte route `installatie.opdracht_id → opdracht.schouw_id` faalt zodra er geen opdracht is (zoals bij IN-2026-0001: `opdracht_id` is leeg). De monteur ziet daardoor geen daksamenstelling, meterkast of fotonotities, en de AI-werkomschrijving krijgt een leeg `schouw`-blok mee. Bovendien kan een gebruiker nu nergens een schouw aan een installatie hangen — er is geen koppel-UI.

### Wat we bouwen

**1. Directe `schouw_id` op `installaties`**

Migratie die de relatie expliciet maakt:
- `installaties.schouw_id uuid` (nullable) + FK naar `schouwen(id)` `ON DELETE SET NULL`
- Index op `schouw_id`
- Backfill: voor elke installatie zonder eigen `schouw_id` proberen we te vullen via (a) `opdracht.schouw_id` of (b) de meest recent `uitgevoerd`-e schouw met dezelfde `lead_id` van de installatie binnen dezelfde `partner_id`.

De indirecte weg blijft werken (we lezen voortaan `installatie.schouw_id ?? opdracht.schouw_id`).

**2. Resolver in één hook: `useInstallatieSchouw`**

Nieuwe hook die de schouw ophaalt met deze prioriteit:
1. `installatie.schouw_id` (direct)
2. `opdracht.schouw_id` via `opdracht_id`
3. fallback: meest recente `uitgevoerd`-e schouw op `lead_id` (read-only weergave + chip "Voorgesteld op basis van lead")

Geeft terug: `{ schouw, bron: 'direct'|'opdracht'|'voorstel'|'geen' }`.

**3. Schouw-kaart in installatie (overzicht-tab)**

Nieuwe component `InstallatieSchouwCard.tsx` rechts naast de Klantkaart in een 2-koloms grid. Toont:
- Schouwnummer + status-badge + datum + adviseur
- **Samenvatting per categorie** (alleen wat ingevuld is): zonnepanelen-clusters (aantal panelen, oriëntatie, hellingshoek), batterij, laadpaal, warmtepomp
- Meterkast-info (type, fase, hoofdzekering) als aanwezig in `gegevens`
- **Aandachtspunten** prominent in een gele banner
- Eerste 4 foto-thumbnails (klikbaar → lightbox via bestaande viewer)
- Knoppen: "Schouw openen", "Foto's bekijken", en — bij `bron='voorstel'` — "Koppelen aan deze installatie"
- Wanneer geen schouw: lege staat met knop **"Schouw koppelen"** die `SchouwKoppelDialog` opent

**4. Koppel-dialog: `SchouwKoppelDialog.tsx`**

- Lijst van schouwen binnen `partner_id`, voorgefilterd op dezelfde `lead_id`/`klant_id` (uitvouwbaar naar "Toon alle schouwen")
- Zoekveld op schouwnummer / klantnaam / adres
- Per regel: status, datum, categorie, adviseur
- Selectie → `update installaties set schouw_id = ?` + toast + invalidate
- "Ontkoppelen" knop bij gekoppelde schouw

**5. Schouw zichtbaar voor de monteur (werkscherm)**

In `MonteurWerkscherm` (we lezen het bestand voor de exacte plek) een collapsible sectie **"Info uit schouw"** toevoegen, identiek aan de samenvattingscomponent uit (3) maar in een mobiel-vriendelijke layout (foto-grid 2 koloms, aandachtspunten bovenaan rood/geel). Geen edit-mogelijkheden — alleen lezen + foto-viewer.

We extraheren de samenvatting uit `InstallatieSchouwCard` naar een sub-component `SchouwSamenvatting.tsx` zodat zowel desktop-card als mobiel-werkscherm hetzelfde renderen.

**6. AI-werkomschrijving uitbreiden**

In `supabase/functions/genereer-werkomschrijving/index.ts`:
- Schouw-resolutie volgt dezelfde prioriteit als de hook (direct → opdracht → fallback op `lead_id` met `status='uitgevoerd'`)
- Context-blok `schouw` uitgebreid met: `schouw_nummer`, `categorie`, `geplande_datum`, alle clusters uit `gegevens.zonnepanelen.clusters`, meterkast-velden (`type`, `fase`, `hoofdzekering`), `aandachtspunten`, en het aantal beschikbare foto's
- Systeemprompt-bullets aangevuld met expliciete instructie: "Noem dakvlakken concreet (bv. 'ZW-dak, 12 panelen, 35°') en herhaal aandachtspunten één-op-één."

**7. Werkvoorbereiding-checklist auto-vinkje**

Wanneer er een gekoppelde uitgevoerde schouw is, wordt het bestaande readiness-onderdeel "Schouw" automatisch op groen gezet (al gebouwd in `useInstallatieGereedheid`, maar leest nu alleen via opdracht — we passen het aan zodat het de nieuwe directe `schouw_id` óók ziet).

### Bestanden

**Nieuw**
- Migratie `…_installatie_schouw_koppeling.sql` — kolom + FK + index + backfill
- `src/hooks/installaties/useInstallatieSchouw.ts` — resolver-hook
- `src/components/installaties/InstallatieSchouwCard.tsx` — desktop-kaart + lege staat
- `src/components/installaties/SchouwSamenvatting.tsx` — gedeelde samenvattings-render
- `src/components/installaties/SchouwKoppelDialog.tsx` — selectie-dialog

**Aangepast**
- `src/pages/InstallatieDetail.tsx` — `InstallatieSchouwCard` in de overzicht-grid (2-koloms layout wordt 2 rijen × 2 kolommen)
- `src/components/installaties/api/installatieApi.ts` — geen wijziging nodig (types hergegenereerd)
- `src/hooks/installaties/useInstallatieGereedheid.ts` — schouw lezen via `installatie.schouw_id ?? opdracht.schouw_id`
- `src/hooks/installaties/useInstallatiesGereedheidBulk.ts` — idem voor bulk
- `src/pages/MonteurWerkscherm.tsx` (of equivalent) — sectie "Info uit schouw" + foto-grid
- `supabase/functions/genereer-werkomschrijving/index.ts` — uitgebreide schouw-resolutie + rijker context-blok

### Niet-doelen
- Geen wijziging aan de schouw-module zelf (alleen lezen)
- Geen kopie van schouw-data naar installatie-velden (single source of truth blijft `schouwen`)
- Geen foto-bewerking vanuit installatie — alleen viewer
- Geen automatische koppeling zonder bevestiging als er meerdere kandidaten zijn

