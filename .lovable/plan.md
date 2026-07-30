## Wat er precies mis is (geverifieerd)

Bij het break-glass-project is op **66 tabellen** een policy `break_glass_superadmin_restrict` gezet met de conditie:

```text
(NOT is_superadmin(auth.uid())) OR has_break_glass_access(auth.uid(), partner_id)
```

Die conditie is bedoeld als *restrictive* (AND-laag bovenop de andere policies): "als je superadmin bent, moet je break-glass hebben".

Uit de database blijkt: **64 van de 66 staan correct als RESTRICTIVE**, maar **2 staan als PERMISSIVE**:

- `public.users`
- `public.contactpersonen`

Permissieve policies worden ge-OR'd. Voor iedere niet-superadmin is `NOT is_superadmin(...)` = `true`, dus de policy geeft op zichzelf al toegang tot **alle rijen, voor alle commando's (ALL)**, aan rol `public`. Alle nette partner-scoped policies eronder worden daardoor irrelevant.

Gevolg: elke ingelogde gebruiker (zoals een verse trial-account) kan **alle gebruikers en alle contactpersonen van het hele platform lezen, wijzigen en verwijderen**. Precies wat je zag.

Extra bijdragende factor in de frontend: `src/pages/Gebruikers.tsx` haalt `supabase.from("users").select("*")` op **zonder enige partner-filter** — de pagina leunt 100% op RLS. Er is dus geen tweede vangnet.

## Reparatie

**1. Migratie — policies omzetten naar RESTRICTIVE**

Voor `public.users` en `public.contactpersonen`: de permissieve policy droppen en opnieuw aanmaken als `AS RESTRICTIVE ... TO authenticated`, met exact dezelfde conditie als de andere 64 tabellen (voor `users` inclusief de bestaande uitzonderingen: eigen profiel, partnerloze rijen, affiliate-rijen).

**2. Migratie — controle-guard tegen herhaling**

Een event trigger of een expliciete verificatiequery is te zwaar; in plaats daarvan voegen we een migratie-check toe die faalt zolang er nog een permissieve policy met die naam bestaat:

```text
DO $$ BEGIN
  IF EXISTS (... polname='break_glass_superadmin_restrict' AND polpermissive) THEN
    RAISE EXCEPTION 'break-glass policy staat permissief';
  END IF;
END $$;
```

**3. Frontend — defense in depth**

In `src/pages/Gebruikers.tsx` de query scopen op `partner_id` van het eigen profiel voor niet-superadmins (superadmin behoudt het volledige overzicht). Zelfde check op de mutaties: bewerken/verwijderen alleen tonen voor gebruikers binnen de eigen organisatie. Zo lekt de pagina niets meer, ook niet als een policy ooit weer misgaat.

**4. Verificatie**

- Alle 66 policies opnieuw uitlezen en bevestigen dat er 0 permissieve tussen zitten.
- Supabase-linter draaien.
- Een gerichte query per rol-scenario (trial partner_admin, affiliate, sales_manager) om te bevestigen dat `users` alleen eigen-partnerrijen teruggeeft.
- Controleren dat superadmin-flows (gebruikersbeheer, break-glass) nog werken.

## Overige plekken — scanresultaat

Ik heb de hele `public`-schema doorzocht op vergelijkbare patronen:

- Permissieve policies met conditie `true` op ALL: alleen op `affiliate_opvolg_log`, `affiliate_opvolg_regels`, `email_routing_config`, `offerte_email_attachment_audit` — allemaal beperkt tot `service_role`. Dat is correct.
- Publieke leesrechten met `true`: abonnementsplannen, add-ons, lead-bronnen, sales-tags, affiliate-instellingen. Dat is bewust publieke/gedeelde referentiedata; wel neem ik `affiliate_instellingen` mee in de check of daar geen gevoelige velden in staan.
- `klanten`, `partners`, `offertes`: correct partner-scoped, break-glass staat daar wél restrictive.

Andere lekken van dit type zijn er dus niet — het beperkt zich tot deze twee tabellen.

## Technische details

- Migratie 1: `DROP POLICY break_glass_superadmin_restrict ON public.users` + `CREATE POLICY ... AS RESTRICTIVE FOR ALL TO authenticated USING (...) WITH CHECK (...)`; idem voor `contactpersonen` (daar zonder de users-specifieke uitzonderingen, conform de standaardvariant).
- Let op: bij RESTRICTIVE moet ook `WITH CHECK` gezet worden, anders blijven schrijfacties ongefilterd.
- Geen wijziging aan `get_user_role`, `is_superadmin` of `has_break_glass_access` nodig.
- Frontend-wijziging blijft beperkt tot `src/pages/Gebruikers.tsx` (en zo nodig `GebruikerDetail.tsx` voor dezelfde scope-check).
