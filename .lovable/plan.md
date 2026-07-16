## Doel

De module "Samengestelde producten" (assemblages) omvormen tot een slimme, categorie-gedreven configurator-basis. Startpunt: **thuisbatterij totaalpakket** (zoals SolarNRG). De data & API worden zo opgezet dat we later een frontend-configurator (op klantwebsite via API, en daarna als embeddable tool) hierop kunnen bouwen zonder herwerk.

## Kern-inzicht

Een "samengesteld product" wordt een **configurator-template** met:
- Een **producttype** (thuisbatterij, zonnepanelen-set, warmtepomp-set, laadpaal-set, …) → bepaalt welke keuzegroepen en dynamische velden verschijnen.
- **Configurator-attributen** op template-niveau (bv. fase: 1-fase / 3-fase; met/zonder noodstroom; met/zonder installatie).
- **Slots** (keuzegroepen) i.p.v. een platte componentenlijst. Elke slot heeft een **rol** (batterij-opslag, omvormer, backup-box, montagemateriaal, installatie, …), min/max aantal, verplicht/optioneel, en een filter op producten (categorie + rol + specs).
- **Compatibiliteitsregels** tussen slots (bv. inverter moet zelfde fase hebben als template; capaciteit-modules alleen bij matching inverter-serie).
- **Prijs**: som van gekozen opties + optionele installatie, met marge/opslag.

## Wijzigingen op productniveau (`producten`)

Nieuwe velden toevoegen:
- `product_rol` (enum, nullable): `batterij_module`, `omvormer`, `backup_box`, `ev_lader`, `zonnepaneel`, `optimizer`, `montage_materiaal`, `installatiedienst`, `accessoire`, `overig`. Vervangt niet `categorie` — is een fijnere sub-typering voor configurator-matching.
- `is_installatiedienst` (boolean, default false) — snelle filter voor slot "installatie".
- `configureerbaar_type` (text, nullable) op assemblages: `thuisbatterij_pakket` | `zonnepanelen_set` | `warmtepomp_set` | `laadpaal_set` | `custom`. Alleen ingevuld als `is_assemblage=true`.
- `template_attributen` (jsonb, default `{}`) op assemblages: normale attributen zoals `{fase:"1", noodstroom:true, incl_installatie:true}`.

## Nieuwe tabel: `product_assemblage_slots`

Definieert de keuzegroepen van een assemblage.

Kolommen (domein-specifiek):
- `assemblage_id` → `producten.id`
- `partner_id`
- `sleutel` (text, bv. `batterij_capaciteit`, `inverter`, `installatie`)
- `label` (text)
- `slot_type`: `single_select`, `multi_select`, `quantity_step` (bv. modules 1..n).
- `product_rol_filter` (text) — beperkt keuze tot producten met deze rol.
- `categorie_filter` (product_categorie, nullable)
- `spec_filter` (jsonb) — bv. `{fase:"{{template.fase}}"}` voor compatibiliteit.
- `min_aantal`, `max_aantal`, `default_aantal`
- `verplicht` (bool)
- `volgorde` (int)
- `helptekst` (text)

Bijbehorende tabel `product_assemblage_slot_opties` (optioneel, phase 2) voor curated keuzelijsten per slot — MVP: keuzes komen dynamisch uit `producten` op basis van filters.

RLS: partner-scoped, zelfde patroon als `product_componenten`. Nette GRANTs.

## Bestaande `product_componenten` blijft bestaan

Voor "vast samengestelde" bundels zonder keuzes (huidige gedrag). Slots zijn een uitbreiding — een assemblage kan óf vaste componenten hebben, óf slots, óf beide (basiscomponenten + keuzeslots).

## Backend / API (edge functions)

Nieuwe **`assemblage-config`** edge function, publiek leesbaar (voor website-embed, met `partner_id` in URL). Endpoints:
- `GET ?assemblage_id=...` → geeft template terug: attributen-schema, slots, standaardconfiguratie, en per slot de matchende producten (met prijzen, specs, afbeelding).
- `POST` `{assemblage_id, keuzes:{slot_sleutel: [{product_id, aantal}]}, template_attributen:{...}}` → valideert compatibiliteit + berekent prijs + retourneert samenvatting (regels, totalen, waarschuwingen).

