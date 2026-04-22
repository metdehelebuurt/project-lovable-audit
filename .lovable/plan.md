

## Plan — Closed-loop order proces: 10 nieuwe modules & functies

Onderstaande analyse adresseert de gaten in het end-to-end order proces (Verkooporder → Inkoop → Voorraad → Logistiek → Levering → Oplevering → Aftersales). Op dit moment is de keten gefragmenteerd: orders kennen geen voorraadkoppeling, inkoop is een handmatige losse module zonder link naar openstaande verkooporders, er is geen verzendlogistiek, geen serienummer-traceerbaarheid en geen RMA-flow.

### Gat-analyse (samenvatting)

| Domein | Wat ontbreekt vandaag |
|---|---|
| Voorraad | Wel `producten.voorraad` veld, maar geen mutatielog, geen reservering bij verkooporder, geen lage-voorraadwaarschuwing |
| Inkoop | Inkooporders bestaan los; geen "automatisch inkooporder vanuit verkooporder" of voorraadtekorten-engine |
| Logistiek | Geen verzendregels, track&trace, leverdatum, vervoerder, ontvangstbevestiging op verkooporder |
| Marge | Geen winstinzicht per order (verkoop-prijs vs. ingekochte kostprijs) |
| Aftersales | Pakbon=alleen document; geen RMA/retour, geen serienummer-tracking, geen garantie-registratie |
| Klant | Klantportaal toont offerte + handleidingen, maar geen leveringstatus / track&trace |
| Inkoopprijzen | Geen leverancier-prijslijsten of staffels |

### De 10 nieuwe modules / functies

#### 1. **Voorraadbeheer met mutatielog** (`voorraad_mutaties`)
- Nieuwe tabel registreert élke voorraad­beweging (inkomend/uitgaand/correctie/reservering) met type, aantal, referentie (opdracht/inkooporder/handmatig), gebruiker en timestamp.
- `producten.voorraad` wordt afgeleid via materialized view of trigger.
- UI: tab "Voorraad" op `ProductDetail` met historiek + handmatige correctie-knop. Lijst-overzicht `/voorraad` met filters (categorie, lage voorraad, locatie).
- Drempelwaarde `min_voorraad` op product → automatische notificatie bij onderschrijding.

#### 2. **Auto-reservering & tekorten-engine op verkooporder**
- Bij status `bevestigd` van een opdracht: alle gekoppelde productregels worden automatisch gereserveerd in `voorraad_mutaties` (type=`reservering`).
- Tab "Voorraad & Inkoop" op `OpdrachtDetail` toont per regel: vrije voorraad, gereserveerd, tekort, suggestie-leverancier.
- Eén-klik knop **"Maak inkooporder voor tekorten"** → opent `FactuurNieuw?type=inkooporder` met voorgevulde regels (gegroepeerd per leverancier).

#### 3. **Verzending & Logistiek-tab op verkooporder** (`opdracht_zendingen`)
- Nieuwe tabel: `opdracht_zendingen` (opdracht_id, vervoerder, trackingnummer, verzenddatum, verwachte_leverdatum, afleverdatum, ontvangen_door, foto_aflevering_url, status).
- Nieuwe tab "Levering" op `OpdrachtDetail`: voeg zending toe, plak trackingcode, vervoerder-keuzelijst (PostNL, DHL, DPD, eigen bezorging).
- Status afgeleid: `gepland → onderweg → geleverd`. Stuurt automatisch e-mail aan klant met track&trace link.
- Deze status verschijnt ook in het **klantportaal** (`OffertePublic`) als nieuwe sectie "Mijn levering".

