

## Plan: Offerte Template Builder + AI Intro + Deelbare Offertelink

### Overzicht

Drie grote onderdelen:
1. **Template-systeem per offertesectie** — Kies uit 3-5 designs per sectie (voorblad, productpagina, prijstabel, energieadvies, schouwrapport) met visuele thumbnails
2. **AI persoonlijke introductietekst** — Genereert automatisch een persoonlijke intro op basis van klantgegevens, notities en productcontext
3. **Unieke offertelink** — Publieke URL waar de consument de offerte kan bekijken en accepteren

---

### 1. Database wijzigingen

**Nieuwe kolommen op `offertes` tabel:**
- `template_config` (jsonb, default `{}`) — Opslaat welke template per sectie gekozen is, bijv. `{ "voorblad": "modern-dark", "producten": "grid-cards", "prijstabel": "minimal", ... }`
- `share_token` (text, nullable, unique) — Uniek token voor de deelbare link
- `share_expires_at` (timestamptz, nullable) — Verloopdatum van de deelbare link
- `accepted_at` (timestamptz, nullable) — Wanneer de consument heeft geaccepteerd
- `accepted_ip` (text, nullable) — IP-adres bij acceptatie

**Nieuwe RLS policy:**
- Anon SELECT op `offertes` WHERE `share_token` matcht (voor publieke offerte view)

### 2. Template-systeem

**Sectie-indeling (5 secties, elk 3-5 varianten):**

| Sectie | Varianten |
|--------|-----------|
| Voorblad | `hero-dark`, `hero-split`, `hero-minimal`, `hero-gradient`, `hero-photo` |
| Producten | `product-list`, `product-cards`, `product-grid`, `product-spotlight` |
| Prijstabel | `price-classic`, `price-modern`, `price-compact`, `price-detailed` |
| Energieadvies | `energy-cards`, `energy-infographic`, `energy-minimal` |
| Voorwaarden/Akkoord | `terms-simple`, `terms-boxed`, `terms-sidebar` |

**Nieuw bestand: `src/components/offertes/OfferteTemplateBuilder.tsx`**
- Volledig scherm template-configurator die opent vanuit de offerte aanmaak/bewerk flow
- Per sectie een horizontale rij van thumbnail previews (mini HTML renders met `transform: scale(0.2)` in een container)
- Klik op thumbnail = selecteer die variant
- Live preview rechts van de geselecteerde combinatie
- Slaat `template_config` JSON op in de offerte

**Thumbnails**: Gebruik kleine inline React components die exact dezelfde styling renderen als de echte PDF secties, maar verkleind in een `200x140px` container. Geen screenshots nodig — de thumbnails zijn live mini-renders van de daadwerkelijke templates.

**Nieuw bestand: `src/components/offertes/templates/` directory:**
- `VoorbladTemplates.tsx` — 5 voorblad-varianten als React components
- `ProductTemplates.tsx` — 4 product-sectie varianten
- `PrijstabelTemplates.tsx` — 4 prijstabel varianten
- `EnergieadviesTemplates.tsx` — 3 energieadvies varianten
- `VoorwaardenTemplates.tsx` — 3 voorwaarden/akkoord varianten
- `templateRegistry.ts` — Registry met alle templates, metadata, en thumbnail config

**Aanpassing `OffertePDFPreview.tsx`:**
- Leest `template_config` uit offerte record
- Rendert per sectie de juiste template-variant op basis van de config
- Alle varianten gebruiken dezelfde partner branding (kleuren, logo, fonts)

### 3. AI Persoonlijke Intro

**Nieuwe edge function: `supabase/functions/ai-offerte-intro/index.ts`**
- Input: klantgegevens (naam, adres, plaats), producten in offerte, notities, schouwdata
- Gebruikt Lovable AI (gemini-3-flash-preview) om een persoonlijke intro te schrijven
- Output: gegenereerde tekst die de gebruiker kan bewerken voor opslaan
- Prompt: "Schrijf een persoonlijke, warme introductietekst voor een offerte aan {naam} in {plaats}. Context: {producten}, {notities}. Max 3-4 zinnen, professioneel maar persoonlijk."

**UI in `OfferteNieuw.tsx`:**
- "✨ AI Intro genereren" knop naast het introductietekst veld
- Genereert tekst → plaatst in textarea → gebruiker kan aanpassen
- Werkt ook vanuit de template builder

### 4. Deelbare Offertelink

**Nieuwe publieke route: `/offerte/:token`**
- Geen auth nodig — leest offerte via `share_token`
- Toont de volledige offerte in het gekozen template-design
- "Offerte accepteren" knop → update status naar `geaccepteerd`, slaat `accepted_at` op
- Professionele, branded pagina met partner logo en kleuren

**Nieuw bestand: `src/pages/OffertePublic.tsx`**
- Publieke offerte viewer
- Haalt offerte + partner branding op via share_token
- Rendert de offerte met de opgeslagen template config
- Accepteer-knop met bevestigingsdialog

**Edge function: `supabase/functions/offerte-accept/index.ts`**
- Valideert share_token, controleert verloopdatum
- Update offerte status + accepted_at
- Stuurt optioneel notificatie naar adviseur

**UI in Offertes pagina:**
- "Link delen" knop per offerte → genereert share_token als die er nog niet is
- Kopieer-link dialog met verloopdatum instelling
- Badge die toont of een offerte via link is geaccepteerd

### 5. Wijzigingen per bestand

| Bestand | Actie |
|---------|-------|
| DB migratie | Nieuwe kolommen + RLS policies |
| `src/components/offertes/OfferteTemplateBuilder.tsx` | **Nieuw** — Template selector UI |
| `src/components/offertes/templates/*.tsx` | **Nieuw** — Template varianten (5 bestanden) |
| `src/components/offertes/templates/templateRegistry.ts` | **Nieuw** — Template metadata |
| `src/pages/OffertePublic.tsx` | **Nieuw** — Publieke offerte viewer |
| `src/components/OffertePDFPreview.tsx` | Refactor naar template-based rendering |
| `src/pages/OfferteNieuw.tsx` | Template builder integratie + AI intro knop |
| `src/pages/Offertes.tsx` | "Link delen" knop + share functionaliteit |
| `src/App.tsx` | Nieuwe routes |
| `supabase/functions/ai-offerte-intro/index.ts` | **Nieuw** — AI intro generator |
| `supabase/functions/offerte-accept/index.ts` | **Nieuw** — Offerte acceptatie |
| `supabase/config.toml` | Nieuwe functions registreren |

### Aanpak

Vanwege de omvang bouw ik dit in logische stappen:
1. Database migratie + edge functions
2. Template varianten (de 5 sectie-bestanden)
3. Template builder UI
4. AI intro functie
5. Deelbare offertelink (publieke route + acceptatie)
6. Integratie in bestaande offerte flows

