

## Plan: WYSIWYG editor voor introductietekst

### Probleem

De introductietekst wordt opgeslagen als plain text. Enters, spaties en opmaak die de gebruiker invoert gaan verloren in de PDF-weergave.

### Oplossing

Tiptap (lichtgewicht WYSIWYG editor op basis van ProseMirror) toevoegen. De introductietekst wordt opgeslagen als HTML zodat formatting bewaard blijft.

### Wijzigingen

#### 1. Dependency toevoegen

```
@tiptap/react @tiptap/starter-kit @tiptap/extension-underline
```

#### 2. Nieuwe component: `src/components/shared/RichTextEditor.tsx`

Compacte Tiptap-editor met toolbar-knoppen voor: **Vet**, *Cursief*, Onderstreept, Opsomming, en Enter/alinea-ondersteuning. Styling past bij de bestaande rounded-xl design. Neemt `value` (HTML string) en `onChange` callback.

#### 3. `src/pages/OfferteNieuw.tsx`

- Vervang de `<Textarea>` (regel 584) door `<RichTextEditor>` 
- `introductieTekst` state bevat nu HTML i.p.v. plain text
- AI-gegenereerde tekst wordt omgezet naar HTML (newlines → `<br>`)
- Opslaan naar database blijft via `introductie_tekst` kolom (is al `text` type, werkt voor HTML)

#### 4. `src/components/offertes/templates/VoorbladTemplates.tsx`

- `renderIntro` aanpassen: als de tekst HTML-tags bevat (`<p>`, `<br>`, `<strong>` etc.), render via `dangerouslySetInnerHTML` met de juiste styling
- Fallback voor plain text (bestaande offertes) blijft werken

#### 5. `src/pages/OffertePDF.tsx`

- Dezelfde wijziging voor de intro-weergave in de editor-preview

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/shared/RichTextEditor.tsx` | Nieuw: Tiptap WYSIWYG wrapper component |
| `src/pages/OfferteNieuw.tsx` | Textarea → RichTextEditor, AI output naar HTML |
| `src/components/offertes/templates/VoorbladTemplates.tsx` | `renderIntro` HTML-aware maken |
| `src/pages/OffertePDF.tsx` | Intro rendering updaten voor HTML |

