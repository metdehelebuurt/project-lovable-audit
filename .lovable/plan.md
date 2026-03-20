

## Plan: Fix AI specificaties, verbeter specs-weergave, handmatige upload & offerte-integratie

### Problemen geïdentificeerd

1. **AI specificaties invullen werkt niet** — De edge function `ai-verify-product-specs` bootet maar geeft geen zichtbare errors in logs, wat wijst op een runtime fout bij de AI-aanroep of response parsing. De CORS headers missen de nieuwe platform headers (`x-supabase-client-platform` etc.).
2. **Specificaties-weergave niet leesbaar** — Lege groepen tonen "Nog geen waarden ingevuld" zonder context. De layout is functioneel maar kan compacter en overzichtelijker.
3. **Geen handmatige datasheet upload op ProductDetail** — De Datasheet-tab toont alleen "Geen datasheet beschikbaar" zonder upload-optie. Upload werkt alleen via `DatasheetCheckDialog` (bij offerte-aanmaak).
4. **Datasheet URL dubbelop** — `DatasheetCheckDialog` slaat de volledige `publicUrl` op, maar `ProductDetail.tsx` plakt er nogmaals de storage URL voor. Hierdoor is de URL gebroken.
5. **Handmatig geüploade datasheets niet in offerte-PDF** — De offerte-PDF checkt `p.datasheet_url && p.datasheet_type` correct, maar door de dubbele URL bug worden fabrikant-datasheets niet correct getoond.

---

### Oplossingen

#### 1. Fix CORS headers in edge function

**`supabase/functions/ai-verify-product-specs/index.ts`**

Update `corsHeaders` om de nieuwe Supabase client headers toe te voegen (dezelfde set als alle andere edge functions):
```
x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version
```

#### 2. Verbeterde specificaties read-only weergave

**`src/pages/ProductDetail.tsx`** — Specificaties tab

- Compactere layout: alle groepen (ook lege) tonen in een uniforme stijl
- Lege velden tonen als grijs/dash zodat je ziet wat er ontbreekt
- Betere visuele hiërarchie met kleur-accenten per groep

#### 3. Handmatige datasheet upload op ProductDetail

**`src/pages/ProductDetail.tsx`** — Datasheet tab

- Voeg een file input + upload knop toe voor PDF-upload direct op de Datasheet tab
- Bij upload: sla op als `datasheets/{productId}.pdf` in `product-images` bucket
- Sla het **relatieve pad** op in `datasheet_url` (niet de volledige URL) voor consistentie
- Na upload: invalidate query, toon preview

#### 4. Fix datasheet URL logica

**`src/pages/ProductDetail.tsx`** + **`src/components/offertes/DatasheetCheckDialog.tsx`**

- Normaliseer de URL-constructie: sla altijd het **relatieve pad** op (`datasheets/{id}.pdf`)
- Bij weergave: construeer de volledige URL vanuit het relatieve pad
- Fix `datasheetPublicUrl` berekening: check of URL al met `http` begint

#### 5. Genereer-functie direct werkend maken

**`src/pages/ProductDetail.tsx`** — Datasheet tab

- Voeg een "Genereer datasheet" knop toe die `datasheet_type = "gegenereerd"` zet en de preview dialog opent
- Na genereren: sla `datasheet_type` op zodat het in de offerte-PDF meekomt

---

### Bestanden

| Bestand | Actie |
|---------|-------|
| `supabase/functions/ai-verify-product-specs/index.ts` | Fix CORS headers |
| `src/pages/ProductDetail.tsx` | Verbeterde specs-weergave, handmatige upload, datasheet URL fix, genereer-knop |
| `src/components/offertes/DatasheetCheckDialog.tsx` | Fix: sla relatief pad op i.p.v. volledige URL |

