

## Plan — Uitgebreide Installaties-module (werkproces)

Doel: van een opdracht naar een volwaardige installatie met monteurplanning, klantcommunicatie, notities, voortgang en doorzetten naar oplevering. Zichtbaar vanuit klantkaart, automatische notificatie naar monteur, en een werkomgeving voor de monteur.

### 1. Datamodel-uitbreiding (tabel `installaties`)

Nieuwe kolommen op de bestaande `installaties` tabel:
- `installatienummer` text uniek (INST-YYYY-0001 via `generate_documentnummer_v2`)
- `opdracht_id` uuid — FK naar `opdrachten` (twee-richtings link)
- `klant_id` uuid — FK naar `klanten`
- `klant_email`, `klant_telefoon`, `klant_adres`, `klant_postcode`, `klant_plaats` text — snapshot
- `start_tijd`, `eind_tijd` time — exacte tijdvensters per dag
- `werkadres` text — locatie van uitvoering (kan afwijken van klantadres)
- `werkomschrijving` text — wat moet er gebeuren
- `producten` jsonb — overgenomen uit opdracht/offerte
- `bevestiging_verzonden_op` timestamptz
- `monteur_geaccepteerd_op` timestamptz
- `werkelijke_starttijd`, `werkelijke_eindtijd` timestamptz
- `gereedmelding_op` timestamptz
- `gereedmelding_notitie` text
- `oplevering_id` uuid — FK naar `opleverrapporten`
- `created_by` uuid

Status enum uitbreiden: `concept`, `gepland`, `bevestigd`, `onderweg`, `in_uitvoering`, `gereed`, `afgerond`, `geannuleerd`.

Twee nieuwe tabellen:
- `installatie_notities` (id, installatie_id, partner_id, auteur_id, inhoud, intern bool, created_at)
- `installatie_historie` (id, installatie_id, partner_id, actor_id, actie, veld, oude_waarde, nieuwe_waarde, created_at) + trigger zoals factuur_historie

RLS per partner_id, security-definer functies hergebruiken. Trigger `notify_on_status_change` (bestaat al) blijft notificaties pushen naar `installateur_id`.

### 2. Pagina's & componenten

```text
src/pages/Installaties.tsx              edit — nieuwe kolommen, status-filter, monteur-filter, "Mijn opdrachten" voor installateurs
src/pages/InstallatieDetail.tsx         nieuw — tabs: Overzicht / Planning / Klant / Producten / Notities / Communicatie / Historie / Oplevering
src/pages/InstallatieNieuw.tsx          nieuw — wizard vanuit opdracht of standalone

src/components/installaties/
  InstallatieHeader.tsx                 statusbadge + acties
  InstallatiePlanningCard.tsx           datum, tijd, monteur, werkadres
  InstallatieKlantCard.tsx              contact + actieknoppen
  InstallatieProductenCard.tsx          regels read-only (uit opdracht)
  InstallatieNotitiesTab.tsx            CRUD intern/extern, real-time
  InstallatieCommunicatieTab.tsx        e-mail naar klant + monteur (templates)
  InstallatieHistorieTab.tsx            audit-feed
  InstallatieMonteurView.tsx            mobile-first werkscherm: starten/pauze/gereedmelden
  KlantBevestigingDialog.tsx            preview + verstuur datum-bevestiging
  MonteurToewijsDialog.tsx              monteur + datum + tijdvenster
  InstallatieStatusBadge.tsx
  api/installatieApi.ts
  useInstallatie.ts                     TanStack hook
```

Elk bestand <800 regels, functies <50 regels.

### 3. Workflow opdracht → installatie

Vanuit `OpdrachtDetail.tsx`:
- Bestaande "Installatie plannen"-dialog vervangen door **MonteurToewijsDialog** die:
  - installatie aanmaakt met installatienummer, snapshot klantgegevens, producten uit opdracht, status `gepland`
  - opdracht.installatie_id + status `installatie_gepland` zet
  - direct **klantbevestiging-mail** aanbiedt (template "installatie-gepland")
  - automatisch een monteur-notificatie en e-mail triggert

### 4. Klantcommunicatie

Twee transactional templates aanmaken via Lovable Email infra:
- `installatie-gepland` — naar klant: datum, tijdvenster, monteur, werkadres, contactlink
- `installatie-herinnering` — handmatig of 1 dag vooraf (later via cron)

E-mail wordt verstuurd via bestaande `send-transactional-email` flow, met `templateData` met datum/tijd/monteur/werkomschrijving. Vereist eerst e-mail-infra opzet.

### 5. Monteur-ervaring

