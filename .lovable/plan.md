

## Plan — Opleveringen-tab op klantkaart + PDF-versiehistorie

Twee samenhangende uitbreidingen voor het klantdossier:

### 1. Nieuwe tab "Opleveringen" op klantkaart (`KlantDetail`)

- Nieuw tabblad **"Opleveringen"** tussen *Installaties* en *Schouwen* met badge-counter.
- Tab toont een lijst van alle opleverrapporten van deze klant (gekoppeld via `klant_id` of via `opdrachten.lead_id`).
- Per regel: rapportnummer, status-badge (concept / wacht_op_klant / ondertekend / afgekeurd), opleverdatum, installatienummer (indien gekoppeld), aantal gearchiveerde PDF-versies, en knoppen *Openen* en *Laatste PDF downloaden*.
- Lege staat met knop *"Nieuw opleverrapport"* die naar `/opleveringen/nieuw?klant={id}` navigeert.
- Toevoegen aan QuickStats-rij: tegel **"Opleveringen"** met totaal-aantal.
- Sidebar-`SamenvattingCard` krijgt regel "Opleveringen" + "Ondertekende rapporten".
- Activiteit-tijdlijn krijgt extra events voor opleveringen (aanmaak + ondertekening).

### 2. PDF-versiehistorie per opleverrapport

Het huidige systeem overschrijft `pdf_url` op `opleverrapporten` bij elke download. Dat brengen we naar een echt versiebeheer.

**Datamodel — nieuwe tabel `opleverrapport_pdf_versies`:**

```sql
create table public.opleverrapport_pdf_versies (
  id uuid primary key default gen_random_uuid(),
  rapport_id uuid not null references public.opleverrapporten(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  versie int not null,             -- 1, 2, 3, ...
  pdf_path text not null,          -- pad in oplever-media
  pdf_hash text not null,          -- sha256
  bestandsgrootte int,
  gegenereerd_door uuid references public.users(id),
  reden text,                      -- bv. 'handmatige download', 'klant_ondertekening', 'verzonden_naar_klant'
  status_op_moment text,           -- snapshot van rapport-status
  created_at timestamptz not null default now(),
  unique (rapport_id, versie)
);
```
- RLS identiek aan `opleverrapporten` (partner-scoped + superadmin).
- Index op `(rapport_id, versie desc)`.
- `opleverrapporten.pdf_url`/`pdf_hash` blijven bestaan en wijzen altijd naar de **laatste** versie (backwards compat).

**Logica:**
- `downloadOpleverPdf` schrijft na succesvolle upload óók een rij in `opleverrapport_pdf_versies` met auto-increment versienummer (RPC of `coalesce(max(versie),0)+1` in een transactie).
- Drie momenten registreren een versie: handmatige download, automatisch bij klant-ondertekening (`oplever-klant-ondertekenen` edge function), en bij verzending naar klant (`oplever-verzend-klant`).
- Bestaand pad-patroon `partner_id/rapport_id/rapport-{ts}.pdf` blijft.

**UI — versiehistorie:**
- Nieuwe component `OpleverPdfVersies.tsx` toont lijst (versie, datum, generator-naam, reden, hash-fragment, knop *Download*).
- Geplaatst in `OpleverDetail.tsx` als nieuwe sectie onder de actieknoppenrij (collapsible, default ingeklapt).
- Op klantkaart-tab "Opleveringen" toont de regel `v3` (laatste versienummer) als badge en de download-knop pakt de meest recente versie via signed URL.

### Bestanden-overzicht

| Bestand | Actie |
|---|---|
| `supabase/migrations/<ts>_oplever_pdf_versies.sql` | nieuw — tabel + RLS + index |
| `src/components/oplever/api/opleverPdfVersies.ts` | nieuw — `fetchVersies`, `insertVersie`, `getSignedUrlForVersie` |
| `src/components/oplever/OpleverPdfVersies.tsx` | nieuw — UI lijst met download-knoppen |
| `src/lib/renderOpleverPdf.ts` | edit — extra parameter `reden`, schrijft versie-rij |
| `src/pages/OpleverDetail.tsx` | edit — versie-sectie inbouwen, `reden: 'handmatige_download'` meegeven |
| `supabase/functions/oplever-klant-ondertekenen/index.ts` | edit — versie-rij `reden: 'klant_ondertekening'` |
| `supabase/functions/oplever-verzend-klant/index.ts` | edit — versie-rij `reden: 'verzonden_naar_klant'` |
| `src/components/oplever/api/opleverApi.ts` | edit — `fetchRapportenVoorKlant(klantId)` helper |
| `src/components/detail/DetailComponents.tsx` | edit — nieuwe `OpleveringenLijst` component |
| `src/pages/KlantDetail.tsx` | edit — extra tab, query, QuickStat, sidebar-regel, timeline-events |
| `src/integrations/supabase/types.ts` | auto-update na migratie |

### Edge cases & kwaliteit
- Versies worden **niet automatisch verwijderd**. Bij verwijderen van een rapport (alleen concepts) cascade-deleten ze mee.
- Storage-bucket `oplever-media` blijft privé; downloads via `createSignedUrl(300)`.
- Bij netwerkfout op versie-insert toont de UI nog steeds de download maar logt warning — niet blokkerend voor de download.
- Klanten-tab respecteert RLS; consument-rol ziet alleen eigen rapporten.

### Niet aangeraakt
- Wizard-flow, ondertekening-mechanisme, klant-token, hash-archief-bucket.
- Bestaande `opleverrapport_audit` tabel — blijft voor event-log; PDF-versies is een aparte materialized lijst voor downloadbare artefacten.
- `opleverrapporten.pdf_url`/`pdf_hash` (blijven als pointer naar laatste versie voor bestaande consumers).

### Bevestigingsvragen
Geen — alle keuzes (aparte tabel, RLS-pattern, drie trigger-momenten, sidebar/quickstat/timeline integratie) volgen bestaande patronen in de codebase.

