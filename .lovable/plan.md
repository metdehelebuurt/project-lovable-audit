# Belsessie cockpit: UX-verbetering + slimme automatiseringen

## Doel
De rechter "Hoe ging het?"-knoppen worden nu domweg een statusupdate. De gebruiker wil dat de knoppen écht het gevolg afdwingen: bij "Afspraak gepland" moet er een afspraak staan, bij "Terugbellen" een terugbel-moment, bij "Voorstel doen" optioneel een demo, en "Demo inplannen" moet daadwerkelijk een demo-afspraak in de agenda zetten.

## Wat verandert er in de UI (AffiliateBellen.tsx)

1. Soundboard rechts wordt een **"Volgende stap"-paneel** met dezelfde knoppen, maar gegroepeerd:
   - **Niet bereikt** — Geen gehoor · Terugbellen
   - **Niet relevant** — Niet interessant
   - **Bereikt & vervolg** — Afspraak gepland · Demo inplannen · Voorstel doen
   - **Deal** — Gewonnen · Trial starten
   - Footer: Overslaan
2. Visuele rust: subtielere hover-kleuren, iconen links uitgelijnd, kop ("Volgende stap") groter en duidelijker.
3. Header-stats compacter; "Gebeld vandaag" en "Afspraken" worden klikbare badges met tooltip.
4. Op kleine schermen klapt het paneel onder de kaart in plaats van naast.
5. Bedrijfskaart-titel: het telefoonblok krijgt een duidelijke "Klik om te bellen"-microcopy en een copy-icoon naast het nummer.

## Automatiseringen per uitkomst-knop

Centraal in een nieuwe helper `handleUitkomstMetAutomatisering` die per uitkomst een precondition kan afdwingen. Als de precondition niet vervuld is, open een passende dialog en pauzeer de statuswissel tot opslaan/annuleren.

| Knop | Precondition | Gedrag bij ontbreken |
|---|---|---|
| Geen gehoor | — | Direct status + log |
| Terugbellen | Er staat een open terugbel-afspraak op deze lead in de toekomst | Open `TerugbelDialog` (type=terugbel). Pas na succesvol plannen → status + log + next |
| Afspraak gepland | Open `afspraak` (terugbel- of demo-type) of `volgende_actie_datum` in de toekomst | Open `TerugbelDialog` (type=demo) met titel "Afspraak inplannen". Pas na opslaan → status + log + next |
| Demo inplannen (nieuwe knop) | Idem als afspraak, maar dwingt `type=demo` af | Opent `TerugbelDialog` (type=demo). Bij opslaan: status `gesprek_gepland`, log "Demo gepland", next |
| Voorstel doen | — | Direct status + log. Daarna toast met "Voorstel verstuurd? Open lead om PDF te genereren" met deeplink |
| Niet interessant | Notitie verplicht (verloren-reden) | Als notitie leeg → focus textarea + toast "Geef kort de reden" |
| Gewonnen | — | Direct status; trigger `TrialStartenDialog` automatisch openen indien email+bedrijf bekend |
| Trial starten | Bestaand gedrag blijft |

## Demo-knop werkt écht

* `TerugbelDialog` ondersteunt al `afspraakType="demo"` — we voegen een knop "Demo inplannen" toe in het paneel die deze dialog opent met `afspraakType="demo"`.
* Na succesvol opslaan wordt de lead status `gesprek_gepland`, en het contactmoment krijgt uitkomst "Demo gepland" (met `duur_seconden`).
* Onboarding: in `useCreateTerugbel` worden bij `type=demo` al de mail naar klant + interne notificatie verstuurd; we verifiëren dat de bevestigingsmail-template voor demo's bestaat. Indien generieke template gebruikt wordt, breiden we `affiliate-afspraak-notify` uit om bij `type=demo` een aangepaste onderwerpregel/intro te gebruiken ("Bevestiging demo …" i.p.v. "Bevestiging terugbelafspraak …").

## Technische details

* Nieuw bestand `src/lib/affiliate/uitkomstAutomatisering.ts` met:
  - `vereistAfspraak(uitkomst, lead, terugbelAfspraken)`: booleaanse precondition-check
  - `volgendeStapDialog(uitkomst)`: 'terugbel' | 'demo' | null
* `AffiliateBellen.tsx`:
  - Nieuwe state `pendingUitkomst` (uitkomst die op een dialog wacht)
  - Bij dialog `onOpenChange(false)` → reset pendingUitkomst
  - Bij dialog success (we voegen `onSaved` callback toe aan `TerugbelDialog`) → log + status + next uitvoeren
* `TerugbelDialog`:
  - `onSaved?: () => void` toegevoegd, aangeroepen na succesvol `create.mutateAsync`
  - Titel + placeholder al per type aanwezig — niets te wijzigen daar
* `affiliate-afspraak-notify` edge function: subject/intro afhankelijk van `type` (demo vs terugbel)
* Geen DB-migraties nodig

## Eindresultaat

* Strakker soundboard met duidelijke groepen
* Nieuwe knop "Demo inplannen" die echt in de agenda + mail belandt
* Klikken op "Afspraak gepland" zonder bestaande afspraak → automatisch popup om dat alsnog te doen, status volgt pas na opslaan
* Klikken op "Terugbellen" → forceert terugbel-moment
* Demo-bevestigingsmail krijgt eigen tekst
