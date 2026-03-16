

## Plan: Affiliate Module Volledig Uitbreiden

### Huidige staat
- **AffiliateBeheer** (superadmin): Toont stats, instellingen, lijst affiliates/referrals/codes — maar kan geen affiliates aanmaken of codes beheren
- **Affiliates** (affiliate dashboard): Kan links en codes maken, ziet referrals — maar kan geen offertes maken
- Sidebar toont affiliate maar met beperkte navigatie ("Mijn Klanten" + "Instellingen")

### Wat ontbreekt en wordt toegevoegd

**1. AffiliateBeheer.tsx — Superadmin uitbreiden**
- **Affiliate aanmaken dialog**: Formulier met voornaam, achternaam, email, telefoon — roept `user-management` edge function aan om auth user + profiel aan te maken met rol `affiliate`
- **Affiliate bewerken/deactiveren**: Status toggle (actief/inactief) en commissiepercentage per affiliate instellen
- **Kortingscode aanmaken door superadmin**: Superadmin kan ook codes aanmaken namens een affiliate (affiliate selecteren uit dropdown)
- **Referral commissie aanpassen**: Inline edit van commissie_percentage per referral
- **Uitbetalingen overzicht**: Totalen per affiliate, markeer als uitbetaald

**2. Affiliates.tsx — Affiliate dashboard uitbreiden**
- **Offerte aanmaken tab toevoegen**: Affiliates krijgen een "Offertes" tab waarin ze via een vereenvoudigd formulier offertes kunnen maken (hergebruik OfferteNieuw logica maar aangepast)
- **Offerte overzicht**: Lijst van eigen offertes met status, PDF bekijken link
- **Performance grafieken**: Simpele maandelijkse commissie/kliks chart

**3. Nieuwe route + RLS aanpassingen**
- Affiliate rol toevoegen aan offertes route allowedRoles zodat affiliates offertes kunnen bekijken en aanmaken
- RLS policy op offertes table: affiliate mag eigen offertes (adviseur_id = auth.uid()) SELECT en INSERT
- RLS policy op leads table: affiliate mag eigen leads aanmaken en zien

**4. Sidebar uitbreiden voor affiliate**
- Toevoegen: "Affiliate Links" (huidige /affiliates), "Offertes" (/offertes), "Leads" (/leads)

**5. OffertePDFPreview — Platform huisstijl**
- De PDF preview gebruikt al partner branding (logo, kleuren, slogan) — voor affiliates zonder partner_id wordt de platform standaard branding gebruikt (mijnhuis.nu logo, primaire kleur #5B58E1)

### Database wijzigingen (migratie)
- RLS policy toevoegen op `offertes`: affiliate mag INSERT (met partner_id = null of eigen) en SELECT eigen offertes
- RLS policy toevoegen op `leads`: affiliate mag eigen leads aanmaken en inzien
- `offertes.partner_id` is NOT NULL — voor affiliate offertes moeten we dit nullable maken OF een "platform" partner_id gebruiken. Aangezien partner_id essentieel is voor multi-tenancy, maken we het nullable met een migratie.

### Bestanden die wijzigen
| Bestand | Actie |
|---------|-------|
| `src/pages/AffiliateBeheer.tsx` | Affiliate aanmaken, codes beheren, commissie bewerken |
| `src/pages/Affiliates.tsx` | Offerte tab, offerte overzicht, performance stats |
| `src/components/AppSidebar.tsx` | Uitbreiden affiliate navigatie |
| `src/App.tsx` | allowedRoles voor offertes + leads uitbreiden met affiliate |
| `src/components/OffertePDFPreview.tsx` | Fallback platform branding voor affiliates |
| DB migratie | RLS policies voor affiliate op offertes + leads, offertes.partner_id nullable |

### Aanpak volgorde
1. Database migratie: partner_id nullable + RLS policies
2. AffiliateBeheer: affiliate aanmaken + codes/commissie beheer
3. Sidebar + routes: affiliate krijgt Offertes en Leads
4. Affiliates dashboard: offerte tab + overzicht
5. PDF branding fallback

