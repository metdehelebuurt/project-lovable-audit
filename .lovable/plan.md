

## Plan: Aanhef-opmaak en USP-balk uitlijning in voorblad templates

### Probleem 1: Aanhef formatting

De `introTekst` wordt als één doorlopend blok getoond: "Beste heer Verhaar, Het was een genoegen...". De aanhef (alles t/m de eerste komma) moet op een eigen regel staan, gevolgd door een witregel, dan de rest van de zin.

**Oplossing**: In alle voorblad-templates waar `introTekst` gerenderd wordt, de tekst splitsen op het patroon `"Beste ... ,\n"`. Concreet: detecteer of de tekst begint met een aanhef (bijv. regex `/^(Beste\s[^,]+,)\s*/` of `/^(Geachte\s[^,]+,)\s*/`), en render de aanhef als apart `<p>` element met `marginBottom: 12`, gevolgd door de rest van de tekst.

Dit wordt als helper-functie geïmplementeerd zodat alle 5 templates het consistent gebruiken:

```typescript
const renderIntro = (tekst: string, style: React.CSSProperties) => {
  const match = tekst.match(/^((?:Beste|Geachte|Lieve|Dag)\s[^,]+,)\s*/i);
  if (match) {
    return (
      <>
        <p style={{ ...style, marginBottom: 8 }}>{match[1]}</p>
        <p style={style}>{tekst.slice(match[0].length)}</p>
      </>
    );
  }
  return <p style={style}>{tekst}</p>;
};
```

### Probleem 2: USP/telefoon-balk niet onderaan de pagina

In HeroDark (regel 82-110): het onderste contentblok gebruikt `flex: 1` maar de USP-balk (regel 104-109) zit binnen de padding van de parent. De `<div style={{ flex: 1 }} />` spacer (regel 102) duwt het naar beneden, maar de padding van de parent (`padding: "48px 56px"`) zorgt ervoor dat het niet volledig onderaan de pagina zit.

**Oplossing**: 
- Verwijder de padding-bottom van het onderste content-blok
- Maak de USP-balk een apart element buiten de padding-container, met eigen horizontale padding
- Geef de USP-balk een vaste positie onderaan met `marginTop: "auto"` en eigen padding (`padding: "18px 56px"`)

Dit geldt voor alle templates die badges/USPs tonen (HeroDark, HeroGradient).

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/offertes/templates/VoorbladTemplates.tsx` | (1) Helper `renderIntro` toevoegen die aanhef splitst; (2) alle 5 templates: vervang `<p>{introTekst}</p>` door `renderIntro()`; (3) HeroDark: USP-balk naar buiten padding verplaatsen met `marginTop: auto` en eigen padding voor correcte uitlijning |

