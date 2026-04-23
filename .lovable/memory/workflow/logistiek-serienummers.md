---
name: Logistiek & serienummers
description: Sprint 2 — opdracht_zendingen + product_serienummers tabellen, Levering-tab op verkooporder, serienummerregistratie in installatie/monteurview, Apparatuur-tab op klantkaart
type: feature
---
- `opdracht_zendingen`: per verkooporder vervoerder, trackingnummer, status (gepland/onderweg/geleverd), data, foto. Auto-tracking-URL voor PostNL/DHL/DPD/UPS/GLS via `buildTrackingUrl`.
- `product_serienummers`: SN per product met UNIEK index (partner+product+sn), gekoppeld aan opdracht/installatie/klant; status voorraad/geleverd/geinstalleerd/retour/defect; garantie_einddatum auto-berekend uit garantie_maanden.
- UI:
  - `OpdrachtLeveringTab` op verkooporder met dialoog, klant-mail-knop via `email-api-send`.
  - `SerienummerEditor` op InstallatieDetail (tab Serienummers) en MonteurView, met productsuggesties via `matchProductOpRegel`.
  - `SerienummerEditor` heeft een "Meerdere tegelijk"-dialog (textarea, één SN per regel of komma/puntkomma-gescheiden) die per regel `useUpsertSerienummer` aanroept; duplicaten worden overgeslagen.
  - `GeleverdeApparatuurLijst` als nieuwe tab "Apparatuur" op KlantDetail; toont garantiestatus.
- Multi-SN in opleverrapport: `BatterijSpec.serienummers?: string[]`, `OmvormerSpec.serienummers?: string[]`, `ExtraVelden.gateway_serienummers?: string[]` naast de oude single-string velden (legacy blijft leesbaar). UI-component `SerienummerLijstInput` (oplever) toont legacy-waarde als read-only chip met migratie-actie. `OpleverRapportPDF.formatSns(lijst, legacy)` toont alle SNs gecombineerd met komma's.
- RLS via partner_id volgens bestaand patroon.
