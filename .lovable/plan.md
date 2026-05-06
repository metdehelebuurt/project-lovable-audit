# Thema 1 — E-mail UX + orderbevestiging-bug

Eerste van 11 thema's. Hierna keur je goed en ga ik door met thema 2 (klantportaal & berichten).

## Wat we oplossen

1. **Bug:** orderbevestiging vanuit verkooporder geeft foutmelding bij verzenden.
2. **BCC** ontbreekt op alle e-mailverzendingen (offerte, factuur, orderbevestiging).
3. **E-mailtemplates** zijn nu hardcoded in dialogs — partner kan ze niet beheren, en per verzending is er geen rich editor.
4. **Acceptatielink** wordt nu pas gegenereerd bij eerste portal-bezoek; moet al bij verzendmoment in de mail staan.

## Aanpak per onderdeel

### A. Orderbevestiging-bug — drie waarschijnlijke oorzaken in één klap

**Probleem 1 — PDF-render crasht stil op moderne CSS (oklch kleuren in Tailwind v3):** `html2canvas` faalt op `oklch()` color values, waardoor de PDF leeg wordt of een exception throwt. Oplossing: vervang `html2canvas` voor de orderbevestiging door dezelfde aanpak die offertes/facturen gebruiken (`renderFactuurPdf` / `pdfFromPages`) die al stabiel werkt. Eén gedeelde helper `renderOrderbevestigingPdf` toevoegen die de bewezen pipeline gebruikt.

**Probleem 2 — Geen e-mailaccount geconfigureerd geeft een onduidelijke 400:** voeg in de dialog een pre-check toe die direct na openen `email_accounts` + `partners.smtp_host` controleert. Als niets ingesteld → toon banner "E-mailconfiguratie nog niet ingesteld" met directe link naar Instellingen → E-mail, en disable de verzendknop. Geen mysterieuze 400 meer.

**Probleem 3 — Dialog-volgorde:** `OrderbevestigingEmailDialog` staat buiten de PDF-Dialog, dus als de PDF-modal sluit terwijl de mail open is, verdwijnt het PDF-element. Fix: PDF wordt vóór het openen van de email-dialog al gegenereerd en in storage geüpload (in een `useEffect` zodra de PDF-modal mount), zodat de email-dialog niet meer afhankelijk is van DOM-aanwezigheid.

### B. BCC overal toevoegen

Eén shared component `EmailComposerFields` (`src/components/email/EmailComposerFields.tsx`) met velden:
- Aan (verplicht)
- CC (optioneel, comma-separated)
- BCC (optioneel, comma-separated, met "BCC mij" snelknop)
- Onderwerp
- Bericht (Tiptap rich editor i.p.v. textarea)

Hergebruikt in:
- `OrderbevestigingEmailDialog`
- `FactuurEmailDialog`
- `OffertePdfEmailDialog` (en alle andere offerte-mailflows)

Edge functions (`send-orderbevestiging-email`, `send-factuur-email`, `send-offerte-email`) krijgen `cc[]` en `bcc[]` parameters en geven die door aan `sendPartnerEmail`. `partner-email-send.ts` + `email-send.ts` (Gmail / MS Graph / SMTP) ondersteunen al BCC via headers — alleen doorgeven.

### C. E-mailtemplates per partner + per-verzending overschrijven

**Nieuwe tabel `email_templates`** (per partner):
```text
id | partner_id | sleutel        | onderwerp | body_html | bijlage_default | updated_at
   |            | offerte_nieuw  |  ...      |  ...      | true            |
   |            | offerte_herinnering
   |            | factuur_nieuw
   |            | factuur_herinnering
   |            | orderbevestiging
   |            | oplevering_klaar
```
RLS: alleen lezen/schrijven binnen eigen partner_id (admin tier).

**Variabelen** met `{{handlebars}}` syntax (geen externe lib, simpele server+client replacer):
`{{klant.naam}}`, `{{klant.voornaam}}`, `{{partner.naam}}`, `{{partner.afzender}}`, `{{document.nummer}}`, `{{document.totaal}}`, `{{document.url}}`, `{{vandaag}}`.

**Beheerpagina** `/instellingen/emailtemplates`:
- Lijst met alle template-sleutels
- Per template: rich-text editor (Tiptap) + onderwerp + variabelen-helper-knoppen
- "Reset naar standaard" per template
- Live preview met sample data

**Per-verzending:** dialog laadt de partner-template als startwaarde, gebruiker kan onderwerp en body inline aanpassen (Tiptap). Variabelen worden client-side gerenderd zodat de preview meteen klopt. Bij verzenden gaat de finale gerenderde HTML mee (geen variabelen meer).

