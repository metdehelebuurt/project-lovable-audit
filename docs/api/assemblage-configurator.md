# Assemblage Configurator API

Publieke read-API voor samengestelde producten (thuisbatterij, zonnepanelen-set, …). Bedoeld voor gebruik op klant­websites en later voor embeddable widgets.

Endpoint: `POST https://<project>.functions.supabase.co/assemblage-config`
(GET met `?assemblage_id=<uuid>` werkt ook voor het ophalen zonder keuzes.)

CORS: `*`. Er is geen authenticatie nodig — alleen assemblages met `status='actief'` en `toon_op_website=true` worden vrijgegeven.

## Request body (POST)

```json
{
  "assemblage_id": "uuid",
  "template_attributen": { "fase": "1", "noodstroom": true, "incl_installatie": true },
  "keuzes": {
    "batterij_module": [{ "product_id": "uuid", "aantal": 2 }],
    "omvormer":        [{ "product_id": "uuid", "aantal": 1 }],
    "installatie":     [{ "product_id": "uuid", "aantal": 1 }]
  }
}
```

`template_attributen` overschrijft de opgeslagen defaults en wordt gebruikt om
`spec_filter`-placeholders (`{{template.<sleutel>}}`) te vervangen — bv. filter
op `fase = 1-fase` of `fase = 3-fase`.

## Response

```json
{
  "assemblage": {
    "id": "uuid",
    "naam": "Sigenergy batterij totaalpakket 1-fase",
    "afbeelding_url": "...",
    "website_pitch": "...",
    "website_omschrijving": "...",
    "btw_percentage": 21,
    "prijs_strategie": "som_componenten"
  },
  "template_attributen": { "fase": "1", "noodstroom": true },
  "slots": [
    { "sleutel": "batterij_module", "label": "Batterij-capaciteit",
      "slot_type": "quantity_step", "min_aantal": 1, "max_aantal": 6,
      "default_aantal": 1, "verplicht": true, "helptekst": "..." }
  ],
  "opties": {
    "batterij_module": [
      { "id": "uuid", "naam": "Sigenergy 8 kWh module",
        "prijs_excl_btw": "3200.00", "afbeelding_url": "...",
        "specs": { "capaciteit_kwh": "8", "fase": "1-fase" } }
    ]
  },
  "prijs": {
    "regels": [
      { "slot": "batterij_module", "product_id": "uuid", "aantal": 2,
        "prijs_excl_btw": 3200, "regel_totaal": 6400 }
    ],
    "subtotaal_excl_btw": 8400,
    "marge_opslag": 20,
    "totaal_excl_btw": 10080,
    "totaal_incl_btw": 12196.8,
    "btw_percentage": 21,
    "waarschuwingen": []
  }
}
```

`prijs` is `null` bij een GET-verzoek zonder keuzes en bij een lege `keuzes`
in een POST. Zodra er keuzes worden meegestuurd, valideert de server (min/max,
compatibiliteit met de slot-filters) en levert prijsberekening + eventuele
waarschuwingen.

## Prijsstrategieën

- `som_componenten` → `totaal = subtotaal * (1 + marge_opslag/100)`
- `vast`            → `totaal = vaste_grondprijs + subtotaal_keuzes`

Btw wordt altijd bovenop `totaal_excl_btw` gerekend op basis van
`assemblage.btw_percentage`.

## Foutcodes

| Status | Body                                | Betekenis                                          |
| ------ | ----------------------------------- | -------------------------------------------------- |
| 400    | `{ "error": "assemblage_id_required" }` | `assemblage_id` ontbreekt                         |
| 404    | `{ "error": "not_found" }`          | Assemblage bestaat niet of is niet publiek        |
| 500    | `{ "error": "..." }`                | Server-fout (details in Edge Function-logs)       |

## Voorbeeld: fetch vanaf klantwebsite

```ts
const res = await fetch("https://<project>.functions.supabase.co/assemblage-config", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    assemblage_id: "…",
    template_attributen: { fase: "1" },
    keuzes: { batterij_module: [{ product_id: "…", aantal: 2 }] },
  }),
});
const data = await res.json();
```