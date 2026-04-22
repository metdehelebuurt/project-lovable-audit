

## Plan — Slimme "Hulp nodig" AI-assistent

Een drijvende help-knop (rechtsonder, zichtbaar op elke pagina binnen het platform) opent een chat-paneel waar gebruikers in natuurlijke taal vragen kunnen stellen over mijnhuis.nu. De AI antwoordt met een duidelijke uitleg én klikbare deeplinks naar de juiste pagina, rekening houdend met de rol van de gebruiker en de modules waar hij/zij toegang toe heeft.

### Wat de gebruiker krijgt

- **Floating help-knop** (paars cirkel, lifebuoy-icoon) rechtsonder in de viewport — verbergt zich automatisch op publieke routes (`/`, `/login`, `/offerte/:token`, `/embed/...`).
- **Chat-paneel** (Sheet vanaf rechts, op mobiel full-screen) met:
  - Titel "Hulp nodig?" + uitleg in één zin
  - Suggestie-chips bij start: "Hoe maak ik een offerte?", "Waar zie ik mijn voorraad?", "Hoe registreer ik een retour?", "Hoe plan ik een installatie?" (rolspecifiek)
  - Berichtenlijst met markdown-rendering en klikbare interne links
  - Inputveld + verzenden, streaming antwoord (token-per-token)
  - "Wis gesprek" knop
- **Slimme links in antwoorden**: AI gebruikt geen externe URL's, alleen interne paden zoals `/offertes/nieuw`. Klikken navigeert in-app via React Router (geen page reload).
- **Voorbeeld-antwoord**: 
  > Je kunt een nieuwe offerte aanmaken via [Offertes → Nieuw](/offertes/nieuw). Vul daar de klant, regels en betalingstermijnen in. Na opslaan ga je naar de detailpagina waar je direct kunt ondertekenen en versturen.

### Hoe het systeem zichzelf bijhoudt

De AI hoeft niet "getraind" te worden bij elke nieuwe module. Twee mechanismen zorgen voor automatische actualiteit:

1. **Statische module-registry** (`src/lib/modules.ts`) is al de bron-van-waarheid voor alle modules. Deze wordt op de server (edge function) ingelezen samen met een **handmatig onderhouden help-context bestand** (`supabase/functions/help-assistant/help-knowledge.ts`) dat per module korte beschrijvingen, taken en deeplinks bevat. Dit bestand groeit automatisch mee als ontwikkelaars nieuwe modules bouwen — er staat een README-instructie in dat een nieuwe module een entry moet krijgen.
2. **Route-registry** wordt eveneens in `help-knowledge.ts` gehouden (zelfde bestand, één plek). De edge function bouwt hier dynamisch een system-prompt van, gefilterd op de rol en effectieve modules van de gebruiker, zodat de AI alleen links voorstelt waar hij/zij ook echt toegang toe heeft.

Voordeel: één bestand bijwerken bij nieuwe modules, geen externe vector-DB nodig, geen embedding-kosten, antwoorden blijven snel en accuraat.

### Architectuur

```text
HelpAssistantWidget (mounted in AppLayout)
   ├─ HelpButton (floating, paars)
   └─ HelpChatPanel (Sheet)
         ├─ MessageList (markdown + interne links)
         └─ MessageInput → streamHelpChat()
                              │
                              ▼
              edge function /help-assistant
                 ├─ system prompt = bouwHelpPrompt(rol, modules)
                 ├─ messages: history + nieuwe vraag
                 └─ Lovable AI Gateway (gemini-3-flash-preview, stream)
```

### Bestanden (alle <800 regels, componenten gesplitst)

**Nieuw**
- `src/components/help/HelpAssistantWidget.tsx` — wrapper, render-conditie op route
- `src/components/help/HelpButton.tsx` — drijvende knop
- `src/components/help/HelpChatPanel.tsx` — Sheet + layout
- `src/components/help/HelpMessageList.tsx` — markdown rendering + interne link-handler
- `src/components/help/HelpMessageInput.tsx` — textarea + verzendknop + suggesties
- `src/components/help/useHelpChat.ts` — state + streaming-logica + localStorage history
- `src/components/help/suggestionsByRol.ts` — startsuggesties per rol
- `supabase/functions/help-assistant/index.ts` — edge function (CORS, validatie, gateway-stream)
- `supabase/functions/help-assistant/help-knowledge.ts` — modules + routes + how-to teksten + onderhouds-README in commentaarblok

**Aanpassingen**
- `src/components/AppLayout.tsx` — render `<HelpAssistantWidget />` binnen layout
- `package.json` (indirect) — `react-markdown` toevoegen voor message-rendering

### Technische details

- **AI-model**: `google/gemini-3-flash-preview` via Lovable AI Gateway (snel, goedkoop, prima voor Q&A). Streaming via SSE.
- **Edge function** is publiek (`verify_jwt = false` standaard), maar verwacht `rol` en `module_keys` in de request body — frontend bepaalt deze uit `useAuth()` + `useEffectieveModules()` zodat antwoorden alleen verwijzen naar toegestane paden.
- **System prompt** bevat: (1) korte uitleg over mijnhuis.nu, (2) tabel met modules → URL → korte how-to → vereiste rol, gefilterd op gebruikersrol/modules, (3) regel "gebruik alleen interne paden uit de tabel, formatteer als markdown link".
- **Linkafhandeling**: `react-markdown` met custom `a`-component die `e.preventDefault()` doet en `navigate(href)` aanroept als href met `/` begint, zodat het een SPA-navigatie is en het paneel sluit.
- **Geschiedenis**: laatste 20 berichten in `localStorage` per gebruiker (`help-chat:{userId}`), zodat een gebruiker zijn vorige vragen terugziet binnen dezelfde sessie/dag.
- **Foutafhandeling**: 429/402 → vriendelijke toast ("Even druk, probeer het zo opnieuw"). Geen technische details richting gebruiker.
- **Rolverbergen**: widget niet renderen voor rol `consument` (publieke portal-gebruikers krijgen geen platform-help) — wel actief voor alle interne rollen.
- **Toegankelijkheid**: knop heeft `aria-label="Hulp nodig"`, paneel sluit met Esc, focus-trap binnen Sheet (al ingebouwd in shadcn).
- **Geen wijzigingen aan rolmatrix nodig** — help is altijd beschikbaar voor ingelogde interne gebruikers, geen aparte module-toggle.

### Onderhoud bij nieuwe modules

In `help-knowledge.ts` staat boven het bestand een commentaarblok met de instructie: "Bij elke nieuwe module hier een entry toevoegen met `key`, `label`, `url`, `roles`, en `howTo` (3-5 regels uitleg)." Zo blijft de assistent automatisch in sync zonder extra infrastructuur.