**Seed-defaults**: edge function `seed-email-templates` die op partner-creatie en eenmalig voor bestaande partners de standaard NL-templates aanmaakt (Dutch tone — zakelijk, kort, geen uitroeptekens, geen emoji's).

### D. Acceptatielink bij verzendmoment

Probleem: nu wordt `offerte_public_tokens` rij pas aangemaakt bij eerste GET op portal. Bij e-mailverzenden bestaat de link nog niet → mail bevat geen klikbare URL of een placeholder.

Fix in `send-offerte-email` (en de UI-dialog):
1. Vóór verzenden: check of er al een `public_token` is voor deze offerte. Zo niet → genereer en insert (zelfde logica als nu in `offerte-public-view`, maar nu pre-emptief).
2. Render de URL `https://<host>/offerte/<token>` in de body via `{{document.url}}`-variabele.
3. Default partner-template `offerte_nieuw` bevat een Tiptap-link "Bekijk en accepteer offerte" die naar `{{document.url}}` wijst.
4. Idem voor orderbevestiging (link naar `/opdracht/<token>` als die portal bestaat — anders een tracking-pixel weglaten en alleen PDF meesturen).

## Bestanden (nieuw / aangepast)

**Nieuw:**
- `src/components/email/EmailComposerFields.tsx` — shared To/Cc/Bcc/Subject/Body
- `src/components/email/EmailTemplatePicker.tsx` — dropdown om partner-template te laden
- `src/lib/email/renderTemplate.ts` — variabelen-replacer (client + edge shared via `_shared/render-template.ts`)
- `src/lib/email/emailTemplateKeys.ts` — enum van template-sleutels
- `src/pages/Instellingen/EmailTemplates.tsx` — beheerpagina
- `src/pages/Instellingen/EmailTemplates/TemplateEditor.tsx` — sub-component
- `src/lib/pdf/renderOrderbevestigingPdf.ts` — robuuste PDF-renderer (zelfde pipeline als facturen)
- `supabase/functions/_shared/render-template.ts` — server-side replacer
- `supabase/functions/seed-email-templates/index.ts` — seed defaults
- Migratie: `email_templates` tabel + RLS

**Aangepast:**
- `src/components/opdrachten/OrderbevestigingEmailDialog.tsx` — gebruikt EmailComposerFields, pre-check, template-loader
- `src/components/financieel/FactuurEmailDialog.tsx` — idem + BCC
- alle offerte-email dialogs — idem + BCC + acceptatielink
- `supabase/functions/send-orderbevestiging-email/index.ts` — cc/bcc, betere error messages, geen storage-cleanup race condition
- `supabase/functions/send-factuur-email/index.ts` — cc/bcc
- `supabase/functions/send-offerte-email/index.ts` — cc/bcc + pre-create acceptatie-token
- `supabase/functions/_shared/partner-email-send.ts` — cc/bcc support
- `supabase/functions/_shared/email-send.ts` — Gmail/MS/SMTP BCC headers
- `src/pages/OpdrachtDetail.tsx` — pre-render PDF naar storage zodra modal mount
- `src/pages/Instellingen.tsx` — nieuwe tab "E-mailtemplates"

## Database-wijzigingen

```text
table email_templates
  id uuid pk default gen_random_uuid()
  partner_id uuid fk → partners(id) on delete cascade
  sleutel text not null            -- 'offerte_nieuw' | 'factuur_nieuw' | ...
  onderwerp text not null
  body_html text not null
  bijlage_default boolean default true
  updated_at timestamptz default now()
  unique (partner_id, sleutel)

policy "partner kan eigen templates lezen" for select using (
  partner_id = get_user_partner_id(auth.uid())
)
policy "partner_admin/backoffice kan beheren" for all using (
  partner_id = get_user_partner_id(auth.uid()) and is_admin_tier(auth.uid())
)
```

## Wat NIET in deze loop

- Berichten consument→partner notificaties (= thema 2)
- Betalingstermijn factuur duidelijker (= thema 8)
- Multi-close van offertes bij keuze (= thema 5)
- PDF-editor naam beter (klein UI-tekstje, doe ik mee in thema 5 met de offerte-cluster)

## Risico's

- Tiptap-editor in dialog kan sluggish zijn met grote templates → lazy load.
- BCC via Gmail API werkt anders dan via SMTP (BCC moet in MIME headers, niet in `to`-array). Test alle 3 providers.
- Pre-rendering PDF kost extra storage IO → cleanup-job nodig (na 24u verwijderen uit `email-bijlagen` bucket).

## Klaar als

- [ ] Orderbevestiging verzenden werkt zonder foutmelding (alle 3 providers)
- [ ] BCC werkt op offerte/factuur/orderbevestiging mails
- [ ] Partner kan templates beheren in Instellingen → E-mailtemplates
- [ ] Bij elke verzend-dialog kan onderwerp + body live aangepast worden, met partner-template als basis
- [ ] Variabelen `{{klant.naam}}` etc. worden correct gerenderd in mail
- [ ] Acceptatielink staat in offerte-mail (klant kan direct klikken)
