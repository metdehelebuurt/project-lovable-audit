# Sales CRM verbeteringen

Zes verbeteringen aan de sales-pipeline + trials-overzicht voor sales managers. Onderstaand plan houdt alle wijzigingen aan frontend/presentatie waar mogelijk; alleen voor "gedeelde aantekeningen" is een backend-wijziging (RLS) nodig.

## 1. Filters in de Sales Pipeline uitbreiden

Op `src/pages/sales/SalesPipeline/index.tsx` boven de kolommen een filterbalk toevoegen naast het bestaande TemperatuurFilter:

- **Periode**: dropdown "Alle" / "Vandaag" / "Deze week" / "Deze maand" / "Laatste 30 dagen" / "Dit kwartaal" — filtert op `updated_at`.
- **Bron**: dropdown (opgehaald uit `lead_bronnen` via bestaande `useLeadBronnen`).
- **Eigenaar / Sales**: dropdown met unieke `eigenaar_id` uit leads (naam via bestaande `useColleagues` / users lookup).
- **Zoek**: tekstveld op bedrijfsnaam / contactpersoon / e-mail.
- **Wissen**-knop verschijnt zodra >0 filters actief zijn.

Filters worden gecombineerd in de bestaande `gefilterd` useMemo. Filterstate lokaal (`useState`), geen URL-sync om scope klein te houden.

## 2. Warmtestatus verduidelijken (één systeem)

Vandaag staan er twee signalen door elkaar: `temperatuur` (koud/lauw/warm/heet) uit `useSalesLeads` en het `LeadSignalBadge` (AI-koopsignaal). Aanpak:

- In `LeadKaart` de temperatuur prominent linksboven zetten met **icoon + label + kleur** (uit `TEMP_ICON`, `TEMP_COLOR` uit `src/lib/sales/temperatuur.ts`) i.p.v. losse badge onderaan.
- AI-signaal (`LeadSignalBadge`) blijft, maar krijgt subtitel "AI-signaal" en visueel duidelijk secundair (kleiner, outline).
- Legenda-tooltip op de kolomkop van de pipeline die uitlegt: "Kleur = warmte (handmatig/regels), sterretje = AI-koopsignaal".
- In `TemperatuurFilter` alle vier temperaturen consistent tonen met hetzelfde icoon dat op de kaart staat.

## 3. Trials-overzicht voor Sales Manager

Nieuw tabblad **"Trials"** in `src/pages/sales/index.tsx` naast de bestaande tabs. Nieuwe pagina `src/pages/sales/Trials/index.tsx` die de bestaande edge function `sales-manager-trials` aanroept (die geeft partners met `trial_einddatum` + gekoppelde affiliate terug).

Tabel/kaarten met kolommen:
- Bedrijfsnaam + plaats
- Contactpersoon + e-mail/telefoon
- Trial einddatum + "dagen resterend" badge (rood <3, oranje <7, groen anders)
- Status (`trial` / `verlopen` / `omgezet`)
- Affiliate die klant heeft aangebracht
- Actie: link naar partnerdetail

Filter bovenaan: "Actief" (default, einddatum ≥ vandaag) / "Verlopen (30d)" / "Alles".

## 4. Demo-klanten / nog-geen-trial zichtbaar

Uitbreiding van hetzelfde Trials-tabblad met een sectie **"Demo aangevraagd, nog geen trial"**: `affiliate_leads` met status `demo_gepland` of `demo_gedaan` waar géén gekoppelde partner-trial bestaat. Hierbij:

- Nieuwe hook `useSalesDemoZonderTrial` die `affiliate_leads` fetcht met die statussen en filtert op leads zonder actieve match in `affiliate_referrals` → partner met trial.
- Aparte tabel boven de trials-tabel: "Demo geweest, wacht op trial-start" met bedrijfsnaam, laatste contact, verantwoordelijke affiliate, en knop "Trial starten" (herbruikt bestaande `TrialStartenButton`).

## 5. Smartaccu upsell-signaal

Op de trials-tabel én in `LeadKaart` (pipeline) een badge **"Upsell: Smartaccu"** tonen wanneer bij de klant/lead upsell-add-ons beschikbaar zijn. `useLeadKlantstatus` levert al `upsell_addons`. Wanneer daar een addon met slug die "accu" / "smartaccu" bevat in zit → gele/violette badge "⚡ Upsell Smartaccu" met tooltip "Deze klant heeft nog geen Smartaccu-addon actief".

Voor de trials-tabel dezelfde controle per partner via bestaande abonnement-addon queries (of via een compacte RPC/list uit `abonnement_addon_aankopen` vs `abonnement_addons` waar slug matcht).

## 6. Gedeelde aantekeningen van actieve klanten

Vandaag zijn `klant_notities` per adviseur/partner afgeschermd. Sales manager moet mee kunnen lezen.

- Backend (migratie): extra RLS-policy op `klant_notities` — SELECT toegestaan wanneer `has_role(auth.uid(), 'sales_manager')` of `has_role(auth.uid(), 'superadmin')` of `has_role(auth.uid(),'sales_admin')`. Geen INSERT/UPDATE-rechten voor deze rollen (alleen lezen).
- Frontend: in `PartnerDetail` een nieuw tabblad/section "Aantekeningen" (read-only voor sales-rollen) dat `klant_notities` toont voor die partner (join via klant → partner). In het nieuwe Trials-tabblad krijgt elke rij een uitklap met de laatste 3 notities.

## Technische details

**Nieuwe bestanden**
- `src/pages/sales/Trials/index.tsx` — trials-tabblad
- `src/pages/sales/Trials/TrialsTabel.tsx`
- `src/pages/sales/Trials/DemoZonderTrialTabel.tsx`
- `src/hooks/sales/useSalesTrials.ts` — wrappt `sales-manager-trials` edge function + verrijkt met upsell-info
- `src/hooks/sales/useSalesDemoZonderTrial.ts`
- `src/components/sales/PipelineFilters.tsx` — filterbalk (periode, bron, eigenaar, zoek)
- `src/components/sales/UpsellBadge.tsx`
- `supabase/migrations/<ts>_klant_notities_sales_read.sql` — nieuwe SELECT policy

**Aangepaste bestanden**
- `src/pages/sales/SalesPipeline/index.tsx` — filters + verbeterde tempweergave
- `src/pages/sales/SalesPipeline/LeadKaart.tsx` — prominente temperatuur, upsell-badge
- `src/pages/sales/index.tsx` — nieuwe "Trials" tab
- `src/components/sales/TemperatuurFilter.tsx` — consistente iconen + legenda

**Backend-scope**: enkel de RLS-policy op `klant_notities`. Geen tabellen bijgemaakt. Sales manager & sales admin & superadmin krijgen read-only via `has_role`.

**Niet in scope**: URL-persistente filters, exports, notificaties bij bijna-verlopen trials — kan later toegevoegd worden.