- **Notificatie**: bestaande `notify_on_status_change` trigger zet al een rij in `notificaties` voor `installateur_id`. Aanvullend e-mail via `send-transactional-email` template `installatie-toegewezen-monteur` direct na toewijzing.
- **Planning-zichtbaarheid**: bestaande `Planning.tsx` toont al installaties geel; we voegen filter "Mijn agenda" werking voor rol `installateur` (toont enkel eigen installaties + werkt al via `installateur_id`).
- **Werkscherm `InstallatieMonteurView.tsx`** (mobile-first):
  - Knoppen: "Start onderweg" / "Aangekomen / starten" / "Pauze" / "Gereed melden"
  - Foto's uploaden naar `oplever-media/installatie/{id}` (snel werkbewijs)
  - Notitieveld
  - Knop **"Opleverrapport maken"** → navigeert naar `/opleveringen/nieuw?installatie={id}` met prefill (klant, monteur, datum, producten)

### 6. Klantkaart-integratie

In `KlantDetail.tsx`:
- Nieuwe tab **"Installaties"** met `InstallatiesLijst` component (telt naast Opdrachten/Schouwen)
- Quick-stat "Installaties" toegevoegd
- Timeline-events uitgebreid met installatie-aanmaak, gereedmelding, oplevering
- `InstallatiesLijst` herbruikbaar component in `DetailComponents.tsx`

### 7. Routes & navigatie

`src/App.tsx` toevoegen:
- `/installaties/nieuw` → `InstallatieNieuw`
- `/installaties/:id` → `InstallatieDetail`
- `/installaties/:id/werk` → `InstallatieMonteurView` (mobile route, alleen rol `installateur`/admin)

Sidebar `AppSidebar.tsx`:
- "Installaties" entry blijft, voor `installateur` label "Mijn werk"
- Sub-items toevoegen voor admin: "Alle installaties" / "Te plannen" / "Vandaag" / "Gereed te leveren"

### 8. Toegangsrechten

- `superadmin`, `partner_admin`, `partner_staff`, `backoffice` → vol beheer
- `installateur` → eigen installaties (filter `installateur_id = auth.uid()`)
- `consument` → eigen installaties read-only via klantkaart-portaal
- `affiliate` → geen toegang

### 9. PDF & opleveringskoppeling

Bij gereedmelding wordt knop "Maak opleverrapport" actief; deze prefilled de bestaande NEN 1010-wizard (`/opleveringen/nieuw`) met installatie-id, klant, monteur, opleverdatum. Na finalisatie schrijft `oplever-klant-ondertekenen` `installaties.oplevering_id` en zet status op `afgerond`.

### 10. Geen build wijzigingen aan

- `OpleverDetail/Wizard` blijft, krijgt alleen prefill via querystring
- `Planning.tsx` blijft, krijgt geen wijzigingen — installaties tonen al
- Bestaande `installaties` rijen blijven werken (nieuwe kolommen nullable)

### Memory updates

Toevoegen `mem://workflow/installaties-module` met: tabel-uitbreiding, statusverloop concept→afgerond, monteur-werkscherm, klantbevestiging template, koppeling met opleverwizard.
Update `mem://orders/workflow` om door te verwijzen naar nieuwe installatie-flow.

### Bestanden-overzicht

| Bestand | Actie |
|---|---|
| `supabase/migrations/...installaties_uitbreiden.sql` | nieuw — kolommen, enum, RLS, triggers, notities & historie tabellen |
| `src/pages/Installaties.tsx` | edit — filters, kolommen, rolbewust |
| `src/pages/InstallatieDetail.tsx` | nieuw |
| `src/pages/InstallatieNieuw.tsx` | nieuw |
| `src/components/installaties/*` | nieuw — alle componenten hierboven |
| `src/components/detail/DetailComponents.tsx` | edit — `InstallatiesLijst` + Installatie-tab in klantkaart |
| `src/pages/KlantDetail.tsx` | edit — tab + stat + timeline |
| `src/pages/OpdrachtDetail.tsx` | edit — nieuwe MonteurToewijsDialog + bevestiging-mail |
| `src/App.tsx` | edit — routes |
| `src/components/AppSidebar.tsx` | edit — sub-items |
| `supabase/functions/_shared/transactional-email-templates/installatie-gepland.tsx` | nieuw |
| `supabase/functions/_shared/transactional-email-templates/installatie-toegewezen-monteur.tsx` | nieuw |
| `supabase/functions/_shared/transactional-email-templates/registry.ts` | edit |
| `mem://workflow/installaties-module` + `mem://index.md` | nieuw + update |

### Bevestigingsvragen

Geen — patronen volgen bestaande modules (oplever, opdracht, schouw). Voor de e-mailtemplates wordt de bestaande Lovable Email-infrastructuur gebruikt; als die nog niet is opgezet wordt dat als eerste stap uitgevoerd voordat de templates worden geactiveerd.

