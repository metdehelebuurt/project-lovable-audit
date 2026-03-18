

## Plan: Digitale handtekening bij schouw-afronding

### Wat wordt gebouwd
Een nieuwe stap "Klant akkoord & Handtekening" in de schouw-uitvoerflow waar de consument op het scherm kan tekenen (zoals bij pakketbezorging) om akkoord te geven op de uitgevoerde schouw.

### Database wijziging
Twee kolommen toevoegen aan `schouwen`:
```sql
ALTER TABLE public.schouwen
  ADD COLUMN handtekening_data text,           -- base64 PNG van de handtekening
  ADD COLUMN handtekening_akkoord_op timestamptz; -- tijdstip van ondertekening
```

### Nieuw component: `SignaturePad.tsx`
- Canvas-gebaseerd tekenveld (HTML5 Canvas) — geen externe library nodig
- Touch + mouse support (werkt op tablet/telefoon)
- Knoppen: "Wissen" en visuele feedback dat er getekend is
- Exporteert de handtekening als base64 PNG string
- Compact, herbruikbaar component in `src/components/schouwen/SignaturePad.tsx`

### SchouwUitvoeren.tsx aanpassingen
- STEPS uitbreiden: `["Technische inspectie", "Foto's & Media", "Checklist", "Klant akkoord", "Samenvatting"]` (5 stappen)
- Nieuwe stap 3 "Klant akkoord":
  - Korte samenvatting van de schouw (categorie, adres, datum)
  - Tekst: "Hierbij verklaar ik akkoord te gaan met de uitgevoerde schouw"
  - SignaturePad component voor digitale handtekening
  - Naam-invoerveld van de ondertekenaar
- `saveMutation` uitbreiden met `handtekening_data` en `handtekening_akkoord_op`
- Validatie: handtekening verplicht voordat de schouw afgerond kan worden

### SchouwDetail.tsx aanpassingen
- Handtekening tonen als afbeelding (`<img src={base64}>`) wanneer aanwezig
- Datum/tijd van ondertekening weergeven

### Bestanden

| Bestand | Actie |
|---------|-------|
| Migratie | 2 kolommen toevoegen aan `schouwen` |
| `src/components/schouwen/SignaturePad.tsx` | **Nieuw** — Canvas tekenveld |
| `src/pages/SchouwUitvoeren.tsx` | Nieuwe stap + opslaan handtekening |
| `src/pages/SchouwDetail.tsx` | Handtekening weergeven |

