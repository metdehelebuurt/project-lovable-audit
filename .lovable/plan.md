
### Doel
`AI invullen` moet **betrouwbaar** technische velden vullen via web-search (Firecrawl) + AI kennisbank.

### Status: ✅ Opgelost

#### Wat er mis was
1. Firecrawl zoekqueries waren te lang/specifiek → 0 resultaten
2. Gemini tool-calling retourneerde altijd `corrected_specs: {}` ondanks gevonden data
3. Frontend routeerde naar PDF-parser als er een datasheet was geüpload

#### Wat er is gefixt
1. **Cascading search**: 4 kortere queries achter elkaar, stop zodra ≥2 resultaten
2. **JSON response** i.p.v. tool-calling: Gemini vult nu wél specs in
3. **Training data fallback**: als web niets vindt, gebruikt AI eigen kennis
4. **Frontend**: altijd web-pipeline, ongeacht PDF status
5. **Bron-feedback**: toast toont aantal specs + bron (web/AI kennisbank)

### Testresultaat
SolarEdge Home Battery LV 4.8kWh → **12 specs** ingevuld (capaciteit, gewicht, garantie, compatibele omvormers, etc.)
