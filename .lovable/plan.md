# Belsessie + Pijplijn opwaardering

## 1. Belsessie — queue logica fix

**Probleem:** Leads met status `terugbel_gepland` blijven in de queue staan, ook als de terugbel-afspraak maanden in de toekomst ligt. Oorzaak: `belQueue`-filter (`AffiliateBellen.tsx`) zet leads op basis van status in de queue, niet alleen op due-afspraak.

**Fix in `src/pages/affiliate/AffiliateBellen.tsx`:**
- Strikte regel: een lead is alleen in de queue als
  - `dueLeadIds` bevat de lead (terugbel- of opvolg-taak met `geplande_op/due_op <= einde vandaag`), OF
  - status ∈ {`nieuw`, `nieuw_campagne`, `nieuw_demo_voltooid`, `gebeld_geen_gehoor`, `mail_gestuurd`} EN (`volgende_actie_datum` is null OF `volgende_actie_datum <= einde vandaag`) EN er bestaat **geen** open toekomstige terugbel-afspraak voor deze lead.
- `terugbel_gepland` wordt expliciet alleen via due-afspraak getoond, nooit via status alleen.
- Helper `heeftToekomstigeAfspraak(leadId)` op basis van `terugbelAfspraken`.

## 2. Handmatige gesprekstimer

**`AffiliateBellen.tsx`:**
- `seconden` blijft, maar interval start niet automatisch.
- Nieuwe state `timerLoopt`. Knoppen Start/Pauze/Reset naast de timer (vervangt huidige automatische teller).
- Bij wissel van lead: timer reset naar 0, status pauze.
- Bij uitkomst-knop: `seconden` wordt altijd meegelogd in `useLogContactmoment` (gebeurt al), zelfs als 0.

## 3. AI-briefing in Belsessie

**Nieuwe Edge Function `affiliate-bel-briefing`:**
- Input: `lead_id`.
- Server-side: haal lead + laatste 10 contactmomenten + bedrijf-samenvatting op.
- Gemini 2.5 Flash via Lovable AI Gateway → JSON met `{ samenvatting, gesprekspunten[], mogelijke_bezwaren[], usps[], aanbevolen_volgende_actie }`.

**Nieuwe component `BriefingKaart.tsx`** in `src/components/affiliate/Belsessie/`:
- Knop "Genereer briefing" bovenin de Gesprek-tab.
- Toont 5 secties (samenvatting + lijstjes).
- Resultaat wordt gecached in TanStack Query (`["bel-briefing", leadId]`).

## 4. Belsessie info-verrijking

**Statusbadge op leadkaart** in Belsessie (boven bedrijfsnaam): kleur + label volgens nieuwe pipeline-config (zie §5). Vervangt impliciete status.

**`current.notities`** wordt ook bovenaan de Gesprek-tab samengevat (niet alleen in Bedrijf-tab).

## 5. Affiliate-pijplijn configureerbaar maken

**Nieuwe tabel `affiliate_pipeline_config`** (per partner):
- `partner_id`, `status_key` (matcht `affiliate_leads.status`), `label`, `kleur` (token uit `PIPELINE_KLEUREN`), `volgorde`, `zichtbaar`, `is_systeem` (bool).
- Seed per partner met huidige statussen + de nieuwe drie:
  - `nieuw` → "Nieuw - Koude leads" (slate)
  - `nieuw_campagne` → "Nieuw - Campagne" (blue)
  - `nieuw_demo_voltooid` → "Nieuw - Demo voltooid" (emerald)
  - `gebeld_geen_gehoor` (amber), `mail_gestuurd` (cyan), `terugbel_gepland` (violet), `demo_gepland` (fuchsia), `voorstel_verstuurd` (orange), `gewonnen` (emerald), `verloren` (rose).
- RLS: lezen voor leden van de partner; muteren voor `partner_admin` + `sales_manager` + `superadmin`.
- Migratie voegt enum-waarden `nieuw_campagne` en `nieuw_demo_voltooid` toe aan de bestaande affiliate-status (of via tekstkolom).

