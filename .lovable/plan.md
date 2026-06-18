## Doel
Een affiliate kan vanuit zijn dashboard (lead-drawer of pipeline-kaart) met één klik een 30-daagse trial starten voor een koude lead. De nieuwe partner wordt automatisch gekoppeld aan de affiliate (referral + commissie), de lead krijgt status `gewonnen`, en elke stap wordt gelogd.

## UX-flow
1. In `LeadDetailDrawer` (en als secundaire knop op `PipelineKaart`) komt een primaire knop **"Trial starten voor klant"**, alleen zichtbaar als status ≠ `gewonnen` en email + bedrijfsnaam aanwezig zijn.
2. Klik opent `TrialStartenDialog` met voor-ingevulde velden uit de lead:
   - Bedrijfsnaam, contactpersoon (voornaam/achternaam split), email, telefoon — bewerkbaar.
   - Tijdelijk wachtwoord (auto-gegenereerd, kopieerbaar) — affiliate kan ook "verstuur magic link i.p.v. wachtwoord" kiezen (v2, voor nu wachtwoord).
   - Verplichte checkbox: *"De klant heeft mondeling toestemming gegeven voor het aanmaken van een trial-account op zijn naam."*
3. Bij submit → loading-state, daarna toast met "Trial gestart, klant ontvangt welkomstmail" en de lead wordt zichtbaar gemarkeerd als *Trial actief — verloopt op DD-MM-JJJJ* (badge in drawer + kaart).

## Backend
Nieuwe Edge Function `affiliate-start-trial` (verify_jwt impliciet via in-code check):
- Input (Zod): `lead_id`, `bedrijfsnaam`, `voornaam`, `achternaam`, `email`, `telefoon?`, `password`, `toestemming: true`.
- Verifieert ingelogde user heeft rol `affiliate` en is eigenaar van de lead.
- Zorgt dat affiliate een `affiliate_links` rij heeft; pakt/creëert `code`.
- Roept intern dezelfde logica aan als `trial-signup` (partner + user + referral + abonnement + demo data + welkomstmail) met `ref_code` van de affiliate.
- Bij succes:
  - Update `affiliate_leads`: `status='gewonnen'`, `gewonnen_partner_id = nieuwe partner_id`.
  - Insert `affiliate_lead_contactmomenten`: `type='systeem'`, `uitkomst='trial_gestart'`, notitie met partnernaam + trial einddatum.
  - Insert `entiteit_historie` voor zowel de lead als de nieuwe partner ("Trial gestart door affiliate X").
  - Insert `audit_log` regel.
- Foutpaden retourneren `{ error: { code, message } }`; duplicate email → vriendelijke melding "Dit e-mailadres is al in gebruik — vraag de klant of hij al een account heeft."

Refactor: `trial-signup/index.ts` business-logica wordt verplaatst naar `_shared/trial/createTrialPartner.ts` zodat zowel `trial-signup` als `affiliate-start-trial` hem aanroepen — geen code-duplicatie.

## Frontend
- Nieuwe componenten:
  - `src/components/affiliate/TrialStartenDialog.tsx` — formulier + RHF + Zod.
  - `src/components/affiliate/TrialStartenButton.tsx` — knop die de dialog opent.
  - `src/components/affiliate/TrialStatusBadge.tsx` — toont trial-status op lead.
- Nieuwe hook: `src/hooks/affiliate/useStartTrialVoorLead.ts` — wrapper rond `supabase.functions.invoke('affiliate-start-trial')` met TanStack mutation + invalidates `affiliate-leads` en `affiliate-trials`.
- Integratie in `LeadDetailDrawer.tsx` (boven status-blok) en `PipelineKaart.tsx` (kleine secundaire knop).
- Na succes: drawer ververst, badge zichtbaar, knop verdwijnt.

## Logging-overzicht (alles vindbaar)
| Waar | Wat |
|------|-----|
| `affiliate_lead_contactmomenten` | systeem-regel "Trial gestart" |
| `affiliate_referrals` | gekoppeld via ref_code (bestaande logica) |
| `entiteit_historie` | regel op lead + partner |
| `audit_log` | actor=affiliate, actie=`trial.start_voor_lead`, target=partner_id |
| `email_send_log` | welkomstmail (bestaande flow) |

## Beveiliging
- Edge Function valideert: ingelogde rol == affiliate, lead behoort tot deze affiliate, toestemming-vinkje aanwezig.
- Wachtwoord komt nooit in logs; wel in de welkomstmail naar de klant (bestaand template `trial-welkom` krijgt optioneel `tijdelijkWachtwoord` veld + zinnetje "wijzig dit na eerste login").
- Rate limit: max 5 trial-starts per affiliate per uur (check via `partner_api_rate_log` of simpele count op `affiliate_referrals` in laatste uur).

## Bestanden
**Nieuw**
- `supabase/functions/affiliate-start-trial/index.ts`
- `supabase/functions/_shared/trial/createTrialPartner.ts` (extractie)
- `src/components/affiliate/TrialStartenDialog.tsx`
- `src/components/affiliate/TrialStartenButton.tsx`
- `src/components/affiliate/TrialStatusBadge.tsx`
- `src/hooks/affiliate/useStartTrialVoorLead.ts`

**Aangepast**
- `supabase/functions/trial-signup/index.ts` (gebruikt shared helper)
- `supabase/functions/_shared/transactional-email-templates/trial-welkom.tsx` (optioneel wachtwoord-veld)
- `src/components/affiliate/LeadDetailDrawer.tsx`
- `src/components/affiliate/PipelineKaart.tsx`
- `supabase/config.toml` (registratie nieuwe functie indien nodig)

## Vragen vóór ik bouw
Geen — bestaande conventies (Nederlandse UI, paarse primary, geen any, ≤800 regels/bestand) zijn duidelijk. Ik start na akkoord.
