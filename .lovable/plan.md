
# Plan — Gebruikersbeheer: detailpagina, module-rolmatrix per organisatie en per-gebruiker module-overrides

## Wat je krijgt

1. **Klikbare gebruikers** in `/gebruikers` → opent uitgebreide detailpagina (`/gebruikers/:id`)
2. **Module-rolmatrix per organisatie**: organisatiebeheerder bepaalt zelf welke rollen toegang hebben tot welke modules (bv. "energieadviseur mag standaard wel/niet bij Inkoopfacturen")
3. **Per-gebruiker module-overrides**: op de detailpagina vink je per module aan dat een specifieke gebruiker extra of juist géén toegang krijgt — bovenop wat zijn rol normaal mag
4. **Effectieve rechten** worden centraal afgedwongen: zowel in sidebar/route-bescherming (UI) als waar nodig in RLS (data)

## Concept

```text
Effectieve toegang(user, module) =
   override van die user op die module (allow / deny)
   ELSE  partner-rolmatrix(rol_van_user, module)
   ELSE  systeem-default (huidige hardcoded ProtectedRoute-lijsten)
```

3-niveau-cascade: gebruikersoverride > partner-rolmatrix > systeemdefault.

## Modules die instelbaar worden

Alleen de operationele modules — superadmin/eigenaarsfuncties blijven hard:
`leads`, `klanten`, `schouwen`, `offertes`, `opdrachten`, `installaties`, `planning`, `producten`, `tools`, `energieadvies`, `helpdesk`, `documenten`, `berichten`, `analytics`, `financieel_verkoop`, `financieel_inkoop`, `financieel_pakbonnen`, `financieel_btw`, `leveranciers`.

Niet instelbaar (altijd alleen voor `superadmin` of `partner_admin`): `partners`, `gebruikers`, `adviseurs`, `instellingen`, `affiliate-beheer`, `admin/abonnementen`.

## Database

### Nieuwe tabellen
```sql
-- Per partner: welke rollen mogen welke module
CREATE TABLE public.module_rol_toegang (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  module_key text NOT NULL,        -- 'leads', 'financieel_inkoop', ...
  rol app_role NOT NULL,
  toegestaan boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (partner_id, module_key, rol)
);

-- Per individuele gebruiker: override op module-niveau
CREATE TABLE public.module_user_override (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  toegestaan boolean NOT NULL,     -- true = extra toestaan, false = expliciet ontzeggen
  reden text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, module_key)
);
```

RLS: leesbaar/schrijfbaar voor `is_partner_admin_or_higher()` binnen eigen partner; lezen van eigen rij ook door de gebruiker zelf (voor sidebar-render).

### Helper-functie (security definer)
```sql
CREATE FUNCTION public.user_kan_module(_user_id uuid, _module_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE(
    (SELECT toegestaan FROM module_user_override
       WHERE user_id = _user_id AND module_key = _module_key),
    (SELECT toegestaan FROM module_rol_toegang m
       JOIN users u ON u.partner_id = m.partner_id AND u.rol = m.rol
       WHERE u.id = _user_id AND m.module_key = _module_key),
    true   -- geen config = volg systeemdefault (UI handelt strenger af)
  );
$$;
```

## Frontend

### `src/lib/modules.ts` — **nieuw**
- Centrale lijst van module-definities: `{ key, label, defaultRoles, route }`
- `useEffectieveModules()` hook → leest matrix + overrides van ingelogde user, returnt `Set<modulekey>`
- Helper `kanModule(modulekey)` voor gebruik in components

### `src/components/ProtectedRoute.tsx`
- Nieuwe optionele prop `moduleKey?: string`
- Cascade: eerst `allowedRoles` (systeemdefault), daarna `kanModule(moduleKey)` als gezet
- Een `deny` override blokkeert ook al stond rol in `allowedRoles`

### `src/components/AppSidebar.tsx`
- Filter sub-items en items op basis van `useEffectieveModules()`
- Financieel-submenu (verkoop/inkoop/pakbonnen/btw) krijgen elk eigen `module_key` zodat een adviseur wél "Verkoopfacturen" kan zien zonder "Inkoopfacturen"

### `src/pages/Gebruikers.tsx`
- Hele tabelrij wordt klikbaar → `navigate('/gebruikers/' + id)`
- Bestaande inline-acties (bewerk/wachtwoord/delete) blijven werken via `e.stopPropagation()`

