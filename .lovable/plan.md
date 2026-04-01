

## Plan: Add-ons module voor extra adviseurs en installateurs

### Overzicht

Partners kunnen via hun abonnementspagina extra adviseurs/installateurs bijkopen als add-ons. Admin kan add-ons configureren (prijs, type, limieten). Het effectieve limiet wordt: planlimiet + gekochte add-ons.

### Database

**Nieuwe tabel: `abonnement_addons`** (admin-configureerbare add-on types)

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| naam | text | "Extra adviseur", "Extra installateur" |
| slug | text unique | `extra_adviseur`, `extra_installateur` |
| type | text | `adviseur` / `installateur` |
| maand_prijs | numeric | Prijs per stuk per maand |
| jaar_prijs | numeric | Prijs per stuk per jaar |
| beschrijving | text | |
| actief | boolean | default true |
| created_at / updated_at | timestamptz | |

**Nieuwe tabel: `abonnement_addon_aankopen`** (per partner gekochte add-ons)

| Kolom | Type | Beschrijving |
|-------|------|-------------|
| id | uuid PK | |
| abonnement_id | uuid | FK naar abonnementen |
| addon_id | uuid | FK naar abonnement_addons |
| partner_id | uuid | |
| aantal | int | Aantal bijgekocht (bijv. 3 extra adviseurs) |
| interval | text | maandelijks/jaarlijks |
| maand_bedrag | numeric | Berekende prijs |
| status | text | actief/opgezegd |
| start_datum | date | |
| eind_datum | date | nullable |
| created_at | timestamptz | |

**RLS**: SELECT eigen partner + superadmin; CRUD superadmin; INSERT/UPDATE partner_admin (eigen partner)

### Wijzigingen

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | 2 nieuwe tabellen + RLS |
| `src/components/abonnementen/PlanConfigurator.tsx` | Nieuwe sectie "Add-ons beheer" onderaan: CRUD voor add-on types |
| `src/components/abonnementen/PartnerAbonnement.tsx` | Sectie "Add-ons" tonen: huidige add-ons + knop om bij te kopen |
| `src/hooks/useSubscriptionLimits.ts` | `isWithinLimit` uitbreiden: planlimiet + som van gekochte add-ons |
| `src/components/abonnementen/AbonnementOverzicht.tsx` | Add-on aankopen tonen per partner in het admin overzicht |
| `src/pages/AdminAbonnementen.tsx` | Tab "Plannen" hernoemen of add-ons sectie integreren |

### Logica

- **Effectief limiet** = `plan.max_adviseurs + SUM(addon_aankopen.aantal WHERE type='adviseur')`
- Partner kan via dialog een add-on selecteren, aantal kiezen, en bevestigen
- Admin ziet in het overzicht welke partners welke add-ons hebben
- Add-on bedrag wordt opgeteld bij maandbedrag op de partner-pagina

