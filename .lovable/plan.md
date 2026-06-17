
# Duplicate-leads detectie & samenvoegen

## Wat de partner straks ziet

1. **Dashboard / Vandaag** — een kaart "Mogelijke dubbele leads (N)" met de eerste paar paren en knop "Bekijken".
2. **Leads-overzicht** — een banner bovenaan "N mogelijke duplicaten gevonden — bekijken".
3. **Lead-detailpagina** — inline waarschuwing "Mogelijk duplicaat van Jan Jansen (scan 12-03-2026)" met knoppen *Samenvoegen* en *Geen duplicaat*.
4. **Samenvoegen-dialog** — twee leads naast elkaar; per veld (naam, e-mail, telefoon, adres, bron, notities, status, eigenaar, lead_eigenschappen-velden) een radio-keuze welke waarde behouden blijft. Alle gekoppelde records (afspraken, schouwen, offertes, opdrachten, klanten, contactmomenten, notities, daklayouts, e-mails, installaties) worden overgezet naar de behouden lead, de andere lead wordt daarna verwijderd.
5. **Geen-duplicaat-knop** — paar wordt onthouden in een nieuwe tabel `lead_duplicaat_negeerlijst` en verschijnt niet meer.

## Detectie-criteria

Een paar `(lead_a, lead_b)` binnen dezelfde `partner_id` is verdacht wanneer **één van deze** matcht:
- Genormaliseerd e-mailadres (lowercase, trim) gelijk.
- Laatste 8 cijfers van het telefoonnummer (alleen digits) gelijk.
- Postcode (zonder spaties, uppercase) + huisnummer (eerste getallen uit `adres`) gelijk.

Paren die in `lead_duplicaat_negeerlijst` staan worden uitgesloten.

## Technische uitwerking

### Database (migratie)

- **View `v_lead_duplicaten`** (security invoker) die per partner duplicaat-paren oplevert met kolommen `partner_id, lead_a_id, lead_b_id, match_reden text[], score int`. Implementatie: drie subqueries (email/telefoon/postcode+huisnr) `UNION` op `least(id)`/`greatest(id)` om dubbele paren te voorkomen; `score` = aantal match-redenen.
- **Tabel `lead_duplicaat_negeerlijst`**: `id`, `partner_id`, `lead_a_id`, `lead_b_id` (genormaliseerd zodat a<b), `genegeerd_door`, `created_at`. Unique op `(partner_id, lead_a_id, lead_b_id)`. RLS: partner-scoped lezen/aanmaken/verwijderen. GRANT op `authenticated` + `service_role`.
- **Helper-functie `public.normalize_phone(text)`** en `public.extract_huisnummer(text)` (SQL, immutable) zodat de view dezelfde logica gebruikt als de frontend.

### Edge Function `lead-merge`

- Input: `{ keep_lead_id, merge_lead_id, field_choices: Record<string,'keep'|'merge'> }`.
- Auth: JWT verifiëren, partner_id ophalen, beide leads moeten binnen dezelfde partner vallen.
- Stappen in één transactie (via `rpc('lead_merge_tx', …)` of sequentieel met service-role client):
  1. Bouw update-payload voor `leads` op basis van `field_choices`.
  2. `UPDATE leads SET … WHERE id = keep_lead_id`.
  3. Voor elke gerelateerde tabel met `lead_id`: `UPDATE … SET lead_id = keep WHERE lead_id = merge`. Lijst: `afspraken`, `schouwen`, `offertes`, `opdrachten`, `installaties`, `klanten`, `daklayouts`, `email_berichten`, `lead_contactmomenten`, `lead_notities`, `lead_eigenschappen`.
  4. Voor `lead_eigenschappen`: indien beide rijen bestaan → veld-voor-veld mergen volgens `field_choices`, anders simpel `UPDATE lead_id`.
  5. `DELETE FROM leads WHERE id = merge_lead_id`.
  6. Log naar `entiteit_historie` ("Lead samengevoegd met …").
- Output: `{ ok: true, kept_lead_id }`.

### Frontend

Nieuwe module `src/components/leads/duplicaten/`:
- `useDuplicaten.ts` — TanStack Query hook naar `v_lead_duplicaten` (+ filtert genegeerde paren via join).
- `DuplicatenBanner.tsx` — banner voor Leads-overzicht.
- `DuplicatenKaart.tsx` — kaart voor Dashboard/Vandaag.
- `DuplicaatWaarschuwing.tsx` — inline alert op LeadDetail.
- `MergeDialog/`
  - `index.tsx` — orchestrator, opent dialog, roept Edge Function aan.
  - `FieldRow.tsx` — één regel met label + 2 radio-opties (waarde A / waarde B), highlight bij verschil, "identiek" badge bij gelijke waardes.
  - `useMergeForm.ts` — bouwt initiële keuzes (default = niet-leeg veld), valideert.
- `useNegeerDuplicaat.ts` — mutation die rij in `lead_duplicaat_negeerlijst` insert + query invalideert.

Integratie:
- `src/pages/Leads.tsx`: `<DuplicatenBanner />` bovenaan.
- `src/pages/Vandaag/index.tsx`: `<DuplicatenKaart />` in de actie-kolom.
- `src/pages/LeadDetail.tsx`: `<DuplicaatWaarschuwing leadId={id} />` direct onder de header.

### Kwaliteit & regels

- Eén component per bestand, hooks in eigen bestand (workspace-regels).
- Edge Function valideert input met Zod en gebruikt service-role alleen na partner-check.
- RLS op nieuwe tabel + GRANTs in dezelfde migratie.
- Loading- en error-states in elke nieuwe component.
- Nederlandstalige microcopy, geen emoji's.

## Out of scope

- Automatisch samenvoegen zonder bevestiging.
- Cross-partner duplicaten.
- Bulk-merge van meer dan 2 leads tegelijk (eerst paar-voor-paar, kan later).
