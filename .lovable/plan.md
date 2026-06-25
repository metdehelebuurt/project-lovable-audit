## Doel
1. Bij elke statuswijziging naar **Verloren** een verplichte popup met reden + categorie.
2. Aparte **Lost Leads Review**-pagina, alleen toegankelijk voor `bas@mijnhuis.nu` en `superadmin`, waar verloren leads opnieuw beoordeeld worden en in vervolgbuckets gezet kunnen worden (3 maanden, 6 maanden, echt verloren, terugbellen).

## 1. Database

Nieuwe kolommen op `affiliate_leads`:
- `verloren_categorie` (enum `affiliate_verloren_categorie`: `geen_interesse`, `geen_budget`, `concurrent`, `timing`, `geen_contact`, `anders`) — verplichte reden-categorie.
- `verloren_op` (timestamptz) — wanneer op verloren gezet.
- `review_bucket` (enum `affiliate_lost_review_bucket`: `te_beoordelen`, `terugbellen`, `wacht_3_maanden`, `wacht_6_maanden`, `echt_verloren`) default `te_beoordelen`.
- `review_door_id` (uuid → users.id), `review_op` (timestamptz), `review_notitie` (text).
- `terug_in_pipeline_op` (date) — datum waarop een lead met bucket `wacht_3/6_maanden` of `terugbellen` weer opgepakt moet worden.

Trigger: zodra `status` overgaat naar `verloren` wordt `verloren_op = now()` gezet en `review_bucket` reset naar `te_beoordelen` als die nog leeg is.

RLS: bestaande affiliate-policies blijven gelden voor eigen leads. Extra policy op `affiliate_leads` voor de review-tabel: `SELECT` en `UPDATE` (alleen review-kolommen) voor `superadmin` én voor de specifieke gebruiker `bas@mijnhuis.nu` via een security-definer functie `is_lost_review_admin(uid)`.

## 2. Verplichte popup bij Verloren

Nieuwe component `VerlorenRedenDialog.tsx`:
- Velden: categorie (Select, verplicht), reden (Textarea ≥ 10 tekens, verplicht).
- Wordt geopend op alle plekken waar status naar `verloren` gaat:
  - `LeadDetailBody` (Select Status → verloren).
  - `AffiliatePipeline` drag-and-drop naar Verloren-kolom.
  - `AffiliateBellen` uitkomst "Niet interessant" (vervangt de huidige inline-notitie-check).
  - `UitkomstSoundboard` "Niet interessant".
- Bij opslaan: `update({ status: "verloren", verloren_reden, verloren_categorie })` + entry in `affiliate_lead_contactmomenten`.
- Annuleren = status blijft ongewijzigd.

## 3. Lost Leads Review-pagina

Route: `/affiliate/verloren-review` (en `/admin/affiliate/lost-review` alias).

Toegang via `ProtectedRoute`: `allowedRoles=["superadmin"]` OR e-mail = `bas@mijnhuis.nu`. We voegen een kleine helper toe (`useIsLostReviewAdmin`) die zowel rol als e-mail checkt.

Layout:
- **Header** met counts per bucket.
- **Kanban met 5 kolommen**: `Te beoordelen`, `Terugbellen`, `Wacht 3 mnd`, `Wacht 6 mnd`, `Echt verloren`.
- Lead-kaarten tonen: bedrijfsnaam, affiliate-eigenaar, verloren_op, categorie, reden (kort), waarde.
- Drag-and-drop verplaatst lead tussen buckets → update `review_bucket` + zet `terug_in_pipeline_op` automatisch (3/6 mnd vanaf nu, of NULL voor echt_verloren).
- Klik op kaart → opent volledige LeadDetail in drawer/modal.
- Filters: affiliate-eigenaar, categorie, datumrange.

## 4. Automatische herinneringen (lichte uitbreiding)
De bestaande `affiliate-opvolg-cron` krijgt een extra check: leads met `review_bucket IN (terugbellen, wacht_3_maanden, wacht_6_maanden)` en `terug_in_pipeline_op <= today` → status terug op `nieuw`, `review_bucket` op `te_beoordelen`, notificatie naar affiliate-eigenaar.

## Technische details

```text
affiliate_leads
  ├ status: verloren  ──trigger──▶  verloren_op = now()
  ├ verloren_categorie  ── verplicht via dialog
  ├ verloren_reden      ── verplicht via dialog
  ├ review_bucket       ── default te_beoordelen
  └ terug_in_pipeline_op
```

```text
/affiliate/verloren-review (alleen bas + superadmin)
 ┌───────────────┬─────────────┬─────────────┬─────────────┬───────────────┐
 │ Te beoordelen │ Terugbellen │ Wacht 3 mnd │ Wacht 6 mnd │ Echt verloren │
 └───────────────┴─────────────┴─────────────┴─────────────┴───────────────┘
```

## Bestanden

Nieuw:
- `supabase/migrations/…_lost_review.sql`
- `src/components/affiliate/VerlorenRedenDialog.tsx`
- `src/pages/affiliate/LostReview/index.tsx`
- `src/pages/affiliate/LostReview/ReviewKolom.tsx`
- `src/pages/affiliate/LostReview/ReviewKaart.tsx`
- `src/hooks/affiliate/useLostReview.ts`
- `src/hooks/affiliate/useIsLostReviewAdmin.ts`

Aangepast:
- `src/lib/affiliate/leadStatus.ts` (categorie-enums export).
- `src/components/affiliate/LeadDetailBody.tsx` (popup-trigger).
- `src/components/affiliate/UitkomstSoundboard.tsx` (popup-trigger).
- `src/pages/affiliate/AffiliateBellen.tsx` (popup-trigger).
- `src/pages/affiliate/AffiliatePipeline.tsx` (popup bij drop op Verloren).
- `src/App.tsx` (route).
- `src/components/affiliate/AffiliateSubnav.tsx` (link "Verloren review", alleen voor admins).
- `supabase/functions/affiliate-opvolg-cron/index.ts` (terug-in-pipeline check).

## Vraag
Akkoord met deze opzet, of wil je de bucket-namen / categorieën aanpassen?