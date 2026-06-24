# Actieve duplicaatdetectie — partners én affiliates

## Wat er al staat (voortbouwen, niet opnieuw bouwen)

Voor **partner-leads** (`leads`-tabel) is dit grotendeels al gebouwd:
- DB-view `v_lead_duplicaten` matcht op e-mail, telefoon (`normalize_phone`), en adres (postcode + huisnummer).
- Tabel `lead_duplicaat_negeerlijst` voor "geen duplicaat".
- Hooks: `useDuplicaten`, `useDuplicatenVoorLead`, `useNegeerDuplicaat`.
- UI: `DuplicatenBanner` (overzicht), `DuplicaatWaarschuwing` (per leaddetail), `DuplicatenLijstDialog`, `MergeDialog` (veld-voor-veld kiezen welke waarde behouden blijft).
- Gebruikt op `/leads`, `/leads/:id` en `Vandaag`.

Voor **affiliate-leads** (`affiliate_leads`) bestaat alleen detectie tijdens CSV-import (`useDedupeCheck` + `DedupeBevestigingDialog`) en in `ResultatenTabel` van de koude-leads-zoeker. Er is **geen** actieve detectie op bestaande records, geen banner, geen per-leadwaarschuwing, geen merge-flow.

Doel: dezelfde slimme, failsafe ervaring als bij partners, óók voor affiliates — met zoveel mogelijk hergebruik.

## Aanpak

### 1. Detectielaag voor affiliate-leads (DB)

Nieuwe SQL-objecten via migratie:

- `lead_duplicaat_negeerlijst_affiliate` (analoog aan partner-versie, gescopet op `eigenaar_id`/affiliate i.p.v. `partner_id`) met RLS + GRANTs.
- View `v_affiliate_lead_duplicaten` met dezelfde structuur (`lead_a_id`, `lead_b_id`, `match_redenen[]`, `score`), matcht op:
  - e-mail (lowercased + getrimd, niet leeg)
  - telefoon (`normalize_phone`)
  - website (genormaliseerd: lowercase, zonder protocol/`www.`/trailing slash) — affiliate-specifiek
  - bedrijfsnaam (genormaliseerd: lowercase, zonder rechtsvormen `bv|b.v.|nv|n.v.|vof`, leestekens en spaties weg) — affiliate-specifiek
  - adres (postcode + huisnummer) waar beschikbaar
- Scope per `eigenaar_id` (de affiliate die de lead bezit) zodat affiliates geen duplicaten van andermans leads zien. Negeerlijst respecteren in de view.
- Helperfuncties `normalize_website(text)` en `normalize_bedrijfsnaam(text)` als ze nog niet bestaan; hergebruiken van `normalize_phone` en `normalize_postcode`.

### 2. Gedeelde frontend-laag

Refactor zodat partner- en affiliate-duplicaten één gedeelde UI delen, met een dunne datalaag per context:

```text
src/components/leads/duplicaten/
  shared/
    DuplicatenBannerBase.tsx     # generiek, neemt data + handlers
    DuplicaatWaarschuwingBase.tsx
    DuplicatenLijstDialogBase.tsx
    MergeDialogBase/             # generieke veldlijst via config
    types.ts                     # generieke DuplicaatPaar<TLead>
  partner/
    useDuplicaten.ts             # bestaand, lichte refactor
    useNegeerDuplicaat.ts
    fields.ts                    # LEAD_FIELDS bestaand
  affiliate/
    useAffiliateDuplicaten.ts    # query v_affiliate_lead_duplicaten + affiliate_leads
    useNegeerAffiliateDuplicaat.ts
    useMergeAffiliateLeads.ts
    fields.ts                    # bedrijfsnaam, contactpersoon, email, telefoon, website, branche, regio, tags, notities, adres, ...
```

Componenten:
- `<DuplicatenBanner context="partner" />` en `<DuplicatenBanner context="affiliate" />` — zelfde look, andere data-bron.
- `<DuplicaatWaarschuwing leadId context />` op detailpagina's.
- Mergeflow: veld-voor-veld kiezen welke waarde behouden blijft (zoals bestaand), inclusief het automatisch verplaatsen van gerelateerde records (zie merge-strategie).

### 3. Merge-strategie voor affiliate-leads (failsafe)

Server-side via Edge Function `affiliate-lead-merge` (analoog aan bestaande partner-merge-aanpak): atomair in één RPC zodat half-werk niet kan blijven hangen. De function:

