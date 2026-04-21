# Plan — Mollie integratie voor automatische incasso van abonnementsgelden

> Status: **opgeslagen, nog niet uitvoeren**. Wachten op groen licht van de gebruiker.

## A. Huidige situatie

| Onderdeel | Status |
|---|---|
| Abonnementen-tabel (`abonnementen`) | ✅ Bestaat — plan, maand_bedrag, interval, status, verloop_datum |
| Plannen (`abonnement_plannen`) | ✅ Bestaat — maand_prijs, jaar_prijs |
| Add-ons (`abonnement_addon_aankopen`) | ✅ Bestaat — extra adviseurs/installateurs per maand |
| Facturen (`facturen`) | ✅ Bestaat — handmatig `betaald_via` |
| Mollie integratie | ❌ Volledig afwezig |
| SEPA-mandaat opslag | ❌ Geen kolommen |
| Webhook endpoint | ❌ Geen edge function |
| PSD2/SCA-flow | ❌ Geen first-payment flow |
| Juridisch (SEPA-machtiging partners) | ⚠️ Ontbreekt |

## B. Mollie-eisen

### Technisch
1. `MOLLIE_API_KEY` als secret (nooit in frontend)
2. Webhook endpoint publiek (`verify_jwt = false`), idempotent
3. First payment + mandaat-flow → daarna recurring zonder SCA
4. Subscription resource bij Mollie voor cyclus
5. Customer resource per partner
6. Geen signed webhooks → altijd payment via API verifiëren
7. Idempotentie via UNIQUE `mollie_payment_id`
8. Restitutie/chargeback bijhouden
9. Audit-log alle webhook events

### Juridisch (NL/EU)
1. SEPA B2B-mandaat-tekst in checkout
2. Pre-notificatie 1 dag vooraf (Mollie regelt, vermelden in voorwaarden)
3. Herroepingsrecht 56 dagen SEPA Core
4. B2B = 0 dagen herroeping
5. Mollie als verwerker in privacyverklaring
6. Privacyverklaring uitbreiden met IBAN/betaalverwerking
7. Algemene voorwaarden artikel "Betaling & Incasso"
8. NL-conforme factuur per succesvolle betaling
9. Bewaarplicht 7 jaar

## C. Architectuur

```
Partner → mollie-create-customer-payment → Mollie checkout
   → klant betaalt + machtigt SEPA
   → mollie-webhook → mollie-create-subscription
   → factuur + bevestigingsmail
   → maandelijks: Mollie incasseert → webhook → factuur + mail
```

## D. Implementatie

### 1. Database (nieuwe migratie)
```sql
ALTER TABLE public.partners
  ADD COLUMN mollie_customer_id text,
  ADD COLUMN mollie_mandate_id text,
  ADD COLUMN mollie_mandate_status text,
  ADD COLUMN mollie_mandate_method text,
  ADD COLUMN mollie_iban_last4 text,
  ADD COLUMN incasso_actief boolean DEFAULT false;

ALTER TABLE public.abonnementen
  ADD COLUMN mollie_subscription_id text,
  ADD COLUMN mollie_subscription_status text,
  ADD COLUMN volgende_incasso_op date,
  ADD COLUMN laatste_incasso_op timestamptz,
  ADD COLUMN gefaalde_incassos integer DEFAULT 0;

ALTER TABLE public.facturen
  ADD COLUMN mollie_payment_id text UNIQUE,
  ADD COLUMN mollie_payment_status text,
  ADD COLUMN mollie_chargeback_id text,
  ADD COLUMN mollie_checkout_url text;

CREATE TABLE public.mollie_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  mollie_resource_id text NOT NULL,
  resource_type text NOT NULL,
  event_status text,
  raw_payload jsonb NOT NULL,
  verwerkt boolean DEFAULT false,
  fout_melding text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.mollie_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin ziet webhook events" ON public.mollie_webhook_events
  FOR SELECT TO authenticated USING (is_superadmin(auth.uid()));
```

