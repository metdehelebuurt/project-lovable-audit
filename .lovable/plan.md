

## Grondige controle: Bevindingen en noodzakelijke fixes

Na een uitgebreide review van alle gebouwde features heb ik de volgende problemen gevonden:

---

### KRITIEK: Beveiligingsprobleem in RLS-policy

**Bestand:** `supabase/migrations/20260318121644_...sql` (lijn 18)

De RLS-policy voor anonieme toegang tot offertes bevat een tautologische conditie:
```sql
USING (share_token IS NOT NULL AND share_token = share_token)
```
`share_token = share_token` is altijd `true` als de kolom niet NULL is. Dit betekent dat **elke anonieme gebruiker alle offertes met een share_token kan lezen** — niet alleen de offerte waarvoor zij de link hebben. Dit is een ernstig datalek.

**Fix:** De policy moet verwijderd en vervangen worden. Aangezien RLS-policies geen runtime parameters van de client-query kunnen lezen, moet de publieke offerte-pagina via een edge function werken (zoals `offerte-accept` dat al doet), of de client-side query moet via de `supabase` client met de anon key werken — maar dan moet de policy correct zijn. De juiste aanpak is de policy te schrappen en de `OffertePublic.tsx` pagina de data te laten ophalen via een nieuwe edge function (bijv. `offerte-public-view`) die met de service role key werkt.

---

### PROBLEEM: OffertePDFPreview gebruikt template_config niet

De `OffertePDFPreview.tsx` slaat de `template_config` uit de offerte volledig over. In plaats daarvan leest het `partner.feature_flags_json.offerte_template` (lijn 119-121), wat een ander configuratiesysteem is (pagina aan/uit toggles, badge-teksten). De 5 template-varianten (VoorbladTemplates, ProductTemplates, etc.) die gebouwd zijn, worden nergens gerenderd — de PDF toont altijd hetzelfde hardcoded design.

**Fix:** `OffertePDFPreview.tsx` moet refactored worden om `offerte.template_config` uit te lezen en per sectie de juiste template-variant component te renderen uit de `templates/` directory.

---

### PROBLEEM: OffertePublic.tsx leest van `partner_branding` view

De publieke offerte-pagina (lijn 60-65) leest partner-branding via:
```ts
supabase.from("partner_branding").select("*").eq("id", o.partner_id)
```
`partner_branding` is een database **view** (niet een tabel), en heeft geen RLS-policies. Dit werkt mogelijk niet correct voor anonieme gebruikers. Bovendien is het afhankelijk van de kapotte RLS-policy hierboven om überhaupt de offerte op te halen.

**Fix:** Beide queries (offerte + partner branding) moeten via een edge function die met service role key werkt.

---

### PROBLEEM: Template thumbnails zijn placeholder wireframes

De `OfferteTemplateBuilder.tsx` toont geen echte template previews. In plaats daarvan toont het gekleurde vlakken met generieke lijntjes (lijn 77-88). De gebruiker kan dus niet echt zien hoe de templates eruitzien.

**Fix:** De thumbnails moeten mini-renders zijn van de daadwerkelijke template-componenten (met `transform: scale(0.2)` in een container), of er moeten statische preview-afbeeldingen worden gebruikt.

---

### PROBLEEM: DatasheetCheckDialog statuses resetten niet

De `DatasheetCheckDialog` initialiseert `statuses` in `useState(() => ...)` maar deze waarde wordt niet bijgewerkt wanneer de `products` prop verandert (bijv. bij een nieuwe offerte). Na het sluiten en heropenen met andere producten, kunnen stale statuses achterblijven.

**Fix:** Voeg een `useEffect` toe die de statuses reset wanneer `products` verandert, of gebruik `products` als key op de component.

---

### OVERZICHT: Wat werkt en wat niet

| Feature | Status | Probleem |
|---------|--------|----------|
| DB kolommen producten (datasheet_url/type) | Werkt | — |
| DB kolommen offertes (template_config, share_token, etc.) | Werkt | — |
| AI Verify Product Specs (edge function) | Werkt | — |
| AI Offerte Intro (edge function) | Werkt | — |
| Offerte Accept (edge function) | Werkt | — |
| ProductDatasheetSection (upload/genereer toggle) | Werkt | — |
| ProductDatasheet preview component | Werkt | — |
| DatasheetCheckDialog bij offerte aanmaken | Deels | Statuses resetten niet bij prop-wijziging |
| Template Builder UI | Deels | Thumbnails zijn placeholders, geen echte previews |
| Template varianten (5 bestanden) | Gebouwd maar ongebruikt | Niet gerenderd in PDF |
| OffertePDFPreview template integratie | Niet werkend | Leest verkeerde config, ignoreert template_config |
| Publieke offertelink (OffertePublic) | Beveiligingsprobleem | Tautologische RLS-policy lekt data |
| Share link generatie (Offertes.tsx) | Werkt | — |
| Deelbare link kopieer-dialog | Werkt | — |

---

### Implementatieplan (prioriteitsvolgorde)

1. **Fix RLS-policy + maak edge function `offerte-public-view`** — Verwijder de tautologische policy, maak een edge function die offerte + partner branding ophaalt met service role key. Update `OffertePublic.tsx` om deze function te gebruiken.

2. **Integreer template_config in OffertePDFPreview** — Lees `offerte.template_config` uit, importeer de 5 template-bestanden, render per sectie de juiste variant.

3. **Verbeter template thumbnails** — Gebruik mini-renders van de echte template-componenten in de builder.

4. **Fix DatasheetCheckDialog prop-sync** — Voeg `useEffect` toe of gebruik key-based remounting.