### `src/pages/GebruikerDetail.tsx`
- Bestaat al; **nieuwe tab "Module-toegang"** toevoegen met `<UserModuleOverrides userId partnerId rol canEdit />`
- Tab "Statistieken" uitbreiden met: aantal openstaande tickets, aantal facturen aangemaakt, laatste 30 dagen activiteit
- Snelinfo-zijbalk: extra "Effectieve modules" mini-overzicht (badges)

### `src/components/gebruikers/UserModuleOverrides.tsx` — **nieuw** (≤180 regels)
- Per module een rij met:
  - Module-naam + huidige rol-default (✅/❌ badge)
  - Drie-stand selector: "Volg rol-default" / "Expliciet toestaan" / "Expliciet ontzeggen"
  - Optioneel veld "Reden" (audit)
- Mutaties via TanStack Query → `module_user_override` upsert/delete

### `src/components/instellingen/ModuleRolMatrix.tsx` — **nieuw** (≤220 regels)
- Tab in `/instellingen` (alleen zichtbaar voor `partner_admin`/`superadmin`)
- Tabel: rijen = modules, kolommen = rollen (`backoffice`, `partner_staff`, `adviseur`, `installateur`)
- Cell = checkbox `toegestaan`. Tooltip toont systeemdefault als baseline
- Mutaties bulk-upsert in `module_rol_toegang`
- "Reset naar standaard" knop (delete alle rijen voor die partner)

### Audit
- Wijzigingen op beide tabellen → `log_audit_event` trigger zodat AuditTijdlijn deze toont onder de gebruiker

## Bestanden

| Bestand | Actie |
|---|---|
| `supabase/migrations/…_module_toegang.sql` | **Nieuw** — 2 tabellen + RLS + `user_kan_module` + audit-trigger |
| `src/lib/modules.ts` | **Nieuw** — module-registry + hook |
| `src/components/ProtectedRoute.tsx` | `moduleKey` prop + cascade |
| `src/components/AppSidebar.tsx` | Filtert items via `useEffectieveModules` |
| `src/App.tsx` | Route `/gebruikers/:id` toevoegen + `moduleKey` op operationele routes |
| `src/pages/Gebruikers.tsx` | Klikbare rij → detailpagina |
| `src/pages/GebruikerDetail.tsx` | Nieuwe tab "Module-toegang" + uitbreiding stats/snelinfo |
| `src/components/gebruikers/UserModuleOverrides.tsx` | **Nieuw** |
| `src/components/instellingen/ModuleRolMatrix.tsx` | **Nieuw** |
| `src/pages/Instellingen.tsx` | Tab "Modules & rollen" toevoegen (alleen `is_partner_admin_or_higher`) |
| `src/components/gebruikers/GebruikerStats.tsx` | Tickets + facturen + recente activiteit |

## Niet wijzigen
- Bestaande RLS-policies op data-tabellen (leads/offertes/etc.): de matrix beïnvloedt **toegang tot de module/UI**, niet de data-RLS zelf. Een gebruiker zonder module-toegang ziet de pagina niet en kan dus geen calls doen
- `permissions.ts` helpers blijven voor harde rolchecks (admin-tier, partner-admin)
- Mollie blijft uitgesteld

## Volgorde van uitvoering
1. Database-migratie (tabellen + RLS + helper-functie + audit)
2. `src/lib/modules.ts` registry + hook
3. `ProtectedRoute` cascade + `App.tsx` `moduleKey` op routes
4. `AppSidebar` filtert op effectieve modules
5. `Gebruikers.tsx` rij klikbaar + route detail
6. `GebruikerDetail` tab + `UserModuleOverrides`
7. `Instellingen` tab + `ModuleRolMatrix`
8. Stats-uitbreiding

## Resultaat
- Klikken op een gebruiker → uitgebreide detailpagina met profiel, rol & rechten, **module-toegang per gebruiker**, statistieken, audit, verlof
- Organisatiebeheerder beheert in **Instellingen → Modules & rollen** centraal de matrix per rol
- Per-gebruiker uitzonderingen mogelijk: bv. één adviseur die wél bij Verkoopfacturen mag, een andere die alleen Schouwen ziet
- Sidebar en routes respecteren de matrix automatisch — geen verspreide rolchecks meer in pagina's
