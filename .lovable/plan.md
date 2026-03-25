

## Plan: Afwijzingsredenen & Feedback-analyse module

### Overzicht
Drie samenhangende features: (1) reden-invoer bij status "afgewezen"/"verlopen", (2) afwijzen vanuit het klantportaal met reden, (3) een feedback-analyse pagina met stats en AI-rapport voor partner_admin.

---

### 1. Database: kolommen toevoegen aan `offertes`

SQL migratie — twee nieuwe kolommen:
```sql
ALTER TABLE public.offertes 
  ADD COLUMN afwijzing_reden TEXT,
  ADD COLUMN afwijzing_categorie TEXT;
```

Categorien: `prijs`, `concurrent`, `geen_behoefte`, `timing`, `overig` (opgeslagen als vrije tekst, UI biedt presets).

---

### 2. OfferteDetail.tsx — Reden-dialog bij status "afgewezen" of "verlopen"

Wanneer een partner de status wijzigt naar `afgewezen` of `verlopen`:
- Onderschep de `statusMutation` — in plaats van direct te updaten, open een Dialog.
- Dialog bevat: categorie-select (Prijs te hoog, Concurrent gekozen, Geen behoefte meer, Timing niet goed, Overig) + vrije tekst Textarea voor toelichting.
- Bij bevestiging: update status + `afwijzing_reden` + `afwijzing_categorie` in één call.
- Toon de reden op de detailpagina als de offerte afgewezen/verlopen is.

---

### 3. Klantportaal — Afwijzen met reden (OffertePublic.tsx + edge function)

**OffertePublic.tsx:**
- Voeg een "Offerte afwijzen" knop toe naast de accepteer-knop.
- Bij klik: open een Dialog met dezelfde categorie-opties + vrije tekst.
- Roep een nieuwe edge function aan: `offerte-reject`.

**Edge function `offerte-reject`:**
- Ontvangt `share_token`, `reden`, `categorie`.
- Valideert token, zet status op `afgewezen`, slaat reden + categorie op.
- Maakt een notificatie aan voor de adviseur: "Klant X heeft offerte Y afgewezen. Reden: ..."

---

### 4. Feedback-analyse pagina (nieuw: `OfferteFeedback.tsx`)

Nieuwe pagina `/offertes/feedback` — alleen toegankelijk voor `partner_admin` en `partner_staff`.

**Stats sectie (Recharts):**
- Pie chart: verdeling afwijzingscategorieen
- Bar chart: afwijzingen per maand (trend)
- Stat cards: totaal afgewezen, conversieratio (geaccepteerd vs totaal verzonden), meest voorkomende reden, gemiddelde offertewaarde bij afwijzing

**Tabel:**
- Lijst van afgewezen/verlopen offertes met kolommen: offertenummer, klant, bedrag, categorie, reden, datum.

**AI-rapport knop:**
- "Genereer analyse" knop roept een edge function `ai-offerte-feedback-analyse` aan.
- Die function haalt alle afgewezen offertes op (laatste 90 dagen), stuurt de redenen naar Lovable AI, en vraagt om een rapport met:
  - Hoofdredenen voor afwijzing
  - Patronen en trends
  - Concrete verbeterpunten
- Het rapport wordt als markdown weergegeven in een Card.

---

### 5. Routing & Navigatie

- `App.tsx`: route `/offertes/feedback` toevoegen met ProtectedRoute voor admin rollen.
- Sidebar/Offertes pagina: link toevoegen naar de feedback-analyse pagina.

---

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| SQL migratie | `afwijzing_reden`, `afwijzing_categorie` op `offertes` |
| `src/pages/OfferteDetail.tsx` | Reden-dialog bij statuswijziging naar afgewezen/verlopen |
| `src/pages/OffertePublic.tsx` | Afwijzen-knop + reden-dialog |
| `supabase/functions/offerte-reject/index.ts` | Nieuw: afwijzen via portal |
| `src/pages/OfferteFeedback.tsx` | Nieuw: stats + tabel + AI-rapport |
| `supabase/functions/ai-offerte-feedback-analyse/index.ts` | Nieuw: AI-analyse |
| `src/App.tsx` | Route toevoegen |
| `src/components/AppSidebar.tsx` | Link naar feedback-pagina |

