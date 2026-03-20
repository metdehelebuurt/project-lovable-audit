

## Plan: Fix logo upload + Snelstart schouw

### Probleem 1: Logo upload werkt niet zichtbaar
De upload-code (Instellingen.tsx:67-88) ziet er technisch correct uit, maar heeft twee problemen:
- **Cache-busting ontbreekt**: Na upload wordt dezelfde Supabase Storage URL gebruikt. De browser kan een gecachte versie tonen. Oplossing: voeg een `?t=timestamp` query parameter toe aan de publicUrl.
- **Geen visuele feedback bij "geen logo"**: Als `logoUrl` null is, wordt niets getoond — gebruiker ziet geen placeholder of upload-indicator. Voeg een default placeholder toe.
- **Bestandsnaam conflict**: De upload gebruikt altijd `logo.{ext}` — als je eerst een PNG uploadt en dan een JPG, blijft de oude PNG URL in de DB terwijl de nieuwe JPG een andere URL heeft. Oplossing: gebruik een unieke bestandsnaam met timestamp.
- **Error handling verbeteren**: Voeg expliciete console.log + toast toe bij elke stap zodat fouten zichtbaar worden.

### Probleem 2: Snelstart schouw ontbreekt
De Schouwen pagina heeft alleen "Schouw inplannen" (navigeert naar `/schouwen/nieuw`). Er is geen optie om direct een schouw te starten met categorie- en lead-selectie in een streamlined flow.

### Wijzigingen

#### 1) Fix logo upload
**Bestand:** `src/pages/Instellingen.tsx`

- Upload path: `{partner_id}/logo_{Date.now()}.{ext}` (uniek per upload)
- Na succesvolle upload: `setLogoUrl(publicUrl + "?t=" + Date.now())` voor cache-busting
- Toon placeholder icoon als `logoUrl` null is
- Voeg `try/catch` wrapper toe rond de hele upload flow
- Toon loading state op de afbeelding tijdens upload

#### 2) Snelstart schouw vanuit Schouwen pagina
**Bestand:** `src/pages/Schouwen.tsx`

Voeg naast "Schouw inplannen" een "Direct starten" knop toe:
- Opent een compact dialog met:
  - Categorie selectie (8 categorieën als klikbare kaarten/knoppen)
  - Lead/klant zoeken en selecteren (bestaande leads query)
- Na selectie: navigeert direct naar `/schouwen/nieuw?categorie={cat}&lead_id={id}&mode=direct` of creëert de schouw en navigeert naar `/schouwen/{id}/uitvoeren`
- De flow: selecteer categorie → selecteer lead → schouw wordt aangemaakt met status "gepland" → redirect naar uitvoer-wizard

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/Instellingen.tsx` | Fix logo upload: unieke bestandsnaam, cache-busting, placeholder, betere error handling |
| `src/pages/Schouwen.tsx` | Voeg "Direct starten" knop + dialog toe met categorie/lead selectie, creëert schouw en navigeert naar uitvoer-wizard |

