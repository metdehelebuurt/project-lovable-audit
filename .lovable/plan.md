

# Plan — Volledige update Abonnementenbeheer

## Probleemanalyse

Bij scan gevonden:

1. **Modulelijst is verouderd** — `PlanConfigurator.tsx` heeft 14 hardcoded modules (mist `klanten`, `berichten`, `helpdesk`, `feedback`, alle 6 financieel-submodules, `leveranciers`). De centrale registry `src/lib/modules.ts` heeft ze wél maar wordt hier niet gebruikt → twee bronnen die uit elkaar lopen.
2. **Featurelijst is incompleet** — mist o.a. AI-functies (offerte-intro, datasheet-parser, foutcode-analyzer, helpdesk-troubleshooter), Solar API, e-mail OAuth-koppeling, klantportaal, realtime chat, multi-handtekening, video-uploads schouw, BTW-aangifte export, demo-data reset.
3. **Plannen in DB bevatten verouderde modulekeys** (`thuisbatterij`, `affiliates`) — deze bestaan niet in de registry.
4. **`FeatureGate` wordt nergens gebruikt** — `useSubscriptionLimits.canAccess()` / `hasFeature()` zijn dood. Beperkingen per plan worden niet afgedwongen op modules of features.
5. **`AppSidebar` filtert alleen op `useEffectieveModules` (rol-matrix)** — niet op abonnement-plan-modules. Een Starter-partner ziet dus toch Helpdesk/Financieel als zijn rol het mag.
6. **Console-warning** in `PlanConfigurator`: ref doorgegeven aan function-component (`DialogFooter`) → onschadelijke React-warning, los te lossen door wrap-fix.
7. **Geen koppeling abonnement ↔ effectieve modules** — `useEffectieveModules` houdt geen rekening met `abonnement_plannen.modules`.
8. **AbonnementOverzicht**: filtert geen `gepauzeerd`-status in dropdown. Geen filter op plan. Geen kolom voor add-ons.
9. **FactuurBeheer**: factuurnummer is willekeurig (`Math.random`) → kans op dubbels; geen partner-scoped jaarvolgnummer. Geen bulk-genereer-knop voor lopende abonnementen.
10. **RevenueAnalytics**: trial-conversie-formule klopt niet (telt actieve dubbel). Geen MoM-grafiek, geen omzet-per-add-on.
11. **KortingenAffiliates**: commissie-opslaan toont alleen toast — slaat niets op.

## Wat gaan we bouwen

### A. Centrale waarheidsbron voor modules & features

**`src/lib/abonnementFeatures.ts`** — nieuw, ≤ 120 regels:
- `ALL_PLAN_FEATURES`: complete lijst met `key`, `label`, `groep`, `beschrijving` voor ~28 features verdeeld over groepen:
  - **Basis**: leads, klanten, schouwen, offertes, opdrachten, planning
  - **Geavanceerd**: installaties, helpdesk, kennisbank, klantportaal, realtime-chat
  - **Financieel** (per submodule): verkoopfacturen, inkoopfacturen, pakbonnen, BTW-aangifte, openstaande posten, leveranciers
  - **Tools**: webtools-embeds, energieadvies-wizard, thuisbatterij-selector
  - **AI**: ai-offerte-intro, ai-datasheet-parser, ai-foutcode-analyzer, ai-helpdesk-troubleshooter, ai-lead-signals, ai-product-import, ai-feedback-categorize
  - **Integraties**: gmail-oauth, microsoft-oauth, solar-api, google-maps
  - **White-label**: eigen-branding, eigen-domein, witlabel-emails, api-toegang
- `MODULE_GROUPS` van de bestaande `MODULES`-registry hergebruikt in PlanConfigurator → één bron.

### B. PlanConfigurator opschonen & uitbreiden

`src/components/abonnementen/PlanConfigurator/` — refactor naar folder met sub-componenten (huidige 279 regels splitsen):
- `index.tsx` (≤ 200) — lijst + dialog-shell
- `PlanForm.tsx` (≤ 250) — formulier
- `ModuleSelector.tsx` (≤ 100) — checkbox-grid gegroepeerd per `groep` uit `MODULES`
- `FeatureSelector.tsx` (≤ 100) — checkbox-grid gegroepeerd per groep uit `ALL_PLAN_FEATURES`
- Toevoegen: kopieer-knop "Dupliceer plan", "Standaard reset" per groep, zoekveld in module/feature-lijst.
- Console-warning fixen door `DialogFooter` te vervangen door eigen `<div>` met flex (de warning komt door `forwardRef`-mismatch).

### C. Effectieve modules ook plan-gebonden maken

`src/lib/modules.ts` → `useEffectieveModules` uitbreiden:
```text
Effectief = (rol-default ∩ plan-modules) → daarna partner-rolmatrix → daarna user-override
```
Extra query: actieve `abonnementen + abonnement_plannen.modules` van eigen partner. Als plan een module níet bevat → blokkeren (override "deny" telt nog steeds). Superadmin-bypass blijft.

### D. FeatureGate activeren

- `FeatureGate` wrappen rond knoppen/secties van premium features (AI-knoppen, BTW-export, klantportaal-share, white-label tab, webtool-embed-knop).
- Lijst van ~10 strategische plekken waar gate komt — alleen UI-niveau, geen RLS (data-RLS blijft per partner).

