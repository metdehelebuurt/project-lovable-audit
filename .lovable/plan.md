

## Analyse: Wat is gebouwd vs. wat ontbreekt

Ik heb alle pagina's en backend functies doorgelopen en vergeleken met je volledige specificatie. Hier is een eerlijk overzicht.

### Wat WEL is gebouwd (functioneel)

| Module | Status | Details |
|--------|--------|---------|
| Auth (login/logout/sessie) | Gebouwd | Email+wachtwoord, JWT, sessie check |
| 6 rollen + RBAC | Gebouwd | ProtectedRoute met allowedRoles per pagina |
| Multi-tenant RLS | Gebouwd | Alle tabellen hebben RLS policies met partner_id isolatie |
| Database schema (11 tabellen) | Gebouwd | users, partners, leads, schouwen, offertes, installaties, producten, tickets, documenten, notificaties, consumenten |
| Partners CRUD | Gebouwd | Lijst, aanmaken, bewerken, status wijzigen (267 regels) |
| Gebruikers CRUD | Gebouwd | Via edge function user-management (328 regels) |
| Adviseurs view | Gebouwd | Filter op rol=adviseur via Gebruikers component |
| Leads CRUD | Gebouwd | Lijst, aanmaken, bewerken, verwijderen, status wijzigen, zoeken/filteren (322 regels) |
| Schouwen CRUD + formulieren | Gebouwd | 8 categorie-specifieke formulieren (zonnepanelen, warmtepomp, isolatie, etc.), 525 regels |
| Offertes + generator | Gebouwd | Productcatalogus koppeling, regels, korting, BTW berekening, live totalen (610 regels) |
| Producten CRUD | Gebouwd | Categorie-specifieke velden, 370 regels |
| Installaties CRUD | Gebouwd | Planning, installateur toewijzing (284 regels) |
| Tickets/Berichten | Gebouwd | Aanmaken, statuswijziging, prioriteit (222 regels) |
| Planning/Kalender | Gebouwd | Maandweergave met schouwen + installaties (137 regels) |
| Analytics | Gebouwd | KPI's, taartdiagrammen leads/offertes status (138 regels) |
| Instellingen | Gebouwd | Profiel bewerken, wachtwoord wijzigen (136 regels) |
| Sidebar per rol | Gebouwd | Verschillende navigatie per rol |
| Dashboard per rol | Gebouwd | Rolspecifieke KPI kaarten |
| Trial signup | Gebouwd | Edge function + signup pagina |
| Marketing website | Gebouwd | B2B gepositioneerd met parallax |
| Nummering | Gebouwd | SCH-YYYY-0001, OF-YYMMDD-0001 patronen |

### Wat ONTBREEKT of onvolledig is

| Feature | Uit spec | Status |
|---------|----------|--------|
| **Notificatie Center** (bell icon + dropdown in header) | Sectie 14.5 | Niet gebouwd — notificaties tabel bestaat maar geen UI voor bell icon/dropdown |
| **Consument portal** | Sectie 14.3 | Deels — consument kan inloggen maar heeft geen specifieke "Mijn Offertes" view met accepteren/afwijzen/feedback, geen "Mijn Schouwen" view |
| **Offerte accepteren/afwijzen door consument** | Sectie 7.7 | Niet gebouwd — geen feedback berichten, geen accepteer/afwijs flow |
| **Dashboard met live data** | Sectie 5.1-5.5 | Placeholder waarden ("—") — geen echte queries |
| **Partner onboarding met welkom-email** | Sectie 6.4 | Deels — user wordt aangemaakt maar geen email verzending |
| **GDPR export/verwijdering** | Sectie 10.3 | Niet gebouwd |
| **Cookie consent banner** | Sectie 10.3 | Niet gebouwd |
| **Session timeout waarschuwing** | Sectie 14.6 | Niet gebouwd |
| **File uploads (product afbeeldingen)** | Sectie 11 | Niet gebouwd — geen storage bucket, geen upload UI |
| **Documenten module** | Sectie 3.9 | Tabel bestaat maar geen CRUD UI pagina |
| **Energieadvies view** | Sectie 14.4 | Niet gebouwd |
| **Schouw Wizard** (stapsgewijs) | Sectie 14.1 | Formulier is plat, niet stapsgewijs/wizard-stijl |
| **Offerte vanuit schouw pre-filled** | Sectie 14.2 | Koppeling bestaat maar geen directe "genereer offerte" knop vanuit schouw |
| **Bulk status update leads** | Sectie 5.2 | Niet gebouwd |
| **Product statistieken** | Sectie 7.9 | Niet gebouwd |
| **Omzet/conversie analytics** | Sectie 12.1 | Basis charts maar geen omzet, gemiddelde offerte waarde, top producten, conversieratio |
| **Gebruikers beheer (partner_admin)** | Sectie 5.2 | partner_admin mist "Gebruikers" in sidebar nav |
| **Consument sidebar items** | Sectie 5.5 | Mist "Mijn Offertes", "Afspraken", "Berichten" specifiek voor consument |

### Plan: Ontbrekende functionaliteiten bouwen

Dit is een groot pakket. Ik stel voor dit in fases aan te pakken:

**Fase 1 — Kritieke ontbrekende features**
1. Dashboard met live data queries (alle rollen)
2. Notificatie Center (bell icon in header + dropdown)
3. Consument portal (Mijn Offertes met accepteren/afwijzen/feedback, Mijn Schouwen)
4. Sidebar navigatie aanvullen (gebruikers voor partner_admin, consument items)
5. Offerte genereren vanuit schouw (directe link)

**Fase 2 — Bestands- en documentbeheer**
6. Storage bucket voor product afbeeldingen + upload UI
7. Documenten pagina (CRUD, gekoppeld aan entiteiten)

**Fase 3 — Geavanceerde features**
8. GDPR data export + account verwijdering
9. Cookie consent banner
10. Session timeout waarschuwing
11. Uitgebreide analytics (omzet, conversie, top producten)
12. Bulk status update voor leads

**Fase 4 — Nice-to-haves**
13. Schouw wizard (stapsgewijs)
14. Energieadvies view
15. Product statistieken endpoint

Vanwege de omvang raad ik aan om met **Fase 1** te beginnen. Zal ik dat uitvoeren?

