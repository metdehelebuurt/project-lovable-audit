## Probleem

Na ondertekening door de klant (bv. esteban@cenora.nl) ontvangt de klant géén rapport terug. De dank-pagina belooft *"U ontvangt het ondertekende rapport per e-mail"*, maar de edge function `oplever-klant-ondertekenen` verstuurt uitsluitend een interne notificatie naar het partnerteam (`oplever-ondertekend`-template). Er gaat niets richting de klant.

Extra complicatie: de PDF wordt op dit moment **client-side** gegenereerd (html2canvas/jsPDF in `renderOpleverPdf.ts`). De laatst gearchiveerde PDF bevat wel de installateur-handtekening, maar nog niet die van de klant, en na signing wordt geen nieuwe PDF gerenderd.

## Oplossing

Twee samenwerkende verbeteringen, waarbij de klant onmiddellijk een bevestigingsmail krijgt met een blijvende link naar het ondertekende rapport, plus de al beschikbare PDF-download.

### 1. Klant krijgt automatisch een bevestigingsmail

`supabase/functions/oplever-klant-ondertekenen/index.ts` wordt uitgebreid zodat het ná het opslaan van de handtekening:

- E-mailadres + naam van de klant opzoekt (zelfde patroon als `oplever-verzend-klant`: eerst `klanten`, fallback `opdrachten.klant_email/klant_naam`).
- Een **permanent view-token** genereert (`klant_view_token`, 180 dagen geldig) en op het rapport zet — los van het eenmalige ondertekentoken dat na signing verloopt.
- Een signed URL (7 dagen) opbouwt voor de bestaande `pdf_url` in bucket `oplever-media`, indien aanwezig.
- Een partner-branded e-mail verstuurt via `sendPartnerEmail` naar de klant met:
  - Bevestiging dat het rapport is ondertekend.
  - Link naar de blijvende online-weergave: `${origin}/oplevering/${klant_view_token}/bekijken`.
  - Downloadlink naar de PDF (indien beschikbaar).
  - Handleidingen van de gekoppelde producten (hergebruik van de helper uit `oplever-verzend-klant`).
- Alles logt in `opleverrapport_audit` (`actie: "bevestiging_naar_klant"`).
- Bestaande partner-team notificatie blijft ongewijzigd.

Fallback: als de mail-provider faalt (bijv. geen partner-emailaccount gekoppeld), wordt het probleem gelogd en de audit-actie krijgt `status: "failed"`. Het rapport blijft correct als "ondertekend" gemarkeerd — geen 500 terug naar de klant.

### 2. Blijvende publieke weergave voor de klant

Nieuwe route `/oplevering/:token/bekijken` (in `App.tsx` + `src/pages/OpleverKlantView.tsx`) die read-only het ondertekende rapport toont:
- Roept een uitgebreide `oplever-public-view` aan die op basis van `klant_view_token` (i.p.v. ondertekentoken) rapportdata + beide handtekeningen + PDF-signedUrl teruggeeft.
- Toont rapportheader, ingebedde PDF (indien aanwezig), klant- en installateur-handtekening, en een download-knop.
- `oplever-public-view` wordt uitgebreid met tokentype-detectie (`klant_token` óf `klant_view_token`) zodat de bestaande signeer-flow niet breekt.

### 3. Dank-pagina scherper

`OpleverKlantOndertekenen.tsx` toont na signing dezelfde permanente view-link plus een "Bekijk uw rapport"-knop, zodat de klant direct — nog vóór de mail binnen is — het ondertekende document kan raadplegen en downloaden.

## Migratie

Eén kleine migratie: kolommen `klant_view_token uuid` en `klant_view_token_expires_at timestamptz` op `opleverrapporten`. Geen nieuwe RLS-policies nodig; toegang loopt via de edge functions (service role).

## Bestanden

- `supabase/functions/oplever-klant-ondertekenen/index.ts` — klantmail + view-token + audit.
- `supabase/functions/oplever-public-view/index.ts` — ondersteuning voor `klant_view_token`.
- `supabase/functions/_shared/transactional-email-templates/oplever-klant-bevestiging.tsx` — nieuwe partner-branded klanttemplate + registratie in `registry.ts`.
- `src/pages/OpleverKlantView.tsx` — nieuwe read-only pagina.
- `src/pages/OpleverKlantOndertekenen.tsx` — bevestigingsscherm met view-link.
- `src/App.tsx` — nieuwe route.
- DB-migratie: kolommen `klant_view_token`, `klant_view_token_expires_at` op `opleverrapporten`.

## Validatie

- Playwright: open ondertekenlink → onderteken → controleer (a) audit-rij `bevestiging_naar_klant`, (b) `email_log` bevat outgoing mail met bevestiging-subject, (c) `/oplevering/{view_token}/bekijken` toont het rapport read-only, (d) dankpagina bevat de knop.
- Handmatig voor esteban@cenora.nl: rapportrecord ophalen, `klant_view_token` opnieuw genereren via een one-shot admin-script en de bevestigingsmail alsnog uitsturen zodat deze specifieke case ook goedkomt.
