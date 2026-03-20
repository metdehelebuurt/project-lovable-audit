

## Plan: Partner-specifieke offerte_tekst & Orderbevestiging PDF

### Probleem 1: offerte_tekst is niet per partner opgeslagen
Het veld `offerte_tekst` staat op de `producten` tabel — globaal. Als meerdere partners hetzelfde product gebruiken, overschrijven ze elkaars tekst. De tekst verschijnt wel correct in de offerte-PDF (via de `regels` JSONB snapshot).

### Probleem 2: Geen orderbevestiging PDF bij opdrachten
De `OpdrachtDetail.tsx` pagina toont geen orderbevestiging-document. Er is wel een knop "Opdrachtbevestiging versturen" maar geen preview/download van het document.

---

### Oplossing 1: Partner-specifieke offerte_tekst

**Nieuwe tabel: `partner_product_teksten`**
```sql
CREATE TABLE public.partner_product_teksten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  product_id uuid NOT NULL,
  offerte_tekst text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(partner_id, product_id)
);
```
Met RLS policies die het partner-isolatie patroon volgen.

**Wijzigingen in code:**
- `ProductDetail.tsx`: sectie toevoegen om de partner-specifieke offerte_tekst in te voeren/bewerken (opslaan in `partner_product_teksten` i.p.v. `producten.offerte_tekst`)
- `OfferteNieuw.tsx` & `Offertes.tsx`: bij het selecteren van een product, eerst de partner-specifieke tekst ophalen uit `partner_product_teksten`, fallback naar `producten.offerte_tekst`
- De snapshot in `regels` JSONB blijft hetzelfde — de juiste tekst wordt al bij aanmaak opgeslagen

### Oplossing 2: Orderbevestiging PDF

**Nieuw component: `src/components/OrderbevestigingPDF.tsx`**
Een professioneel orderbevestigingsdocument met:
- Bedrijfsbranding (logo, kleuren, contactgegevens)
- Ordernummer, datum, klantgegevens
- Producttabel met offerteregels (incl. offerte_tekst)
- Totaalbedrag
- Bevestigingsdatum en -status

**Wijzigingen in `OpdrachtDetail.tsx`:**
- Knop "Orderbevestiging bekijken" toevoegen die een dialog opent met het PDF-preview component
- Knop "PDF downloaden" via `window.print()`
- Partner-branding ophalen voor de PDF

---

### Bestanden

| Bestand | Actie |
|---------|-------|
| Migratie | `partner_product_teksten` tabel + RLS |
| `src/components/OrderbevestigingPDF.tsx` | **Nieuw** — orderbevestiging layout |
| `src/pages/OpdrachtDetail.tsx` | Orderbevestiging preview/download toevoegen |
| `src/pages/ProductDetail.tsx` | Partner-specifieke offerte_tekst editor |
| `src/pages/OfferteNieuw.tsx` | Partner-tekst ophalen bij productselectie |
| `src/pages/Offertes.tsx` | Idem |

