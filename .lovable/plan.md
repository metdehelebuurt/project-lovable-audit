

## Plan: Fix gegenereerde datasheet opslag + per-partner datasheet support

### Probleem gevonden

De gegenereerde datasheet wordt **niet opgeslagen** omdat het product een catalogusproduct is (`partner_id = null`). De RLS-policy op `producten` staat alleen updates toe als `partner_id = get_user_partner_id(auth.uid())`, maar `null != jouw_partner_id` is altijd false. De PATCH wordt dus stilletjes geweigerd door de database.

Daarnaast: je wilt per partner een eigen datasheet, maar `datasheet_type` zit op de gedeelde `producten` rij — dat werkt niet voor meerdere partners.

### Oplossing

**1) Nieuwe tabel `partner_product_datasheets`**

Slaat per partner/product-combinatie op of er een datasheet is gegenereerd of geüpload.

```text
partner_product_datasheets
├── id (uuid PK)
├── partner_id (uuid, FK → partners)
├── product_id (uuid, FK → producten)
├── datasheet_type ('fabrikant' | 'gegenereerd')
├── datasheet_url (text, nullable — pad naar PDF in storage)
├── generated_specs (jsonb, nullable — snapshot van specs bij generatie)
├── created_at / updated_at
└── UNIQUE(partner_id, product_id)
```

RLS: partner users zien/bewerken alleen eigen partner records.

**2) Update edge function `ai-verify-product-specs`**

Na het opslaan van specs, ook een record upserten in `partner_product_datasheets` met `datasheet_type = 'gegenereerd'` en de gegenereerde specs als snapshot. Dit gebruikt service role, dus geen RLS-probleem.

**3) Update `ProductDetail.tsx` — Datasheet tab**

- Bij laden: check `partner_product_datasheets` voor de huidige partner + product combinatie
- `handleGenerateDatasheet`: stuur `partner_id` mee naar de edge function, na succes refetch de partner-datasheet data
- `handleFileUpload`: upload naar `partner-assets/{partner_id}/datasheets/{product_id}.pdf` en upsert in `partner_product_datasheets`
- Inline preview: toon `ProductDatasheet` component direct als `datasheet_type === 'gegenereerd'` (geen apart PDF-bestand nodig voor preview, de specs staan in de snapshot)
- Voor "echte PDF": voeg een "PDF opslaan" knop toe die via `html2canvas` + `jsPDF` de React-component rendert naar een PDF en uploadt naar storage

**4) Installeer `html2canvas` + `jspdf`**

Voor het genereren van echte PDF-bestanden vanuit de ProductDatasheet React-component.

**5) Update `OffertePDFPreview.tsx`**

Bij het renderen van datasheets in offertes: check `partner_product_datasheets` in plaats van `producten.datasheet_type`.

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| SQL migratie | Nieuwe tabel `partner_product_datasheets` + RLS |
| `supabase/functions/ai-verify-product-specs/index.ts` | Upsert in `partner_product_datasheets` na specs-opslag |
| `src/pages/ProductDetail.tsx` | Gebruik nieuwe tabel, fix inline preview, PDF-export |
| `src/components/OffertePDFPreview.tsx` | Check partner-datasheets tabel |
| `package.json` | Toevoegen `html2canvas` + `jspdf` |

