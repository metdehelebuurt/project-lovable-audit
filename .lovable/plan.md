## Doel

Superadmin krijgt knoppen om bestaande gebruikers tot **affiliate** te promoveren (of weer te degraderen) en het affiliate-portaal wordt uitgebouwd tot een volwaardig sales-CRM met eigen pipeline, klantbeheer, trial-opvolging en koude-leads belmodule.

## Wat er nu al staat

- Rol `affiliate` bestaat, navigatie + pagina `/affiliates` (links, kortingscodes, eigen offertes, referrals).
- `/affiliate-beheer` (superadmin) kan affiliates aanmaken, codes beheren, instellingen zetten.
- Tabellen: `affiliate_links`, `affiliate_referrals`, `affiliate_instellingen`, `affiliate_commissies`, `kortingscodes`.
- Edge function `user-management` voor user-aanmaak.

## Wat ontbreekt en wordt toegevoegd

### 1. Promoveren bestaande gebruikers naar affiliate (superadmin)
- Knop **"Maak affiliate"** in `Gebruikers` lijst en `GebruikerDetail` (alleen superadmin) — wijzigt `users.rol` naar `affiliate`, ontkoppelt `partner_id`, seedt een default `affiliate_link` (slug op basis van naam) en stuurt welkomstmail.
- Knop **"Affiliate-rol intrekken"** om terug te draaien (kiest fallback-rol, behoudt historie van referrals/commissies).
- Wordt afgehandeld door uitbreiding van `user-management` edge function met `promote_to_affiliate` en `revoke_affiliate` acties (service-role, audit-log).

### 2. Affiliate Sales CRM — nieuwe tabel `affiliate_leads`
Aparte koude-leads-pool, los van het normale `leads`-systeem (dat is partner-scoped).
Velden: bedrijfsnaam, contactpersoon, email, telefoon, branche, regio, status (`nieuw`, `gebeld_geen_gehoor`, `gesprek_gepland`, `in_gesprek`, `voorstel_verstuurd`, `gewonnen`, `verloren`), pipeline-fase, geschatte waarde, eigenaar (affiliate_id), bron (`platform_pool` / `eigen_import` / `referral_klik`), volgende_actie_datum, notities (rich text), gewonnen_partner_id.
- RLS: affiliate ziet alleen leads die aan hem zijn toegewezen of die nog in de "platform_pool" zitten en claim-baar zijn; superadmin ziet alles.
- Edge function `affiliate-lead-claim` om een pool-lead te claimen (atomic).

### 3. Affiliate Pipeline UI (`/affiliates/pipeline`)
Kanban-bord met de 7 statussen hierboven, drag-and-drop tussen kolommen (zoals bestaande leads-kanban). Quick-actions per kaart: bellen (`tel:`), e-mail, notitie toevoegen, status veranderen, omzetten naar referral wanneer "gewonnen".

### 4. Affiliate Bel-werkbank (`/affiliates/bellen`)
Focus-modus die één-voor-één koude leads presenteert die "nieuw" of "gebeld_geen_gehoor" zijn met `volgende_actie_datum <= vandaag`. Per lead: contactgegevens, vorige notities, snelle bel-knop, uitkomst-knoppen (geen gehoor / niet interessant / terugbellen / gesprek gepland). Auto-doorloop naar volgende lead. Mini-timer per gesprek.

### 5. Aangebrachte klanten — uitbreiding
- Tab "Mijn klanten" toont nu ook `partners` met `subscription.status`, MRR, laatste login.
- Aparte sectie **"Trials die hulp nodig hebben"**: partners met trial-status waar `laatste_login < 7 dagen geleden` of `aantal_leads === 0` na 5 dagen — affiliate kan deze proactief benaderen, met direct bel/mail knop en logveld.

