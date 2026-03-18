
Doel: twee dingen tegelijk oplossen in de offertemodule.

1) Nieuw productveld: vrij invulbare “offertetekst” die automatisch meekomt op offertes  
2) Bugfix datasheet-flow: dialog blokkeert nu (geen acties zichtbaar / niet verder kunnen) en “Genereren” leidt naar een pagina waar je geen datasheet kunt maken

Aanpak in 4 stappen

1. Datasheet-blokkade direct oplossen (UX + flow)
- `src/components/offertes/DatasheetCheckDialog.tsx`
  - Statusmapping robuust maken:
    - reset bij `open` + `products` wijziging
    - fallback `status ?? "pending"` zodat actieknoppen altijd zichtbaar blijven
  - Acties per product altijd tonen zolang product niet definitief “uploaded/skipped” is
  - Extra knop “Hercontroleer” toevoegen: haalt actuele productstatus op uit database (`datasheet_type`) en zet items automatisch op “uploaded” als datasheet inmiddels bestaat
- `src/pages/OfferteNieuw.tsx`
  - `Genereren` niet meer naar een doodlopende preview-flow laten gaan
  - openen van datasheet-bewerkroute vanuit de dialog in nieuwe tab (offerteformulier blijft behouden)

2. Datasheet-route bruikbaar maken voor aanmaken/genereren
- `src/pages/ProductDatasheetPage.tsx`
  - pagina uitbreiden van alleen preview naar “bewerken + preview”:
    - upload fabrikant-PDF
    - AI-gegenereerde datasheet/specs toepassen
    - opslaan naar productrecord
  - bestaande print/preview behoudt
  - duidelijke actie “Opslaan” + “Terug naar offerte”
- hergebruik van bestaande `ProductDatasheetSection` zodat gedrag consistent blijft met Producten-module

3. Vrij invulbaar productveld voor offertes toevoegen
- Database migration:
  - kolom op `producten`: `offerte_tekst text null`
  - optionele backfill: bestaande waarde kopiëren uit `omschrijving` waar logisch (zodat direct bruikbare defaults bestaan)
  - geen extra RLS-policy nodig (bestaande productpolicies dekken dit)
- `src/pages/Producten.tsx`
  - nieuw textarea-veld in productformulier: “Tekst op offerte”
  - opnemen in create/update/openEdit state
  - opslaan in productrecord

4. Tekst op offertes laten terugkomen
- `src/pages/OfferteNieuw.tsx` (+ `src/pages/Offertes.tsx` voor edit-flow)
  - bij productselectie offerte-regel standaard vullen met:
    - normale omschrijving (productnaam/merk/model)
    - plus product-offertetekst als aanvullende regeltekst (snapshot in `regels` JSON), zodat oude offertes consistent blijven als product later wijzigt
  - regeltekst blijft handmatig aanpasbaar
- Rendering aanpassen op alle offerte-uitingen:
  - `src/components/OffertePDFPreview.tsx`
  - `src/pages/OffertePublic.tsx`
  - `src/pages/Offertes.tsx` (detailweergave)
  - `src/components/offertes/templates/PrijstabelTemplates.tsx`
  - extra producttekst tonen onder de regelomschrijving (professioneel subtekst-stijl)

Technische details
- Data-model:
  - `producten.offerte_tekst` = bronwaarde op productniveau
  - `offertes.regels[].offerte_tekst` = snapshot op offertemoment
- Waarom snapshot in regels:
  - offerte blijft juridisch/inhoudelijk stabiel, ook als product later wordt aangepast
- Datasheet-probleem root cause:
  - dialog-status kon in praktijk “undefined” renderen waardoor actieknoppen verdwenen
  - “Genereren” pad ging naar een read-only pagina
- Veiligheid:
  - geen versoepeling van toegangsregels nodig
  - alleen bestaande geauthenticeerde product/offerteflows worden uitgebreid

Bestanden (verwacht)
- Database:
  - `supabase/migrations/<nieuw>.sql`
- Frontend:
  - `src/components/offertes/DatasheetCheckDialog.tsx`
  - `src/pages/OfferteNieuw.tsx`
  - `src/pages/ProductDatasheetPage.tsx`
  - `src/pages/Producten.tsx`
  - `src/pages/Offertes.tsx`
  - `src/pages/OffertePublic.tsx`
  - `src/components/OffertePDFPreview.tsx`
  - `src/components/offertes/templates/PrijstabelTemplates.tsx`
  - (indien nodig) type-updates in lokale interfaces van `OfferteRegel`

Acceptatiecriteria (klaar =)
1. In Producten kan ik “Tekst op offerte” opslaan per product  
2. Bij productselectie in offerte wordt die tekst automatisch meegenomen  
3. Tekst is zichtbaar in PDF-preview, publieke offertelink en interne detailweergave  
4. Datasheet-dialog toont altijd bruikbare acties (Upload / Genereren / Overslaan)  
5. Na datasheet aanmaken kan ik hercontroleren en doorgaan met offerte zonder vastlopen  
