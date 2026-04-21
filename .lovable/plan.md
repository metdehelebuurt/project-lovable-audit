
Plan opgeslagen. We gaan dit later uitvoeren — er wordt nu niets gebouwd.

Het volledige Mollie-integratieplan staat al in `.lovable/plan.md` en blijft daar bewaard tot je groen licht geeft. Wanneer je klaar bent om te starten, geef dan aan dat ik mag beginnen — dan doorlopen we de stappen in deze volgorde:

1. `MOLLIE_API_KEY` (test) toevoegen als secret
2. Database-migratie (kolommen op `partners`, `abonnementen`, `facturen` + `mollie_webhook_events` tabel)
3. Vier edge functions (`mollie-create-customer-payment`, `mollie-create-subscription`, `mollie-webhook`, `mollie-cancel-subscription`)
4. UI: `PartnerAbonnement` + `MollieCheckoutDialog` + `SepaMachtigingTekst` + return-pagina `/abonnement/incasso-bevestiging`
5. Juridische teksten in `Privacy.tsx` en `Voorwaarden.tsx`
6. Superadmin-monitoring tab op `AdminAbonnementen`
7. Webhook-URL handmatig configureren in Mollie dashboard
8. Test-flow met Mollie test-IBAN

Geen actie nodig op dit moment.
