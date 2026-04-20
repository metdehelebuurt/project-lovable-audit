

# Plan: Bedrijfs-financiële gegevens, A4 uitlijning & PDF bestandsnaam

## Probleem

1. **Geen IBAN/bankgegevens veld** voor partners — IBAN wordt op facturen getoond uit `partner.iban` maar dat veld bestaat niet in de database. Daarom blijft "IBAN" leeg op alle PDF's.
2. **A4 PDF wordt afgeknipt rechts** in de preview (zie screenshot — "FACTUU…" in plaats van "FACTUUR"). De dialog scrollt horizontaal i.p.v. de PDF schaalt netjes binnen de viewport.
3. **PDF bestandsnaam** is generiek (browser default = pagina-titel). Gewenst: `<documentnummer> - <klantnaam>.pdf`.

## Oplossing

### 1. Database: IBAN + extra bank-gegevens toevoegen aan `partners`

Migratie toevoegt:
- `iban` (text)
- `iban_tnv` (text — tenaamstelling, valt terug op `naam`)
- `bic` (text, optioneel — voor internationale betalingen)

### 2. Instellingen → Bedrijfsgegevens uitbreiden

In `BedrijfsgegevensTab` (`src/pages/Instellingen.tsx`) een nieuwe sectie **"Financiële gegevens"** toevoegen met velden voor IBAN, tenaamstelling en BIC. Deze worden opgeslagen op `partners` en automatisch gebruikt op alle facturen, inkooporders en orderbevestigingen.

### 3. PDF A4 uitlijning fixen

Twee issues:
- **`FactuurDetail.tsx`**: dialog `max-w-[240mm]` met `overflow-y-auto` — geen horizontale ruimte. Wijzigen naar `max-w-[95vw] w-fit` met `overflow-auto`, en een **wrapper met `display: flex; justify-content: center`** rond `<FinancieelPDF />` zodat de A4 (210mm) altijd gecentreerd binnen de dialog past.
- **`FinancieelPDF.tsx`**: `box-sizing: border-box` is al gezet, maar de container heeft geen expliciete `margin: 0 auto`. Toevoegen + zorgen dat alle absolute footers binnen de 210mm blijven (header rechts "FACTUUR" letterspacing terugbrengen zodat het niet over de marge schiet).

### 4. PDF bestandsnaam = `<documentnummer> - <klantnaam>.pdf`

Browser print → PDF gebruikt `document.title`. Aanpassen vóór `window.print()`:

```ts
const handleDownload = () => {
  const klantNaam = pdfKlant?.bedrijfsnaam 
    || `${pdfKlant?.voornaam ?? ""} ${pdfKlant?.achternaam ?? ""}`.trim()
    || doc.leveranciers?.naam
    || "onbekend";
  const origTitle = document.title;
  document.title = `${doc.documentnummer} - ${klantNaam}`;
  window.print();
  setTimeout(() => { document.title = origTitle; }, 1000);
};
```

## Bestanden

| Bestand | Wijziging |
|---|---|
| `supabase/migrations/...` | `ALTER TABLE partners ADD COLUMN iban text, iban_tnv text, bic text` |
| `src/pages/Instellingen.tsx` | Sectie "Financiële gegevens" in `BedrijfsgegevensTab` |
| `src/pages/FactuurDetail.tsx` | Dialog sizing fix + `handleDownload` met dynamische titel; partner-query uitbreiden met `iban, iban_tnv, bic` |
| `src/components/financieel/FinancieelPDF.tsx` | Container centreren, header uitlijning controleren, `iban_tnv` gebruiken in betalingsblok |
| `src/components/OrderbevestigingPDF.tsx` | Idem partner IBAN-velden gebruiken |

### Geen wijziging in PDF print-stylesheet nodig
Het bestaande `@media print` gedrag blijft werken; alleen de preview-dialog wordt netter.

