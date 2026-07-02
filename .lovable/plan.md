# Fix assemblage-flow: SN-koppeling, volledige naam en gesplitste inkooporders

Drie samenhangende problemen zichtbaar bij de eerste bundel-test:

1. **SN-dialog vindt geen producten** — bundel-componenten worden niet gekoppeld omdat de matcher alleen op omschrijving zoekt, en die staat op de opdrachtregel als kort "Sigenergy".
2. **Assemblage-naam wordt afgekapt tot "Sigenergy"** — in de inkooporder verschijnt niet de volle productnaam maar de (verkorte) omschrijving van de bronregel.
3. **Alle componenten belanden op één inkooporder** — ook als componenten bij verschillende leveranciers horen. Er moet gesplitst worden, met een bevestigingsmelding vooraf.

Onderzocht: `producten.heeft_serienummer` van de 3 relevante componenten staat correct op `true`; de bundel `f4660188-…` heeft alle 4 componenten. De opdrachtregel-omschrijving is `"Sigenergy"` (korte tekst) terwijl `producten.naam = "Sigenergy thuisbatterij met backup 9kWh 3-fase 10 KW"`. Leverancier-koppeling zit in `leverancier_artikelen` (`product_id → leverancier_id`, met `voorkeur` en `inkoopprijs`).

## Wijzigingen

### 1) SN-toewijzing zoekt op product_id (fix "Geen producten gevonden")

`src/hooks/logistiek/useSNToewijzing.ts` + `src/components/opdracht/SNToewijzingDialog.tsx` + `src/components/opdracht/OpdrachtVoorraadTab.tsx`:

- Regel-interface uitbreiden: `{ omschrijving, aantal, product_id? }`.
- In `useSNToewijzing`: eerst `product_id` gebruiken (direct in `prodList` opzoeken); alleen als die ontbreekt terugvallen op `matchProductOpRegel(omschrijving)`.
- Component-lookup blijft ongewijzigd — zodra de bundel gevonden is worden alle SN-plichtige componenten als target opgevoerd.

Resultaat: 3 componenten (Sigenstor EC 10.0 TP, Sigenstor BAT 10.0, Sigen Gateway HomePro TP) verschijnen automatisch als aparte SN-slots per verkooporder-regel.

### 2) Volledige productnaam op inkooporder-regels

`src/lib/inkoopFromOpdracht.ts`:

- Bij bundel-uitklappen: `omschrijving = component.naam` — al correct.
- Bij niet-uitklappen (bundel als één regel): `omschrijving = product.naam ?? bronregel.omschrijving`. Zo overrulet de volledige productnaam een verkorte offertetekst.
- Ook voor niet-bundel productregels: `omschrijving = product.naam ?? bronregel.omschrijving`.

### 3) Splitsen per leverancier met bevestigingsdialog

Nieuw: `src/lib/inkoopSplitPerLeverancier.ts`

- Input: array `OfferteRegel[]` (met `product_id`) + `partner_id`.
- Query `leverancier_artikelen` voor alle relevante product-ids; groepeer per `leverancier_id` (voorkeur eerst, anders eerste hit). Fallback `null` (= "Onbekend").
- Return: `Array<{ leverancier_id: string|null, leverancier_naam: string, regels: OfferteRegel[] }>`.

Nieuw component: `src/components/inkoop/InkoopSplitDialog.tsx`
- Toont per leveranciergroep: aantal regels + totale kostprijs + korte lijst.
- Regels zonder leverancier krijgen een gele waarschuwing "Wijs eerst een leverancier toe".
- Actie "Aanmaken": voor elke groep één inkooporder concept (`financiele_documenten.type = 'inkooporder'`, `regels = groep.regels`, `leverancier_id = groep.leverancier_id`, `opdracht_id` behouden) en toon toast met N documenten. Navigeer daarna naar de lijst of naar de eerste inkooporder.
- Actie "Toch samenvoegen (1 order)": maakt gewoon 1 inkooporder — huidig gedrag als escape hatch.
- Actie "Annuleren": sluit dialoog.

Aanpassing `src/pages/FactuurNieuw.tsx`:
- Wanneer `docType === 'inkooporder'` met `?opdracht=…`: na `prefillRegelsUitOpdracht(expand=true)`, direct de split-analyse draaien. Bij ≥2 leveranciergroepen → dialoog vooraf openen (voordat de gebruiker de nieuwe-inkooporder-pagina ziet). Bij 1 groep → huidig gedrag (regels invullen op de bestaande pagina) + `leverancier_id` alvast prefillen.
- Bij manuele wisseling van bundel-toggle: opnieuw analyseren en de dialoog aanbieden als er weer meerdere leveranciers ontstaan.

### 4) Kleine follow-ups

- In `OpdrachtVoorraadTab.tsx`: `regels` doorgeven mét `product_id` (nu wordt alleen `{ omschrijving, aantal }` doorgestuurd naar de SN-dialog).
- Toast na aanmaken split: "3 inkooporders aangemaakt: Koninklijke Oosterberg (4 regels), Onbekend (1 regel), …".

## Techniek (samenvatting)

```text
prefillRegelsUitOpdracht → OfferteRegel[]  (met product_id + volle naam)
        │
        ▼
splitPerLeverancier(regels, partnerId) → groepen[]
        │
   ├─ 1 groep  → FactuurNieuw vult regels + leverancier
   └─ ≥2 groepen → InkoopSplitDialog
                     ├─ Aanmaken   → N inkooporder-concepten
                     ├─ Samenvoegen→ 1 order (huidig gedrag)
                     └─ Annuleren
```

SN-dialog gebruikt `product_id` uit `opdracht.regels` en vindt zo altijd de bundel; alle SN-plichtige componenten (heeft_serienummer=true) verschijnen als aparte slots — inclusief modulaire varianten (omvormer, backup-box) uit de eerder toegevoegde `component_type`.

Geen schemawijzigingen nodig; alles op basis van bestaande tabellen (`producten`, `product_componenten`, `leverancier_artikelen`, `financiele_documenten`).
