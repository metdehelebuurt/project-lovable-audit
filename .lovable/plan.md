# AI-mailtemplate verbeteraar met persoonlijk geheugen

Een AI-assistent in de WYSIWYG-editor van zowel de affiliate- als sales-mailtemplates die het onderwerp + body herschrijft op basis van doel, schrijfstijl, doelgroep en conversiedoel. Per gebruiker wordt **schrijfstijl-feedback** opgeslagen zodat elke volgende generatie consistenter wordt met de voorkeuren van die specifieke gebruiker.

## Wat de gebruiker kan

In een nieuwe **"AI verbeteren"**-knop in de top-bar van `TemplateEditor` opent een rechter-zijpaneel met:

1. **Doel van de mail** (vrij tekstveld + presets: "afspraak inplannen", "review vragen", "lead heractiveren", "demo bevestigen", "no-show opvolgen", "warm houden")
2. **Schrijfstijl** (chips, multi-select): zakelijk · persoonlijk · kort & krachtig · empathisch · urgentie · vriendelijk-direct · storytelling
3. **Doelgroep** (chips): particulier · zzp · MKB · woningcorporatie · architect · adviseur
4. **Conversie-element** (chips): duidelijke CTA-knop · agenda-link · tel-link · social proof · scarcity · garantie
5. **Lengte** (slider): zeer kort / gemiddeld / uitgebreid
6. **Vrije instructie** (textarea: "noem altijd subsidieregeling 2026", "begin met de voornaam", etc.)
7. **Knoppen**: `Genereer verbetering`, `Pas alleen onderwerp aan`, `Maak A/B-variant`

Onder de knop een **diff-weergave** (oud → nieuw) met `Toepassen` / `Verwerpen` / `Regenereer met extra hint`.

Onderaan het paneel: **"Mijn AI-schrijfstijl"** — een levende samenvatting van wat het systeem over de stijl van deze gebruiker heeft geleerd, met knop `Bewerken` en `Reset`.

## Hoe het leert per gebruiker

Drie soorten signalen worden per `user_id` opgeslagen in `ai_template_schrijfstijl`:

- **Expliciete feedback**: na elke "Toepassen" of "Verwerpen" vraagt een micro-prompt "Wat vond je hier goed/slecht aan?" (1 zin, optioneel).
- **Impliciete edits**: wanneer de gebruiker de AI-output handmatig aanpast vóór opslaan, wordt de diff tussen AI-suggestie en uiteindelijke versie als leermoment vastgelegd.
- **Voorkeursinstellingen**: gekozen schrijfstijl/doelgroep/lengte worden geaggregeerd → meest gekozen waarden worden defaults.

De edge function `ai-template-verbeteren` consolideert deze signalen periodiek tot een **stijlprofiel** (max ~1500 tokens samenvatting per gebruiker) dat als system-prompt-suffix wordt meegestuurd bij elke generatie. Zo blijft de prompt compact terwijl de AI weet:
> "Deze gebruiker schrijft graag persoonlijk, opent met voornaam, vermijdt uitroeptekens, eindigt altijd met een vraag, gebruikt zelden emoji."

## Werking AI-call

Edge function `ai-template-verbeteren` (Lovable AI Gateway, model `google/gemini-3-flash-preview`):

- input: `template_key`, `huidige_onderwerp`, `huidige_body_html`, `doel`, `stijl[]`, `doelgroep[]`, `conversie[]`, `lengte`, `vrije_instructie`, `mode` (`volledig` | `alleen_onderwerp` | `ab_variant`), `feedback_hint`
- bouwt prompt met:
  - system: rol + huisstijl-regels + Nederlandse tone-of-voice + variabele-syntax `{{...}}`
  - system-suffix: stijlprofiel van deze user
  - few-shot: laatste 3 goedgekeurde edits van deze user (als die er zijn)
  - user: huidige template + instructies
- output via AI SDK `Output.object`: `{ onderwerp, body_html, uitleg, vertrouwen, suggesties[] }`
- response wordt gelogd in `ai_template_generaties` (input + output + status)

## Database

Drie nieuwe tabellen in `public`, allemaal met RLS op `user_id = auth.uid()`:

```sql
ai_template_schrijfstijl    -- 1 rij per user, stijlprofiel samenvatting + voorkeuren JSONB
ai_template_generaties      -- log van elke AI-call (input, output, status: toegepast/verworpen/bewerkt)
ai_template_feedback        -- losse feedback-zinnen ("dit was te formeel", "perfecte CTA")
```

Periodieke consolidatie: bij elke 5e nieuwe feedback/generatie wordt het stijlprofiel her-samengevat door een aparte AI-call (`ai-stijlprofiel-consolideren`).

## Bestanden

**Nieuw:**
- `supabase/migrations/<ts>_ai_template_verbetering.sql` — 3 tabellen + RLS + grants
- `supabase/functions/ai-template-verbeteren/index.ts` — hoofdcall
- `supabase/functions/ai-stijlprofiel-consolideren/index.ts` — periodieke samenvatting
- `src/components/mailtemplates/AiVerbeterPaneel/index.tsx` — zijpaneel-UI (gedeeld tussen affiliate + sales)
- `src/components/mailtemplates/AiVerbeterPaneel/DoelStap.tsx`
- `src/components/mailtemplates/AiVerbeterPaneel/StijlChips.tsx`
- `src/components/mailtemplates/AiVerbeterPaneel/DiffWeergave.tsx`
- `src/components/mailtemplates/AiVerbeterPaneel/StijlprofielSamenvatting.tsx`
- `src/hooks/mailtemplates/useAiVerbeterTemplate.ts` — mutation
- `src/hooks/mailtemplates/useAiSchrijfstijl.ts` — read/write profiel
- `src/lib/mailtemplates/diffHtml.ts` — kleine HTML-diff helper

**Aanpassen:**
- `src/pages/affiliate/instellingen/Mailtemplates/TemplateEditor.tsx` — knop `AI verbeteren` + paneel inhaken
- `src/pages/sales/SnippetsBeheer/...` of sales-equivalent (kort verifiëren waar sales-mailtemplates leven) — zelfde paneel inhaken
- `src/integrations/supabase/types.ts` — auto-regen

## Belangrijke uitgangspunten

- Werkt zowel voor affiliate-templates (`affiliate_email_templates`) als voor sales-templates — paneel is template-bron-agnostisch (krijgt `onderwerp` + `bodyHtml` props + `onApply` callback).
- Stijlprofiel is **strikt per `user_id`** — geen lekkage tussen gebruikers (RLS afgedwongen, edge function valideert JWT).
- AI Disclaimer-regel uit project-memory wordt **niet** in mail-content gepropt (geldt voor offerte-PDFs), maar in het AI-paneel zelf staat wel: *"Suggesties van AI — controleer altijd voor je verstuurt."*
- Diff toont onderwerp + body apart; gebruiker kan onderwerp of body afzonderlijk overnemen.
- Geen externe diff-library — kleine eigen helper (`diffHtml.ts`, < 80 regels) die op blok-niveau highlight.

## Open vraag (1)

Voor sales-managers: leven hun e-mailtemplates in `email_templates` (algemeen) of in een sales-specifieke tabel? Ik check kort `src/pages/sales/...` om het juiste integratiepunt te kiezen — geen aparte vraag nodig tenzij blijkt dat sales geen eigen template-editor heeft.