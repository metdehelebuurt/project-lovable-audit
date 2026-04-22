

## Plan — Klant koppelen vanuit een nieuw opleverrapport

### Probleem
Wanneer je via "Nieuw rapport" op `/opleveringen` start, wordt het rapport aangemaakt zónder klant en in de wizard (stap *Identificatie*) is er geen veld om alsnog een klant te koppelen. Je ziet daar alleen de melding "Nog geen klant gekoppeld" zonder actie. `OpleverDetail` geeft `StepIdentificatie` ook geen `onChange` voor `klant_id`, alleen voor datum en scope.

### Oplossing — klantselectie inbouwen in stap Identificatie

**1. Nieuwe component `KlantSelector` in `src/components/oplever/KlantSelector.tsx` (<150 regels)**
- Input met live zoekveld op `klanten`-tabel (`voornaam`, `achternaam`, `bedrijfsnaam`, `email`) gefilterd op `partner_id`.
- Dropdown met max 10 resultaten; klik = koppelen (zet `klant_id` in draft).
- Bij geselecteerde klant: getoond als "chip" met naam + adres + knop "Loskoppelen".
- Knop "Nieuwe klant aanmaken" opent inline form (voornaam, achternaam, bedrijfsnaam, email, telefoon, adres, postcode, plaats) → INSERT in `klanten` met juiste `partner_id` → automatisch koppelen.
- Patroon volgt `LeadSearchInput` (zelfde UX, maar tabel = `klanten` i.p.v. `leads`).

**2. `StepIdentificatie.tsx` uitbreiden (~+15 regels)**
- Nieuwe props: `partnerId: string`, `klantId: string | null`, `onKlantChange: (id: string | null) => void`.
- Bovenaan toont nu de `KlantSelector` ipv enkel een statische tekstregel.
- De bestaande `klantNaam`/`klantAdres`-props blijven werken voor de read-only contextregel zodra een klant gekoppeld is.

**3. `OpleverDetail.tsx` aanpassen (~+10 regels)**
- Bij `<StepIdentificatie>` doorgeven van `partnerId={merged.partner_id}`, `klantId={merged.klant_id}` en `onKlantChange={(id) => update({ klant_id: id })}`.
- De bestaande `klantData`-query (al aanwezig) refresht automatisch zodra `klant_id` wijzigt → naam en adres verschijnen direct in PDF-preview en stempel.

### Toegangsrechten / RLS
- `klanten` tabel heeft al RLS per `partner_id`. SELECT en INSERT zijn beschikbaar voor `partner_admin`/`partner_staff`/`backoffice`/`installateur`. Geen migratie nodig.

### Bestanden-overzicht

| Bestand | Actie |
|---|---|
| `src/components/oplever/KlantSelector.tsx` | nieuw — zoek + nieuwe klant aanmaken |
| `src/components/oplever/StepIdentificatie.tsx` | edit — KlantSelector inbouwen |
| `src/pages/OpleverDetail.tsx` | edit — props doorgeven |

### Geen wijzigingen aan
- Datamodel (`opleverrapporten.klant_id` bestaat al).
- API (`patchRapport` accepteert `klant_id` al via partial).
- PDF-render, wizard-flow, ondertekening.

### Bevestigingsvragen
Geen — bestaande tabellen, kolommen en patronen.

