

# Plan: Volwaardige Financiele Module

## Overzicht

Een complete financiele module die partners in staat stelt om verkoopfacturen, inkoopfacturen, inkooporders, verkooporderbevestigingen en pakbonnen te maken en beheren — volledig geintegreerd met de bestaande offerte-, opdracht- en klantenmodules. Het doel: geen aparte boekhoudsoftware meer nodig.

## Huidige situatie

- **`facturen` tabel**: bestaat al, maar is gekoppeld aan abonnementen (platformfacturering), niet aan klant-/partnerverkoopfacturen
- **`opdrachten` tabel**: bevat regels, klantgegevens en totaalbedrag — basis voor verkooporderbevestigingen
- **`offertes` tabel**: bevat regels, BTW, kortingen — logische bron voor factuurcreatie
- **Geen inkoopmodule**: er bestaan geen tabellen voor inkoopfacturen, inkooporders of leveranciers
- **Geen pakbonmodule**: geen tabel voor pakbonnen/verzendingen

---

## Functie-overzicht

### 1. Verkoopfacturen
- Aanmaken vanuit geaccepteerde offerte of opdracht (1 klik)
- Handmatig aanmaken (losse factuur)
- Regeleditor (zelfde interface als offerte-regels)
- Automatische nummering: `VF-YYYY-0001`
- Status: Concept → Verzonden → Betaald → Verlopen → Gecrediteerd
- BTW-berekening (21%, 9%, 0%)
- Betalingstermijn instellen (14/30/60 dagen)
- PDF genereren met partner-huisstijl
- E-mail verzenden naar klant
- Creditnota aanmaken vanuit bestaande factuur
- Herinnering sturen bij verlopen factuur

### 2. Inkoopfacturen
- Handmatig invoeren of uploaden (PDF)
- Koppelen aan leverancier
- Status: Ontvangen → Goedgekeurd → Betaald
- Automatische nummering: `IF-YYYY-0001`
- BTW-terugvordering inzichtelijk

### 3. Inkooporders
- Aanmaken voor leverancier
- Regeleditor (producten uit productcatalogus)
- Status: Concept → Verzonden → Deels ontvangen → Volledig ontvangen
- Automatische nummering: `IO-YYYY-0001`
- PDF genereren

### 4. Verkooporderbevestigingen
- Reeds deels aanwezig via `opdrachten` + `OrderbevestigingPDF`
- Integreren in financiele module als apart documenttype
- Koppeling vanuit geaccepteerde offerte

### 5. Pakbonnen
- Aanmaken vanuit opdracht of verkooporder
- Artikellijst met aantallen
- Status: Aangemaakt → Verzonden → Afgeleverd
- Automatische nummering: `PB-YYYY-0001`
- PDF genereren

### 6. Leveranciersbeheer
- Naam, adres, KvK, BTW-nummer, contactgegevens, bankgegevens
- Koppeling aan inkooporders en inkoopfacturen

### 7. Dashboard & Rapportages
- Openstaande debiteuren en crediteuren
- Omzet per maand/kwartaal
- BTW-overzicht per periode (aangifte-ready)
- Winst & verlies overzicht
- Cashflow grafiek

---

## Integratie met bestaande modules

```text
Offerte (geaccepteerd)
  └─> Opdracht (orderbevestiging)
       ├─> Verkoopfactuur (automatisch of handmatig)
       ├─> Pakbon
       └─> Inkooporder (materiaal bestellen bij leverancier)
            └─> Inkoopfactuur (ontvangen van leverancier)
```

- **Klanten**: verkoopfacturen koppelen aan bestaande `klanten` tabel
- **Leads**: factuur aanmaken converteert lead naar klant indien nodig
- **Producten**: zelfde productcatalogus voor inkoop- en verkoopregels
- **Documenten**: gegenereerde PDF's opslaan in documentenmodule
- **Email**: facturen verzenden via bestaande e-mailconfiguratie

---

## Database ontwerp

### Nieuwe tabellen

**`leveranciers`** — Leveranciersbeheer
- id, partner_id, naam, email, telefoon, adres, postcode, plaats, kvk, btw_nummer, iban, contactpersoon, notities, created_at, updated_at

