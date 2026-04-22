

## Plan — "Opnieuw versturen" overal vindbaar maken

### Probleem
De knop "Opnieuw versturen" zit nu **alleen** op `/financieel/:id` (detailpagina) én alleen als `verzonden_op` gevuld is. In de praktijk:
- Je kijkt vaak naar facturen via de klantkaart of het factuuroverzicht — dáár ontbreekt de actie.
- Sommige verzonden facturen hebben `verzonden_op = NULL` (oude data) → knop blijft verborgen.
- De huidige conditie sluit `verlopen` facturen onnodig uit terwijl je die juist wil herinneren.

### Oplossing — knop op 3 plekken + ruimere conditie

**1. `FactuurDetail.tsx` — conditie verruimen**
Vervang `doc.verzonden_op && [...].includes(doc.type)` door:
```ts
const isVerstuurbaar = ["verkoopfactuur", "creditnota", "pakbon"].includes(doc.type);
const isAlVerzonden = ["verzonden", "verlopen", "betaald"].includes(doc.status) || !!doc.verzonden_op;
```
Knop "Opnieuw versturen" tonen wanneer `isVerstuurbaar && isAlVerzonden`. Knop "E-mail versturen" alleen bij `concept`.

**2. `FactuurBeheer.tsx` (overzicht onder Financieel) — rij-actie toevoegen**
In de bestaande actie-kolom een dropdown-item / icoon-knop "Opnieuw versturen" (envelop-icoon) bij elke rij waar de factuur al verzonden/verlopen is. Klik → opent dezelfde `FactuurEmailDialog` met `isResend={true}`.

**3. `KlantDetail.tsx` — actie in factuurlijst per klant**
In de tab/sectie waar facturen van een klant staan: per rij een kleine "Opnieuw versturen"-knop (envelop-icoon) zichtbaar zodra status `verzonden`/`verlopen`/`betaald` is. Hergebruikt `FactuurEmailDialog`.

**4. Gedeelde wrapper** — om dubbele dialog-state te vermijden:
Nieuw klein component `ResendFactuurButton.tsx` (variant: `icon` of `outline`) dat intern de `FactuurEmailDialog` met `isResend` rendert. Hergebruikt op alle 3 plekken zodat gedrag identiek is.

**5. PDF-bijlage bij hergebruik**
`FactuurEmailDialog` rendert nu de PDF via `document.querySelector(pdfElementSelector)`. In overzichtsschermen bestaat dat element niet → de dialog moet zelf de PDF ophalen. Aanpassing: als selector niets vindt **en** de factuur is al eerder verstuurd → de dialog probeert eerst de bestaande PDF in storage (`facturen/{partner_id}/factuur/{id}.pdf`) te downloaden en als bijlage te gebruiken; valt anders terug op "geen bijlage" met waarschuwing.

### Bestanden

| Bestand | Actie |
|---|---|
| `src/components/financieel/ResendFactuurButton.tsx` | nieuw — herbruikbare knop + dialog |
| `src/pages/FactuurDetail.tsx` | conditie verruimen, knop vervangen door `<ResendFactuurButton />` |
| `src/components/financieel/FactuurBeheer.tsx` | actie-kolom: `<ResendFactuurButton />` per rij |
| `src/pages/KlantDetail.tsx` | factuurlijst: per rij `<ResendFactuurButton />` |
| `src/components/financieel/FactuurEmailDialog.tsx` | fallback naar bestaande storage-PDF wanneer DOM-element ontbreekt |

### Niet in scope
- Bulk "herinnering naar alle openstaande" (apart vervolg).
- Automatische herinneringsmails op vervaldatum (cron) — apart project.

