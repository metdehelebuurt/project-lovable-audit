

# Plan: Digitale Offerte Fixes — Korting, Tabs UI & Logo-instellingen

## Problemen gevonden

### 1. Korting ontbreekt in digitale offerte
In `src/pages/OffertePublic.tsx`:
- De lokale `OfferteRegel` interface mist `korting_bedrag` en `korting_type`
- De subtotaal-berekening (regel 293) gebruikt alleen `korting_percentage`, niet `korting_bedrag`
- De weergave (regel 301) toont alleen percentage-korting, nooit bedragkorting
- De centrale `regelSubtotaal()` uit `src/types/offerte.ts` wordt niet gebruikt

**Fix:** Verwijder de lokale `OfferteRegel` interface en `formatCurrency`, importeer alles uit `src/types/offerte.ts`. Gebruik `regelSubtotaal()` voor berekeningen en toon beide kortingtypen.

### 2. Offerte-niveau korting ontbreekt
De offerte kan een `korting_totaal` hebben (offerte-brede korting). Dit wordt nu niet getoond in de totalen-sectie tussen subtotaal en BTW.

**Fix:** Als `offerte.korting_totaal > 0`, toon een extra regel "Korting" in de totalensectie.

### 3. Tabs UI niet duidelijk genoeg
De huidige TabsTrigger styling is subtiel: `rounded-lg gap-1.5 data-[state=active]:shadow-sm`. De actieve tab is nauwelijks te onderscheiden.

**Fix:** Actieve tab duidelijker maken met:
- Primaire kleur als achtergrond voor actieve tab
- Witte tekst op actieve tab
- Inactieve tabs duidelijker contrast
- Grotere padding voor betere touch targets

### 4. Logo donker/licht variant in instellingen
De donkere logo-upload bestaat al in de Huisstijl-tab. Maar de partner mist de mogelijkheid om te kiezen welke variant standaard wordt gebruikt (auto/licht/donker).

**Fix:** Voeg een "Logo-voorkeur" selector toe aan de Huisstijl-tab met opties: Auto (standaard), Altijd licht, Altijd donker. Sla op als `logo_variant_voorkeur` in de partners tabel.

### 5. Edge function mist `logo_url_donker`
De `offerte-public-view` edge function haalt `logo_url_donker` niet op uit de partners tabel, waardoor de publieke offerte geen donker logo kan tonen.

**Fix:** Voeg `logo_url_donker` toe aan de select query in de edge function.

---

## Technische details

### Bestanden

| Bestand | Wijziging |
|---|---|
| `src/pages/OffertePublic.tsx` | Import centrale types, fix kortinglogica, verbeter tabs UI |
| `supabase/functions/offerte-public-view/index.ts` | `logo_url_donker` toevoegen aan partner select |
| `src/pages/Instellingen.tsx` | Logo-variant selector toevoegen aan HuisstijlTab |

### Database
Geen migratie nodig — `logo_url_donker` bestaat al in partners tabel. De logo-variant voorkeur kan worden opgeslagen in het bestaande `feature_flags_json` veld van partners (JSON), zodat geen schema-wijziging nodig is.

### Bouwvolgorde
1. Edge function: `logo_url_donker` toevoegen
2. OffertePublic: kortinglogica + tabs UI fixen
3. Instellingen: logo-variant selector

