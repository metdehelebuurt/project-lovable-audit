## Probleem
In `WebTools.tsx` is één `WidgetConfigurator` permanent gemount voor het aanmaken van widgets. De configurator initialiseert zijn interne `form`-state met `useState(initialData || {...})`, wat alleen bij de allereerste mount evalueert. Het wijzigen van `configuratorType` (en dus `initialData.type`) heeft daarna geen effect meer — `form.type` blijft `"contactformulier"`. Resultaat: elke nieuw aangemaakte widget krijgt `type = contactformulier`, ongeacht welke template-knop geklikt is. De `EmbedCodeDialog` routeert daardoor naar `/embed/contact/:id` in plaats van `/embed/calculator/:id`, dus een Thuisbatterij-calculator toont een contactformulier.

## Oplossing

### 1. `src/components/webtools/WidgetConfigurator.tsx`
- State synchroniseren met `initialData` zodra de dialog opent of `initialData.type` wijzigt:
  - `useEffect` die bij `open === true` (of bij wijziging van `initialData.type`) de `form`-state reset naar de meegegeven `initialData` (of de defaults voor het nieuwe type).
- Defaults per widgettype: voor calculators is `toon_telefoon`/`toon_bericht` niet relevant; alleen renderen voor `contactformulier` (gebeurt al via `isContact`), maar bij reset deze velden wel correct meenemen om vervuiling tussen types te voorkomen.
- Titel/Description in de dialog laten meebewegen met `form.type` (gebeurt al via `widgetTypeLabels[form.type]`, blijft werken na sync).

### 2. `src/pages/WebTools.tsx` (defensieve verbetering)
- De aanmaak-`WidgetConfigurator` alleen renderen als `configuratorOpen === true`, zodat hij bij elke open-actie volledig opnieuw mount. Dit voorkomt dat soortgelijke stale-state-bugs in de toekomst terugkeren:
  ```tsx
  {configuratorOpen && (
    <WidgetConfigurator
      open
      onOpenChange={setConfiguratorOpen}
      onSave={handleCreate}
      initialData={{ type: configuratorType, ... }}
    />
  )}
  ```
- Dit is consistent met hoe `editingWidget` al wordt afgehandeld.

### 3. Data-herstel voor bestaande verkeerd opgeslagen widgets
Geen automatische migratie: het type van bestaande widgets is niet meer betrouwbaar te achterhalen (de naam is vrij). In plaats daarvan:
- In de widgetlijst een waarschuwingsbadge tonen op widgets waarvan `type = contactformulier` maar de `naam` een calculator-keyword bevat (`calculator`, `thuisbatterij`, `zonnepanelen`, `warmtepomp`, `isolatie`, `laadpaal`) — met tekst "Type lijkt niet te kloppen, verwijder en maak opnieuw aan".
- Optioneel later: een edit-knop toevoegen die wél het type laat wijzigen (nu read-only).

### 4. Verificatie
- Handmatig: nieuwe Thuisbatterij Calculator aanmaken → in DB `type = calculator_thuisbatterij` → embed-link `/embed/calculator/:id` → `EmbedCalculator` rendert `ThuisbatterijCalc`.
- Snel een SQL-check via read_query op `web_widgets` om de fix te bevestigen.

## Geen wijziging nodig in
- `EmbedCalculator.tsx` / `EmbedContact.tsx` — werken correct zodra `type` goed wordt opgeslagen.
- `widget-submit` edge function — leest `widget.type` uit DB, geen wijziging.
- Routes in `App.tsx` — al correct.
