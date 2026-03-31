

## Plan: Redirect naar PDF-editor na aanmaken + Opvolgingsherinneringen

### Deel 1: Redirect naar PDF-editor na aanmaken offerte

**Probleem**: Na het aanmaken van een offerte wordt je naar `/offertes` (overzicht) gestuurd. De gebruiker wil direct naar de PDF-editor zodat hij de offerte kan finaliseren en versturen.

**Wijziging in `src/pages/OfferteNieuw.tsx`**:
- Bij insert: `.insert(record).select("id").single()` gebruiken om het nieuwe ID terug te krijgen
- Redirect wijzigen van `/offertes` naar `/offertes/{newId}/pdf`
- Bij edit: redirect blijft `/offertes/${editId}` (detailpagina)

### Deel 2: Opvolgingsherinneringen

**Database**: Nieuwe tabel `offerte_herinneringen` met kolommen:
- `id` (uuid, PK)
- `offerte_id` (uuid, not null)
- `partner_id` (uuid, not null)
- `user_id` (uuid, not null) — wie de herinnering instelde
- `herinnering_datum` (timestamptz, not null)
- `notitie` (text)
- `status` (text, default `'gepland'`) — gepland / verstuurd / geannuleerd
- `created_at` (timestamptz)

RLS: partner users zien eigen partner herinneringen; CRUD voor partner_admin/staff/adviseur.

**Nieuw component: `src/components/offertes/OfferteHerinneringen.tsx`**

Een compact component met:
- Lijst van bestaande herinneringen (datum, notitie, status-badge)
- "Herinnering toevoegen" formulier: datumkiezer + optionele notitie
- Verwijder-knop per herinnering

**Integratie op twee plekken**:

1. **`src/pages/OffertePDF.tsx`** — In het linker configuratiepaneel, onder de bestaande opties, een opvouwbare sectie "Opvolging" met het herinneringen-component
2. **`src/pages/OfferteDetail.tsx`** — Als extra Card op de detailpagina met hetzelfde component

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | Tabel `offerte_herinneringen` aanmaken met RLS |
| `src/pages/OfferteNieuw.tsx` | Insert met `.select("id")`, redirect naar `/offertes/{id}/pdf` |
| `src/components/offertes/OfferteHerinneringen.tsx` | Nieuw: herinnering CRUD component |
| `src/pages/OffertePDF.tsx` | Herinneringen-sectie toevoegen in sidebar |
| `src/pages/OfferteDetail.tsx` | Herinneringen-card toevoegen |

