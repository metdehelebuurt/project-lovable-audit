

## Plan: Klantenmodule, Afspraken & Lead-naar-Klant conversie

### Overzicht
Dit plan introduceert drie grote onderdelen:
1. **Klantenmodule** — een nieuwe `klanten` tabel en pagina's (overzicht + klantkaart)
2. **Afspraken** — een nieuwe `afspraken` tabel voor adviseur-afspraken (op afstand / thuisbezoek), inplanbaar vanuit leads én klanten
3. **Automatische klantconversie** — bij offerte-acceptatie wordt de lead automatisch een klant

---

### 1. Database: nieuwe tabellen

**Tabel `klanten`**
```sql
CREATE TABLE public.klanten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  lead_id uuid,              -- referentie naar oorspronkelijke lead
  offerte_id uuid,           -- de geaccepteerde offerte
  voornaam text NOT NULL,
  achternaam text NOT NULL,
  email text,
  telefoon text,
  bedrijfsnaam text,
  adres text,
  postcode text,
  plaats text,
  notities text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Tabel `afspraken`**
```sql
CREATE TABLE public.afspraken (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  adviseur_id uuid NOT NULL,
  lead_id uuid,
  klant_id uuid,
  type text NOT NULL DEFAULT 'thuisbezoek', -- 'thuisbezoek' | 'op_afstand'
  titel text NOT NULL,
  datum date NOT NULL,
  start_tijd time,
  eind_tijd time,
  locatie text,
  notities text,
  status text NOT NULL DEFAULT 'gepland', -- 'gepland' | 'afgerond' | 'geannuleerd'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

RLS op beide tabellen volgt het bestaande partner-isolatie patroon (superadmin ziet alles, partner_admin/staff zien eigen partner, adviseur ziet eigen records).

### 2. Offerte-acceptatie → Klant aanmaken

**`supabase/functions/offerte-accept/index.ts`** uitbreiden:
- Na het aanmaken van de opdracht, een record in `klanten` inserteren met gegevens uit de offerte + lead
- De lead_status updaten naar `'klant'` als er een `lead_id` is

### 3. Nieuwe pagina's

| Route | Pagina | Beschrijving |
|-------|--------|-------------|
| `/klanten` | `Klanten.tsx` | Overzicht met zoek/filter, tabel van alle klanten |
| `/klanten/:id` | `KlantDetail.tsx` | **Klantkaart**: contactgegevens, gekoppelde offertes, opdrachten, schouwen, installaties, afspraken-tijdlijn, en mogelijkheid om afspraken in te plannen |

### 4. Afspraken inplannen vanuit Leads & Klanten

- **LeadDetail.tsx**: nieuw tabblad "Afspraken" met overzicht + knop "Afspraak inplannen"
- **KlantDetail.tsx**: sectie "Afspraken" met hetzelfde
- **Afspraak-dialoog**: formulier met type (thuisbezoek/op afstand), datum, start/eindtijd, titel, locatie, notities

### 5. Planning uitbreiden

**`src/pages/Planning.tsx`**: naast schouwen en installaties ook `afspraken` ophalen en tonen:
- Nieuw event-type `"afspraak"` met eigen kleur (bijv. paars/blauw)
- Icon: `CalendarIcon` of `Video` voor op afstand
- In de event-detail dialog: type, klant/lead naam, tijdstip, locatie

### 6. Sidebar navigatie

**`AppSidebar.tsx`**: "Klanten" toevoegen voor relevante rollen (superadmin, partner_admin, partner_staff, adviseur).

### 7. Bestanden overzicht

| Bestand | Actie |
|---------|-------|
| Migratie | `klanten` + `afspraken` tabellen + RLS policies |
| `src/pages/Klanten.tsx` | **Nieuw** — klantenlijst |
| `src/pages/KlantDetail.tsx` | **Nieuw** — uitgebreide klantkaart |
| `src/components/shared/AfspraakDialog.tsx` | **Nieuw** — herbruikbaar afspraakformulier |
| `supabase/functions/offerte-accept/index.ts` | Uitbreiden: klant aanmaken + lead status updaten |
| `src/pages/Planning.tsx` | Afspraken ophalen en weergeven |
| `src/pages/LeadDetail.tsx` | Afspraken-tab toevoegen |
| `src/components/AppSidebar.tsx` | "Klanten" menuitem toevoegen |
| `src/App.tsx` | Routes voor `/klanten` en `/klanten/:id` |
| `supabase/functions/planning-ical-feed/index.ts` | Afspraken ook meenemen in feed |

