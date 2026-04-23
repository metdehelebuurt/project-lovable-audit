

## Plan — Instellingen voor alle rollen + configureerbare berichten-toegang

### Probleem

1. **Roshny (backoffice) ziet geen Instellingen-menu.** De sidebar (`AppSidebar.tsx` r.176) toont "Instellingen" alleen voor `superadmin`, `partner_admin`, `partner_staff`, `affiliate`. Backoffice, adviseur, installateur en consument vallen buiten de boot — terwijl ze wél een eigen profiel, wachtwoord en notificatievoorkeuren willen kunnen beheren.
2. **Berichten zijn partner-breed gedeeld.** Iedereen binnen de organisatie ziet de complete inbox van de gedeelde mailbox — inclusief Roshny. Er is geen UI waarmee een organisatiebeheerder dit per rol of per gebruiker kan dichtzetten. RLS staat het toe, in code is er geen extra check.

### Wat we bouwen

**1. "Instellingen" zichtbaar voor élke rol — met scoped tab-set per rol**

In `AppSidebar.tsx` de role-gate verwijderen voor `/instellingen`, zodat het menu-item voor iedereen verschijnt (uitgezonderd `consument`, die houdt eigen mini-profielscherm).

In `Instellingen.tsx` wordt de `tabs`-lijst rolafhankelijk:

| Tab | superadmin / partner_admin | backoffice / partner_staff | adviseur / installateur |
|-----|:-:|:-:|:-:|
| Profiel | ✓ | ✓ | ✓ |
| Beveiliging (wachtwoord, 2FA-toggle) | ✓ | ✓ | ✓ |
| Notificatievoorkeuren | ✓ | ✓ | ✓ |
| **E-mailkoppeling (eigen Gmail/Outlook)** | ✓ | ✓ | ✓ |
| Opleverrapport-voorkeuren | ✓ | — | ✓ (installateur) |
| Privacy & Data | ✓ | ✓ | ✓ |
| Bedrijfsgegevens, Huisstijl, E-mail (org), Producten, Offertes, Leads, Schouwen, Nummerreeksen, Helpdesk-notif, Modules & rollen, Abonnement | ✓ | — | — |

`adminOnly`-flag wordt vervangen door een fijnere `roles?: AppRole[]`. Rendering zelf raakt niet — alleen de filter en de role-checks bij de tab-bodies.

**Notificatievoorkeuren** krijgt een eigen tab-id `notificaties` ín de Instellingen-pagina (de standalone route `/instellingen/notificaties` blijft bestaan voor backwards-compat, maar de tab is de primaire ingang).

**E-mailkoppeling voor uitvoerende rollen**: er is al `email_accounts` met `user_id` als unieke key. We voegen een **nieuwe component `MijnEmailKoppeling.tsx`** toe (lichtgewicht variant van `EmailConfiguratie`) die alleen de OAuth-koppeling Gmail/Microsoft voor de **eigen** user toont — geen SMTP/IMAP-bedrijfsinstellingen, geen `is_default_voor_partner`. Backoffice/adviseur/installateur kunnen hier hun persoonlijke mailbox koppelen.

**2. Configureerbare berichten-zichtbaarheid**

Twee complementaire mechanismen, beheerd door `partner_admin`:

**a) Module-toggle per rol/gebruiker** (al bestaand, alleen aansluiten)
We gebruiken het bestaande `module_rol_toegang` + `module_user_override` patroon met een nieuwe module-key `berichten_inbox`. De bestaande `<ProtectedRoute moduleKey="berichten" …>` (App.tsx r.238) wijzigen we naar `moduleKey="berichten_inbox"` zodat de module-matrix dit kan dichtzetten. **Migratie** voegt default-rijen toe in `module_rol_toegang` (true voor partner_admin/partner_staff/adviseur, **false voor backoffice/installateur** — zodat Roshny by default geen gedeelde inbox meer ziet, tenzij beheerder dit aanzet).

**b) Filter "alleen toegewezen berichten" per gebruiker**
Nieuwe kolom `users.berichten_zichtbaarheid text` met waarden `'alle' | 'toegewezen' | 'geen'`. Default `'alle'` voor bestaande rijen behalve `backoffice` en `installateur` → `'toegewezen'`. 

