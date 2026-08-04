# Fix: verdwenen gespreksnotities + lead blijft bij "nieuwe leads"

## Wat er aan de hand is (geverifieerd)

**1. Heative staat bij de nieuwe leads**
De lead Heative heeft status `mail_gestuurd` (door Bas gezet op 4-8 om 11:13), maar `fase_slug` staat nog op `nieuw`.
De app gebruikt twee losse velden voor dezelfde pijplijn:
- de affiliate-pijplijn groepeert op `status`
- de sales-pijplijn en de dashboards groeperen op `fase_slug`

Niets houdt deze twee gelijk. Dit speelt breder: **71 leads** hebben een status verder dan nieuw terwijl hun fase nog op "nieuw" staat (22 verloren, 17 geen gehoor, 13 mail gestuurd, 6 terugbel gepland, 6 demo gepland, 1 gewonnen, enz.).

**2. Gespreksnotities gaan verloren**
Bij Heative is geen enkel contactmoment vastgelegd, terwijl de statuswijziging wel is doorgekomen. In het belscherm zitten drie plekken waar een getypte notitie stilzwijgend weg is:
- "Overslaan" wist het notitieveld zonder iets op te slaan
- als de verplichte afspraak- of verloren-dialoog wordt afgebroken, wordt er niets vastgelegd
- als het opslaan van het contactmoment faalt, breekt de hele actie af zonder duidelijke melding en zonder dat de tekst ergens bewaard blijft (bij verversen of van lead wisselen is hij weg)

Rechten zijn niet de oorzaak: Bas heeft zowel de affiliate- als de sales_manager-rol en mag contactmomenten aanmaken.

## Wat ik ga doen

### A. Fase en status automatisch gelijkhouden (database)
- Vertaaltabel status -> fase: nieuw/campagne/demo-voltooid -> Nieuw, geen gehoor/mail gestuurd/terugbel gepland -> Benaderd, gesprek/demo gepland en in gesprek -> Gekwalificeerd, voorstel verstuurd -> Voorstel, trial gestart -> Trial, gewonnen -> Gewonnen, verloren -> Verloren.
- Automatische koppeling bij elke statuswijziging. Handmatig gekozen fases blijven staan: de koppeling grijpt alleen in als de status wijzigt zonder dat de fase zelf wordt aangepast.
- Eenmalige correctie van de 71 leads met een achtergebleven fase, zodat Heative en de rest meteen in de juiste kolom staan.

### B. Notities failsafe maken in het belscherm
- Concept-notitie per lead bewaren in de browser, zodat de tekst blijft staan bij verversen, van lead wisselen of een mislukte opslagpoging.
- "Overslaan": als er nog tekst staat, wordt die eerst als losse notitie vastgelegd voordat naar de volgende lead wordt gegaan.
- Afgebroken afspraak- of verloren-dialoog: notitie blijft staan en er komt een duidelijke melding dat er nog niets is gelogd.
- Mislukt opslaan geeft voortaan een expliciete foutmelding met de reden; de tekst blijft in beeld staan zodat niets verloren gaat.
- Zichtbare "niet-opgeslagen"-indicator naast het notitieveld.

## Technische details
- Migratie: functies `affiliate_lead_fase_van_status` en `sync_affiliate_lead_fase`, trigger `trg_sync_affiliate_lead_fase` (BEFORE INSERT OR UPDATE OF status) op `affiliate_leads` + backfill-UPDATE.
- Frontend: `src/pages/affiliate/AffiliateBellen.tsx` (concept-opslag, guard rond `log.mutateAsync`, overslaan-flow) en een kleine hook `src/hooks/affiliate/useNotitieConcept.ts` voor de conceptopslag.
- Geen wijziging in rechten of RLS nodig.
