

## Plan — Grondige check op nieuwe modules + mobile/responsive verbeteringen

Onderstaande issues zijn gevonden in de modules die we de afgelopen sessies hebben opgeleverd (Opleverrapport NEN1010, Verkooporders, Installaties met productkoppeling, Nummerreeksen, Klant-/Opdracht-selector). Ze zijn gegroepeerd op prioriteit.

### A. Functionele bugs (blokkerend / fout gedrag)

1. **WizardShell crasht bij verborgen Backup-stap**  
   In `OpleverDetail.tsx` is `currentIndex` altijd geclamped naar `steps.length - 1` voor het renderen, maar `WizardShell` gebruikt zelf de doorgegeven `currentIndex` ook intern voor `pct` en buttons → bij toggelen van "heeft backup" (uit → aan/uit) kan `step` undefined zijn op een korte render. Fix: clamp ook in `WizardShell` (`safeIndex = Math.min(currentIndex, steps.length-1)`) en bewaak `step` met early return.

2. **`OpdrachtSelector` toont alle opdrachten van álle partners** — bij focus zonder query roept hij `search("")` aan zonder een lengte-check, maar de query filtert wél op `partnerId`. Dit is OK; echter de fallback bij geen partner_id gaat fout. Toevoegen: early return + skeleton als `!partnerId`.

3. **Autosave overschrijft `extra_velden` met partial → dataverlies bij snelle navigatie**  
   In `useOpleverAutosave` wordt `draft` (incl. `extra_velden`) doorgepatched. Maar de wizard-stappen mergen lokaal alleen op `extra` keys; als twee stappen tegelijk patches sturen (autosave debounce 1.5s) kan het laatste autosave-paket een `extra_velden` met een verouderde subset bevatten. Fix: lees verse `extra_velden` uit DB vóór patch óf merge `extra_velden` in de autosave (`{ ...current.extra_velden, ...draft.extra_velden }`).

4. **`KlantSelector` `useRef<setTimeout>` zonder initialiteit + memory leak op unmount**  
   `debounceRef.current` blijft hangen na unmount → cleanup toevoegen. Idem `OpdrachtSelector`.

5. **`OpleverDetail.downloadPdf` toont preview maar produceert lege PDF op mobiel**  
   De off-screen render-container heeft `width: 210mm` wat op iPhone-viewport buiten beeld valt + `opacity:0`. Op iOS Safari rendert html2canvas dan witte vlakken. Toevoegen: tijdelijk `opacity:1; left:-10000px` tijdens render, daarna terugzetten. Identiek patroon als bij offerte-PDF.

6. **`OpleverNieuw` legt `klant_id` niet vast als alleen `?installatie=` meekomt**  
   Bij start vanuit installatiedetail wordt wel `klant=` doorgegeven, maar `consument_id` van de installatie wordt niet gebruikt als fallback. Fix: bij `installatie_id` ophalen → bij ontbreken `klant_id` lezen van installatie.

7. **`InstallatieProductenEditor` Supabase `.or()` chaining verbreekt query**  
   `.or("partner_id.eq...,partner_id.is.null").or("naam.ilike...,merk.ilike...")` — twee `.or` na elkaar overschrijven elkaar bij PostgREST. Fix: combineren tot één `.and(or(...), or(...))` via `or()` filter met `referencedTable` of expliciet via `and(...)`.

8. **Nummerreeks "voorbeeld" toont **huidig** volgnummer, niet het volgende** — label klopt wel, maar bij `volgende_nummer=1` na opslaan blijft het voorbeeld 1 tonen ondanks dat de server na uitgifte naar 2 gaat. Toelichting: voorbeeld blijft correct; vervangen tekst door "Eerstvolgende nummer".

9. **`OpdrachtSelector` selector toont label `klant_naam — datum`, maar `OpleverDetail` toont alleen ID-fragment + datum als `ordernummer`** → inconsistent. Fix: voeg `opdrachtnummer`-kolom of fallback `OPD-{shortId}` toe in `OpleverDetail.ordernummer` (idealiter haal echte `opdrachten.opdrachtnummer`/`bevestigingsnummer` op als die kolom bestaat, anders houd korte ID).

### B. Responsive / mobiele issues (≤414 px)

