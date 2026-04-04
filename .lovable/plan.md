

# Plan: Schouw Module Optimalisatie — Logische Volgorde, Conditionele Velden & Mobiel

## Overzicht

De schouw-wizard wordt heringedeeld in een logische volgorde (wensen eerst, techniek daarna), krijgt conditionele opmaak (verberg irrelevante velden op basis van antwoorden), en de sidebar + wizard worden geoptimaliseerd voor mobiel gebruik.

---

## 1. Wizard Stappen Herindelen

**Huidige volgorde:** Technische inspectie → Foto's → Checklist → Handtekening → Samenvatting

**Nieuwe volgorde (6 stappen):**

1. **Wensen & Verwachtingen** — Wat wil de klant? (motivaties, budget, prioriteiten)
2. **Situatie & Woning** — Woninggegevens, huidige installatie, verbruik
3. **Technische inspectie** — Dak/elektra/locatie, paneel clusters, satellietkaart
4. **Foto's & Media** — Foto-uploads
5. **Checklist & Aandachtspunten** — Verplichte controles
6. **Klant akkoord & Samenvatting** — Handtekening + overzicht (gecombineerd)

**Bestand:** `src/pages/SchouwUitvoeren.tsx`

---

## 2. Conditionele Velden

Velden worden dynamisch getoond/verborgen op basis van eerder ingevulde waarden. Dit voorkomt onnodige vragen.

### Thuisbatterij voorbeelden:
| Conditie | Verborgen sectie/velden |
|---|---|
| `motivatie_offgrid = "nee"` | Hele sectie "Off-grid vereisten" verbergen |
| `zonnepanelen_aanwezig = "nee"` | Alle velden in "Huidige zonnepanelen" behalve `zonnepanelen_aanwezig` zelf |
| `omvormer_compatibel_batterij = "ja"` | `omvormer_vervanging_nodig` en `gewenst_omvormertype_vervanging` verbergen |
| `motivatie_noodstroom = "nee"` | `essentiele_apparaten_uitval`, `noodstroom_verbruik_kwh_dag`, `gewenste_autonomie_uren` verbergen |

### Zonnepanelen voorbeelden:
| Conditie | Verborgen velden |
|---|---|
| `schaduw = "geen"` | `schaduw_bron` verbergen |
| `daktype = "plat"` | `aantal_dakpannen_rij` verbergen |

### Implementatie:
- Nieuw `visibleWhen?` property toevoegen aan `CategoryField` interface:
  ```typescript
  visibleWhen?: { field: string; values: string[] }
  ```
- In `SchouwUitvoeren.tsx`: filter fields op basis van huidige `gegevens` state
- Hele secties verbergen als geen enkel veld in die sectie zichtbaar is

**Bestanden:** `SchouwCategoryFields.ts`, `SchouwUitvoeren.tsx`, `SchouwDetail.tsx`

---

## 3. Velden Toewijzen aan Wizard-stappen

Elk veld krijgt een nieuw `wizardStep` property dat bepaalt in welke stap het verschijnt:

| wizardStep | Naam | Voorbeeldvelden |
|---|---|---|
| `"wensen"` | Wensen & Verwachtingen | motivatie_*, budget_*, prioriteit_*, merkvoorkeur |
| `"situatie"` | Situatie & Woning | bouwjaar, woningtype, zonnepanelen_aanwezig, verbruik, huidige omvormer |
| `"technisch"` | Technische inspectie | dak*, elektra*, batterij_locatie, clusters, satellietkaart |

**Bestand:** `SchouwCategoryFields.ts` — nieuw `wizardStep` property per field

---

## 4. Sidebar Mobiel Optimaliseren

De huidige sidebar gebruikt `collapsible="icon"` maar is op mobiel niet optimaal.

### Wijzigingen:
- Sidebar wisselen naar `collapsible="offcanvas"` op mobiel (< 768px)
- SidebarTrigger altijd zichtbaar houden in de header (al het geval)
- Sidebar automatisch sluiten na navigatie op mobiel
- Touch-vriendelijke tap targets (min 44px)

**Bestanden:** `AppSidebar.tsx`, `AppLayout.tsx`

---

## 5. Wizard Mobiel Optimaliseren

### Wijzigingen in `SchouwUitvoeren.tsx`:
- Stap-indicator: horizontale scroll-dots i.p.v. tekst op mobiel
- Formuliervelden: altijd 1 kolom op mobiel (al deels zo, maar consistent maken)
- Navigatieknoppen: sticky footer op mobiel zodat ze altijd bereikbaar zijn
- Paneel cluster editor: card-layout optimaliseren voor smal scherm
- Satellietkaart: full-width op mobiel

### Wijzigingen in `PaneelClusterEditor.tsx`:
- Grid naar 1 kolom op mobiel
- Cluster cards: compactere weergave met uitklapbare details

---

## 6. SchouwDetail.tsx Bijwerken

- Conditionele velden ook hier toepassen (verberg lege conditionele velden)
- Secties groeperen volgens dezelfde logische volgorde als de wizard
- Mobiel: cards stapelen in 1 kolom

---

## Technische Details

### Bestanden die wijzigen:

| Bestand | Wijziging |
|---|---|
| `src/components/schouwen/SchouwCategoryFields.ts` | `visibleWhen` en `wizardStep` properties toevoegen aan alle relevante velden |
| `src/pages/SchouwUitvoeren.tsx` | 6 stappen, conditionele filtering, mobiele sticky nav, stap-toewijzing |
| `src/pages/SchouwDetail.tsx` | Conditionele weergave, logische volgorde |
| `src/components/schouwen/PaneelClusterEditor.tsx` | Mobiele layout optimalisatie |
| `src/components/AppSidebar.tsx` | Offcanvas op mobiel, auto-close na navigatie |
| `src/components/AppLayout.tsx` | Eventuele layout-aanpassing voor offcanvas |

### Geen database wijzigingen nodig
Alle data blijft in het bestaande `gegevens` JSON-veld. De veldstructuur is puur frontend.

