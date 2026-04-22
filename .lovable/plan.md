

## Plan — NEN 1010 Opleverrapport Module (MVP v1.0)

Een nieuwe module binnen mijnhuis waarmee installateurs digitaal een NEN 1010-conform opleverrapport samenstellen, laten ondertekenen en archiveren.

### Scope MVP (v1.0)
- Wizard 7 stappen
- Live PDF-preview + definitieve PDF
- Tweezijdige digitale handtekening (installateur in-app, klant via tokenlink)
- Opslag in klant- én installateurdossier
- Mobile-first
- Auto-save concept

### Niet in MVP (vervolgfases)
- Offline-modus / IndexedDB sync (v1.1)
- QR-scan typeplaatje (v1.1)
- eIDAS / Signhost integratie (v2.0)
- Energieleveren.nl API (v2.0)
- Publieke hash-verificatie endpoint (v2.0)
- Admin template-beheer met versies/changelog (v2.0) — wel templateVersion-veld vastleggen

### Navigatie & toegangsrechten
- Nieuwe sidebar-entry **"Opleveringen"** onder *Installaties* (sectie Werk)
- Routes:
  - `/opleveringen` — overzicht (filter op status, installateur, klant)
  - `/opleveringen/nieuw?installatie=:id` — wizard
  - `/opleveringen/:id` — detail + edit (tot ondertekening)
  - `/opleveringen/:id/pdf` — preview-pagina
  - `/oplevering/:token` — publieke klant-ondertekenpagina (geen login)
- Rolrechten:
  - `installateur`, `partner_admin`, `partner_staff`, `superadmin` → aanmaken/bewerken
  - `consument` → eigen rapport inzien + downloaden via klantportaal
  - `affiliate` → geen toegang

### Datamodel (nieuwe tabellen)

```text
opleverrapporten
  id, partner_id, installatie_id (FK), klant_id (FK), installateur_id (FK)
  rapportnummer (OPL-YYYY-0001), template_versie (default 'NEN1010-2020+A1-2024-v1.0')
  status (concept | wacht_op_klant | ondertekend | afgekeurd)
  scope_omschrijving, opleverdatum
  batterij_spec jsonb, omvormer_spec jsonb, opstelling jsonb
  visuele_inspectie jsonb (array items)
  metingen jsonb (array)
  meetapparatuur jsonb
  groepenverdeling jsonb (array)
  documenten jsonb (array {type,url})
  bevindingen jsonb {verdict, deficiencies[], recommendations[]}
  conformiteitstekst text
  installateur_handtekening jsonb {image_url,name,signed_at,ip}
  klant_handtekening jsonb {image_url,name,signed_at,ip}
  klant_token text unique, klant_token_expires_at timestamptz
  pdf_url text, pdf_hash text, gefinaliseerd_op timestamptz
  created_at, updated_at, created_by

opleverrapport_audit
  id, rapport_id, actor_id, actie, details jsonb, ip, created_at

installateur_voorkeuren
  user_id PK, meetapparatuur jsonb, kvk_nummer, erkenningsnummer
```

- RLS per partner_id (security definer functies hergebruiken)
- Aparte SELECT-policy voor publieke ondertekenpagina via Edge Function (geen RLS uitzondering)
- Numbering via bestaande `generate_documentnummer_v2(_partner_id, 'oplevering')`
- Storage bucket **`oplever-media`** (private, RLS per partner) voor foto's, schema's, handtekeningen, PDF's

### Wizard-componenten

```text
src/pages/OpleverNieuw.tsx              (wizard shell + step routing)
src/pages/OpleverDetail.tsx             (read-only + acties)
src/pages/Opleveringen.tsx              (overzicht)
src/pages/OpleverKlantOndertekenen.tsx  (publieke route /oplevering/:token)

src/components/oplever/
  WizardShell.tsx                       (progress bar, prev/next, autosave)
  StepIdentificatie.tsx
  StepInstallatie.tsx                   (incl. foto-upload typeplaten)
  StepVisueleInspectie.tsx              (dynamische checklist)
  StepMetingen.tsx                      (validatie tegen grenswaarden)
  StepDocumentatie.tsx                  (uploads + groepenverdelingstabel)
  StepBevindingen.tsx
  StepOndertekening.tsx                 (preview + signature pad installateur)
  PdfPreview.tsx                        (iframe pdf data-url)
  SignaturePad.tsx                      (hergebruik schouw SignaturePad)
  OpleverChecklistItem.tsx
  MetingInput.tsx                       (groen/rood validatie)
  GrenswaardenLogic.ts                  (NEN drempels constants)
  useOpleverAutosave.ts
  useOpleverRapport.ts                  (TanStack Query hook)
  api/opleverApi.ts                     (alle Supabase calls)
```