1. **`WizardShell` chips-bar** — met 11 stappen + iconen ontstaat een 800-800px brede scroll-rij. Op iPhone werkt scrollen wel maar de **active chip scrollt niet automatisch in beeld** → gebruiker ziet niet welke stap actief is. Fix: `useEffect` dat `scrollIntoView({ inline:"center" })` op de actieve chip triggert.

2. **`OpleverDetail` header** — op 360 px valt "PDF downloaden" + "Archief openen" + statusbadge naast het rapportnummer, met overlap en horizontale scroll. Fix: header omzetten naar `flex-col gap-3 md:flex-row md:items-center`, knoppen onder elkaar op mobiel.

3. **`OpleverChecklistItem` 3-knops-rij** — op 360 px zit "OK / Niet OK / N.v.t." nét te krap (`hidden sm:inline` voor labels — alleen iconen op mobiel = ✅ goed). Maar de row gebruikt `sm:flex-row` waardoor op heel kleine schermen de knoppen-rij tegen het label aandrukt. Fix: `flex-wrap` op de knoppen-container + `min-h-[44px]` voor touch-doelen (WCAG).

4. **`InstallatieProductenEditor` regel-rij** — `flex items-end gap-2` met input(flex-1) + aantal(w-20) + delete-knop overlapt op 320 px. Fix: `flex-col sm:flex-row` of `flex-wrap`. Aantal-veld krijgt `min-w-[80px]`.

5. **`OpleverDetail` PDF-preview** — `<div className="overflow-auto max-h-[600px] border rounded">` toont een 210 mm-element op een 360 px scherm met **dubbele scrollbars**. Fix: voeg `<div style={{ minWidth: 794 }}>` wrapper of verberg preview op mobiel (`hidden md:block`) en toon alleen knop "Bekijk PDF" → opent direct download/preview.

6. **`StepInstallatie` Opstelling-checkboxen** — `grid-cols-1 sm:grid-cols-2` is OK maar de keys `geen_leefruimte` etc. tonen letterlijk de underscore-replace ("geen leefruimte") wat technisch maar onafgerond aanvoelt. Fix: lookup-table met nette Nederlandse labels.

7. **`MonteurToewijsDialog`** — `DialogContent className="max-w-lg"` heeft geen `max-h-[90vh] overflow-y-auto` → op iPhone 13 (812 px) en met klavier open valt de "Plannen"-knop onder de viewport. Fix: standaard `max-h-[90vh] overflow-y-auto p-4 sm:p-6`.

8. **`InstallatieNieuw`** — `grid-cols-2 gap-3` voor email/telefoon en datum/tijd geeft te smalle inputs op 360 px. Fix: `grid-cols-1 sm:grid-cols-2`.

9. **`Instellingen → Nummerreeksen`** — kaart heeft 8 reeksen onder elkaar, elk met een 4-kolom grid. Op mobiel wordt dat `grid-cols-2`, prima, maar de Save-knop staat per item rechtsboven met een "Voorbeeld:"-tekst die afgekapt wordt. Fix: header binnen de kaart `flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between`.

10. **`OpdrachtSelector` / `KlantSelector` dropdowns** — `<Card className="absolute z-50 w-full">` overlapt onderliggende inputs maar gebruikt geen `position: relative` op een mobiele wrapper. Op mobiel met klavier kan de dropdown buiten beeld vallen. Fix: lift naar Radix Popover-pattern (zoals `InstallatieProductenEditor` al doet).

### C. Onafgemaakte zaken / inconsistenties

1. **Locked status na ondertekening** — wizard laat nog editen ná `status=ondertekend`. Verwacht: na ondertekening alle stappen read-only + banner "Rapport definitief, kopie nodig?". Fix: `disabled` flag door `WizardShell` propageren én patchRapport blokkeren.

2. **`StepDocumentatie` Groepenverdeling** — voert geen kabeltype-input meer (alleen mm²/A/mA). Snel toevoegen: extra inputveld. Bovendien ontbreekt het aansluiten van groepen op meterkast-checklist (cross-link).

3. **`OpleverRapportPDF` mist contactpersoon** van klant (alleen `klantNaam`). Toevoegen: e-mail + telefoon snapshot in "Algemene gegevens" zodat het PDF zelfstaande document is.