**Auto-regels (DB-trigger / hook in `useUpdateAffiliateLead`):**
- Bij aanmaak met `bron_type='campagne'` → status = `nieuw_campagne` (alleen als nog `nieuw`).
- Bij afronden demo-afspraak in `affiliate_terugbel_afspraken` (type=demo, afgehandeld_op gezet) → status = `nieuw_demo_voltooid` (alleen als status nog niet verder is).
- Beide via trigger op respectievelijk INSERT/UPDATE — handmatige override blijft mogelijk.

**Nieuwe pagina `src/pages/affiliate/instellingen/Pijplijn/index.tsx`:**
- Tabel met fases (sleep volgorde, label inline edit, kleurkiezer uit `PIPELINE_KLEUREN`, zichtbaar-toggle).
- Geen verwijder-actie voor `is_systeem=true` (alleen kleur/label/volgorde).
- Hergebruikt `kleurClasses` uit `src/lib/sales/pipeline.ts`.
- Route in `App.tsx` onder `/affiliate/instellingen/pijplijn` (rol: `affiliate`, `partner_admin`, `sales_manager`, `superadmin`).

**Hook `useAffiliatePipelineConfig`** met `useFases`, `useUpsertFase`, `useHerorden`.

## 6. Kleuren in Pijplijn-kolomkoppen

In `src/pages/affiliate/AffiliatePipeline.tsx`:
- Vervang de blauwe punt door `kleurClasses(fase.kleur)` (volle dot + tekst).
- Zet ook de statuslabel/-naam ernaast (zelfde kleur).
- LeadKaart in pijplijn krijgt linkerrand-streep in de fase-kleur.

## Technische details

**Bestanden gewijzigd/nieuw:**

Belsessie (frontend):
- `src/pages/affiliate/AffiliateBellen.tsx` — queue-filter, statusbadge, briefing-mount.
- `src/components/affiliate/Belsessie/Timer.tsx` (nieuw, ≤80 regels).
- `src/components/affiliate/Belsessie/BriefingKaart.tsx` (nieuw).
- `src/hooks/affiliate/useBelBriefing.ts` (nieuw).

Pijplijn-config:
- Migratie: enum extend + `affiliate_pipeline_config` met GRANT/RLS/policies, seed-functie per partner, 2 triggers (campagne / demo voltooid).
- `src/hooks/affiliate/useAffiliatePipelineConfig.ts` (nieuw).
- `src/lib/affiliate/pipelineKleur.ts` (nieuw, re-export van `kleurClasses` + status→fase mapper).
- `src/pages/affiliate/instellingen/Pijplijn/index.tsx` + `FaseRij.tsx` (nieuw, ≤200 regels totaal, hergebruik shadcn).
- `src/pages/affiliate/AffiliatePipeline.tsx` — fase-kleuren in koppen + kaartrand.
- `src/App.tsx` — route + sidebar link.

Edge function:
- `supabase/functions/affiliate-bel-briefing/index.ts` — Gemini 2.5 Flash, JSON-output via `Output.object`.

**Buiten scope:** Geen wijzigingen aan sales-CRM `pipeline_configuraties`, geen UI-wijzigingen in mailtemplates, leads-detail of agenda.

## Stappen
1. Migratie (enum, tabel, seed-functie, triggers, RLS+GRANT).
2. Hooks (`useAffiliatePipelineConfig`, `useBelBriefing`).
3. Edge function `affiliate-bel-briefing` + deploy.
4. Belsessie-fix: queue-filter + Timer-component + BriefingKaart + statusbadge.
5. Instellingen-pagina pijplijn + route + sidebar.
6. Kleur in `AffiliatePipeline` koppen + kaartranden.
7. Smoke test: nieuwe terugbel over 6 maanden → lead verdwijnt; campagne-lead → juiste status; demo afgehandeld → status update; instellingenpagina kleurwijziging zichtbaar in Pipeline.
