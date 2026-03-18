

## Plan: Agenda weergaven (dag/week/maand/jaar) + export naar Google Calendar & Outlook

### Overzicht
De huidige Planning pagina heeft alleen een maandweergave. Dit plan voegt vier weergaven toe (dag, week, maand, jaar) plus export/abonneer-functionaliteit via iCal (.ics) voor koppeling met Google Calendar en Outlook.

### 1. Weergave-switcher en navigatie

Bovenaan de agenda een toggle-groep met vier opties: **Dag | Week | Maand | Jaar**. De navigatieknoppen (< >) passen zich aan per weergave (dag +/- 1 dag, week +/- 1 week, etc.). Een "Vandaag" knop brengt je terug naar de huidige datum.

State: `viewMode: "dag" | "week" | "maand" | "jaar"` + `currentDate: Date`

### 2. Vier weergaven

| Weergave | Layout | Data range |
|----------|--------|------------|
| **Dag** | Enkele kolom met tijdslots (08:00–20:00), events als blokken | 1 dag |
| **Week** | 7 kolommen (ma-zo) met tijdslots, events als blokken | 1 week |
| **Maand** | Bestaande grid (huidige implementatie) | 1 maand |
| **Jaar** | 12 mini-maandkalenders met kleur-dots voor dagen met events | 1 jaar |

Data fetching wordt aangepast: de query range past zich aan op basis van de actieve weergave (dag/week/maand/jaar).

### 3. iCal export & abonnement

**Twee opties in een dropdown-menu:**
- **Exporteer .ics bestand** — Genereert client-side een `.ics` bestand met alle zichtbare events en downloadt dit. Werkt direct zonder backend.
- **Abonneer op agenda (iCal feed)** — Een edge function `planning-ical-feed` die een live iCal feed URL levert. Deze URL kan in Google Calendar en Outlook worden geplakt als abonnement, zodat nieuwe events automatisch verschijnen.

**Edge function `planning-ical-feed`:**
- Publieke URL (met een uniek token per gebruiker voor authenticatie)
- Retourneert `text/calendar` content-type
- Haalt schouwen + installaties op voor de komende 6 maanden
- Genereert standaard VCALENDAR/VEVENT format

**Koppeling instructies:**
- Google Calendar: Instellingen → "Abonneren via URL" → plak de feed URL
- Outlook: Agenda → "Agenda van internet toevoegen" → plak de feed URL

### 4. Bestanden

| Bestand | Actie |
|---------|-------|
| `src/pages/Planning.tsx` | Refactor: viewMode state, navigatie, 4 weergaven, export dropdown |
| `supabase/functions/planning-ical-feed/index.ts` | **Nieuw** — iCal feed endpoint |
| `supabase/config.toml` | `verify_jwt = false` voor planning-ical-feed (token-based auth) |

### 5. Technische details

- iCal generatie (client-side export): Bouw VCALENDAR string handmatig — geen externe library nodig. Format: `BEGIN:VCALENDAR` → `VEVENT` per event met `DTSTART`, `DTEND`, `SUMMARY`, `DESCRIPTION`, `UID`.
- Edge function: Gebruikt service_role key om events op te halen voor de gebruiker wiens token in de URL zit. Token wordt opgeslagen als `ical_token` kolom op de `users` tabel.
- Database migratie: `ALTER TABLE public.users ADD COLUMN ical_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex');`

