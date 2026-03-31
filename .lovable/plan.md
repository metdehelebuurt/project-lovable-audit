

## Plan: Newline-naar-HTML fallback toevoegen

### Probleem

De WYSIWYG editor slaat tekst op als HTML (`<p>` tags). Maar **oudere offertes** bevatten platte tekst met `\n` voor nieuwe regels. Wanneer die platte tekst via `dangerouslySetInnerHTML` of `{tekst}` wordt gerenderd, verdwijnen alle alinea's.

Drie plekken missen de fallback:

1. **`src/pages/OfferteDetail.tsx`** (regels 468, 481, 488) — gebruikt `dangerouslySetInnerHTML` maar geen `\n` → `<br/>` conversie voor platte tekst
2. **`src/pages/OffertePublic.tsx`** (regels 279, 328, 334) — gebruikt `{tekst}` in een `<p>` tag, geen HTML-rendering überhaupt
3. **`src/components/offertes/templates/VoorbladTemplates.tsx`** — heeft al `renderIntro` met HTML-detectie, maar de fallback-tak zet `\n` niet om naar `<br/>`

### Oplossing

Een gedeelde helperfunctie in `src/types/offerte.ts`:

```typescript
export const ensureHtml = (text: string): string => {
  if (!text) return "";
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  // Platte tekst: wrap elke regel in <p>
  return text.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
};
```

### Wijzigingen

| Bestand | Wijziging |
|---------|-----------|
| `src/types/offerte.ts` | `ensureHtml` helper toevoegen |
| `src/pages/OfferteDetail.tsx` | Alle 3 `dangerouslySetInnerHTML` wrappen met `ensureHtml()` |
| `src/pages/OffertePublic.tsx` | Regels 279, 328, 334: `<p>{tekst}</p>` → `<div dangerouslySetInnerHTML={{ __html: ensureHtml(tekst) }} />` met prose classes |
| `src/components/offertes/templates/VoorbladTemplates.tsx` | In `renderIntro` fallback-tak: `\n` → `<br/>` toevoegen |