Deze function wordt de contract-basis voor:
1. Interne UI (nieuwe assemblage-editor).
2. Klantwebsite (server-to-server call).
3. Later: embeddable widget (via bestaande `web_widgets`-patroon).

## UI-wijzigingen

### 1. Assemblages-overzicht (`src/pages/Assemblages.tsx`)
- Filter/badge op `configureerbaar_type`.
- Kolom "Type" toevoegen.

### 2. Nieuwe wizard: `AssemblageWizard` (vervangt `/producten/assemblages/nieuw`)
- **Stap 1: kies type** (thuisbatterij, zonnepanelen-set, warmtepomp-set, laadpaal-set, custom).
- **Stap 2: template-attributen** (dynamisch per type; voor thuisbatterij: fase, met/zonder noodstroom, incl. installatie).
- **Stap 3: slots inrichten** — voorgevulde slot-templates per type (bv. thuisbatterij: `batterij_module` (1..n), `omvormer` (1), `backup_box` (0..1), `installatie` (0..1)). Per slot: filter, min/max, verplicht.
- **Stap 4: prijsstrategie & marketing** (naam, marge, publicatie op website).
- **Stap 5: preview** — toont exact wat de website-configurator laat zien.

### 3. Productformulier (`ProductInlineForm`)
- Toevoegen: `product_rol` dropdown, `is_installatiedienst` switch.
- Voor rol `batterij_module`/`omvormer`: promot bestaande `fase`-spec zichtbaar in de kop.

### 4. Voorbereiding embed (alleen data-laag, geen UI in deze fase)
- Nieuwe hook `useAssemblageConfigurator(assemblageId)` die de edge function aanroept — kan direct hergebruikt worden voor de latere frontend-website.

## Type-templates (in code, `src/lib/assemblage/typeTemplates.ts`)

Per `configureerbaar_type` een default `template_attributen` schema + default slots. Startset:
- `thuisbatterij_pakket`: attributen `{fase, noodstroom, incl_installatie}`; slots `batterij_module`, `omvormer`, `backup_box?`, `installatie?`.
- `zonnepanelen_set`: attributen `{aantal_panelen, dakvorm}`; slots `paneel`, `omvormer`, `optimizer?`, `montagemateriaal`, `installatie?`.
- `warmtepomp_set` & `laadpaal_set`: minimale stub — uitwerken zodra gebruikt.

## Volgorde van uitvoer

1. **Migratie** (schema + rol-enum + slots-tabel + GRANTs + RLS).
2. **Type-templates + hook** in code.
3. **Wizard-UI** + productform-uitbreiding.
4. **Edge function `assemblage-config`** met validatie & prijsberekening.
5. **Documentatie** van API-contract (README-snippet) t.b.v. website-integratie.
6. **Later (buiten deze plan-scope)**: frontend-website configurator + embeddable widget.

## Compatibiliteit met bestaande data

- Bestaande assemblages krijgen `configureerbaar_type = 'custom'`; blijven werken zoals nu (vaste componentenlijst).
- Bestaande `product_componenten` wordt niet aangeraakt.
- Voorraad-/kostprijsberekening in `useAssemblages` blijft leidend voor "vast" bundels; voor configureerbare bundels wordt de prijs pas bekend na configuratie.

## Vraag ter bevestiging

Twee keuzes wil ik bevestigd hebben voordat ik bouw:

1. **Scope nu**: alleen `thuisbatterij_pakket` volledig uitwerken (incl. voorbeeld-slots + API + wizard-stappen), en de rest als stubs? Of meteen ook `zonnepanelen_set`?
2. **API-authenticatie**: mag `assemblage-config` publiek (anon) leesbaar zijn voor gepubliceerde/`toon_op_website`-assemblages, zoals `google-maps-config`/publieke catalogus doen?
