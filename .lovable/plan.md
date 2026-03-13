

## Plan: Webtools uitbreiden tot volledige kant-en-klare tools

### Wat verandert er

De huidige Webtools-pagina is een kale widgetbeheer-UI. Het moet een volledig uitgeruste, gebruiksvriendelijke tool worden met:

1. **Thuisbatterij Calculator** als 6e widget-type
2. **Configureerbaar notificatie-emailadres** per widget (zodat partner bepaalt waar leads naartoe gaan)
3. **Overzichtelijke UI met kant-en-klare templates** in plaats van een lege lijst
4. **Uitgebreidere WidgetConfigurator** met type-specifieke opties

---

### Database

**Migration:**
- Voeg `calculator_thuisbatterij` toe aan de `widget_type` enum
- Voeg kolom `notificatie_email` (text, nullable) toe aan `web_widgets` -- optioneel e-mailadres waar leads ook naartoe gestuurd worden

---

### Nieuwe componenten

**`src/components/webtools/calculators/ThuisbatterijCalc.tsx`**
- Wizard met 2 stappen: situatie (zonnepanelen Wp, verbruik kWh, contracttype, teruglevering) en resultaat (aanbevolen capaciteit, besparing, terugverdientijd)
- Hergebruikt logica uit `BatterijLogic.ts` (vereenvoudigd voor consument, zonder productmatching)
- Na resultaat: CTA "Vraag offerte aan" die naar ContactForm leidt

---

### Aangepaste bestanden

**`src/pages/WebTools.tsx`** -- Volledige redesign:
- Boven: overzicht van alle beschikbare widget-types als "template cards" met iconen en beschrijving
- Per template een "Aanmaken" button die direct de configurator opent met dat type voorgeselecteerd
- Onder: lijst van bestaande widgets (huidige functionaliteit)
- Per widget: embed code, bewerken, verwijderen, preview link, status badge

**`src/components/webtools/WidgetConfigurator.tsx`** -- Uitbreiden:
- Nieuw veld: `notificatie_email` (optioneel, e-mailadres waar leads naartoe gemaild worden naast de standaard notificatie in het systeem)
- Type-specifieke config:
  - Contactformulier: toon_telefoon, toon_bericht toggles
  - Calculatoren: intro_tekst, cta_tekst
- Beschrijvende toelichting per veld zodat partner begrijpt wat het doet

**`src/components/webtools/EmbedCodeDialog.tsx`** -- Verbeteren:
- Live iframe preview toevoegen (in een klein frame)
- Duidelijkere instructies voor de partner

**`src/pages/embed/EmbedCalculator.tsx`** -- Uitbreiden:
- `calculator_thuisbatterij` toevoegen aan de calcMap

**`supabase/functions/widget-submit/index.ts`** -- Uitbreiden:
- Na het aanmaken van de lead: als `widget.config.notificatie_email` is ingevuld, stuur een e-mailnotificatie naar dat adres via een simpele fetch naar de bestaande send-offerte-email edge function of inline met een transactional mail
- Voorlopig: sla het notificatie_email op in de lead notities zodat het zichtbaar is, en gebruik de bestaande notificatie-flow

---

### Technische details

**Widget type labels en iconen:**
| Type | Label | Icoon |
|------|-------|-------|
| contactformulier | Contactformulier | MessageSquare |
| calculator_zonnepanelen | Zonnepanelen Calculator | Sun |
| calculator_warmtepomp | Warmtepomp Calculator | Thermometer |
| calculator_isolatie | Isolatie Calculator | Home |
| calculator_laadpaal | Laadpaal Calculator | Plug |
| calculator_thuisbatterij | Thuisbatterij Calculator | Battery |

**WebTools pagina layout:**
```text
┌─────────────────────────────────────────────┐
│ Webtools                                     │
│ Maak widgets voor uw website                │
├─────────────────────────────────────────────┤
│ Beschikbare widgets                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │ Contact  │ │ Zonne-   │ │ Warmte-  │     │
│ │ formulier│ │ panelen  │ │ pomp     │     │
│ │ [Maak]   │ │ [Maak]   │ │ [Maak]   │     │
│ └──────────┘ └──────────┘ └──────────┘     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │ Isolatie │ │ Laadpaal │ │ Thuis-   │     │
│ │          │ │          │ │ batterij │     │
│ │ [Maak]   │ │ [Maak]   │ │ [Maak]   │     │
│ └──────────┘ └──────────┘ └──────────┘     │
├─────────────────────────────────────────────┤
│ Uw widgets (3)                               │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │ Widget 1 │ │ Widget 2 │ │ Widget 3 │     │
│ │ Embed/   │ │ Embed/   │ │ Embed/   │     │
│ │ Edit/Del │ │ Edit/Del │ │ Edit/Del │     │
│ └──────────┘ └──────────┘ └──────────┘     │
└─────────────────────────────────────────────┘
```

**WidgetConfigurator extra velden:**
- `Notificatie e-mail`: Input met placeholder "optioneel, standaard via systeem notificaties"
- Helptekst: "Vul een e-mailadres in als u leads ook per e-mail wilt ontvangen"