#### 4. **Serienummer-tracking & garantieregistratie** (`product_serienummers`)
- Nieuwe tabel: `product_serienummers` (product_id, serienummer, opdracht_id, installatie_id, klant_id, levering_datum, garantie_einddatum, status).
- Bij gereedmelding van installatie: monteur scant/typt serienummers per product (mobiel werkscherm).
- Wordt zichtbaar op `KlantDetail` ("Geleverde apparatuur") en gebruikt voor RMA-claims (zie #6).

#### 5. **Leverancier-prijslijsten met inkoopvoorstellen** (`leverancier_artikelen`)
- Nieuwe tabel: `leverancier_artikelen` (leverancier_id, product_id, leverancier_artikelnummer, inkoopprijs, min_bestelhoeveelheid, levertijd_dagen, laatst_gewijzigd).
- Per product kun je 1+ leveranciers koppelen met eigen inkoopprijs en levertijd.
- De tekorten-engine (#2) gebruikt deze data om automatisch de **goedkoopste of snelste** leverancier te suggereren.
- Importeerbaar via CSV en updatebaar via AI-import (bestaande `ai-product-import` uitbreiden).

#### 6. **RMA / Retouren-module** (`retouren`)
- Nieuwe tabel: `retouren` (id, partner_id, type ['klant_retour'|'leverancier_retour'], opdracht_id, leverancier_id, regels[], reden, status, rma_nummer, foto_url[], gemaakt_door).
- Workflow: aanmelden → goedgekeurd → verzonden → afgehandeld (creditnota of vervangend product).
- Knop "Retour aanmelden" zichtbaar op `OpdrachtDetail`, `InstallatieDetail` én `KlantDetail` ("Geleverde apparatuur"-tab).
- Bij retour naar leverancier: optionele auto-creditnota inkoop. Bij klant-retour: optionele auto-creditnota verkoop.

#### 7. **Margin-inzicht & ordereconomie**
- Op `OpdrachtDetail` nieuwe widget "Order-marge": verkoopwaarde vs som inkoopprijzen (uit `leverancier_artikelen` of `producten.kostprijs`) + arbeid (uit installatie-uren) → bruto- en nettomarge, in € en %.
- Dashboard-tegel "Gemiddelde margin per categorie" op `Financieel` overzicht.
- Waarschuwing als marge < drempel (instelbaar per partner).

#### 8. **Inkoop ontvangst & ontvangst-pakbon** (`inkoop_ontvangsten`)
- Nieuwe tabel: `inkoop_ontvangsten` (inkooporder_id, ontvangstdatum, ontvangen_door, regels[{regel_id, ontvangen_aantal, opmerking}], foto_url[]).
- Vervangt het simplistische "deels_ontvangen / volledig_ontvangen" met echte regel-niveau registratie.
- Trigger schrijft automatisch een `voorraad_mutatie` (type=`inkomend`) per ontvangen regel.
- Discrepantie-flag bij verschil tussen besteld/ontvangen → opent direct retour-flow (#6).

#### 9. **Geïntegreerde leveringsplanning kalender**
- Nieuwe view `/planning/leveringen` (los tabblad in bestaande Planning-pagina) met alle geplande klantleveringen (verkoop) én verwachte leverancier-ontvangsten (inkoop).
- Drag&drop verschuiven van verwachte_leverdatum.
- Kleurcodes: groen=op-tijd, oranje=krap, rood=achterstand.
- iCal-feed exporteerbaar voor magazijnploeg.

#### 10. **Order-document hub op verkooporder + audit-historie** (`opdracht_audit`)
- Nieuwe tab "Documenten" op `OpdrachtDetail`: één centraal overzicht van álle artefacten van die order: orderbevestiging-PDF, verkoopfactuur(en), pakbon(nen), inkooporders, inkoopfacturen, schouwrapport, opleverrapport, handleidingen, foto's bij aflevering.
- Nieuwe `opdracht_audit`-tabel logt elke statuswijziging, document-creatie, voorraadbeweging en gebruikersactie chronologisch.
- Alles downloadbaar als één ZIP voor audit/dossier-export.

### Datamodel — overzicht nieuwe tabellen

```text
voorraad_mutaties         (product_id, type, aantal, referentie_type, referentie_id, partner_id, ...)
opdracht_zendingen        (opdracht_id, vervoerder, trackingnummer, status, ...)
product_serienummers      (product_id, serienummer, installatie_id, klant_id, garantie_einddatum, ...)
leverancier_artikelen     (leverancier_id, product_id, inkoopprijs, levertijd_dagen, ...)
retouren                  (partner_id, type, opdracht_id?, leverancier_id?, regels, status, rma_nummer, ...)
inkoop_ontvangsten        (inkooporder_id, ontvangen_door, regels, ontvangstdatum, ...)
opdracht_audit            (opdracht_id, partner_id, actor_id, actie, veld, oude/nieuwe, ...)
producten.min_voorraad    (extra kolom, integer)
```

Alle nieuwe tabellen krijgen RLS volgens bestaand partner_id-patroon + audit-trigger waar nodig.

### Bestanden — ruwe schatting

| Categorie | Bestanden | Geschat |
|---|---|---|
| Migraties | 7 nieuwe SQL-bestanden | ~250 regels totaal |
| Pages | `Voorraad.tsx`, `Retouren.tsx`, `RetourDetail.tsx` | ~600 |
| Componenten | `voorraad/*` (5x), `opdracht/LeveringTab.tsx`, `opdracht/VoorraadTab.tsx`, `opdracht/MargeWidget.tsx`, `opdracht/DocumentenHub.tsx`, `opdracht/SerienummerEditor.tsx`, `inkoop/OntvangstDialog.tsx`, `leveranciers/PrijslijstEditor.tsx`, `retouren/*` (4x) | ~1.500 |
| Edge Functions | `voorraad-trigger-check`, `zending-track-update`, `levering-notify-klant` | ~300 |
| Helpers | `src/lib/voorraad.ts`, `src/lib/inkoopSuggestie.ts`, `src/lib/retouren.ts` | ~250 |
| Wijzigingen | `OpdrachtDetail.tsx`, `Opdrachten.tsx`, `FactuurNieuw.tsx` (inkooporder), `FactuurDetail.tsx` (ontvangst-knop), `Planning.tsx`, `OffertePublic.tsx` (klantportaal levering), `KlantDetail.tsx` (apparatuur+retouren-tab), `InstallatieMonteurView.tsx` (serienr-scan), `Producten.tsx` (min_voorraad veld), sidebar-navigatie | ~600 |
| Types | auto-update | — |

### Volgorde van implementatie (4 sprints)

| Sprint | Levert op |
|---|---|
| **1. Voorraad-fundament** | #1 mutaties + #2 reservering/tekorten + min_voorraad-veld |
| **2. Logistiek & klant** | #3 verzendingen + #4 serienummers + klantportaal-leveringstab |
| **3. Inkoop volwassen** | #5 leverancier-prijslijsten + #8 ontvangst-registratie + #6 retouren |
| **4. Inzicht & audit** | #7 marge-widget + #9 leveringskalender + #10 documenten-hub & audit |

Eén sprint per follow-up bericht — beheersbaar, testbaar, terugdraaibaar.

### Niet aangeraakt
- Bestaande RLS-pattern, authenticatie, klant-token, betalingsstromen (Mollie), abonnement-engine.
- Wizard-flows van schouw/oplevering blijven intact.
- Bestaande `financiele_documenten`-structuur (alleen aanvullingen via koppeltabellen).

### Bevestigingsvragen
1. Akkoord met **alle 10** functies in 4 sprints, of wil je specifieke modules schrappen / herprioriteren?
2. Voor verzending: starten we met **handmatige tracking** (vervoerder + trackingnummer veld) of direct met API-koppeling van PostNL/DHL? (handmatig is sneller en we kunnen later upgraden)
3. Voor serienummers: scannen via **camera (QR/barcode)** in mobiel werkscherm, of voor nu alleen typen? (camera-scan = +1 dag werk, levert grote UX-winst)