In de `partner_admin`-instellingen onder **Modules & rollen** komt een extra kaart **"Inbox-zichtbaarheid"** met per gebruiker een dropdown (alle / alleen toegewezen aan mij / geen). "Toegewezen" = e-mails die gekoppeld zijn aan een lead/klant/offerte waarvan de gebruiker eigenaar of toegewezen-aan is.

Aanpassingen aan code:
- `src/hooks/useActiecentrum.ts` — berichten-query past het filter toe op basis van `profile.berichten_zichtbaarheid`. Bij `'toegewezen'`: subquery via `lead_id in (eigen leads) or klant_id in (eigen klanten) or offerte_id in (eigen offertes)`. Bij `'geen'`: query overslaan, count = 0.
- `src/components/email/EmailInbox.tsx` — zelfde filter toegepast, en bij `'geen'` of module-disable een lege staat ("Inbox is uitgeschakeld door uw organisatiebeheerder").
- `useActiecentrumBadgeCount` — zelfde filter.
- `useModuleNotificatieCounts.ts` — module-key updaten.

**3. Migraties**

```sql
ALTER TABLE public.users 
  ADD COLUMN berichten_zichtbaarheid text NOT NULL DEFAULT 'alle' 
  CHECK (berichten_zichtbaarheid IN ('alle','toegewezen','geen'));

UPDATE public.users SET berichten_zichtbaarheid = 'toegewezen' 
  WHERE rol IN ('backoffice','installateur');

-- module-defaults per partner
INSERT INTO public.module_rol_toegang (partner_id, module_key, rol, toegestaan)
SELECT p.id, 'berichten_inbox', r.rol, 
       CASE WHEN r.rol IN ('backoffice','installateur','consument') THEN false ELSE true END
FROM public.partners p
CROSS JOIN (VALUES ('partner_admin'),('partner_staff'),('backoffice'),('adviseur'),('installateur'),('consument')) r(rol)
ON CONFLICT DO NOTHING;
```

### Bestanden

**Nieuw**
- `src/components/instellingen/MijnEmailKoppeling.tsx` — persoonlijke OAuth-koppeling (Gmail/Microsoft), ~200 regels
- `src/components/instellingen/InboxZichtbaarheidBeheer.tsx` — admin-tabel om per gebruiker te configureren, ~150 regels
- `src/hooks/useBerichtenZichtbaarheid.ts` — helper die filter berekent op basis van profile, ~60 regels
- migratie-bestand voor de twee SQL-blokken hierboven

**Aangepast**
- `src/components/AppSidebar.tsx` — Instellingen-link voor alle rollen (behalve consument)
- `src/pages/Instellingen.tsx` — tab-lijst met `roles?: AppRole[]`, nieuwe tabs "Notificaties" en "E-mailkoppeling", inboxbeheer-blok toegevoegd onder Modules-tab
- `src/hooks/useActiecentrum.ts` — berichten-query filtert via `useBerichtenZichtbaarheid`
- `src/components/email/EmailInbox.tsx` — zelfde filter + nette lege staat bij `'geen'`
- `src/App.tsx` — `moduleKey="berichten"` → `"berichten_inbox"` op `/berichten`
- `src/hooks/useModuleNotificatieCounts.ts` — module-key updaten
- `src/contexts/AuthContext.tsx` — profile-type uitbreiden met `berichten_zichtbaarheid`

### Niet-doelen
- Geen wijziging aan `email_berichten` RLS — controle blijft client-side op basis van profile-veld + module-toggle (RLS staat nog steeds partner-breed lezen toe, dus de waarborg is UX-niveau, niet data-niveau). Een hardere RLS-aanpassing zou bestaande inbox-functionaliteit voor admins/adviseurs niet mogen breken; valt buiten scope.
- Geen aanpassing aan helpdesk-tickets, offerte-berichten of notificaties (die zijn al user-specifiek).
- Geen migratie van bestaand `is_default_voor_partner` model — gedeelde mailbox blijft mogelijk, alleen wie 'm ziet wordt configureerbaar.

