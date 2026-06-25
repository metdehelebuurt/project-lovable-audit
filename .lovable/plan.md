## Doel

De huidige leadkaart (`/affiliate/leads/:id`) toont alleen basisvelden en is niet rolbewust. We breiden hem uit met:

- meerdere contactpersonen per lead (eigen tabel)
- extra bedrijfsvelden (KvK, BTW, omvang, omzet, oprichtingsjaar, social, sales-context)
- volledige edit-rechten voor `sales_manager` en `superadmin`, met bewerk-banner
- eigenaar-overdracht door beheerders
- alle wijzigingen automatisch in `entiteit_historie`

## Database — één migratie

1. **Nieuwe tabel `affiliate_lead_contactpersonen`**
   - velden: `lead_id` (FK affiliate_leads, cascade), `naam`, `functie`, `email`, `telefoon_mobiel`, `telefoon_kantoor`, `linkedin_url`, `is_hoofdcontact` (bool), `notitie`, `created_by`
   - GRANT op `authenticated` + `service_role`
   - RLS hergebruikt zichtbaarheid van de parent: eigenaar of `is_sales_admin(auth.uid())` of `is_superadmin(auth.uid())`
   - migratie kopieert bestaande `affiliate_leads.contactpersoon` als eerste hoofdcontact

2. **Extra kolommen op `affiliate_leads`**
   - `kvk_nummer`, `btw_nummer`, `aantal_medewerkers` (int), `jaaromzet` (numeric), `oprichtingsjaar` (int)
   - `linkedin_url`, `facebook_url`, `instagram_url`
   - `huidige_leverancier`, `concurrenten` (text), `beslissingscriteria` (text)
   - allemaal nullable, geen default — bestaande rijen blijven werken

3. **Historie-trigger `log_affiliate_lead_changes`** op `affiliate_leads`
   - logt status, eigenaar, fase, temperatuur, contactpersoon-totaal, KvK/BTW, adres, waarde-wijzigingen naar `entiteit_historie` met `entiteit_type='affiliate_lead'` en de huidige actor
   - vergelijkbaar met bestaande `log_lead_changes`

4. **RPC `admin_overdracht_affiliate_lead(_lead_id, _nieuwe_eigenaar_id, _notitie)`**
   - alleen `is_sales_admin(auth.uid())`
   - update eigenaar, `toegewezen_door_admin_id`, `claimed_at`, logt notitie in contactmoment + historie

## Frontend

### Splitsen van `LeadDetailBody.tsx` (nu 434 regels)

Bestand wordt te lang met nieuwe blokken. Opsplitsen in:

```text
src/components/affiliate/LeadDetail/
  index.tsx                # huidige LeadDetailBody, alleen layout + tabs (≤200 regels)
  StickyHeader.tsx         # bestaande actie-bar + bewerk-banner
  SalesKernKaart.tsx       # status/temperatuur/waarde/volgende actie
  ContactKaart.tsx         # nieuwe lijst met contactpersonen (hoofd + extra)
  ContactpersoonDialog.tsx # toevoegen/bewerken/verwijderen
  BedrijfsKaart.tsx        # huidige + nieuwe velden, inline bewerkbaar
  BedrijfBewerkenDialog.tsx
  EigenaarOverdrachtDialog.tsx
  HistorieTab.tsx          # nieuwe tab — leest entiteit_historie
```

### Bewerk-banner

Boven de sticky header een `Alert` (variant primary) wanneer `currentUser.id !== lead.eigenaar_id` en `is_sales_admin`/`is_superadmin`:
`"Je bewerkt deze lead als platformbeheerder. Wijzigingen worden gelogd."` met knop "Eigenaar wijzigen".

### Contactpersonen-kaart

- vervangt de huidige enkele `lead.contactpersoon`-regel
- toont kaartjes per persoon met badge "Hoofd", quick-actions Bel/Mail/WhatsApp/LinkedIn
- knoppen: "Contactpersoon toevoegen", per kaart "Bewerken" + "Verwijderen"
- "Maak hoofdcontact" knop wisselt vlag; trigger zorgt dat er max 1 hoofdcontact per lead is (server-side check in RPC of trigger)

### Bedrijfsgegevens

- huidige velden (branche, regio, adres, postcode, plaats, website)
- nieuwe blokken: **Identiteit** (KvK/BTW/oprichtingsjaar), **Omvang** (medewerkers/jaaromzet), **Online** (LinkedIn/Facebook/Instagram), **Sales-context** (huidige leverancier, concurrenten, beslissingscriteria)
- één "Bewerken" knop opent dialog met alle velden in secties; opslaan via bestaande `useUpdateAffiliateLead`

### Historie-tab

- nieuwe tab naast Overzicht/Activiteit/E-mail/Notities/Opvolging
- leest `entiteit_historie` waar `entiteit_type='affiliate_lead'` en `entiteit_id=lead.id`
- toont: tijdstip, actor (naam + rol), actie, veld, oud→nieuw

### Toegang via route

- bestaande route `/affiliate/leads/:id` blijft; `ProtectedRoute` voor deze pagina krijgt `allowedRoles=['affiliate','sales_manager','superadmin']`
- sidebar/menu voor sales_manager toont link "Leads" die naar dezelfde pagina/list verwijst
- geen aparte sales-route nodig

## Hooks

- `useLeadContactpersonen(leadId)` — list + upsert + delete + setHoofdcontact (in `src/hooks/affiliate/useLeadContactpersonen.ts`)
- `useLeadHistorie(leadId)` — leest entiteit_historie (in `src/hooks/affiliate/useLeadHistorie.ts`)
- `useAdminOverdrachtLead()` — RPC-wrapper

## Veiligheid

- Geen nieuwe service-role calls; alles via Supabase-client met RLS
- Contactpersonen-RLS: zichtbaar/wijzigbaar als de huidige user de bovenliggende lead mag zien/wijzigen (security-definer helper `affiliate_lead_is_editable(_lead_id, _user_id)` om recursie te voorkomen)
- Zod-validatie in alle dialogs (e-mail, URL, KvK = 8 cijfers, BTW NL-formaat)

## Wat we expliciet NIET doen in deze ronde

- Geen wijziging aan de `leads`-tabel (sales CRM-leads) — alleen `affiliate_leads`
- Geen uitbreiding van de pipeline/Kanban-kaartjes (alleen het detail)
- Geen nieuwe documenten- of bijlagen-tab
- Geen wijziging aan offertes, trials of e-mailtemplates

## Stappenplan (bouwvolgorde na approval)

```text
1. Migratie: nieuwe tabel + kolommen + trigger + RPC
2. Hooks: contactpersonen, historie, overdracht
3. Splitsen LeadDetailBody → LeadDetail/ folder (zonder gedragsverandering)
4. ContactKaart + ContactpersoonDialog
5. BedrijfsKaart + BedrijfBewerkenDialog
6. Bewerk-banner + EigenaarOverdrachtDialog
7. Historie-tab
8. ProtectedRoute aanpassen + sidebar-link voor sales_manager
9. Smoke-test als affiliate / sales_manager / superadmin
```
