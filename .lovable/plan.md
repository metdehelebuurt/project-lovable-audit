

## Plan: Configureerbare betaalvoorwaarden per partner

### Concept
Partners kunnen in Instellingen hun eigen betaalvoorwaarden beheren: standaardopties + custom voorwaarden, met één als standaard gemarkeerd. Deze worden als dropdown gebruikt bij offertes en orders.

### 1. Database: nieuw JSONB-veld op `partners`

Migratie toevoegt aan `partners`:
```sql
ALTER TABLE public.partners 
ADD COLUMN betalingsvoorwaarden_config jsonb 
DEFAULT '[
  {"label":"30 dagen netto","standaard":true},
  {"label":"14 dagen netto","standaard":false},
  {"label":"50% vooruit, 50% na installatie","standaard":false},
  {"label":"Bij oplevering","standaard":false}
]'::jsonb;
```

Structuur: array van `{ label: string, standaard: boolean }`.

### 2. Instellingen: nieuw tabblad/sectie "Betaalvoorwaarden"

**`src/components/instellingen/BetalingsvoorwaardenConfig.tsx`** (nieuw)

- Lijst van alle voorwaarden met drag/delete
- Per item: label (tekst) + radio "standaard"
- Knop "Voorwaarde toevoegen" voor custom tekst
- Opslaan naar `partners.betalingsvoorwaarden_config`

### 3. Offertes & orders: dropdown i.p.v. vrij tekstveld

Wijzigingen in `OfferteNieuw.tsx`, `Offertes.tsx`, `Affiliates.tsx`:
- Haal `betalingsvoorwaarden_config` op uit partner
- Vervang het `<Input>` veld door een `<Select>` dropdown met de geconfigureerde opties
- Default waarde = de optie met `standaard: true`
- Optie "Anders..." die een vrij tekstveld toont

`OrderbevestigingPDF.tsx` toont al de betalingsvoorwaarden uit de offerte — geen wijziging nodig.

### Bestanden

| Bestand | Actie |
|---------|-------|
| Migratie | `betalingsvoorwaarden_config` kolom op partners |
| `src/components/instellingen/BetalingsvoorwaardenConfig.tsx` | **Nieuw** — configuratie-UI |
| `src/pages/Instellingen.tsx` | Sectie toevoegen voor partner_admin |
| `src/pages/OfferteNieuw.tsx` | Input → Select dropdown |
| `src/pages/Offertes.tsx` | Input → Select dropdown |
| `src/pages/Affiliates.tsx` | Input → Select dropdown |

