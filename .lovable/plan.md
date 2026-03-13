

## Plan: Adviseurs prestatie-statistieken + Partner e-maildomein configuratie

### Deel 1: Adviseurs module uitbreiden met prestatie-statistieken

**Huidige situatie:** De Adviseurs pagina is een dunne wrapper rond Gebruikers.tsx met `filterRol="adviseur"`. Geen prestatiedata.

**Wijzigingen:**

1. **Nieuwe pagina `src/pages/Adviseurs.tsx`** (volledige herschrijf, niet meer alleen wrapper)
   - Bovenaan: statistiek-kaarten per adviseur (leads, schouwen, offertes, conversieratio, omzet)
   - Lijst van adviseurs met inline KPI's per rij (aantal leads, schouwen, offertes, geaccepteerde offertes, totale omzet)
   - Klikbaar naar detail-view per adviseur met:
     - Prestatiegrafiek (offertes per maand, conversietrend)
     - Lijst recente activiteit (laatste leads, schouwen, offertes)
   - Data ophalen via queries op `leads` (waar `owner_user_id`), `schouwen` (waar `adviseur_id`), `offertes` (waar `adviseur_id`)
   - Periode-filter (week/maand/kwartaal/jaar)

2. **Geen database wijzigingen nodig** — alle data is al beschikbaar via bestaande tabellen en kolommen

---

### Deel 2: Partner e-maildomein voor offerte-verzending

**Doel:** Partners kunnen offertes versturen vanuit hun eigen e-maildomein (bijv. `offerte@hunbedrijf.nl`).

**Beste aanpak voor leken-klanten:**

De eenvoudigste manier is een **SMTP-configuratie per partner** in de instellingen. De partner vult in:
- Afzender e-mailadres (bijv. `info@hunbedrijf.nl`)
- Afzender naam (bijv. "Bedrijf X Offertes")
- SMTP-host, poort, gebruikersnaam, wachtwoord

Veel MKB-klanten gebruiken al Gmail, Outlook of een eigen mailserver. SMTP is universeel en vereist geen DNS-wijzigingen. Alternatief: een simpelere variant waar alleen een afzender-emailadres wordt opgegeven en wij via SendGrid een "verified sender" flow aanbieden.

**Gekozen aanpak: SMTP per partner** (meest flexibel, werkt met elke provider)

**Database migratie:**
- Voeg kolommen toe aan `partners` tabel:
  - `smtp_host` text nullable
  - `smtp_port` integer nullable (default 587)
  - `smtp_user` text nullable
  - `smtp_pass_encrypted` text nullable
  - `afzender_email` text nullable
  - `afzender_naam` text nullable
- RLS: partner_admin kan eigen partner bijwerken (al aanwezig)

**Edge Function: `send-offerte-email`**
- Ontvangt: offerte_id, ontvanger_email
- Haalt offerte + partner SMTP config op
- Verstuurt e-mail via partner's SMTP als geconfigureerd, anders fallback naar platform standaard
- E-mail bevat offerte-samenvatting + link naar PDF/online versie

**UI wijzigingen:**
1. **Instellingen pagina** — nieuwe sectie "E-mail configuratie" (alleen partner_admin):
   - Velden voor afzender naam/email
   - SMTP instellingen met "Test verbinding" knop
   - Duidelijke uitleg in lekentaal: "Vul hier de e-mailinstellingen van uw bedrijf in zodat offertes vanuit uw eigen e-mailadres worden verstuurd"
   - Stapsgewijze instructies voor Gmail, Outlook, en generieke SMTP

2. **Offertes pagina** — "Verstuur per e-mail" knop toevoegen aan offerte-acties
   - Opent een dialoog met ontvanger e-mail (pre-filled uit klant_email)
   - Preview van afzender ("Wordt verstuurd als: info@hunbedrijf.nl")
   - Verstuur-knop roept edge function aan

---

### Bestanden overzicht

| Actie | Bestand |
|-------|---------|
| Herschrijf | `src/pages/Adviseurs.tsx` — Volledig adviseurs-dashboard met KPI's en statistieken |
| DB migratie | SMTP/email kolommen op `partners` tabel |
| Nieuw | `supabase/functions/send-offerte-email/index.ts` — E-mail versturen via partner SMTP |
| Edit | `src/pages/Instellingen.tsx` — E-mail configuratie sectie toevoegen |
| Edit | `src/pages/Offertes.tsx` — "Verstuur per e-mail" actie toevoegen |
| Edit | `supabase/config.toml` — JWT verify config voor nieuwe edge function |

