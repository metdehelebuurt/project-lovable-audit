

## Plan: Webtools — Embeddable Contactformulier & Besparingscalculatoren

### Overzicht
Een nieuwe "Webtools" sectie op de Tools-pagina waar partners embeddable widgets kunnen configureren voor hun eigen website: een contactformulier (dat direct leads aanmaakt) en besparingscalculatoren per categorie (met commerciele CTAs). Elke widget wordt in de huisstijl van de partner gerenderd, met unieke embed-codes en volledige data-isolatie.

---

### Architectuur

```text
Partner Dashboard (Tools)          Externe Website (partner)
┌─────────────────────┐           ┌──────────────────────┐
│ Widget Configurator │           │ <iframe src="...">   │
│ - Kies type         │           │   Contactformulier   │
│ - Preview           │           │   of Calculator      │
│ - Kopieer embed     │           │   in partner-stijl   │
└─────────────────────┘           └──────────────────────┘
         │                                  │
         ▼                                  ▼
   web_widgets tabel              Edge function (public)
   (config per partner)           → insert in leads tabel
```

---

### Database

**Nieuwe tabel: `web_widgets`**
- `id` uuid PK
- `partner_id` uuid NOT NULL
- `type` enum: `contactformulier`, `calculator_zonnepanelen`, `calculator_warmtepomp`, `calculator_isolatie`, `calculator_laadpaal`
- `naam` text (label voor partner)
- `config` jsonb (extra velden aan/uit, intro-tekst, CTA-tekst, etc.)
- `actief` boolean default true
- `created_at`, `updated_at`

RLS: partner ziet/beheert alleen eigen widgets, superadmin alles.

---

### Publieke Widget Routes (geen auth)

**Nieuwe routes in App.tsx** (buiten ProtectedRoute):
- `/embed/contact/:widgetId` — Contactformulier
- `/embed/calculator/:widgetId` — Besparingscalculator

**Nieuwe componenten:**
- `src/pages/embed/EmbedContact.tsx` — Haalt widget config + partner branding op (publieke select), rendert formulier in partner-kleuren
- `src/pages/embed/EmbedCalculator.tsx` — Haalt widget config + partner op, toont calculator-stappen, laatste stap = CTA met contactformulier

Beide pagina's:
- Laden partner branding (logo, kleuren) via publieke query op `partners` + `web_widgets`
- Geen sidebar/header — standalone embed-ready pagina's
- Responsive voor iframe-embedding

---

### Edge Function: `widget-submit`

Publiek endpoint (geen JWT) dat:
1. Widget ID ontvangt + formulierdata
2. Widget ophaalt (service role) → partner_id
3. Lead aanmaakt in `leads` tabel met:
   - `partner_id` van de widget
   - `bron` = "website_widget" of "calculator_[type]"
   - `owner_user_id` = eerste partner_admin van die partner
   - Contact gegevens uit het formulier
4. Optioneel: notificatie aanmaken voor partner_admin

---

### Besparingscalculatoren

Per categorie een wizard met 3-4 stappen:
1. **Invoer**: woningtype, verbruik, huidige situatie (categorie-specifiek)
2. **Berekening**: geschatte besparing per jaar/maand, terugverdientijd
3. **Resultaat + CTA**: 
   - Besparingsoverzicht visueel (grafiek/cijfers)
   - "Vraag een vrijblijvende offerte aan" button
   - Contactformulier (naam, email, telefoon, bericht)
   - Partner branding prominent

Categorieën:
- **Zonnepanelen**: dak-orientatie, verbruik kWh, panelen → besparing
- **Warmtepomp**: woningtype, m², huidig verwarmingssysteem → besparing
- **Isolatie**: type (dak/vloer/spouw/glas), m², huidige situatie → besparing
- **Laadpaal**: km/jaar, energietarief → kostenvergelijking

---

### Widget Beheer UI (in Tools pagina)

**Nieuwe componenten:**
- `src/pages/WebTools.tsx` — Overzichtspagina met alle widgets van de partner
- `src/components/webtools/WidgetConfigurator.tsx` — Aanmaken/bewerken van widget
- `src/components/webtools/EmbedCodeDialog.tsx` — Toont iframe/script embed code + live preview

Widget configurator per type:
- Naam van de widget
- Intro-tekst aanpassen
- CTA-tekst aanpassen
- Aan/uit toggle
- Preview in partner-stijl
- Kopieer embed code (iframe snippet met unieke widget URL)

---

### Publieke RLS voor widgets

`web_widgets` en `partners` hebben een extra SELECT policy nodig voor `anon` rol zodat de embed-pagina's de config en branding kunnen laden zonder auth:

```sql
-- Publiek: actieve widgets ophalen op ID
CREATE POLICY "Publiek leest actieve widgets"
ON web_widgets FOR SELECT TO anon
USING (actief = true);

-- Publiek: partner branding lezen voor widgets  
CREATE POLICY "Publiek leest partner branding"
ON partners FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM web_widgets 
  WHERE web_widgets.partner_id = partners.id 
  AND web_widgets.actief = true
));
```

---

### Wijzigingen bestaande bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/Tools.tsx` | Nieuwe "Webtools" sectie toevoegen met cards |
| `src/App.tsx` | Publieke embed routes + WebTools route toevoegen |
| `src/components/AppSidebar.tsx` | Geen wijziging (Tools link bestaat al) |
| `supabase/config.toml` | `widget-submit` function toevoegen |

### Nieuwe bestanden
- `src/pages/WebTools.tsx`
- `src/pages/embed/EmbedContact.tsx`
- `src/pages/embed/EmbedCalculator.tsx`
- `src/components/webtools/WidgetConfigurator.tsx`
- `src/components/webtools/EmbedCodeDialog.tsx`
- `src/components/webtools/calculators/ZonnepanelenCalc.tsx`
- `src/components/webtools/calculators/WarmtepompCalc.tsx`
- `src/components/webtools/calculators/IsolatieCalc.tsx`
- `src/components/webtools/calculators/LaadpaalCalc.tsx`
- `src/components/webtools/ContactForm.tsx` (herbruikbaar in embed + calculator laatste stap)
- `supabase/functions/widget-submit/index.ts`

