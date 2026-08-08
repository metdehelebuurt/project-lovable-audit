# Interactieve AI-tutorials in de hulp-assistent

De hulp-assistent geeft straks niet alleen antwoord, maar kan de gebruiker live door het
platform leiden: een spotlight licht het juiste element op, legt uit wat het doet, en wacht
tot de gebruiker er zelf op klikt. Daarna volgt automatisch de volgende stap — over
paginawissels heen. Werkt platform-breed, voor elke vraag, aangestuurd door AI.

## Hoe het werkt voor de gebruiker

1. Gebruiker vraagt in de chat: "hoe maak ik een offerte?"
2. De assistent antwoordt zoals nu, en toont onder het antwoord de knop **Start tutorial**.
3. Bij klikken schuift het chatpaneel weg naar een kleine balk onderin met stap-teller,
   "Vorige/Overslaan/Stoppen" en de uitlegtekst.
4. Het platform navigeert zelf naar het startscherm, dimt de pagina en zet een spotlight op
   het element ("Klik op Nieuwe offerte"). De gebruiker klikt zelf; de tutorial gaat verder.
5. Bij formulierstappen wacht de tutorial op invullen/klikken in plaats van door te drukken.
6. Aan het einde: korte samenvatting en de vraag of het gelukt is (voedt de feedbackloop).

Er verandert niets aan de zichtbare interface zolang er geen tutorial loopt — markeringen
verschijnen alleen tijdens een actieve tutorial.

## Onderdelen

### 1. Ankers door het hele platform
Elk aanklikbaar element dat in een uitleg relevant kan zijn krijgt een stabiel
`data-tour="..."`-attribuut: sidebar-items, hoofdknoppen, tabs, tabelrij-acties,
wizardstappen, formuliervelden en opslaan/versturen-knoppen.

Dekking wordt in fasen uitgerold, maar het doel is volledig:
- Fase A: hoofdnavigatie, dashboard, leads, klanten, offertes (incl. wizard en verzendflow).
- Fase B: schouwen, opdrachten, installaties, opleveringen, planning, helpdesk.
- Fase C: producten, voorraad/inkoop, sales/affiliate, instellingen, superadmin.

Een lint-/CI-script controleert dat elk anker uniek is en in de registry staat, zodat
ankers niet stilletjes verdwijnen bij refactors.

### 2. Ankerregistry als kennisbron voor de AI
Naast het attribuut komt er één registry met per anker: id, label, route, korte
omschrijving, benodigde rol en module. Deze registry wordt — net als de bestaande
module-kennisbank — automatisch omgezet naar een bestand dat de hulp-functie kan lezen,
gefilterd op rol en actieve modules van de gebruiker.

### 3. AI die de tutorial samenstelt
De hulp-functie krijgt er een tweede aanroep bij die uit de vraag een tutorialplan bouwt:
een reeks stappen met route, ankerid, uitleg en wachtconditie (klik, invoer of alleen
lezen). Het plan wordt server-side gevalideerd tegen de registry: verzonnen ankers en
stappen buiten de rechten van de gebruiker worden verwijderd. Blijft er niets bruikbaars
over, dan komt de knop niet in beeld en blijft het bij het tekstantwoord.

### 4. Tutorial-engine in de app
Een provider die het plan uitvoert: navigeren, wachten tot een element bestaat, spotlight
plaatsen, uitleg tonen, klik of invoer detecteren, doorschuiven. Herpositioneert bij
scrollen en resizen, werkt op mobiel als onderin-kaart, en is toetsenbord- en
screenreader-toegankelijk (Esc stopt, focus op de uitleg).

Robuustheid: verschijnt een element niet binnen een paar seconden, dan toont de stap een
tekstinstructie met "Ik heb het gevonden / Sla over" in plaats van vast te lopen. Een
tutorial kan altijd worden hervat of gestopt.

## Techniek

- `src/lib/tour/anchors.ts` — registry (id, label, route, rol, module, omschrijving) +
  `tourAnchor(id)` helper voor de `data-tour`-attributen.
- `scripts/generate-tour-knowledge.ts` — genereert
  `supabase/functions/help-assistant/tour-anchors.generated.ts` via bestaande predev/prebuild.
- `src/components/tour/` — `TourProvider.tsx`, `TourSpotlight.tsx`, `TourStepCard.tsx`,
  `useTourRunner.ts`, `useElementWatcher.ts` (MutationObserver + polling), `types.ts`.
  Provider wordt in `AppLayout` gehangen; elk bestand blijft ruim onder de limieten.
- `supabase/functions/help-assistant/index.ts` — extra endpoint-modus `mode: "tutorial"`
  die met `openai/gpt-5.6-sol` via de Responses API (streaming, strikt JSON-schema) een plan
  teruggeeft; chatstreaming blijft ongewijzigd. Validatie in `tutorial-plan.ts`.
- `src/components/help/HelpChatPanel.tsx` + `useHelpChat.ts` — tutorialknop, ophalen van het
  plan, paneel minimaliseren tijdens de tutorial.
- Fallback en foutpaden hergebruiken de bestaande 429/402-afhandeling en toasts.

## Tests

- Unit: planvalidatie (onbekend anker, rol zonder toegang, lege stappenlijst),
  ankerregistry-uniciteit.
- E2E (Playwright, AI gemockt): "hoe maak ik een offerte" → knop verschijnt → tutorial
  start → spotlight op sidebar-item → klik → volgende stap op de nieuwe pagina → afronden.
  Plus mobiel scenario en het fallbackpad voor een ontbrekend element.
