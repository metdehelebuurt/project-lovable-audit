
# Redesign: Affiliate Lead Detail (`/affiliate/leads/:id`)

## Probleem
De huidige pagina (`AffiliateLeadDetail` + `LeadDetailBody`) is één lange verticale stack op een smalle `max-w-3xl` kolom. Rechterhelft van het scherm is leeg, alles staat onder elkaar (CTA → quick actions → 2 kaarten → notities → AI → log → gesprek → e-mails), en er zijn geen tabs om context te scheiden. Gevolg: veel scrollen, rommelig, niet doelgericht.

## Nieuwe structuur — sticky header + 2-koloms workspace met tabs

```text
┌──────────────────────────────────────────────────────────────────────┐
│ ← Terug   Esteban test BV     [Nieuw] [koud] [Eigen import] [test]   │  sticky header
│                              [📞 Bel] [WA] [✉ Mail] [⋯ meer]  [Trial]│
├───────────────────────────────┬──────────────────────────────────────┤
│ LINKERPANEEL (sticky, 360px)  │ RECHTERPANEEL (tabs)                 │
│                               │                                       │
│ ▸ Sales kerngegevens          │  [Overzicht] [Activiteit] [E-mail]   │
│   Status · Temp · Waarde      │  [Notities] [AI] [Geschiedenis]      │
│   Volgende actie · Opslaan    │  ────────────────────────────────    │
│                               │                                       │
│ ▸ Contact                     │  Tab-inhoud                          │
│   tel · wa · mail · website   │                                       │
│                               │                                       │
│ ▸ Bedrijfsgegevens            │                                       │
│   branche · regio · adres     │                                       │
│   bron · AI-samenvatting      │                                       │
│                               │                                       │
│ ▸ Trial / Klant-status        │                                       │
└───────────────────────────────┴──────────────────────────────────────┘
```

### Sticky header (boven beide kolommen)
- Terug-knop, bedrijfsnaam (H1), status/temperatuur/bron/AI-score chips
- Primaire actiebalk rechts: Bellen · WhatsApp · Mail · "Meer" dropdown (Terugbel, Demo, Orderbevestiging, Verrijken met AI) · Trial-starten CTA wanneer geen partner gekoppeld
- Duplicaatwaarschuwing direct onder header

### Linkerpaneel (sticky, scrollt mee tot top)
Compacte, altijd-zichtbare bewerkbare kern:
1. **Sales kerngegevens** — status, temperatuur, waarde, volgende actie, Opslaan-knop
2. **Contactgegevens** — telefoon, e-mail, website met klik-acties (verplaatst van quick actions)
3. **Bedrijfsgegevens** — branche, regio, adres, bron + AI-bedrijfssamenvatting (collapsible)
4. **Trial / klant-status** — TrialStatusBadge + trial-einddatum (alleen wanneer relevant)

### Rechterpaneel — 6 tabs (`@/components/ui/tabs`)
| Tab | Inhoud |
|---|---|
| **Overzicht** | AI-opvolging kaart (Kans op deal, Score deze lead, Maak opvolgplan) + lijst van openstaande opvolgtaken |
| **Activiteit** | Gespreksnotitie loggen + chronologische tijdlijn (`history` + opvolg-log samengevoegd) |
| **E-mail** | `EmailTab` (in/uit Gmail/Outlook) + knop "Nieuwe mail" (opent `EmailCompose`) |
| **Notities** | Grote textarea (volledige breedte), autosave on blur |
| **AI** | Volledige `AiOpvolgKaart` + Verrijken-resultaten + AI-samenvatting historie |
| **Geschiedenis** | Volledige contactmomenten-log met filters |

Tab-state in URL via `?tab=` zodat deeplinks werken.

### Responsive
- ≥1280px: 2 koloms zoals boven (linker 360px, rechter flex-1)
- 768–1279px: linkerpaneel boven, tabs eronder
- <768px: alles gestapeld, sticky header blijft, tabs scrollbaar horizontaal

## Implementatie

**Refactor `LeadDetailBody.tsx`** (683 regels nu, splitsen — werkspace-regel max 800/bestand, 50/functie):

```
src/components/affiliate/LeadDetail/
  index.tsx                  # layout: header + grid + tabs
  LeadHeader.tsx             # sticky header met chips + actiebalk
  LeftPanel/
    SalesKerngegevens.tsx
    ContactBlok.tsx
    BedrijfBlok.tsx
    TrialBlok.tsx
  Tabs/
    OverzichtTab.tsx
    ActiviteitTab.tsx
    EmailTabPaneel.tsx
    NotitiesTab.tsx
    AiTab.tsx
    GeschiedenisTab.tsx
  useLeadDetailState.ts      # gedeelde state: status, waarde, notitie, etc.
```

`AffiliateLeadDetail.tsx` past de outer layout aan (volledige breedte i.p.v. `max-w-3xl`, geen `p-6` op outer — header krijgt eigen padding).

**Geen wijzigingen aan**: data-hooks, mutations, dialogen (TerugbelDialog, VerrijkLeadDialog, VerlorenRedenDialog, EmailCompose) — die worden hergebruikt.

## Design / huisstijl
- Purple primary (memory), zachte borders, `bg-card` voor blokken, `bg-muted/30` voor tijdlijn-items
- Sticky header met subtiele `backdrop-blur` + `border-b`
- Tabs onderscheidend maar rustig (shadcn default)
- Geen kleurexplosie — chips alleen voor status/temp/bron/AI-score

## Out of scope
- Logica/business rules wijzigen
- Database-/RPC-veranderingen
- Mobile bottom-nav aanpassen

Na akkoord bouw ik dit in build-mode in één doorloop en verifieer met Playwright (linker sticky werkt, tabs schakelen, alle CTA's bereikbaar, geen lege rechterkant meer).
