

## Plan — Facturatie grondig op orde

### 1. Nummerreeksen — race-condition fix + per partner instelbaar

**Probleem nu:** `generate_financieel_documentnummer` gebruikt `COUNT(*)+1`. Bij gelijktijdige inserts → echte duplicaten. Geen partnerinstelling voor prefix/jaar/teller.

**Oplossing:**
- Nieuwe tabel `nummerreeks_config` (per `partner_id` + `type` + optioneel `subtype`):
  `prefix` (bv. `VF`, `VS`, `CN`), `jaarformaat` (`YYYY`/`YY`/`geen`), `padding` (default 4), `volgende_nummer` (atomic teller), `reset_per_jaar` (bool), `huidig_jaar`.
- Nieuwe SQL-functie `generate_documentnummer_v2(_partner_id, _type, _subtype)` — gebruikt `UPDATE ... RETURNING` op de teller (atomic, geen race). Maakt config aan met defaults als die nog niet bestaat. Reset teller bij jaarwissel als `reset_per_jaar=true`.
- **UNIQUE constraint** `(partner_id, documentnummer)` op `financiele_documenten` zodat duplicatie hard onmogelijk wordt.
- Migratie zet bestaande nummers om naar de nieuwe teller (max+1 per partner/type).
- Nieuwe instellingen-UI `NummerreeksConfig.tsx` in `Instellingen` (sectie "Nummerreeksen"): tabel met prefix, jaarformaat, padding, volgend nummer, "reset per jaar". Live preview (`VF-2026-0042`).

### 2. Bewerken & verwijderen van facturen

**Nu:** geen edit-knop op `FactuurDetail`, geen delete.
- **Bewerken**: knop "Bewerken" op `FactuurDetail` opent modus met `DocumentRegelEditor` + velden voor relatie, datum, vervaldatum, notities. Toegestaan voor `concept` altijd; voor `verzonden` alleen door `partner_admin`/`backoffice` met verplichte `wijziging_reden`.
- **Niet wijzigbaar**: status `betaald`/`gecrediteerd` → enkel via creditnota (bestaande flow).
- **Verwijderen**: knop met confirm-dialog + verplichte reden. Toegestaan voor `concept`; voor `verzonden` enkel door `partner_admin` met reden. Alle wijzigingen/verwijderingen → `factuur_historie`.

### 3. Historielog per factuur

Nieuwe tabel `factuur_historie`:
- `id`, `financieel_document_id`, `partner_id`, `actor_id`, `actie` (`aangemaakt`/`bewerkt`/`status_gewijzigd`/`verzonden`/`opnieuw_verzonden`/`betaald_gemarkeerd`/`gecrediteerd`/`verwijderd`/`pdf_gegenereerd`), `veld`, `oude_waarde`, `nieuwe_waarde`, `notitie`, `created_at`.
- DB-trigger `log_factuur_changes` op INSERT/UPDATE/DELETE — vergelijkbaar met `log_helpdesk_ticket_changes`.
- Edge-functions schrijven extra entries voor `verzonden`/`opnieuw_verzonden` (incl. ontvanger).
- Nieuwe UI-component `FactuurHistorieTab.tsx` met tijdlijn (gebruikt patroon `AuditTijdlijn`).
- RLS: lezen voor partner-leden, schrijven enkel via service role / triggers.

### 4. Opnieuw versturen

- Knop "Opnieuw versturen" op `FactuurDetail` zichtbaar zodra `verzonden_op` gevuld is.
- Opent dezelfde `FactuurEmailDialog` met defaultTo + onderwerp `[Herinnering] …` en aanpasbare body.
- Edge function `send-factuur-email` krijgt vlag `is_resend`: status blijft `verzonden`/`verlopen`, alleen `email_log` + `factuur_historie` krijgen entry `opnieuw_verzonden`.

### 5. E-mailverzending uniformeren

**Nu:** offerte, factuur, orderbevestiging hebben elk eigen function met overlappende SMTP/OAuth-logica. `send-factuur-email` werkt al via partner-config (SMTP of Gmail/MS-OAuth) — dat is de juiste route.

- Refactor naar één gedeelde helper `_shared/partner-email-send.ts` met functie `sendPartnerEmail({partner_id, to, subject, html, attachment, type, related_id})` die:
  1. Partner ophaalt + actief `email_account` (OAuth) checkt
  2. Provider kiest (OAuth Google → Gmail API, OAuth MS → Graph, anders SMTP)
  3. Bij OAuth token refresh
  4. Logging in `email_log` + `email_berichten` (uitgaand)
  5. Foutafhandeling met duidelijke melding "E-mailconfiguratie niet ingesteld" + link naar instellingen
- Bestaande functies `send-factuur-email`, `send-offerte-email`, `send-orderbevestiging-email` rewriten zodat ze allemaal `sendPartnerEmail` gebruiken — identiek gedrag, één bron van waarheid.
- In `EmailConfiguratie` (instellingen) een **"Test e-mail versturen"**-knop toevoegen die dezelfde helper gebruikt → partner ziet meteen of zijn config werkt.

### 6. Bestanden (overzicht)

| Bestand | Actie |
|---|---|
| `supabase/migrations/..._nummerreeks_en_historie.sql` | nieuw: `nummerreeks_config`, `factuur_historie`, `generate_documentnummer_v2`, UNIQUE constraint, migratie bestaande tellers, triggers, RLS |
| `src/components/instellingen/NummerreeksConfig.tsx` | nieuw |
| `src/pages/Instellingen.tsx` | sectie "Nummerreeksen" toevoegen |
| `src/pages/FactuurNieuw.tsx` + `OpdrachtDetail.tsx` | `generate_documentnummer_v2` aanroepen |
| `src/pages/FactuurDetail.tsx` | knoppen Bewerken / Verwijderen / Opnieuw versturen + tab Historie |
| `src/components/financieel/FactuurEditDialog.tsx` | nieuw (edit-modus met reden bij verzonden) |
| `src/components/financieel/FactuurHistorieTab.tsx` | nieuw |
| `src/components/financieel/FactuurEmailDialog.tsx` | `is_resend` doorgeven, onderwerp-prefill bij herinnering |
| `supabase/functions/_shared/partner-email-send.ts` | nieuw — gedeelde sender |
| `supabase/functions/send-factuur-email/index.ts` | refactor + `is_resend` + historie-entry |
| `supabase/functions/send-offerte-email/index.ts` | refactor naar gedeelde helper |
| `supabase/functions/send-orderbevestiging-email/index.ts` | refactor naar gedeelde helper |
| `src/components/instellingen/EmailConfiguratie.tsx` | "Test e-mail versturen"-knop |

### Volgorde van uitvoer
1. Migratie (nummerreeks + historie + UNIQUE + atomic teller)
2. Gedeelde e-mail-helper + refactor 3 send-functies
3. UI: nummerreeks-instellingen
4. UI: bewerken / verwijderen / opnieuw versturen / historietab op `FactuurDetail`
5. Test-e-mailknop in instellingen

### Niet in scope
- Periodieke automatische facturen (recurring buiten Mollie-abonnementen)
- E-mail templates met merge-velden (apart vervolgproject)
- Factuur PDF in storage archiveren bij elke wijziging — komt eventueel later

