## Doel

In de installatiemodule moet het tabblad **Werkvoorbereiding** dezelfde items tonen als de **Gereedheidscheck** in het overzicht. Daarnaast moet een gebruiker elk item handmatig op "compleet" kunnen zetten (ook de automatisch berekende checks zoals Schouw, Klant bevestigd, Monteur, Werkadres, Producten, Voorraad, Serienummers, Planning).

## Huidige situatie

- `InstallatieGereedheidsCard` (overzicht) toont 8 systeemchecks + custom checklist items (uit `installatie_checklist_items`).
- `InstallatieWerkvoorbereidingTab` toont **alleen** de custom checklist items. De systeemchecks ontbreken volledig en kunnen daar niet worden afgevinkt.

Hierdoor wijken beide weergaves af, en kan een gebruiker een systeemcheck (bv. "Werkadres compleet" of "Schouw uitgevoerd") niet handmatig als gereed markeren wanneer het in de praktijk wel klopt maar de data ontbreekt.

## Oplossing

### 1. Database: handmatige overrides

Nieuwe tabel `installatie_gereedheid_overrides`:
- `id`, `installatie_id`, `partner_id`, `item_key` (bv. `schouw`, `werkadres`, `voorraad`, …)
- `voltooid_op timestamptz`, `voltooid_door uuid`, `notitie text`
- Unieke index op (`installatie_id`, `item_key`)
- RLS conform bestaande installatie-tabellen (partner-scoped, installateur via `installatie_id` toegang).

### 2. Hook uitbreiden

`useInstallatieGereedheid`:
- Override-records ophalen voor de installatie.
- Per systeemcheck: als er een override bestaat → status = `ok`, details = "Handmatig gemarkeerd op …", `blokkerend = false`, en markeren als `manueel: true` + `override_id`.
- Result-type uitbreiden met `manueel?: boolean` en `override_id?: string` op `GereedheidsItem`.

### 3. Werkvoorbereiding tab — unified view

`InstallatieWerkvoorbereidingTab` toont nu één lijst met **alle** gereedheidsitems, in dezelfde volgorde/groepering als het overzicht:

```text
[ ] Schouw uitgevoerd            (systeemcheck)   [Markeer handmatig compleet]
[x] Klant bevestigd              (systeemcheck, automatisch)
[ ] Werkadres compleet           (systeemcheck)   [Markeer handmatig compleet]
...
[ ] Steiger besteld              (custom)         [Verwijderen]
[x] Net-aanvraag ingediend       (custom)
```

Gedrag per type:
- **Custom item** (uit `installatie_checklist_items`): checkbox toggelt `voltooid_op` (huidig gedrag, blijft).
- **Systeemcheck zonder override**:
  - Als `status = ok` (echt voldaan via data) → checkbox aangevinkt en uitgegrijsd, label "Automatisch".
  - Anders → checkbox uit; bij aanvinken wordt een override-record aangemaakt (status → `ok`). Optioneel notitie via een klein popover/inline input.
- **Systeemcheck met override**: checkbox aan; uitvinken verwijdert de override.

Visueel onderscheid via een kleine badge ("Auto" / "Handmatig" / "Custom"). Volgorde en labels identiek aan `GereedheidsCard` zodat beide weergaves één-op-één overeenkomen.

### 4. Overzichtskaart afstemmen

`InstallatieGereedheidsCard` toont per item een klein "Handmatig"-label wanneer `manueel: true`, zodat duidelijk is dat een check via override gereed is gezet. Geen verdere gedragswijziging in het overzicht.

## Technische details

- Nieuwe migratie: tabel + RLS-policies + index.
- Hook `useInstallatieGereedheid`: extra select op `installatie_gereedheid_overrides`; merge in bestaande items.
- Nieuwe kleine helper-hook `useGereedheidOverride(installatieId)` met `markeer(item_key, notitie?)` en `verwijder(item_key)` mutaties + invalidate van `installatie-gereedheid` en `installatie_checklist`.
- `InstallatieWerkvoorbereidingTab` herbouwd rond de gereedheidsdata in plaats van direct rond `installatie_checklist_items`. Custom items blijven via dezelfde tabel toevoegen/verwijderen.
- Volgorde-bron: `useInstallatieGereedheid` resultaat (systeemchecks eerst, dan custom).
- Bestandsgrootte werkvoorbereiding-tab blijft binnen de 800-regel-grens; helpers voor de rij-rendering komen in een sub-bestand `WerkvoorbereidingItemRow.tsx` als de hoofdfile boven ~400 regels uitkomt.

## Niet in scope

- Geen wijzigingen aan de werkstroom-stepper of statusovergangen.
- Geen audit-log buiten de bestaande `voltooid_door`/`voltooid_op`-velden van overrides.