1. Valideert dat caller eigenaar is van beide leads (RLS-equivalent + expliciete check op `eigenaar_id`).
2. Past de gekozen velden toe op de "behouden" lead.
3. Verplaatst FK-relaties naar de behouden lead:
   - `affiliate_lead_contactmomenten`
   - `affiliate_opvolg_taken`, `affiliate_opvolg_log`
   - `affiliate_terugbel_afspraken`
   - `affiliate_onboarding_taken`
   - `affiliate_referrals`
   - `affiliate_commissies`
4. Verwijdert de andere lead pas ná succesvolle herkoppeling (cascade-veilig).
5. Schrijft `audit_log`-entry met beide id's, gekozen velden en gebruiker.

### 4. Failsafe-gedrag (overal)

- **Niet-blokkerend**: detectie blokkeert nooit invoer of import; het is altijd een **waarschuwing + keuze** ("Samenvoegen", "Open ander", "Geen duplicaat").
- **Negeerlijst is permanent** per paar — een paar dat ooit "geen duplicaat" is, blijft weg uit de view tot iemand 'm actief weer aanzet (superadmin/eigenaar via dialog "Genegeerde duplicaten").
- **Conservatieve normalisatie**: lege/te-korte waarden (telefoon < 7 cijfers, website zonder host, bedrijfsnaam < 3 chars) tellen niet als match → minder valse positieven.
- **Score-drempel**: in UI alleen tonen bij `score ≥ 1`, sorteren op score desc; bij score ≥ 2 (meerdere redenen) extra prominent ("zeer waarschijnlijk").
- **Idempotente merge**: bij netwerkretry geen dubbele uitvoering — function checkt of doel-lead nog bestaat en logt eerder gedaan werk.
- **Realtime refresh**: na merge/negeer wordt `react-query` cache geïnvalideerd voor `lead-duplicaten` én lijstpagina's.

### 5. Plaatsing in UI

- **Affiliate kanalen**: banner bovenaan `AffiliatePool`, `AffiliateMijnKlanten`, `AffiliateOpvolging` (zoals partner-banner op `/leads`).
- **AffiliateLeadDetail**: `<DuplicaatWaarschuwing>` direct onder de header.
- **Bij aanmaken/bewerken** van een affiliate-lead: bij `onBlur` van e-mail/telefoon/website een live check via dezelfde view (rij eruit halen vóór insert nog niet gebeurt is — alleen waarschuwing tonen, niet blokkeren). Hergebruik logica uit `ResultatenTabel`.
- **Partner-kant**: alleen lichte refactor om dezelfde componenten te delen; geen functionele wijziging zichtbaar voor gebruikers.

### 6. Wat we expliciet **niet** doen

- Geen automatisch samenvoegen zonder gebruikersbevestiging.
- Geen fuzzy/AI-matching in deze ronde (Levenshtein op namen e.d.) — start met deterministische normalisatie; AI-laag kan later bovenop.
- Geen cross-tenant detectie (partner ↔ affiliate). Strikt binnen scope.

## Technische details

- **Migraties**:
  1. `create_normalize_helpers_affiliate` — `normalize_website`, `normalize_bedrijfsnaam` (immutable, `STABLE`).
  2. `create_lead_duplicaat_negeerlijst_affiliate` — tabel + GRANTs + RLS (eigenaar mag eigen paren beheren, service_role alles).
  3. `create_v_affiliate_lead_duplicaten` — view met dezelfde shape als `v_lead_duplicaten` plus `eigenaar_id`.
- **Edge Function**: `affiliate-lead-merge` met Zod-validatie van payload `{ keepId, dropId, fields: Record<string,string> }`.
- **Hooks**: TanStack Query, geen `useEffect`-fetch; query keys `["affiliate-lead-duplicaten", eigenaarId]`.
- **Bestandsgroottes**: bestaande `MergeDialog/index.tsx` zal richting de 800-grens kruipen na generalisatie → splitsen in `MergeDialogBase/{Header,FieldList,Footer,useMergeForm}.tsx`.
- **Types**: `DuplicaatPaar<TLead>` generiek; affiliate-versie gebruikt `Pick<AffiliateLead, ...>` voor de "lite"-vorm.
- **Tests**: Vitest-unit voor normalize-helpers (input → genormaliseerd) en voor `useMergeForm` field-resolution; Playwright happy-path voor "banner → samenvoegen → één lead over".

## Opleverbare stappen

1. SQL-helpers + tabel + view voor affiliate (migratie).
2. Generieke shared UI-componenten extraheren uit huidige partner-componenten.
3. Affiliate hooks (`useAffiliateDuplicaten`, negeer, merge).
4. Edge Function `affiliate-lead-merge` + audit-log.
5. UI-inhaak op affiliate-pagina's (banner + per-lead waarschuwing + live-check bij invoer).
6. Tests + handmatige verificatie via Playwright op preview.
