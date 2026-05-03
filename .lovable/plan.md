## Probleem
`wiresh@cenora.nl` is aangemaakt als `partner_admin` met `partner_id = NULL`. Door de restrictive RLS-policy `break_glass_superadmin_restrict` op `public.users` is deze rij voor jou (superadmin) onzichtbaar. De aanmaakflow had dit nooit mogen toelaten.

## Wat ik ga doen

### 1. Bestaande wees-user koppelen (migratie)
Welke partner moet wiresh@cenora.nl bij horen? Zonder die info kan ik niet veilig koppelen — ik vraag dat in build-mode kort na via een dialoog. Daarna één UPDATE:
```sql
UPDATE public.users
SET partner_id = '<gekozen partner_id>'
WHERE id = 'cd06ce6b-3bce-4950-9d2f-1cc4f7244f44';
```

### 2. Aanmaakflow afschermen — frontend (`src/pages/Gebruikers.tsx`)
- Voor superadmin: `partner_id` is **verplicht** voor elke rol behalve `superadmin`. Submit blokkeren met duidelijke toast als leeg.
- Fallback `profile?.partner_id ?? undefined` weghalen voor superadmin (die heeft er geen) zodat er nooit per ongeluk een undefined doorglipt.

### 3. Aanmaakflow afschermen — edge function (`supabase/functions/user-management/index.ts`, case `create_user`)
Server-side guard toevoegen vóór de insert:
```ts
if (rol !== "superadmin" && !partner_id) {
  return 400 "partner_id is verplicht voor deze rol";
}
```
Dit dekt ook de `UitnodigDialog`-flow en eventuele toekomstige aanroepers.

### 4. Hetzelfde toepassen op `invite_user`
Snelle scan leerde dat de invite-flow ook `partner_id: profile?.partner_id` doorgeeft — voor superadmin is dat NULL. Daar dezelfde guard inbouwen.

### 5. RLS niet aanpassen
Per jouw keuze laten we de strikte break-glass policy intact. De nieuwe validaties zorgen dat dit niet meer kan ontstaan.

## Niet in scope
- Andere security findings uit eerdere scans — die staan geparkeerd zoals afgesproken.
- Zoeken in de DB naar andere wees-users (kan ik wel even doen voor de zekerheid; meld ik tijdens uitvoer).

## Bestanden
- `src/pages/Gebruikers.tsx` (validatie + fallback)
- `supabase/functions/user-management/index.ts` (guards in `create_user` + `invite_user`)
- 1 migratie (UPDATE op de wees-user)
