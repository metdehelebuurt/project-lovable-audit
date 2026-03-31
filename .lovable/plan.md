

## Plan: Kortingen correct doorvoeren in alle PDF-views

### Gevonden problemen

1. **Offerte-niveau korting niet doorgegeven aan prijstabel templates**: In zowel `OffertePDFPreview.tsx` (regel 471) als `OffertePDF.tsx` (regel 704) ontbreken de props `offerteKortingType` en `offerteKortingWaarde` bij de `<PrijsComp>`. De korting wordt opgeslagen in `template_config.offerte_korting_type` en `template_config.offerte_korting_waarde` maar nooit uitgelezen en doorgegeven.

2. **Energieadvies investering-berekening negeert bedrag-korting**: De fallback investering-berekening (beide bestanden) gebruikt `r.korting_percentage` maar houdt geen rekening met `korting_type === "bedrag"`. Regels met een vast kortingsbedrag worden verkeerd berekend.

3. **OrderbevestigingPDF negeert bedrag-korting**: Alle subtotaal-berekeningen gebruiken alleen `korting_percentage`, niet `korting_type`/`korting_bedrag`.

### Oplossing

#### 1. Offerte-korting props doorvoeren (OffertePDFPreview.tsx + OffertePDF.tsx)

Uit `templateConfig` de offerte-korting waarden uitlezen en als props meegeven aan `PrijsComp`:

```tsx
// Toevoegen bij config/tc extractie:
const offerteKortingType = templateConfig?.offerte_korting_type || null;
const offerteKortingWaarde = templateConfig?.offerte_korting_waarde || 0;

// PrijsComp aanroep:
<PrijsComp ... offerteKortingType={offerteKortingType} offerteKortingWaarde={offerteKortingWaarde} />
```

#### 2. Energieadvies investering-berekening fixen

Vervang de simpele percentage-berekening door dezelfde `regelSub` logica die rekening houdt met `korting_type`:

```tsx
// Was:
r.aantal * r.prijs_per_stuk * (1 - r.korting_percentage / 100)

// Wordt (helper functie):
const regelSub = (r) => {
  const bruto = r.aantal * r.prijs_per_stuk;
  if (r.korting_type === "bedrag") return bruto - (r.korting_bedrag || 0);
  return bruto * (1 - (r.korting_percentage || 0) / 100);
};
```

#### 3. OrderbevestigingPDF fixen

Dezelfde `regelSub` helper toepassen voor subtotaal en BTW berekeningen.

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/OffertePDFPreview.tsx` | (1) Offerte-korting uit templateConfig halen en doorgeven aan PrijsComp; (2) Energieadvies investering-berekening fixen |
| `src/pages/OffertePDF.tsx` | (1) Offerte-korting uit config halen en doorgeven aan PrijsComp; (2) Energieadvies investering-berekening fixen |
| `src/components/OrderbevestigingPDF.tsx` | Subtotaal-berekening aanpassen voor bedrag-korting |

