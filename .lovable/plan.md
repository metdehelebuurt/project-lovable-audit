# Plan — Meerdere serienummers per product

## Analyse: waar relevant
1. **`product_serienummers` tabel** — al multi-row per product mogelijk; UI vraagt om bulk-invoer.
2. **Opleverrapport `batterij_spec` / `omvormer_spec`** — JSONB met 1 `serienummer` string. Gat: stacked batterijen / multi-omvormer.
3. **`extra_velden.gateway_serienummer`** — ook maar 1 string.

## Wijzigingen
- Types: nieuw `serienummers?: string[]` op BatterijSpec/OmvormerSpec; `gateway_serienummers?: string[]` op ExtraVelden. Legacy enkel-veld blijft voor backwards-compat.
- Nieuwe component `SerienummerLijstInput` (lijst met +/− knoppen, Enter = toevoegen).
- `StepInstallatie.tsx` gebruikt deze voor batterij/omvormer/gateway.
- `OpleverRapportPDF.tsx` toont legacy + array gecombineerd.
- `SerienummerEditor` (installatie) krijgt "Bulk invoeren"-dialog (textarea, één SN per regel).

## Niet-doelen
- Geen DB-migratie.
- Geen retroactieve datamigratie.
