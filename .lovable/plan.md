

## Plan — Robuuste streaming, QA-testplan, automatische route-registratie

### 1) Streaming-parsing (kleine verbetering, niet groots overhalen)

De huidige `extractDeltas` in `src/components/help/useHelpChat.ts` is al grotendeels robuust: hij splitst per `\n`, handelt CRLF en SSE-comments af, herkent `[DONE]` en legt onvolledige JSON terug in de buffer. Twee subtiele issues los ik op:

- **Multi-line `data:`-events** — sommige gateways sturen een event verspreid over meerdere `data:`-regels gevolgd door een lege regel. We gaan voortaan groeperen per event-blok (split op lege regel) en alle `data:`-regels concatten vóór JSON.parse.
- **Buffer-flush bij stream-einde** — als de stream sluit zonder afsluitende newline, worden laatste bytes nu genegeerd. We voegen een `flushBuffer()` toe die na de while-loop wordt aangeroepen.
- **Nette herstelmelding** — bij netwerk- of parse-fout tonen we naast de bestaande toast nu ook een inline assistant-bubble met "Er ging iets mis tijdens het antwoorden. Probeer het opnieuw." in plaats van het halve antwoord stilletjes weg te gooien. De gebruikersvraag blijft staan in plaats van te resetten, zodat hij opnieuw kan verzenden.
- Er komt een unit-testbestand `useHelpChat.parser.test.ts` dat fragmentatie, CRLF, multi-line events, `[DONE]`, en partial JSON dekt.

### 2) Automatische route-registratie

Dubbele URL's worden vermeden door **één bron van waarheid** in plaats van twee.

**Aanpak**: `src/lib/modules.ts` wordt uitgebreid met optionele velden per module:

```ts
interface ModuleDefinition {
  // bestaand…
  primaryPath?: string;        // bijv. "/offertes"
  extraPaths?: { path: string; label: string; howTo?: string }[];
  howTo?: string;              // korte uitleg voor help-assistent
}
```

De edge function `help-assistant` haalt deze data niet meer uit een handmatig dubbele lijst, maar uit een **gegenereerd kennisbestand** `supabase/functions/help-assistant/help-knowledge.generated.ts` dat we **vanuit `src/lib/modules.ts` afleiden**.

Omdat edge functions geen import uit `src/` mogen hebben, lossen we dit op met een bouwscript:

- `scripts/generate-help-knowledge.ts` (Node + ts-node via `tsx`) leest `src/lib/modules.ts`, transformeert naar plain JSON-objecten en schrijft naar `supabase/functions/help-assistant/help-knowledge.generated.ts`.
- We voegen een `predev`/`prebuild` npm-script toe: `"prebuild": "tsx scripts/generate-help-knowledge.ts"` zodat het bestand altijd vers is.
- De bestaande `help-knowledge.ts` houden we als **wrapper** die uit het generated-bestand exporteert + `buildHelpSystemPrompt` levert. Geen handmatige duplicatie meer.

**Resultaat**: nieuwe module toevoegen = één entry in `src/lib/modules.ts` met `primaryPath` + `howTo`. De assistent kent hem automatisch bij de volgende build. Routes in `App.tsx` blijven leidend voor de router; modules.ts blijft puur metadata.

Voor routes die niet 1-op-1 een module zijn (bv. `/offertes/nieuw`), gebruiken we `extraPaths` per module zodat de assistent specifieke deeplinks blijft suggereren.

### 3) Testplan & QA-check (Playwright + handmatige checklist)

**Geautomatiseerd** — `tests/help-assistant.spec.ts` (Playwright):
1. Login als partner_admin → controleer dat de help-knop rechtsonder zichtbaar is op `/dashboard`.
2. Open paneel, verstuur "Waar maak ik een offerte?" → wacht op assistant-bubble met markdown-link → assert dat link `href="/offertes/nieuw"` heeft.
3. Klik de link → assert dat URL verandert naar `/offertes/nieuw` zonder full reload (geen `window` navigation event) én dat het Sheet-paneel sluit.
4. Verstuur opnieuw → assert dat geschiedenis behouden blijft (assertion op aantal bubbles).
5. Klik "Wis gesprek" → assert dat `localStorage.getItem('help-chat:{id}')` leeg is.
6. Mobiele viewport (375×812): herhaal stap 1-3, assert dat Sheet full-screen is en links nog werken.
7. Mock 429-respons via route-intercept → assert toast "Even druk".
8. Mock netwerkfout midden in stream → assert herstelmelding-bubble verschijnt.

**Unit (Vitest)** — `useHelpChat.parser.test.ts`:
- chunk-splits midden in JSON → één delta na hereniging
- CRLF-only stream
- multi-line `data:` blok
- `[DONE]` zonder trailing newline
- onbekende velden in choices → geen crash

**Handmatige QA-checklist** (in `docs/qa/help-assistant.md`):
- [ ] Knop verborgen op `/`, `/login`, `/offerte/:token`, `/embed/...`
- [ ] Knop verborgen voor rol `consument`
- [ ] AI noemt nooit pagina's waar de gebruiker geen toegang toe heeft (test met installateur-account)
- [ ] Esc sluit paneel; Tab-focus blijft binnen Sheet
- [ ] Geschiedenis blijft na refresh
- [ ] Op mobiel (≤768px) is Sheet full-screen, input bereikbaar boven keyboard

### Te wijzigen / nieuwe bestanden

**Wijzigen**
- `src/components/help/useHelpChat.ts` — multi-line event-parser, buffer-flush, herstelmelding-bubble
- `src/lib/modules.ts` — velden `primaryPath`, `extraPaths`, `howTo` toevoegen + waarden invullen
- `supabase/functions/help-assistant/help-knowledge.ts` — wordt thin wrapper rond `help-knowledge.generated.ts`
- `package.json` — `tsx` als devDep + `prebuild` script
- `playwright.config.ts` — alleen als nodig (er bestaat al een `playwright-fixture.ts`)

**Nieuw**
- `scripts/generate-help-knowledge.ts` — codegen-script
- `supabase/functions/help-assistant/help-knowledge.generated.ts` — auto-gegenereerd (in git, met header "DO NOT EDIT")
- `src/components/help/useHelpChat.parser.test.ts` — vitest
- `tests/help-assistant.spec.ts` — Playwright e2e
- `docs/qa/help-assistant.md` — handmatige checklist

### Niet-doelen
- Geen vector-DB / embeddings — knowledge blijft statisch en build-time.
- Geen wijzigingen aan rollen/RLS — alle filtering blijft client-side via rol + moduleSet doorgegeven aan de edge function.
- Geen wijziging aan AI-model of system-prompt-structuur, alleen de **bron** van de modules-tabel.

