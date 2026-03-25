

## Plan: Kanban view verbeteren — meer kolommen zichtbaar zonder scrollen

### Probleem

Er zijn **10 kanbankolommen** met `min-w-[260px]` en `minWidth: 2800px`. Op een 2011px scherm passen er maximaal 7, op een laptop (1440px) slechts 5. Horizontaal scrollen is onvermijdelijk en onhandig.

### Oplossing: twee aanpassingen

#### 1. Kolommen groeperen in fases (standaard)

Reduceer van 10 naar **5 groepen** die altijd zonder scrollen passen:

| Groep | Statussen | Kleur |
|-------|-----------|-------|
| Nieuw | `nieuw` | primary |
| Contact | `contact_geprobeerd`, `geen_gehoor`, `terugbellen`, `gesproken` | sky |
| Gekwalificeerd | `afspraak_gepland`, `gekwalificeerd` | emerald |
| Offerte | `offerte_verzonden` | amber |
| Afgerond | `klant`, `verloren` | green/red |

Binnen een gegroepeerde kolom wordt de substatus als kleurlabel op elke kaart getoond. Drag-and-drop opent een kleine dropdown om de exacte substatus te kiezen als de doelgroep meerdere statussen bevat.

#### 2. Compactere kaarten + responsive kolombreedtes

- Verwijder `min-w-[260px]` en `max-w-[320px]`, gebruik `flex-1` met `gap-3` zodat kolommen de beschikbare ruimte vullen.
- Kaarten compacter: verberg email/telefoon/plaats standaard, toon alleen naam + bedrijf + bron-badge. Hover toont extra info via tooltip.
- Verwijder de `minWidth` inline style die horizontale scroll forceert.

#### 3. Toggle gedetailleerd/compact

Voeg een kleine toggle toe (bijv. "Gegroepeerd / Uitgebreid") zodat gebruikers die alle 10 kolommen willen zien dat nog steeds kunnen, maar standaard de 5-kolom weergave krijgen.

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/Leads.tsx` | Kanban kolommen groeperen, responsive flex layout, compactere kaarten, toggle |

