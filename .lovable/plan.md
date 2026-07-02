# Fix: assemblage-serienummers blijven “in order” na ontvangst

## Oorzaak

De ontvangstboeking schrijft serienummers nu vooral als losse voorraadregels weg, maar de installatie/opleverflow kijkt primair naar serienummers die aan de juiste `installatie_id` of `opdracht_id` hangen. Bij de geteste order is bovendien zichtbaar dat:

- de verkooporder wél `installatie_id = 8593040d-...` heeft;
- de installatie zelf géén `opdracht_id` en `klant_id` heeft;
- serienummers die bij ontvangst worden ingevoerd niet consequent aan `opdracht_id`, `installatie_id` en klantcontext worden gekoppeld;
- de installatie-serienummereditor alleen op `installatie_id` leest, waardoor op opdracht gereserveerde SN’s niet meetellen;
- handmatig invoeren kan botsen met de unieke sleutel `(partner_id, product_id, serienummer)` als het SN al bij ontvangst is aangemaakt;
- de installatieplanning vanuit `OpdrachtDetail` maakt een installatie aan zonder ordergegevens, adres en producten mee te kopiëren.

Daarom blijft de UI “0/1 verwacht volgens order” tonen, terwijl de SN’s logistiek al zijn ontvangen.

## Wijzigingen die moeten worden doorgevoerd

### 1) Ontvangstboeking direct koppelen aan order/installatie

`src/pages/OntvangstRegistreren.tsx`

- Inkooporder ophalen met `opdracht_id`, `installatie_id`, `klant_id` en waar nodig via gekoppelde opdracht de installatie ophalen.
- Bij elk ingevoerd component-SN opslaan/upserten met:
  - `opdracht_id: doc.opdracht_id`
  - `installatie_id: doc.installatie_id ?? opdracht.installatie_id`
  - `klant_id: doc.klant_id ?? installatie.klant_id`
  - `status: installatie_id ? 'geinstalleerd' : opdracht_id ? 'gereserveerd' : 'voorraad'`
- Niet alleen parent-assemblage opslaan, maar SN’s van de geëxpandeerde componentregels als echte `product_serienummers` voor de componentproducten.

### 2) Bestaande voorraad-SN’s niet dupliceren maar upgraden/koppelen

`src/hooks/logistiek/useSerienummers.ts`

- `useUpsertSerienummer` eerst laten zoeken op `(partner_id, product_id, serienummer)`.
- Bestaat het SN al, dan updaten met installatie/opdracht/klant/status in plaats van insert proberen.
- Als het SN al aan een andere installatie hangt: duidelijke foutmelding tonen.
- Status `gereserveerd` toevoegen aan het type.

### 3) Installatie-editor ook opdracht-SN’s laten meetellen

`src/hooks/logistiek/useSerienummers.ts`

- `useSerienummersVoorInstallatie(installatieId, opdrachtId)` laten zoeken op `installatie_id = ... OR opdracht_id = ...`.

`src/components/serienummers/SerienummerEditor.tsx`

- De hook met `opdrachtId` aanroepen.
- Nieuwe knop/quick action toevoegen: **“Ontvangen SN’s koppelen aan installatie”**.
- Deze zet alle op opdracht gereserveerde SN’s om naar `status = geinstalleerd` en vult `installatie_id`.
- Daardoor wordt “Verwacht volgens order” direct bijgewerkt naar bijvoorbeeld `1/1`.

### 4) Installatieplanning vanuit opdracht compleet maken

`src/pages/OpdrachtDetail.tsx`

- `handlePlanInstallatie` moet bij het aanmaken van de installatie ook invullen:
  - `opdracht_id`
  - `klant_naam`, `klant_email`, `klant_telefoon`
  - `klant_adres`, `klant_postcode`, `klant_plaats`, `werkadres`
  - `producten` uit `opdracht.regels` inclusief `product_id`
  - `werkomschrijving`
- Zo is de installatie altijd correct terug te herleiden naar de verkooporder.

### 5) Bestaande foute records herstellen met migratie

Nieuwe migratie:

- Vul `installaties.opdracht_id` terug op basis van `opdrachten.installatie_id`.
- Vul klant-/adresvelden op de installatie terug vanuit de gekoppelde opdracht waar leeg.
- Vul `installaties.producten` terug vanuit `opdrachten.regels` waar leeg of incompleet.
- Vul `product_serienummers.installatie_id` terug waar `opdracht_id` gekoppeld is aan een opdracht met installatie.
- Zet status naar `gereserveerd` of `geinstalleerd` afhankelijk van of er een installatie gekoppeld is.

### 6) Opleverrapport robuuster maken voor assemblages

`src/components/oplever/api/opleverPrefill.ts`

- Bij prefill niet alleen producten uit `installatie.producten` gebruiken, maar ook componentproducten uit assemblages ophalen.
- SN’s matchen op `installatie_id OR opdracht_id`.
- Zo verschijnen batterij, omvormer en backup-box SN’s ook als ze via ontvangst/order zijn gekoppeld.

## Verwacht resultaat

- Ontvangen component-SN’s van een assemblage verschijnen direct in de installatie.
- “Verwacht volgens order” telt ontvangen/gekoppelde SN’s mee.
- Opleverdocumenten worden automatisch gevuld met de juiste SN’s.
- Handmatig scannen van een al ontvangen SN werkt als koppeling, niet als duplicaat.
- Nieuwe installaties krijgen altijd de juiste order-, klant-, adres- en productkoppeling.
