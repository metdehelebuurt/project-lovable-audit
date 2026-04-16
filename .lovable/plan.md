

# Plan: Sidebar Submenu's, Statusfilters & Offerte-naar-Factuur

## 1. Sidebar herindeling met submenu's

Huidige situatie: platte lijst van nav-items per groep. Voorstel: groepen met collapsible submenu's via de bestaande `SidebarMenuSub` / `SidebarMenuSubItem` / `SidebarMenuSubButton` componenten uit de sidebar UI library.

**Nieuwe structuur** (voorbeeld partner_admin):

```text
Overzicht
  Dashboard

Relatiebeheer
  Leads
  Klanten
  Berichten

Werkproces
  Schouwen
  Offertes
    └ Offerte Feedback
  Opdrachten
  Installaties

Financieel
  Dashboard
  Verkoopfacturen
  Inkoopfacturen
  Inkooporders
  Pakbonnen
  Leveranciers

Planning & Tools
  Planning
  Producten
  Tools
  Analytics

Beheer
  Partners
  Adviseurs
  Gebruikers
  Documenten
  ...

Support
  Feedback
  Functieverzoek

Instellingen
```

Wijzigingen in `AppSidebar.tsx`:
- Voeg een `children?: NavItem[]` property toe aan `NavItem` interface
- Gebruik `Collapsible` + `SidebarMenuSub` voor items met children
- Financieel groep uitklappen met submenu items die direct naar de juiste tab navigeren (via query params: `/financieel?tab=verkoop`)
- "Offerte Feedback" wordt sub-item onder "Offertes"
- Auto-expand groep wanneer huidige route erin zit

## 2. Statusfilters op financiele tabbladen

Wijzigingen in `Financieel.tsx`:
- Per tab (verkoop, inkoop, pakbonnen) een `Select` dropdown toevoegen boven de tabel
- Filter opties per tab:
  - Verkoop: Alle, Concept, Verzonden, Betaald, Verlopen, Gecrediteerd
  - Inkoop: Alle, Ontvangen, Goedgekeurd, Betaald
  - Pakbonnen: Alle, Aangemaakt, Verzonden, Afgeleverd
- State per tab: `statusFilterVerkoop`, `statusFilterInkoop`, `statusFilterPakbon`
- `renderTable` krijgt een extra `statusFilter` parameter

## 3. Offerte omzetten naar factuur

Dit bestaat al: op `OfferteDetail.tsx` regel 286 staat een "Factuur aanmaken" knop die alleen verschijnt bij `geaccepteerd` status. Deze navigeert naar `/financieel/nieuw/verkoopfactuur?offerte=<id>`. En `FactuurNieuw.tsx` leest de `offerte` query param en vult de regels voor.

Verbetering: ook op de Offertes-overzichtspagina een snelactie toevoegen zodat je niet eerst de offerte hoeft te openen.

Wijzigingen in `Offertes.tsx`:
- In de tabel-rij voor geaccepteerde offertes een extra actie-icoon (Receipt) toevoegen dat direct navigeert naar `/financieel/nieuw/verkoopfactuur?offerte=<id>`

## 4. Sidebar navigatie naar financiele tabs

De financiele submenu-items gebruiken query params om direct de juiste tab te openen:
- `/financieel?tab=overzicht` → Dashboard
- `/financieel?tab=verkoop` → Verkoopfacturen
- `/financieel?tab=inkoop` → Inkoopfacturen
- `/financieel?tab=pakbonnen` → Pakbonnen

Wijziging in `Financieel.tsx`:
- Lees `tab` query param via `useSearchParams` en gebruik als initiële `activeTab`

---

## Technische details

### Bestanden wijzigen
| Bestand | Wijziging |
|---|---|
| `src/components/AppSidebar.tsx` | Submenu-structuur, Collapsible groepen, Financieel sub-items |
| `src/pages/Financieel.tsx` | Query param tab-sync, statusfilter dropdowns per tab |
| `src/pages/Offertes.tsx` | Snelactie "Factuur aanmaken" in tabelrij |

### Geen database wijzigingen nodig

