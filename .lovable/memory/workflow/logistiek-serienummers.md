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
  - `GeleverdeApparatuurLijst` als nieuwe tab "Apparatuur" op KlantDetail; toont garantiestatus.
- RLS via partner_id volgens bestaand patroon.
