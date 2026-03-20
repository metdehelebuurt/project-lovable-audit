

## Plan: Sidebar groepering, Dashboard redesign, Instellingen uitbreiding

### 1) Sidebar — Gegroepeerde navigatie

**Bestand:** `src/components/AppSidebar.tsx`

Herstructureer de flat list naar logische groepen met `SidebarGroupLabel`:

```text
OVERZICHT
  Dashboard

RELATIEBEHEER
  Leads
  Klanten
  Berichten

WERKPROCES
  Schouwen
  Offertes
  Opdrachten
  Installaties

PLANNING & TOOLS
  Planning
  Producten
  Tools
  Analytics

BEHEER
  Partners (superadmin)
  Adviseurs
  Gebruikers
  Documenten
  Affiliate Beheer (superadmin)

INSTELLINGEN
  Instellingen
```

- Elke groep krijgt een `SidebarGroupLabel` met een subtiele uppercase label
- Groepen gescheiden door een dunne separator
- Zelfde rol-gebaseerde filtering behouden maar nu per groep
- Op collapsed state: alleen iconen, geen groepslabels

### 2) Dashboard redesign — Compacte stats + module tegels + notificaties

**Bestand:** `src/pages/Dashboard.tsx`

**Layout:**
- **Bovenste rij**: Compacte stat-balk (horizontale rij van mini-stats met getal + label, geen grote kaarten)
- **Midden**: Grid van **module-tegels** (6-8 stuks) — kleurrijke kaarten met groot icoon, titel en korte subtekst die direct naar de module navigeren (bijv. Leads, Offertes, Schouwen, Planning, Producten, Analytics). `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- **Onderste rij**: Twee kolommen — links "Recente Activiteit" (bestaande lijst, compacter), rechts "Notificaties" (laatste 5 ongelezen notificaties uit `notificaties` tabel)

Extra statistieken toevoegen:
- **Openstaande offertes** (status = 'verstuurd')
- **Vandaag geplande afspraken** (uit `afspraken` tabel, datum = vandaag)
- **Conversieratio** (geaccepteerde offertes / totaal offertes als percentage)

### 3) Instellingen redesign — Tab-navigatie + bedrijfsinfo + beveiliging

**Bestand:** `src/pages/Instellingen.tsx`

Vervang de verticale kaarten-stack door een **tab-layout** met zijnavigatie (links tabs, rechts content):

**Tabs:**
1. **Profiel** — Bestaande profielgegevens
2. **Beveiliging** — Wachtwoord wijzigen + sessie-overzicht + 2FA info placeholder
3. **Bedrijfsgegevens** (partner_admin) — NIEUW: Bedrijfsnaam, KVK, BTW, adres, postcode, plaats, website, contactpersoon gegevens. Laadt en slaat op vanuit `partners` tabel (kolommen bestaan al)
4. **Huisstijl** (partner_admin) — Bestaande branding sectie
5. **E-mail** (partner_admin) — Bestaande EmailConfiguratie
6. **Offertes** (partner_admin) — Bestaande template + betalingsvoorwaarden + offerte template instellingen
7. **Schouwen** (partner_admin) — Bestaande SchouwInstellingen
8. **Privacy & Data** — Data export, account verwijderen, demogegevens

**Nieuwe "Bedrijfsgegevens" tab inhoud:**
- Formulier met velden: naam, email, telefoonnummer, website, adres, postcode, plaats, kvk, btw
- Contactpersoon sectie: voornaam, achternaam, functie, email, telefoon
- Alles uit de bestaande `partners` tabel kolommen — er is geen migratie nodig

**Nieuwe "Beveiliging" tab:**
- Wachtwoord wijzigen (verplaatst uit huidige pagina)
- Informatieblok over tweefactorauthenticatie (placeholder — "Binnenkort beschikbaar")
- Actieve sessie info (laatste login timestamp uit profiel)
- Informatieblok over gegevensbescherming / AVG compliance

**Layout:** Links een verticale navigatie (`flex` layout, niet tabs component), rechts de content. Op mobiel wordt de navigatie een horizontale scrollbare balk bovenaan.

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/AppSidebar.tsx` | Gegroepeerde navigatie met labels en separators |
| `src/pages/Dashboard.tsx` | Compacte stats, module tegels grid, notificatie panel, extra statistieken |
| `src/pages/Instellingen.tsx` | Tab-navigatie layout, nieuwe Bedrijfsgegevens tab, Beveiliging tab |

