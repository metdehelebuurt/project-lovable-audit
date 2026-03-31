

## Plan: PDF bestandsnaam instellen op klantnaam + offertenummer

### Probleem

Bij het opslaan/downloaden van de offerte-PDF krijgt het bestand een generieke naam (de pagina-titel). De gebruiker wil dat de bestandsnaam standaard de klantnaam en het offertenummer bevat, bijv. `Verhaar - OF240331-7145.pdf`.

### Oplossing

Wanneer de print-pagina (`OffertePDFPreview.tsx`) geladen wordt, moet `document.title` gezet worden op `{klant_naam} - {offertenummer}`. Browsers gebruiken `document.title` als standaard bestandsnaam bij "Opslaan als PDF" via het printdialoog.

Toevoegen van een `useEffect` die na het laden van de offerte-data `document.title` instelt:

```tsx
useEffect(() => {
  if (offerte) {
    const orig = document.title;
    document.title = `${offerte.klant_naam} - ${offerte.offertenummer}`;
    return () => { document.title = orig; };
  }
}, [offerte]);
```

### Bestand

| Bestand | Wijziging |
|---------|-----------|
| `src/components/OffertePDFPreview.tsx` | `useEffect` toevoegen die `document.title` zet op `{klant_naam} - {offertenummer}` |

