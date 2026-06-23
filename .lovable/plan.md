## Probleem

Pipeline en Belwerkbank voelen nu hetzelfde: beide tonen kaartjes met bedrijfsnaam, status-badges, contactknoppen en stats. Ze hebben dezelfde toonzetting, dezelfde header-stijl, en dezelfde "lijst-met-kaarten" indruk. Daardoor is het niet meteen duidelijk waar je voor welk doel naartoe gaat.

## Doel: twee duidelijk verschillende werkomgevingen

**Pipeline = strategisch overzicht.** Alle leads, alle fases, drag & drop, filters, analyse-stats. Kalm, breed, planbord-look.

**Belwerkbank = focus-modus voor vandaag bellen.** Eén lead tegelijk groot in beeld, queue-strip eronder, timer prominent, "next call" gevoel. Cockpit-look.

## Wijzigingen Pipeline (`src/pages/affiliate/AffiliatePipeline.tsx`)

Houd functionaliteit, scherp de identiteit aan:
- Titel "Sales pipeline" → **"Pipeline overzicht"** met subtitel "Strategisch overzicht van al je leads per fase".
- Subtiele icon-badge naast titel (LayoutGrid icoon in primary-tint) zodat de pagina visueel "kanban/board" uitstraalt.
- Stat-kaarten houden, maar conversie-ratio toevoegen (gewonnen / (gewonnen+verloren)).
- Kanban-kolommen krijgen een iets rustiger, "board"-achtige uitstraling (al goed, alleen bovenrand met statuskleur-accent).
- Geen timer, geen "next" actie — pipeline is reflectief, niet operationeel.

## Wijzigingen Belwerkbank (`src/pages/affiliate/AffiliateBellen.tsx`)

Verander van "lead-detail pagina met knoppen" naar **"cockpit voor vandaag"**:

1. **Header herontwerp**: groot "Belsessie" label met live klok van vandaag, voortgangsbalk (`idx+1 / queue.length`), en een prominente PRIMARY-tinted achtergrond (bv. `bg-primary/5` met border-accent) zodat de pagina direct anders voelt dan pipeline.

2. **Queue-strip bovenaan**: horizontale rij met de eerstvolgende 5-8 leads in de queue (kleine avatar-pills met bedrijfsnaam + temperatuur-dot). Huidige lead is highlighted. Geeft het "playlist/cockpit" gevoel dat pipeline niet heeft.

3. **Huidige lead-kaart groter en centraler**:
   - Bedrijfsnaam in `text-3xl` (was `CardTitle` standaard).
   - Telefoonnummer als grote klikbare "Bel nu" CTA-knop (full-width, emerald, met telefoonnummer in groot).
   - Timer prominent rechtsboven (groter, ticking).
   - Drie tabs binnen de hoofdkaart: **Gesprek** (notitie + uitkomst), **Bedrijf** (samenvatting), **Historie** (eerdere contactmomenten). Niet alles tegelijk zichtbaar — focus.

4. **Uitkomst-paneel rechts** wordt een vaste sticky sidebar met grote uitkomst-knoppen (icoon + label, h-12), niet een gewone Card. Voelt als een "soundboard".

5. **Verwijder de BelStatsBalk uit de Belwerkbank header** of verplaats naar een compacte footer-strip — stats horen meer bij Pipeline. In Belwerkbank zien we alleen "vandaag tot nu toe: X gebeld, Y afspraken" als kleine voettekst.

6. **Geen lijst-/kanban-/compact-toggle** — Belwerkbank is altijd één-lead-focus.

## Visuele tokens

Beide pagina's gebruiken bestaande semantische tokens; geen nieuwe kleuren. Verschil zit in:
- Pipeline: `bg-background`, kolommen op `bg-muted/30`, accent op statuskleur per kolom.
- Belwerkbank: hoofdkaart op `bg-primary/5` met `border-primary/20`, queue-strip op `bg-muted/40`, uitkomst-sidebar op `bg-background` met duidelijke border.

## Bestanden

- `src/pages/affiliate/AffiliatePipeline.tsx` — kleine header- en stats-aanpassing.
- `src/pages/affiliate/AffiliateBellen.tsx` — header, queue-strip, tab-indeling huidige lead, sidebar voor uitkomsten.
- Eventueel nieuw klein component `src/components/affiliate/BelQueueStrip.tsx` (< 80 regels) voor de queue-strip, omdat AffiliateBellen anders boven de 800-regel grens komt.

Geen wijzigingen in hooks, data of business logic.
