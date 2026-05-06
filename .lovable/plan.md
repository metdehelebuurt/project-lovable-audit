## Productcatalogus-webtool — bouwplan

Een nieuwe webtool waarmee partners hun assortiment, merkenpagina's en converterende productpagina's op hun eigen site kunnen tonen. Twee distributievormen naast elkaar (embed-script én REST API per partner), volledig in eigen huisstijl, met AI-gegenereerde marketingcontent, automatisch gekoppelde calculators, vergelijker en lead → conceptofferte-flow. Achter FeatureGate add-on.

### 1. Wat partners ervaren

**In het platform — nieuw onder Producten + Webtools:**

- Op elke productkaart een nieuw blok **"Op mijn website"** met:
  - Toggle "Tonen op website" (per product)
  - Bulkacties op de productlijst: "Toon alle Daikin", "Verberg categorie X"
  - Marketingvelden (los van offerte-tekst): korte pitch, lange omschrijving (rich text/Tiptap), 3–5 USP's, FAQ-blok
  - Knop **"AI-content genereren"**: stuurt productspecs + merk + categorie naar Lovable AI en stelt pitch + omschrijving + USP's + FAQ voor; partner kan accepteren/bewerken
  - Verplichte AI-disclaimer onder gegenereerde content (project-regel)
  - Eigen URL-slug per product (auto van naam, handmatig overschrijfbaar)

- In **Webtools** een nieuwe template-kaart **"Productcatalogus"** (naast de bestaande 6). Bij aanmaken kiest partner welke onderdelen in de embed: catalogus, merkenpagina, productdetail, vergelijker (alle 4 default aan).
- Configurator: huisstijl-overrides (kleuren, font, hoekradius) bovenop auto-branding, leadnotificatie-mail, zichtbare filters (categorie/merk/prijs), default sortering.
- Tab **"API-toegang"** in de webtool: toont per-partner API-token (genereren/roteren), basis-URL, voorbeeldrequests in cURL/JS, rate-limit-info.

**Op de site van de bezoeker:**

- `/catalogus` — grid met filter (categorie, merk, prijs), zoek, sortering
- `/merken/{merk-slug}` — merkenpagina met logo/intro + producten van dat merk
- `/p/{product-slug}` — productdetail met: hero (afbeeldingen carousel), pitch, USP's, prijs vanaf, specs-tabel, datasheet (PDF-viewer), FAQ, gerelateerde producten, **CTA's**: "Offerte aanvragen", "Vergelijken toevoegen", en automatisch onder detail de juiste **calculator** op basis van producttype (zonnepaneel / warmtepomp / isolatie / laadpaal / batterij), voorgevuld met productspecs.
- `/vergelijken` — tot 3 producten van dezelfde categorie naast elkaar met spec-tabel; één gezamenlijke "Offerte aanvragen"-CTA.

### 2. Lead-routering

Aanvraagknop op productpagina → `widget-submit` (uitgebreid):
1. Maak lead aan met productinteresse en bron `Webshop {productnaam}`.
2. Maak **direct een conceptofferte** aan (status `concept`), met het aangevraagde product als regel, gebruikt `partner_product_teksten` voor omschrijving.
3. Stuur leadnotificatie-mail naar partner via bestaande partner-emailflow (Gmail/Graph/SMTP — niet via platformmails).
4. Bezoeker krijgt bevestigingsscherm: "Je offerte staat klaar, je hoort binnen X uur van {partnernaam}".

### 3. Twee distributievormen

**A. Embed (zoals huidige webtools)**
- Script-snippet → laadt iframe `mijnhuis.nu/embed/catalogus/{widget_id}` (en routes voor `/p/{slug}`, `/merken/{slug}`, `/vergelijken`).
- Iframes auto-resize via postMessage (zoals bestaande embeds).

**B. REST API per partner**
- Basis-URL: `https://api.mijnhuis.nu/v1/...` (Edge Function `partner-api`).
- Auth: `Authorization: Bearer {partner_api_token}` — token is per partner, te roteren vanuit de webtool-config.
- Endpoints (read-only + lead create):
  - `GET /products` (filters: `categorie`, `merk`, `q`, `page`)
  - `GET /products/{slug}`
  - `GET /brands` / `GET /brands/{slug}`
  - `GET /categories`
  - `POST /leads` (zelfde validatie als widget-submit)
- Rate limit per token: 60 req/min (in-memory + DB-counter).
- Alleen producten van die partner met `toon_op_website=true` worden geretourneerd.

### 4. Toegang & abonnement

- Add-on `webshop_module` via FeatureGate (zoals andere add-ons).
- Zonder add-on: partner ziet de webtool-template, maar publish-knop is gedisabled met upsell-CTA. Productinstellingen (toggle, marketingteksten) blijven configureerbaar zodat ze klaarstaan.
- API-token alleen genereerbaar mét add-on actief.

### 5. Database (migratie)

Nieuwe kolommen op `producten`:
- `toon_op_website boolean default false`
- `website_slug text` (unique per partner)
- `website_pitch text`, `website_omschrijving text`, `website_usps jsonb` (array van strings), `website_faq jsonb` (array van `{vraag, antwoord}`)
- `website_ai_gegenereerd boolean default false` (voor disclaimer-tracking)

