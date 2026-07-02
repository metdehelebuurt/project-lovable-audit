## Doel
Bij producten met categorie **thuisbatterij** twee extra vinkjes toevoegen:
- `omvormer_modulair` (ja/nee)
- `heeft_backup_box` (ja/nee)

Als één van beide `true` is, moeten bij **opleverrapport** en **inkoop-ontvangst (binnenboeken)** de serienummers van **batterij**, **omvormer** en/of **backupbox** afzonderlijk kunnen worden ingevoerd (in plaats van één SN per productregel).

## Wijzigingen

### 1. Database (migratie)
- `producten`: kolommen `omvormer_modulair BOOLEAN DEFAULT false`, `heeft_backup_box BOOLEAN DEFAULT false`.
- `product_serienummers`: kolom `component_type TEXT` met check `in ('batterij','omvormer','backup_box')`, nullable (blijft leeg voor gewone SN's).

### 2. Producten UI
- `ProductInlineForm.tsx`: als `categorie === 'thuisbatterij'` twee `Switch`-velden tonen (`Omvormer is modulair` / `Heeft backup box`).
- Auto-set `heeft_serienummer = true` wanneer een van beide aan staat.
- Zichtbaar in productdetail.

### 3. Opleverrapport
- `src/components/oplever/types.ts`: bestaat al `batterij_spec.serienummers[]` en `omvormer_spec.serienummers[]`. Uitbreiden met `backup_box_spec: { merk?, type?, serienummers?: string[] }`.
- In de opleverwizard batterij-stap: als gekoppeld product `omvormer_modulair` → toon losse omvormer-SN-sectie; als `heeft_backup_box` → toon backup-box-SN-sectie. Anders alleen batterij-SN.
- `OpleverRapportPDF`: backup-box regel renderen wanneer aanwezig.

### 4. Inkoop-ontvangst (binnenboeken)
- `OntvangstDialog` / `SerienummerEditor`: bij regels waarvan het gekoppelde product `thuisbatterij` is én modulair/backup aan staat, per stuk 1–3 SN-velden tonen (batterij / omvormer / backup-box) i.p.v. één.
- Opslaan via `useUpsertSerienummer` met `component_type` gevuld; batterij-SN blijft primair op de productregel.

### 5. Installatie / MonteurView
- `SerienummerEditor` uitbreiden met component-type-selectie voor deze producten (zelfde logica als binnenboeken), zodat monteur onderweg de 2–3 SN's kan registreren.

## Technisch (kort)
- Alleen frontend-conditionele UI + één migratie + kleine uitbreiding van bestaande `product_serienummers` en oplever-types (backwards-compatible: bestaande velden blijven werken).
- Geen wijzigingen aan offerte/factuur PDFs nodig (serienummers zijn oplever/logistiek).
