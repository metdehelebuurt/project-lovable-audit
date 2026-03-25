

## Plan: Klantfeedback verwerken — Lead Management & Planning verbeteringen

Dit plan pakt de 12 feedbackpunten aan in 5 logische werkpakketten.

---

### Werkpakket 1: Adviseur-selectie bij afspraken (punten 1, 2, 5, 7)

**Probleem:** Afspraken worden altijd gekoppeld aan de ingelogde gebruiker. Er is geen mogelijkheid om een andere adviseur te kiezen.

**Oplossing:**
- **AfspraakDialog.tsx**: Adviseur-dropdown toevoegen die partner-users ophaalt (rol = adviseur, partner_staff, partner_admin). Default: lead owner (als beschikbaar), anders ingelogde user.
- **Planning.tsx**: Zelfde adviseur-dropdown in het inline formulier. Adviseur-naam tonen bij events in de kalender.
- **AfspraakDialog**: `lead_id` meegeven zorgt automatisch voor koppeling lead → adviseur → afspraak.

### Werkpakket 2: "Mijn Agenda" filter in Planning (punten 3, 4)

**Probleem:** Geen persoonlijk overzicht per gebruiker.

**Oplossing:**
- **Planning.tsx**: Toggle-filter toevoegen: "Mijn agenda" vs "Alle afspraken". Default = "Mijn agenda" voor adviseurs.
- Afspraken filteren op `adviseur_id = auth.uid()`.
- Schouwen filteren op `adviseur_id`.
- Adviseur-naam tonen bij elke event in alle weergaven.

### Werkpakket 3: Uitgebreide lead-statussen (punten 8, 11)

**Probleem:** Huidige statussen (nieuw, gekwalificeerd, offerte_verzonden, klant, verloren) zijn te beperkt voor dagelijkse opvolging.

**Oplossing — Database migratie:**
```sql
ALTER TYPE lead_status ADD VALUE 'contact_geprobeerd';
ALTER TYPE lead_status ADD VALUE 'geen_gehoor';
ALTER TYPE lead_status ADD VALUE 'voicemail';
ALTER TYPE lead_status ADD VALUE 'terugbellen';
ALTER TYPE lead_status ADD VALUE 'gesproken';
ALTER TYPE lead_status ADD VALUE 'afspraak_gepland';
```

**Frontend updates:**
- **LeadDetail.tsx**: Pipeline-balk aanpassen met twee rijen — bovenste rij = hoofdstatussen (nieuw → gekwalificeerd → offerte → klant), onderste rij = opvolgstatussen (contact_geprobeerd, geen_gehoor, voicemail, terugbellen, gesproken, afspraak_gepland).
- **Leads.tsx**: Nieuwe statussen toevoegen aan filters en labels.

### Werkpakket 4: Gestructureerde lead-velden (punten 8, 9)

**Probleem:** Belangrijke data (verbruik, aantal panelen, woningtype) zit in notities.

**Oplossing — Nieuwe tabel `lead_eigenschappen`:**
```sql
CREATE TABLE lead_eigenschappen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Energie/woning velden
  woningtype text,              -- vrijstaand, hoekwoning, tussenwoning, etc.
  bouwjaar integer,
  daktype text,
  dakrichting text,
  aantal_panelen integer,
  huidig_verbruik_kwh integer,
  huidige_energielabel text,
  gewenst_energielabel text,
  warmtepomp_interesse boolean DEFAULT false,
  batterij_interesse boolean DEFAULT false,
  laadpaal_interesse boolean DEFAULT false,
  isolatie_interesse boolean DEFAULT false,
  extra_json jsonb DEFAULT '{}'  -- voor partner-specifieke velden
);
```
Met RLS identiek aan leads.

**Frontend:**
- **LeadDetail.tsx**: Nieuw tabblad "Klantdata" of sectie in Overzicht met gestructureerde invoervelden voor woningtype, verbruik, interesses, etc.

### Werkpakket 5: Contactmomenten-registratie & Lead-eigenaar tonen (punten 10, 12)

**Probleem:** Geen gestructureerde contactmomenten, geen zichtbare eigenaar, geen automatische tijdlijn.

**Oplossing — Nieuwe tabel `lead_contactmomenten`:**
```sql
CREATE TABLE lead_contactmomenten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  type text NOT NULL,           -- 'call', 'voicemail', 'email', 'whatsapp', 'bezoek', 'overig'
  richting text DEFAULT 'uitgaand', -- 'uitgaand' of 'inkomend'
  resultaat text,               -- 'bereikt', 'geen_gehoor', 'voicemail', 'terugbelverzoek'
  notitie text,
  created_at timestamptz DEFAULT now()
);
```

**Frontend updates:**
- **LeadDetail.tsx**:
  - **Lead-eigenaar tonen**: In header, owner_user_id opzoeken en naam tonen met mogelijkheid om te wijzigen.
  - **Contactmomenten-widget**: Snelle "Log contact" knop in sidebar met type/richting/resultaat selectie.
  - **Activiteit-tab**: Contactmomenten opnemen in tijdlijn naast notities, offertes, afspraken.
  - Communicatie-tab verrijken met contactmomenten.

---

### Bestanden overzicht

| Bestand | Wijziging |
|---------|-----------|
| SQL migratie | Nieuwe statussen, `lead_eigenschappen`, `lead_contactmomenten` tabellen + RLS |
| `src/components/shared/AfspraakDialog.tsx` | Adviseur-selectie dropdown |
| `src/pages/Planning.tsx` | Adviseur-keuze bij aanmaken, "Mijn agenda" filter, adviseur-naam bij events |
| `src/pages/LeadDetail.tsx` | Uitgebreide pipeline, eigenaar tonen, klantdata sectie, contactmomenten widget, verrijkte tijdlijn |
| `src/pages/Leads.tsx` | Nieuwe statussen in filters/labels, eigenaar-kolom |

### Aanpak

Dit is een groot pakket. Ik stel voor om het in twee rondes te implementeren:
- **Ronde 1**: Werkpakketten 1 + 2 + 3 (adviseur-selectie, mijn agenda, extra statussen) — direct merkbaar in dagelijks gebruik
- **Ronde 2**: Werkpakketten 4 + 5 (klantdata, contactmomenten) — verdieping

Wil je alles in een keer, of eerst Ronde 1?

