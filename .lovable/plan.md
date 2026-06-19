## Doel
Een handmatige "Koude leads zoeker" toevoegen in de affiliate-omgeving waarmee je via Firecrawl openbare websites doorzoekt op bedrijven in de duurzaamheidsbranche (zonnepanelen, thuisbatterijen, laadpalen, isolatie, warmtepompen). Je kiest welke resultaten je wilt overnemen — ze landen 1-op-1 in de bestaande koude-leadspool, zodat de rest van de pipeline (claim, AI-score, opvolging) gewoon doorwerkt.

Firecrawl is al gekoppeld aan dit project (`Firecrawl PROD`). Geen extra connectie nodig.

## Flow voor de affiliate
1. Nieuwe knop **"Leads zoeken met AI"** op `/affiliates/pool`, naast "Nieuwe koude lead".
2. Opent een dialog met:
   - **Branche** (multi-select: zonnepanelen, thuisbatterijen, laadpalen, isolatie, warmtepompen, overig)
   - **Regio / plaats** (vrij tekstveld, optioneel)
   - **Zoekopdracht** (vrij tekstveld, auto-ingevuld op basis van branche + regio, bv. *"installateur zonnepanelen Limburg"*)
   - **Aantal resultaten** (5 / 10 / 20)
   - **Bron-modus**:
     - *Web-zoekopdracht* (Firecrawl `search` + scrape van top resultaten)
     - *Specifieke website scrapen* (URL invoeren, bv. een branchegids → Firecrawl `scrape` of `crawl` met limiet)
3. **Resultaten-tabel** (na zoeken):
   - Bedrijfsnaam, website, e-mail, telefoon, plaats, branche-tag, kort fragment
   - Per rij badge: *Nieuw* / *Bestaat al* (check tegen `affiliate_leads.website/email/telefoon`)
   - Checkboxes om te selecteren
4. Knop **"Geselecteerde toevoegen aan pool"** → insert in `affiliate_leads` met `bron = 'eigen_import'`, `status = 'nieuw'`, `eigenaar_id = null` (pool) of de huidige user (mijn pijplijn) — keuze in dialog.
5. Toast met aantal toegevoegd + automatische refresh van pool.

## Architectuur

### Edge Function: `affiliate-firecrawl-zoek`
- Auth: vereist ingelogde gebruiker (verifyJWT in code, anonkey check).
- Input (Zod-gevalideerd):
  ```ts
  { modus: 'search' | 'scrape', query?: string, url?: string,
    branches: string[], regio?: string, limit: number (max 20) }
  ```
- Logica:
  - **search-modus**: `POST https://api.firecrawl.dev/v2/search` met `query`, `limit`, `scrapeOptions: { formats: ['markdown'] }`.
  - **scrape-modus**: `POST https://api.firecrawl.dev/v2/scrape` met `formats: ['markdown', 'links']`, voor diepere extractie eventueel `crawl` met `limit: 10`.
- **Extractie** van bedrijven uit de markdown via Lovable AI Gateway (Gemini Flash, gratis tier):
  - Prompt: extraheer JSON-array `{bedrijfsnaam, website, email, telefoon, plaats, branche, fragment}` uit de scraped content; alleen Nederlandse bedrijven; sla resultaten zonder bedrijfsnaam over.
  - Gebruik `tool_choice` / structured output via Zod-schema.
- Response: `{ leads: ExtractedLead[], creditsUsed, bron }`.
- Foutafhandeling: 402 (Firecrawl credits op) → duidelijke melding aan client; CORS-headers via `npm:@supabase/supabase-js@2/cors`.

### Frontend
- `src/components/affiliate/KoudeLeadsZoekDialog/`
  - `index.tsx` — dialog-wrapper met stappen *form → resultaten*
  - `ZoekForm.tsx` — invoervelden + bron-modus
  - `ResultatenTabel.tsx` — tabel met selectie + duplicate-badges
  - `useFirecrawlZoek.ts` — TanStack Query mutation die `supabase.functions.invoke('affiliate-firecrawl-zoek', ...)` aanroept
  - `useDuplicaatCheck.ts` — query op `affiliate_leads` voor email/telefoon/website matches
- Hergebruik bestaande `useCreateAffiliateLead` (in bulk via `Promise.all`) voor de import.
- Knop toegevoegd in `src/pages/affiliate/AffiliatePool.tsx`.

### Database
Geen schemawijzigingen nodig — leads landen in `affiliate_leads` (heeft al `website`, `branche`, `regio`, `bron`-velden). Optioneel: log naar bestaande `affiliate_lead_imports` tabel met `bestandsnaam = "firecrawl: <query>"` voor traceability.

## Veiligheid & limieten
- Firecrawl API key blijft server-side (`Deno.env.get('FIRECRAWL_API_KEY')`), nooit naar de browser.
- Per zoekopdracht max 20 resultaten, max 2 zoekacties per minuut per user (eenvoudige in-memory throttle in edge function).
- Disclaimer in dialog: *"Gegevens zijn afkomstig uit openbare bronnen. Controleer altijd of je dit bedrijf mag benaderen volgens AVG en spam-wetgeving."*
- Geen PII van particulieren scrapen — extractie-prompt filtert op bedrijfsentiteiten.

## Bestanden (binnen 800-regel limiet per file)
**Nieuw**
- `supabase/functions/affiliate-firecrawl-zoek/index.ts` (~250 regels)
- `src/components/affiliate/KoudeLeadsZoekDialog/index.tsx` (~120)
- `src/components/affiliate/KoudeLeadsZoekDialog/ZoekForm.tsx` (~140)
- `src/components/affiliate/KoudeLeadsZoekDialog/ResultatenTabel.tsx` (~130)
- `src/components/affiliate/KoudeLeadsZoekDialog/useFirecrawlZoek.ts` (~60)
- `src/components/affiliate/KoudeLeadsZoekDialog/types.ts` (~30)

**Aangepast**
- `src/pages/affiliate/AffiliatePool.tsx` — knop + dialog-trigger

## Out of scope (later)
- Automatische periodieke scraper (cron).
- Verrijken van bestaande leads via Firecrawl (`branding`, `website`-scrape voor extra context).
- AI-prescore bij import op basis van scraped inhoud.