**`financiele_documenten`** — Centrale tabel voor alle financiele documenten
- id, partner_id, type (verkoopfactuur | creditnota | inkoopfactuur | inkooporder | pakbon), documentnummer, status, klant_id (nullable), leverancier_id (nullable), opdracht_id (nullable), offerte_id (nullable), regels (jsonb), subtotaal, btw_bedrag, totaal_bedrag, korting_totaal, factuurdatum, vervaldatum, betaald_op, betaald_via, betalingstermijn_dagen, notities, pdf_url, verzonden_op, created_by, created_at, updated_at

**`financiele_document_regels`** — Optioneel los (of in jsonb) voor query-mogelijkheden
- Wordt opgelost via jsonb `regels` kolom (consistent met offertes/opdrachten)

### Bestaande tabellen
- **`opdrachten`**: geen wijziging nodig, koppeling via `opdracht_id`
- **`klanten`**: geen wijziging nodig, koppeling via `klant_id`

### RLS Policies
- Partner users (admin/staff) zien eigen partner documenten
- Adviseur ziet documenten gekoppeld aan eigen opdrachten
- Superadmin ziet alles
- Consument kan eigen facturen inzien (toekomstig)

---

## Pagina's & Componenten

### Nieuwe pagina's
| Pagina | Route | Functie |
|---|---|---|
| `Financieel.tsx` | `/financieel` | Overzichtspagina met tabs |
| `FactuurNieuw.tsx` | `/financieel/nieuw/:type` | Document aanmaken |
| `FactuurDetail.tsx` | `/financieel/:id` | Document bekijken/bewerken |
| `Leveranciers.tsx` | `/leveranciers` | Leveranciersbeheer |
| `LeverancierDetail.tsx` | `/leveranciers/:id` | Leverancier detail |

### Nieuwe componenten
| Component | Functie |
|---|---|
| `FinancieelDashboard.tsx` | KPI-kaarten, grafieken |
| `DocumentRegelEditor.tsx` | Herbruikbare regeleditor (gedeeld met offertes) |
| `FinancieelPDF.tsx` | PDF-template voor alle documenttypen |
| `BTWOverzicht.tsx` | BTW-aangifte overzicht |
| `DebiteurenCrediteuren.tsx` | Openstaande posten |

### Sidebar
Nieuwe groep "Financieel" met:
- Financieel (hoofdpagina met tabs)
- Leveranciers

---

## Bouwvolgorde (6 fasen)

### Fase 1: Database
- Migratie: `leveranciers` en `financiele_documenten` tabellen
- RLS policies
- Nummering-functies

### Fase 2: Leveranciersbeheer
- CRUD pagina's voor leveranciers

### Fase 3: Verkoopfacturen
- Aanmaken (handmatig + vanuit opdracht/offerte)
- Regeleditor
- Status-flow
- PDF generatie

### Fase 4: Inkoopfacturen & Inkooporders
- Aanmaken gekoppeld aan leverancier
- Status-flow

### Fase 5: Pakbonnen & Orderbevestigingen
- Aanmaken vanuit opdracht
- PDF generatie

### Fase 6: Dashboard & Rapportages
- Financieel overzicht
- BTW-rapportage
- Debiteuren/crediteuren

---

## Technische details

### Bestanden (nieuw)
- `src/pages/Financieel.tsx`
- `src/pages/FactuurNieuw.tsx`
- `src/pages/FactuurDetail.tsx`
- `src/pages/Leveranciers.tsx`
- `src/pages/LeverancierDetail.tsx`
- `src/components/financieel/FinancieelDashboard.tsx`
- `src/components/financieel/DocumentRegelEditor.tsx`
- `src/components/financieel/FinancieelPDF.tsx`
- `src/components/financieel/BTWOverzicht.tsx`
- `src/components/financieel/DebiteurenCrediteuren.tsx`

### Bestanden (wijzigen)
- `src/App.tsx` — routes toevoegen
- `src/components/AppSidebar.tsx` — "Financieel" groep toevoegen
- `src/pages/OpdrachtDetail.tsx` — "Factuur aanmaken" knop
- `src/types/offerte.ts` — gedeelde regeltypen hergebruiken

### Database migraties
- 1 migratie voor `leveranciers` + `financiele_documenten` + RLS + triggers

### Omvang
Dit is een groot project. Ik stel voor om te beginnen met **fase 1-3** (database + leveranciers + verkoopfacturen) en daarna fase 4-6 in een vervolg te bouwen. Zo heb je snel een werkend fundament.