### 6. Affiliate Dashboard rework (`/affiliates`)
Nieuwe topnavigatie met sub-tabs: **Dashboard, Pipeline, Bellen, Mijn klanten, Trials, Links & codes, Offertes, Commissies**.
Dashboard-tegels: open pipeline-waarde, deze maand gewonnen, te bellen vandaag, openstaande trials, MTD commissie.

### 7. Navigatie & rechten
- Sidebargroep "Sales" voor rol `affiliate`: Dashboard, Pipeline, Bellen, Klanten, Trials, Links, Offertes, Commissies.
- `permissions.ts`: helper `isAffiliate`, `canManageAffiliateLeads`.
- `ProtectedRoute` op de nieuwe routes met `allowedRoles=["affiliate","superadmin"]`.

### 8. Superadmin uitbreiding (`/affiliate-beheer`)
- Nieuwe tab "Koude leads-pool": superadmin/import-knop (CSV) om leads toe te voegen aan de gedeelde pool die affiliates kunnen claimen.
- Per affiliate kpi-rij: pipeline-waarde, win-rate, gesprekken deze week, omzet.

## Technische details

**Migratie (nieuwe tabel + helpers):**
```
affiliate_leads (id, bedrijfsnaam, contactpersoon, email, telefoon, branche, regio,
                 status, pipeline_fase, geschatte_waarde, eigenaar_id NULL,
                 bron, volgende_actie_datum, notities, gewonnen_partner_id,
                 created_at, updated_at, created_by)
affiliate_lead_contactmomenten (id, lead_id, affiliate_id, type, uitkomst, notitie, duur_seconden, created_at)
```
- GRANTs voor authenticated + service_role.
- RLS: SELECT door eigenaar of `eigenaar_id IS NULL`-pool door affiliates, full access superadmin.
- Trigger `updated_at`.

**Edge functions:**
- Uitbreiding `user-management` → `promote_to_affiliate` / `revoke_affiliate` (audit-log + welkomstmail).
- Nieuw: `affiliate-lead-claim` (transactional update `eigenaar_id = auth.uid()` where IS NULL).

**Frontend:**
- Nieuwe componenten onder `src/components/affiliate/`:
  - `pipeline/PipelineBoard.tsx`, `pipeline/PipelineCard.tsx`, `pipeline/useAffiliatePipeline.ts`
  - `bellen/BelWerkbank.tsx`, `bellen/useBelQueue.ts`
  - `klanten/TrialOpvolgingLijst.tsx`
  - `leads/AffiliateLeadDialog.tsx`
- Nieuwe pagina's `src/pages/affiliate/`: `Pipeline.tsx`, `Bellen.tsx`, `MijnKlanten.tsx`, `Trials.tsx`.
- Hook `useAffiliateLeads.ts` met TanStack Query.
- `/affiliates` blijft als landing (dashboard) en krijgt subroutering via React Router nested routes.
- Promoot/intrek knop in `Gebruikers.tsx` rij-action en `GebruikerDetail.tsx` header.

**Bestandsdiscipline:** elke nieuwe component < 800 regels, helpers gesplitst per file conform projectregels. Geen `any` in nieuwe code.

## Volgorde van werken
1. DB-migratie (`affiliate_leads` + `affiliate_lead_contactmomenten` + RLS + GRANTs).
2. Edge functions uitbreiden / nieuw.
3. Hooks + types.
4. Pipeline, Bellen, Klanten, Trials pagina's + routing + sidebar.
5. Promoot-knoppen in gebruikersbeheer + superadmin pool-tab.
6. Dashboard rework.

## Vragen aan jou voordat ik begin
1. **Koude leads-pool**: mag elke affiliate vrij leads claimen uit de gedeelde pool, of moet superadmin handmatig leads aan affiliates toewijzen?
2. **Demo data**: wil je dat ik een paar voorbeeld-koude-leads seed zodat het bel-CRM direct iets toont?
3. **Trials-criterium**: gebruik ik "geen login > 7 dagen" + "0 leads na 5 dagen" als signaal, of heb je een andere definitie van "trial die hulp nodig heeft"?
