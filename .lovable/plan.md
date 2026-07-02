# Opleveringen: layout, koppeling & samenwerking

## 1. Overzichtspagina verbeteren
`src/pages/opleveringen/Opleveringen.tsx` (of vergelijkbare lijstcomponent):
- Kolommen toevoegen: **Klant**, **Verkooporder** (naast bestaand Rapportnummer / Status / Opleverdatum / Omvang).
- Query uitbreiden: join `opleverrapporten` → `installaties` → `opdrachten` → `klanten` zodat `klant_naam` en `opdracht_nummer` beschikbaar zijn.
- Zoekbalk uitbreiden zodat ook op klantnaam en verkoopordernummer gezocht wordt.
- Kolomvolgorde: Rapportnr · Verkooporder · Klant · Status · Opleverdatum · Omvang · Actie.
- Mobiel: stacked card met klant + verkooporder bovenaan.

## 2. Eén oplevering per verkooporder
- Bij aanmaken via `OpleverNieuw.tsx` / prefill: check of er al een `opleverrapport` bestaat met dezelfde `opdracht_id` (of via `installatie.opdracht_id`).
- Als er al één bestaat → `AlertDialog` met:
  - Titel: "Er bestaat al een opleverrapport voor deze verkooporder"
  - Body: lijst met bestaande rapport(en) + link "Open bestaand rapport"
  - Acties: `Bestaand openen` (primair) / `Toch nieuw aanmaken` (destructive/secondary) / `Annuleren`.
- Bij "Toch nieuw" → veld `duplicaat_reden` (verplicht) opslaan in `opleverrapporten.notities` of nieuwe kolom `duplicaat_van_id` + audit_log entry.
- Geen harde DB-constraint (user mag alsnog meerdere), wel soft-check + logging.

## 3. Gedeeld werken: backoffice ↔ monteur
Vandaag laadt de monteur vaak een leeg document via het werkscherm. Fix:
- **Één bron:** `useOpleverrapport(opdracht_id)` hook die altijd het bestaande concept-rapport voor de opdracht ophaalt; alleen als er geen concept is → nieuw aanmaken met prefill.
- Werkscherm (`InstallatieWerkscherm` / knop "Opleverrapport") en backoffice route (`/opleveringen/nieuw?opdracht=...`) gebruiken dezelfde hook → zelfde `oplevering_id`.
- Realtime sync: Supabase `postgres_changes` channel op `opleverrapporten` + `opleverrapport_*` subtabellen zodat wijzigingen live doorkomen als beide open hebben.
- Bewerk-indicator: kleine badge "Backoffice/Monteur is dit document aan het bewerken" o.b.v. `updated_at` + `updated_by` (laatste 30s).
- Auto-save (debounced 2s) i.p.v. alleen "Opslaan"-knop, zodat prefill van backoffice direct persistent is voor monteur.
- Prefill blijft via `opleverPrefill.ts`, maar draait alleen bij daadwerkelijke `INSERT` — bestaand rapport wordt nooit overschreven.

## 4. Kleine layout-verbeteringen lijst
- Statusbadge kleuren consistent (Concept grijs, Ondertekend groen, Verzonden blauw).
- Rij-hover + hele rij klikbaar naar `Openen`.
- Sticky header, compactere row-height, rechts uitgelijnde acties in één knopgroep (`PDF` + `Openen`).

## Technische samenvatting
- **Data:** Extra kolom `duplicaat_van_id uuid` (nullable, self-ref) op `opleverrapporten`; geen unique constraint.
- **Query:** join via `installaties.opdracht_id` → `opdrachten` → `klanten`.
- **Hook:** nieuwe `useOpleverrapportByOpdracht.ts` (get-or-create semantiek in de aanmaakflow, niet in de detailview).
- **UI:** `DuplicaatWaarschuwingDialog.tsx`, kolommen in lijst, realtime hook `useOpleverrapportRealtime.ts`.
- **Audit:** entry in `audit_log` bij "toch nieuw aanmaken".

Klaar om te bouwen zodra je akkoord bent.
