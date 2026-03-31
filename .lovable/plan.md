

## Plan: Alleen logo tonen in PDF page header (zonder bedrijfsnaam)

### Probleem

In de `PageHeader` component staat naast het logo ook `<span>{partner.naam}</span>`. Bij partners zoals "Smart Accu" verschijnt de bedrijfsnaam als tekst naast het logo, terwijl het logo zelf al de naam bevat. Dit ziet er dubbelop en onprofessioneel uit.

### Oplossing

Verwijder de `<span>` met `partner.naam` uit de PageHeader in **beide** bestanden. Het logo alleen is voldoende — als er geen logo is, wordt er niets getoond (wat correct is, want zonder logo hoort een partner er eerst een te uploaden).

### Wijzigingen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/OffertePDFPreview.tsx` (regel 261-264) | Verwijder `<span>{partner.naam}</span>`, toon alleen het logo |
| `src/pages/OffertePDF.tsx` (regel 445-448) | Idem |

Concreet wordt in beide bestanden:
```tsx
// Was:
<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
  {logoUrl && <img ... />}
  <span style={{ fontWeight: 700, fontSize: 16, color: sc }}>{partner.naam}</span>
</div>

// Wordt:
<div style={{ display: "flex", alignItems: "center" }}>
  {logoUrl && <img ... />}
</div>
```

