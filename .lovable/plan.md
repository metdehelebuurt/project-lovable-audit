

## Plan: Redesign LeadDetail + nieuwe KlantDetail pagina

### Analyse huidige situatie

**LeadDetail** (1184 regels): Goed opgebouwd met pipeline, tabs, sidebar (contactmomenten-logger, AI signalen, samenvatting, snelle acties). Gebruikt custom `TabButton` component en 3-kolom grid (2+1 sidebar). Ruimtegebruik is redelijk maar kan cleaner.

**KlantDetail** (293 regels): Veel simpeler, gebruikt Radix Tabs, 3-kolom grid (1+2). Mist: opdrachten-query haalt alleen op basis van `offerte_id` (1 offerte), geen installaties, geen notities-systeem zoals bij leads, geen sidebar, geen activiteiten-tijdlijn.

### Wijzigingen

#### 1. LeadDetail.tsx -- Redesign voor betere ruimtebenutting

- **Contactgegevens in de header**: Verplaats email/telefoon/adres naar een compacte inline rij direct onder de naam (naast badges), in plaats van een apart "Overzicht" tab met contactkaart. Bespaart een hele tab.
- **Verwijder "Overzicht" tab**: Merge contactgegevens in header, notities krijgen eigen tab (al zo). De edit-modus wordt via de header "Bewerken" knop getriggerd en opent een slide-over of inline sectie onder de header.
- **Sidebar compacter**: Contact-logger krijgt een collapsible design. AI-signalen en samenvatting blijven.
- **Tabs cleaner**: Gebruik dezelfde custom `TabButton` maar met icoontjes en betere spacing. Verwijder "Documenten" tab als die leeg is (lazy load).
- **Full-width content area**: Verwijder de 2+1 sidebar layout op mobiel, sidebar gaat onder de tabs content.

#### 2. KlantDetail.tsx -- Volledige herschrijving naar LeadDetail-patroon

Bouw KlantDetail op met dezelfde structuur als LeadDetail maar zonder pipeline/substatus:

**Header:**
- Terug-knop, naam + "Klant" badge
- Inline contactinfo (email, telefoon, adres, bedrijf)
- Actieknoppen: Bewerken, Afspraak, Offerte

**Quick Stats rij:**
- Offertes, Opdrachten, Schouwen, Afspraken (4 cards)
- Totale opdrachtwaarde

**Tabs (custom TabButton, zelfde stijl als LeadDetail):**
- Overzicht (contactgegevens met inline edit)
- Offertes (lijst met link naar offerte PDF)
- Opdrachten (NIEUW -- haal ALLE opdrachten op via `lead_id`, niet alleen via `offerte_id`; toon: status, bedrag, klant_adres, toegewezen monteur, geplande datum)
- Schouwen
- Afspraken
- Activiteit (tijdlijn van alle events)

**Sidebar (rechts, 1/3 breedte):**
- Samenvatting card (totalen + waarden)
- Snelle acties (afspraak, offerte, schouw, bellen, mailen)

**Opdrachten-query fix:**
- Haal opdrachten op via `lead_id` (niet `offerte_id`) zodat alle opdrachten van deze klant getoond worden
- Of haal via alle offerte IDs van de klant: eerst offertes ophalen, dan opdrachten `.in("offerte_id", offerteIds)`

**Notities:**
- Gebruik hetzelfde notitie-systeem als LeadDetail (inline notities met auteur + timestamp) via `klanten.notities` veld (beperkt) of maak een aparte sectie

#### 3. Gedeelde componenten

Extraheer herbruikbare componenten die beide pagina's gebruiken:
- `QuickStat` component (al in LeadDetail, verplaats naar apart bestand)
- `TabButton` component
- `InfoRow` component
- Offerte-lijst renderer
- Schouw-lijst renderer
- Afspraken-lijst renderer

Deze worden in een shared file `src/components/detail/DetailComponents.tsx` gezet.

---

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/detail/DetailComponents.tsx` | Nieuw: gedeelde QuickStat, TabButton, InfoRow, lijst-renderers |
| `src/pages/LeadDetail.tsx` | Refactor: importeer gedeelde componenten, cleaner header met inline contactinfo |
| `src/pages/KlantDetail.tsx` | Volledige herschrijving: zelfde layout als LeadDetail, met opdrachten-tab, sidebar, activiteiten-tijdlijn |

