# Mail-flow bij plannen vanuit Sales & Affiliate

## Wat ik bouw

1. **Afzender-formaat** wordt overal `"Voornaam Achternaam | mijnhuis.nu" <emailadres>`.
2. **Eén review-dialog met twee tabs** (Klant + Collega) verschijnt direct na het plannen van een demo, terugbel of trial. Per tab: aan/uit-checkbox, template-selector, onderwerp, WYSIWYG-body, en live preview. Eén knop "Verzenden" stuurt beide actieve tabs.
3. **Placeholders worden altijd server- én client-side gevuld** vanuit context (lead, affiliate, collega, planner, datum/tijd, partner). Nooit meer letterlijke `{{lead.voornaam}}` of `{{affiliate.telefoon}}` in een verzonden mail.
4. **Default-template per actie** is instelbaar (Instellingen → Mailtemplates). De dialog selecteert automatisch de juiste template, maar gebruiker kan altijd wisselen.

## Flow voorbeeld (Bas plant demo voor Esteban's lead)

```text
[Plannen] → afspraak opgeslagen
        → mail-review-dialog opent
          ┌──────────────────────────────┐
          │ Tabs:  [ Klant ] [ Collega ] │
          ├──────────────────────────────┤
          │ ☑ Mail versturen              │
          │ Template:  [demo-bevestiging▾]│
          │ Aan:       klant@x.nl         │
          │ Onderwerp: Demo op 28 juni... │
          │ Body:      [WYSIWYG, ingevuld]│
          │ Preview:   [iframe rendering] │
          └──────────────────────────────┘
        → [Verzenden] verstuurt 0/1/2 mails
```

## Plaatsen waar de dialog opent

- `TerugbelDialog` (terugbel + demo, vanuit Sales en Affiliate)
- `PlanAfspraakDialog` (Sales-agenda)
- `useStartTrialVoorLead` (trial activeren) — alleen klant-mail, geen collega-tab

## Technische details

### Afzender
- Centrale helper `formatFromAddress(user, emailAdres)` → `"Bas Jansen | mijnhuis.nu" <bas@mijnhuis.nu>`.
- Toegepast in `user-email-send.ts`, `email-api-send`, en `smtp-send.ts` (RFC2822 From-header met escaping van quotes).

### Placeholder-engine
- Nieuwe gedeelde util `src/lib/email/fillPlaceholders.ts` + `supabase/functions/_shared/fill-placeholders.ts`.
- Context-object bevat genest: `lead.*`, `affiliate.*`, `collega.*`, `planner.*`, `afspraak.*` (datum, tijd, type, duur), `partner.*`.
- Onbekende of lege placeholders worden vervangen door een vaste fallback (`—`) en gerapporteerd zodat we ze logischerwijs vullen vanuit DB.
- Edge function `fill-template-context` haalt lead/affiliate/collega op via service role en geeft volledige context terug — wordt door de dialog aangeroepen voor de preview.

### Review-dialog
- Nieuwe component `src/components/email/MailReviewDialog.tsx` (gebruikt bestaande `MailWysiwyg` + iframe preview).
- Props: `tabs: { klant?: TabConfig; collega?: TabConfig }`, `context`, `defaultTemplateKey`, `onSent`.
- Verzending via bestaande `affiliate-template-test-send`-stijl → nieuwe edge function `send-planning-email` die zowel klant- als collega-pad afhandelt (logt in `email_log` + `email_berichten`).

### Template-default per actie
- Nieuw veld op `affiliate_email_templates`: `actie_default` (enum: `demo_klant`, `demo_collega`, `terugbel_klant`, `terugbel_collega`, `trial_klant`, of null).
- Migratie + GRANT + RLS-policy uitbreiding.
- UI: dropdown op elke template-kaart in `pages/affiliate/instellingen/Mailtemplates`.
- De dialog kiest automatisch de template waarvan `actie_default` matcht.

### Bestanden (nieuw)
- `src/components/email/MailReviewDialog/index.tsx` + sub-componenten (Header, KlantTab, CollegaTab, PreviewPane) — gesplitst om < 800 regels per bestand te blijven.
- `src/lib/email/fillPlaceholders.ts`
- `src/hooks/email/usePlanningMail.ts`
- `supabase/functions/_shared/fill-placeholders.ts`
- `supabase/functions/fill-template-context/index.ts`
- `supabase/functions/send-planning-email/index.ts`
- Migratie `…_planning_mail_defaults.sql`

### Bestanden (aangepast)
- `supabase/functions/_shared/user-email-send.ts` — gebruik `formatFromAddress`
- `supabase/functions/email-api-send/index.ts` — idem
- `supabase/functions/_shared/smtp-send.ts` — idem
- `src/components/affiliate/TerugbelDialog.tsx` — open review-dialog na opslaan
- `src/pages/sales/SalesAgenda/PlanAfspraakDialog.tsx` — idem
- `src/hooks/affiliate/useStartTrialVoorLead.ts` — open klant-only variant
- `src/pages/affiliate/instellingen/Mailtemplates/TemplateKaart.tsx` — `actie_default` selector

## Wat ik bewust NIET doe in deze ronde

- Geen wijziging aan transactionele e-mail (offerte/factuur) sjablonen — daar is afzender al correct.
- Geen wijziging aan auth-email templates.
- Geen bulk-rewrite van bestaande templates; ik laat ze staan zoals ze zijn, het is aan jou om ze te markeren als default per actie.

Klaar om door te bouwen?