Nieuwe tabellen:
- `partner_merken` — `id, partner_id, merk, slug, logo_url, intro_html, toon_op_website` (één rij per merk, voor de merkenpagina; auto-aangemaakt op basis van bestaande merken in producten)
- `partner_api_tokens` — `id, partner_id, token_hash, label, last_used_at, created_at, revoked_at`
- `partner_api_rate_log` — `partner_id, minute_bucket, count` (voor rate limiting)
- `webshop_lead_bron` — koppeling lead ↔ aangevraagd product_id (voor conversie-analytics)

Nieuwe enum-waarde voor `web_widgets.type`: `productcatalogus`.

RLS: alle nieuwe tabellen partner-scoped; `producten_publiek` view uitbreiden met website-velden voor publieke toegang (alleen waar `toon_op_website=true`).

### 6. Edge Functions (nieuw)

- `productcatalogus-public` — publieke read-API voor embed (catalogus/merken/detail), gebruikt service-role + filtert op `toon_op_website` + `widget_id` → `partner_id`.
- `partner-api` — REST API per partner (token-auth, rate limit, dezelfde data als public maar via token i.p.v. widget_id).
- `ai-product-marketing` — AI-content genereren (pitch/omschrijving/USP's/FAQ) via Lovable AI Gateway (`google/gemini-3-flash-preview`, met optie pro voor "uitgebreid").
- `widget-submit` uitbreiden — bij `widget.type='productcatalogus'`: ook conceptofferte aanmaken.
- `partner-api-token-manage` — token genereren/roteren/intrekken.

### 7. Frontend (nieuw / gewijzigd)

Nieuw:
- `src/pages/embed/EmbedCatalogus.tsx` — public embed root (router naar list/detail/vergelijken/merken)
- `src/pages/embed/CatalogusList.tsx`, `ProductDetail.tsx`, `MerkenPagina.tsx`, `Vergelijker.tsx`
- `src/components/producten/WebsiteContentTab.tsx` — toggle, marketingvelden, AI-knop, slug
- `src/components/producten/BulkWebsiteActies.tsx` — bulk toggle per merk/categorie
- `src/components/webtools/CatalogusConfigurator.tsx` — branding-overrides, zichtbare modules, leadmail
- `src/components/webtools/ApiTokenTab.tsx` — token-beheer + voorbeeldrequests
- `src/pages/Merken.tsx` — beheer merkenpagina's (logo, intro per merk)

Gewijzigd:
- `src/pages/WebTools.tsx` — nieuwe template-kaart (icoon `Store`)
- `src/pages/ProductDetail.tsx` — nieuwe tab "Op mijn website"
- `src/pages/Producten.tsx` — kolom + bulk-acties
- `src/lib/abonnementFeatures.ts` — `webshop_module` add-on key
- Nieuwe routes in `App.tsx`: `/embed/catalogus/:widgetId/*`, `/merken`

Bestandsregels: max 800 regels per bestand, max 50 per functie — embed-componenten splitsen in subfolders met index.tsx.

### 8. Architectuur

```text
Partner-portaal                 Bezoeker (partnersite)
─────────────                   ──────────────────────
ProductDetail                   <script> embed  ──┐
  └ WebsiteContentTab           OF                ├─► iframe / API call
      ├ toggle                  REST API          │
      ├ marketingvelden                           ▼
      ├ AI-knop ─► ai-product-marketing  productcatalogus-public
      └ slug                                      │   (widget_id)
                                partner-api ──────┤   (token + rate limit)
WebTools                                          │
  └ CatalogusConfigurator                         ▼
  └ ApiTokenTab                          producten + partner_merken
                                         (filter: toon_op_website)
                                                  │
                                         Lead aanvraag
                                                  ▼
                                         widget-submit
                                           ├ leads insert
                                           ├ offertes insert (concept)
                                           └ partner-email-send (leadmail)
```

### 9. Bouwvolgorde

1. Migratie (kolommen + tabellen + enum + RLS + view-update)
2. `WebsiteContentTab` + slug + bulkacties (zonder AI nog)
3. `productcatalogus-public` Edge Function + embed-pagina's (catalogus + detail)
4. `widget-submit` uitbreiden met conceptofferte-aanmaak
5. Calculator-koppeling per producttype op detailpagina
6. Vergelijker
7. `ai-product-marketing` + AI-knop in `WebsiteContentTab`
8. Merkenpagina-beheer + merken-route
9. `partner-api` + `partner-api-token-manage` + ApiTokenTab
10. FeatureGate `webshop_module` + upsell-states
11. QA: embed in test-pagina, API met curl, conversieflow end-to-end

### 10. Open punten (kies tijdens bouw, geen blokker)

- Domein API: `api.mijnhuis.nu` subdomein (vereist DNS) of pad onder bestaande functions-host. Default = pad onder functions tot DNS klaar is.
- Limiet aantal producten "tonen op website" per abonnementniveau — voorstel: onbeperkt voor nu, later inperken via `useSubscriptionLimits` als nodig.
- SEO publieke detail-URL's op mijnhuis.nu: voorlopig niet (alles via iframe/API). Later eventueel `/p/{partner-slug}/{product-slug}` als losse vervolgstap.
