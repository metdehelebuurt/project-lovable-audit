## Doel
Een affiliate ziet in zijn eigen instellingen één overzicht met álle e-mails die het platform namens hem naar leads/klanten kan sturen, kan ze customizen (onderwerp + body, variabelen, afzendernaam), preview-en en testen. Templates krijgen een strakke, professionele mijnhuis.nu-huisstijl en worden grondig functioneel getest.

## 1. Inventarisatie — welke e-mails verstuurt een affiliate?

Op basis van bestaande triggers + ontbrekende flows:

**Lead-fase**
1. `lead-welkom` — Nieuwe lead aangemaakt (intro affiliate stelt zich voor)
2. `lead-kennismaking-bevestiging` — Bevestiging na eerste telefonisch contact
3. `lead-info-pakket` — Algemene productinfo/brochure na gesprek

**Afspraken (al deels aanwezig: `affiliate-afspraak-klant`)**
4. `afspraak-bevestiging` — Afspraak ingepland (datum/tijd/locatie/Teams-link)
5. `afspraak-herinnering-24u` — 24u voor afspraak
6. `afspraak-herinnering-1u` — 1u voor (digitale) afspraak
7. `afspraak-gewijzigd` — Verzet
8. `afspraak-geannuleerd` — Geannuleerd
9. `afspraak-no-show-followup` — Klant niet verschenen

**Demo / Trial (al deels: `affiliate-trial-opvolging`)**
10. `demo-uitnodiging` — Demo-link + agenda
11. `demo-herinnering` — Dag van de demo
12. `demo-followup` — Na demo: samenvatting + CTA
13. `trial-gestart` — Trial-account klaar, inloggegevens
14. `trial-halverwege` — Tips + check-in
15. `trial-verloopt-binnenkort` — 3 dagen voor einde
16. `trial-verlopen` — Conversie-CTA

**Offerte / Commercieel**
17. `offerte-verstuurd` — Persoonlijke begeleidingsmail bij offerte
18. `offerte-herinnering` — Nog geen reactie
19. `offerte-laatste-herinnering` — Final nudge

**Opvolging / Nurture (al deels: `affiliate-opvolg-herinnering`)**
20. `terugbel-bevestiging` — Bevestiging terugbel-afspraak
21. `algemene-followup` — Generieke check-in
22. `lang-niet-gesproken` — 3/6 maanden re-engagement
23. `verloren-afscheid` — Vriendelijke afsluiter bij verloren lead

**Klant / Post-sale**
24. `welkom-als-klant` — Eerste mail als klant
25. `bedankt-voor-aanbeveling` — Referral bedanken

Totaal: 25 templates. Allemaal aanpasbaar door affiliate; vallen terug op platform-defaults.

## 2. Data-model

Nieuwe tabel `affiliate_email_templates`:
- `id`, `user_id` (affiliate-eigenaar), `partner_id`
- `template_key` (enum-string uit bovenstaande lijst)
- `onderwerp`, `body_html`, `afzender_naam`
- `actief` (boolean — anders fallback naar default)
- `updated_at`, `created_at`
- Unique (`user_id`, `template_key`)
- RLS: affiliate ziet/edit eigen rijen; superadmin alles

Default content komt uit een nieuwe registry `supabase/functions/_shared/affiliate-templates/registry.ts` met per `template_key`: `displayName`, `categorie`, `beschrijving`, `variabelen[]`, `defaultOnderwerp`, `defaultBodyHtml`, `previewData`.

## 3. Backend

- Migration: tabel + RLS + GRANT.
- Edge Function `affiliate-send-template`: input `{ template_key, lead_id?, klant_id?, extra_data? }`, haalt custom template óf default op, rendert variabelen, verstuurt via bestaande `sendUserEmail` (vanuit eigen postvak van affiliate), logt in `email_log`/`email_berichten`.
- Edge Function `affiliate-email-template-preview`: rendert template met `previewData` voor UI-preview (geen send).
- Refactor bestaande affiliate-mailtriggers (`affiliate-afspraak-notify`, `affiliate-opvolg-cron`) zodat ze via `affiliate-send-template` lopen met de juiste `template_key` → één pad, één override-mechanisme.
- Variabelen-systeem: hergebruik `_shared/render-template.ts` (`{{lead.voornaam}}`, `{{afspraak.datum_lang}}`, `{{affiliate.naam}}`, `{{affiliate.bedrijf}}`, `{{platform.url}}`, etc.).

## 4. UI — Instellingen affiliate

Nieuwe route `/affiliates/instellingen/mailtemplates`:

```text
┌─ E-mailtemplates ─────────────────────────────┐
│  [Categorie-tabs: Leads | Afspraken | Demo/   │
│   Trial | Offerte | Opvolging | Klant]        │
│                                               │
│  ┌─ Template-kaart ──────────────────────┐    │
│  │ ● Afspraak bevestiging                │    │
│  │   Verstuurd bij: nieuwe afspraak      │    │
│  │   Status: Aangepast / Standaard       │    │
│  │   [Bewerken] [Preview] [Test sturen]  │    │
│  └───────────────────────────────────────┘    │
│  ...                                          │
└───────────────────────────────────────────────┘
```

Editor-drawer:
- Onderwerp (input) + body (Tiptap rich text, zelfde stack als offertes)
- Variabelen-chips klikbaar invoegbaar
- Live preview-paneel (rendert met previewData)
- Knop "Test naar mij sturen" → verstuurt naar eigen e-mail
- Knop "Herstel standaard"
- Opslaan = upsert in `affiliate_email_templates`

Componenten (allemaal <800 regels, gesplitst):
- `pages/affiliate/instellingen/Mailtemplates/index.tsx`
- `pages/affiliate/instellingen/Mailtemplates/TemplateLijst.tsx`
- `pages/affiliate/instellingen/Mailtemplates/TemplateKaart.tsx`
- `pages/affiliate/instellingen/Mailtemplates/TemplateEditor.tsx`
- `pages/affiliate/instellingen/Mailtemplates/TemplatePreview.tsx`
- `pages/affiliate/instellingen/Mailtemplates/VariabelenPicker.tsx`
- `hooks/affiliate/useAffiliateEmailTemplates.ts` (TanStack Query)
- `hooks/affiliate/useSendTestTemplate.ts`

Menu-entry in `AffiliateSubnav.tsx` onder "Instellingen".

## 5. Huisstijl mijnhuis.nu

Hergebruik bestaande `wrapInMijnhuisTemplate` (paars `#6d28d9` → `#8b5cf6` gradient header, witte body, voet met disclaimer-link). Alle default-bodies herschreven:
- Strak, zakelijk, Nederlands, kort
- Geen emoji's, geen uitroeptekens
- CTA-button consistent: paarse pill, 14px, "Bekijk offerte" / "Plan demo in"
- Footer met afzender-naam + handtekening-blok
- AI-disclaimer waar van toepassing (memory-regel)

## 6. Testen (grondig en functioneel)

**Unit (Vitest)**
- `render-template`: variabele-substitutie, ontbrekende keys → leeg
- Template-registry: alle 25 keys hebben `defaultOnderwerp` + `defaultBodyHtml` + `previewData`
- Fallback-logica: geen custom row → default; `actief=false` → default

**Edge function tests**
- `affiliate-send-template`: ongeldige key → 400; geen mailbox gekoppeld → 400 met duidelijke melding; succesvolle send logt rij in `email_berichten` + `email_log`

**E2E (Playwright)**
- Login als affiliate → naar `/affiliates/instellingen/mailtemplates` → categorie wisselen → template openen → wijzigen → opslaan → preview update → test-mail versturen → toast "Test verzonden"
- Een trigger-flow simuleren (nieuwe afspraak aanmaken) en in `email_log` verifiëren dat de aangepaste template is gebruikt
- Reset-naar-default werkt
- RLS: andere affiliate ziet eigen rij niet (db-test via service-role check)

**Visuele check**
- Screenshot van gerenderde HTML per template via Playwright, handmatige review op huisstijl

## 7. Bestanden (overzicht)

**Nieuw**
- `supabase/migrations/<ts>_affiliate_email_templates.sql`
- `supabase/functions/_shared/affiliate-templates/registry.ts`
- `supabase/functions/_shared/affiliate-templates/defaults/*.ts` (25 default bodies)
- `supabase/functions/affiliate-send-template/index.ts`
- `supabase/functions/affiliate-email-template-preview/index.ts`
- `src/pages/affiliate/instellingen/Mailtemplates/` (6 bestanden)
- `src/hooks/affiliate/useAffiliateEmailTemplates.ts`
- `src/hooks/affiliate/useSendTestTemplate.ts`
- `tests/affiliate-mailtemplates.spec.ts`

**Edits**
- `src/components/affiliate/AffiliateSubnav.tsx` (menu-entry)
- `src/App.tsx` (route)
- `supabase/functions/affiliate-afspraak-notify/index.ts` (via send-template)
- `supabase/functions/affiliate-opvolg-cron/index.ts` (via send-template)
- `src/integrations/supabase/types.ts` (auto)

## Vragen voor jou
1. Akkoord met de 25 templates hierboven, of wil je nog categorieën toevoegen/schrappen (bv. WhatsApp-notificaties, SMS)?
2. Mag elke affiliate elk template aanpassen, of wil je dat een partner_admin er ook nog overheen kan met partner-defaults (3-laagse fallback: affiliate → partner → platform)?
3. Moet ik óók de bestaande affiliate triggers (`affiliate-afspraak-notify`, `affiliate-opvolg-cron`) meteen omzetten naar dit nieuwe pad, of pas in een volgende stap?
