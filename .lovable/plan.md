

## Plan — Volledige `/installaties/:id` detailpagina

Doel: één samenhangend desktopscherm met alle relevante installatie-info en een directe actiebalk om status te wijzigen (onderweg / start / pauze / gereed) en het opleverrapport te starten — zonder dat de gebruiker eerst naar het mobiele werkscherm hoeft.

### Wat al staat
- `InstallatieDetail.tsx` met tabs: Overzicht, Planning, Producten, Notities, Communicatie, Historie.
- Header met statusbadge, werkscherm-knop, opleverknop (voor status `gereed`/`in_uitvoering`) en ticketknop.
- Klantkaart, planningkaart, productenkaart.

### Wat nog ontbreekt
1. Geen prominente **actiebalk** op desktop — status kan alleen via het mobiele werkscherm.
2. Klant-snapshot toont geen **werkadres** apart als dit afwijkt van klantadres.
3. Geen visueel **status-tijdpad** (gepland → onderweg → in uitvoering → gereed → afgerond) op het overzicht.
4. Geen overzicht van werkelijke tijden (`werkelijke_starttijd`, `werkelijke_eindtijd`, `gereedmelding_op`) op desktop.

### Implementatie

**Nieuw component** `src/components/installaties/InstallatieActieBalk.tsx` (<150 regels):
- Sticky-card bovenaan het Overzicht-tabblad.
- Knoppen contextueel op basis van huidige status:
  - `gepland`/`bevestigd` → "Onderweg" + "Direct starten"
  - `onderweg` → "Aangekomen / starten" + "Pauzeren"
  - `in_uitvoering` → "Pauzeren" + "Gereed melden" (opent dialog met notitieveld)
  - `gereed` → "Opleverrapport maken" + "Markeer afgerond"
  - `afgerond`/`geannuleerd` → read-only badge "Afgesloten"
- Alle mutations via bestaande `useInstallatie().update`. Optimistische refetch + toast-feedback.
- Gebruikt dezelfde logica als `InstallatieMonteurView` (mutaties extraheren naar helper `useInstallatieActies.ts` zodat beide schermen dezelfde call gebruiken).

**Nieuw component** `src/components/installaties/InstallatieTijdlijn.tsx` (<120 regels):
- Horizontale steps-component met 5 stappen op basis van `INSTALLATIE_STATUS_VOLGORDE`.
- Toont per stap timestamp uit `installatie_historie` (laatste status-event) + werkelijke tijden indien ingevuld.
- Bij geannuleerd toont rode badge i.p.v. tijdlijn.

**Nieuwe hook** `src/components/installaties/useInstallatieActies.ts` (<80 regels):
- Exporteert `setStatus`, `gereedMelden`, `markeerAfgerond` met juiste timestamp-injectie en toasts. Hergebruikt door zowel desktop-actiebalk als monteur-werkscherm.

**Update `InstallatieKlantCard.tsx`** (~+15 regels):
- Toon werkadres expliciet als block "Werkadres (afwijkend)" wanneer `werkadres` ≠ `klant_adres`. Voeg knop "Open in Maps" naast adres.
- Toon naam + telefoonnummer toegewezen monteur (via lookup in `users`).

**Update `InstallatieDetail.tsx`** (~+25 regels):
- Op tab `overzicht` direct na de header:
  1. `<InstallatieActieBalk />`
  2. `<InstallatieTijdlijn />`
  3. Bestaande grid: KlantCard + Planning (read-only)
  4. ProductenCard
- Voeg `naarOplevering()`-handler door als prop aan `InstallatieActieBalk`.

**Klein bestand** `src/components/installaties/GereedMeldenDialog.tsx` (<80 regels):
- Modaal dialoog met textarea voor `gereedmelding_notitie` voor de "Gereed melden"-knop.

### Bestanden-overzicht

| Bestand | Actie |
|---|---|
| `src/components/installaties/InstallatieActieBalk.tsx` | nieuw |
| `src/components/installaties/InstallatieTijdlijn.tsx` | nieuw |
| `src/components/installaties/GereedMeldenDialog.tsx` | nieuw |
| `src/components/installaties/useInstallatieActies.ts` | nieuw |
| `src/components/installaties/InstallatieKlantCard.tsx` | edit — werkadres + monteur |
| `src/pages/InstallatieDetail.tsx` | edit — actiebalk + tijdlijn op overzicht |
| `src/pages/InstallatieMonteurView.tsx` | edit — switchen naar `useInstallatieActies` |

### Toegangsrechten
- Actiebalk-knoppen alleen actief voor `superadmin`, `partner_admin`, `partner_staff`, `backoffice` of de toegewezen `installateur`. Voor `consument`/`affiliate` worden ze verborgen (read-only weergave).

### Geen wijzigingen aan
- Datamodel (alle benodigde kolommen bestaan al).
- E-mail templates (geen automatische verzending bij statuswissels — alleen handmatige bevestigingen blijven via bestaande dialog).
- Bestaande tabs (Notities, Communicatie, Historie, Planning, Producten).

### Bevestigingsvragen
Geen — alle keuzes volgen bestaande patronen (rounded-2xl card, ghost back-button, sonner toasts, TanStack mutaties via `useInstallatie`).

