

## Plan: Alinea-opmaak correct weergeven

### Oorzaak

Er zijn twee problemen waardoor alinea's aan elkaar plakken:

1. **Tailwind Typography plugin niet geladen**: `@tailwindcss/typography` is als dependency geinstalleerd, maar **niet toegevoegd aan de plugins array** in `tailwind.config.ts`. Hierdoor doen `prose` classes niets — `<p>` tags krijgen geen margin en alinea's vloeien samen. Dit raakt de OfferteDetail pagina en het publieke portaal.

2. **PDF renderIntro onderdrukt margins**: In `VoorbladTemplates.tsx` wordt `margin: 0` doorgegeven als style, wat de standaard `<p>` margins overschrijft. Hierdoor plakken alinea's ook op de PDF aan elkaar.

### Wijzigingen

#### 1. `tailwind.config.ts` — Typography plugin activeren

Regel 103: `require("@tailwindcss/typography")` toevoegen aan de plugins array.

```typescript
plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
```

Dit zorgt ervoor dat overal waar `prose` classes worden gebruikt (OfferteDetail, OffertePublic), `<p>` tags automatisch correcte margin-spacing krijgen.

#### 2. `src/components/offertes/templates/VoorbladTemplates.tsx` — Paragraph spacing in PDF

De `renderIntro` functie aanpassen: wanneer HTML met `<p>` tags wordt gerenderd, een CSS-regel toevoegen die `<p>` tags een `margin-bottom` geeft. Dit kan via een wrapper-style:

```typescript
const renderIntro = (tekst: string, style: React.CSSProperties) => {
  const wrapStyle = { ...style, whiteSpace: "normal" as const };
  const html = isHtml(tekst) ? tekst : tekst.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
  // Inject spacing for <p> tags via CSS string replacement
  const spacedHtml = html.replace(/<p>/g, '<p style="margin-bottom:0.75em">');
  return <div style={wrapStyle} dangerouslySetInnerHTML={{ __html: spacedHtml }} />;
};
```

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `tailwind.config.ts` | Typography plugin toevoegen aan plugins array |
| `src/components/offertes/templates/VoorbladTemplates.tsx` | `renderIntro`: inline margin-bottom op `<p>` tags voor PDF-spacing |

