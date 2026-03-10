

# Mijnhuis.nu — Implementatieplan

Dit is een groot platform. We bouwen het in fasen, zoals de specificatie voorschrijft (sectie 18.13).

---

## Fase 1: Fundament (eerste stap)

### 1A. Database & Auth
- Lovable Cloud inschakelen (Supabase backend)
- Tabellen aanmaken: `partners`, `users` (met `rol` kolom — **niet** in een aparte user_roles tabel, want de spec definieert `rol` als kolom op users), `leads`, `schouwen`, `offertes`, `producten`, `installaties`, `tickets`, `documenten`, `notificaties`, `consumenten`
- Foreign keys en enums volgens spec
- RLS policies per tabel (multi-tenant isolatie via `partner_id`)
- Supabase Auth (email/wachtwoord)
- `has_role()` security definer functie voor RLS

### 1B. Theming & Design System
- Rubik font (Google Fonts)
- Kleurenpalet: primary #5B58E1, success #61CC72, warning #FFC107, error #F44336
- Custom CSS variabelen in `index.css`
- Button pill shape (`rounded-[40px]`), cards `rounded-2xl`, inputs `rounded-xl`
- Mijnhuis.nu SVG logo component

### 1C. Layout & Routing
- `AppSidebar` met rolgebaseerde menu-items (sectie 5)
- Header (72px) met notificatie-bell en user menu
- Responsive: sidebar 240px desktop, hamburger op mobile
- Routes per rol: `/dashboard`, `/partners`, `/leads`, `/schouwen`, `/offertes`, `/producten`, `/installaties`, `/planning`, `/analytics`, `/instellingen`
- Auth guard: redirect naar `/login` als niet ingelogd
- Rol guard: toegang beperken per route

### 1D. Login pagina
- Email + wachtwoord formulier in Mijnhuis.nu stijl
- Nederlandse labels en foutmeldingen
- Wachtwoord vergeten flow
- Na login: redirect naar rolgebaseerd dashboard

---

## Fase 2: Partners & Gebruikers

- Partners CRUD (superadmin only)
- Users CRUD met rolfiltering
- Adviseurs CRUD
- Partner onboarding flow (auto-create partner_admin)

## Fase 3: Leads & Producten

- Leads CRUD met statusflow
- Productcatalogus met categorie-specifieke specs (JSONB)
- Globale vs partner producten

## Fase 4: Schouwen & Offertes

- Schouw wizard (6 categorie-specifieke formulieren)
- Auto-nummering (SCH-YYYY-0001)
- Offerte generator met productzoeken, kortingen, live berekening
- Auto-nummering (OF-YYMMDD-0001)
- Consument offerte acceptatie/afwijzing

## Fase 5: Installaties, Tickets, Rest

- Installaties CRUD + planning
- Support tickets met chat
- Analytics dashboard (Recharts)
- Planning/kalender
- Notificatiesysteem
- Consument portal
- Email (SendGrid) via Edge Functions
- File uploads (Supabase Storage)
- GDPR export/delete
- Cookie consent

---

## Technische aanpak

- **Rollen**: `rol` kolom op `users` tabel + `has_role()` security definer functie voor RLS (geen aparte user_roles tabel, want spec definieert rol als onderdeel van user)
- **Multi-tenant**: Alle queries gefilterd op `partner_id` via RLS
- **State management**: React Query voor server state
- **Forms**: react-hook-form + zod validatie
- **UI**: shadcn/ui componenten met custom Mijnhuis.nu styling
- **Toasts**: Sonner voor feedback
- **Charts**: Recharts voor analytics

---

## Eerste implementatie

We starten met **Fase 1** (auth, theming, layout, login). Dit omvat:
- ~12 database tabellen + enums + RLS
- Login pagina
- Rolgebaseerde sidebar + routing
- 5 placeholder dashboards
- Mijnhuis.nu design system

Zal ik starten met Fase 1?