### 2. Secret
- `MOLLIE_API_KEY` (test_xxx → live_xxx)

### 3. Edge functions
| Function | verify_jwt | Doel |
|---|---|---|
| `mollie-create-customer-payment` | true | First payment + checkout URL |
| `mollie-create-subscription` | true | Recurring subscription aanmaken (intern) |
| `mollie-webhook` | **false** | Publieke webhook handler, idempotent |
| `mollie-cancel-subscription` | true | Opzegging |

### 4. UI
- `PartnerAbonnement.tsx`: sectie "Betaalmethode" + status-badge + IBAN ****1234 + activatie-knop
- `MollieCheckoutDialog.tsx` (nieuw): pre-checkout met SEPA-tekst
- `SepaMachtigingTekst.tsx` (nieuw): juridische tekst
- `IncassoBevestiging.tsx` (nieuw): return-pagina `/abonnement/incasso-bevestiging`
- `FactuurBeheer.tsx`: Mollie status-kolom + retry-knop
- `AdminAbonnementen.tsx`: tab "Mollie monitoring"
- `MollieMonitoring.tsx` (nieuw): superadmin events + slaagpercentage

### 5. Juridisch
- `Privacy.tsx`: sectie "Betaalverwerking via Mollie"
- `Voorwaarden.tsx`: artikel "Betaling & Incasso" (storno €7,50, opschorting 14d, beëindiging 30d)

### 6. Status-flow
- `payment.paid` → factuur `betaald`, abonnement `actief`, `verloop_datum` verlengen
- `payment.failed` → `gefaalde_incassos += 1`, mail
- `>= 2` faal → `betalingsachterstand`
- `>= 4` faal → `geblokkeerd`
- `subscription.canceled` → `opgezegd`

### 7. Backwards compatible
- Handmatige bankoverschrijving blijft optie via `betaling_methode = 'handmatig'`

## E. Bestanden
| Bestand | Actie |
|---|---|
| `supabase/migrations/…_mollie_integratie.sql` | Nieuw |
| `supabase/functions/mollie-create-customer-payment/index.ts` | Nieuw |
| `supabase/functions/mollie-create-subscription/index.ts` | Nieuw |
| `supabase/functions/mollie-webhook/index.ts` | Nieuw |
| `supabase/functions/mollie-cancel-subscription/index.ts` | Nieuw |
| `supabase/config.toml` | `mollie-webhook` → `verify_jwt = false` |
| `src/components/abonnementen/PartnerAbonnement.tsx` | Uitbreiden |
| `src/components/abonnementen/MollieCheckoutDialog.tsx` | Nieuw |
| `src/components/abonnementen/SepaMachtigingTekst.tsx` | Nieuw |
| `src/components/abonnementen/MollieMonitoring.tsx` | Nieuw |
| `src/components/abonnementen/FactuurBeheer.tsx` | Status-kolom + retry |
| `src/pages/AdminAbonnementen.tsx` | Tab toevoegen |
| `src/pages/IncassoBevestiging.tsx` | Nieuw |
| `src/App.tsx` | Route toevoegen |
| `src/pages/website/Privacy.tsx` | Mollie-sectie |
| `src/pages/website/Voorwaarden.tsx` | Artikel Betaling & Incasso |

## F. Niet wijzigen
- Bestaande klantfactuur-flow (offerte → factuur)
- `generate_financieel_documentnummer`
- RLS-helpers

## G. Volgorde van uitvoering
1. `MOLLIE_API_KEY` als secret
2. Database-migratie
3. 4 edge functions
4. UI (`PartnerAbonnement` + dialog + return-pagina)
5. Juridische teksten
6. Superadmin monitoring
7. Webhook-URL configureren in Mollie dashboard
8. Test-flow met Mollie test-IBAN

## H. Resultaat
- 1-klik SEPA-incasso activatie
- Automatische maand/jaar incasso
- Retry + escalatie bij faal
- Volledig juridisch sluitend
- Audit-trail superadmin
- Backwards compatible
