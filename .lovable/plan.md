

## Plan: Planning & Afspraken fixes

### Problemen gevonden

1. **Adviseurs kunnen geen teamleden zien in dropdown**: De `users` tabel RLS laat adviseurs alleen hun eigen profiel zien (`id = auth.uid()`). De query in AfspraakNieuw/Planning die teamleden ophaalt retourneert daarom een lege lijst voor adviseurs. Oplossing: voeg een RLS policy toe zodat adviseurs andere users binnen hun partner kunnen zien (beperkt tot naam/rol).

2. **"Mijn agenda" default verkeerd voor partner_admin**: `mijnAgenda` staat standaard op `true` voor iedereen. Partner_admins moeten standaard alle afspraken zien.

3. **Geen adviseur-filter voor partner_admin**: Partner_admin kan alleen schakelen tussen "alles" en "mijn agenda", maar kan niet filteren op een specifieke adviseur.

4. **Afspraken niet in types**: `afspraken` wordt als `as any` benaderd. Dit werkt maar maakt debugging lastig.

---

### Wijzigingen

#### 1. Database: RLS policy voor adviseurs om teamleden te zien
SQL migratie — voeg een SELECT policy toe op `users`:
```sql
CREATE POLICY "Adviseur ziet partner teamleden"
ON public.users FOR SELECT TO authenticated
USING (
  get_user_role(auth.uid()) = 'adviseur'
  AND partner_id = get_user_partner_id(auth.uid())
);
```
Dit geeft adviseurs leestoegang tot collega's binnen hun partner. Hiermee werkt de team-dropdown.

#### 2. Planning.tsx — Slim default voor mijnAgenda + adviseur-filter
- Default `mijnAgenda` op `false` wanneer `profile.rol` = `partner_admin` of `partner_staff`.
- Voeg een adviseur-filter dropdown toe (alleen zichtbaar voor partner_admin/partner_staff) waarmee gefilterd kan worden op een specifieke adviseur of "Alle adviseurs".
- Pas `filteredEvents` aan om de geselecteerde adviseur-filter te respecteren.

#### 3. Planning.tsx — Adviseur-naam duidelijker tonen
- Bij "Alle afspraken" modus: toon adviseur-voornaam bij elke event chip (al geïmplementeerd, maar verifiëren dat userMap correct gevuld wordt na RLS fix).

#### 4. AfspraakNieuw.tsx — Geen wijzigingen nodig
De code is correct, het probleem is puur RLS (punt 1).

---

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| SQL migratie | Adviseur-leestoegang op users tabel |
| `src/pages/Planning.tsx` | Slim default mijnAgenda, adviseur-filter dropdown |

