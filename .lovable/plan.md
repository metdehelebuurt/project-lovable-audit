## Probleem

Bij het inplannen van een demo via "Demo plannen" (vanuit een affiliate-lead) komt in jouw Google Agenda nu alleen `Demo Mijnhuis (via sales)` te staan — zonder bedrijfsnaam, contactpersoon of meeting-link. Ook krijgt de contactpersoon van de lead geen uitnodiging.

Bron: edge function `affiliate-afspraak-plannen` (sales-/superadmin-flow) maakt een Google-event met een vaste, generieke titel en zonder `attendees`.

## Oplossing

Eén kleine, doelgerichte update in de bestaande "Demo inplannen"-flow. Niets verandert aan de status- of mail-workflow erna.

### 1. Sprekende titel in Google Agenda

Nieuwe titelopbouw (alleen voor demo's; terugbel blijft `Terugbelafspraak`):

```text
Demo {bedrijfsnaam} – {contactpersoon}
```

Voorbeelden:
- `Demo Smart Accu B.V. – Hoang Nguyen`
- `Demo Smart Accu B.V.` (als geen contactpersoon bekend)
- `Demo – Hoang Nguyen` (als geen bedrijfsnaam, alleen privé-lead)
- Fallback: `Demo Mijnhuis` (geen lead-gegevens beschikbaar)

### 2. Uitgebreidere beschrijving

De Google-event description krijgt:
- Bedrijfsnaam + contactpersoon
- Telefoon en e-mail van de contactpersoon
- De ingevulde notitie
- Korte herkomst-regel ("Gepland via mijnhuis.nu")

### 3. Contactpersoon ontvangt uitnodiging

We voegen de lead-contactpersoon als **attendee** toe aan het Google-event en zetten `sendUpdates=all`, zodat Google direct een agenda-uitnodiging naar dat e-mailadres stuurt. De affiliate-agenda-eigenaar (organisator) wordt automatisch ook attendee.

Bron voor het mailadres, in volgorde van voorkeur:
1. Hoofdcontact uit `affiliate_lead_contactpersonen` (`is_hoofdcontact = true`)
2. `affiliate_leads.email`
3. Als geen mail bekend → géén attendees toevoegen (event wordt wel aangemaakt, gewoon zonder uitnodiging — voorkomt 400 van Google)

We voegen alleen de hoofdcontactpersoon toe, niet alle contactpersonen, om te voorkomen dat secundaire contacten ongewenst meegenodigd worden. Wel-of-niet-uitnodigen blijft daarmee voorspelbaar.

### 4. Dialog-tekst aanpassen

In `TerugbelDialog` (modus = demo) komt onderaan een korte regel:

> De hoofdcontactpersoon ontvangt een Google-agenda-uitnodiging zodra de demo gepland is.

Plus: het mail-review-blok dat al bestaat blijft werken — daar kun je nog de inhoudelijke bevestigingsmail nakijken.

## Wat er NIET verandert

- De `MailReviewDialog`-flow (klant/collega-mail nalezen) blijft identiek.
- Terugbelafspraken houden hun huidige titel en gedrag.
- De flow voor reguliere affiliates (geen sales-proxy) heeft op dit moment geen Google-sync; dat staat los van deze klacht en pakken we hier niet aan.
- Geen DB-migratie nodig — alles draait op bestaande velden (`affiliate_leads.bedrijfsnaam/contactpersoon/email/telefoon` en `affiliate_lead_contactpersonen`).

## Technische uitwerking

Bestand: `supabase/functions/affiliate-afspraak-plannen/index.ts`

Vlak voor de bestaande `gcalFetch(...POST /events)`-call:

1. Haal lead-velden op: `bedrijfsnaam, contactpersoon, email, telefoon`.
2. Haal hoofdcontactpersoon op uit `affiliate_lead_contactpersonen` met `is_hoofdcontact = true` (één rij, kolommen `naam, email, telefoon_mobiel, telefoon_kantoor`).
3. Bouw `titel`, `description` en `attendees[]` op basis daarvan.
4. POST-body wordt:

```ts
{
  summary: titel,
  description,
  start: { dateTime: startIso, timeZone: 'Europe/Amsterdam' },
  end:   { dateTime: endIso,   timeZone: 'Europe/Amsterdam' },
  attendees: attendeeEmail ? [{ email: attendeeEmail, displayName: contactNaam }] : undefined,
  guestsCanSeeOtherGuests: true,
  extendedProperties: { /* ongewijzigd */ },
}
```

5. Query-param `sendUpdates=all` toevoegen aan de gcalFetch-URL zodat Google de uitnodiging direct mailt.

Frontend (`src/components/affiliate/TerugbelDialog.tsx`): één regel info-tekst toevoegen onder de bestaande toelichting wanneer `isDemo` true is.

## Acceptatiecriteria

- [ ] Nieuwe demo voor "Smart Accu B.V." met contact "Hoang Nguyen" levert in Google Agenda: `Demo Smart Accu B.V. – Hoang Nguyen`.
- [ ] De ingestelde contactpersoon staat in de uitnodiging als genodigde en ontvangt direct een Google-agenda-mail.
- [ ] Description bevat bedrijfsnaam, contactpersoon, telefoon, mail, ingevulde notitie en "Gepland via mijnhuis.nu".
- [ ] Demo zonder bekende contactpersoon werkt zonder fout (geen attendees, geen Google 400).
- [ ] Terugbelafspraken houden hun bestaande titel/gedrag.
- [ ] Geen TS- of edge-function errors; `affiliate-afspraak-plannen` opnieuw gedeployed.
