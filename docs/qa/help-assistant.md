# Handmatige QA — Hulp-assistent

Doorloop deze checklist na wijzigingen aan `src/components/help/*`,
`supabase/functions/help-assistant/*` of `src/lib/modules.ts`.

## Zichtbaarheid

- [ ] Help-knop **niet** zichtbaar op `/`, `/login`, `/signup`, `/offerte/:token`, `/embed/...`
- [ ] Help-knop **niet** zichtbaar voor rol `consument`
- [ ] Help-knop **wel** zichtbaar op alle ingelogde interne routes
- [ ] Knop heeft `aria-label="Hulp nodig"`

## Functioneel

- [ ] Klik op de knop opent het Sheet-paneel rechts (desktop) / volledig scherm (mobiel ≤768px)
- [ ] Suggestie-chips verschijnen alleen bij leeg gesprek
- [ ] Verzenden via Enter (zonder Shift) werkt; Shift+Enter geeft nieuwe regel
- [ ] Streaming-tokens komen vloeiend binnen
- [ ] Klik op een AI-link met `/...` navigeert in-app (geen reload) en sluit het paneel
- [ ] "Wis gesprek"-knop verwijdert berichten en localStorage-entry
- [ ] Esc sluit het paneel; focus blijft binnen Sheet bij Tab-navigatie

## Persistentie

- [ ] Geschiedenis blijft na page-refresh (max 20 berichten in `localStorage` onder `help-chat:{userId}`)
- [ ] Wisselen van gebruiker isoleert geschiedenis per `userId`

## Rol- en module-filtering

- [ ] AI suggereert nooit pagina's waar de huidige rol geen toegang toe heeft
  - `installateur`-account → AI mag geen `/leveranciers` of `/financieel` voorstellen
  - `partner_staff` zonder voorraad-module → AI mag geen `/voorraad` voorstellen
- [ ] AI gebruikt uitsluitend interne paden uit de kennisbank

## Foutafhandeling

- [ ] Bij HTTP 429 verschijnt toast "Even druk, probeer het zo opnieuw" en blijft de vraag staan
- [ ] Bij HTTP 402 verschijnt toast "AI-tegoed op…"
- [ ] Bij netwerkfout midden in stream verschijnt inline assistant-bubble met herstelmelding
- [ ] Bij geen response.body verschijnt herstelmelding-bubble

## Mobiel

- [ ] Op viewport 375×812 is het paneel volledig scherm
- [ ] Inputveld blijft bereikbaar boven het softkeyboard
- [ ] Markdown-links zijn voldoende groot om te tappen

## Toegankelijkheid (WCAG 2.1 AA)

- [ ] Kleurcontrast knop ≥ 4.5:1
- [ ] Focus-state zichtbaar op knop, suggestie-chips, links en input
- [ ] Screenreader leest "Hulp nodig" voor de floating button
- [ ] Sheet heeft `role="dialog"` met titel en beschrijving