4. **`Verkooporders` rename** — sidebar/dashboard/klant-tabs hernoemd, maar:
   - `OpdrachtDetail.tsx` toont nog "Opdracht details" als titel
   - Breadcrumbs/navigatieback naar "/opdrachten" toont "Terug naar opdrachten"
   - `KlantDetail.tsx` heeft nog `QuickStat label="Opdrachten"` (regel 241) en `label: "Opdrachten"` (regel 381) niet hernoemd
   - `Dashboard` rolMessage `installateur: "Mijn Opdrachten"` niet hernoemd
   - Fix: alle UI-strings consistent naar **Verkooporders / Verkooporder**.

5. **`generateInstallatienummer` fallback gebruikt `Date.now().slice(-5)` → niet sequentieel, kan duplicates geven** als de RPC kortdurend faalt en daarna een echte 1ste reeks komt. Fix: bij RPC-fout een hard error tonen i.p.v. fallback.

6. **`InstallatieProductenCard` "Uit opdracht"-knop overschrijft zonder waarschuwing** bestaande regels. Fix: confirm-dialog of "Toevoegen"-modus i.p.v. vervangen.

7. **Nummerreeks-instellingen ontbreken voor Schouwen, Offertes en Tickets**, terwijl dezelfde RPC die wel ondersteunt. Toevoegen aan `REEKSEN`-array (handig en consistent).

### D. Type-/code-kwaliteit

- `OpdrachtSelector`-prop `klant_email` wordt geselecteerd maar `opdrachten`-kolom heet in DB ook zo — OK. ✅
- `OpleverDetail.tsx` regel 24 importeert `FileText` twee keer (`FileText` + `FileText as FileTextIcon`). Werkt, maar overbodig — schoonvegen.
- `InstallatieNieuw.tsx` gebruikt `any` in catch (regel 96) en `as unknown as never` cast. Vervang door `e instanceof Error ? e.message : String(e)`.
- `MonteurToewijsDialog.tsx` idem (regel 109).
- `Opdrachten.tsx` gebruikt `from("opdrachten" as any)` en `data as any[]`. Verwijder casts — types kennen `opdrachten`.
- `OpleverDetail.tsx` regels 61, 72, 95, 140 casten via `as any`/`as unknown as`. Kan nu weg sinds `klant_id` en `opdracht_id` op het type staan.

### E. Aanpak

Elke fix is kleinschalig (1–20 regels). Splitsing per bestand:

| Bestand | Fixes |
|---|---|
| `WizardShell.tsx` | A1, B1 (auto-scroll active chip) |
| `OpleverDetail.tsx` | A5, A9, B2, B5, lock-overlay (C1), type-cleanup (D) |
| `useOpleverAutosave.ts` | A3 (merge extra_velden vóór patch) |
| `KlantSelector.tsx` + `OpdrachtSelector.tsx` | A4, B10 (Popover-pattern), `partnerId`-guard |
| `OpleverChecklistItem.tsx` | B3 |
| `OpleverRapportPDF.tsx` | C3 (klant-contact) |
| `OpleverNieuw.tsx` | A6 |
| `InstallatieProductenEditor.tsx` | A7 (and-or fix), B4 |
| `InstallatieProductenCard.tsx` | C6 (confirm bij overschrijven) |
| `MonteurToewijsDialog.tsx` | B7, A5 cleanup, types (D) |
| `InstallatieNieuw.tsx` | B8, types (D) |
| `installatieApi.ts` | C5 (geen silent fallback) |
| `NummerreeksConfig.tsx` | B9, "Eerstvolgende nummer", C7 (Schouw/Offerte/Ticket) |
| `StepInstallatie.tsx` | B6 (NL-labels Opstelling) |
| `StepDocumentatie.tsx` | C2 (kabeltype-input) |
| `Opdrachten.tsx`, `OpdrachtDetail.tsx`, `KlantDetail.tsx`, `Dashboard.tsx` | C4 (Verkooporders consistent) + types (D) |

Geen datamodel-, RLS- of edge function-wijzigingen — alles is frontend en types/UX.

### Niet aangeraakt
- Bestaande opleveringondertekening-flow, klant-token, archief-bucket, signing edge function.
- Verkooporder business-logic (`installatie_gepland` etc.).
- Database-migraties (`extra_velden`, `opdracht_id`, `nummerreeks_config`) — alle aanwezig en correct.

### Bevestigingsvragen
Geen — alle issues zijn concreet en oplosbaar zonder verdere keuzes.