### E. Migratie: bestaande plannen synchroniseren

`supabase/migrations/..._plan_modules_sync.sql`:
- `UPDATE abonnement_plannen` → vervang verouderde keys (`affiliates` → `affiliate_beheer`, `thuisbatterij` → blijft als feature, niet module).
- Vul Starter / Professional / Enterprise opnieuw met juiste module-keys uit registry + bijbehorende features.
- Geen schema-wijziging nodig (kolommen bestaan).

### F. AbonnementOverzicht uitbreiden

- Extra filter: per plan (dropdown gevuld uit `abonnement_plannen`).
- Extra kolom "Add-ons" met badge-aantal.
- Status `gepauzeerd` toevoegen aan filter.
- Detail-link: rij klikbaar → opent grote sheet met volledige historie uit `abonnement_wijzigingen` voor die partner.

### G. FactuurBeheer veiliger maken

- Vervang `Math.random` door SQL-helper `generate_abonnement_factuurnummer(partner_id)` analoog aan bestaande `generate_financieel_documentnummer` — formaat `AB-YYYY-0001` per jaar globaal.
- Knop **"Genereer maandfacturen"**: vraagt periode (default: vorige maand), maakt voor elk actief abonnement een concept-factuur incl. add-on-totalen + korting.
- BTW-percentage-veld toevoegen (default 21).

### H. RevenueAnalytics fixen

- Correcte trial-conversie: tel partners met ooit `trial`-status én nu `actief` / totaal ooit `trial`.
- Extra KPI: ARR-add-ons, gemiddelde MRR per partner.
- Mini-grafiek MoM (laatste 6 maanden) via `recharts` (al aanwezig in stack via shadcn `chart.tsx`).

### I. KortingenAffiliates afmaken

- `saveCommissie()` slaat werkelijk op in `affiliate_referrals.commissie_percentage` (kolom check + migratie indien missend).
- Knop "Nieuwe kortingscode" toevoegen — dialog → insert in `kortingscodes`.

### J. Self-service: PartnerAbonnement

- Tonen welke modules/features zijn vergrendeld in huidig plan met "Upgrade om te ontgrendelen"-CTA per item.
- Vergelijkingsmatrix in upgrade-dialog: tabel modules × plannen i.p.v. losse cards.

## Bestanden

| Bestand | Actie |
|---|---|
| `src/lib/abonnementFeatures.ts` | **Nieuw** — feature-registry |
| `src/lib/modules.ts` | Uitbreiden: plan-module-cascade in `useEffectieveModules` |
| `src/components/abonnementen/PlanConfigurator/index.tsx` | **Nieuw** — splitst huidige bestand |
| `src/components/abonnementen/PlanConfigurator/PlanForm.tsx` | **Nieuw** |
| `src/components/abonnementen/PlanConfigurator/ModuleSelector.tsx` | **Nieuw** |
| `src/components/abonnementen/PlanConfigurator/FeatureSelector.tsx` | **Nieuw** |
| `src/components/abonnementen/PlanConfigurator.tsx` | **Verwijderen** (vervangen door folder) |
| `src/components/abonnementen/AbonnementOverzicht.tsx` | Filter per plan, addon-kolom, klikbare rij |
| `src/components/abonnementen/FactuurBeheer.tsx` | Veilige nummering, bulk-genereer, BTW-veld |
| `src/components/abonnementen/RevenueAnalytics.tsx` | Conversie-fix, MoM-chart, addon-KPI |
| `src/components/abonnementen/KortingenAffiliates.tsx` | Commissie opslaan, kortingscode aanmaken |
| `src/components/abonnementen/PartnerAbonnement.tsx` | Vergrendeld-overzicht + matrix-vergelijking |
| `src/components/abonnementen/FeatureGate.tsx` | Klein label-prop voor consistentere CTA |
| `supabase/migrations/..._plan_modules_sync.sql` | Plannen + factuurnummer-functie + evt. `commissie_percentage` |
| ~10 plekken in app | `<FeatureGate>` wrappen rond premium-knoppen |

## Niet wijzigen
- Bestaande RLS-policies op `abonnementen` / `facturen`
- `useSubscriptionLimits` API-vorm (alleen aanvullen, niet breken)
- Mollie / payment-flow (blijft uitgesteld)
- Rolbeheer (`module_rol_toegang` / `module_user_override`)

## Volgorde
1. `abonnementFeatures.ts` registry + migratie plannen sync
2. PlanConfigurator splitsen + nieuwe selectors gebruiken
3. `useEffectieveModules` plan-cascade
4. FeatureGate wrappen op premium-knoppen
5. AbonnementOverzicht / FactuurBeheer / RevenueAnalytics / KortingenAffiliates
6. PartnerAbonnement upgrade-matrix

## Resultaat
- Eén centrale registry voor modules én features — geen drift meer
- Partner-admins zien in self-service exact wat hun plan biedt en wat upgraden ontgrendelt
- Beperkingen per plan worden ook in UI afgedwongen (sidebar + premium-knoppen)
- Factuurnummers veilig en uniek; bulk-maandfacturen in één klik
- Revenue-dashboard met juiste conversie + MoM-trend
- Kortingscodes en affiliate-commissies daadwerkelijk opslaan en beheerbaar
- Console-warning weg

