

## Plan: 6 feedbackpunten verwerken

---

### 1. Product bewerken lukt niet — foto blijft staan

**Probleem:** In `Producten.tsx` (regel 192-228) wordt `saveMutation` aangeroepen, maar de `afbeelding_url` wordt correct meegegeven via het destructured `data` object. Het probleem zit waarschijnlijk in de RLS policy: `producten` UPDATE vereist `partner_id = get_user_partner_id(auth.uid())`, maar catalogusproducten hebben `partner_id = null`. Partner users kunnen die producten dus niet updaten.

**Oplossing:**
- Catalogusproducten (partner_id = null) mogen niet direct bewerkt worden door partners. De edit-knop moet alleen verschijnen voor eigen producten of als superadmin.
- Alternativ: als een partner een catalogusproduct wil aanpassen, dupliceer het naar een partner-specifiek product.
- Zorg dat na een succesvolle save de `queryClient` correct geïnvalideerd wordt en het form sluit.

**Bestanden:** `src/pages/Producten.tsx`

---

### 2. Disclaimer bij AI-gegenereerde specificaties

**Oplossing:**
- **Inline disclaimer**: In `ProductDetail.tsx` bij het specificaties-tabblad, wanneer specs door AI zijn ingevuld, een gele disclaimerbanner tonen: "⚠ Deze specificaties zijn automatisch gegenereerd door AI en kunnen fouten bevatten. Controleer de gegevens handmatig. Aan deze specificaties kunnen geen rechten worden ontleend."
- **Pop-up na generatie**: Na succesvol AI-invullen (`handleAiVerify` en `handleGenerateDatasheet`), toon een AlertDialog met de waarschuwing dat specificaties handmatig gecontroleerd moeten worden, met een "Ik heb het begrepen" knop.
- **Op datasheets**: Kleine disclaimer onderaan de `ProductDatasheet` component.

**Bestanden:** `src/pages/ProductDetail.tsx`, `src/components/producten/ProductDatasheet.tsx`

---

### 3. PDF template uitlijning en adres in voetnoot

**Probleem:** `PageFooter` in `OffertePDF.tsx` (regel 442-446) toont `partner.adres` maar dat veld bevat mogelijk alleen de straatnaam zonder huisnummer. Het adresveld is één tekstfield, dus het hangt af van de invoer. De footer is nu:
```
partner.naam • partner.adres • postcode plaats
```

**Oplossing:**
- Footer verbeteren met volledige adresweergave. Voeg ook KVK/BTW toe indien beschikbaar.
- Controleer dat alle secties consistent uitgelinjd zijn (padding, marges).

**Bestanden:** `src/pages/OffertePDF.tsx`

---

### 4. "Opgesteld door" persoonlijker maken — adviseur naam

**Probleem:** Bij "Opgesteld door" (regel 623-627) staat nu `partner.naam`. De adviseur naam is beschikbaar via `adviseurNaam`.

**Oplossing:** Toon adviseur naam als primair, bedrijfsnaam als secundair:
```
Opgesteld door
Piet Jansen
Bedrijfsnaam
email@bedrijf.nl
```

**Bestanden:** `src/pages/OffertePDF.tsx`

---

### 5. Dynamische velden — garantievoorwaarden hard-coded op 2 jaar

**Probleem:** In `OfferteNieuw.tsx` (regel 89) staat de default waarde: `"Productgarantie conform fabrikant. Installatiegarantie: 2 jaar."`. Dit wordt correct opgeslagen in de offerte. In de PDF wordt `(offerte as any).garantie_voorwaarden` gebruikt (regel 413), dus dit zou de juiste waarde moeten tonen.

**Oplossing:**
- Controleer of de offerte record daadwerkelijk de garantie_voorwaarden bevat — mogelijk is het veld null bij oudere offertes. Als dat zo is, toon de default niet als fallback.
- Maak de default slimmer: baseer op de garantie_jaren van de geselecteerde producten (bijv. "Productgarantie: 25 jaar conform fabrikant. Installatiegarantie: 2 jaar.").
- In de PDF: zorg ervoor dat `garantie_voorwaarden` niet als type-cast `as any` wordt benaderd maar als typed field.

**Bestanden:** `src/pages/OfferteNieuw.tsx`, `src/pages/OffertePDF.tsx`

---

### 6. Extra logo-versie voor donkere achtergrond

**Oplossing:**
- **Database**: Voeg `logo_url_donker` kolom toe aan de `partners` tabel.
- **Instellingen**: In partner-instellingen een upload-optie voor het donkere logo.
- **PDF templates**: In `VoorbladTemplates.tsx` bij dark/gradient templates, gebruik `logo_url_donker` als beschikbaar, anders val terug op standaard logo.
- **OffertePDF.tsx**: Pass `logoUrlDark` door als extra prop.

**Bestanden:** SQL migratie, `src/pages/OffertePDF.tsx`, `src/components/offertes/templates/VoorbladTemplates.tsx`, `src/pages/Instellingen.tsx`

---

### Bestanden overzicht

| Bestand | Wijziging |
|---------|-----------|
| SQL migratie | `logo_url_donker` kolom op `partners` |
| `src/pages/Producten.tsx` | Fix edit-rechten voor catalogusproducten |
| `src/pages/ProductDetail.tsx` | AI-disclaimer pop-up + banner |
| `src/components/producten/ProductDatasheet.tsx` | Disclaimer footer |
| `src/pages/OffertePDF.tsx` | Footer adres, "Opgesteld door" adviseur, typed garantie velden, logo_url_donker support |
| `src/components/offertes/templates/VoorbladTemplates.tsx` | Dark logo prop + fallback |
| `src/pages/OfferteNieuw.tsx` | Slimmere garantie default op basis van producten |
| `src/pages/Instellingen.tsx` | Upload voor donker logo |

