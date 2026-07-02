## Doel

Voor affiliates op elke lead direct zichtbaar maken:
1. **Is dit bedrijf al klant?** (bestaat er al een partner-account, wat is de status van dat abonnement?)
2. **Waar liggen upsell-kansen?** (welke betaalde add-ons of hoger plan mist deze partner nog?)

Zo weet de affiliate meteen of hij op nieuwe trial of op cross/upsell moet inzetten.

## Match-strategie (server-side)

Match tussen `affiliate_leads` en `partners` gebeurt in één security-definer functie `affiliate_lead_klantstatus(_lead_id)` met deze regels, in volgorde:

1. **Harde match**: `affiliate_leads.gewonnen_partner_id` gevuld → die partner.
2. **E-maildomein-match**: domein van `affiliate_leads.email` = domein van `partners.email` (kantoordomeinen als gmail/outlook uitsluiten).
3. **Bedrijfsnaam-match**: genormaliseerde `affiliate_leads.bedrijfsnaam` = genormaliseerde `partners.naam` (lowercase, strip B.V./V.O.F./interpunctie/spaties).

Genoeg voor v1. KVK slaan we later toe als `affiliate_leads.kvk` wordt toegevoegd.

## Wat de RPC teruggeeft

```text
status:             'geen_match' | 'trial' | 'betalend' | 'opgezegd' | 'verlopen'
match_reden:        'gewonnen_lead' | 'domein' | 'bedrijfsnaam'
partner_id, partner_naam, partner_plaats
plan_naam, plan_slug, maand_bedrag, trial_einddatum, opzeg_datum
huidige_addons:     [{ slug, naam }]
upsell_addons:      [{ slug, naam, maand_prijs, beschrijving }]  ← add-ons die deze partner nog niet heeft
upsell_plannen:     [{ slug, naam, maand_prijs }]                ← plannen met hogere volgorde dan huidig plan
```

Upsell-lijst wordt alleen gevuld bij status `trial` of `betalend` (bij opzegging/verloop is retentie de boodschap, niet upsell).

## UI-wijzigingen

### 1. Nieuwe kaart `KlantStatusKaart` in de lead-detail

Toegevoegd bovenaan `LeadDetailBody` (net onder `LeadDetailHero`, boven `LeadKlantStrip`) — alleen zichtbaar als er een match is of expliciet `geen_match`:

- **Header met status-badge**:
  - `Nieuw prospect` (grijs) — geen_match
  - `Trial actief` (violet) — trial
  - `Betalend klant` (emerald) — betalend
  - `Opgezegd` (rose) — opgezegd
  - `Verlopen` (amber) — verlopen
- **Body bij match**:
  - Partnernaam, plan, maandbedrag, trial-einddatum of opzegdatum
  - Regel "Match op: e-maildomein / bedrijfsnaam / eerder gewonnen"
  - **Upsell-blok**: chips per ontbrekende add-on met prijs, en (indien van toepassing) knop "Upgrade naar {plan}".
  - Call-to-action: `Trial starten` verbergen bij `betalend`/`trial` (voorkomt dubbele trials), vervangen door `Klantpagina openen`.
- **Body bij geen match**: één regel "Nog geen klant — starten met trial" + bestaande `TrialStartenButton`.

### 2. Badge op pipeline-kaart

`PipelineKaart` krijgt een compacte badge `Reeds klant` (emerald) of `Trial` (violet) via dezelfde RPC, opgehaald in batch met een lichte `useAffiliateKlantstatusBulk` hook — één call voor alle zichtbare leads.

### 3. Verstoppen `TrialStartenButton`

Onder aan de pipeline-kaart en in de hero-actiebalk verbergen we `Trial starten` als er al een actieve trial of betalend abonnement is (voorkomt dubbelboekingen).

## Technische wijzigingen

- **Migratie**: één security-definer functie `affiliate_lead_klantstatus(uuid)` + helper `normaliseer_bedrijfsnaam(text)` + batchvariant `affiliate_lead_klantstatus_bulk(uuid[])` voor pipeline-kaartjes. `GRANT EXECUTE ... TO authenticated`. Toegang wordt binnen de functie beperkt: alleen als de aanroeper eigenaar van de lead is of sales admin/superadmin.
- **Hooks**: `useLeadKlantstatus(leadId)` (detail) en `useAffiliateKlantstatusBulk(leadIds)` (pipeline).
- **Componenten**: `KlantStatusKaart.tsx` in `src/components/affiliate/LeadDetail/`, kleine aanpassingen aan `LeadDetailBody.tsx`, `PipelineKaart.tsx`, `LeadDetailHero`/`TrialStartenButton` conditie.
- Geen schemawijzigingen aan bestaande tabellen; puur additief.

## Uit scope (voor later)

- KVK-veld op leads.
- Automatisch omzetten van "reeds klant"-leads naar retention-flow.
- Cross-sell tussen partners in dezelfde regio.