Elk bestand <800 regels, elke functie <50 regels, max 4 params.

### PDF-generatie
- Client-side via bestaande aanpak `pdfFromElement` + nieuwe component `OpleverRapportPDF.tsx` (A4-secties)
- Headless render-helper analoog aan `renderFactuurPdf.ts` → `renderOpleverPdf.ts`
- Bevat per pagina: paginanummer, rapportnummer, datum
- Voorblad met groene/oranje/rode goedkeuringsstempel obv `verdict`
- Bijlagen-appendix met uploads en handtekeningen
- Bij finalisatie: SHA-256 hash van blob → opgeslagen in `pdf_hash`, geüpload naar `oplever-media/{partner_id}/{rapport_id}.pdf`

### Edge Functions

```text
supabase/functions/oplever-public-view      GET token → rapport-data + pdf_url
supabase/functions/oplever-klant-ondertekenen POST token, signature_image, naam → finaliseert
supabase/functions/oplever-verzend-klant    POST rapport_id → genereert token, mailt klant
supabase/functions/oplever-deel-derde       POST rapport_id, email, expires → audit + mail (later)
```

- Hergebruik `email-send` shared util voor SendGrid mail
- Token: `crypto.randomUUID()`, geldig 14 dagen
- Bij ondertekening: lock record (status `ondertekend`), append audit-row, regenereer PDF met beide handtekeningen embedded, hash + upload, mail beide partijen.

### NEN-grenswaarden (constants)
Hardcoded in `GrenswaardenLogic.ts` voor v1.0:
- Continuïteit ≤ 1 Ω
- Isolatieweerstand ≥ 1 MΩ (500V)
- Aardlek uitschakeltijd ≤ 300 ms bij 30 mA
- Aardcircuitimpedantie context-afhankelijk → waarschuwing > 1.5 Ω
Inputvelden tonen direct rood/groen badge.

### UX
- Mobile-first: stap navigeert full-screen op <md, kolomlayout op desktop
- Numerieke inputs met `inputMode="decimal"`
- Camera-capture: `<input type="file" accept="image/*" capture="environment">`
- Auto-save elke 30s + bij stap-wissel via debounced mutation
- Voortgangsbalk "Stap X van 7" + percentage
- Statusbadges: Concept (grijs) / Wacht op klant (oranje) / Ondertekend (groen) / Afgekeurd (rood)

### Klantportaal-integratie
- In bestaande `/offerte/:token` portaal-stijl een nieuwe publieke route `/oplevering/:token`
- Toont PDF-iframe + 2 tabs: "Akkoord en ondertekenen" / "Ik heb vragen" (laatste opent mailto installateur)
- Na onderteken: bedankpagina + download link (signed URL 1 uur)
- Voor ingelogde consumenten: rapport zichtbaar in klantportaal-dossier

### Audit & compliance
- Elke statuswijziging, download, deelactie → `opleverrapport_audit`
- IP-adres uit Edge Function request headers
- Bewaartermijn: geen automatische cleanup (10 jaar minimum)

### Memory
Toevoegen aan `mem://index.md`:
- `oplever/nen1010-module` — NEN 1010 opleverrapport wizard, tokenondertekening, hash-archief

### Bestanden-overzicht

| Bestand | Actie |
|---|---|
| `supabase/migrations/...nen1010.sql` | nieuw — tabellen, RLS, bucket, numbering |
| `src/pages/Opleveringen.tsx` | nieuw — overzicht |
| `src/pages/OpleverNieuw.tsx` | nieuw — wizard host |
| `src/pages/OpleverDetail.tsx` | nieuw |
| `src/pages/OpleverKlantOndertekenen.tsx` | nieuw — publieke route |
| `src/components/oplever/*` | nieuw — wizard steps + helpers (zie boven) |
| `src/components/oplever/OpleverRapportPDF.tsx` | nieuw — A4 layout |
| `src/lib/renderOpleverPdf.ts` | nieuw — headless render + hash |
| `src/components/AppSidebar.tsx` | edit — menu-item "Opleveringen" |
| `src/App.tsx` | edit — routes registreren |
| `supabase/functions/oplever-public-view/index.ts` | nieuw |
| `supabase/functions/oplever-klant-ondertekenen/index.ts` | nieuw |
| `supabase/functions/oplever-verzend-klant/index.ts` | nieuw |
| `mem://index.md` + `mem://oplever/nen1010-module` | update + nieuw |

### Bevestigingsvragen vóór implementatie
Geen — alle keuzes volgen bestaande platform-patronen (multi-tenant RLS, security definer functies, client-side PDF, tokenportaal zoals offerte). Bij twijfel pak ik bestaande conventies.

