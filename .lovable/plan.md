

## Plan: Offerte verzendflow, WYSIWYG mail editor, interactief klantportaal en berichten module

### Overzicht

Dit plan bevat 5 grote onderdelen:
1. **Post-PDF actiekeuze** — Download of verstuur per mail na PDF generatie
2. **WYSIWYG e-mail editor** met AI schrijffunctie en feedbackloop
3. **Interactief klantportaal** — Uitbreiding van de publieke offertepagina met tabs voor offerte, energierapport, schouw en berichten
4. **Offerte berichten systeem** — Database-ondersteuning voor klant-partner communicatie gekoppeld aan een offerte
5. **Berichten in partner dashboard** — Berichten item toevoegen aan sidebar voor partner_admin, partner_staff en adviseur

---

### 1) Post-PDF actie dialog

**Bestand:** `src/components/OffertePDFPreview.tsx`

Na het renderen van de PDF preview, toon een actie-balk met twee knoppen:
- **Download PDF** — trigger browser print/download (bestaande functionaliteit)
- **Verstuur per e-mail** — opent de WYSIWYG mail editor dialog

---

### 2) WYSIWYG e-mail editor component

**Nieuw bestand:** `src/components/offertes/OfferteEmailEditor.tsx`

Een Dialog-component met:
- **Ontvanger** veld (prefilled met klant_email)
- **Onderwerp** veld (prefilled met "Offerte {nummer} — {partnernaam}")
- **Rich-text body editor** — Textarea met opmaak-toolbar (bold, italic, link) via contentEditable div
- **AI schrijf-knop** — Roept `ai-offerte-intro` edge function aan om een professionele e-mailtekst te genereren op basis van offerte-context
- **Feedback-knop** — Na versturen kan partner een score (1-5) geven die wordt opgeslagen voor de AI feedbackloop
- **Checkbox: "Acceptatielink bijvoegen"** — Voegt de share_token link toe aan de e-mail body
- **Checkbox: "Interactieve offertepagina bijvoegen"** — Voegt een link naar het klantportaal toe
- **PDF als bijlage indicatie** — Visueel tonen dat de PDF wordt bijgevoegd

**Bestand:** `supabase/functions/send-offerte-email/index.ts`
- Uitbreiden met een `html_body` parameter zodat de WYSIWYG content wordt verstuurd i.p.v. de vaste template
- Optioneel `include_accept_link` en `include_portal_link` parameters

---

### 3) Offerte berichten systeem (database)

**Migratie:** Nieuwe tabel `offerte_berichten`

```sql
CREATE TABLE public.offerte_berichten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offerte_id uuid NOT NULL,
  share_token text NOT NULL,
  afzender_type text NOT NULL CHECK (afzender_type IN ('partner', 'klant')),
  afzender_naam text NOT NULL,
  bericht text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offerte_berichten ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offerte_berichten;
```

RLS policies:
- Partner users (partner_admin, partner_staff, adviseur) kunnen berichten lezen/schrijven voor offertes van hun partner
- Publiek (anon) kan berichten lezen/schrijven via `share_token` — de edge function handelt dit af

**Edge function:** `supabase/functions/offerte-portal-messages/index.ts`
- POST: bericht toevoegen (publiek, validatie via share_token)
- GET: berichten ophalen voor een offerte via share_token

---

### 4) Interactief klantportaal

**Bestand:** `src/pages/OffertePublic.tsx` — Volledige herschrijving

Uitbreiden van de huidige simpele offerte-weergave naar een tabbed portaal:
- **Tab "Offerte"** — Bestaande offerteweergave (regels, bedragen, acceptatieknop)
- **Tab "Energierapport"** — Toont energieadviesdata als `include_energieadvies` actief is op de offerte
- **Tab "Schouw"** — Toont schouwgegevens als `schouw_id` gekoppeld is
- **Tab "Berichten"** — Realtime chat met partner via `offerte_berichten` tabel

De `offerte-public-view` edge function wordt uitgebreid om ook schouw- en energieadviesdata mee te sturen.

---

### 5) Berichten in partner dashboard

**Bestand:** `src/components/AppSidebar.tsx`
- Voeg "Berichten" toe aan de navigatie voor `superadmin`, `partner_admin`, `partner_staff` en `adviseur`

**Bestand:** `src/pages/Berichten.tsx`
- Uitbreiden zodat het naast tickets ook offerte-berichten toont
- Twee tabs: "Support tickets" (bestaand) en "Klantberichten" (nieuw — offerte-berichten overzicht)
- Klantberichten tab toont een lijst van offertes met ongelezen berichten, klikbaar naar een chatview

---

### Bestanden overzicht

| Bestand | Actie |
|---------|-------|
| `src/components/offertes/OfferteEmailEditor.tsx` | Nieuw — WYSIWYG editor met AI |
| `src/components/OffertePDFPreview.tsx` | Actie-balk met download/mail knoppen |
| `src/pages/OfferteDetail.tsx` | Email dialog vervangen door OfferteEmailEditor |
| `supabase/functions/send-offerte-email/index.ts` | Custom HTML body ondersteuning |
| `supabase/functions/offerte-public-view/index.ts` | Schouw + energieadvies data meesturen |
| `supabase/functions/offerte-portal-messages/index.ts` | Nieuw — berichten API voor publiek portaal |
| `src/pages/OffertePublic.tsx` | Tabbed portaal met offerte/energie/schouw/berichten |
| `src/pages/Berichten.tsx` | Tabs voor tickets + klantberichten |
| `src/components/AppSidebar.tsx` | Berichten link voor partner rollen |
| Migratie | `offerte_berichten` tabel + RLS + realtime |

### Technische flow

```text
PDF Preview → Actie-balk [Download] [Verstuur per e-mail]
                              ↓
                    OfferteEmailEditor dialog
                    - WYSIWYG body (AI schrijf optie)
                    - ☑ Acceptatielink bijvoegen
                    - ☑ Interactieve offertepagina link
                    - [Verstuur] → send-offerte-email (custom HTML)
                              ↓
Klant ontvangt mail → klikt link → OffertePublic (tabbed portaal)
                    - Tab Offerte (accepteren/afwijzen)
                    - Tab Energierapport
                    - Tab Schouw
                    - Tab Berichten (realtime chat)
                              ↓
Partner dashboard → Berichten pagina → ziet klantberichten
```

